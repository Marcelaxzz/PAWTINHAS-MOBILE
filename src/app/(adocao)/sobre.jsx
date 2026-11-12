import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Page } from '../../componentes/Page.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import cachorro from '../../web/assets/images/sobre-cachorro.webp'
import { cores, sombras } from '../../tema.js'
import { Grade } from '../../componentes/ui/Grade.jsx'

const CARTOES = [
  {
    titulo: 'Adoção responsável',
    texto:
      'Cada animal tem ficha com idade, saúde e temperamento, e a adoção só acontece depois de uma conversa com a equipe.',
  },
  {
    titulo: 'Atendimento veterinário',
    texto:
      'Consultas, vacinas, cirurgias, banho e tosa, visitas em casa e emergências, com o histórico de cada paciente guardado.',
    destaque: true,
  },
  {
    titulo: 'Próteses sob medida',
    texto: 'Para animais que perderam um membro, a Dra. Carolina mede pela foto e imprime a prótese em 3D, sob medida.',
  },
]

export default function Sobre() {
  return (
    <Page title="Sobre nós" subtitle="Quem somos e por que o Pawtinhas existe.">
      <Grade colunas={[1, { max: 462 }]} quebras={{ 1100: 1 }} gap={32} esticar={false}>
        <View>
          <Titulo style={estilos.historiaTitulo}>Nossa história</Titulo>
          <Texto style={estilos.historiaTexto}>
            O Pawtinhas é o espaço da médica veterinária Carolina Gonçalves, que atende animais de pequeno e grande
            porte. Aqui ela organiza a agenda da clínica, acompanha cada paciente e mostra os animais que estão para
            adoção.
          </Texto>
        </View>
        <Image
          source={cachorro}
          accessibilityLabel="Cachorro sorrindo enquanto recebe carinho na cabeça"
          style={[estilos.foto, sombras.media]}
          contentFit="cover"
        />
      </Grade>

      <Grade colunas={3} quebras={{ 1100: 1 }} gap={24} style={{ marginTop: 12 }} accessibilityLabel="O que fazemos">
        {CARTOES.map((cartao) => (
          <View
            key={cartao.titulo}
            style={[estilos.cartao, sombras.suave, cartao.destaque && { backgroundColor: cores.branco }]}
          >
            <Titulo style={estilos.cartaoTitulo}>{cartao.titulo}</Titulo>
            <Texto style={estilos.cartaoTexto}>{cartao.texto}</Texto>
          </View>
        ))}
      </Grade>
    </Page>
  )
}

const estilos = StyleSheet.create({
  historiaTitulo: { fontSize: 29, lineHeight: 36 },
  historiaTexto: { maxWidth: 620, marginTop: 22, fontSize: 18, lineHeight: 30, color: cores.taupe },
  foto: { width: '100%', aspectRatio: 462 / 344, borderRadius: 24 },
  cartao: {
    paddingTop: 28,
    paddingHorizontal: 26,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  cartaoTitulo: { fontSize: 23, lineHeight: 28 },
  cartaoTexto: { marginTop: 14, lineHeight: 26, color: cores.taupe },
})
