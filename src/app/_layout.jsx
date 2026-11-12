import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, ToastProvider } from '../contexto/Provedores.jsx'
import { AlarmesDoCelular } from '../alarmes/AlarmesDoCelular.jsx'
import { FONTES, cores } from '../tema.js'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontesProntas, erroFontes] = useFonts(FONTES)

  useEffect(() => {
    if (fontesProntas || erroFontes) SplashScreen.hideAsync().catch(() => {})
  }, [fontesProntas, erroFontes])

  if (!fontesProntas && !erroFontes) return null

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <AlarmesDoCelular />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: cores.areia },
              animation: 'slide_from_right',
            }}
          />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
