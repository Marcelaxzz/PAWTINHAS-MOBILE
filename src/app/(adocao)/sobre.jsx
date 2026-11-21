import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Page } from '../../componentes/Page.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { PillButton } from '../../componentes/ui/PillButton.jsx'
import { CarrosselPolaroid } from '../../componentes/CarrosselPolaroid.jsx'
import { ClockIcon, HeartIcon, StethoscopeIcon, WhatsAppIcon } from '../../web/components/Icons/Icons.jsx'
import { whatsappLink } from '../../config.js'
import pata1 from '../../web/assets/images/pata-1.png'
import pata2 from '../../web/assets/images/pata-2.png'
import pata3 from '../../web/assets/images/pata-3.png'
import { cores, sombras } from '../../tema.js'
import { Grade } from '../../componentes/ui/Grade.jsx'

const ESPECIES = ['Cães', 'Gatos', 'Cavalos', 'Bois e bezerros']
const PATAS = [pata1, pata2, pata3]

const CARTOES = [
  {
    titulo: 'Adoção responsável',
    icone: HeartIcon,
    texto:
      'Cada animal tem ficha com idade, saúde e temperamento, e a adoção só acontece depois de uma conversa com a equipe.',
  },
  {
    titulo: 'Atendimento veterinário',
    icone: StethoscopeIcon,
    texto:
      'Consultas, vacinas, cirurgias, banho e tosa, visitas em casa e emergências, com o histórico de cada paciente guardado.',
    destaque: true,
  },
  {
    titulo: 'Alarmes de medicação',
    icone: ClockIcon,
    texto: 'Cada remédio prescrito ganha um alarme no celular, no painel e na caixinha da clínica, para nenhuma dose passar.',
  },
]

const WHATSAPP = whatsappLink('Oi, Carol! Vim pelo app do Pawtinhas e queria falar com você.')

export default function Sobre() {
  return (
    <Page title="Sobre nós" subtitle="Quem somos e por que o Pawtinhas existe.">
      <Grade colunas={[1, { max: 462 }]} quebras={{ 1100: 1 }} gap={32} esticar={false}>
        <View>
          <Texto peso={700} style={estilos.sobretitulo}>
            CONHEÇA A CAROL
          </Texto>
          <Titulo style={estilos.historiaTitulo}>Nossa história</Titulo>
          <Texto style={estilos.historiaTexto}>
            O Pawtinhas é o espaço da médica veterinária Carolina Gonçalves, que atende animais de pequeno e grande
            porte. Aqui ela organiza a agenda da clínica, acompanha cada paciente e mostra os animais que estão para
            adoção.
          </Texto>

          <Titulo peso={800} style={estilos.especiesRotulo}>
            Quem ela atende
          </Titulo>
          <View style={estilos.especies}>
            {ESPECIES.map((especie, i) => (
              <View key={especie} style={[estilos.especie, sombras.suave]}>
                <Image source={PATAS[i % 3]} style={estilos.especiePata} contentFit="contain" />
                <Texto peso={600} style={{ color: cores.cafe }}>
                  {especie}
                </Texto>
              </View>
            ))}
          </View>

          <View style={estilos.acoes}>
            {Boolean(WHATSAPP) && (
              <PillButton href={WHATSAPP} size="lg">
                <WhatsAppIcon size={18} />
                Falar com a Carol
              </PillButton>
            )}
            <PillButton to="/adocao" variant="contorno" size="lg">
              Ver animais para adoção
            </PillButton>
          </View>
        </View>
        <CarrosselPolaroid />
      </Grade>

      <Grade colunas={3} quebras={{ 1100: 1 }} gap={24} style={{ marginTop: 24 }} accessibilityLabel="O que fazemos">
        {CARTOES.map(({ titulo, icone: Icone, texto, destaque }) => (
          <View key={titulo} style={[estilos.cartao, sombras.suave, destaque && { backgroundColor: cores.branco }]}>
            <View style={estilos.cartaoIcone}>
              <Icone size={22} color={cores.ferrugem} />
            </View>
            <Titulo style={estilos.cartaoTitulo}>{titulo}</Titulo>
            <Texto style={estilos.cartaoTexto}>{texto}</Texto>
            <Image source={pata2} style={estilos.cartaoPata} contentFit="contain" pointerEvents="none" />
          </View>
        ))}
      </Grade>
    </Page>
  )
}

const estilos = StyleSheet.create({
  sobretitulo: { fontSize: 13, letterSpacing: 2.4, color: cores.carameloEscuro },
  historiaTitulo: { marginTop: 10, fontSize: 29, lineHeight: 36 },
  historiaTexto: { maxWidth: 620, marginTop: 18, fontSize: 18, lineHeight: 30, color: cores.taupe },
  especiesRotulo: { marginTop: 26, fontSize: 18, lineHeight: 24 },
  especies: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  especie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.superficie,
  },
  especiePata: { width: 18, height: 18 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  cartao: {
    overflow: 'hidden',
    paddingTop: 28,
    paddingHorizontal: 26,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  cartaoIcone: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.areia,
  },
  cartaoTitulo: { marginTop: 16, fontSize: 23, lineHeight: 28 },
  cartaoTexto: { marginTop: 12, lineHeight: 26, color: cores.taupe },
  cartaoPata: {
    position: 'absolute',
    right: -10,
    bottom: -12,
    width: 78,
    height: 78,
    opacity: 0.12,
    transform: [{ rotate: '-18deg' }],
  },
})
