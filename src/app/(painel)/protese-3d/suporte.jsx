import { useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { Page } from '../../../componentes/Page.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { ChevronDownIcon, ClockIcon, MailIcon, PhoneIcon } from '../../../web/components/Icons/Icons.jsx'
import { proteseTabs } from '../../../web/pages/protese/proteseTabs.js'
import { usePetFromQuery } from '../../../protese/usePetFromQuery.js'
import { BotaoProtese } from '../../../protese/comum.jsx'
import { cores } from '../../../tema.js'
import { Grade } from '../../../componentes/ui/Grade.jsx'

const EMAIL = 'suporte@pawtinhas.com.br'
const TELEFONE = '(34) 3823-0300'

const PERGUNTAS = [
  {
    pergunta: 'O botão “Abrir câmera” não aparece. Por quê?',
    resposta:
      'A medição pela câmera precisa do Chrome num celular Android com o “Google Play Services para RA” (instalado pela Play Store) e do site aberto em https. No computador e no iPhone ela não aparece: meça com fita métrica ou, no iPhone, com o app Medida, e digite os valores.',
  },
  {
    pergunta: 'A mira não fica branca. O que faço?',
    resposta:
      'Mexa o celular devagar, de um lado para o outro, mostrando o chão e o pet, com boa luz. A câmera precisa de alguns segundos para entender o ambiente.',
  },
  {
    pergunta: 'A medida da câmera é confiável?',
    resposta:
      'Fica perto da fita métrica, com diferença de poucos milímetros, se o celular estiver a uns 30 a 50 cm do membro. Os números podem ser corrigidos antes de salvar.',
  },
  {
    pergunta: 'A câmera fica gravando?',
    resposta:
      'Não. Nada da câmera é salvo nem enviado. Só as medidas, o membro e o método vão para a ficha do paciente.',
  },
  {
    pergunta: 'Onde vejo as medições anteriores?',
    resposta: 'Na ficha do paciente, em “Prótese 3D”. Cada medição mostra a data, o membro e o método.',
  },
]

function Pergunta({ item }) {
  const [aberta, setAberta] = useState(false)
  return (
    <View style={estilos.item}>
      <Pressable
        onPress={() => setAberta((a) => !a)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberta }}
        style={estilos.resumo}
      >
        <Texto peso={600} style={{ flex: 1 }}>
          {item.pergunta}
        </Texto>
        <ChevronDownIcon
          size={18}
          color={cores.cafe}
          style={aberta ? { transform: [{ rotate: '180deg' }] } : undefined}
        />
      </Pressable>
      {aberta && <Texto style={estilos.resposta}>{item.resposta}</Texto>}
    </View>
  )
}

function Contato({ icon: Icon, rotulo, valor, onPress }) {
  return (
    <View style={estilos.contatoLinha}>
      <Icon size={18} color={cores.carameloEscuro} />
      <View style={{ flex: 1 }}>
        <Texto style={{ fontSize: 15, color: cores.taupe }}>{rotulo}</Texto>
        <Texto peso={700} onPress={onPress} accessibilityRole={onPress ? 'link' : undefined}>
          {valor}
        </Texto>
      </View>
    </View>
  )
}

export default function ProteseSuporte() {
  const { query } = usePetFromQuery()

  return (
    <Page
      title="Suporte"
      subtitle="Tire dúvidas sobre a medição e fale com a equipe do Pawtinhas."
      tabs={proteseTabs(query)}
    >
      <Grade colunas={[1, { max: 380 }]} quebras={{ 960: 1 }} gap={32} linhaGap={16} esticar={false}>
        <View style={{ gap: 12 }}>
          <Titulo style={estilos.secao}>Perguntas frequentes</Titulo>
          {PERGUNTAS.map((item) => (
            <Pergunta key={item.pergunta} item={item} />
          ))}
        </View>

        <View style={estilos.contato}>
          <Titulo style={estilos.secao}>Fale com a gente</Titulo>
          <View style={{ gap: 16, marginTop: 20, marginBottom: 24 }}>
            <Contato icon={MailIcon} rotulo="E-mail" valor={EMAIL} onPress={() => Linking.openURL(`mailto:${EMAIL}`)} />
            <Contato
              icon={PhoneIcon}
              rotulo="Telefone"
              valor={TELEFONE}
              onPress={() => Linking.openURL(`tel:+55${TELEFONE.replace(/\D/g, '')}`)}
            />
            <Contato icon={ClockIcon} rotulo="Atendimento" valor="Seg. a sex., das 8h às 18h" />
          </View>
          <BotaoProtese
            onPress={() => Linking.openURL(`mailto:${EMAIL}?subject=${encodeURIComponent('Suporte - Prótese 3D')}`)}
          >
            Escrever e-mail
          </BotaoProtese>
        </View>
      </Grade>
    </Page>
  )
}

const estilos = StyleSheet.create({
  secao: { fontSize: 23, lineHeight: 28 },
  item: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 18,
    backgroundColor: cores.branco,
  },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  resposta: { paddingHorizontal: 22, paddingBottom: 20, lineHeight: 27, color: cores.taupe },
  contato: {
    marginTop: 12,
    padding: 28,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  contatoLinha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
})
