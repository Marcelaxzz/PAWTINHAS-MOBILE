import { useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  HeartIcon,
  PillIcon,
  PlusIcon,
  StethoscopeIcon,
  UsersIcon,
} from '../../web/components/Icons/Icons.jsx'
import { useAuth } from '../../web/hooks/useAuth.js'
import { useClinic } from '../../web/hooks/useClinic.js'
import { useToast } from '../../web/hooks/useToast.js'
import { estoqueService, relatoriosService } from '../../web/services/gestaoService.js'
import { montarPainel, RECURSOS_PAINEL, saudacao, TOM_SERVICO } from '../../web/utils/painel.js'
import { qtd, SITUACOES } from '../../web/pages/calculadoras/Catalogos/estoque.js'
import { photoSrc } from '../../plataforma/imagens.js'
import pets from '../../web/assets/images/pets-inicio.webp'
import { cores, gradientes, MARGEM, sombras, fs } from '../../tema.js'
import { Forte, Texto, Titulo } from '../../componentes/Texto.jsx'
import { Chip, StatusChip } from '../../componentes/ui/Chip.jsx'
import { Grade, useAte } from '../../componentes/ui/Grade.jsx'
import { InicialPet } from '../../componentes/ui/InicialPet.jsx'
import { aniversario, emojiDaHora, tomDaEspecie } from '../../web/utils/enfeites.js'

const ICONES = { agenda: CalendarIcon, emergencias: AlertIcon, pacientes: UsersIcon, estoque: PillIcon }

/** Tom de cada indicador/serviço → cor do texto e do fundo (mesmos tons do site). */
const TOM = (tom) => ({ cor: cores[`${tom}Texto`] ?? cores.cafe, fundo: cores[`${tom}Fundo`] ?? cores.areia })

const ATALHOS = [
  { to: '/agenda/consultas/nova', rotulo: 'Nova consulta', icone: StethoscopeIcon },
  { to: '/pacientes/novo', rotulo: 'Novo paciente', icone: PlusIcon },
  { to: '/alarmes/novo', rotulo: 'Novo alarme', icone: ClockIcon },
  { to: '/calculadoras/dose', rotulo: 'Calcular dose', icone: PillIcon },
]

const inicioDoMes = () => {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-01`
}

/** Cabeçalho dos cartões do painel: título, apoio e o atalho "Abrir". */
function Cabecalho({ titulo, apoio, to, rotulo = 'Abrir' }) {
  const router = useRouter()
  return (
    <View style={estilos.cartaoTopo}>
      <View style={{ flex: 1 }}>
        <Titulo style={estilos.cartaoTitulo}>{titulo}</Titulo>
        {apoio ? <Texto style={estilos.cartaoApoio}>{apoio}</Texto> : null}
      </View>
      {to ? (
        <Pressable
          onPress={() => router.push(to)}
          accessibilityRole="link"
          style={({ pressed }) => [estilos.verTudo, pressed && { backgroundColor: cores.bordaForte }]}
        >
          <Texto peso={700} style={estilos.verTudoTexto}>
            {rotulo}
          </Texto>
          <ArrowRightIcon size={15} color={cores.cafe} />
        </Pressable>
      ) : null}
    </View>
  )
}

/** Painel inicial depois do login (Home do site). */
export default function Inicio() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const { data, lookup, error, reload } = useClinic(RECURSOS_PAINEL)
  const [estoque, setEstoque] = useState(null)
  const [baixando, setBaixando] = useState('')
  const [atualizando, setAtualizando] = useState(false)
  const largo = !useAte(1100)
  const celular = useAte(760)
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? ''
  const agora = new Date()

  const carregarEstoque = () =>
    estoqueService
      .listar()
      .then(setEstoque)
      .catch(() => setEstoque([]))

  useEffect(() => {
    carregarEstoque()
  }, [])

  const painel = useMemo(() => (data ? montarPainel(data, lookup, estoque) : null), [data, lookup, estoque])
  const aniversariantes = useMemo(
    () => (data?.pets ?? []).filter((p) => aniversario(p.dataNascimento)?.hoje).slice(0, 4),
    [data],
  )

  const atualizar = async () => {
    setAtualizando(true)
    await Promise.all([reload(), carregarEstoque()])
    setAtualizando(false)
  }

  const relatorios = [
    { id: 'agenda', rotulo: 'Agenda do mês', baixar: () => relatoriosService.pdfAgenda({ de: inicioDoMes() }) },
    { id: 'estoque', rotulo: 'Estoque', baixar: () => relatoriosService.pdfEstoque() },
    { id: 'alarmes', rotulo: 'Alarmes', baixar: () => relatoriosService.pdfAlarmes() },
    { id: 'adocao', rotulo: 'Adoção', baixar: () => relatoriosService.pdfAdocao() },
  ]
  const baixar = async (r) => {
    setBaixando(r.id)
    try {
      await r.baixar()
      toast.success(`Relatório de ${r.rotulo.toLowerCase()} pronto.`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBaixando('')
    }
  }

  const agenda = painel && (
    <View style={[estilos.cartao, sombras.suave]} accessibilityLabel="Agenda de hoje">
      <Cabecalho
        titulo="Agenda de hoje"
        apoio={painel.linha.length ? `${painel.linha.length} atendimentos` : 'Dia livre'}
        to="/agenda"
        rotulo="Ver agenda"
      />
      {painel.linha.length === 0 ? (
        <Texto style={estilos.vazio}>Nenhum atendimento marcado para hoje.</Texto>
      ) : (
        <View style={{ gap: 10 }}>
          {painel.linha.slice(0, 7).map((item) => {
            const tom = TOM(TOM_SERVICO[item.tipo] ?? 'ceu')
            return (
              <View key={`${item.tipo}-${item.id}`} style={[estilos.linha, { borderLeftColor: tom.cor }]}>
                <View style={estilos.hora}>
                  <ClockIcon size={14} color={tom.cor} />
                  <Texto peso={800} style={estilos.horaTexto}>
                    {item.hora}
                  </Texto>
                </View>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <Texto peso={700} style={estilos.linhaPet}>
                    {item.pet}
                  </Texto>
                  <Texto style={estilos.linhaDetalhe} numberOfLines={1}>
                    {item.tipo} · {item.detalhe}
                  </Texto>
                </View>
                <StatusChip status={item.status} />
              </View>
            )
          })}
          {painel.linha.length > 7 ? (
            <Texto peso={700} style={estilos.mais} onPress={() => router.push('/agenda')}>
              Ver os outros {painel.linha.length - 7} atendimentos de hoje
            </Texto>
          ) : null}
        </View>
      )}
    </View>
  )

  const semana = painel && (
    <View style={[estilos.cartao, sombras.suave]} accessibilityLabel="Atendimentos nos próximos 7 dias">
      <Cabecalho titulo="Próximos 7 dias" apoio="Atendimentos marcados por dia" />
      <View style={estilos.barras}>
        {painel.semana.map((d, i) => (
          <View key={d.iso} style={estilos.barraDia}>
            <Texto peso={800} style={estilos.barraValor}>
              {d.total}
            </Texto>
            <View style={estilos.barraTrilho}>
              <LinearGradient
                colors={i === 0 ? ['#e9c193', cores.ferrugem] : [cores.caramelo, cores.cafe]}
                style={[estilos.barraNivel, { height: `${Math.max(5, (d.total / painel.maxSemana) * 100)}%` }]}
              />
            </View>
            <Texto peso={700} style={estilos.barraRotulo}>
              {d.rotulo}
            </Texto>
            <Texto style={estilos.barraDiaNum}>{d.dia}</Texto>
          </View>
        ))}
      </View>
    </View>
  )

  // Pacientes com foto primeiro, como no site.
  const pacientes = painel && data?.pets?.length > 0 && (
    <View style={[estilos.cartao, sombras.suave]}>
      <Cabecalho titulo="Pacientes" apoio="Os pawtinhas da clínica" to="/pacientes" rotulo="Ver todos" />
      <Grade colunas={4} quebras={{ 560: 3 }} gap={10}>
        {[...data.pets]
          .sort((a, b) => Number(Boolean(photoSrc(b.foto))) - Number(Boolean(photoSrc(a.foto))))
          .slice(0, 12)
          .map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/pacientes/${encodeURIComponent(p.id)}`)}
              accessibilityRole="link"
              style={({ pressed }) => [estilos.pet, pressed && { borderColor: cores.caramelo }]}
            >
              <FotoOuInicial pet={p} />
              {aniversario(p.dataNascimento) && (
                <View style={[estilos.petBolo, { backgroundColor: cores.rosaFundo, borderColor: cores.papel }]}>
                  <Texto style={estilos.petBoloTexto}>🎂</Texto>
                </View>
              )}
              <Texto peso={700} numberOfLines={1} style={{ color: cores.cafeEscuro }}>
                {p.nome}
              </Texto>
              <Texto style={[estilos.petEspecie, { color: cores[`${tomDaEspecie(p.especie)}Texto`] }]}>{p.especie}</Texto>
            </Pressable>
          ))}
      </Grade>
    </View>
  )

  const lateral = painel && (
    <View style={{ gap: 20 }}>
      <View style={[estilos.cartao, sombras.suave]}>
        <Cabecalho
          titulo="Estoque"
          apoio="Medicamentos, rações e materiais que pedem atenção"
          to="/calculadoras/medicamentos"
        />
        {!estoque ? (
          <Texto style={estilos.vazio}>Carregando…</Texto>
        ) : painel.atencaoEstoque.length === 0 ? (
          <Texto style={estilos.vazio}>Tudo em dia no estoque.</Texto>
        ) : (
          <View style={{ gap: 8 }}>
            {painel.atencaoEstoque.slice(0, 5).map((i) => (
              <View key={`${i.categoria}-${i.itemId}`} style={estilos.itemLista}>
                <View style={{ flex: 1 }}>
                  <Texto peso={700} numberOfLines={1} style={{ color: cores.cafeEscuro }}>
                    {i.nome}
                  </Texto>
                  <Texto style={estilos.linhaDetalhe}>{qtd(i.saldo, i.unidade)}</Texto>
                </View>
                <Chip tone={SITUACOES[i.situacao]?.tom ?? 'neutro'} size="xs">
                  {SITUACOES[i.situacao]?.texto ?? i.situacao}
                </Chip>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[estilos.cartao, sombras.suave]}>
        <Cabecalho
          titulo="Próximos alarmes"
          apoio={`${painel.alarmesAtivos} ${painel.alarmesAtivos === 1 ? 'ativo' : 'ativos'}`}
          to="/alarmes"
        />
        {painel.proximosAlarmes.length === 0 ? (
          <Texto style={estilos.vazio}>Nenhum alarme ativo.</Texto>
        ) : (
          <View style={{ gap: 8 }}>
            {painel.proximosAlarmes.map((a) => (
              <View key={a.id} style={estilos.itemLista}>
                <View style={estilos.alarmeHora}>
                  <Texto peso={800} style={{ color: cores.branco }}>
                    {a.hora}
                  </Texto>
                </View>
                <View style={{ flex: 1 }}>
                  <Texto peso={700} style={{ color: cores.cafeEscuro }}>
                    {a.nome}
                  </Texto>
                  <Texto style={estilos.linhaDetalhe}>{[a.pet, a.dia].filter(Boolean).join(' · ')}</Texto>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[estilos.cartao, sombras.suave]}>
        <Cabecalho titulo="Relatórios em PDF" apoio="Prontos para imprimir ou enviar" />
        <Grade colunas={2} quebras={{ 420: 1 }} gap={10}>
          {relatorios.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => baixar(r)}
              disabled={Boolean(baixando)}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.relatorio, pressed && { backgroundColor: cores.areia }]}
            >
              <DownloadIcon size={16} color={cores.cafe} />
              <Texto peso={700} style={{ color: cores.cafe }}>
                {baixando === r.id ? 'Gerando…' : r.rotulo}
              </Texto>
            </Pressable>
          ))}
        </Grade>
        <Pressable onPress={() => router.push('/admin/adocoes')} accessibilityRole="link" style={estilos.adocao}>
          <HeartIcon size={18} color={cores.rosaTexto} />
          <Texto style={{ flex: 1, color: cores.rosaTexto }}>
            <Forte>{painel.adocao.disponiveis}</Forte> disponíveis para adoção ·{' '}
            <Forte>{painel.adocao.emProcesso}</Forte> em processo
          </Texto>
          <ArrowRightIcon size={16} color={cores.rosaTexto} />
        </Pressable>
      </View>
    </View>
  )

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.pagina}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={cores.cafe} colors={[cores.cafe]} />
      }
    >
      <View style={estilos.conteudo}>
        <LinearGradient
          colors={gradientes.painel}
          locations={[0, 0.48, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[estilos.hero, !celular && estilos.heroLado, sombras.media]}
        >
          <View style={[estilos.heroTexto, !celular && { flex: 1, paddingVertical: 40, paddingHorizontal: 44 }]}>
            <Texto peso={700} style={estilos.data}>
              {agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </Texto>
            <Titulo style={[estilos.titulo, celular && { fontSize: fs(38), lineHeight: fs(43) }]}>
              {saudacao(agora.getHours())}
              {firstName ? `, ${firstName}` : ''}! {emojiDaHora(agora.getHours())}
            </Titulo>
            <Texto style={estilos.resumoTexto}>
              {!painel ? (
                'Carregando o resumo da clínica…'
              ) : painel.proximo ? (
                <>
                  Próximo atendimento às <Forte style={{ color: cores.branco }}>{painel.proximo.hora}</Forte>:{' '}
                  {painel.proximo.tipo.toLowerCase()} de{' '}
                  <Forte style={{ color: cores.branco }}>{painel.proximo.pet}</Forte>.
                </>
              ) : (
                'Nenhum atendimento pendente no restante do dia.'
              )}
            </Texto>
            {aniversariantes.length > 0 && (
              <View style={estilos.festa}>
                <Texto peso={600} style={estilos.festaTexto}>
                  🎂 Hoje é aniversário de{' '}
                  {aniversariantes.map((p, i) => (
                    <Texto
                      key={p.id}
                      peso={700}
                      onPress={() => router.push(`/pacientes/${encodeURIComponent(p.id)}`)}
                      style={estilos.festaNome}
                    >
                      {i > 0 ? (i === aniversariantes.length - 1 ? ' e ' : ', ') : ''}
                      {p.nome}
                    </Texto>
                  ))}
                  !
                </Texto>
              </View>
            )}
            <View style={estilos.atalhos}>
              {ATALHOS.map(({ to, rotulo, icone: Icone }, i) => (
                <Pressable
                  key={to}
                  onPress={() => router.push(to)}
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    estilos.atalho,
                    celular && estilos.atalhoCelular,
                    i === 0 && estilos.atalhoPrincipal,
                    pressed && { backgroundColor: cores.areia },
                  ]}
                >
                  <Icone size={17} color={i === 0 ? cores.cafeEscuroFundo : cores.branco} />
                  <Texto peso={700} style={{ fontSize: fs(17), color: i === 0 ? cores.cafeEscuroFundo : cores.branco }}>
                    {rotulo}
                  </Texto>
                </Pressable>
              ))}
            </View>
          </View>
          {/* Os bichinhos espiando na borda de baixo, como na primeira versão do painel. */}
          <Image
            source={pets}
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[estilos.heroPets, celular && estilos.heroPetsCelular]}
            contentFit="contain"
          />
        </LinearGradient>

        {error ? (
          <Texto style={estilos.erro} onPress={reload}>
            Não foi possível carregar os dados: {error}. Toque para tentar de novo.
          </Texto>
        ) : null}

        {Boolean(painel) && (
          <Grade colunas={4} quebras={{ 1100: 2 }} gap={celular ? 12 : 18}>
            {painel.indicadores.map((ind) => {
              const Icone = ICONES[ind.id]
              const tom = TOM(ind.tom)
              return (
                <Pressable
                  key={ind.id}
                  onPress={() => router.push(ind.to)}
                  accessibilityRole="link"
                  accessibilityLabel={`${ind.valor} ${ind.rotulo}`}
                  style={({ pressed }) => [
                    estilos.indicador,
                    celular && { padding: 16 },
                    { borderBottomColor: tom.cor },
                    sombras.suave,
                    pressed && { borderColor: tom.cor },
                  ]}
                >
                  <View style={[estilos.indicadorIcone, { backgroundColor: tom.fundo }]}>
                    <Icone size={22} color={tom.cor} />
                  </View>
                  <Titulo style={[estilos.indicadorValor, celular && { fontSize: fs(38), lineHeight: fs(43) }]}>
                    {String(ind.valor)}
                  </Titulo>
                  <Texto peso={700} style={estilos.indicadorRotulo}>
                    {ind.rotulo}
                  </Texto>
                  <Texto style={estilos.indicadorApoio}>{ind.apoio}</Texto>
                </Pressable>
              )
            })}
          </Grade>
        )}

        {Boolean(painel) &&
          (largo ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24 }}>
              <View style={{ flex: 1.55, gap: 20 }}>
                {agenda}
                {semana}
                {pacientes}
              </View>
              <View style={{ flex: 1 }}>{lateral}</View>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {agenda}
              {semana}
              {lateral}
              {pacientes}
            </View>
          ))}
      </View>
    </ScrollView>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cremeClaro },
  pagina: { paddingTop: 20, paddingHorizontal: MARGEM, paddingBottom: 56 },
  conteudo: { width: '100%', maxWidth: 1280, alignSelf: 'center', gap: 20 },
  hero: { overflow: 'hidden', borderRadius: 28 },
  heroLado: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 280 },
  heroTexto: { paddingTop: 28, paddingHorizontal: 24, paddingBottom: 8 },
  data: { fontSize: fs(15), letterSpacing: 0.8, color: cores.caramelo },
  titulo: { marginTop: 8, fontSize: fs(54), lineHeight: fs(59), color: cores.branco },
  resumoTexto: { marginTop: 10, fontSize: fs(19), lineHeight: fs(29), color: 'rgba(255, 255, 255, 0.85)' },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, maxWidth: 560, marginTop: 22 },
  atalho: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  atalhoCelular: { paddingHorizontal: 12 },
  atalhoPrincipal: { borderColor: cores.caramelo, backgroundColor: cores.caramelo },
  heroPets: {
    width: 380,
    aspectRatio: 998 / 561,
    alignSelf: 'flex-end',
    marginTop: 24,
    marginRight: 24,
    marginBottom: -28,
  },
  heroPetsCelular: { width: '86%', alignSelf: 'center', marginTop: 4, marginRight: 0, marginBottom: -22 },
  erro: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: cores.erroFundo,
    color: cores.erro,
  },
  indicador: {
    gap: 4,
    padding: 22,
    borderWidth: 1,
    borderBottomWidth: 4,
    borderColor: cores.borda,
    borderRadius: 22,
    backgroundColor: cores.superficie,
  },
  indicadorIcone: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: 15,
  },
  indicadorValor: { fontSize: fs(47), lineHeight: fs(52) },
  indicadorRotulo: { fontSize: fs(18), color: cores.cafeEscuro },
  indicadorApoio: { fontSize: fs(16), color: cores.taupeEscuro },
  cartao: {
    gap: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cartaoTitulo: { fontSize: fs(25), lineHeight: fs(30) },
  cartaoApoio: { marginTop: 2, fontSize: fs(16), color: cores.taupe },
  verTudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: cores.areia,
  },
  verTudoTexto: { fontSize: fs(16), color: cores.cafe },
  vazio: {
    padding: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaForte,
    borderRadius: 16,
    textAlign: 'center',
    color: cores.taupe,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: cores.borda,
    borderRadius: 16,
    backgroundColor: cores.papel,
  },
  hora: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  horaTexto: { fontSize: fs(18), color: cores.cafeEscuro },
  linhaPet: { fontSize: fs(18), color: cores.cafeEscuro },
  linhaDetalhe: { fontSize: fs(16), color: cores.taupeEscuro },
  mais: { alignSelf: 'center', fontSize: fs(16), color: cores.cafe },
  pet: {
    alignItems: 'center',
    gap: 2,
    paddingBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 16,
    backgroundColor: cores.papel,
  },
  petFoto: { width: '100%', aspectRatio: 1, marginBottom: 6 },
  petBolo: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 15,
  },
  petBoloTexto: { fontSize: 15, lineHeight: 19 },
  festa: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  festaTexto: { fontSize: fs(16), lineHeight: fs(23), color: cores.cremeFixo },
  festaNome: { color: cores.cremeFixo, textDecorationLine: 'underline' },
  petEspecie: { fontSize: fs(15), color: cores.taupe },
  barras: { flexDirection: 'row', gap: 8 },
  barraDia: { flex: 1, alignItems: 'center', gap: 4 },
  barraValor: { fontSize: fs(16), color: cores.cafeEscuro },
  barraTrilho: {
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: 44,
    height: 110,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: cores.areia,
  },
  barraNivel: { width: '100%', borderRadius: 12 },
  barraRotulo: { fontSize: fs(15), color: cores.taupeEscuro, textTransform: 'capitalize' },
  barraDiaNum: { fontSize: fs(15), color: cores.taupe },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: cores.cremeClaro,
  },
  alarmeHora: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: cores.cafeFundo },
  relatorio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 14,
    backgroundColor: cores.papel,
  },
  adocao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: cores.rosaFundo,
  },
})

/** Foto do pet; sem foto (ou se ela não abrir), a inicial na cor da espécie. */
function FotoOuInicial({ pet }) {
  const [falhou, setFalhou] = useState(false)
  const foto = photoSrc(pet.foto)
  if (foto && !falhou) {
    return <Image source={{ uri: foto }} style={estilos.petFoto} contentFit="cover" onError={() => setFalhou(true)} />
  }
  return <InicialPet nome={pet.nome} especie={pet.especie} tamanho={84} style={estilos.petFoto} />
}
