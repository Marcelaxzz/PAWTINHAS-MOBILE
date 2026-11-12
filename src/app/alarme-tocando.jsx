import { useCallback, useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable, StyleSheet, Vibration, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { useKeepAwake } from 'expo-keep-awake'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ClockIcon, PawPanel } from '../web/components/Icons/Icons.jsx'
import { alarmeTocando } from '../alarmes/estado.js'
import { cores, gradientes, sombras } from '../tema.js'
import { Texto, Titulo } from '../componentes/Texto.jsx'

const SOM = require('../../assets/sons/alarme_pawtinhas.wav')
const VIBRACAO = [0, 700, 500, 700, 500]
/** Para sozinho depois de 5 minutos, se ninguém atender. */
const LIMITE_MS = 5 * 60_000

/** Alarme tocando: som em repetição, vibração e tela acesa até alguém parar. */
export default function AlarmeTocando() {
  const [alarme] = useState(() => alarmeTocando.ler())
  if (!alarme) return <Redirect href="/inicio" />
  return <Tocando alarme={alarme} />
}

function Tocando({ alarme }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [pulso] = useState(() => new Animated.Value(1))
  const [horaTexto] = useState(() => {
    const hora = new Date(alarme.quando || Date.now())
    return `${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`
  })
  useKeepAwake()

  const parar = useCallback(() => {
    alarmeTocando.encerrar()
    if (router.canGoBack()) router.back()
    else router.replace('/alarmes')
  }, [router])

  // Som em repetição (mesmo com o celular no silencioso), vibração e o selo pulsando.
  // Tudo para ao sair da tela: pelo botão, pelo voltar do sistema ou depois de 5 minutos.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(
      () => {},
    )
    const player = createAudioPlayer(SOM)
    player.loop = true
    player.volume = 1
    player.play()
    Vibration.vibrate(VIBRACAO, true)
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1.08,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    )
    animacao.start()
    const limite = setTimeout(parar, LIMITE_MS)
    return () => {
      clearTimeout(limite)
      animacao.stop()
      Vibration.cancel()
      player.remove()
    }
  }, [pulso, parar])

  return (
    <LinearGradient
      colors={gradientes.painel}
      locations={[0, 0.48, 1]}
      style={[estilos.tela, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={estilos.topo}>
        <Animated.View style={[estilos.selo, { transform: [{ scale: pulso }] }]}>
          <PawPanel width={64} height={69} color={cores.cafe} />
        </Animated.View>
        <View style={estilos.hora}>
          <ClockIcon size={20} color={cores.areia} />
          <Texto peso={700} style={estilos.horaTexto}>
            {horaTexto}
          </Texto>
        </View>
        <Titulo style={estilos.titulo} accessibilityLiveRegion="assertive">
          {(alarme.titulo ?? 'Alarme').replace(/^⏰\s*/, '')}
        </Titulo>
        {alarme.texto ? <Texto style={estilos.texto}>{alarme.texto}</Texto> : null}
      </View>

      <Pressable
        onPress={parar}
        accessibilityRole="button"
        accessibilityLabel="Parar alarme"
        style={({ pressed }) => [estilos.parar, sombras.card, pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <Texto peso={700} style={estilos.pararTexto}>
          Parar alarme
        </Texto>
      </Pressable>
    </LinearGradient>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  topo: { alignItems: 'center' },
  selo: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 66,
    backgroundColor: cores.creme,
  },
  hora: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32 },
  horaTexto: { fontSize: 25, color: cores.areia, fontVariant: ['tabular-nums'] },
  titulo: { marginTop: 12, fontSize: 41, lineHeight: 47, color: cores.branco, textAlign: 'center' },
  texto: { marginTop: 14, fontSize: 19, lineHeight: 29, color: cores.areia, textAlign: 'center' },
  parar: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    borderRadius: 999,
    backgroundColor: cores.creme,
  },
  pararTexto: { fontSize: 21, color: cores.cafeEscuro },
})
