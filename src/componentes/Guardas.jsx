import { useEffect, useState } from 'react'
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native'
import { Redirect, usePathname } from 'expo-router'
import { useAuth } from '../web/hooks/useAuth.js'
import { HOME_PATH } from '../web/services/authService.js'
import logo from '../web/assets/images/logo-pawtinhas.webp'
import { cores } from '../tema.js'

/** Tela de carregamento: o logo pulsando (LoadingScreen do site). */
export function LoadingScreen() {
  const [escala] = useState(() => new Animated.Value(1))
  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 0.94,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(escala, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    )
    animacao.start()
    return () => animacao.stop()
  }, [escala])

  return (
    <View style={estilos.tela} accessibilityRole="progressbar" accessibilityLabel="Carregando…">
      <Animated.Image source={logo} style={[estilos.logo, { transform: [{ scale: escala }] }]} resizeMode="contain" />
    </View>
  )
}

/**
 * Exige a sessão da veterinária. A checagem aqui é só de interface:
 * a API valida o token e o papel em cada requisição.
 */
export function PrivateRoute({ children }) {
  const { status } = useAuth()
  const pathname = usePathname()
  if (status === 'carregando') return <LoadingScreen />
  if (status !== 'autenticado') return <Redirect href={{ pathname: '/login', params: { de: pathname } }} />
  return children
}

/** Telas de login e redefinição: quem já está logado vai direto para o painel. */
export function GuestRoute({ children }) {
  const { status } = useAuth()
  if (status === 'carregando') return <LoadingScreen />
  if (status === 'autenticado') return <Redirect href={HOME_PATH} />
  return children
}

const estilos = StyleSheet.create({
  tela: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.areia },
  logo: { width: 120, height: 157 },
})
