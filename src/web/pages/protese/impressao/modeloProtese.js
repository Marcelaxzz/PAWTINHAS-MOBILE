// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Modelo paramétrico de prótese de membro para impressão 3D, a partir das medidas salvas na ficha.
 *
 * Peças (de baixo para cima, em milímetros, z = 0 no chão):
 *   base   cilindro com a largura da pata, apoio no chão;
 *   haste  cilindro que leva até a altura do coto;
 *   cone   transição a 45° da haste para o soquete (imprime de pé, sem suporte);
 *   soquete copo aberto em cima; o fundo interno fica na altura medida até o chão.
 *
 * É um ponto de partida para o fatiador (Cura, PrusaSlicer): folga, parede e profundidade
 * do soquete são ajustáveis, e o encaixe final é conferido no animal.
 */

/** Densidades das fichas técnicas dos fabricantes (g/cm³). */
export const MATERIAIS = {
  PLA: { densidade: 1.24, fonte: 'Prusament PLA, ficha técnica (ISO 1183)' },
  PETG: { densidade: 1.27, fonte: 'Prusament PETG, ficha técnica (ISO 1183)' },
  TPU: { densidade: 1.19, fonte: 'NinjaFlex TPU, valor citado em literatura (Yap et al., 2016)' },
}

export const PADRAO = {
  /** Espaço para espuma ou meia de proteção dentro do soquete. */
  folgaMm: 2,
  paredeMm: 3,
  baseMm: 8,
  /** Profundidade inicial do soquete: 1,2 × o diâmetro interno (ajuste conforme o coto). */
  profundidadeFator: 1.2,
}

const DIAMETRO_FILAMENTO_MM = 1.75
const SEGMENTOS = 72

/**
 * Calcula as dimensões (mm) e o volume (cm³). Lança Error com mensagem para a tela
 * quando as medidas não fecham uma peça imprimível.
 */
export function dimensoes({
  larguraEncaixe,
  alturaChao,
  larguraPata,
  folgaMm,
  paredeMm,
  profundidadeMm,
  baseMm = PADRAO.baseMm,
}) {
  if (!(larguraEncaixe > 0)) throw new Error('Falta a largura no ponto de encaixe. Meça de novo com as quatro medidas.')
  const ri = (larguraEncaixe * 10 + folgaMm) / 2
  const ro = ri + paredeMm
  const rp = Math.max(6, ro * 0.3)
  const rb = Math.max((larguraPata * 10) / 2, rp + 4)
  const zFundo = alturaChao * 10 - paredeMm // base do soquete
  const zCone = zFundo - (ro - rp) // 45°: sobe (ro - rp) enquanto abre (ro - rp)
  const profundidade = profundidadeMm ?? Math.round(ri * 2 * PADRAO.profundidadeFator)
  const comprimentoHaste = zCone - baseMm

  if (comprimentoHaste < 5) {
    throw new Error(
      'A altura até o chão é pequena para este diâmetro de encaixe: não sobra espaço para a haste. Confira as medidas.',
    )
  }

  const pi = Math.PI
  const volumeMm3 =
    pi * rb * rb * baseMm +
    pi * rp * rp * comprimentoHaste +
    (pi * (zFundo - zCone) * (rp * rp + rp * ro + ro * ro)) / 3 +
    pi * ro * ro * (profundidade + paredeMm) -
    pi * ri * ri * profundidade

  return {
    raioInterno: ri,
    raioExterno: ro,
    raioHaste: rp,
    raioBase: rb,
    alturaBase: baseMm,
    zCone,
    zFundo,
    zFundoInterno: alturaChao * 10,
    profundidade,
    alturaTotal: alturaChao * 10 + profundidade,
    volumeCm3: volumeMm3 / 1000,
  }
}

/** Massa (g) e comprimento de filamento de 1,75 mm (m) para a peça maciça; o fatiador refina pelo preenchimento. */
export function material(volumeCm3, tipo) {
  const { densidade, fonte } = MATERIAIS[tipo]
  const areaFilamentoCm2 = Math.PI * (DIAMETRO_FILAMENTO_MM / 20) ** 2
  return { massaG: volumeCm3 * densidade, filamentoM: volumeCm3 / areaFilamentoCm2 / 100, densidade, fonte }
}

// ---------- Malha (triângulos) ----------

function anel(r, z, n = SEGMENTOS) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return [r * Math.cos(a), r * Math.sin(a), z]
  })
}

/** Superfície lateral entre dois anéis; `paraFora` define o lado da normal. */
function lateral(baixo, alto, paraFora, tris) {
  const n = baixo.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    if (paraFora) {
      tris.push([baixo[i], baixo[j], alto[j]], [baixo[i], alto[j], alto[i]])
    } else {
      tris.push([baixo[i], alto[j], baixo[j]], [baixo[i], alto[i], alto[j]])
    }
  }
}

/** Disco; normal para cima ou para baixo. */
function disco(r, z, paraCima, tris) {
  const borda = anel(r, z)
  const centro = [0, 0, z]
  for (let i = 0; i < borda.length; i++) {
    const j = (i + 1) % borda.length
    tris.push(paraCima ? [centro, borda[i], borda[j]] : [centro, borda[j], borda[i]])
  }
}

/** Coroa circular (topo do soquete), normal para cima. */
function coroa(ri, ro, z, tris) {
  const dentro = anel(ri, z)
  const fora = anel(ro, z)
  for (let i = 0; i < dentro.length; i++) {
    const j = (i + 1) % dentro.length
    tris.push([dentro[i], fora[i], fora[j]], [dentro[i], fora[j], dentro[j]])
  }
}

/** Tronco de cone fechado (cilindro quando r0 = r1). */
function solido(r0, r1, z0, z1, tris) {
  lateral(anel(r0, z0), anel(r1, z1), true, tris)
  disco(r0, z0, false, tris)
  disco(r1, z1, true, tris)
}

/** Triângulos da prótese inteira. Peças sobrepostas em 0,5 mm: o fatiador une as cascas. */
export function malha(d) {
  const tris = []
  const sobra = 0.5
  solido(d.raioBase, d.raioBase, 0, d.alturaBase, tris)
  solido(d.raioHaste, d.raioHaste, d.alturaBase - sobra, d.zCone + sobra, tris)
  solido(d.raioHaste, d.raioExterno, d.zCone, d.zFundo, tris)

  // Soquete: copo com fundo de espessura (zFundoInterno - zFundo) e boca aberta em cima.
  const topo = d.zFundoInterno + d.profundidade
  lateral(anel(d.raioExterno, d.zFundo - sobra), anel(d.raioExterno, topo), true, tris)
  disco(d.raioExterno, d.zFundo - sobra, false, tris)
  coroa(d.raioInterno, d.raioExterno, topo, tris)
  lateral(anel(d.raioInterno, d.zFundoInterno), anel(d.raioInterno, topo), false, tris)
  disco(d.raioInterno, d.zFundoInterno, true, tris)
  return tris
}

/** STL binário (o formato que todo fatiador abre). */
export function stl(tris, nome = 'Pawtinhas protese') {
  const buffer = new ArrayBuffer(84 + tris.length * 50)
  const view = new DataView(buffer)
  const cabecalho = new TextEncoder().encode(nome.slice(0, 79))
  new Uint8Array(buffer, 0, 80).set(cabecalho)
  view.setUint32(80, tris.length, true)

  let p = 84
  for (const [a, b, c] of tris) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const len = Math.hypot(...n) || 1
    for (const valor of [n[0] / len, n[1] / len, n[2] / len, ...a, ...b, ...c]) {
      view.setFloat32(p, valor, true)
      p += 4
    }
    view.setUint16(p, 0, true)
    p += 2
  }
  return buffer
}
