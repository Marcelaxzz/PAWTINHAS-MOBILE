import { Children, cloneElement, isValidElement } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cores } from '../../tema.js'
import { Texto } from '../Texto.jsx'

const VARIANTES = {
  solido: { fundo: cores.cafe, borda: 'transparent', texto: cores.branco, pressionado: cores.cafeHover },
  contorno: { fundo: 'transparent', borda: cores.cafe, texto: cores.cafe, pressionado: 'rgba(110, 77, 54, 0.08)' },
  caramelo: { fundo: cores.caramelo, borda: 'transparent', texto: cores.cafeEscuro, pressionado: cores.areia },
  sucesso: {
    fundo: 'rgba(111, 143, 98, 0.1)',
    borda: cores.salvia,
    texto: cores.sucesso,
    pressionado: 'rgba(111, 143, 98, 0.2)',
  },
  fantasma: { fundo: cores.branco, borda: cores.borda, texto: cores.cafeEscuro, pressionado: cores.creme },
  perigo: { fundo: cores.erroFundo, borda: 'transparent', texto: cores.erro, pressionado: cores.erroFundoForte },
}

const TAMANHOS = {
  sm: { minHeight: 36, paddingVertical: 7, paddingHorizontal: 18, fontSize: 15 },
  md: { minHeight: 42, paddingVertical: 10, paddingHorizontal: 24, fontSize: 16 },
  lg: { minHeight: 48, paddingVertical: 12, paddingHorizontal: 30, fontSize: 17 },
}

/**
 * Botão em pílula das telas internas (PillButton do site).
 * variant: solido | contorno | caramelo | sucesso | fantasma | perigo · size: sm | md | lg
 * Com `to` navega para a rota; com `href` abre o link externo.
 */
export function PillButton({
  variant = 'solido',
  size = 'md',
  to,
  href,
  replace = false,
  onPress,
  loading = false,
  disabled,
  style,
  children,
  accessibilityLabel,
}) {
  const router = useRouter()
  const v = VARIANTES[variant] ?? VARIANTES.solido
  const { fontSize, ...espaco } = TAMANHOS[size] ?? TAMANHOS.md
  const inativo = disabled || loading

  const acao = () => {
    if (to || href) onPress?.()
    if (to && replace) router.replace(to)
    else if (to) router.push(to)
    else if (href) Linking.openURL(href)
    else onPress?.()
  }

  // Texto solto vira <Texto>; ícones recebem a cor do botão (currentColor no site).
  const conteudo = Children.map(children, (filho) => {
    if (typeof filho === 'string' || typeof filho === 'number') {
      return (
        <Texto
          peso={600}
          style={{ fontSize, lineHeight: Math.round(fontSize * 1.25), color: v.texto, textAlign: 'center' }}
        >
          {filho}
        </Texto>
      )
    }
    return isValidElement(filho) && !filho.props.color ? cloneElement(filho, { color: v.texto }) : filho
  })

  return (
    <Pressable
      accessibilityRole={to || href ? 'link' : 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      onPress={acao}
      style={({ pressed }) => [
        estilos.botao,
        espaco,
        { backgroundColor: pressed ? v.pressionado : v.fundo, borderColor: v.borda },
        inativo && { opacity: 0.6 },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={v.texto} />}
      {conteudo}
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
  },
})
