import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRightIcon } from '../web/components/Icons/Icons.jsx'
import logo from '../web/assets/images/logo-pawtinhas.webp'
import coelho from '../web/assets/images/coelho-oculos.webp'
import gato from '../web/assets/images/gato-oculos.webp'
import { cores, gradientes, sombras, texto } from '../tema.js'
import { Texto } from '../componentes/Texto.jsx'

const LETRAS = [
  { letra: 'P', cor: cores.cafeEscuro },
  { letra: 'A', cor: cores.cafeMedio },
  { letra: 'W', cor: cores.cafe },
  { letra: 'T', cor: cores.carameloEscuro },
  { letra: 'I', cor: cores.caramelo },
  { letra: 'N', cor: cores.carameloEscuro },
  { letra: 'H', cor: cores.cafe },
  { letra: 'A', cor: cores.cafeMedio },
  { letra: 'S', cor: cores.cafeEscuro },
  { letra: '!', cor: cores.cafeEscuro },
]

/** Boas-vindas (Welcome do site, no layout de celular). */
export default function Welcome() {
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  // O título encolhe com a largura da tela, como o --titulo-tamanho do site.
  const titulo = Math.min(170, (width - 48) / 6.95)
  const largo = width > 560
  // Celulares baixos (até 640 px de altura): bichos menores e conteúdo mais alto, para não cobrirem o texto.
  const baixo = height < 640

  const coelhoLargura = largo ? 380 : baixo ? 200 : 260
  const gatoLargura = largo ? 380 : baixo ? 200 : 290

  return (
    <View style={estilos.pagina}>
      <Image
        source={coelho}
        style={[
          estilos.coelho,
          {
            width: coelhoLargura,
            height: (coelhoLargura * 451) / 601,
            top: insets.top - coelhoLargura * 0.057,
            right: -coelhoLargura * 0.265,
          },
        ]}
        contentFit="contain"
      />
      <Image
        source={gato}
        style={[estilos.gato, { width: gatoLargura, height: (gatoLargura * 404) / 606, left: -gatoLargura * 0.167 }]}
        contentFit="contain"
      />
      <Image
        source={logo}
        accessibilityLabel="Pawtinhas"
        style={[
          estilos.logo,
          { top: insets.top - 6, width: largo ? 140 : 104, height: ((largo ? 140 : 104) * 245) / 187 },
        ]}
        contentFit="contain"
      />

      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { minHeight: height, paddingTop: (largo ? 260 : baixo ? 150 : 200) + insets.top },
        ]}
      >
        <View accessibilityRole="header" accessibilityLabel="Bem-vindo(a) ao Pawtinhas!" style={estilos.bloco}>
          <Texto peso={600} style={[estilos.saudacao, { fontSize: Math.max(18, titulo * 0.32) }]}>
            BEM-VINDO(A) AO
          </Texto>
          <Text
            style={[estilos.marca, { fontSize: titulo, lineHeight: titulo * 1.29, marginTop: -titulo * 0.053 }]}
            numberOfLines={1}
          >
            {LETRAS.map(({ letra, cor }, index) => (
              <Text key={index} style={{ color: cor }}>
                {letra}
              </Text>
            ))}
          </Text>
        </View>

        <View style={estilos.acoes}>
          <Pressable
            onPress={() => router.push('/adocao')}
            accessibilityRole="link"
            style={({ pressed }) => [estilos.botaoEnvolve, sombras.media, pressed && { opacity: 0.92 }]}
          >
            <LinearGradient
              colors={gradientes.cafe}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={estilos.botao}
            >
              <Texto peso={600} style={[estilos.botaoTexto, { color: cores.branco }]}>
                Ver catálogo de adoções
              </Texto>
              <ArrowRightIcon size={18} strokeWidth={2.2} color={cores.branco} />
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="link"
            style={({ pressed }) => [estilos.botao, estilos.botaoLogin, pressed && { borderColor: cores.caramelo }]}
          >
            <Texto peso={600} style={[estilos.botaoTexto, { color: cores.cafe }]}>
              Fazer login
            </Texto>
          </Pressable>
          <Pressable onPress={() => router.push('/sobre')} accessibilityRole="link" hitSlop={8} style={estilos.sobre}>
            <Texto peso={600} style={estilos.sobreTexto}>
              Sobre nós
            </Texto>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const estilos = StyleSheet.create({
  pagina: { flex: 1, overflow: 'hidden', backgroundColor: cores.areia },
  logo: { position: 'absolute', zIndex: 2, left: 0 },
  coelho: { position: 'absolute', zIndex: 0 },
  gato: { position: 'absolute', zIndex: 0, bottom: 0 },
  conteudo: { paddingHorizontal: 20, paddingBottom: 220 },
  bloco: { alignItems: 'center' },
  saudacao: { textAlign: 'center', color: cores.taupe, lineHeight: 29 },
  marca: {
    ...texto(800),
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(54, 36, 26, 0.12)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 12,
  },
  acoes: { alignItems: 'stretch', gap: 14, marginTop: 36 },
  botaoEnvolve: { borderRadius: 999 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 34,
    borderRadius: 999,
  },
  botaoLogin: { borderWidth: 1.5, borderColor: cores.bordaForte, backgroundColor: 'rgba(255, 253, 249, 0.75)' },
  botaoTexto: { fontSize: 19 },
  sobre: { alignSelf: 'center', marginTop: 8 },
  sobreTexto: {
    fontSize: 18,
    color: cores.cafe,
    textDecorationLine: 'underline',
    textDecorationColor: cores.caramelo,
  },
})
