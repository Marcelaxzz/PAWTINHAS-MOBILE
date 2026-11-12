import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { Texto, Titulo } from '../componentes/Texto.jsx'
import { ArrowLeftIcon } from '../web/components/Icons/Icons.jsx'
import logo from '../web/assets/images/logo-pawtinhas.webp'
import { cores, sombras } from '../tema.js'

/** Página não encontrada (NotFound do site). */
export default function NotFound() {
  return (
    <View style={estilos.pagina}>
      <Image source={logo} style={estilos.logo} contentFit="contain" />
      <Texto peso={800} style={estilos.codigo}>
        404
      </Texto>
      <Titulo style={estilos.titulo}>Página não encontrada</Titulo>
      <Texto style={estilos.texto}>A página que você procura não existe ou foi removida.</Texto>
      <PillButton to="/" replace size="lg" style={[estilos.botao, sombras.botao]}>
        <ArrowLeftIcon size={16} strokeWidth={2.4} />
        Voltar ao início
      </PillButton>
    </View>
  )
}

const estilos = StyleSheet.create({
  pagina: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: cores.areia,
  },
  logo: { width: 120, height: 157 },
  codigo: { marginTop: 8, fontSize: 72, lineHeight: 72, color: cores.caramelo },
  titulo: { marginTop: 12, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  texto: { maxWidth: 420, marginTop: 12, textAlign: 'center', color: cores.taupe },
  botao: { marginTop: 32 },
})
