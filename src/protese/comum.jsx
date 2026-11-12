import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { photoSrc } from '../plataforma/imagens.js'
import { Texto } from '../componentes/Texto.jsx'
import { cores, sombras } from '../tema.js'

/** "Paciente: Rex" com a foto, no topo das telas de prótese (ProteseShared.module.css). */
export function PacienteChip({ pet, style }) {
  if (!pet) return null
  const foto = photoSrc(pet.foto)
  return (
    <View style={[estilos.paciente, style]}>
      {foto ? <Image source={{ uri: foto }} style={estilos.pacienteFoto} contentFit="cover" /> : null}
      <Texto peso={600} style={{ fontSize: 16 }}>
        Paciente: {pet.nome}
      </Texto>
    </View>
  )
}

/** Botões grandes das telas de prótese: primário (café) e secundário (contorno). */
export function BotaoProtese({ tipo = 'primario', onPress, disabled, children, style }) {
  const primario = tipo === 'primario'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        estilos.botao,
        primario ? [estilos.primario, sombras.botao] : estilos.secundario,
        pressed && { backgroundColor: primario ? cores.cafeHover : 'rgba(110, 77, 54, 0.08)' },
        disabled && { opacity: 0.65 },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Texto peso={600} style={{ color: primario ? cores.branco : cores.cafe, textAlign: 'center' }}>
          {children}
        </Texto>
      ) : (
        children
      )}
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  paciente: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.branco,
  },
  pacienteFoto: { width: 30, height: 30, borderRadius: 15 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  primario: { backgroundColor: cores.cafe },
  secundario: { borderWidth: 1.5, borderColor: cores.cafe },
})
