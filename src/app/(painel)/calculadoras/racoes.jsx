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
import { formatNumber, maskDecimal, parseDecimal } from '../../../web/utils/numbers.js'
import { CALCULADORAS_TABS } from '../../../web/pages/calculadoras/calculadorasTabs.js'
import { calc, ProdutoTopo } from '../../../telas/calculadoras/comum.jsx'
import { fotoDaRacao } from '../../../telas/calculadoras/fotosCatalogo.js'
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
import { PhotoPicker } from '../../../componentes/PhotoPicker.jsx'
import { photoSrc } from '../../../plataforma/imagens.js'

const opts = (lista) => lista.map((v) => ({ value: v, label: v }))

export default function CatalogoRacoes() {
  const toast = useToast()
  const { data, loading, error, reload, patchLocal } = useCollections(['racoes'])
  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const estoque = useEstoque(CATEGORIA.racao)
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
      await dataService.remove('racoes', excluindo.id)
      patchLocal('racoes', excluindo, 'remove')
      toast.success(`${excluindo.nome} saiu do catálogo.`)
      setExcluindo(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Page width="largo" title="Catálogo de rações" tabs={CALCULADORAS_TABS} onRefresh={reload}>
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && (
        <>
          <ResumoEstoque itens={estoque.itens} filtro={filtro} onFiltro={setFiltro} />
          {estoque.erro ? <Texto style={calc.itemApoio}>Estoque indisponível: {estoque.erro}</Texto> : null}
          <View style={calc.barra}>
            <Texto peso={700}>
              {data.racoes.length} {data.racoes.length === 1 ? 'ração' : 'rações'}
            </Texto>
            <PillButton onPress={() => setEditando({})}>
              <PlusIcon size={16} strokeWidth={2.4} />
              Cadastrar ração
            </PillButton>
          </View>

          {data.racoes.length === 0 ? (
            <EmptyState title="Nenhuma ração cadastrada">Cadastre as rações indicadas pela clínica.</EmptyState>
          ) : (
            <Grade minimo={440} gap={16} style={calc.lista}>
              {data.racoes
                .filter((r) => filtro === 'todos' || testeFiltro(estoque.itens?.[r.id]))
                .map((r) => (
                  <View key={r.id} style={calc.item}>
                    <ProdutoTopo
                      source={fotoDaRacao(r)}
                      etiquetas={[
                        r.especie === 'Gato' ? 'Gatos' : 'Cães',
                        r.tipo,
                        r.fase === 'Todas' ? 'Todas' : r.fase,
                      ]}
                    >
                      <Titulo peso={800} style={calc.itemNome}>
                        {r.nome}
                      </Titulo>
                      <Texto style={calc.itemApoio}>{formatNumber(r.kcalPorKg, 0)} kcal por kg</Texto>
                    </ProdutoTopo>
                    {abertos.has(r.id) ? (
                      <>
                        <Caixas
                          itens={[
                            ['Energia', `${formatNumber(r.kcalPorKg, 1)} kcal/kg`],
                            ['Fase', r.fase === 'Todas' ? 'Todas as fases' : r.fase],
                          ]}
                        />
                        <Texto style={calc.itemApoio}>{r.tipo}</Texto>
                        {r.observacoes ? <Texto style={calc.itemApoio}>{r.observacoes}</Texto> : null}
                        <PainelEstoque
                          item={estoque.itens?.[r.id]}
                          onAcao={(acao, item) => setMovimento({ acao, itemId: String(item.itemId), nome: r.nome })}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <PillButton variant="contorno" onPress={() => setExcluindo(r)} style={{ flex: 1 }}>
                            Excluir
                          </PillButton>
                          <PillButton onPress={() => setEditando(r)} style={{ flex: 1 }}>
                            Editar
                          </PillButton>
                        </View>
                      </>
                    ) : (
                      <EstoqueCompacto item={estoque.itens?.[r.id]} />
                    )}
                    <PillButton variant="contorno" onPress={() => alternar(r.id)}>
                      {abertos.has(r.id) ? 'Fechar detalhes' : 'Ver detalhes'}
                    </PillButton>
                  </View>
                ))}
            </Grade>
          )}
        </>
      )}

      {editando && (
        <RacaoDialog
          racao={editando.id ? editando : null}
          onClose={() => setEditando(null)}
          onSaved={(salva) => {
            estoque.recarregar()
            patchLocal('racoes', salva)
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
        message="Os planos alimentares já salvos continuam na ficha dos pacientes. O estoque desta ração também sai."
        confirmLabel="Excluir ração"
      />
    </Page>
  )
}

function RacaoDialog({ racao, onClose, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState(() => ({
    nome: racao?.nome ?? '',
    especie: racao?.especie ?? 'Cachorro',
    fase: racao?.fase ?? 'Adulto',
    tipo: racao?.tipo ?? 'Seca',
    kcalPorKg: racao ? formatNumber(racao.kcalPorKg, 1).replace(/\./g, '') : '',
    observacoes: racao?.observacoes ?? '',
    foto: racao?.foto ?? '',
  }))
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const set = (campo) => (bruto) => {
    const valor = campo === 'kcalPorKg' ? maskDecimal(bruto, 7) : bruto
    setValues((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
  }

  const salvar = async () => {
    const kcal = parseDecimal(values.kcalPorKg)
    const proximos = {
      nome: values.nome.trim() ? '' : 'Informe o nome da ração.',
      kcalPorKg: kcal >= 300 && kcal <= 6000 ? '' : 'Informe entre 300 e 6.000 kcal/kg.',
    }
    setErros(proximos)
    if (Object.values(proximos).some(Boolean)) return

    setSalvando(true)
    try {
      const payload = { ...values, nome: values.nome.trim(), kcalPorKg: kcal, observacoes: values.observacoes.trim() }
      const salva = racao
        ? await dataService.update('racoes', racao.id, payload)
        : await dataService.create('racoes', payload)
      toast.success(racao ? 'Ração atualizada!' : `${salva.nome} entrou no catálogo!`)
      onSaved(salva)
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
      title={racao ? 'Editar ração' : 'Cadastrar ração'}
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
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <PhotoPicker
          value={photoSrc(values.foto)}
          onChange={(foto) => setValues((prev) => ({ ...prev, foto }))}
          label="Enviar foto do pacote"
        />
      </View>
      <FieldGrid>
        <Field
          span={2}
          label="Nome"
          required
          maxLength={80}
          value={values.nome}
          onChange={set('nome')}
          error={erros.nome}
        />
        <Field
          label="Energia metabolizável (kcal/kg)"
          required
          inputMode="decimal"
          placeholder="Ex.: 3800"
          value={values.kcalPorKg}
          onChange={set('kcalPorKg')}
          error={erros.kcalPorKg}
        />
        <Field
          label="Tipo"
          as="select"
          options={opts(['Seca', 'Úmida', 'Terapêutica'])}
          value={values.tipo}
          onChange={set('tipo')}
        />
        <Field
          label="Espécie"
          as="select"
          options={[
            { value: 'Cachorro', label: 'Cães' },
            { value: 'Gato', label: 'Gatos' },
          ]}
          value={values.especie}
          onChange={set('especie')}
        />
        <Field
          label="Fase"
          as="select"
          options={[
            { value: 'Filhote', label: 'Filhote' },
            { value: 'Adulto', label: 'Adulto' },
            { value: 'Idoso', label: 'Idoso (sênior)' },
            { value: 'Todas', label: 'Todas as fases' },
          ]}
          value={values.fase}
          onChange={set('fase')}
        />
        <Field
          span={2}
          label="Observações"
          as="textarea"
          maxLength={300}
          value={values.observacoes}
          onChange={set('observacoes')}
        />
      </FieldGrid>
    </Dialog>
  )
}
