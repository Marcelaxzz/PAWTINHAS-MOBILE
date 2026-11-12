import { useState } from 'react'
import { View } from 'react-native'
import { Page } from '../../../componentes/Page.jsx'
import { Field, FieldGrid } from '../../../componentes/ui/Field.jsx'
import { ConfirmDialog, Dialog } from '../../../componentes/ui/Dialog.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { PlusIcon } from '../../../web/components/Icons/Icons.jsx'
import { useCollections } from '../../../web/hooks/useCollections.js'
import { useToast } from '../../../web/hooks/useToast.js'
import { dataService } from '../../../web/services/dataService.js'
import { formatNumber, intervaloCurto, intervaloLabel, maskDecimal, parseDecimal } from '../../../web/utils/numbers.js'
import { CALCULADORAS_TABS } from '../../../web/pages/calculadoras/calculadorasTabs.js'
import { calc, CheckItem, ProdutoTopo } from '../../../telas/calculadoras/comum.jsx'
import { fotoDoMedicamento } from '../../../telas/calculadoras/fotosCatalogo.js'
import { Grade } from '../../../componentes/ui/Grade.jsx'
import { CATEGORIA } from '../../../web/services/gestaoService.js'
import { FILTROS_ESTOQUE, useEstoque } from '../../../web/pages/calculadoras/Catalogos/estoque.js'
import {
  Caixas,
  EstoqueCompacto,
  HistoricoDialog,
  MovimentoDialog,
  PainelEstoque,
  ResumoEstoque,
} from '../../../telas/calculadoras/Estoque.jsx'

const FORMAS = ['Comprimido', 'Cápsula', 'Solução oral', 'Suspensão oral', 'Gotas', 'Injetável']
const VIAS = ['Oral', 'Subcutânea', 'Intramuscular', 'Intravenosa']
const INTERVALOS = [4, 6, 8, 12, 24, 48, 72]
const UNIDADE_DA_FORMA = {
  Comprimido: 'mg por comprimido',
  Cápsula: 'mg por cápsula',
  'Solução oral': 'mg por mL',
  'Suspensão oral': 'mg por mL',
  Gotas: 'mg por gota',
  Injetável: 'mg por mL',
}
const CONCENTRACAO = { comprimido: 'mg/comprimido', cápsula: 'mg/cápsula', mL: 'mg/mL', gota: 'mg/gota' }
const DECIMAIS = ['concentracao', 'doseMinCao', 'doseMaxCao', 'doseMinGato', 'doseMaxGato', 'doseMaximaMg']

const texto = (v) => (v == null ? '' : formatNumber(v, 3).replace(/\./g, ''))

function faixa(min, max) {
  if (min == null && max == null) return '—'
  if (min != null && max != null && min === max) return `${formatNumber(min, 3)} mg/kg`
  if (min != null && max != null) return `${formatNumber(min, 3)}–${formatNumber(max, 3)} mg/kg`
  return min != null ? `mín. ${formatNumber(min, 3)} mg/kg` : `máx. ${formatNumber(max, 3)} mg/kg`
}

export default function CatalogoMedicamentos() {
  const toast = useToast()
  const { data, loading, error, reload, patchLocal } = useCollections(['medicamentos'])
  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const estoque = useEstoque(CATEGORIA.medicamento)
  const [filtro, setFiltro] = useState('todos')
  const [movimento, setMovimento] = useState(null)
  const [abertos, setAbertos] = useState(() => new Set())
  const alternar = (id) =>
    setAbertos((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  const testeFiltro = FILTROS_ESTOQUE.find((f) => f.id === filtro).test

  const excluir = async () => {
    setOcupado(true)
    try {
      await dataService.remove('medicamentos', excluindo.id)
      patchLocal('medicamentos', excluindo, 'remove')
      toast.success(`${excluindo.nome} saiu do catálogo.`)
      setExcluindo(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Page width="largo" title="Catálogo de medicamentos" tabs={CALCULADORAS_TABS} onRefresh={reload}>
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && (
        <>
          <ResumoEstoque itens={estoque.itens} filtro={filtro} onFiltro={setFiltro} />
          {estoque.erro ? <Texto style={calc.itemApoio}>Estoque indisponível: {estoque.erro}</Texto> : null}
          <View style={calc.barra}>
            <Texto peso={700}>
              {data.medicamentos.length} {data.medicamentos.length === 1 ? 'medicamento' : 'medicamentos'}
            </Texto>
            <PillButton onPress={() => setEditando({})}>
              <PlusIcon size={16} strokeWidth={2.4} />
              Cadastrar medicamento
            </PillButton>
          </View>

          {data.medicamentos.length === 0 ? (
            <EmptyState title="Nenhum medicamento cadastrado">
              Cadastre as apresentações usadas na clínica para calcular doses mais rápido.
            </EmptyState>
          ) : (
            <Grade minimo={440} gap={16} style={calc.lista}>
              {data.medicamentos
                .filter((m) => filtro === 'todos' || testeFiltro(estoque.itens?.[m.id]))
                .map((m) => (
                  <View key={m.id} style={calc.item}>
                    <ProdutoTopo source={fotoDoMedicamento(m)} etiquetas={[m.forma]}>
                      <Titulo peso={800} style={calc.itemNome}>
                        {m.nome}
                      </Titulo>
                    </ProdutoTopo>
                    {abertos.has(m.id) ? (
                      <>
                        <Texto style={calc.itemApoio}>
                          {formatNumber(m.concentracao, 3)} {CONCENTRACAO[m.unidade]}
                        </Texto>
                        <Caixas
                          itens={[
                            ['Dose para cães', faixa(m.doseMinCao, m.doseMaxCao)],
                            ['Dose para gatos', faixa(m.doseMinGato, m.doseMaxGato)],
                          ]}
                        />
                        {m.intervaloPadraoHoras || m.doseMaximaMg != null || m.unidade === 'comprimido' ? (
                          <Texto style={calc.itemApoio}>
                            {[
                              m.via,
                              m.intervaloPadraoHoras && intervaloCurto(m.intervaloPadraoHoras),
                              m.doseMaximaMg != null && `máx. ${formatNumber(m.doseMaximaMg, 3)} mg/dose`,
                              m.unidade === 'comprimido' && (m.fracionavel ? 'pode partir' : 'não partir'),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </Texto>
                        ) : null}
                        {m.principioAtivo ? (
                          <Texto style={calc.itemApoio}>Princípio ativo: {m.principioAtivo}</Texto>
                        ) : null}
                        {m.observacoes ? <Texto style={calc.itemApoio}>{m.observacoes}</Texto> : null}
                        {m.fonte ? <Texto style={calc.itemFonte}>Fonte: {m.fonte}</Texto> : null}
                        <PainelEstoque
                          item={estoque.itens?.[m.id]}
                          onAcao={(acao, item) => setMovimento({ acao, itemId: String(item.itemId), nome: m.nome })}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <PillButton variant="contorno" onPress={() => setExcluindo(m)} style={{ flex: 1 }}>
                            Excluir
                          </PillButton>
                          <PillButton onPress={() => setEditando(m)} style={{ flex: 1 }}>
                            Editar
                          </PillButton>
                        </View>
                      </>
                    ) : (
                      <EstoqueCompacto item={estoque.itens?.[m.id]} />
                    )}
                    <PillButton variant="contorno" onPress={() => alternar(m.id)}>
                      {abertos.has(m.id) ? 'Fechar detalhes' : 'Ver detalhes'}
                    </PillButton>
                  </View>
                ))}
            </Grade>
          )}
        </>
      )}

      {editando && (
        <MedicamentoDialog
          medicamento={editando.id ? editando : null}
          onClose={() => setEditando(null)}
          onSaved={(salvo) => {
            estoque.recarregar()
            patchLocal('medicamentos', salvo)
            setEditando(null)
          }}
        />
      )}

      {movimento && estoque.itens?.[movimento.itemId] ? (
        movimento.acao === 'historico' ? (
          <HistoricoDialog
            item={estoque.itens[movimento.itemId]}
            nome={movimento.nome}
            onClose={() => setMovimento(null)}
            onSaved={estoque.atualizar}
          />
        ) : (
          <MovimentoDialog
            acao={movimento.acao}
            item={estoque.itens[movimento.itemId]}
            nome={movimento.nome}
            onClose={() => setMovimento(null)}
            onSaved={(salvo) => {
              estoque.atualizar(salvo)
              setMovimento(null)
            }}
          />
        )
      ) : null}

      <ConfirmDialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        onConfirm={excluir}
        loading={ocupado}
        title={`Excluir ${excluindo?.nome ?? ''}?`}
        message="As prescrições já salvas continuam na ficha dos pacientes. O estoque deste medicamento também sai."
        confirmLabel="Excluir medicamento"
      />
    </Page>
  )
}

function MedicamentoDialog({ medicamento, onClose, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState(() => ({
    nome: medicamento?.nome ?? '',
    principioAtivo: medicamento?.principioAtivo ?? '',
    forma: medicamento?.forma ?? 'Comprimido',
    concentracao: texto(medicamento?.concentracao),
    fracionavel: medicamento?.fracionavel ?? true,
    via: medicamento?.via ?? 'Oral',
    doseMinCao: texto(medicamento?.doseMinCao),
    doseMaxCao: texto(medicamento?.doseMaxCao),
    doseMinGato: texto(medicamento?.doseMinGato),
    doseMaxGato: texto(medicamento?.doseMaxGato),
    doseMaximaMg: texto(medicamento?.doseMaximaMg),
    intervaloPadraoHoras: medicamento?.intervaloPadraoHoras ? String(medicamento.intervaloPadraoHoras) : '',
    observacoes: medicamento?.observacoes ?? '',
    fonte: medicamento?.fonte ?? '',
  }))
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const set = (campo) => (bruto) => {
    const valor = DECIMAIS.includes(campo) ? maskDecimal(bruto, 9) : bruto
    setValues((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
  }

  const salvar = async () => {
    const n = Object.fromEntries(DECIMAIS.map((c) => [c, parseDecimal(values[c])]))
    const proximos = {
      nome: values.nome.trim() ? '' : 'Informe o nome comercial.',
      concentracao: n.concentracao > 0 ? '' : 'Informe a concentração.',
      doseMaxCao:
        n.doseMinCao != null && n.doseMaxCao != null && n.doseMinCao > n.doseMaxCao ? 'A mínima passa da máxima.' : '',
      doseMaxGato:
        n.doseMinGato != null && n.doseMaxGato != null && n.doseMinGato > n.doseMaxGato
          ? 'A mínima passa da máxima.'
          : '',
    }
    setErros(proximos)
    if (Object.values(proximos).some(Boolean)) return

    setSalvando(true)
    try {
      const payload = {
        ...values,
        ...n,
        nome: values.nome.trim(),
        principioAtivo: values.principioAtivo.trim(),
        fracionavel: values.forma === 'Comprimido' && values.fracionavel,
        intervaloPadraoHoras: values.intervaloPadraoHoras ? Number(values.intervaloPadraoHoras) : null,
        observacoes: values.observacoes.trim(),
        fonte: values.fonte.trim(),
      }
      const salvo = medicamento
        ? await dataService.update('medicamentos', medicamento.id, payload)
        : await dataService.create('medicamentos', payload)
      toast.success(medicamento ? 'Medicamento atualizado!' : `${salvo.nome} entrou no catálogo!`)
      onSaved(salvo)
    } catch (err) {
      if (err.fields) setErros(err.fields)
      toast.error(err.message)
      setSalvando(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={medicamento ? 'Editar medicamento' : 'Cadastrar medicamento'}
      size="lg"
      description="Use os dados da bula do produto."
      footer={
        <>
          <PillButton variant="contorno" onPress={onClose} disabled={salvando}>
            Cancelar
          </PillButton>
          <PillButton onPress={salvar} loading={salvando}>
            Salvar
          </PillButton>
        </>
      }
    >
      <FieldGrid>
        <Field
          label="Nome comercial"
          required
          maxLength={80}
          value={values.nome}
          onChange={set('nome')}
          error={erros.nome}
        />
        <Field label="Princípio ativo" maxLength={80} value={values.principioAtivo} onChange={set('principioAtivo')} />
        <Field
          label="Forma farmacêutica"
          as="select"
          options={FORMAS.map((v) => ({ value: v, label: v }))}
          value={values.forma}
          onChange={set('forma')}
        />
        <Field
          label={`Concentração (${UNIDADE_DA_FORMA[values.forma]})`}
          required
          inputMode="decimal"
          value={values.concentracao}
          onChange={set('concentracao')}
          error={erros.concentracao}
          hint={values.forma === 'Gotas' ? 'Ex.: 500 mg/mL com 20 gotas/mL = 25 mg por gota.' : undefined}
        />
        <Field
          label="Via"
          as="select"
          options={VIAS.map((v) => ({ value: v, label: v }))}
          value={values.via}
          onChange={set('via')}
        />
        <Field
          label="Intervalo padrão"
          as="select"
          options={[
            { value: '', label: 'Sem padrão' },
            ...INTERVALOS.map((h) => ({ value: String(h), label: intervaloLabel(h) })),
          ]}
          value={values.intervaloPadraoHoras}
          onChange={set('intervaloPadraoHoras')}
        />
        <Field
          label="Dose mínima para cães (mg/kg)"
          inputMode="decimal"
          value={values.doseMinCao}
          onChange={set('doseMinCao')}
          error={erros.doseMinCao}
        />
        <Field
          label="Dose máxima para cães (mg/kg)"
          inputMode="decimal"
          value={values.doseMaxCao}
          onChange={set('doseMaxCao')}
          error={erros.doseMaxCao}
        />
        <Field
          label="Dose mínima para gatos (mg/kg)"
          inputMode="decimal"
          value={values.doseMinGato}
          onChange={set('doseMinGato')}
          error={erros.doseMinGato}
        />
        <Field
          label="Dose máxima para gatos (mg/kg)"
          inputMode="decimal"
          value={values.doseMaxGato}
          onChange={set('doseMaxGato')}
          error={erros.doseMaxGato}
        />
        <Field
          label="Teto por dose (mg)"
          inputMode="decimal"
          hint="Opcional: limite absoluto, qualquer que seja o peso."
          value={values.doseMaximaMg}
          onChange={set('doseMaximaMg')}
          error={erros.doseMaximaMg}
        />
        <Field
          span={2}
          label="Observações"
          as="textarea"
          maxLength={500}
          value={values.observacoes}
          onChange={set('observacoes')}
        />
        <Field
          span={2}
          label="Fonte das doses"
          maxLength={300}
          placeholder="Ex.: bula do produto, consenso ou manual veterinário"
          hint="Quem prescrever vê de onde vieram as faixas."
          value={values.fonte}
          onChange={set('fonte')}
        />
      </FieldGrid>
      {values.forma === 'Comprimido' && (
        <View style={calc.checks}>
          <CheckItem
            checked={values.fracionavel}
            onChange={(v) => setValues((prev) => ({ ...prev, fracionavel: v }))}
            titulo="Comprimido sulcado (pode ser partido em até 1/4)"
            apoio="Sem sulco, a calculadora arredonda para o comprimido inteiro."
          />
        </View>
      )}
    </Dialog>
  )
}
