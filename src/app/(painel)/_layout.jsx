import { View } from 'react-native'
import { Stack, usePathname } from 'expo-router'
import { SiteHeader } from '../../componentes/SiteHeader.jsx'
import { PrivateRoute } from '../../componentes/Guardas.jsx'
import { TUTORIAL_URL } from '../../config.js'
import { cores } from '../../tema.js'

const LINKS = [
  { to: '/inicio', label: 'Início' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/alarmes', label: 'Alarmes' },
  { to: '/calculadoras', label: 'Calculadoras' },
  { to: '/admin/adocoes', label: 'Adoção', match: (path) => path.startsWith('/admin') },
  // Abre o guia em PDF; as configurações ficam no menu da conta (a letra no canto).
  { url: TUTORIAL_URL, label: 'Tutorial' },
]

/** Painel da veterinária (todas as telas internas). */
export default function PanelLayout() {
  const pathname = usePathname()
  return (
    <PrivateRoute>
      <View style={{ flex: 1, backgroundColor: cores.cremeClaro }}>
        <SiteHeader links={LINKS} homePath="/inicio" showBack={pathname !== '/inicio'} backFallback="/inicio" search />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: cores.cremeClaro },
            animation: 'slide_from_right',
          }}
        />
      </View>
    </PrivateRoute>
  )
}
