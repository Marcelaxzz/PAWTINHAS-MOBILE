import { useEffect, useState } from 'react'
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Vibration, View } from 'react-native'
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { useKeepAwake } from 'expo-keep-awake'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ClockIcon } from '../web/components/Icons/Icons.jsx'
import { ONDE_PAROU } from '../web/utils/alarmes.js'
import { Texto, Titulo } from '../componentes/Texto.jsx'
import { cores, sombras, fs } from '../tema.js'

const SOM = require('../../assets/sons/alarme_pawtinhas.wav')
const VIBRACAO = [0, 700, 500, 700, 500]

/**
 * Aviso do alarme tocando, no alto da tela, por cima de qualquer tela ou janela do app:
 * nome do alarme, hora e o botão "Desligar alarme". Com som, toca em repetição e vibra.
 */
export function AvisoAlarme({ toque, comSom, onDesligar }) {
  const insets = useSafeAreaInsets()
  const parado = Boolean(toque?.paradoOnde)

  return (
    <Modal visible={Boolean(toque)} transparent animationType="fade" statusBarTranslucent onRequestClose={onDesligar}>
      <View style={[estilos.fundo, { paddingTop: insets.top + 12 }]}>
        {toque && (
          <View style={[estilos.cartao, sombras.card]} accessibilityViewIsModal>
            {!parado && comSom && <Som />}
            <ManterTelaAcesa />
            <View style={estilos.topo}>
              <Sino parado={parado} />
              <View style={{ flex: 1 }}>
                <Texto peso={700} style={estilos.situacao} accessibilityLiveRegion="assertive">
                  {parado
                    ? `DESLIGADO ${(ONDE_PAROU[toque.paradoOnde] ?? 'em outro aparelho').toUpperCase()}`
                    : 'TOCANDO AGORA'}
                </Texto>
                <Titulo peso={800} style={estilos.titulo}>
                  Alarme das {toque.hora}
                </Titulo>
              </View>
            </View>

            <View style={estilos.lista}>
              {toque.lista.map((a) => (
                <View key={`${a.id}-${a.nome}`} style={estilos.item}>
                  <Texto peso={700} style={estilos.itemNome}>
                    {a.nome}
                  </Texto>
                  {a.detalhe ? <Texto style={estilos.itemDetalhe}>{a.detalhe}</Texto> : null}
                </View>
              ))}
            </View>

            {!parado && (
              <>
                <Pressable
                  onPress={onDesligar}
                  accessibilityRole="button"
                  accessibilityLabel="Desligar alarme"
                  style={({ pressed }) => [estilos.botao, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                  <Texto peso={700} style={estilos.botaoTexto}>
                    Desligar alarme
                  </Texto>
                </Pressable>
                <Texto style={estilos.nota}>Desliga também no painel e na caixinha.</Texto>
              </>
            )}
          </View>
        )}
      </View>
    </Modal>
  )
}

function ManterTelaAcesa() {
  useKeepAwake()
  return null
}

/** Som em repetição (mesmo no silencioso) e vibração enquanto o aviso estiver na tela. */
function Som() {
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(
      () => {},
    )
    const player = createAudioPlayer(SOM)
    player.loop = true
    player.volume = 1
    player.play()
    Vibration.vibrate(VIBRACAO, true)
    return () => {
      Vibration.cancel()
      player.remove()
    }
  }, [])
  return null
}

function Sino({ parado }) {
  const [giro] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (parado) return undefined
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(giro, {
          toValue: 1,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(giro, {
          toValue: -1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(giro, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    )
    animacao.start()
    return () => animacao.stop()
  }, [giro, parado])
  const rotate = giro.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] })
  return (
    <Animated.View
      style={[estilos.sino, parado && { backgroundColor: cores.areiaFixa }, { transform: [{ rotate }] }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <ClockIcon size={20} color={cores.cafeEscuroFundo} />
    </Animated.View>
  )
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, paddingHorizontal: 14, backgroundColor: 'rgba(54, 36, 26, 0.22)' },
  cartao: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    gap: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: cores.cafeEscuroFundo,
  },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sino: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.caramelo,
  },
  situacao: { fontSize: fs(12), letterSpacing: 1.6, color: cores.caramelo },
  titulo: { marginTop: 2, fontSize: fs(22), lineHeight: fs(27), color: cores.cremeFixo },
  lista: { gap: 8 },
  item: {
    gap: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 246, 235, 0.08)',
  },
  itemNome: { fontSize: fs(16), color: cores.cremeFixo },
  itemDetalhe: { fontSize: fs(14), color: cores.areiaFixa },
  botao: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: cores.cremeFixo,
  },
  botaoTexto: { fontSize: fs(17), color: cores.cafeEscuroFundo },
  nota: { marginTop: -6, fontSize: fs(12), textAlign: 'center', color: cores.areiaFixa },
})
