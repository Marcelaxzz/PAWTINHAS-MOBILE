import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { proteseTabs } from '../../../web/pages/protese/proteseTabs.js'
import { usePetFromQuery } from '../../../protese/usePetFromQuery.js'
import { BotaoProtese } from '../../../protese/comum.jsx'
import referencia from '../../../web/assets/images/medicao-cao.webp'
import { cores, sombras } from '../../../tema.js'
import { Grade } from '../../../componentes/ui/Grade.jsx'

const PASSOS = [
  { titulo: 'Abra a câmera', texto: 'Toque em “Abrir câmera” na aba Medição (Chrome no Android).' },
  { titulo: 'Toque nas duas pontas', texto: 'Mire no começo e toque no +. Mire no fim e toque de novo.' },
  { titulo: 'Salve na ficha', texto: 'Com as quatro medidas prontas, escolha o membro e salve.' },
]

const DICAS = [
  'Antes de medir, passe o celular devagar pelo chão e pelo pet, com boa luz. A mira fica branca quando acha a superfície.',
  'Se uma medida sair estranha, toque em “Desfazer” ou corrija o número antes de salvar.',
  'No iPhone, use o app Medida e digite os valores. Fita métrica também serve.',
]

export default function ProteseComoFunciona() {
  const router = useRouter()
  const { query } = usePetFromQuery()

  return (
    <Page title="Como funciona" tabs={proteseTabs(query)}>
      <Grade
        colunas={[1, 0.9]}
        quebras={{ 1060: 1 }}
        gap={40}
        linhaGap={28}
        esticar={false}
        style={[estilos.hero, sombras.suave]}
      >
        <View>
          <Titulo style={estilos.titulo}>Da medida à prótese sob medida</Titulo>
          <Texto style={estilos.subtitulo}>
            A medição usa a câmera do celular com realidade aumentada: você toca nas pontas e as medidas saem em
            centímetros.
          </Texto>
          <View style={estilos.acoes}>
            <BotaoProtese onPress={() => router.push(`/protese-3d/medicao${query}`)} style={estilos.cta}>
              Começar medição
            </BotaoProtese>
            <BotaoProtese tipo="secundario" onPress={() => router.push('/pacientes')} style={estilos.cta}>
              Escolher paciente
            </BotaoProtese>
          </View>
        </View>
        <Image
          source={referencia}
          accessibilityLabel="Cachorro em pé, de lado para a câmera, na grama"
          style={estilos.heroFoto}
          contentFit="cover"
        />
      </Grade>

      <Titulo style={estilos.secao}>Passo a passo</Titulo>
      <Grade colunas={4} quebras={{ 1060: 2, 640: 1 }} gap={20}>
        {PASSOS.map(({ titulo, texto }, index) => (
          <View key={titulo} style={estilos.passo}>
            <View style={estilos.numero}>
              <Texto peso={700} style={{ fontSize: 16, color: cores.branco }}>
                {index + 1}
              </Texto>
            </View>
            <Titulo style={estilos.passoTitulo}>{titulo}</Titulo>
            <Texto style={estilos.passoTexto}>{texto}</Texto>
          </View>
        ))}
      </Grade>

      <Titulo style={estilos.secao}>Para medir bem</Titulo>
      <Grade colunas={2} quebras={{ 640: 1 }} gap={24} linhaGap={12} esticar={false} style={estilos.dicas}>
        {DICAS.map((dica) => (
          <View key={dica} style={estilos.dica}>
            <View style={estilos.bolinha} />
            <Texto style={{ flex: 1, lineHeight: 26 }}>{dica}</Texto>
          </View>
        ))}
      </Grade>
    </Page>
  )
}

const estilos = StyleSheet.create({
  hero: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 22,
    backgroundColor: cores.branco,
  },
  titulo: { marginTop: 14, fontSize: 29, lineHeight: 34 },
  subtitulo: { marginTop: 14, fontSize: 18, lineHeight: 29, color: cores.taupe },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  cta: { width: 'auto', paddingHorizontal: 26 },
  heroFoto: { width: '100%', aspectRatio: 16 / 10, borderRadius: 24 },
  secao: { marginTop: 20, fontSize: 27, lineHeight: 34 },
  passo: {
    paddingVertical: 26,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  numero: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: cores.cafe,
  },
  passoTitulo: { marginTop: 16, fontSize: 23, lineHeight: 28 },
  passoTexto: { marginTop: 8, lineHeight: 26, color: cores.taupe },
  dicas: { padding: 18, borderRadius: 24, backgroundColor: cores.superficie },
  dica: { flexDirection: 'row', gap: 14 },
  bolinha: { width: 8, height: 8, marginTop: 8, borderRadius: 4, backgroundColor: cores.caramelo },
})
