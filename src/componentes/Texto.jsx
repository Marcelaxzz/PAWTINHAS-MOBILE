import { StyleSheet, Text } from 'react-native'
import { cores, serifa, tamanho, texto } from '../tema.js'

/**
 * Texto do app: Lexend, café-escuro, 15px, como o corpo do site.
 * peso: 400 | 500 | 600 | 700 | 800
 */
export function Texto({ peso = 400, style, children, ...props }) {
  return (
    <Text style={[estilos.base, texto(peso), style]} {...props}>
      {children}
    </Text>
  )
}

/** Títulos em Fraunces (h1/h2 do site). */
export function Titulo({ peso = 900, style, children, ...props }) {
  return (
    <Text accessibilityRole="header" style={[estilos.titulo, serifa(peso), style]} {...props}>
      {children}
    </Text>
  )
}

/** Trecho em destaque dentro de um Texto (<strong> do site). */
export function Forte({ peso = 700, style, children }) {
  return <Text style={[texto(peso), { color: cores.cafeEscuro }, style]}>{children}</Text>
}

const estilos = StyleSheet.create({
  base: {
    color: cores.cafeEscuro,
    fontSize: tamanho.base,
    lineHeight: Math.round(tamanho.base * 1.55),
  },
  titulo: {
    color: cores.cafeEscuro,
    fontSize: tamanho.tituloLg,
    lineHeight: Math.round(tamanho.tituloLg * 1.25),
  },
})
