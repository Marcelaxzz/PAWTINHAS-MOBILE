import { forwardRef, useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PageHeading } from './ui/Basicos.jsx'
import { cores, gradientes, MARGEM, sombras, fs } from '../tema.js'
import { Texto } from './Texto.jsx'
import { guardarContagem, lerContagem } from '../web/services/contagens.js'

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
          {Boolean(tabs) && <Abas tabs={tabs} titulo={title} />}
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
 * Abas da seção (pílula com a aba atual em café). Ficam numa linha centralizada e, quando não cabem
 * (celular estreito, letra grande), quebram para a linha de baixo. Sem ScrollView horizontal: no
 * Android ele cresce até ocupar a tela inteira e escondia o conteúdo.
 */
export function Abas({ tabs, titulo }) {
  const pathname = usePathname()
  const router = useRouter()
  const contagens = useContagens(tabs)

  const numero = (tab, ativa) => {
    const n = contagens?.[tab.to]
    if (!(n > 0)) return null
    const fundo = ativa ? 'rgba(255, 255, 255, 0.22)' : tab.alerta ? cores.terracotaFundo : cores.borda
    const cor = ativa ? cores.branco : tab.alerta ? cores.terracotaTexto : cores.cafe
    return (
      <View style={[estilos.abaNumero, { backgroundColor: fundo }]}>
        <Texto peso={700} style={[estilos.abaNumeroTexto, { color: cor }]}>
          {n > 99 ? '99+' : n}
        </Texto>
      </View>
    )
  }

  return (
    <View
      style={[estilos.abas, sombras.elevada]}
      accessibilityRole="tablist"
      accessibilityLabel={titulo ? `Seções de ${titulo}` : undefined}
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
                {numero(tab, true)}
              </LinearGradient>
            ) : (
              <View style={estilos.aba}>
                <Texto peso={600} style={estilos.abaTexto}>
                  {tab.label}
                </Texto>
                {numero(tab, false)}
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

/** Números das abas (atendimentos de hoje, pacientes...), guardados por 1 minuto como no site. */
function useContagens(tabs) {
  const chave = tabs?.chaveContagem
  const [valor, setValor] = useState(() => (chave ? lerContagem(chave) : null))

  useEffect(() => {
    if (!chave || !tabs.contar || lerContagem(chave)) return undefined
    let ativo = true
    tabs
      .contar()
      .then((novo) => {
        guardarContagem(chave, novo)
        if (ativo) setValor(novo)
      })
      .catch(() => {
        // Sem número na aba se a busca falhar.
      })
    return () => {
      ativo = false
    }
  }, [chave, tabs])

  return valor
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cremeClaro },
  pagina: { paddingTop: 28, paddingHorizontal: MARGEM },
  abas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    gap: 6,
    marginTop: 24,
    padding: 5,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 26,
    backgroundColor: cores.superficie,
  },
  abaToque: { borderRadius: 999 },
  aba: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999 },
  abaNumero: {
    minWidth: 22,
    height: 20,
    marginLeft: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  abaNumeroTexto: { fontSize: fs(12), lineHeight: fs(15) },
  abaTexto: { fontSize: fs(16), lineHeight: fs(20), color: cores.taupe },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 22 },
  conteudo: { width: '100%', alignSelf: 'center' },
  corpo: { gap: 16, marginTop: 26 },
})
