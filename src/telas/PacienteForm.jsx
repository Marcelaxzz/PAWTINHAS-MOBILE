import { useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from '../componentes/Page.jsx'
import { Field, FieldGrid } from '../componentes/ui/Field.jsx'
import { EmptyState, ErrorState, LoadingState } from '../componentes/ui/Basicos.jsx'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { PhotoPicker } from '../componentes/PhotoPicker.jsx'
import { estilosForm } from '../componentes/ResourceForm.jsx'
import { Texto } from '../componentes/Texto.jsx'
import { useClinic } from '../web/hooks/useClinic.js'
import { useToast } from '../web/hooks/useToast.js'
import { dataService } from '../web/services/dataService.js'
import { photoSrc } from '../plataforma/imagens.js'
import { maskPhone } from '../web/utils/masks.js'
import { formatDateBr, idadeDe, maskDate, parseDateBr, todayIso } from '../web/utils/dates.js'
import { validatePhone } from '../web/utils/validators.js'
import { cores, sombras } from '../tema.js'

const NEW_TUTOR = '__novo_tutor'
const ESPECIES = ['Cachorro', 'Gato', 'Coelho', 'Ave', 'Roedor', 'Réptil', 'Outro']

/** Novo paciente / editar paciente (PacienteForm do site). */
export function PacienteForm() {
  const { id } = useLocalSearchParams()
  const { data, loading, error, reload } = useClinic()
  const pet = data?.pets.find((p) => p.id === id)
  const editing = Boolean(id)

  return (
    <Page
      title={editing ? 'Editar paciente' : 'Novo paciente'}
      subtitle={
        editing
          ? 'Atualize as informações da ficha do pawtinha.'
          : 'Preencha a ficha para cadastrar um novo pawtinha na clínica.'
      }
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && editing && !pet && (
        <EmptyState
          title="Paciente não encontrado"
          action={<PillButton to="/pacientes">Voltar aos pacientes</PillButton>}
        />
      )}
      {data && (!editing || pet) && <PacienteFormContent key={id ?? 'novo'} pet={pet} tutoresIniciais={data.tutores} />}
    </Page>
  )
}

function PacienteFormContent({ pet, tutoresIniciais }) {
  const router = useRouter()
  const toast = useToast()
  const refs = useRef({})
  const [tutores, setTutores] = useState(tutoresIniciais)
  const [values, setValues] = useState(() => ({
    nome: pet?.nome ?? '',
    especie: pet?.especie ?? 'Cachorro',
    raca: pet?.raca ?? '',
    nascimento: formatDateBr(pet?.dataNascimento),
    sexo: pet?.sexo ?? 'Macho',
    peso: pet?.peso ?? '',
    tutorId: pet?.tutorId ?? '',
    tutorNome: '',
    tutorTelefone: '',
    tutorEndereco: '',
    observacoes: pet?.observacoes ?? '',
    foto: pet?.foto ?? '',
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const newTutor = values.tutorId === NEW_TUTOR

  const set =
    (field, transform = (v) => v) =>
    (texto) => {
      setValues((prev) => ({ ...prev, [field]: transform(texto) }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const handleSubmit = async () => {
    const nextErrors = {
      nome: values.nome.trim() ? '' : 'Informe o nome do paciente.',
      raca: values.raca.trim() ? '' : 'Informe a raça (ou SRD).',
      tutorId: values.tutorId ? '' : 'Selecione o tutor responsável.',
      tutorNome: newTutor && !values.tutorNome.trim() ? 'Informe o nome do tutor.' : '',
      tutorTelefone: newTutor ? validatePhone(values.tutorTelefone) : '',
      peso: values.peso && !/^\d{1,3}([.,]\d{1,2})?$/.test(values.peso.trim()) ? 'Use apenas números (ex: 12,5).' : '',
      nascimento: !values.nascimento
        ? ''
        : !parseDateBr(values.nascimento)
          ? 'Use o formato dd/mm/aaaa.'
          : parseDateBr(values.nascimento) > todayIso()
            ? 'A data não pode estar no futuro.'
            : '',
    }
    setErrors(nextErrors)
    const first = Object.keys(nextErrors).find((key) => nextErrors[key])
    if (first) {
      refs.current[first]?.focus?.()
      toast.error('Confira os campos destacados.')
      return
    }

    setSaving(true)
    try {
      let tutorId = values.tutorId
      if (newTutor) {
        const tutor = await dataService.create('tutores', {
          nome: values.tutorNome.trim(),
          telefone: values.tutorTelefone,
          endereco: values.tutorEndereco.trim(),
        })
        tutorId = tutor.id
        // Se o cadastro do pet falhar, tentar de novo não cria o tutor duas vezes.
        setTutores((prev) => [...prev, tutor])
        setValues((prev) => ({ ...prev, tutorId }))
      }
      const payload = {
        nome: values.nome.trim(),
        especie: values.especie,
        raca: values.raca.trim(),
        dataNascimento: values.nascimento ? parseDateBr(values.nascimento) : '',
        sexo: values.sexo,
        peso: values.peso.trim().replace('.', ','),
        tutorId,
        observacoes: values.observacoes.trim(),
        foto: values.foto,
      }
      const saved = pet ? await dataService.update('pets', pet.id, payload) : await dataService.create('pets', payload)
      toast.success(pet ? 'Ficha atualizada!' : `${saved.nome} foi cadastrado(a)!`)
      if (pet) router.dismissTo(`/pacientes/${saved.id}`)
      else router.replace(`/pacientes/${saved.id}`)
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  const cancelar = () =>
    router.canGoBack() ? router.back() : router.replace(pet ? `/pacientes/${pet.id}` : '/pacientes')

  return (
    <View style={[estilosForm.cartao, sombras.suave]}>
      <View style={estilos.foto}>
        <Texto peso={700} style={estilos.rotulo}>
          Foto do paciente
        </Texto>
        <PhotoPicker
          value={photoSrc(values.foto)}
          onChange={(foto) => setValues((prev) => ({ ...prev, foto }))}
          label="Enviar foto do paciente"
        />
      </View>

      <FieldGrid>
        <Field
          ref={(el) => {
            refs.current.nome = el
          }}
          label="Nome do paciente"
          required
          placeholder="Ex.: Rex, Luna, Simba..."
          maxLength={60}
          value={values.nome}
          onChange={set('nome')}
          error={errors.nome}
        />
        <Field
          label="Espécie"
          as="select"
          options={ESPECIES.map((e) => ({ value: e, label: e }))}
          value={values.especie}
          onChange={set('especie')}
        />
        <Field
          ref={(el) => {
            refs.current.raca = el
          }}
          label="Raça"
          required
          placeholder="Ex.: Golden, Siamês, SRD..."
          maxLength={60}
          value={values.raca}
          onChange={set('raca')}
          error={errors.raca}
        />
        <Field
          ref={(el) => {
            refs.current.nascimento = el
          }}
          label="Data de nascimento"
          placeholder="dd/mm/aaaa"
          inputMode="numeric"
          maxLength={10}
          value={values.nascimento}
          onChange={set('nascimento', maskDate)}
          error={errors.nascimento}
          hint={
            parseDateBr(values.nascimento)
              ? `Idade: ${idadeDe(parseDateBr(values.nascimento))}`
              : 'Se não souber o dia exato, use uma data aproximada.'
          }
        />
        <Field
          label="Sexo"
          as="select"
          options={['Macho', 'Fêmea'].map((s) => ({ value: s, label: s }))}
          value={values.sexo}
          onChange={set('sexo')}
        />
        <Field
          ref={(el) => {
            refs.current.peso = el
          }}
          label="Peso (kg)"
          placeholder="Ex.: 12"
          inputMode="decimal"
          maxLength={6}
          value={values.peso}
          onChange={set('peso')}
          error={errors.peso}
        />
        <Field
          span={2}
          label="Tutor/Responsável"
          as="select"
          required
          placeholder="Selecione o tutor"
          options={[
            ...[...tutores].sort((a, b) => a.nome.localeCompare(b.nome)).map((t) => ({ value: t.id, label: t.nome })),
            { value: NEW_TUTOR, label: '+ Cadastrar novo tutor' },
          ]}
          value={values.tutorId}
          onChange={set('tutorId')}
          error={errors.tutorId}
        />
        {newTutor && (
          <>
            <Field
              ref={(el) => {
                refs.current.tutorNome = el
              }}
              label="Nome do tutor"
              required
              maxLength={100}
              autoComplete="off"
              value={values.tutorNome}
              onChange={set('tutorNome')}
              error={errors.tutorNome}
            />
            <Field
              ref={(el) => {
                refs.current.tutorTelefone = el
              }}
              label="Telefone do tutor"
              required
              inputMode="tel"
              placeholder="(11) 99999-9999"
              maxLength={15}
              value={values.tutorTelefone}
              onChange={set('tutorTelefone', maskPhone)}
              error={errors.tutorTelefone}
            />
            <Field
              span={2}
              label="Endereço do tutor"
              maxLength={160}
              placeholder="Rua, número, bairro"
              value={values.tutorEndereco}
              onChange={set('tutorEndereco')}
            />
          </>
        )}
        <Field
          span={2}
          label="Observações"
          as="textarea"
          maxLength={1000}
          placeholder="Alergias, medicações de uso contínuo, comportamento durante o atendimento..."
          value={values.observacoes}
          onChange={set('observacoes')}
        />
      </FieldGrid>

      <View style={estilosForm.acoes}>
        <Pressable
          onPress={cancelar}
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
          <Texto peso={600} style={{ color: cores.branco, textAlign: 'center' }}>
            {saving ? 'Salvando…' : pet ? 'Salvar alterações' : 'Cadastrar paciente'}
          </Texto>
        </Pressable>
      </View>
    </View>
  )
}

const estilos = StyleSheet.create({
  foto: { gap: 8, marginBottom: 28 },
  rotulo: { fontSize: 16 },
})
