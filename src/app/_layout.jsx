import { Fragment, useEffect, useState } from 'react'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, ToastProvider } from '../contexto/Provedores.jsx'
import { AlarmesDoCelular } from '../alarmes/AlarmesDoCelular.jsx'
import { FONTES, cores, temaAtual, trocarTema } from '../tema.js'
import { BotaoTema } from '../componentes/BotaoTema.jsx'
import { CamadaConfete } from '../componentes/Confete.jsx'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontesProntas, erroFontes] = useFonts(FONTES)
  const [tema, setTema] = useState(temaAtual)
  const caminho = usePathname()
  const router = useRouter()

  // Troca as cores e redesenha as telas na hora, voltando para a mesma tela.
  const alternarTema = () => {
    const onde = caminho
    setTema(trocarTema())
    setTimeout(() => router.replace(onde), 0)
  }

  useEffect(() => {
    if (fontesProntas || erroFontes) SplashScreen.hideAsync().catch(() => {})
  }, [fontesProntas, erroFontes])

  if (!fontesProntas && !erroFontes) return null

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
          <Fragment key={tema}>
            <AlarmesDoCelular />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: cores.areia },
                animation: 'slide_from_right',
              }}
            />
          </Fragment>
          <BotaoTema escuro={tema === 'escuro'} onTrocar={alternarTema} />
          <CamadaConfete />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
