import { Children, cloneElement, isValidElement, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

/**
 * Quantas colunas valem para a largura da tela, com as mesmas quebras do CSS do site.
 * quebras: { 1024: 2, 600: 1 } equivale a "@media (max-width: 1024px)" e "@media (max-width: 600px)".
 */
export function useColunas(colunas, quebras) {
  const { width } = useWindowDimensions()
  if (!quebras) return colunas
  const limite = Object.keys(quebras)
    .map(Number)
    .sort((a, b) => a - b)
    .find((l) => width <= l)
  return limite === undefined ? colunas : quebras[limite]
}

/** Mesmo teste de uma media query do site: true quando a tela tem até `maximo` px. */
export function useAte(maximo) {
  return useWindowDimensions().width <= maximo
}

const trilho = (t) =>
  typeof t === 'number' ? { flex: t, minWidth: 0 } : { flexGrow: 0, flexShrink: 1, flexBasis: t.max, minWidth: 0 }

const esticado = (filho) => {
  if (!isValidElement(filho)) return filho
  const { style } = filho.props
  const estilo = typeof style === 'function' ? (estado) => [style(estado), estilos.cheio] : [style, estilos.cheio]
  return cloneElement(filho, { style: estilo })
}

/**
 * Grade de colunas (grid do site). Os itens da mesma linha ficam com a mesma altura.
 *
 * colunas: número de colunas iguais, ou trilhos — número = fração (1fr) e { max } = minmax(0, Xpx).
 * quebras: colunas (ou trilhos) por largura máxima da tela, como nas media queries do site.
 * minimo: em vez de colunas fixas, cabe quantas colunas de pelo menos `minimo` px couberem
 *         (repeat(auto-fill, minmax(min(100%, Xpx), 1fr)) do site).
 * encaixar: com `minimo`, as colunas vazias somem e os itens dividem a largura (auto-fit).
 */
export function Grade({
  colunas = 1,
  quebras,
  minimo,
  encaixar = false,
  gap = 16,
  linhaGap = gap,
  esticar = true,
  style,
  children,
  ...resto
}) {
  const ativo = useColunas(colunas, quebras)
  const [largura, setLargura] = useState(0)
  const itens = Children.toArray(children)

  let trilhos = Array.isArray(ativo) ? ativo : Array.from({ length: Math.max(1, ativo) }, () => 1)
  if (minimo) {
    let n = largura ? Math.max(1, Math.floor((largura + gap) / (Math.min(minimo, largura) + gap))) : 1
    if (encaixar) n = Math.max(1, Math.min(n, itens.length))
    trilhos = Array.from({ length: n }, () => 1)
  }
  const medir = minimo ? (e) => setLargura(e.nativeEvent.layout.width) : undefined

  if (trilhos.length === 1) {
    return (
      <View {...resto} style={[{ gap: linhaGap }, style]} onLayout={medir}>
        {itens}
      </View>
    )
  }

  // Itens com span={2} (ou inteiro) ocupam a linha toda, como grid-column: 1 / -1 no site.
  const linhas = []
  let atual = []
  for (const item of itens) {
    if (isValidElement(item) && (item.props.span >= 2 || item.props.inteiro)) {
      if (atual.length) linhas.push(atual)
      linhas.push(item)
      atual = []
    } else {
      atual.push(item)
      if (atual.length === trilhos.length) {
        linhas.push(atual)
        atual = []
      }
    }
  }
  if (atual.length) linhas.push(atual)

  return (
    <View {...resto} style={[{ gap: linhaGap }, style]} onLayout={medir}>
      {linhas.map((linha, i) =>
        !Array.isArray(linha) ? (
          <View key={linha.key ?? i}>{linha}</View>
        ) : (
          <View key={i} style={[estilos.linha, { gap }]}>
            {trilhos.map((t, j) => (
              <View key={linha[j]?.key ?? `vazio-${j}`} style={trilho(t)}>
                {linha[j] && esticar ? esticado(linha[j]) : linha[j]}
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'stretch' },
  cheio: { flexGrow: 1 },
})
