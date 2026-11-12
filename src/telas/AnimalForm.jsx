import { useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Field, FieldGrid } from '../componentes/ui/Field.jsx'
import { PhotoPicker } from '../componentes/PhotoPicker.jsx'
import { estilosForm } from '../componentes/ResourceForm.jsx'
import { CheckItem } from './calculadoras/comum.jsx'
import { Texto } from '../componentes/Texto.jsx'
import { CalendarIcon, MapPinIcon, PawOutline } from '../web/components/Icons/Icons.jsx'
import { formatDateBr, idadeDe, maskDate, parseDateBr, todayIso } from '../web/utils/dates.js'
import { isHttpsImageUrl, photoSrc } from '../plataforma/imagens.js'
import { useToast } from '../web/hooks/useToast.js'
import { cores, sombras } from '../tema.js'

const ESPECIES = ['Cachorro', 'Gato', 'Coelho', 'Calopsita', 'Outro']
const SEXOS = ['Macho', 'Fêmea', 'Casal']
const PORTES = ['Pequeno', 'Médio', 'Grande']
const STATUS = ['Disponível', 'Em processo', 'Adotado']
const CONVIVENCIA = [
  { key: 'vacinado', label: 'Vacinado' },
  { key: 'castrado', label: 'Castrado' },
  { key: 'conviveAnimais', label: 'Convive com outros animais' },
  { key: 'conviveCriancas', label: 'Convive com crianças' },
]

const opts = (list) => list.map((value) => ({ value, label: value }))

/**
 * Ficha do animal para adoção (AnimalForm do site).
 * variant="modal":  "Editar animal" (rótulos em caixa alta, campo de link da imagem)
 * variant="pagina": "Novo animal para adoção"
 */
export function AnimalForm({ animal, variant = 'pagina', onSubmit, onCancel, saving, submitLabel }) {
  const toast = useToast()
  const refs = useRef({})
  const [values, setValues] = useState(() => ({
    nome: animal?.nome ?? '',
    especie: animal?.especie ?? 'Cachorro',
    raca: animal?.raca ?? '',
    sexo: animal?.sexo ?? 'Macho',
    nascimento: formatDateBr(animal?.dataNascimento),
    porte: animal?.porte ?? 'Médio',
    peso: animal?.peso ?? '',
    cidade: animal?.cidade ?? '',
    descricao: animal?.descricao ?? '',
    personalidade: animal?.personalidade ?? '',
    status: animal?.status ?? 'Disponível',
    dataEntrada: animal?.dataEntrada ? formatDateBr(animal.dataEntrada) : formatDateBr(todayIso()),
    infoAdicional: animal?.infoAdicional ?? '',
    foto: animal?.foto ?? '',
    fotoUrl: '',
    vacinado: animal?.vacinado ?? false,
    castrado: animal?.castrado ?? false,
    conviveAnimais: animal?.conviveAnimais ?? false,
    conviveCriancas: animal?.conviveCriancas ?? false,
  }))
  const [errors, setErrors] = useState({})
  const modal = variant === 'modal'

  const set =
    (field, transform = (v) => v) =>
    (texto) => {
      setValues((prev) => ({ ...prev, [field]: transform(texto) }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const handleSubmit = () => {
    const nextErrors = {
      nome: values.nome.trim() ? '' : 'Informe o nome do animal.',
      cidade: values.cidade.trim() ? '' : 'Informe a cidade.',
      descricao: values.descricao.trim() ? '' : 'Conte um pouco sobre o animal.',
      peso:
        values.peso && !/^\d{1,3}([.,]\d{1,2})?\s*(kg)?$/i.test(values.peso.trim())
          ? 'Use apenas números (ex: 12 ou 3,5).'
          : '',
      dataEntrada:
        values.dataEntrada && !parseDateBr(values.dataEntrada) ? 'Informe uma data válida (dd/mm/aaaa).' : '',
      nascimento: values.nascimento && !parseDateBr(values.nascimento) ? 'Informe uma data válida (dd/mm/aaaa).' : '',
      fotoUrl: values.fotoUrl && !isHttpsImageUrl(values.fotoUrl) ? 'Use um link https:// de imagem.' : '',
    }
    setErrors(nextErrors)
    const first = Object.keys(nextErrors).find((key) => nextErrors[key])
    if (first) {
      refs.current[first]?.focus?.()
      toast.error('Confira os campos destacados.')
      return
    }

    const descricao = values.descricao.trim()
    onSubmit({
      nome: values.nome.trim(),
      especie: values.especie,
      raca: values.raca.trim(),
      sexo: values.sexo,
      dataNascimento: values.nascimento ? parseDateBr(values.nascimento) : '',
      porte: values.porte,
      peso: values.peso
        .trim()
        .replace(/\s*kg$/i, '')
        .replace('.', ','),
      cidade: values.cidade.trim(),
      descricao,
      sobre: animal?.sobre && animal.descricao === descricao ? animal.sobre : descricao,
      frase: animal?.frase ?? values.personalidade.trim(),
      personalidade: values.personalidade.trim(),
      status: values.status,
      dataEntrada: parseDateBr(values.dataEntrada) ?? todayIso(),
      infoAdicional: values.infoAdicional.trim(),
      foto: values.fotoUrl.trim() || values.foto,
      vacinado: values.vacinado,
      castrado: values.castrado,
      conviveAnimais: values.conviveAnimais,
      conviveCriancas: values.conviveCriancas,
      necessidades: animal?.necessidades ?? 'Nenhuma',
    })
  }

  const common = { variant: modal ? 'branco' : 'creme', caps: modal }

  // No modal a ordem é Raça/Sexo; na página de cadastro, Sexo/Raça.
  const racaField = (
    <Field
      key="raca"
      label="Raça"
      {...common}
      placeholder="Ex.: Golden, Siamês, SRD..."
      maxLength={60}
      value={values.raca}
      onChange={set('raca')}
    />
  )
  const sexoField = (
    <Field
      key="sexo"
      label="Sexo"
      as="select"
      {...common}
      options={opts(SEXOS)}
      value={values.sexo}
      onChange={set('sexo')}
    />
  )

  return (
    <View>
      <View style={[estilos.foto, modal && estilos.fotoModal]}>
        {modal && (
          <Texto peso={700} style={estilos.rotuloFoto}>
            FOTO DO ANIMAL
          </Texto>
        )}
        <PhotoPicker
          value={photoSrc(
            values.fotoUrl.trim() && isHttpsImageUrl(values.fotoUrl) ? values.fotoUrl.trim() : values.foto,
          )}
          onChange={(foto) => setValues((prev) => ({ ...prev, foto, fotoUrl: '' }))}
          label={modal ? 'Toque para enviar uma foto' : 'Enviar foto do animal'}
          hint={modal ? 'PNG, JPG até 5MB' : 'PNG ou JPG de até 5MB'}
          variant={modal ? 'upload' : 'camera'}
        />
        {modal && (
          <Field
            span={2}
            ref={(el) => {
              refs.current.fotoUrl = el
            }}
            label="Ou cole o link da imagem"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://..."
            maxLength={500}
            value={values.fotoUrl}
            onChange={set('fotoUrl')}
            error={errors.fotoUrl}
            style={{ marginTop: 6 }}
            caps
          />
        )}
      </View>

      <FieldGrid>
        <Field
          ref={(el) => {
            refs.current.nome = el
          }}
          label={modal ? 'Nome' : 'Nome do animal'}
          required={modal}
          {...common}
          placeholder="Ex.: Rex, Luna, Simba..."
          maxLength={60}
          value={values.nome}
          onChange={set('nome')}
          error={errors.nome}
        />
        <Field
          label="Espécie"
          required={modal}
          as="select"
          {...common}
          icon={modal ? PawOutline : undefined}
          options={opts(ESPECIES)}
          value={values.especie}
          onChange={set('especie')}
        />
        {modal ? [racaField, sexoField] : [sexoField, racaField]}
        <Field
          ref={(el) => {
            refs.current.nascimento = el
          }}
          label="Nascimento (aproximado)"
          {...common}
          placeholder="dd/mm/aaaa"
          inputMode="numeric"
          maxLength={10}
          value={values.nascimento}
          onChange={set('nascimento', maskDate)}
          error={errors.nascimento}
          hint={parseDateBr(values.nascimento) ? `Idade: ${idadeDe(parseDateBr(values.nascimento))}` : undefined}
        />
        <Field
          label="Porte"
          as="select"
          {...common}
          options={opts(PORTES)}
          value={values.porte}
          onChange={set('porte')}
        />
        <Field
          ref={(el) => {
            refs.current.peso = el
          }}
          label={modal ? 'Peso' : 'Peso (kg)'}
          {...common}
          placeholder="Ex.: 12"
          inputMode="decimal"
          maxLength={9}
          value={values.peso}
          onChange={set('peso')}
          error={errors.peso}
        />
        <Field
          ref={(el) => {
            refs.current.cidade = el
          }}
          label="Localização"
          {...common}
          icon={modal ? MapPinIcon : undefined}
          placeholder="Ex.: Brasília - DF"
          maxLength={60}
          value={values.cidade}
          onChange={set('cidade')}
          error={errors.cidade}
        />
        <Field
          span={2}
          ref={(el) => {
            refs.current.descricao = el
          }}
          label="Descrição"
          as="textarea"
          {...common}
          maxLength={600}
          placeholder="Conte um pouco sobre a história e temperamento..."
          value={values.descricao}
          onChange={set('descricao')}
          error={errors.descricao}
        />
        <Field
          span={2}
          label="Personalidade"
          {...common}
          maxLength={100}
          placeholder="Ex.: Brincalhão, dócil, independente..."
          value={values.personalidade}
          onChange={set('personalidade')}
        />
        <Field
          label="Status"
          as="select"
          {...common}
          options={opts(STATUS)}
          value={values.status}
          onChange={set('status')}
        />
        {modal && (
          <Field
            ref={(el) => {
              refs.current.dataEntrada = el
            }}
            label="Data de entrada"
            {...common}
            icon={CalendarIcon}
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={values.dataEntrada}
            onChange={set('dataEntrada', maskDate)}
            error={errors.dataEntrada}
          />
        )}
        {modal && (
          <Field
            span={2}
            label="Informações adicionais"
            {...common}
            maxLength={140}
            placeholder="Ex.: Vacinado e vermifugado"
            value={values.infoAdicional}
            onChange={set('infoAdicional')}
          />
        )}
      </FieldGrid>

      <View style={estilos.convivencia}>
        <Texto peso={700} style={[estilos.legenda, modal && { fontSize: 15 }]}>
          {modal ? 'SAÚDE E CONVIVÊNCIA' : 'Saúde e convivência'}
        </Texto>
        <View style={estilos.checks}>
          {CONVIVENCIA.map((item) => (
            <CheckItem
              key={item.key}
              checked={values[item.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v }))}
              titulo={item.label}
              compacto
            />
          ))}
        </View>
      </View>

      <View style={[estilosForm.acoes, { marginTop: 32 }, modal && estilos.acoesModal]}>
        <Pressable
          onPress={onCancel}
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
            {saving ? 'Salvando…' : submitLabel}
          </Texto>
        </Pressable>
      </View>
    </View>
  )
}

const estilos = StyleSheet.create({
  foto: { gap: 12, marginBottom: 28 },
  fotoModal: { paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: cores.borda },
  rotuloFoto: { fontSize: 15 },
  convivencia: {
    gap: 12,
    marginTop: 26,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
  },
  legenda: { fontSize: 16 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 12 },
  acoesModal: { paddingTop: 28, borderTopWidth: 1, borderTopColor: cores.borda },
})
