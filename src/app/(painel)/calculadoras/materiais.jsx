import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
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
import { CALCULADORAS_TABS } from '../../../web/pages/calculadoras/calculadorasTabs.js'
import { calc, ProdutoTopo } from '../../../telas/calculadoras/comum.jsx'
import { fotoDoMaterial } from '../../../telas/calculadoras/fotosCatalogo.js'
import { Grade } from '../../../componentes/ui/Grade.jsx'
import { CATEGORIA } from '../../../web/services/gestaoService.js'
import {
  FILTROS_ESTOQUE,
  TIPOS_MATERIAL,
  UNIDADES_MATERIAL,
  useEstoque,
} from '../../../web/pages/calculadoras/Catalogos/estoque.js'
import {
  EstoqueCompacto,
  HistoricoDialog,
  MovimentoDialog,
  PainelEstoque,
  ResumoEstoque,
} from '../../../telas/calculadoras/Estoque.jsx'
import { cores } from '../../../tema.js'

const opts = (lista) => lista.map((v) => ({ value: v, label: v }))

/** Materiais e insumos com estoque (CatalogoMateriais do site). */
export default function CatalogoMateriais() {
  const toast = useToast()
  const { data, loading, error, reload, patchLocal } = useCollections(['materiais'])
  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const estoque = useEstoque(CATEGORIA.material)
  const [filtro, setFiltro] = useState('todos')
  const [tipo, setTipo] = useState('')
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
      await dataService.remove('materiais', excluindo.id)
      patchLocal('materiais', excluindo, 'remove')
      toast.success(`${excluindo.nome} saiu do catálogo.`)
      setExcluindo(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const visiveis = (data?.materiais ?? [])
    .filter((m) => !tipo || m.tipo === tipo)
    .filter((m) => filtro === 'todos' || testeFiltro(estoque.itens?.[m.id]))

  return (
    <Page width="largo" title="Materiais e insumos" tabs={CALCULADORAS_TABS} onRefresh={reload}>
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && (
        <>
          <ResumoEstoque itens={estoque.itens} filtro={filtro} onFiltro={setFiltro} />
          {estoque.erro ? <Texto style={calc.itemApoio}>Estoque indisponível: {estoque.erro}</Texto> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.tipos}>
            {['', ...TIPOS_MATERIAL].map((t) => {
              const ativo = tipo === t
              const total = t ? data.materiais.filter((m) => m.tipo === t).length : data.materiais.length
              return (
                <Pressable
                  key={t || 'todos'}
                  onPress={() => setTipo(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  style={[estilos.tipo, ativo && estilos.tipoAtivo]}
                >
                  <Texto peso={700} style={[estilos.tipoTexto, ativo && { color: cores.branco }]}>
                    {t || 'Todos'}
                  </Texto>
                  <Texto style={[estilos.tipoTotal, ativo && { color: cores.creme }]}>{String(total)}</Texto>
                </Pressable>
              )
            })}
          </ScrollView>
          <View style={calc.barra}>
            <Texto peso={700}>
              {visiveis.length} {visiveis.length === 1 ? 'material' : 'materiais'}
            </Texto>
            <PillButton onPress={() => setEditando({})}>
              <PlusIcon size={16} strokeWidth={2.4} />
              Cadastrar material
            </PillButton>
          </View>

          {data.materiais.length === 0 ? (
            <EmptyState title="Nenhum material cadastrado">
              Cadastre gazes, ataduras, soro, fios e instrumental para acompanhar o estoque.
            </EmptyState>
          ) : visiveis.length === 0 ? (
            <EmptyState title="Nada neste filtro">Troque o tipo ou a situação do estoque.</EmptyState>
          ) : (
            <Grade minimo={440} gap={16} style={calc.lista}>
              {visiveis.map((m) => (
                <View key={m.id} style={calc.item}>
                  <ProdutoTopo source={fotoDoMaterial(m)} ajuste="preenche" etiquetas={[m.tipo]}>
                    <Titulo peso={800} style={calc.itemNome}>
                      {m.nome}
                    </Titulo>
                    {m.especificacao ? <Texto style={calc.itemApoio}>{m.especificacao}</Texto> : null}
                  </ProdutoTopo>
                  {abertos.has(m.id) ? (
                    <>
                      {m.observacoes ? <Texto style={calc.itemApoio}>{m.observacoes}</Texto> : null}
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
        <MaterialDialog
          material={editando.id ? editando : null}
          onClose={() => setEditando(null)}
          onSaved={(salvo) => {
            estoque.recarregar()
            patchLocal('materiais', salvo)
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
        message="O estoque e o histórico deste material também saem."
        confirmLabel="Excluir material"
      />
    </Page>
  )
}

function MaterialDialog({ material, onClose, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState(() => ({
    nome: material?.nome ?? '',
    tipo: material?.tipo ?? TIPOS_MATERIAL[0],
    unidade: material?.unidade ?? 'unidade',
    especificacao: material?.especificacao ?? '',
    observacoes: material?.observacoes ?? '',
  }))
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const set = (campo) => (valor) => {
    setValues((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
  }

  const salvar = async () => {
    if (!values.nome.trim()) return setErros({ nome: 'Informe o nome do material.' })

    setSalvando(true)
    try {
      const payload = {
        ...values,
        nome: values.nome.trim(),
        especificacao: values.especificacao.trim(),
        observacoes: values.observacoes.trim(),
      }
      const salvo = material
        ? await dataService.update('materiais', material.id, payload)
        : await dataService.create('materiais', payload)
      toast.success(material ? 'Material atualizado!' : `${salvo.nome} entrou no catálogo!`)
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
      title={material ? 'Editar material' : 'Cadastrar material'}
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
          label="Nome"
          required
          span={2}
          maxLength={80}
          placeholder="Ex.: Gaze estéril"
          value={values.nome}
          onChange={set('nome')}
          error={erros.nome}
        />
        <Field label="Tipo" as="select" options={opts(TIPOS_MATERIAL)} value={values.tipo} onChange={set('tipo')} />
        <Field
          label="Contado em"
          as="select"
          options={opts(UNIDADES_MATERIAL)}
          value={values.unidade}
          onChange={set('unidade')}
          hint="A unidade usada nas entradas e saídas do estoque."
        />
        <Field
          label="Tamanho ou volume"
          span={2}
          maxLength={80}
          placeholder="Ex.: 7,5 x 7,5 cm, 500 mL, nº 7,5"
          value={values.especificacao}
          onChange={set('especificacao')}
          error={erros.especificacao}
        />
        <Field
          label="Observações"
          as="textarea"
          span={2}
          maxLength={300}
          value={values.observacoes}
          onChange={set('observacoes')}
        />
      </FieldGrid>
    </Dialog>
  )
}

const estilos = StyleSheet.create({
  tipos: { gap: 6, paddingVertical: 2 },
  tipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 999,
    backgroundColor: cores.branco,
  },
  tipoAtivo: { borderColor: cores.cafe, backgroundColor: cores.cafe },
  tipoTexto: { fontSize: 16, color: cores.cafe },
  tipoTotal: { fontSize: 15, color: cores.taupe },
})
