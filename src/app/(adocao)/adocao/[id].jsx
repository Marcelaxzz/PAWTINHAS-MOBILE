import { useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  CakeIcon,
  GenderIcon,
  HeartIcon,
  MapPinIcon,
  RulerIcon,
  WhatsAppIcon,
} from '../../../web/components/Icons/Icons.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { Page } from '../../../componentes/Page.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { dataService } from '../../../web/services/dataService.js'
import { photoSrc } from '../../../plataforma/imagens.js'
import { whatsappLevaMensagem, whatsappLink } from '../../../config.js'
import { categoria, mensagemInteresse } from '../../../web/utils/adocao.js'
import { useToast } from '../../../web/hooks/useToast.js'
import { useFavorites } from '../../../adocao/useFavorites.js'
import { cores, sombras, fs } from '../../../tema.js'
import { Grade } from '../../../componentes/ui/Grade.jsx'

const STATUS_TEXTO = {
  Disponível: 'Disponível para adoção',
  'Em processo': 'Em processo de adoção',
  Adotado: 'Já encontrou um lar',
}

export default function AnimalDetalhe() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [state, setState] = useState({ id: null, animal: null, error: '' })
  const [copiada, setCopiada] = useState(false)
  const toast = useToast()
  const { isFavorite, toggle } = useFavorites()

  useEffect(() => {
    let active = true
    dataService
      .get('animais', id)
      .then((animal) => active && setState({ id, animal, error: '' }))
      .catch((err) => active && setState({ id, animal: null, error: err.status === 404 ? '' : err.message }))
    return () => {
      active = false
    }
  }, [id])

  const loading = state.id !== id
  const { animal, error } = state

  if (loading || error || !animal) {
    return (
      <Page title="Adoção" subtitle="Conheça os animais disponíveis para adoção.">
        {loading && <LoadingState />}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error && (
          <EmptyState title="Animal não encontrado" action={<PillButton to="/adocao">Ver outros animais</PillButton>}>
            Esse pet pode já ter encontrado um lar.
          </EmptyState>
        )}
      </Page>
    )
  }

  const foto = photoSrc(animal.foto)
  const favorito = isFavorite(animal.id)
  const mensagem = mensagemInteresse(animal)
  const whatsapp = whatsappLink(mensagem)

  // O link do QR não leva texto: a mensagem vai para a área de transferência, pronta para colar.
  const copiar = async (indoParaWhatsapp) => {
    try {
      await Clipboard.setStringAsync(mensagem)
      setCopiada(true)
      toast.success(indoParaWhatsapp ? 'Mensagem copiada: é só colar no WhatsApp.' : 'Mensagem copiada!')
    } catch {
      if (!indoParaWhatsapp) toast.error('Não deu para copiar a mensagem.')
    }
  }
  const irParaWhatsapp = async () => {
    if (!whatsappLevaMensagem) await copiar(true)
    Linking.openURL(whatsapp).catch(() => toast.error('Não foi possível abrir o WhatsApp.'))
  }
  const icone = { size: 26, strokeWidth: 1.6, color: cores.cafe }
  const infos = [
    { label: 'Idade', value: animal.idade, icon: <CakeIcon {...icone} /> },
    { label: 'Sexo', value: animal.sexo, icon: <GenderIcon sexo={animal.sexo} {...icone} /> },
    { label: 'Porte', value: animal.porte, icon: <RulerIcon {...icone} /> },
    { label: 'Cidade', value: animal.cidade, icon: <MapPinIcon {...icone} /> },
  ]
  const convivencia = [
    { label: 'Convive com outros animais', ok: animal.conviveAnimais },
    { label: 'Convive com crianças', ok: animal.conviveCriancas },
    { label: 'Vacinado', ok: animal.vacinado },
    { label: 'Castrado', ok: animal.castrado },
  ]

  return (
    <Page title={animal.nome} subtitle={categoria(animal)}>
      <Grade colunas={[{ max: 460 }, 1]} quebras={{ 900: 1 }} gap={32} linhaGap={16} esticar={false}>
        <View style={[estilos.foto, sombras.media]}>
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={`Foto de ${animal.nome}`}
            />
          ) : null}
          <View style={estilos.status}>
            <View style={[estilos.bolinha, animal.status !== 'Disponível' && estilos.bolinhaOcupada]} />
            <Texto peso={700} style={{ flexShrink: 1 }}>
              {STATUS_TEXTO[animal.status] ?? animal.status}
            </Texto>
            <Texto style={estilos.cidade}>{animal.cidade}</Texto>
          </View>
        </View>
        <View style={{ gap: 16 }}>
          <LinearGradient
            colors={[cores.cafe, cores.ferrugem, cores.carameloEscuro]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[estilos.contato, sombras.suave]}
          >
            {whatsapp ? (
              <>
                <Titulo style={estilos.contatoTitulo}>Quer saber mais sobre {animal.nome}?</Titulo>
                <Texto style={estilos.contatoTexto}>
                  {whatsappLevaMensagem
                    ? 'Mande uma mensagem pelo WhatsApp: ela já vai escrita, é só enviar.'
                    : 'A mensagem abaixo é copiada quando você toca em "Ir para o WhatsApp": é só colar na conversa.'}
                </Texto>
                {!whatsappLevaMensagem ? (
                  <Texto selectable style={estilos.mensagem}>
                    {mensagem}
                  </Texto>
                ) : null}
                <Pressable
                  onPress={irParaWhatsapp}
                  accessibilityRole="link"
                  style={({ pressed }) => [estilos.whatsapp, pressed && { opacity: 0.9 }]}
                >
                  <WhatsAppIcon size={22} color="#0b2e18" />
                  <Texto peso={700} style={{ color: '#0b2e18' }}>
                    Ir para o WhatsApp
                  </Texto>
                </Pressable>
                {!whatsappLevaMensagem ? (
                  <Pressable
                    onPress={() => copiar(false)}
                    accessibilityRole="button"
                    style={({ pressed }) => [estilos.copiar, pressed && { opacity: 0.8 }]}
                  >
                    <Texto peso={700} style={{ color: cores.branco }}>
                      {copiada ? 'Mensagem copiada!' : 'Copiar mensagem'}
                    </Texto>
                  </Pressable>
                ) : null}
              </>
            ) : (
              // Sem WhatsApp configurado, o visitante ainda tem um próximo passo.
              <>
                <Titulo style={estilos.contatoTitulo}>Quer adotar {animal.nome}?</Titulo>
                <Texto style={estilos.contatoTexto}>
                  Veja o que você precisa e como funciona cada etapa da adoção responsável.
                </Texto>
                <Pressable
                  onPress={() => router.push('/como-adotar')}
                  accessibilityRole="link"
                  style={estilos.comoAdotar}
                >
                  <Texto peso={700}>Como adotar</Texto>
                </Pressable>
              </>
            )}
          </LinearGradient>

          <View style={estilos.fraseLinha}>
            {animal.frase ? <Texto style={estilos.frase}>“{animal.frase}”</Texto> : null}
            <Pressable
              onPress={() => toggle(animal.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: favorito }}
              style={[estilos.favorito, favorito && estilos.favoritado]}
            >
              <HeartIcon
                size={18}
                filled={favorito}
                strokeWidth={2.2}
                color={favorito ? cores.rosaTexto : cores.cafe}
              />
              <Texto peso={600} style={{ fontSize: fs(16), color: favorito ? cores.rosaTexto : cores.cafe }}>
                {favorito ? 'Nos favoritos' : 'Favoritar'}
              </Texto>
            </Pressable>
          </View>

          <Grade colunas={4} quebras={{ 1100: 2 }} gap={10}>
            {infos.map((info) => (
              <View key={info.label} style={estilos.info}>
                <View style={{ marginBottom: 8 }}>{info.icon}</View>
                <Texto peso={700} style={estilos.infoRotulo}>
                  {info.label.toUpperCase()}
                </Texto>
                <Texto peso={700} style={estilos.infoValor}>
                  {info.value || '-'}
                </Texto>
              </View>
            ))}
          </Grade>

          <View style={[estilos.cartao, sombras.suave]}>
            <Titulo style={estilos.cartaoTitulo}>Sobre {animal.nome}</Titulo>
            <Texto style={estilos.sobre}>{animal.sobre || animal.descricao}</Texto>
          </View>

          <View style={[estilos.cartao, sombras.suave]}>
            <Titulo style={estilos.cartaoTitulo}>Informações</Titulo>
            <View style={{ marginTop: 8 }}>
              {convivencia.map((item) => (
                <View key={item.label} style={estilos.linha}>
                  <Texto style={estilos.linhaTexto}>{item.label}</Texto>
                  <View style={[estilos.resposta, !item.ok && estilos.respostaNao]}>
                    <Texto peso={600} style={{ fontSize: fs(16), color: item.ok ? cores.sucesso : cores.taupeEscuro }}>
                      {item.ok ? 'Sim' : 'Não'}
                    </Texto>
                  </View>
                </View>
              ))}
              <View style={[estilos.linha, { borderBottomWidth: 0 }]}>
                <Texto style={estilos.linhaTexto}>Necessidades especiais</Texto>
                <Texto peso={600} style={{ flexShrink: 1, fontSize: fs(16), color: cores.cafe, textAlign: 'right' }}>
                  {animal.necessidades || 'Nenhuma'}
                </Texto>
              </View>
            </View>
          </View>
        </View>
      </Grade>
    </Page>
  )
}

const estilos = StyleSheet.create({
  foto: { aspectRatio: 4 / 3, overflow: 'hidden', borderRadius: 32, backgroundColor: cores.fotoVazia },
  status: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: cores.vidroCreme,
  },
  bolinha: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: cores.salvia,
    borderWidth: 3,
    borderColor: 'rgba(111, 143, 98, 0.35)',
  },
  bolinhaOcupada: { backgroundColor: cores.caramelo, borderColor: 'rgba(216, 161, 107, 0.4)' },
  cidade: { marginLeft: 'auto', fontSize: fs(16), color: cores.taupe },
  contato: { paddingTop: 26, paddingHorizontal: 26, paddingBottom: 24, borderRadius: 24 },
  contatoTitulo: { fontSize: fs(23), lineHeight: fs(28), color: cores.branco },
  contatoTexto: { marginTop: 8, lineHeight: fs(26), color: 'rgba(255, 255, 255, 0.9)' },
  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#24d366',
  },
  mensagem: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    lineHeight: fs(24),
    color: cores.branco,
  },
  copiar: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    marginTop: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 999,
  },
  comoAdotar: {
    alignSelf: 'flex-start',
    minHeight: 46,
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: cores.papel,
  },
  fraseLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 20,
    rowGap: 12,
    marginTop: 4,
  },
  frase: {
    flexGrow: 1,
    flexBasis: 240,
    fontFamily: 'Fraunces_600SemiBold_Italic',
    fontSize: fs(23),
    lineHeight: fs(32),
    color: cores.taupeEscuro,
  },
  favorito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.papel,
  },
  favoritado: { borderColor: 'rgba(212, 86, 106, 0.35)', backgroundColor: cores.rosaFundo },
  info: {
    gap: 2,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 16,
    backgroundColor: cores.superficie,
  },
  infoRotulo: { fontSize: fs(15), letterSpacing: 0.6, color: cores.taupe },
  infoValor: { fontSize: fs(20), lineHeight: fs(27) },
  cartao: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.papel,
  },
  cartaoTitulo: { fontSize: fs(23), lineHeight: fs(28) },
  sobre: { marginTop: 10, fontSize: fs(18), lineHeight: fs(29), color: cores.taupeEscuro },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  linhaTexto: { flexShrink: 1, fontSize: fs(18), color: cores.taupeEscuro },
  resposta: {
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(111, 143, 98, 0.14)',
  },
  respostaNao: { backgroundColor: 'rgba(110, 77, 54, 0.08)' },
})
