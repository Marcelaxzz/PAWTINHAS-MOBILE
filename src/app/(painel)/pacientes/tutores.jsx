import { useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { Field, FieldGrid } from '../../../componentes/ui/Field.jsx'
import { Grade } from '../../../componentes/ui/Grade.jsx'
import { ConfirmDialog, Dialog } from '../../../componentes/ui/Dialog.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { Chip } from '../../../componentes/ui/Chip.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { BuscaFiltro, Filtros } from '../../../componentes/Filtros.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { HouseIcon, PencilIcon, PhoneIcon, TrashIcon } from '../../../web/components/Icons/Icons.jsx'
import { useCollections } from '../../../web/hooks/useCollections.js'
import { useToast } from '../../../web/hooks/useToast.js'
import { dataService } from '../../../web/services/dataService.js'
import { maskCpf, maskPhone } from '../../../web/utils/masks.js'
import { normalize } from '../../../web/utils/text.js'
import { validateCpf, validateOptionalEmail, validatePhone } from '../../../web/utils/validators.js'
import { PACIENTES_TABS } from '../../../web/pages/panel/pacientesTabs.js'
import { cores, sombras } from '../../../tema.js'

export default function Tutores() {
  const router = useRouter()
  const toast = useToast()
  const { data, loading, error, reload, patchLocal } = useCollections(['tutores', 'pets'])
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const petsDe = (tutorId) => (data?.pets ?? []).filter((p) => p.tutorId === tutorId)
  const termo = normalize(busca)
  const lista = (data?.tutores ?? []).filter(
    (t) =>
      !termo ||
      normalize(
        `${t.nome} ${t.telefone} ${petsDe(t.id)
          .map((p) => p.nome)
          .join(' ')}`,
      ).includes(termo),
  )
  const petsDoExcluido = excluindo ? petsDe(excluindo.id) : []

  const excluir = async () => {
    setOcupado(true)
    try {
      await dataService.remove('tutores', excluindo.id)
      toast.success(`${excluindo.nome} foi removido(a).`)
      setExcluindo(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Page
      title="Tutores"
      subtitle="Contatos dos responsáveis pelos pawtinhas."
      tabs={PACIENTES_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          <Filtros>
            <BuscaFiltro
              value={busca}
              onChange={setBusca}
              placeholder="Filtrar por nome, telefone ou pet..."
              maxLength={80}
            />
            <PillButton style={{ flexBasis: '100%' }} onPress={() => setEditando({})}>
              + Novo tutor
            </PillButton>
          </Filtros>

          {lista.length === 0 ? (
            <EmptyState title={data.tutores.length ? 'Nenhum tutor encontrado' : 'Nenhum tutor cadastrado'}>
              {data.tutores.length
                ? 'Confira o nome digitado.'
                : 'Os tutores também podem ser cadastrados junto com o paciente.'}
            </EmptyState>
          ) : (
            <Grade minimo={300} gap={16}>
              {lista.map((t) => {
                const pets = petsDe(t.id)
                return (
                  <View key={t.id} style={[estilos.card, sombras.suave]}>
                    <Titulo peso={800} style={estilos.nome}>
                      {t.nome}
                    </Titulo>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${t.telefone.replace(/\D/g, '')}`)}
                      accessibilityRole="link"
                      style={estilos.linha}
                    >
                      <PhoneIcon size={15} color={cores.carameloEscuro} style={{ marginTop: 3 }} />
                      <Texto style={[estilos.linhaTexto, { textDecorationLine: 'underline' }]}>{t.telefone}</Texto>
                    </Pressable>
                    {t.endereco ? (
                      <View style={estilos.linha}>
                        <HouseIcon size={15} color={cores.carameloEscuro} style={{ marginTop: 3 }} />
                        <Texto style={estilos.linhaTexto}>{t.endereco}</Texto>
                      </View>
                    ) : null}
                    <View style={estilos.pets}>
                      {pets.length === 0 ? (
                        <Chip size="xs">Sem pets cadastrados</Chip>
                      ) : (
                        pets.map((p) => (
                          <Pressable
                            key={p.id}
                            onPress={() => router.push(`/pacientes/${p.id}`)}
                            accessibilityRole="link"
                          >
                            <Chip tone="tag" size="xs">
                              {p.nome}
                            </Chip>
                          </Pressable>
                        ))
                      )}
                    </View>
                    <View style={estilos.acoes}>
                      <PillButton variant="contorno" size="sm" onPress={() => setEditando(t)}>
                        <PencilIcon size={14} />
                        Editar
                      </PillButton>
                      <PillButton variant="perigo" size="sm" onPress={() => setExcluindo(t)}>
                        <TrashIcon size={14} />
                        Excluir
                      </PillButton>
                    </View>
                  </View>
                )
              })}
            </Grade>
          )}
        </>
      )}

      {editando && (
        <TutorDialog
          tutor={editando.id ? editando : null}
          onClose={() => setEditando(null)}
          onSaved={(salvo) => {
            patchLocal('tutores', salvo)
            setEditando(null)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        onConfirm={excluir}
        loading={ocupado}
        title={`Excluir ${excluindo?.nome ?? ''}?`}
        message={
          petsDoExcluido.length
            ? `${petsDoExcluido.map((p) => p.nome).join(', ')} ${petsDoExcluido.length === 1 ? 'ainda está' : 'ainda estão'} com este tutor. Escolha outro tutor na ficha antes de excluir.`
            : 'O contato será removido.'
        }
        confirmLabel="Excluir tutor"
      />
    </Page>
  )
}

function TutorDialog({ tutor, onClose, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState({
    nome: tutor?.nome ?? '',
    telefone: tutor?.telefone ?? '',
    cpf: tutor?.cpf ?? '',
    email: tutor?.email ?? '',
    endereco: tutor?.endereco ?? '',
    cidade: tutor?.cidade ?? '',
    uf: tutor?.uf ?? '',
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const set =
    (campo, transform = (v) => v) =>
    (texto) => {
      setValues((prev) => ({ ...prev, [campo]: transform(texto) }))
      if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
    }

  const salvar = async () => {
    const proximos = {
      nome: values.nome.trim() ? '' : 'Informe o nome do tutor.',
      telefone: validatePhone(values.telefone),
      cpf: validateCpf(values.cpf),
      email: validateOptionalEmail(values.email),
      uf: values.uf && !/^[A-Za-z]{2}$/.test(values.uf.trim()) ? 'Use a sigla do estado (ex.: MG).' : '',
    }
    setErros(proximos)
    if (Object.values(proximos).some(Boolean)) return

    setSalvando(true)
    try {
      const payload = {
        nome: values.nome.trim(),
        telefone: values.telefone,
        cpf: values.cpf,
        email: values.email.trim(),
        endereco: values.endereco.trim(),
        cidade: values.cidade.trim(),
        uf: values.uf.trim().toUpperCase(),
      }
      const salvo = tutor
        ? await dataService.update('tutores', tutor.id, payload)
        : await dataService.create('tutores', payload)
      toast.success(tutor ? 'Tutor atualizado!' : `${salvo.nome} foi cadastrado(a)!`)
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
      title={tutor ? 'Editar tutor' : 'Cadastrar tutor'}
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
          span={2}
          label="Nome"
          required
          maxLength={100}
          autoComplete="off"
          value={values.nome}
          onChange={set('nome')}
          error={erros.nome}
        />
        <Field
          label="Telefone"
          required
          inputMode="tel"
          placeholder="(34) 99999-9999"
          maxLength={15}
          value={values.telefone}
          onChange={set('telefone', maskPhone)}
          error={erros.telefone}
        />
        <Field
          label="CPF"
          inputMode="numeric"
          placeholder="Opcional"
          maxLength={14}
          value={values.cpf}
          onChange={set('cpf', maskCpf)}
          error={erros.cpf}
        />
        <Field
          span={2}
          label="E-mail"
          inputMode="email"
          autoCapitalize="none"
          maxLength={150}
          placeholder="Opcional"
          value={values.email}
          onChange={set('email')}
          error={erros.email}
        />
        <Field
          span={2}
          label="Endereço"
          maxLength={160}
          placeholder="Rua, número, bairro"
          value={values.endereco}
          onChange={set('endereco')}
          error={erros.endereco}
        />
        <Field label="Cidade" maxLength={100} value={values.cidade} onChange={set('cidade')} error={erros.cidade} />
        <Field
          label="UF"
          maxLength={2}
          placeholder="MG"
          autoCapitalize="characters"
          value={values.uf}
          onChange={set('uf', (v) => v.toUpperCase())}
          error={erros.uf}
        />
      </FieldGrid>
    </Dialog>
  )
}

const estilos = StyleSheet.create({
  card: {
    gap: 8,
    padding: 22,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 20,
    backgroundColor: cores.superficie,
  },
  nome: { fontSize: 20, lineHeight: 26 },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  linhaTexto: { flex: 1, fontSize: 16, color: cores.cafe },
  pets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8 },
})
