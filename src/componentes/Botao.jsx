import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { cores, gradientes, sombras } from '../tema.js'
import { Texto } from './Texto.jsx'

/**
 * Botão principal das telas de acesso: pílula com o gradiente café (Button do site).
 * tone="ferrugem" fica disponível para destaques pontuais.
 */
export function Botao({
  children,
  tone = 'cafe',
  loading = false,
  loadingText,
  disabled,
  onPress,
  altura = 47,
  style,
}) {
  const inativo = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [estilos.envolve, sombras.botao, { opacity: inativo ? 0.75 : pressed ? 0.92 : 1 }, style]}
    >
      <LinearGradient
        colors={gradientes[tone] ?? gradientes.cafe}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[estilos.botao, { height: altura }]}
      >
        {loading && <ActivityIndicator size="small" color={cores.branco} />}
        <View style={estilos.conteudo}>
          {typeof children === 'string' || (loading && loadingText) ? (
            <Texto peso={600} style={estilos.texto}>
              {loading && loadingText ? loadingText : children}
            </Texto>
          ) : (
            children
          )}
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  envolve: { width: '100%', borderRadius: 999 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texto: { color: cores.branco, fontSize: 17 },
})
