import { forwardRef, useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PageHeading } from './ui/Basicos.jsx'
import { cores, gradientes, MARGEM, sombras } from '../tema.js'
import { Texto } from './Texto.jsx'

/**
 * Estrutura padrão das telas internas (Page do site): título centralizado, subtítulo,
 * abas da seção, ações e conteúdo, numa página que rola.
 * tabs: [{ to, label }] · onRefresh: puxar para atualizar · footer: ilustração no fim da página
 * width: padrao (1200px) | largo (1280px), a largura máxima do conteúdo em tablets, como no site
 */
const LARGURAS = { padrao: 1200, largo: 1280 }

export const Page = forwardRef(function Page(
  {
    title,
    subtitle,
    children,
    actions,
    tabs,
    decor,
    footer,
    onCorpoLayout,
    scrollEnabled = true,
    onRefresh,
    refreshing = false,
    contentStyle,
    width = 'padrao',
  },
  ref,
) {
  const insets = useSafeAreaInsets()
  // Posição do corpo dentro da rolagem (para rolar até uma seção): conteúdo + corpo.
  const posicao = useRef({ conteudo: 0, corpo: 0 })
  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={ref}
        style={estilos.tela}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[estilos.pagina, { paddingBottom: footer ? 0 : 56 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={cores.cafe}
              colors={[cores.cafe]}
            />
          ) : undefined
        }
      >
        {decor}
        <View
          style={[estilos.conteudo, { maxWidth: LARGURAS[width] ?? LARGURAS.padrao }]}
          onLayout={(e) => {
            posicao.current.conteudo = e.nativeEvent.layout.y
            onCorpoLayout?.(posicao.current.conteudo + posicao.current.corpo)
          }}
        >
          <PageHeading title={title} subtitle={subtitle} />
          {tabs && <Abas tabs={tabs} titulo={title} />}
          {actions ? <View style={estilos.acoes}>{actions}</View> : null}
          <View
            style={[estilos.corpo, contentStyle]}
            onLayout={(e) => {
              posicao.current.corpo = e.nativeEvent.layout.y
              onCorpoLayout?.(posicao.current.conteudo + posicao.current.corpo)
            }}
          >
            {children}
          </View>
        </View>
        {/* Ilustração colada no fim da página (o collie, o pug...), como no site. */}
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  )
})

/**
 * Abas da seção (pílula com a aba atual em café). Numa linha só: quando não cabem, rolam para
 * o lado e a aba atual vem para o meio, como no site em telas de celular.
 */
export function Abas({ tabs, titulo }) {
  const pathname = usePathname()
  const router = useRouter()
  const rolagem = useRef(null)
  const [medidas, setMedidas] = useState({ largura: 0, ativa: null })

  useEffect(() => {
    const { largura, ativa } = medidas
    if (!largura || !ativa) return
    rolagem.current?.scrollTo({ x: Math.max(0, ativa.x - (largura - ativa.width) / 2), animated: false })
  }, [medidas])

  return (
    <View
      style={[estilos.abas, sombras.elevada]}
      accessibilityRole="tablist"
      accessibilityLabel={titulo ? `Seções de ${titulo}` : undefined}
    >
      <ScrollView
        ref={rolagem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.abasLinha}
        onLayout={(e) => {
          const largura = e.nativeEvent.layout.width
          setMedidas((m) => (m.largura === largura ? m : { ...m, largura }))
        }}
      >
        {tabs.map((tab) => {
          const caminho = tab.to.split(/[?#]/)[0]
          const ativa = pathname === caminho
          return (
            <Pressable
              key={tab.to}
              onPress={() => !ativa && router.replace(tab.to)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              style={estilos.abaToque}
              onLayout={
                ativa
                  ? (e) => {
                      const { x, width } = e.nativeEvent.layout
                      setMedidas((m) =>
                        m.ativa?.x === x && m.ativa?.width === width ? m : { ...m, ativa: { x, width } },
                      )
                    }
                  : undefined
              }
            >
              {ativa ? (
                <LinearGradient
                  colors={gradientes.cafe}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[estilos.aba, sombras.botao]}
                >
                  <Texto peso={600} style={[estilos.abaTexto, { color: cores.branco }]}>
                    {tab.label}
                  </Texto>
                </LinearGradient>
              ) : (
                <View style={estilos.aba}>
                  <Texto peso={600} style={estilos.abaTexto}>
                    {tab.label}
                  </Texto>
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cremeClaro },
  pagina: { paddingTop: 28, paddingHorizontal: MARGEM },
  abas: {
    alignSelf: 'center',
    maxWidth: '100%',
    marginTop: 24,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.superficie,
    overflow: 'hidden',
  },
  abasLinha: { flexGrow: 1, justifyContent: 'center', gap: 6, padding: 5 },
  abaToque: { borderRadius: 999 },
  aba: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999 },
  abaTexto: { fontSize: 16, lineHeight: 20, color: cores.taupe },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 22 },
  conteudo: { width: '100%', alignSelf: 'center' },
  corpo: { gap: 16, marginTop: 26 },
})
