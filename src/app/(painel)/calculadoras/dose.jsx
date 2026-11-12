import { useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { Field, FieldGrid } from '../../../componentes/ui/Field.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { Forte, Texto, Titulo } from '../../../componentes/Texto.jsx'
import { ClockIcon, PillIcon } from '../../../web/components/Icons/Icons.jsx'
import { useCollections } from '../../../web/hooks/useCollections.js'
import { useSimulation } from '../../../web/hooks/useSimulation.js'
import { useToast } from '../../../web/hooks/useToast.js'
import { clinicService } from '../../../web/services/clinicService.js'
import { dataService } from '../../../web/services/dataService.js'
import { formatDateBr, isValidTime, maskDate, maskTime, parseDateBr, todayIso } from '../../../web/utils/dates.js'
import {
  formatNumber,
  formatQuantidade,
  intervaloLabel,
  maskDecimal,
  parseDecimal,
} from '../../../web/utils/numbers.js'
import { CALCULADORAS_TABS } from '../../../web/pages/calculadoras/calculadorasTabs.js'
import { alarmeTocando } from '../../../alarmes/estado.js'
import {
  calc,
  CheckItem,
  GradeNumeros,
  Mensagem,
  Numero,
  Pendencias,
  Secao,
} from '../../../telas/calculadoras/comum.jsx'
import { Grade } from '../../../componentes/ui/Grade.jsx'

const MANUAL = '__manual'
const INTERVALOS = [4, 6, 8, 12, 24, 48, 72]
const ALARME_INTERVALOS = [8, 12, 24]
const UNIDADES = [
  { value: 'comprimido', label: 'Comprimido (mg por comprimido)' },
  { value: 'cápsula', label: 'Cápsula (mg por cápsula)' },
  { value: 'mL', label: 'Líquido (mg por mL)' },
  { value: 'gota', label: 'Gotas (mg por gota)' },
]
const CONCENTRACAO = { comprimido: 'mg/comprimido', cápsula: 'mg/cápsula', mL: 'mg/mL', gota: 'mg/gota' }

function proximaHoraCheia() {
  const hora = (new Date().getHours() + 1) % 24
  return `${String(hora).padStart(2, '0')}:00`
}

function faixaTexto(min, max) {
  if (min == null && max == null) return null
  if (min != null && max != null && min === max) return `${formatNumber(min, 3)} mg/kg`
  if (min != null && max != null) return `${formatNumber(min, 3)} a ${formatNumber(max, 3)} mg/kg`
  return min != null ? `mínimo ${formatNumber(min, 3)} mg/kg` : `máximo ${formatNumber(max, 3)} mg/kg`
}

export default function CalculoDose() {
  const { data, loading, error, reload } = useCollections(['pets', 'medicamentos'])

  return (
    <Page width="largo" title="Dose de medicamento" tabs={CALCULADORAS_TABS}>
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && <DoseForm pets={data.pets} medicamentos={data.medicamentos} />}
    </Page>
  )
}

function DoseForm({ pets, medicamentos }) {
  const router = useRouter()
  const toast = useToast()
  const params = useLocalSearchParams()
  const { width } = useWindowDimensions()

  const [values, setValues] = useState(() => {
    const pet = pets.find((p) => p.id === params.pet)
    return {
      petId: pet?.id ?? '',
      especie: pet?.especie ?? 'Cachorro',
      pesoKg: pet?.peso ?? '',
      medicamentoId: '',
      medicamento: '',
      unidade: 'comprimido',
      concentracao: '',
      fracionavel: true,
      via: 'Oral',
      doseMgKg: '',
      intervaloHoras: '',
      duracaoDias: '7',
      inicio: formatDateBr(todayIso()),
      horaPrimeiraDose: proximaHoraCheia(),
      observacoes: '',
      criarAlarme: false,
      atualizarPeso: false,
    }
  })
  const [confirmadoPara, setConfirmadoPara] = useState('')
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const pet = pets.find((p) => p.id === values.petId)
  const manual = values.medicamentoId === MANUAL
  const med = medicamentos.find((m) => m.id === values.medicamentoId)
  const especie = pet?.especie ?? values.especie
  // Exemplo do campo de dose: o mínimo da faixa do medicamento para a espécie, quando houver.
  const doseExemplo = med && (especie === 'Gato' ? med.doseMinGato : especie === 'Cachorro' ? med.doseMinCao : null)
  const unidade = med?.unidade ?? values.unidade
  const intervalo = Number(values.intervaloHoras) || null
  const pesoDiferente = pet && parseDecimal(values.pesoKg) !== parseDecimal(pet.peso)

  const set = (campo, valor) => {
    setValues((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
  }

  const escolherPet = (id) => {
    const escolhido = pets.find((p) => p.id === id)
    setValues((prev) => ({
      ...prev,
      petId: id,
      especie: escolhido?.especie ?? prev.especie,
      pesoKg: escolhido?.peso || prev.pesoKg,
      atualizarPeso: false,
    }))
  }

  const escolherMedicamento = (id) => {
    const escolhido = medicamentos.find((m) => m.id === id)
    setValues((prev) => ({
      ...prev,
      medicamentoId: id,
      intervaloHoras: escolhido?.intervaloPadraoHoras ? String(escolhido.intervaloPadraoHoras) : prev.intervaloHoras,
      via: escolhido?.via ?? prev.via,
    }))
  }

  const payload = {
    petId: values.petId || null,
    especie,
    pesoKg: parseDecimal(values.pesoKg),
    medicamentoId: manual ? null : values.medicamentoId || null,
    medicamento: manual ? values.medicamento.trim() : (med?.nome ?? ''),
    unidade,
    concentracao: manual ? parseDecimal(values.concentracao) : null,
    fracionavel: manual ? values.unidade === 'comprimido' && values.fracionavel : undefined,
    via: values.via,
    doseMgKg: parseDecimal(values.doseMgKg),
    intervaloHoras: intervalo,
    duracaoDias: Number(values.duracaoDias) || null,
  }

  const pronto = Boolean(
    payload.pesoKg &&
    payload.doseMgKg &&
    payload.intervaloHoras &&
    payload.duracaoDias &&
    (payload.medicamentoId || (manual && payload.concentracao)),
  )
  const { result, error, fields, loading } = useSimulation(clinicService.simularDose, payload, pronto)

  const alertasChave = result?.alertas?.join('|') ?? ''
  const confirmado = Boolean(alertasChave) && confirmadoPara === alertasChave
  const precisaConfirmar = Boolean(result?.alertas?.length) && !confirmado
  const alarmePossivel = ALARME_INTERVALOS.includes(intervalo)
  const errosCampo = { ...fields, ...erros }

  const salvar = async () => {
    const proximos = {
      petId: values.petId ? '' : 'Selecione o paciente para salvar a prescrição.',
      medicamento: manual && !values.medicamento.trim() ? 'Informe o nome do medicamento.' : '',
      inicio: parseDateBr(values.inicio) ? '' : 'Informe uma data válida (dd/mm/aaaa).',
      horaPrimeiraDose: isValidTime(values.horaPrimeiraDose) ? '' : 'Informe um horário válido (hh:mm).',
    }
    setErros(proximos)
    if (Object.values(proximos).some(Boolean) || !result || precisaConfirmar) return

    setSalvando(true)
    try {
      await dataService.create('prescricoes', {
        ...payload,
        inicio: parseDateBr(values.inicio),
        horaPrimeiraDose: values.horaPrimeiraDose,
        observacoes: values.observacoes.trim(),
        confirmarAlertas: confirmado,
        criarAlarme: alarmePossivel && values.criarAlarme,
        atualizarPesoPaciente: Boolean(pesoDiferente && values.atualizarPeso),
      })
      if (alarmePossivel && values.criarAlarme) alarmeTocando.pedirSincronia()
      toast.success(
        values.criarAlarme && alarmePossivel
          ? 'Prescrição salva e alarme criado no ESP32!'
          : 'Prescrição salva na ficha do paciente!',
      )
      router.push(`/pacientes/${encodeURIComponent(values.petId)}`)
    } catch (err) {
      if (err.fields) setErros(err.fields)
      toast.error(err.message)
      setSalvando(false)
    }
  }

  const faixa = med && result ? faixaTexto(result.doseMinMgKg, result.doseMaxMgKg) : null
  const faixaEspecie = med
    ? faixaTexto(
        especie === 'Gato' ? med.doseMinGato : especie === 'Cachorro' ? med.doseMinCao : null,
        especie === 'Gato' ? med.doseMaxGato : especie === 'Cachorro' ? med.doseMaxCao : null,
      )
    : null

  return (
    <Grade colunas={[1.2, 0.8]} quebras={{ 1000: 1 }} gap={24} esticar={false} style={calc.layout}>
      <View style={calc.cartao}>
        <Secao titulo="Paciente" numero={1} primeira>
          <FieldGrid>
            <Field
              label="Paciente"
              as="select"
              options={[
                { value: '', label: 'Sem paciente (apenas simular)' },
                ...[...pets]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((p) => ({ value: p.id, label: `${p.nome} · ${p.especie}` })),
              ]}
              value={values.petId}
              onChange={escolherPet}
              error={errosCampo.petId}
            />
            {pet ? (
              <Field label="Espécie" value={pet.especie} editable={false} variant="areia" />
            ) : (
              <Field
                label="Espécie"
                as="select"
                options={['Cachorro', 'Gato', 'Outra'].map((v) => ({ value: v, label: v }))}
                value={values.especie}
                onChange={(v) => set('especie', v)}
              />
            )}
            <Field
              label="Peso (kg)"
              required
              inputMode="decimal"
              placeholder="Ex.: 12,5"
              value={values.pesoKg}
              onChange={(v) => set('pesoKg', maskDecimal(v, 6))}
              error={errosCampo.pesoKg}
              hint={pet && !pet.peso ? 'Este paciente ainda não tem peso na ficha.' : undefined}
            />
          </FieldGrid>
          {pesoDiferente && (
            <View style={calc.checks}>
              <CheckItem
                checked={values.atualizarPeso}
                onChange={(v) => set('atualizarPeso', v)}
                titulo={`Atualizar o peso na ficha de ${pet.nome}`}
                apoio={`Na ficha: ${pet.peso ? `${pet.peso} kg` : 'sem peso'}`}
              />
            </View>
          )}
        </Secao>

        <Secao titulo="Medicamento" numero={2}>
          <FieldGrid>
            <Field
              span={2}
              label="Medicamento"
              as="select"
              placeholder="Selecione do catálogo…"
              options={[
                ...medicamentos.map((m) => ({ value: m.id, label: m.nome })),
                { value: MANUAL, label: 'Outro (informar a concentração)' },
              ]}
              value={values.medicamentoId}
              onChange={escolherMedicamento}
              error={errosCampo.medicamentoId}
            />
            {manual && (
              <>
                <Field
                  span={2}
                  label="Nome do medicamento"
                  required
                  maxLength={80}
                  value={values.medicamento}
                  onChange={(v) => set('medicamento', v)}
                  error={errosCampo.medicamento}
                />
                <Field
                  label="Apresentação"
                  as="select"
                  options={UNIDADES}
                  value={values.unidade}
                  onChange={(v) => set('unidade', v)}
                />
                <Field
                  label={`Concentração (${CONCENTRACAO[values.unidade]})`}
                  required
                  inputMode="decimal"
                  value={values.concentracao}
                  onChange={(v) => set('concentracao', maskDecimal(v, 9))}
                  error={errosCampo.concentracao}
                />
                <Field
                  label="Via"
                  as="select"
                  options={['Oral', 'Subcutânea', 'Intramuscular', 'Intravenosa'].map((v) => ({ value: v, label: v }))}
                  value={values.via}
                  onChange={(v) => set('via', v)}
                />
              </>
            )}
          </FieldGrid>
          {manual && values.unidade === 'comprimido' && (
            <View style={calc.checks}>
              <CheckItem
                checked={values.fracionavel}
                onChange={(v) => set('fracionavel', v)}
                titulo="Comprimido sulcado (pode ser partido)"
                apoio="A dose é arredondada para 1/4 de comprimido; sem sulco, para o comprimido inteiro."
              />
            </View>
          )}
          {med && (
            <View style={calc.info}>
              <Texto style={calc.infoTexto}>
                <Forte>{formatNumber(med.concentracao, 3)}</Forte> {CONCENTRACAO[med.unidade]}
              </Texto>
              <Texto style={calc.infoTexto}>Via {med.via.toLowerCase()}</Texto>
              {med.unidade === 'comprimido' && (
                <Texto style={calc.infoTexto}>{med.fracionavel ? 'Sulcado' : 'Não partir'}</Texto>
              )}
              <Texto style={calc.infoTexto}>
                Faixa ({especie === 'Gato' ? 'gatos' : especie === 'Cachorro' ? 'cães' : especie.toLowerCase()}):{' '}
                <Forte>{faixaEspecie ?? 'não cadastrada'}</Forte>
              </Texto>
            </View>
          )}
          {med && (med.observacoes || med.fonte) ? (
            <View style={calc.referencia}>
              {med.observacoes ? <Texto style={calc.referenciaTexto}>{med.observacoes}</Texto> : null}
              {med.fonte ? <Texto style={calc.fonteMed}>Fonte: {med.fonte}</Texto> : null}
            </View>
          ) : null}
          {medicamentos.length === 0 && (
            <View style={calc.info}>
              <Texto style={calc.infoTexto}>
                O catálogo está vazio.{' '}
                <Texto
                  style={[calc.infoTexto, { textDecorationLine: 'underline' }]}
                  onPress={() => router.push('/calculadoras/medicamentos')}
                >
                  Cadastre os medicamentos da clínica
                </Texto>{' '}
                ou use “Outro”.
              </Texto>
            </View>
          )}
        </Secao>

        <Secao titulo="Posologia" numero={3}>
          <FieldGrid>
            <Field
              label="Dose (mg/kg)"
              required
              inputMode="decimal"
              placeholder={doseExemplo ? `Ex.: ${formatNumber(doseExemplo, 3)}` : 'Ex.: 12,5'}
              value={values.doseMgKg}
              onChange={(v) => set('doseMgKg', maskDecimal(v, 8))}
              error={errosCampo.doseMgKg}
            />
            <Field
              label="Intervalo entre as doses"
              as="select"
              required
              placeholder="Selecione…"
              options={INTERVALOS.map((h) => ({ value: String(h), label: intervaloLabel(h) }))}
              value={values.intervaloHoras}
              onChange={(v) => set('intervaloHoras', v)}
              error={errosCampo.intervaloHoras}
            />
            <Field
              label="Duração (dias)"
              required
              inputMode="numeric"
              value={values.duracaoDias}
              onChange={(v) => set('duracaoDias', v.replace(/\D/g, '').slice(0, 3))}
              error={errosCampo.duracaoDias}
            />
            <Field
              label="Início"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              value={values.inicio}
              onChange={(v) => set('inicio', maskDate(v))}
              error={errosCampo.inicio}
            />
            <Field
              label="Horário da 1ª dose"
              icon={ClockIcon}
              inputMode="numeric"
              placeholder="hh:mm"
              value={values.horaPrimeiraDose}
              onChange={(v) => set('horaPrimeiraDose', maskTime(v))}
              error={errosCampo.horaPrimeiraDose}
            />
            <Field
              span={2}
              label="Observações"
              as="textarea"
              maxLength={500}
              placeholder="Ex.: administrar com alimento, reavaliar em 7 dias…"
              value={values.observacoes}
              onChange={(v) => set('observacoes', v)}
            />
          </FieldGrid>
          <View style={calc.checks}>
            <CheckItem
              checked={alarmePossivel && values.criarAlarme}
              disabled={!alarmePossivel}
              onChange={(v) => set('criarAlarme', v)}
              titulo="Criar alarme no dispositivo ESP32"
              apoio={
                alarmePossivel
                  ? 'O lembrete toca a partir do horário da 1ª dose e é desativado ao suspender a prescrição.'
                  : 'Disponível para intervalos de 8, 12 ou 24 horas.'
              }
            />
          </View>
        </Secao>
      </View>

      <View
        style={[calc.cartao, calc.resultado]}
        accessibilityLiveRegion="polite"
        accessibilityLabel="Resultado do cálculo"
      >
        {!pronto && (
          <Pendencias
            icone={PillIcon}
            titulo="Resultado"
            itens={[
              { rotulo: 'Peso', ok: Boolean(payload.pesoKg) },
              { rotulo: 'Medicamento', ok: Boolean(payload.medicamentoId || (manual && payload.concentracao)) },
              { rotulo: 'Dose (mg/kg)', ok: Boolean(payload.doseMgKg) },
              { rotulo: 'Intervalo entre as doses', ok: Boolean(payload.intervaloHoras) },
              { rotulo: 'Duração', ok: Boolean(payload.duracaoDias) },
            ]}
          />
        )}
        {pronto && error && !result ? <Mensagem tipo="erro">{error}</Mensagem> : null}
        {pronto && result && (
          <View style={loading && calc.carregando}>
            <Texto peso={700} style={calc.rotuloResultado}>
              ADMINISTRAR POR DOSE
            </Texto>
            <Titulo style={calc.destaque}>{formatQuantidade(result.quantidadePorDose, unidade)}</Titulo>
            <Texto style={calc.destaqueApoio}>
              {formatNumber(result.doseRealMg, 2)} mg · {formatNumber(result.doseRealMgKg, 2)} mg/kg ·{' '}
              {intervaloLabel(intervalo)}
            </Texto>

            <GradeNumeros largura={width}>
              <Numero rotulo="Dose calculada" valor={`${formatNumber(result.doseMg, 2)} mg`} />
              <Numero rotulo="Quantidade exata" valor={`${formatNumber(result.quantidadeExata, 3)} ${unidade}`} />
              <Numero rotulo="Diferença do arredondamento" valor={`${formatNumber(result.desvioPercentual, 1)}%`} />
              <Numero rotulo="Total de doses" valor={result.totalDoses} />
              <Numero
                rotulo="Quantidade para o tratamento todo"
                valor={formatQuantidade(result.quantidadeTotal, unidade)}
                style={{ flexBasis: '100%' }}
              />
              {faixa ? (
                <Numero rotulo="Faixa de referência do catálogo" valor={faixa} style={{ flexBasis: '100%' }} />
              ) : null}
            </GradeNumeros>

            {(result.alertas.length > 0 || result.avisos.length > 0) && (
              <View style={{ gap: 8, marginTop: 18 }}>
                {result.alertas.map((alerta) => (
                  <Mensagem key={alerta} tipo="alerta">
                    {alerta}
                  </Mensagem>
                ))}
                {result.avisos.map((aviso) => (
                  <Mensagem key={aviso} tipo="aviso">
                    {aviso}
                  </Mensagem>
                ))}
              </View>
            )}

            {result.alertas.length > 0 && (
              <View style={calc.checks}>
                <CheckItem
                  checked={confirmado}
                  onChange={(v) => setConfirmadoPara(v ? alertasChave : '')}
                  titulo="Revisei os alertas e confirmo esta prescrição."
                />
              </View>
            )}

            <View style={calc.acoes}>
              <PillButton size="lg" onPress={salvar} loading={salvando} disabled={precisaConfirmar || loading}>
                Salvar prescrição na ficha
              </PillButton>
            </View>
            {errosCampo.petId ? <Texto style={calc.formula}>{errosCampo.petId}</Texto> : null}

            <Texto style={calc.formula}>
              Dose (mg) = peso × dose (mg/kg). Quantidade = dose ÷ concentração, arredondada para o que dá para
              administrar: 1/4 de comprimido sulcado, cápsula ou gota inteira, 0,01 mL abaixo de 1 mL e 0,1 mL acima.
              Confira sempre a bula do produto.
            </Texto>
          </View>
        )}
      </View>
    </Grade>
  )
}
