import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { WhatsAppIcon } from '../../web/components/Icons/Icons.jsx'
import { Page } from '../../componentes/Page.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { whatsappLink } from '../../config.js'
import { cores, sombras } from '../../tema.js'
import { Grade } from '../../componentes/ui/Grade.jsx'

const WHATSAPP_DUVIDAS = whatsappLink('Olá! Gostaria de saber mais sobre o processo de adoção do Pawtinhas.')

const PASSOS = [
  {
    titulo: 'Escolha seu pawtinha',
    texto:
      'Navegue pelo catálogo, filtre por espécie, idade ou sexo e toque no coração para guardar os que quiser rever.',
  },
  {
    titulo: 'Converse com a gente',
    texto: WHATSAPP_DUVIDAS
      ? 'Na página do animal, toque em “Ir para o WhatsApp”. Tiramos dúvidas e contamos tudo sobre a rotina dele.'
      : 'Fale com a equipe da clínica. Tiramos dúvidas e contamos tudo sobre a rotina dele.',
  },
  {
    titulo: 'Visita e entrevista',
    texto: 'Agendamos um encontro para vocês se conhecerem e conversamos sobre o espaço e a rotina da sua casa.',
  },
  {
    titulo: 'Termo de adoção',
    texto: 'Com tudo certo, você assina o termo de adoção responsável e leva o animal para casa.',
  },
]

const REQUISITOS = [
  'Ter 18 anos ou mais e apresentar documento com foto.',
  'Comprovante de residência atualizado.',
  'Concordância de todos os moradores da casa.',
  'Compromisso com vacinação, vermifugação e castração.',
  'Disponibilidade para o acompanhamento pós-adoção.',
]

export default function ComoAdotar() {
  const router = useRouter()
  return (
    <Page title="Como adotar" subtitle="São quatro passos, do catálogo até a ida para casa.">
      <Grade colunas={4} quebras={{ 1100: 2, 560: 1 }} gap={24}>
        {PASSOS.map(({ titulo, texto }, index) => (
          <View key={titulo} style={[estilos.passo, sombras.suave]}>
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

      <Grade colunas={[1, { max: 440 }]} quebras={{ 1100: 1 }} gap={32} esticar={false} style={{ marginTop: 12 }}>
        <View>
          <Titulo style={estilos.secaoTitulo}>O que você precisa</Titulo>
          <View style={{ gap: 10, marginTop: 20 }}>
            {REQUISITOS.map((r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 10, paddingLeft: 8 }}>
                <Texto style={estilos.requisito}>•</Texto>
                <Texto style={[estilos.requisito, { flex: 1 }]}>{r}</Texto>
              </View>
            ))}
          </View>
        </View>

        <View style={estilos.cta}>
          <Titulo style={estilos.ctaTitulo}>Quer adotar?</Titulo>
          <Texto style={estilos.ctaTexto}>
            A página de cada animal mostra se ele já é vacinado e castrado. O resto a equipe explica na conversa.
          </Texto>
          <Pressable onPress={() => router.push('/adocao')} accessibilityRole="link" style={estilos.ctaBotao}>
            <Texto peso={700}>Ver animais disponíveis</Texto>
          </Pressable>
          {WHATSAPP_DUVIDAS && (
            <Pressable
              onPress={() => Linking.openURL(WHATSAPP_DUVIDAS)}
              accessibilityRole="link"
              style={estilos.ctaLink}
            >
              <WhatsAppIcon size={18} color={cores.areia} />
              <Texto peso={600} style={{ fontSize: 16, color: cores.areia }}>
                Tirar dúvidas pelo WhatsApp
              </Texto>
            </Pressable>
          )}
        </View>
      </Grade>
    </Page>
  )
}

const estilos = StyleSheet.create({
  passo: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
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
  passoTexto: { marginTop: 10, lineHeight: 27, color: cores.taupe },
  secaoTitulo: { fontSize: 27, lineHeight: 34 },
  requisito: { fontSize: 18, lineHeight: 28, color: cores.taupeEscuro },
  cta: {
    alignItems: 'flex-start',
    marginTop: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: cores.cafe,
  },
  ctaTitulo: { fontSize: 27, lineHeight: 34, color: cores.branco },
  ctaTexto: { marginTop: 10, lineHeight: 26, color: 'rgba(255, 255, 255, 0.85)' },
  ctaBotao: {
    marginTop: 22,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: cores.caramelo,
  },
  ctaLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
})
