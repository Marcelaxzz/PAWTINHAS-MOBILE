import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { AlertIcon, CheckIcon } from '../../web/components/Icons/Icons.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { cores, sombras } from '../../tema.js'

/** Estilos compartilhados pelas calculadoras e catálogos (Calculadoras.module.css do site). */
export const calc = StyleSheet.create({
  layout: {},
  cartao: {
    minWidth: 0,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 22,
    backgroundColor: cores.branco,
    ...sombras.suave,
  },
  secaoSeguinte: { marginTop: 28, paddingTop: 26, borderTopWidth: 1, borderTopColor: cores.borda },
  secaoTitulo: { marginBottom: 18, fontSize: 20, lineHeight: 26 },
  dica: { marginTop: -6, marginBottom: 18, fontSize: 16, lineHeight: 23, color: cores.taupe },
  info: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 6,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: cores.superficie,
  },
  infoTexto: { fontSize: 16, color: cores.cafe },
  checks: { gap: 14, marginTop: 22 },
  resultado: { backgroundColor: cores.superficie },
  resultadoVazio: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 8 },
  rotuloResultado: { fontSize: 15, letterSpacing: 0.7, color: cores.taupe },
  destaque: { marginTop: 6, fontSize: 34, lineHeight: 39 },
  destaqueApoio: { marginTop: 6, fontSize: 16, lineHeight: 23, color: cores.cafe },
  numeros: { gap: 10, marginTop: 22 },
  formula: { marginTop: 18, fontSize: 15, lineHeight: 20, color: cores.taupe },
  acoes: { gap: 10, marginTop: 22 },
  carregando: { opacity: 0.55 },
  referencia: {
    gap: 4,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: cores.caramelo,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: cores.cremeClaro,
  },
  referenciaTexto: { fontSize: 16, lineHeight: 23, color: cores.cafeMedio },
  fonteMed: { fontSize: 15, lineHeight: 19, color: cores.taupe },
  fontes: { gap: 4, marginTop: 10, paddingLeft: 4 },

  // Catálogos
  barra: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lista: { gap: 16 },
  item: {
    gap: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 20,
    backgroundColor: cores.branco,
    ...sombras.suave,
  },
  itemTopo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  itemNome: { flex: 1, fontSize: 20, lineHeight: 26 },
  itemApoio: { fontSize: 16, color: cores.taupe },
  itemFonte: { fontSize: 15, fontStyle: 'italic', color: cores.taupe },
  itemDados: { gap: 4 },
  itemDado: { flexDirection: 'row', gap: 12 },
  itemDadoRotulo: { width: 96, fontSize: 16, color: cores.taupe },
  itemDadoValor: { flex: 1, fontSize: 16, color: cores.cafeEscuro },
  itemAcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 6 },
})

/** Bloco com título (as seções Paciente, Medicamento, Posologia...). */
/** Foto no topo do cartão do catálogo, com as etiquetas por cima (CartaoCatalogo do site). */
/**
 * Topo dos cartões dos catálogos (CartaoCatalogo.jsx do site): a foto real do produto à esquerda,
 * sem moldura, e as etiquetas, o nome e o apoio à direita. ajuste "inteira" mostra a embalagem toda;
 * "preenche" cobre o espaço (fotos de materiais, que têm cenário).
 */
export function ProdutoTopo({ source, ajuste = 'inteira', etiquetas = [], children }) {
  const preenche = ajuste === 'preenche'
  return (
    <View style={estilos.produto}>
      <View style={[estilos.produtoFoto, preenche && estilos.produtoFotoCheia]}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit={preenche ? 'cover' : 'contain'} />
      </View>
      <View style={estilos.produtoTexto}>
        <View style={estilos.produtoEtiquetas}>
          {etiquetas.filter(Boolean).map((e, i) => (
            <Texto key={e} peso={700} style={[estilos.produtoEtiqueta, i === 0 && { backgroundColor: cores.caramelo }]}>
              {e}
            </Texto>
          ))}
        </View>
        {children}
      </View>
    </View>
  )
}

/** Seção do formulário com o título numerado (1 Paciente, 2 Medicamento...), como no site. */
export function Secao({ titulo, numero, primeira = false, children }) {
  return (
    <View style={!primeira && calc.secaoSeguinte}>
      <View style={estilos.secaoTopo}>
        {numero ? (
          <View style={estilos.secaoNumero}>
            <Texto peso={800} style={estilos.secaoNumeroTexto}>
              {numero}
            </Texto>
          </View>
        ) : null}
        <Titulo peso={800} style={[calc.secaoTitulo, { marginBottom: 0 }]}>
          {titulo}
        </Titulo>
      </View>
      {children}
    </View>
  )
}

/** Resultado antes do cálculo: o que já foi preenchido e o que falta (Pendencias.jsx do site). */
export function Pendencias({ icone: Icone, titulo, itens }) {
  const faltam = itens.filter((i) => !i.ok).length
  return (
    <View style={calc.resultadoVazio}>
      <View style={estilos.pendIcone}>
        <Icone size={28} color={cores.cafe} />
      </View>
      <Titulo peso={800} style={estilos.pendTitulo}>
        {titulo}
      </Titulo>
      <Texto style={estilos.pendContagem}>{faltam === 1 ? 'Falta 1 campo' : `Faltam ${faltam} campos`}</Texto>
      <View style={estilos.pendLista}>
        {itens.map((i) => (
          <View
            key={i.rotulo}
            style={[estilos.pendItem, i.ok && estilos.pendItemFeito]}
            accessibilityLabel={`${i.rotulo}: ${i.ok ? 'preenchido' : 'falta'}`}
          >
            <View style={[estilos.pendMarca, i.ok && estilos.pendMarcaFeita]}>
              {i.ok ? <CheckIcon size={14} strokeWidth={3} color={cores.branco} /> : null}
            </View>
            <Texto peso={600} style={{ color: i.ok ? cores.salviaTexto : cores.cafe }}>
              {i.rotulo}
            </Texto>
          </View>
        ))}
      </View>
    </View>
  )
}

/** Caixa de seleção com texto e explicação menor (label.check do site). */
export function CheckItem({ checked, onChange, disabled, titulo, apoio, compacto = false }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={[estilos.check, disabled && { opacity: 0.6 }]}
    >
      <View style={[estilos.caixa, checked && estilos.caixaMarcada]}>
        {checked && <CheckIcon size={12} strokeWidth={3} color={cores.branco} />}
      </View>
      <View style={!compacto && { flex: 1 }}>
        <Texto peso={compacto ? 500 : 600} style={[estilos.checkTexto, compacto && { fontSize: 17 }]}>
          {titulo}
        </Texto>
        {apoio ? <Texto style={estilos.checkApoio}>{apoio}</Texto> : null}
      </View>
    </Pressable>
  )
}

/** Um número do resultado (dt/dd do site). */
export function Numero({ rotulo, valor, style }) {
  return (
    <View style={[estilos.numero, style]}>
      <Texto peso={600} style={estilos.numeroRotulo}>
        {rotulo}
      </Texto>
      <Texto peso={700} style={estilos.numeroValor}>
        {valor}
      </Texto>
    </View>
  )
}

/** Alerta (vermelho), aviso (mel) ou erro (tracejado). */
export function Mensagem({ tipo = 'aviso', children }) {
  const cor = { alerta: cores.erro, aviso: cores.aviso, erro: cores.taupe }[tipo]
  return (
    <View style={[estilos.mensagem, estilos[tipo]]} accessibilityRole={tipo === 'alerta' ? 'alert' : undefined}>
      {tipo !== 'aviso' && <AlertIcon size={16} color={cor} style={{ marginTop: 2 }} />}
      <Texto style={[estilos.mensagemTexto, { color: cor }]}>{children}</Texto>
    </View>
  )
}

/** Numeros em duas colunas (uma só abaixo de 420px, como no site). */
export function GradeNumeros({ children, largura }) {
  const duas = largura > 420
  return <View style={[calc.numeros, duas && { flexDirection: 'row', flexWrap: 'wrap' }]}>{children}</View>
}

const estilos = StyleSheet.create({
  produto: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  produtoFoto: { width: 116, height: 150 },
  produtoFotoCheia: { overflow: 'hidden', borderRadius: 14 },
  produtoTexto: { flex: 1, gap: 6 },
  produtoEtiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  produtoEtiqueta: {
    paddingVertical: 3,
    paddingHorizontal: 11,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: cores.creme,
    fontSize: 15,
    color: cores.cafe,
  },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  secaoNumero: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.areia,
  },
  secaoNumeroTexto: { fontSize: 17, color: cores.cafe },
  pendIcone: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.areia,
  },
  pendTitulo: { marginTop: 6, fontSize: 23, lineHeight: 29, textAlign: 'center' },
  pendContagem: { fontSize: 17, color: cores.taupe },
  pendLista: { alignSelf: 'stretch', gap: 8, marginTop: 14 },
  pendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaForte,
    borderRadius: 14,
    backgroundColor: cores.branco,
  },
  pendItemFeito: { borderStyle: 'solid', borderColor: 'transparent', backgroundColor: cores.salviaFundo },
  pendMarca: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: cores.bordaForte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendMarcaFeita: { borderColor: cores.salviaTexto, backgroundColor: cores.salviaTexto },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  caixa: {
    width: 18,
    height: 18,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: cores.bordaForte,
    borderRadius: 4,
    backgroundColor: cores.branco,
  },
  caixaMarcada: { backgroundColor: cores.cafe, borderColor: cores.cafe },
  checkTexto: { fontSize: 16, lineHeight: 23 },
  checkApoio: { fontSize: 16, lineHeight: 23, color: cores.taupe },
  numero: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.branco,
  },
  numeroRotulo: { fontSize: 15, color: cores.taupe },
  numeroValor: { marginTop: 2, fontSize: 18, color: cores.cafeEscuro },
  mensagem: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  alerta: { backgroundColor: cores.erroFundo },
  aviso: { backgroundColor: cores.avisoFundo },
  erro: { backgroundColor: cores.branco, borderWidth: 1, borderStyle: 'dashed', borderColor: cores.borda },
  mensagemTexto: { flex: 1, fontSize: 16, lineHeight: 23 },
})
