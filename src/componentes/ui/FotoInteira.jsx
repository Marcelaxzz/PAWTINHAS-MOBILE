import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { cores, fs } from '../../tema.js'
import { Texto } from '../Texto.jsx'
import { PawFilled } from '../../web/components/Icons/Icons.jsx'

/**
 * Foto que nunca corta o animal (FotoInteira do site): a imagem inteira (contain) sobre uma cópia
 * desfocada dela mesma, que preenche as sobras da moldura.
 */
export function FotoInteira({ uri, accessibilityLabel, style, children }) {
  const [falhou, setFalhou] = useState(null)
  return (
    <View style={[estilos.moldura, style]}>
      {uri && falhou !== uri ? (
        <>
          <Image source={{ uri }} style={estilos.fundo} contentFit="cover" blurRadius={28} transition={150} />
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            transition={150}
            accessibilityLabel={accessibilityLabel}
            onError={() => setFalhou(uri)}
          />
        </>
      ) : (
        <View style={estilos.vazio}>
          <PawFilled size={40} color={cores.caramelo} style={{ opacity: 0.6 }} />
          <Texto style={estilos.semFoto}>Sem foto</Texto>
        </View>
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
  vazio: { alignItems: 'center', gap: 8 },
  semFoto: { fontSize: fs(16), color: cores.taupe },
})
