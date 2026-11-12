// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Vista em perspectiva da prótese (sólido de revolução), desenhada em 2D com sombreamento.
 * Não depende de biblioteca 3D: a peça é simétrica em volta do eixo, então basta inclinar a
 * câmera. Cada círculo vira uma elipse com rx = r e ry = r · sen(inclinação), e as faixas são
 * pintadas de baixo para cima, para as de cima cobrirem as de baixo.
 *
 * Devolve só caminhos SVG ("d") com o tipo de preenchimento; o site e o app desenham cada um
 * com o próprio componente de SVG.
 */

export const INCLINACAO = { padrao: 24, minima: 8, maxima: 60 }

const MARGEM = 16

/** Elipse completa como caminho (dois arcos). */
const elipse = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`

/**
 * Lateral de um tronco de cone visto de cima: lados + metade da frente das elipses de baixo e de cima.
 * yBaixo > yAlto (o eixo y da tela cresce para baixo).
 */
function lateral(cx, yBaixo, rBaixo, yAlto, rAlto, seno) {
  const ryB = rBaixo * seno
  const ryA = rAlto * seno
  return (
    `M${cx - rAlto},${yAlto} L${cx - rBaixo},${yBaixo} ` +
    `A${rBaixo},${ryB} 0 0 0 ${cx + rBaixo},${yBaixo} ` +
    `L${cx + rAlto},${yAlto} ` +
    `A${rAlto},${ryA} 0 0 1 ${cx - rAlto},${yAlto} Z`
  )
}

/**
 * d: resultado de dimensoes() · inclinacao: graus acima do horizonte.
 * Retorna { largura, altura, formas: [{ tipo, d }] } em milímetros (1 unidade = 1 mm).
 * tipo: sombra | lateral | tampa | boca | fundo
 */
export function vista3d(d, inclinacao = INCLINACAO.padrao) {
  const graus = Math.min(INCLINACAO.maxima, Math.max(INCLINACAO.minima, inclinacao))
  const rad = (graus * Math.PI) / 180
  const seno = Math.sin(rad)
  const cosseno = Math.cos(rad)

  const topo = d.zFundoInterno + d.profundidade
  const raioMaximo = Math.max(d.raioBase, d.raioExterno)
  const largura = raioMaximo * 2 + MARGEM * 2
  const altura = topo * cosseno + raioMaximo * seno * 2 + MARGEM * 2
  const cx = largura / 2
  const chao = altura - MARGEM - raioMaximo * seno
  const y = (z) => chao - z * cosseno

  const formas = [{ tipo: 'sombra', d: elipse(cx, chao, raioMaximo * 1.25, raioMaximo * 1.25 * seno) }]
  const faixa = (z0, r0, z1, r1, comTampa) => {
    formas.push({ tipo: 'lateral', d: lateral(cx, y(z0), r0, y(z1), r1, seno) })
    if (comTampa) formas.push({ tipo: 'tampa', d: elipse(cx, y(z1), r1, r1 * seno) })
  }

  faixa(0, d.raioBase, d.alturaBase, d.raioBase, true)
  faixa(d.alturaBase, d.raioHaste, d.zCone, d.raioHaste, false)
  faixa(d.zCone, d.raioHaste, d.zFundo, d.raioExterno, false)
  faixa(d.zFundo, d.raioExterno, topo, d.raioExterno, true)

  // Boca do soquete: a abertura escura e, dentro dela, o fundo interno quando a câmera está alta.
  formas.push({ tipo: 'boca', d: elipse(cx, y(topo), d.raioInterno, d.raioInterno * seno) })
  const fundo = y(d.zFundoInterno)
  const bocaBaixo = y(topo) + d.raioInterno * seno
  if (fundo - d.raioInterno * seno < bocaBaixo) {
    formas.push({ tipo: 'fundo', d: elipse(cx, fundo, d.raioInterno, d.raioInterno * seno) })
  }

  return {
    largura,
    altura,
    formas,
    inclinacao: graus,
    recorteBoca: elipse(cx, y(topo), d.raioInterno, d.raioInterno * seno),
  }
}
