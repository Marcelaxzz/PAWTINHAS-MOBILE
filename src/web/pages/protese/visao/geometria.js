// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Geometria da medição por foto. Fica fora do OpenCV de propósito: se a visão computacional
 * não carregar, a veterinária ainda marca os cantos do cartão à mão e a conta é a mesma.
 */

/** Cartão no padrão ISO/IEC 7810 ID-1 (bancário, crédito, plano de saúde): 85,60 × 53,98 mm. */
export const CARTAO_CM = { largura: 8.56, altura: 5.398 }
const PROPORCAO_CARTAO = CARTAO_CM.largura / CARTAO_CM.altura

export const distancia = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

/**
 * Ordena 4 pontos no sentido horário a partir do canto superior esquerdo e
 * gira a lista para que o primeiro lado seja um lado comprido do cartão.
 */
export function ordenarCantos(pontos) {
  const cx = pontos.reduce((s, p) => s + p.x, 0) / 4
  const cy = pontos.reduce((s, p) => s + p.y, 0) / 4
  const horario = [...pontos].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
  const inicio = horario.reduce((m, p, i) => (p.x + p.y < horario[m].x + horario[m].y ? i : m), 0)
  const q = [0, 1, 2, 3].map((i) => horario[(inicio + i) % 4])

  const ladosAB = distancia(q[0], q[1]) + distancia(q[2], q[3])
  const ladosBC = distancia(q[1], q[2]) + distancia(q[3], q[0])
  return ladosAB >= ladosBC ? q : [q[1], q[2], q[3], q[0]]
}

/** Resolve A·x = b (8×8) por eliminação de Gauss com pivô parcial. */
function resolver(A, b) {
  const n = b.length
  const m = A.map((linha, i) => [...linha, b[i]])
  for (let c = 0; c < n; c++) {
    let pivo = c
    for (let l = c + 1; l < n; l++) if (Math.abs(m[l][c]) > Math.abs(m[pivo][c])) pivo = l
    if (Math.abs(m[pivo][c]) < 1e-12) return null
    ;[m[c], m[pivo]] = [m[pivo], m[c]]
    for (let l = 0; l < n; l++) {
      if (l === c) continue
      const f = m[l][c] / m[c][c]
      for (let k = c; k <= n; k++) m[l][k] -= f * m[c][k]
    }
  }
  return m.map((linha, i) => linha[n] / linha[i])
}

/** Homografia que leva 4 pontos de origem nos 4 de destino (h33 = 1). */
export function homografia(origem, destino) {
  const A = []
  const b = []
  origem.forEach(({ x, y }, i) => {
    const { x: u, y: v } = destino[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  })
  const h = resolver(A, b)
  return h && [...h, 1]
}

export function aplicar(H, { x, y }) {
  const w = H[6] * x + H[7] * y + H[8]
  return { x: (H[0] * x + H[1] * y + H[2]) / w, y: (H[3] * x + H[4] * y + H[5]) / w }
}

/**
 * Escala a partir do cartão: a homografia leva a foto para o plano do cartão, em centímetros,
 * corrigindo a perspectiva. Vale para pontos no mesmo plano do cartão (encostado no membro).
 */
export function escalaPorCartao(cantos) {
  const q = ordenarCantos(cantos)
  const { largura: L, altura: A } = CARTAO_CM
  const H = homografia(q, [
    { x: 0, y: 0 },
    { x: L, y: 0 },
    { x: L, y: A },
    { x: 0, y: A },
  ])
  if (!H) return null

  const ladoMaior = (distancia(q[0], q[1]) + distancia(q[2], q[3])) / 2
  const ladoMenor = (distancia(q[1], q[2]) + distancia(q[3], q[0])) / 2
  // Lados opostos muito diferentes = foto tirada de lado; a correção funciona, mas vale avisar.
  const inclinacao = Math.max(
    distancia(q[0], q[1]) / distancia(q[2], q[3]),
    distancia(q[2], q[3]) / distancia(q[0], q[1]),
    distancia(q[1], q[2]) / distancia(q[3], q[0]),
    distancia(q[3], q[0]) / distancia(q[1], q[2]),
  )

  return {
    tipo: 'cartao',
    medir: (a, b) => distancia(aplicar(H, a), aplicar(H, b)),
    pxPorCm: ladoMaior / L,
    proporcao: ladoMaior / ladoMenor,
    inclinacao,
  }
}

/** Escala por régua ou fita na foto: dois pontos e a distância real entre eles. */
export function escalaPorRegua(a, b, cm) {
  const px = distancia(a, b)
  if (!(cm > 0) || px < 1) return null
  return { tipo: 'regua', medir: (p, q) => (distancia(p, q) / px) * cm, pxPorCm: px / cm }
}

/** Avisos sobre a qualidade da referência, em linguagem de consultório. */
export function avisosEscala(escala) {
  if (!escala) return []
  const avisos = []
  if (escala.pxPorCm < 12)
    avisos.push('A referência ficou pequena na foto. Aproxime a câmera para medir com mais precisão.')
  if (escala.tipo === 'cartao') {
    if (Math.abs(escala.proporcao - PROPORCAO_CARTAO) / PROPORCAO_CARTAO > 0.35)
      avisos.push('O contorno marcado não tem o formato de um cartão. Confira os quatro cantos.')
    if (escala.inclinacao > 1.25)
      avisos.push('A foto está bem inclinada. A perspectiva é corrigida, mas uma foto de frente é mais confiável.')
  }
  return avisos
}

/** Média, amplitude e quantidade de leituras de uma medida. */
export function resumo(valores) {
  const v = valores.filter((n) => Number.isFinite(n))
  if (v.length === 0) return null
  const media = v.reduce((s, n) => s + n, 0) / v.length
  const amplitude = Math.max(...v) - Math.min(...v)
  // Diferença acima de 0,5 cm ou 5% entre leituras pede mais uma medição.
  const instavel = v.length > 1 && amplitude > Math.max(0.5, media * 0.05)
  return { media, amplitude, n: v.length, instavel }
}
