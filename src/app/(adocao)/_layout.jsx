import { View } from 'react-native'
import { Stack, usePathname } from 'expo-router'
import { SiteHeader } from '../../componentes/SiteHeader.jsx'
import { cores } from '../../tema.js'

const LINKS = [
  { to: '/adocao', label: 'Adoção', match: (path) => path === '/adocao' || path.startsWith('/adocao/') },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/como-adotar', label: 'Como adotar' },
  { to: '/sobre', label: 'Sobre nós' },
]

/** Área pública de adoção: catálogo, detalhes, favoritos, como adotar e sobre nós. */
export default function AdocaoLayout() {
  const pathname = usePathname()
  return (
    <View style={{ flex: 1, backgroundColor: cores.cremeClaro }}>
      <SiteHeader links={LINKS} homePath="/" showBack={pathname !== '/adocao'} backFallback="/adocao" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.cremeClaro },
          animation: 'slide_from_right',
        }}
      />
    </View>
  )
}
