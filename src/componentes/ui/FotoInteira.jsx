import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { cores } from '../../tema.js'
import { Texto } from '../Texto.jsx'

/**
 * Foto que nunca corta o animal (FotoInteira do site): a imagem inteira (contain) sobre uma cópia
 * desfocada dela mesma, que preenche as sobras da moldura.
 */
export function FotoInteira({ uri, accessibilityLabel, style, children }) {
  return (
    <View style={[estilos.moldura, style]}>
      {uri ? (
        <>
          <Image source={{ uri }} style={estilos.fundo} contentFit="cover" blurRadius={28} transition={150} />
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            transition={150}
            accessibilityLabel={accessibilityLabel}
          />
        </>
      ) : (
        <Texto style={estilos.semFoto}>Sem foto</Texto>
      )}
      {children}
    </View>
  )
}

const estilos = StyleSheet.create({
  moldura: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fotoVazia,
  },
  fundo: { ...StyleSheet.absoluteFillObject, opacity: 0.85, transform: [{ scale: 1.15 }] },
  semFoto: { fontSize: 16, color: cores.taupe },
})
