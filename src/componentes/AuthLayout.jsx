import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import logo from '../web/assets/images/logo-pawtinhas.webp'
import pets from '../web/assets/images/pets-boas-vindas.webp'
import { cores, gradientes, sombras } from '../tema.js'
import { Titulo } from './Texto.jsx'
import { useAte } from './ui/Grade.jsx'

/**
 * Moldura das telas de acesso (AuthLayout do site no celular): cartão creme com o painel café
 * em cima e o formulário embaixo. Como no site: acima de 900 px o painel fica ao lado do formulário;
 * os pets aparecem menores até 560 px e somem em celular baixo (até 700 px de altura).
 */
export function AuthLayout({ children }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const lado = !useAte(900)
  const estreito = useAte(560)
  const { height } = useWindowDimensions()
  const comPets = !estreito || height > 700
  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          estilos.pagina,
          lado && estilos.paginaLado,
          { paddingTop: insets.top + (lado ? 16 : 12), paddingBottom: insets.bottom + (lado ? 16 : 12) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[estilos.cartao, lado && estilos.cartaoLado, sombras.card]}>
          <LinearGradient
            colors={gradientes.painel}
            locations={[0, 0.48, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[estilos.painel, comPets && estilos.painelPets, lado && estilos.painelLado]}
          >
            <Pressable
              onPress={() => router.replace('/')}
              accessibilityRole="link"
              accessibilityLabel="Voltar para a página inicial"
              style={estilos.marca}
            >
              <View style={estilos.selo}>
                <Image source={logo} style={estilos.seloImagem} contentFit="contain" />
              </View>
              <Titulo style={estilos.marcaNome}>Pawtinhas</Titulo>
            </Pressable>
            <Titulo style={[estilos.titulo, lado && estilos.tituloLado]}>Que bom ter você de volta!</Titulo>
            {comPets ? (
              <View
                style={[estilos.ilustracao, estreito && estilos.ilustracaoEstreita, lado && estilos.ilustracaoLado]}
              >
                <Image source={pets} style={StyleSheet.absoluteFill} contentFit="contain" contentPosition="bottom" />
              </View>
            ) : null}
          </LinearGradient>

          <View style={[estilos.formulario, lado && estilos.formularioLado]}>
            <View style={estilos.formularioConteudo}>{children}</View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.areia },
  pagina: { flexGrow: 1, paddingHorizontal: 12 },
  cartao: { flexGrow: 1, overflow: 'hidden', borderRadius: 24, backgroundColor: cores.creme },
  painel: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 24 },
  marca: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 14 },
  selo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.creme,
  },
  seloImagem: { width: 32, height: 42 },
  marcaNome: { fontSize: 25, lineHeight: 32, color: cores.branco },
  titulo: { marginTop: 20, fontSize: 29, lineHeight: 33, color: cores.branco },
  formulario: { paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40 },
  formularioConteudo: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  // Ilustração dos pets
  painelPets: { paddingBottom: 0 },
  ilustracao: { height: 180, marginTop: 8, marginHorizontal: -24 },
  ilustracaoEstreita: { height: 140, marginTop: 4 },
  // Painel ao lado do formulário (acima de 900 px)
  paginaLado: { paddingHorizontal: 16 },
  cartaoLado: { flexDirection: 'row', borderRadius: 32 },
  painelLado: { flex: 1, paddingTop: 48, paddingHorizontal: 56 },
  tituloLado: { maxWidth: 360, marginTop: 64, fontSize: 52, lineHeight: 57 },
  ilustracaoLado: { flex: 1, height: undefined, minHeight: 240, marginTop: 24, marginHorizontal: -56 },
  formularioLado: { flex: 1, justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 56 },
})
