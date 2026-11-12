import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Field, FieldGrid } from '../../componentes/ui/Field.jsx'
import { ConfirmDialog, Dialog } from '../../componentes/ui/Dialog.jsx'
import { PillButton } from '../../componentes/ui/PillButton.jsx'
import { Chip } from '../../componentes/ui/Chip.jsx'
import { Grade } from '../../componentes/ui/Grade.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import {
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '../../web/components/Icons/Icons.jsx'
import { useToast } from '../../web/hooks/useToast.js'
import { estoqueService, relatoriosService } from '../../web/services/gestaoService.js'
import { formatDateBr, maskDate, parseDateBr } from '../../web/utils/dates.js'
import { maskDecimal, parseDecimal } from '../../web/utils/numbers.js'
import { FILTROS_ESTOQUE, MOTIVOS, qtd, SITUACOES } from '../../web/pages/calculadoras/Catalogos/estoque.js'
import { cores } from '../../tema.js'

const TONS = {
  neutro: { cor: cores.cafe, fundo: cores.superficie },
  perigo: { cor: cores.erro, fundo: cores.erroFundo },
  alerta: { cor: cores.melTexto, fundo: cores.melFundo },
  sucesso: { cor: cores.sucesso, fundo: cores.sucessoFundo },
}
const BARRA = { perigo: cores.erro, alerta: cores.mel, sucesso: cores.sucesso }

/** Indicadores no topo do catálogo + relatório em PDF (ResumoEstoque do site). */
export function ResumoEstoque({ itens, filtro, onFiltro }) {
  const toast = useToast()
  const [baixando, setBaixando] = useState(false)
  const lista = Object.values(itens ?? {})
  const contar = (id) => lista.filter(FILTROS_ESTOQUE.find((f) => f.id === id).test).length
  const cards = [
    { id: 'todos', valor: lista.filter((i) => i.saldo > 0).length, rotulo: 'com estoque', tom: 'neutro' },
    { id: 'repor', valor: contar('repor'), rotulo: 'para repor', tom: 'perigo' },
    { id: 'validade', valor: contar('validade'), rotulo: 'vencendo', tom: 'alerta' },
    { id: 'emDia', valor: contar('emDia'), rotulo: 'em dia', tom: 'sucesso' },
  ]

  const relatorio = async () => {
    setBaixando(true)
    try {
      await relatoriosService.pdfEstoque()
      toast.success('Relatório de estoque pronto.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <View style={{ gap: 14 }} accessibilityLabel="Resumo do estoque">
      <Grade colunas={4} quebras={{ 760: 2 }} gap={12}>
        {cards.map((c) => {
          const ativo = filtro === c.id && c.id !== 'todos'
          const tom = TONS[c.tom]
          return (
            <Pressable
              key={c.id}
              onPress={() => onFiltro(filtro === c.id ? 'todos' : c.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              style={[
                estilos.indicador,
                { borderLeftColor: tom.cor, backgroundColor: tom.fundo },
                ativo && { borderColor: cores.caramelo, borderWidth: 2 },
              ]}
            >
              <Titulo style={[estilos.indicadorValor, { color: tom.cor }]}>{itens ? String(c.valor) : '–'}</Titulo>
              <Texto style={estilos.indicadorRotulo}>{c.rotulo}</Texto>
            </Pressable>
          )
        })}
      </Grade>
      <PillButton variant="contorno" onPress={relatorio} loading={baixando} style={{ alignSelf: 'flex-start' }}>
        <DownloadIcon size={16} />
        Relatório de estoque (PDF)
      </PillButton>
    </View>
  )
}

/** Editar e excluir em ícones no canto do cartão (AcoesItem do site). */
export function AcoesItem({ nome, onEditar, onExcluir }) {
  return (
    <View style={estilos.acoesItem}>
      <Pressable
        onPress={onEditar}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${nome}`}
        style={({ pressed }) => [estilos.icone, pressed && estilos.iconePressionado]}
      >
        <PencilIcon size={17} color={cores.taupeEscuro} />
      </Pressable>
      <Pressable
        onPress={onExcluir}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${nome}`}
        style={({ pressed }) => [estilos.icone, pressed && { backgroundColor: cores.erroFundo }]}
      >
        <TrashIcon size={17} color={cores.erro} />
      </Pressable>
    </View>
  )
}

/** Caixinhas lado a lado (doses de cães e gatos, energia da ração). */
export function Caixas({ itens }) {
  return (
    <View style={estilos.caixas}>
      {itens.map(([rotulo, valor]) => (
        <View key={rotulo} style={estilos.caixa}>
          <Texto style={estilos.caixaRotulo}>{rotulo}</Texto>
          <Texto peso={700} style={estilos.caixaValor}>
            {valor}
          </Texto>
        </View>
      ))}
    </View>
  )
}

/** Observações e fonte recolhidas, abrem ao tocar (o <details> do site). */
export function Notas({ titulo = 'Notas', children }) {
  const [aberto, setAberto] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        style={estilos.notasBotao}
        hitSlop={8}
      >
        <View style={{ transform: [{ rotate: aberto ? '0deg' : '-90deg' }] }}>
          <ChevronDownIcon size={15} color={cores.cafe} />
        </View>
        <Texto peso={700} style={estilos.notasTitulo}>
          {titulo}
        </Texto>
      </Pressable>
      {aberto ? <View style={{ gap: 6 }}>{children}</View> : null}
    </View>
  )
}

/** Faixa de estoque no rodapé do cartão (PainelEstoque do site). */
/** Linha curta de estoque para o cartão do catálogo (EstoqueCompacto do site). */
export function EstoqueCompacto({ item }) {
  if (!item) return <Texto style={estilos.apoio}>Carregando estoque…</Texto>
  const situacao = SITUACOES[item.situacao] ?? SITUACOES.Normal
  return (
    <View style={estilos.compacto}>
      <Titulo style={estilos.saldo}>{qtd(item.saldo, item.unidade)}</Titulo>
      <Chip tone={situacao.tom} size="xs">
        {situacao.texto}
      </Chip>
    </View>
  )
}

export function PainelEstoque({ item, onAcao }) {
  if (!item) return <Texto style={estilos.apoio}>Carregando estoque…</Texto>
  const situacao = SITUACOES[item.situacao] ?? SITUACOES.Normal
  const referencia = Math.max(item.minimo ? item.minimo * 2 : 0, item.saldo, 1)
  const nivel = Math.min(100, (item.saldo / referencia) * 100)
  const botoes = [
    ['entrada', 'Registrar entrada', <PlusIcon key="e" size={17} strokeWidth={2.4} color={cores.cafe} />],
    [
      'saida',
      'Registrar saída',
      <Texto key="s" peso={700} style={estilos.menos}>
        −
      </Texto>,
    ],
    ['historico', 'Lotes e histórico', <ClockIcon key="h" size={17} color={cores.cafe} />],
  ]

  return (
    <View style={estilos.painel}>
      <View style={estilos.painelTopo}>
        <Titulo style={estilos.saldo}>{qtd(item.saldo, item.unidade)}</Titulo>
        <Chip tone={situacao.tom} size="xs">
          {situacao.texto}
        </Chip>
      </View>
      <View style={estilos.barra}>
        <View style={[estilos.barraNivel, { width: `${nivel}%`, backgroundColor: BARRA[situacao.tom] }]} />
        {item.minimo ? (
          <View style={[estilos.barraMinimo, { left: `${Math.min(100, (item.minimo / referencia) * 100)}%` }]} />
        ) : null}
      </View>
      <View style={estilos.painelRodape}>
        <Pressable onPress={() => onAcao('minimo', item)} accessibilityRole="button" style={{ flex: 1 }} hitSlop={6}>
          <Texto style={estilos.minimo}>
            {item.minimo ? `Mín. ${qtd(item.minimo, item.unidade)}` : 'Definir mínimo'}
            {item.proximaValidade ? ` · vence ${formatDateBr(item.proximaValidade)}` : ''}
          </Texto>
        </Pressable>
        <View style={estilos.acoes}>
          {botoes.map(([acao, rotulo, icone]) => {
            const desligado = acao === 'saida' && item.saldo <= 0
            return (
              <Pressable
                key={acao}
                onPress={() => onAcao(acao, item)}
                disabled={desligado}
                accessibilityRole="button"
                accessibilityLabel={rotulo}
                style={({ pressed }) => [
                  estilos.acao,
                  pressed && estilos.acaoPressionada,
                  desligado && { opacity: 0.45 },
                ]}
              >
                {icone}
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

/** Entrada, saída ou mínimo (MovimentoDialog do site). */
export function MovimentoDialog({ acao, item, nome, onClose, onSaved }) {
  const toast = useToast()
  const [valores, setValores] = useState({
    quantidade: acao === 'minimo' && item.minimo != null ? String(item.minimo).replace('.', ',') : '',
    lote: '',
    validade: '',
    motivo: MOTIVOS[acao]?.[0] ?? '',
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const set = (campo, mascara) => (v) => {
    setValores((atual) => ({ ...atual, [campo]: mascara ? mascara(v) : v }))
    setErros((atual) => ({ ...atual, [campo]: '' }))
  }

  const salvar = async () => {
    const quantidade = parseDecimal(valores.quantidade)
    if (acao !== 'minimo' && !(quantidade > 0)) return setErros({ quantidade: 'Informe a quantidade.' })
    if (acao === 'saida' && quantidade > item.saldo)
      return setErros({ quantidade: `Só há ${qtd(item.saldo, item.unidade)} em estoque.` })
    const validade = valores.validade ? parseDateBr(valores.validade) : null
    if (valores.validade && !validade) return setErros({ validade: 'Use o formato dd/mm/aaaa.' })

    setSalvando(true)
    try {
      const base = { categoria: item.categoria, itemId: item.itemId }
      const salvo =
        acao === 'entrada'
          ? await estoqueService.entrada({
              ...base,
              quantidade,
              lote: valores.lote.trim(),
              validade,
              motivo: valores.motivo,
            })
          : acao === 'saida'
            ? await estoqueService.saida({ ...base, quantidade, motivo: valores.motivo })
            : await estoqueService.minimo({ ...base, minimo: valores.quantidade === '' ? null : quantidade })
      toast.success(
        acao === 'minimo' ? 'Estoque mínimo salvo.' : `${acao === 'entrada' ? 'Entrada' : 'Saída'} registrada.`,
      )
      onSaved(salvo)
    } catch (err) {
      if (err.fields) setErros(err.fields.minimo ? { quantidade: err.fields.minimo } : err.fields)
      toast.error(err.message)
      setSalvando(false)
    }
  }

  const titulos = { entrada: `Entrada de ${nome}`, saida: `Saída de ${nome}`, minimo: `Estoque mínimo de ${nome}` }

  return (
    <Dialog
      open
      onClose={onClose}
      title={titulos[acao]}
      description={
        acao === 'minimo'
          ? 'Abaixo deste saldo o item aparece como "estoque baixo". Deixe em branco para não avisar.'
          : `Saldo atual: ${qtd(item.saldo, item.unidade)}.${acao === 'saida' ? ' A saída usa primeiro o lote que vence antes.' : ''}`
      }
      footer={
        <>
          <PillButton variant="contorno" onPress={onClose} disabled={salvando}>
            Cancelar
          </PillButton>
          <PillButton onPress={salvar} loading={salvando}>
            {acao === 'minimo' ? 'Salvar mínimo' : `Registrar ${acao}`}
          </PillButton>
        </>
      }
    >
      <FieldGrid>
        <Field
          label={acao === 'minimo' ? `Mínimo (${item.unidade})` : `Quantidade (${item.unidade})`}
          required={acao !== 'minimo'}
          inputMode="decimal"
          value={valores.quantidade}
          onChange={set('quantidade', (v) => maskDecimal(v, 9))}
          error={erros.quantidade}
        />
        {acao !== 'minimo' ? (
          <Field
            label="Motivo"
            as="select"
            options={MOTIVOS[acao].map((m) => ({ value: m, label: m }))}
            value={valores.motivo}
            onChange={set('motivo')}
            error={erros.motivo}
          />
        ) : null}
        {acao === 'entrada' ? (
          <>
            <Field
              label="Lote"
              maxLength={40}
              placeholder="Ex.: L2026-118"
              value={valores.lote}
              onChange={set('lote')}
              error={erros.lote}
            />
            <Field
              label="Validade"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              value={valores.validade}
              onChange={set('validade', maskDate)}
              error={erros.validade}
            />
          </>
        ) : null}
      </FieldGrid>
    </Dialog>
  )
}

/** Lotes atuais (com descarte) e histórico do item (HistoricoDialog do site). */
export function HistoricoDialog({ item, nome, onClose, onSaved }) {
  const toast = useToast()
  const [movs, setMovs] = useState(null)
  const [descartando, setDescartando] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let ativo = true
    estoqueService
      .movimentacoes({ categoria: item.categoria, itemId: item.itemId, limite: 100 })
      .then((lista) => ativo && setMovs(lista))
      .catch((e) => ativo && toast.error(e.message))
    return () => {
      ativo = false
    }
  }, [item, toast])

  const descartar = async () => {
    setOcupado(true)
    try {
      const salvo = await estoqueService.descarte({
        categoria: item.categoria,
        itemId: item.itemId,
        loteId: descartando.id,
        motivo: descartando.vencido ? 'Lote vencido' : 'Descarte',
      })
      toast.success('Lote descartado.')
      setDescartando(null)
      onSaved(salvo)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <Dialog
        open={!descartando}
        onClose={onClose}
        title={`Estoque de ${nome}`}
        description="Lotes em estoque e últimas movimentações."
        size="lg"
        footer={<PillButton onPress={onClose}>Fechar</PillButton>}
      >
        <Titulo style={estilos.secao}>Lotes</Titulo>
        {item.lotes.length === 0 ? (
          <Texto style={estilos.apoio}>Nenhum lote em estoque.</Texto>
        ) : (
          <View style={{ gap: 8 }}>
            {item.lotes.map((l) => (
              <View
                key={l.id}
                style={[
                  estilos.lote,
                  l.vencido && { borderColor: cores.erro, backgroundColor: cores.erroFundo },
                  !l.vencido && l.venceEmBreve && { borderColor: cores.mel, backgroundColor: cores.melFundo },
                ]}
              >
                <View style={{ flex: 1, minWidth: 160 }}>
                  <Texto peso={700}>{l.codigo || 'Sem número de lote'}</Texto>
                  <Texto style={estilos.apoio}>
                    {l.validade ? `Validade ${formatDateBr(l.validade)}` : 'Sem validade informada'}
                    {l.vencido ? ' · vencido' : l.venceEmBreve ? ' · vence em breve' : ''}
                  </Texto>
                </View>
                <Texto peso={700}>{qtd(l.quantidade, item.unidade)}</Texto>
                <PillButton variant="perigo" size="sm" onPress={() => setDescartando(l)}>
                  Descartar
                </PillButton>
              </View>
            ))}
          </View>
        )}

        <Titulo style={[estilos.secao, { marginTop: 22 }]}>Movimentações</Titulo>
        {!movs ? (
          <Texto style={estilos.apoio}>Carregando…</Texto>
        ) : movs.length === 0 ? (
          <Texto style={estilos.apoio}>Nenhuma movimentação ainda.</Texto>
        ) : (
          <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
            {movs.map((m) => (
              <View key={m.id} style={estilos.mov}>
                <View style={estilos.movTopo}>
                  <Chip tone={m.tipo === 'Entrada' ? 'sucesso' : m.tipo === 'Descarte' ? 'perigo' : 'tag'} size="xs">
                    {m.tipo}
                  </Chip>
                  <Texto style={estilos.apoio}>
                    {new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </Texto>
                </View>
                <Texto peso={600}>
                  {qtd(m.quantidade, item.unidade)} · saldo {qtd(m.saldoApos, item.unidade)}
                </Texto>
                <Texto style={estilos.apoio}>
                  {m.motivo}
                  {m.lotes ? ` · lote ${m.lotes}` : ''}
                </Texto>
              </View>
            ))}
          </ScrollView>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(descartando)}
        onClose={() => setDescartando(null)}
        onConfirm={descartar}
        loading={ocupado}
        title="Descartar este lote?"
        message={
          descartando
            ? `${qtd(descartando.quantidade, item.unidade)} do lote ${descartando.codigo || 'sem número'} saem do estoque.`
            : ''
        }
        confirmLabel="Descartar lote"
      />
    </>
  )
}

const estilos = StyleSheet.create({
  compacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: cores.cremeClaro,
  },
  indicador: {
    gap: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: cores.borda,
    borderRadius: 16,
  },
  indicadorValor: { fontSize: 32, lineHeight: 36 },
  indicadorRotulo: { fontSize: 16, color: cores.taupeEscuro },
  painel: {
    gap: 8,
    marginTop: 'auto',
    marginHorizontal: -18,
    marginBottom: -18,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: cores.cremeClaro,
  },
  painelTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  saldo: { flexShrink: 1, fontSize: 21, lineHeight: 28 },
  barra: { height: 6, borderRadius: 999, backgroundColor: 'rgba(54, 36, 26, 0.1)' },
  barraNivel: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 999 },
  barraMinimo: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    width: 2,
    borderRadius: 2,
    backgroundColor: cores.cafeEscuro,
  },
  apoio: { fontSize: 15, color: cores.taupeEscuro },
  painelRodape: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  minimo: { fontSize: 15, color: cores.taupeEscuro, textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
  acoes: { flexDirection: 'row', gap: 6 },
  acao: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 999,
    backgroundColor: cores.branco,
  },
  acaoPressionada: { backgroundColor: cores.areia },
  menos: { fontSize: 23, lineHeight: 25, color: cores.cafe },
  acoesItem: { flexDirection: 'row', gap: 2 },
  icone: { alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 999 },
  iconePressionado: { backgroundColor: cores.cremeClaro },
  caixas: { flexDirection: 'row', gap: 8 },
  caixa: {
    flex: 1,
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: cores.cremeClaro,
  },
  caixaRotulo: { fontSize: 15, color: cores.taupe },
  caixaValor: { fontSize: 18, color: cores.cafeEscuro },
  notasBotao: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  notasTitulo: { fontSize: 16, color: cores.cafe },
  secao: { marginBottom: 10, fontSize: 20, lineHeight: 26 },
  lote: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
    backgroundColor: cores.superficie,
  },
  mov: { gap: 2, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: cores.borda },
  movTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
})
