import { useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from '../componentes/Page.jsx'
import { Field, FieldGrid } from '../componentes/ui/Field.jsx'
import { ConfirmDialog } from '../componentes/ui/Dialog.jsx'
import { Chave, EmptyState, ErrorState, LoadingState } from '../componentes/ui/Basicos.jsx'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { estilosForm } from '../componentes/ResourceForm.jsx'
import { Texto } from '../componentes/Texto.jsx'
import { ClockIcon, TrashIcon } from '../web/components/Icons/Icons.jsx'
import { useClinic } from '../web/hooks/useClinic.js'
import { useToast } from '../web/hooks/useToast.js'
import { dataService } from '../web/services/dataService.js'
import { formatDateBr, isValidTime, maskDate, maskTime, parseDateBr, todayIso } from '../web/utils/dates.js'
import { OPCOES_RECORRENCIA, RECORRENCIAS, proximoToque, resumoDoAlarme, textoDoToque } from '../web/utils/alarmes.js'
import { alarmeTocando } from '../alarmes/estado.js'
import { cores, sombras } from '../tema.js'

/** Novo alarme / editar alarme (AlarmeForm do site). */
export function AlarmeForm() {
  const { id } = useLocalSearchParams()
  const { data, loading, error, reload } = useClinic(['alarmes'])
  const editing = Boolean(id)
  const alarme = data?.alarmes.find((a) => a.id === id)
  const title = editing ? 'Editar alarme' : 'Novo alarme'

  return (
    <Page
      title={title}
      subtitle={
        editing
          ? 'Atualize o lembrete. O ESP32 e o app recebem a mudança em instantes.'
          : 'Toca no ESP32, no app do celular e no painel aberto no navegador.'
      }
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && editing && !alarme && (
        <EmptyState title="Alarme não encontrado" action={<PillButton to="/alarmes">Voltar aos alarmes</PillButton>}>
          Ele pode ter sido excluído.
        </EmptyState>
      )}
      {data && (!editing || alarme) && <AlarmeFormContent key={id ?? 'novo'} pets={data.pets} alarme={alarme} />}
    </Page>
  )
}

function AlarmeFormContent({ pets, alarme }) {
  const router = useRouter()
  const toast = useToast()
  const nomeRef = useRef(null)
  const horaRef = useRef(null)
  const inicioRef = useRef(null)
  const [values, setValues] = useState(() => ({
    nome: alarme?.nome ?? '',
    petId: alarme?.petId ?? '',
    hora: alarme?.hora ?? '',
    recorrencia: alarme?.recorrencia ?? RECORRENCIAS[0],
    inicio: formatDateBr(alarme?.inicio || todayIso()),
    descricao: alarme?.descricao ?? '',
    ativo: alarme?.ativo ?? true,
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Prévia de quando vai tocar, com as mesmas regras do ESP32 e do site.
  const inicioIso = parseDateBr(values.inicio)
  const previa =
    isValidTime(values.hora) && inicioIso
      ? (() => {
          const rascunho = { hora: values.hora, recorrencia: values.recorrencia, inicio: inicioIso }
          const proximo = proximoToque(rascunho, new Date(), 400)
          return `${resumoDoAlarme(rascunho)}. ${proximo ? `Próximo: ${textoDoToque(proximo)}.` : 'Esse dia e horário já passaram.'}`
        })()
      : undefined

  const set = (field) => (raw) => {
    const mascara = { hora: maskTime, inicio: maskDate }[field]
    const value = mascara ? mascara(raw) : raw
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const sair = () => (router.canGoBack() ? router.back() : router.replace('/alarmes'))

  const handleSubmit = async () => {
    const nextErrors = {
      nome: values.nome.trim() ? '' : 'Dê um nome ao alarme.',
      petId: values.petId ? '' : 'Selecione o pet.',
      hora: isValidTime(values.hora) ? '' : 'Informe um horário válido (hh:mm).',
      inicio: parseDateBr(values.inicio) ? '' : 'Informe a data no formato dd/mm/aaaa.',
    }
    setErrors(nextErrors)
    const first = Object.keys(nextErrors).find((key) => nextErrors[key])
    if (first) {
      const campo = { nome: nomeRef, hora: horaRef, inicio: inicioRef }[first]
      campo?.current?.focus()
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...values,
        nome: values.nome.trim(),
        descricao: values.descricao.trim(),
        inicio: parseDateBr(values.inicio),
      }
      if (alarme) await dataService.update('alarmes', alarme.id, payload)
      else await dataService.create('alarmes', payload)
      alarmeTocando.pedirSincronia()
      toast.success(alarme ? 'Alarme atualizado!' : 'Alarme salvo! O ESP32 e o app recebem em instantes.')
      router.dismissTo('/alarmes')
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await dataService.remove('alarmes', alarme.id)
      alarmeTocando.pedirSincronia()
      toast.success('Alarme excluído.')
      router.dismissTo('/alarmes')
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <View style={[estilosForm.cartao, sombras.suave]}>
      <FieldGrid>
        <Field
          ref={nomeRef}
          label="Nome do alarme"
          variant="creme"
          placeholder="Ex.: Antibiótico da Hayley"
          maxLength={60}
          value={values.nome}
          onChange={set('nome')}
          error={errors.nome}
        />
        <Field
          label="Paciente"
          as="select"
          placeholder="Selecione o pet correspondente"
          options={[...pets].sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => ({ value: p.id, label: p.nome }))}
          value={values.petId}
          onChange={set('petId')}
          error={errors.petId}
        />
        <Field
          ref={horaRef}
          label="Horário"
          variant="creme"
          icon={ClockIcon}
          placeholder="Ex.: 14:00"
          inputMode="numeric"
          value={values.hora}
          onChange={set('hora')}
          error={errors.hora}
        />
        <Field
          label="Recorrência / Data"
          as="select"
          options={OPCOES_RECORRENCIA}
          value={values.recorrencia}
          onChange={set('recorrencia')}
        />
        <Field
          ref={inicioRef}
          label={values.recorrencia === 'Somente hoje' ? 'Dia do alarme' : 'Começa em'}
          variant="creme"
          placeholder="dd/mm/aaaa"
          inputMode="numeric"
          value={values.inicio}
          onChange={set('inicio')}
          error={errors.inicio}
          hint={previa}
        />
        <Field
          span={2}
          label="Descrição"
          variant="creme"
          placeholder="Ex.: Antibiótico a cada 8h, dar junto com a ração"
          maxLength={140}
          value={values.descricao}
          onChange={set('descricao')}
        />
      </FieldGrid>

      <View style={estilos.status}>
        <Texto peso={700} style={estilos.legenda}>
          Situação inicial
        </Texto>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: values.ativo }}
          onPress={() => setValues((prev) => ({ ...prev, ativo: !prev.ativo }))}
          style={estilos.chave}
        >
          <Chave ligada={values.ativo} />
          <Texto peso={600} style={estilos.chaveTexto}>
            {values.ativo ? 'Ativo (toca no horário)' : 'Pausado (não toca)'}
          </Texto>
        </Pressable>
      </View>

      <View style={estilosForm.acoes}>
        {alarme && (
          <PillButton
            variant="perigo"
            onPress={() => setConfirming(true)}
            disabled={saving}
            style={{ flexBasis: '100%' }}
          >
            <TrashIcon size={15} />
            Excluir alarme
          </PillButton>
        )}
        <Pressable
          onPress={sair}
          disabled={saving}
          accessibilityRole="button"
          style={[estilosForm.botao, estilosForm.cancelar]}
        >
          <Texto peso={600} style={{ color: cores.cafe }}>
            Cancelar
          </Texto>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilosForm.botao,
            estilosForm.enviar,
            sombras.botao,
            pressed && { backgroundColor: cores.cafeHover },
            saving && { opacity: 0.7 },
          ]}
        >
          <Texto peso={600} style={{ color: cores.branco }}>
            {saving ? 'Salvando…' : 'Salvar alarme'}
          </Texto>
        </Pressable>
      </View>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Excluir alarme?"
        message="O lembrete some do painel, do app e do ESP32."
        confirmLabel="Excluir"
      />
    </View>
  )
}

const estilos = StyleSheet.create({
  status: { marginTop: 28 },
  legenda: { marginBottom: 10, fontSize: 16 },
  chave: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chaveTexto: { flex: 1, fontSize: 16, lineHeight: 23 },
})
