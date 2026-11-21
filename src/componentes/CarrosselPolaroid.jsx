import { useEffect, useState } from 'react'
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { PawFilled } from '../web/components/Icons/Icons.jsx'
import { FOTOS_CAROL } from '../web/pages/adocao/Sobre/fotosCarol.js'
import { Titulo } from './Texto.jsx'
import { cores, sombras } from '../tema.js'

const INTERVALO_MS = 4000

/** Fotos da Carol numa moldura de polaroid marrom com patinhas (o mesmo do "Sobre nós" do site). */
export function CarrosselPolaroid() {
  const [atual, setAtual] = useState(0)
  const [semMovimento, setSemMovimento] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSemMovimento)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (semMovimento) return undefined
    const timer = setInterval(() => setAtual((i) => (i + 1) % FOTOS_CAROL.length), INTERVALO_MS)
    return () => clearInterval(timer)
  }, [semMovimento])

  const foto = FOTOS_CAROL[atual]

  return (
    <View style={estilos.area} accessibilityLabel="Fotos da Carol com os animais">
      <View style={[estilos.polaroid, sombras.media]}>
        <View style={estilos.fotoMoldura}>
          <Image
            source={foto.src}
            accessibilityLabel={foto.alt}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={semMovimento ? 0 : 800}
          />
        </View>
        <View style={estilos.rodape}>
          <View style={estilos.legenda}>
            <PawFilled size={13} fill={cores.caramelo} />
            <Titulo peso={800} style={estilos.legendaTexto}>
              Carol e seus pacientes
            </Titulo>
            <PawFilled size={13} fill={cores.caramelo} />
          </View>
          <View style={estilos.pontos}>
            {FOTOS_CAROL.map((item, i) => (
              <Pressable
                key={item.alt}
                onPress={() => setAtual(i)}
                accessibilityRole="button"
                accessibilityLabel={`Mostrar foto ${i + 1} de ${FOTOS_CAROL.length}`}
                accessibilityState={{ selected: i === atual }}
                hitSlop={8}
                style={[estilos.ponto, i === atual && estilos.pontoAtivo]}
              />
            ))}
          </View>
        </View>

        <View style={[estilos.pata, { top: -16, left: -14, transform: [{ rotate: '-24deg' }] }]} pointerEvents="none">
          <PawFilled size={40} fill={cores.caramelo} />
        </View>
        <View style={[estilos.pata, { top: '42%', right: -16, transform: [{ rotate: '18deg' }] }]} pointerEvents="none">
          <PawFilled size={30} fill={cores.caramelo} />
        </View>
        <View style={[estilos.pata, { bottom: 56, left: -12, transform: [{ rotate: '-8deg' }] }]} pointerEvents="none">
          <PawFilled size={26} fill={cores.caramelo} />
        </View>
      </View>
    </View>
  )
}

const estilos = StyleSheet.create({
  area: { paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center' },
  polaroid: {
    width: '100%',
    maxWidth: 440,
    paddingTop: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: cores.cafe,
    transform: [{ rotate: '-2deg' }],
  },
  fotoMoldura: { width: '100%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: cores.fotoVazia },
  rodape: { alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 14 },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendaTexto: { fontSize: 19, lineHeight: 24, color: cores.creme },
  pontos: { flexDirection: 'row', gap: 7 },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(251, 246, 235, 0.35)' },
  pontoAtivo: { width: 22, backgroundColor: cores.caramelo },
  pata: { position: 'absolute', zIndex: 1 },
})
