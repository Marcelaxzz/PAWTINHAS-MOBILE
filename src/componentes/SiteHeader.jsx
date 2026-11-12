import { useState } from 'react'
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { usePathname, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../web/hooks/useAuth.js'
import { PillButton } from './ui/PillButton.jsx'
import {
  ChevronLeftIcon,
  CloseIcon,
  HeartIcon,
  HouseIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
} from '../web/components/Icons/Icons.jsx'
import logo from '../web/assets/images/logo-horizontal.webp'
import { cores, sombras, texto } from '../tema.js'
import { Texto } from './Texto.jsx'

export const ALTURA_HEADER = 68

/** Volta na pilha ou, se a tela foi aberta direto, para a página pai (BackButton do site). */
function useVoltar(fallback) {
  const router = useRouter()
  const pathname = usePathname()
  return () => {
    if (router.canGoBack()) router.back()
    else {
      const partes = pathname.split('/').filter(Boolean)
      router.replace(partes.length <= 1 ? fallback : `/${partes.slice(0, -1).join('/')}`)
    }
  }
}

export function BackButton({ fallback = '/' }) {
  const voltar = useVoltar(fallback)
  return (
    <Pressable
      onPress={voltar}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      style={({ pressed }) => [estilos.voltar, sombras.botao, pressed && { backgroundColor: cores.cafeHover }]}
    >
      <ChevronLeftIcon size={20} strokeWidth={2.6} color={cores.areia} />
    </Pressable>
  )
}

/**
 * Cabeçalho único do app (SiteHeader do site, no layout de celular): logo, voltar,
 * conta e o menu com as páginas da área (e a busca, no painel).
 * links: [{ to, label, match?(pathname) }]
 */
export function SiteHeader({ links, homePath = '/', showBack = false, backFallback = '/', search = false }) {
  const { status, user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const [navOpen, setNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [term, setTerm] = useState('')

  const ir = (rota) => {
    setNavOpen(false)
    setMenuOpen(false)
    router.push(rota)
  }

  const buscar = () => {
    const value = term.trim().slice(0, 80)
    if (!value) return
    setNavOpen(false)
    router.push(`/pacientes?busca=${encodeURIComponent(value)}`)
  }

  const sair = async () => {
    setMenuOpen(false)
    await logout()
    router.replace('/')
  }

  const ativo = (link) =>
    link.match ? link.match(pathname) : pathname === link.to || pathname.startsWith(`${link.to}/`)
  const inicial = (user?.name?.trim()?.[0] ?? 'P').toUpperCase()
  const topoPainel = insets.top + ALTURA_HEADER

  return (
    <View style={[estilos.cabecalho, { paddingTop: insets.top, height: topoPainel }]}>
      <View style={estilos.esquerda}>
        {showBack && <BackButton fallback={backFallback} />}
        <Pressable onPress={() => ir(homePath)} accessibilityRole="link" accessibilityLabel="Pawtinhas, página inicial">
          <Image source={logo} style={estilos.logo} contentFit="contain" />
        </Pressable>
      </View>

      <View style={estilos.direita}>
        {status === 'autenticado' ? (
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu da conta"
            style={estilos.avatar}
          >
            <Texto peso={700} style={estilos.avatarTexto}>
              {inicial}
            </Texto>
          </Pressable>
        ) : (
          status === 'anonimo' && (
            <PillButton to="/login" size="sm" style={{ minWidth: 96 }}>
              Entrar
            </PillButton>
          )
        )}
        <Pressable
          onPress={() => setNavOpen((aberto) => !aberto)}
          accessibilityRole="button"
          accessibilityLabel={navOpen ? 'Fechar menu' : 'Abrir menu'}
          accessibilityState={{ expanded: navOpen }}
          style={[estilos.hamburguer, navOpen && { backgroundColor: 'rgba(216, 161, 107, 0.18)' }]}
        >
          {navOpen ? <CloseIcon size={22} color={cores.cafe} /> : <MenuIcon size={22} color={cores.cafe} />}
        </Pressable>
      </View>

      {/* Menu das páginas: abre logo abaixo do cabeçalho, como no site. */}
      <Modal
        visible={navOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNavOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { top: topoPainel }]}
          onPress={() => setNavOpen(false)}
          accessibilityLabel="Fechar menu"
        />
        <View style={[estilos.nav, sombras.media, { top: topoPainel }]}>
          {links.map((link) => {
            const marcado = ativo(link)
            return (
              <Pressable
                key={link.to}
                onPress={() => ir(link.to)}
                accessibilityRole="link"
                accessibilityState={{ selected: marcado }}
                style={({ pressed }) => [estilos.link, (marcado || pressed) && estilos.linkAtivo]}
              >
                {marcado && <View style={estilos.marcador} />}
                <Texto peso={600} style={[estilos.linkTexto, marcado && { color: cores.cafeEscuro }]}>
                  {link.label}
                </Texto>
              </Pressable>
            )
          })}
          {search && (
            <View style={estilos.busca}>
              <SearchIcon size={16} color={cores.taupe} />
              <TextInput
                value={term}
                onChangeText={setTerm}
                onSubmitEditing={buscar}
                placeholder="Buscar pets, tutores..."
                placeholderTextColor={cores.taupe}
                maxLength={80}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Buscar pets e tutores"
                style={estilos.buscaEntrada}
              />
            </View>
          )}
        </View>
        {/* Cabeçalho continua clicável por cima do fundo (fechar no X). */}
        <View style={[estilos.cabecalhoFantasma, { height: topoPainel }]} pointerEvents="box-none">
          <Pressable
            onPress={() => setNavOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            style={[estilos.hamburguer, estilos.hamburguerFantasma, { top: insets.top + 12 }]}
          >
            <CloseIcon size={22} color={cores.cafe} />
          </Pressable>
        </View>
      </Modal>

      {/* Menu da conta */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setMenuOpen(false)}
          accessibilityLabel="Fechar menu da conta"
        />
        <View style={[estilos.menu, sombras.media, { top: topoPainel - 4 }]}>
          <View style={estilos.menuUsuario}>
            <Texto peso={700}>{user?.name}</Texto>
            <Texto style={estilos.menuEmail}>{user?.email}</Texto>
          </View>
          <ItemMenu icon={HouseIcon} onPress={() => ir('/inicio')}>
            Painel da clínica
          </ItemMenu>
          <ItemMenu icon={HeartIcon} onPress={() => ir('/adocao')}>
            Vitrine de adoção
          </ItemMenu>
          <ItemMenu icon={LogoutIcon} onPress={sair}>
            Sair
          </ItemMenu>
        </View>
      </Modal>
    </View>
  )
}

function ItemMenu({ icon: Icon, onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      style={({ pressed }) => [estilos.menuItem, pressed && { backgroundColor: 'rgba(216, 161, 107, 0.18)' }]}
    >
      <Icon size={16} color={cores.cafe} />
      <Texto peso={600} style={{ color: cores.cafe }}>
        {children}
      </Texto>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  cabecalho: {
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: cores.areia,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    ...sombras.suave,
  },
  esquerda: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: { width: 149, height: 36 },
  direita: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voltar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.cafe,
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: cores.cafe,
    borderRadius: 19,
    backgroundColor: cores.caramelo,
  },
  avatarTexto: { color: cores.cafeEscuro },
  hamburguer: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cabecalhoFantasma: { position: 'absolute', top: 0, left: 0, right: 0 },
  hamburguerFantasma: { position: 'absolute', right: 16, backgroundColor: 'rgba(216, 161, 107, 0.18)' },

  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: 4,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: cores.areia,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  link: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12 },
  linkAtivo: { backgroundColor: 'rgba(216, 161, 107, 0.22)' },
  marcador: { position: 'absolute', left: 6, width: 3, height: 18, borderRadius: 2, backgroundColor: cores.caramelo },
  linkTexto: { fontSize: 18, color: cores.taupe },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    marginTop: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  buscaEntrada: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 0,
    fontSize: 16,
    color: cores.cafeEscuro,
    ...texto(400),
  },

  menu: {
    position: 'absolute',
    right: 16,
    minWidth: 240,
    maxWidth: 320,
    padding: 8,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 16,
    backgroundColor: cores.creme,
  },
  menuUsuario: {
    gap: 2,
    marginBottom: 6,
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  menuEmail: { fontSize: 16, color: cores.taupe },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10 },
})
