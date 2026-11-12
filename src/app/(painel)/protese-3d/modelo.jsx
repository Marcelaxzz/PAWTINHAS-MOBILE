import { useId, useMemo, useState } from 'react'
import { PanResponder, Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LinearGradient as Fundo } from 'expo-linear-gradient'
import Svg, {
  ClipPath,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { Page } from '../../../componentes/Page.jsx'
import { Field, FieldGrid } from '../../../componentes/ui/Field.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { DownloadIcon } from '../../../web/components/Icons/Icons.jsx'
import { useCollections } from '../../../web/hooks/useCollections.js'
import { useToast } from '../../../web/hooks/useToast.js'
import { formatDateBr } from '../../../web/utils/dates.js'
import { formatNumber, maskDecimal, parseDecimal } from '../../../web/utils/numbers.js'
import { proteseTabs } from '../../../web/pages/protese/proteseTabs.js'
import {
  MATERIAIS,
  PADRAO,
  dimensoes,
  malha,
  material,
  stl,
} from '../../../web/pages/protese/impressao/modeloProtese.js'
import { INCLINACAO, vista3d } from '../../../web/pages/protese/impressao/vista3d.js'
import { usePetFromQuery } from '../../../protese/usePetFromQuery.js'
import { salvarArquivo } from '../../../plataforma/salvarArquivo'
import { cores, sombras, texto } from '../../../tema.js'
import { Grade } from '../../../componentes/ui/Grade.jsx'

/** O modelo calcula em milímetros (unidade do STL); a tela mostra em centímetros. */
const cm = (mm) => `${formatNumber(mm / 10, 1)} cm`
const emCm = (mm) => formatNumber(mm / 10, 2).replace(/\./g, '')
/** Campo em cm → mm para o cálculo. */
const paraMm = (texto) => (parseDecimal(texto) == null ? null : parseDecimal(texto) * 10)

/** "Paçoca" → "pacoca", para o nome do arquivo. */
const slug = (valor) =>
  valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export default function ProteseModelo() {
  const { query } = usePetFromQuery()
  const { data, loading, error, reload } = useCollections(['pets', 'medicoes'])

  return (
    <Page
      width="largo"
      title="Modelo para impressão 3D"
      subtitle="Gere o arquivo da prótese a partir de uma medição salva e leve para o fatiador da impressora."
      tabs={proteseTabs(query)}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && <Modelo pets={data.pets} medicoes={data.medicoes} />}
    </Page>
  )
}

function Dado({ rotulo, valor }) {
  return (
    <View style={estilos.dado}>
      <Texto style={estilos.dt}>{rotulo}</Texto>
      <Texto peso={700} style={{ marginTop: 2 }}>
        {valor}
      </Texto>
    </View>
  )
}

function Modelo({ pets, medicoes }) {
  const params = useLocalSearchParams()
  const router = useRouter()
  const toast = useToast()
  const [petId, setPetId] = useState(typeof params.pet === 'string' ? params.pet : '')
  const doPet = useMemo(
    () => medicoes.filter((m) => m.petId === petId).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [medicoes, petId],
  )
  const [medicaoId, setMedicaoId] = useState(typeof params.medicao === 'string' ? params.medicao : '')
  const medicao = doPet.find((m) => m.id === medicaoId) ?? doPet[0]
  const pet = pets.find((p) => p.id === petId)
  const [baixando, setBaixando] = useState(false)

  const [ajustes, setAjustes] = useState({
    folga: emCm(PADRAO.folgaMm),
    parede: emCm(PADRAO.paredeMm),
    profundidade: '',
    encaixe: '',
    tipo: 'PETG',
  })
  const [vista, setVista] = useState('3d')
  const set = (campo) => (valor) => setAjustes((a) => ({ ...a, [campo]: valor }))
  const setCm = (campo) => (valor) => setAjustes((a) => ({ ...a, [campo]: maskDecimal(valor, 5) }))

  const pacientesComMedicao = pets.filter((p) => medicoes.some((m) => m.petId === p.id))
  const encaixe = medicao?.larguraEncaixe ?? parseDecimal(ajustes.encaixe)

  let calculo = null
  let problema = ''
  if (medicao) {
    try {
      const d = dimensoes({
        larguraEncaixe: encaixe,
        alturaChao: medicao.alturaChao,
        larguraPata: medicao.larguraPata,
        folgaMm: paraMm(ajustes.folga) ?? PADRAO.folgaMm,
        paredeMm: Math.max(1.2, paraMm(ajustes.parede) ?? PADRAO.paredeMm),
        profundidadeMm: paraMm(ajustes.profundidade) ?? undefined,
      })
      calculo = { d, m: material(d.volumeCm3, ajustes.tipo) }
    } catch (e) {
      problema = e.message
    }
  }

  const baixar = async () => {
    setBaixando(true)
    try {
      const arquivo = stl(malha(calculo.d), `Pawtinhas - ${pet?.nome ?? 'protese'}`)
      await salvarArquivo(
        arquivo,
        `protese-${slug(pet?.nome ?? 'pet')}-${slug(medicao.membro ?? 'membro')}.stl`,
        'model/stl',
      )
    } catch (err) {
      toast.error(err.message || 'Não foi possível gerar o arquivo.')
    } finally {
      setBaixando(false)
    }
  }

  if (pacientesComMedicao.length === 0) {
    return (
      <EmptyState
        title="Nenhuma medição salva ainda"
        action={<PillButton to="/protese-3d/medicao">Fazer uma medição</PillButton>}
      >
        O modelo é gerado a partir das medidas registradas na ficha do paciente.
      </EmptyState>
    )
  }

  return (
    <Grade colunas={2} quebras={{ 980: 1 }} gap={24} esticar={false}>
      <View style={[estilos.cartao, sombras.suave]}>
        <Titulo style={estilos.titulo}>Medição</Titulo>
        <FieldGrid>
          <Field
            label="Paciente"
            as="select"
            placeholder="Selecione…"
            options={[...pacientesComMedicao]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((p) => ({ value: p.id, label: p.nome }))}
            value={petId}
            onChange={(v) => {
              setPetId(v)
              setMedicaoId('')
            }}
          />
          <Field
            label="Medição"
            as="select"
            placeholder="Selecione…"
            options={doPet.map((m) => ({
              value: m.id,
              label: `${formatDateBr(m.criadoEm.slice(0, 10))} · ${m.membro ?? 'membro não informado'}`,
            }))}
            value={medicao?.id ?? ''}
            onChange={setMedicaoId}
          />
        </FieldGrid>

        {medicao && (
          <View style={estilos.grade}>
            <Dado rotulo="Altura até o chão" valor={`${formatNumber(medicao.alturaChao, 1)} cm`} />
            <Dado rotulo="Largura da pata" valor={`${formatNumber(medicao.larguraPata, 1)} cm`} />
            <Dado
              rotulo="Largura no encaixe"
              valor={medicao.larguraEncaixe ? `${formatNumber(medicao.larguraEncaixe, 1)} cm` : 'não medida'}
            />
            <Dado rotulo="Comprimento do membro" valor={`${formatNumber(medicao.comprimentoMembro, 1)} cm`} />
          </View>
        )}

        {medicao && !medicao.larguraEncaixe && (
          <Field
            label="Largura no encaixe (cm)"
            inputMode="decimal"
            placeholder="Ex.: 4,2"
            hint="Esta medição é anterior à quarta medida. Meça com a fita ou faça uma nova medição."
            value={ajustes.encaixe}
            onChange={(v) => setAjustes((a) => ({ ...a, encaixe: maskDecimal(v, 5) }))}
          />
        )}

        <Titulo style={estilos.titulo}>Ajustes da peça</Titulo>
        <FieldGrid>
          <Field
            label="Folga interna (cm)"
            inputMode="decimal"
            hint="Espaço para espuma ou meia de proteção."
            value={ajustes.folga}
            onChange={setCm('folga')}
          />
          <Field
            label="Parede (cm)"
            inputMode="decimal"
            hint="Mínimo de 0,12 cm."
            value={ajustes.parede}
            onChange={setCm('parede')}
          />
          <Field
            label="Profundidade do soquete (cm)"
            inputMode="decimal"
            placeholder={calculo ? emCm(calculo.d.profundidade) : ''}
            hint="Em branco: 1,2 × o diâmetro interno."
            value={ajustes.profundidade}
            onChange={setCm('profundidade')}
          />
          <Field
            label="Material"
            as="select"
            options={Object.keys(MATERIAIS).map((t) => ({ value: t, label: t }))}
            value={ajustes.tipo}
            onChange={set('tipo')}
          />
        </FieldGrid>
      </View>

      <View style={[estilos.cartao, sombras.suave]} accessibilityLiveRegion="polite">
        <View style={estilos.cabecalhoVista}>
          <Titulo style={estilos.titulo}>Pré-visualização</Titulo>
          {calculo && (
            <View style={estilos.alternar} accessibilityRole="radiogroup" accessibilityLabel="Tipo de vista">
              {[
                ['3d', 'Peça em 3D'],
                ['corte', 'Corte com medidas'],
              ].map(([valor, rotulo]) => {
                const ativo = vista === valor
                return (
                  <Pressable
                    key={valor}
                    onPress={() => setVista(valor)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}
                    style={[estilos.alternarBotao, ativo && { backgroundColor: cores.cafe }]}
                  >
                    <Texto peso={600} style={[estilos.alternarTexto, ativo && { color: cores.branco }]}>
                      {rotulo}
                    </Texto>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
        {problema ? <Texto style={estilos.problema}>{problema}</Texto> : null}
        {!calculo && !problema ? <PecaFantasma /> : null}
        {calculo && (
          <>
            {vista === '3d' ? <Vista3D d={calculo.d} /> : <VistaLateral d={calculo.d} />}
            <View style={estilos.grade}>
              <Dado rotulo="Altura total" valor={cm(calculo.d.alturaTotal)} />
              <Dado rotulo="Diâmetro interno" valor={cm(calculo.d.raioInterno * 2)} />
              <Dado rotulo="Volume (maciço)" valor={`${formatNumber(calculo.d.volumeCm3, 1)} cm³`} />
              <Dado
                rotulo={`${ajustes.tipo} (maciço)`}
                valor={`${formatNumber(calculo.m.massaG, 0)} g · ${formatNumber(calculo.m.filamentoM, 1)} m`}
              />
            </View>
            <Texto style={estilos.nota}>
              Massa da peça 100% preenchida, com densidade de {formatNumber(calculo.m.densidade, 2)} g/cm³ (
              {calculo.m.fonte}) e filamento de 1,75 mm. O fatiador calcula o valor final pelo preenchimento escolhido.
              Imprima de pé, com a base no prato: o cone de 45° dispensa suporte. O arquivo já sai no tamanho real (o
              fatiador lê em milímetros), então não precisa aumentar nem diminuir a escala.
            </Texto>
            <PillButton size="lg" onPress={baixar} loading={baixando}>
              <DownloadIcon size={18} />
              Baixar arquivo STL
            </PillButton>
          </>
        )}
        {!petId && (
          <Texto style={estilos.nota}>Escolha o paciente e a medição para ver a peça e baixar o arquivo.</Texto>
        )}
        {!medicao && petId ? (
          <Texto style={estilos.nota}>
            Este paciente ainda não tem medição.{' '}
            <Texto
              style={[estilos.nota, { textDecorationLine: 'underline' }]}
              onPress={() => router.push(`/protese-3d/medicao?pet=${petId}`)}
            >
              Medir agora
            </Texto>
          </Texto>
        ) : null}
      </View>
    </Grade>
  )
}

/** Gradientes e formas da vista 3D (as mesmas do site). */
function Formas3D({ vista, id }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}-lateral`} x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#7a4b2c" />
          <Stop offset="0.28" stopColor="#e9c193" />
          <Stop offset="0.45" stopColor="#d8a16b" />
          <Stop offset="1" stopColor="#6e4329" />
        </LinearGradient>
        <LinearGradient id={`${id}-tampa`} x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#f6dfc0" />
          <Stop offset="1" stopColor="#e2b685" />
        </LinearGradient>
        <LinearGradient id={`${id}-boca`} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#2a1a11" />
          <Stop offset="1" stopColor="#6b4329" />
        </LinearGradient>
        <RadialGradient id={`${id}-sombra`}>
          <Stop offset="0" stopColor="#36241a" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#36241a" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id={`${id}-recorte`}>
          <Path d={vista.recorteBoca} />
        </ClipPath>
      </Defs>
      {vista.formas.map((f, i) => (
        <Path
          key={i}
          d={f.d}
          fill={`url(#${id}-${f.tipo === 'fundo' ? 'tampa' : f.tipo})`}
          stroke={f.tipo === 'sombra' || f.tipo === 'boca' ? undefined : 'rgba(54, 36, 26, 0.35)'}
          strokeWidth={0.6}
          strokeLinejoin="round"
          clipPath={f.tipo === 'fundo' ? `url(#${id}-recorte)` : undefined}
        />
      ))}
    </>
  )
}

const limitar = (v) => Math.min(INCLINACAO.maxima, Math.max(INCLINACAO.minima, v))

/** Peça em perspectiva; arrastar na vertical inclina a câmera. */
function Vista3D({ d }) {
  const id = useId().replace(/:/g, '')
  const [inclinacao, setInclinacao] = useState(INCLINACAO.padrao)
  // Ângulo no começo do arraste e o atual, fora do estado para o PanResponder (criado uma vez) enxergar.
  const [arraste] = useState(() => {
    const angulo = { inicio: INCLINACAO.padrao, atual: INCLINACAO.padrao }
    const mudar = (valor) => {
      angulo.atual = limitar(valor)
      setInclinacao(angulo.atual)
    }
    const gestos = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => (angulo.inicio = angulo.atual),
      onPanResponderMove: (_, g) => mudar(angulo.inicio + g.dy * 0.3),
    })
    return { gestos, inclinar: (passo) => mudar(angulo.atual + passo) }
  })
  const vista = vista3d(d, inclinacao)

  return (
    <Fundo colors={[cores.cremeClaro, cores.areia]} style={estilos.palco}>
      <View
        {...arraste.gestos.panHandlers}
        style={{ width: '100%', aspectRatio: vista.largura / vista.altura, maxHeight: 380 }}
        accessibilityRole="adjustable"
        accessibilityLabel={`Prótese em 3D, inclinada ${Math.round(vista.inclinacao)} graus`}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => arraste.inclinar(e.nativeEvent.actionName === 'increment' ? 4 : -4)}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${vista.largura} ${vista.altura}`}>
          <Formas3D vista={vista} id={id} />
        </Svg>
      </View>
      <Texto style={estilos.dicaArraste}>Arraste para cima ou para baixo para inclinar a peça</Texto>
    </Fundo>
  )
}

/** Silhueta clara da peça enquanto nenhuma medição foi escolhida. */
function PecaFantasma() {
  const id = useId().replace(/:/g, '')
  const vista = useMemo(
    () => vista3d(dimensoes({ larguraEncaixe: 4, alturaChao: 14, larguraPata: 5, folgaMm: 2, paredeMm: 3 })),
    [],
  )
  return (
    <View
      style={[estilos.palco, estilos.fantasma]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ width: '100%', aspectRatio: vista.largura / vista.altura, maxHeight: 240 }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${vista.largura} ${vista.altura}`}>
          <Formas3D vista={vista} id={id} />
        </Svg>
      </View>
    </View>
  )
}

/** Desenho em escala, com as cotas principais. */
function VistaLateral({ d }) {
  const margem = 34
  const largura = d.raioBase * 2 + margem * 2 + 70
  const altura = d.alturaTotal + margem * 2
  const cx = margem + d.raioBase
  const y = (z) => altura - margem - z
  const topo = d.zFundoInterno + d.profundidade

  const contorno = [
    [cx - d.raioBase, y(0)],
    [cx - d.raioBase, y(d.alturaBase)],
    [cx - d.raioHaste, y(d.alturaBase)],
    [cx - d.raioHaste, y(d.zCone)],
    [cx - d.raioExterno, y(d.zFundo)],
    [cx - d.raioExterno, y(topo)],
    [cx - d.raioInterno, y(topo)],
    [cx - d.raioInterno, y(d.zFundoInterno)],
    [cx + d.raioInterno, y(d.zFundoInterno)],
    [cx + d.raioInterno, y(topo)],
    [cx + d.raioExterno, y(topo)],
    [cx + d.raioExterno, y(d.zFundo)],
    [cx + d.raioHaste, y(d.zCone)],
    [cx + d.raioHaste, y(d.alturaBase)],
    [cx + d.raioBase, y(d.alturaBase)],
    [cx + d.raioBase, y(0)],
  ]
  const xCota = cx + d.raioBase + 30
  const cota = { stroke: cores.ceu, strokeWidth: 1.5, strokeDasharray: [4, 3] }
  const textoCota = { fontSize: 15, fontFamily: texto(600).fontFamily, fill: cores.ceuTexto }

  return (
    <View
      style={{ width: '100%', aspectRatio: largura / altura, maxHeight: 420, alignSelf: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={`Prótese com ${cm(d.alturaTotal)} de altura e soquete de ${cm(d.raioInterno * 2)}`}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${largura} ${altura}`}>
        <Line x1="0" x2={largura} y1={y(0)} y2={y(0)} stroke={cores.bordaForte} strokeWidth={2} />
        <Polygon
          points={contorno.map((p) => p.join(',')).join(' ')}
          fill="rgba(216, 161, 107, 0.35)"
          stroke={cores.cafe}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Line x1={xCota} x2={xCota} y1={y(0)} y2={y(d.zFundoInterno)} {...cota} />
        <SvgText x={xCota + 6} y={y(d.zFundoInterno / 2)} {...textoCota}>
          {cm(d.zFundoInterno)}
        </SvgText>
        <Line x1={xCota} x2={xCota} y1={y(d.zFundoInterno)} y2={y(topo)} {...cota} />
        <SvgText x={xCota + 6} y={y(d.zFundoInterno + d.profundidade / 2)} {...textoCota}>
          {cm(d.profundidade)}
        </SvgText>
        <SvgText x={cx} y={y(topo) - 10} textAnchor="middle" {...textoCota}>
          Ø {cm(d.raioInterno * 2)}
        </SvgText>
        <SvgText x={cx} y={y(0) + 22} textAnchor="middle" {...textoCota}>
          Ø {cm(d.raioBase * 2)}
        </SvgText>
      </Svg>
    </View>
  )
}

const estilos = StyleSheet.create({
  cartao: {
    gap: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  titulo: { fontSize: 23, lineHeight: 28 },
  cabecalhoVista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  alternar: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.cremeClaro,
  },
  alternarBotao: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 },
  alternarTexto: { fontSize: 15, lineHeight: 18, color: cores.taupe },
  palco: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fantasma: { opacity: 0.35, backgroundColor: cores.cremeClaro },
  dicaArraste: { fontSize: 15, lineHeight: 18, color: cores.taupe, textAlign: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dado: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: cores.cremeClaro,
  },
  dt: { fontSize: 15, color: cores.taupe },
  nota: { fontSize: 16, lineHeight: 23, color: cores.taupe },
  problema: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: cores.avisoFundo,
    color: cores.aviso,
  },
})
