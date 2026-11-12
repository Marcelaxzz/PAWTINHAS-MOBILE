import { useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from './Page.jsx'
import { Field, FieldGrid } from './ui/Field.jsx'
import { EmptyState, ErrorState, LoadingState } from './ui/Basicos.jsx'
import { PillButton } from './ui/PillButton.jsx'
import { Texto } from './Texto.jsx'
import { ClockIcon } from '../web/components/Icons/Icons.jsx'
import { useClinic } from '../web/hooks/useClinic.js'
import { useToast } from '../web/hooks/useToast.js'
import { dataService } from '../web/services/dataService.js'
import { formatDateBr, isValidTime, maskDate, maskTime, parseDateBr, todayIso } from '../web/utils/dates.js'
import { NEW_PET } from '../web/components/ResourceForm/constants.js'
import { rotaDoApp } from '../plataforma/roteador.jsx'
import { cores, sombras } from '../tema.js'

function optionsFor(field, data) {
  if (field.type === 'pet') {
    const pets = [...(data?.pets ?? [])].sort((a, b) => a.nome.localeCompare(b.nome))
    const options = pets.map((p) => ({ value: p.id, label: `${p.nome} · ${p.especie}` }))
    return field.allowUnregistered ? [...options, { value: NEW_PET, label: 'Pet não cadastrado' }] : options
  }
  if (field.type === 'tutor') {
    return [...(data?.tutores ?? [])]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((t) => ({ value: t.id, label: t.nome }))
  }
  if (field.type === 'staff') {
    return (data?.profissionais ?? [])
      .filter((s) => !field.roles || field.roles.includes(s.funcao))
      .map((s) => ({ value: s.id, label: `${s.nome} · ${s.funcao}` }))
  }
  return (field.options ?? []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

function validate(field, value, values, editing) {
  const text = typeof value === 'string' ? value.trim() : value
  if (field.when && !field.when(values)) return ''
  if (field.required && !text) return field.requiredMessage ?? 'Campo obrigatório.'
  if (!text) return ''
  if (field.type === 'date') {
    const iso = parseDateBr(text)
    if (!iso) return 'Informe uma data válida (dd/mm/aaaa).'
    // Na edição, um agendamento antigo pode manter a data original.
    if (field.future && !editing && iso < todayIso()) return 'A data não pode estar no passado.'
    if (field.after && values[field.after]) {
      const start = parseDateBr(values[field.after])
      if (start && iso < start) return 'A data final deve ser depois da inicial.'
    }
  }
  if (field.type === 'time' && !isValidTime(text)) return 'Informe um horário válido (hh:mm).'
  if (field.type === 'datetime') {
    const [date, time] = text.split(' - ')
    if (!parseDateBr(date ?? '') || !isValidTime(time ?? '')) return 'Use o formato dd/mm/aaaa - hh:mm.'
  }
  if (field.maxLength && text.length > field.maxLength) return `Use no máximo ${field.maxLength} caracteres.`
  if (field.validate) return field.validate(text, values)
  return ''
}

function maskDateTime(value) {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  const date = maskDate(digits.slice(0, 8))
  if (digits.length <= 8) return date
  return `${date} - ${maskTime(digits.slice(8))}`
}

/** Valores do formulário a partir de um registro salvo (datas ISO viram dd/mm/aaaa). */
function defaultFromRecord(record, fields) {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.type === 'date' ? formatDateBr(record[f.name]) : (record[f.name] ?? f.defaultValue ?? ''),
    ]),
  )
}

/**
 * Formulário de agendamento configurável por campos (ResourceForm do site). Com `recordId`, edita.
 * fields: [{ name, label, type, placeholder, required, span, options, roles, ... }]
 */
export function ResourceForm({
  title,
  subtitle,
  resource,
  recordId,
  fromRecord,
  extraResources = [],
  redirectTo,
  ...props
}) {
  const editing = Boolean(recordId)
  const clinic = useClinic(editing ? [...extraResources, resource] : extraResources)
  const { data, loading, error, reload } = clinic
  const record = editing ? data?.[resource]?.find((r) => r.id === recordId) : null

  return (
    <Page title={title} subtitle={subtitle}>
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && editing && !record && (
        <EmptyState title="Registro não encontrado" action={<PillButton to={rotaDoApp(redirectTo)}>Voltar</PillButton>}>
          Ele pode ter sido excluído.
        </EmptyState>
      )}
      {data && (!editing || record) && (
        <ResourceFormContent
          key={recordId ?? 'novo'}
          {...props}
          resource={resource}
          redirectTo={redirectTo}
          clinic={clinic}
          record={record}
          initialValues={
            record ? (fromRecord ?? ((r) => defaultFromRecord(r, props.fields)))(record) : props.initialValues
          }
        />
      )}
    </Page>
  )
}

function ResourceFormContent({
  resource,
  fields,
  initialValues,
  toPayload,
  submitLabel,
  successMessage,
  redirectTo,
  footerExtra,
  clinic,
  record,
}) {
  const router = useRouter()
  const toast = useToast()
  const params = useLocalSearchParams()
  const { data, lookup } = clinic
  const refs = useRef({})
  const editing = Boolean(record)

  const [values, setValues] = useState(() => {
    const base = Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']))
    const fromQuery = params.pet
    return { ...base, ...(fromQuery && 'petId' in base ? { petId: String(fromQuery) } : {}), ...initialValues }
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const optionMap = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, optionsFor(f, data)])), [fields, data])

  const set = (field, raw) => {
    let value = raw
    if (field.type === 'date') value = maskDate(raw)
    if (field.type === 'time') value = maskTime(raw)
    if (field.type === 'datetime') value = maskDateTime(raw)

    setValues((prev) => {
      const next = { ...prev, [field.name]: value }
      // Ao escolher o pet, preenche o tutor responsável automaticamente.
      if (field.type === 'pet' && 'tutorId' in prev) {
        const tutorId = lookup.pet(value)?.tutorId
        if (tutorId) next.tutorId = tutorId
      }
      if (field.type === 'pet' && field.fillAddress && 'endereco' in prev) {
        const endereco = lookup.tutorOfPet(value)?.endereco
        if (endereco && !prev.endereco) next.endereco = endereco
      }
      return next
    })
    if (errors[field.name])
      setErrors((prev) => ({
        ...prev,
        [field.name]: validate(field, value, { ...values, [field.name]: value }, editing),
      }))
  }

  const voltar = (substituir) => {
    const destino = rotaDoApp(redirectTo)
    if (substituir) router.dismissTo(destino)
    else if (router.canGoBack()) router.back()
    else router.replace(destino)
  }

  const handleSubmit = async () => {
    if (saving) return
    const nextErrors = Object.fromEntries(fields.map((f) => [f.name, validate(f, values[f.name], values, editing)]))
    setErrors(nextErrors)
    const firstInvalid = fields.find((f) => nextErrors[f.name])
    if (firstInvalid) {
      refs.current[firstInvalid.name]?.focus?.()
      toast.error('Confira os campos destacados.')
      return
    }

    setSaving(true)
    try {
      const payload = toPayload(values, { lookup })
      if (editing) await dataService.update(resource, record.id, payload)
      else await dataService.create(resource, payload)
      toast.success(editing ? 'Alterações salvas!' : successMessage)
      voltar(true)
    } catch (err) {
      if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }))
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <View style={[estilos.cartao, sombras.suave]}>
      <FieldGrid>
        {fields
          .filter((field) => !field.when || field.when(values))
          .map((field) => {
            const isSelect = ['pet', 'tutor', 'staff', 'select'].includes(field.type)
            return (
              <Field
                key={field.name}
                ref={(el) => {
                  refs.current[field.name] = el
                }}
                label={field.label}
                span={field.span}
                as={isSelect ? 'select' : field.type === 'textarea' ? 'textarea' : 'input'}
                options={optionMap[field.name]}
                placeholder={field.placeholder}
                required={field.required}
                icon={field.type === 'time' && field.withIcon ? ClockIcon : undefined}
                inputMode={['date', 'time', 'datetime'].includes(field.type) ? 'numeric' : undefined}
                autoComplete="off"
                maxLength={field.maxLength}
                value={values[field.name]}
                error={errors[field.name]}
                hint={field.hint}
                onChange={(value) => set(field, value)}
              />
            )
          })}
      </FieldGrid>

      {footerExtra?.(values, setValues)}

      <View style={estilos.acoes}>
        <Pressable
          onPress={() => voltar(false)}
          disabled={saving}
          accessibilityRole="button"
          style={[estilos.botao, estilos.cancelar, saving && { opacity: 0.7 }]}
        >
          <Texto peso={600} style={{ color: cores.cafe }}>
            Cancelar
          </Texto>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ busy: saving }}
          style={({ pressed }) => [
            estilos.botao,
            estilos.enviar,
            sombras.botao,
            pressed && { backgroundColor: cores.cafeHover },
            saving && { opacity: 0.7 },
          ]}
        >
          <Texto peso={600} style={{ color: cores.branco, textAlign: 'center' }}>
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : submitLabel}
          </Texto>
        </Pressable>
      </View>
    </View>
  )
}

/** Estilos do cartão e dos botões, reaproveitados por outros formulários (alarme, paciente...). */
export const estilosForm = StyleSheet.create({
  cartao: {
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 22,
    backgroundColor: cores.branco,
  },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 16, marginTop: 28 },
  botao: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: 48,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  cancelar: { borderWidth: 1.5, borderColor: cores.cafe },
  enviar: { backgroundColor: cores.cafe },
})

const estilos = estilosForm
