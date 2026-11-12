import { useEffect, useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { Field, FieldGrid } from '../../../componentes/ui/Field.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { BowlIcon } from '../../../web/components/Icons/Icons.jsx'
import { useCollections } from '../../../web/hooks/useCollections.js'
import { useSimulation } from '../../../web/hooks/useSimulation.js'
import { useToast } from '../../../web/hooks/useToast.js'
import { clinicService } from '../../../web/services/clinicService.js'
import { dataService } from '../../../web/services/dataService.js'
import { formatNumber, maskDecimal, parseDecimal } from '../../../web/utils/numbers.js'
import { CALCULADORAS_TABS } from '../../../web/pages/calculadoras/calculadorasTabs.js'
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
const PERSONALIZADO = 'personalizado'
const ESPECIES_CALCULO = ['Cachorro', 'Gato']

/** "1,6" ou "1,4 a 1,6", como a fonte publica. */
const faixa = (f) =>
  f.fatorMin === f.fatorMax
    ? formatNumber(f.fator, 1)
    : `${formatNumber(f.fatorMin, 1)} a ${formatNumber(f.fatorMax, 1)}`

export default function CalculoRacao() {
  const { data, loading, error, reload } = useCollections(['pets', 'racoes'])
  const [fatores, setFatores] = useState({ lista: null, erro: '' })

  useEffect(() => {
    let ativo = true
    clinicService
      .fatores()
      .then((r) => ativo && setFatores({ lista: r.fatores, erro: '' }))
      .catch((err) => ativo && setFatores({ lista: null, erro: err.message }))
    return () => {
      ativo = false
    }
  }, [])

  const erro = error || fatores.erro

  return (
    <Page width="largo" title="Cálculo de ração" tabs={CALCULADORAS_TABS}>
      {(loading || (!fatores.lista && !erro)) && <LoadingState />}
      {erro ? <ErrorState message={erro} onRetry={reload} /> : null}
      {data && fatores.lista && <RacaoForm pets={data.pets} racoes={data.racoes} fatores={fatores.lista} />}
    </Page>
  )
}

function RacaoForm({ pets, racoes, fatores }) {
  const router = useRouter()
  const toast = useToast()
  const params = useLocalSearchParams()
  const { width } = useWindowDimensions()

  const [values, setValues] = useState(() => {
    const pet = pets.find((p) => p.id === params.pet)
    return {
      petId: pet?.id ?? '',
      especie: ESPECIES_CALCULO.includes(pet?.especie) ? pet.especie : 'Cachorro',
      pesoAtualKg: pet?.peso ?? '',
      pesoMetaKg: '',
      condicao: '',
      fatorPersonalizado: '',
      racaoId: '',
      racao: '',
      kcalPorKg: '',
      refeicoes: '2',
      observacoes: '',
      atualizarPeso: false,
    }
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const pet = pets.find((p) => p.id === values.petId)
  const especie = pet?.especie ?? values.especie
  const especieValida = ESPECIES_CALCULO.includes(especie)
  const condicoes = fatores.filter((f) => f.especie === especie)
  const condicao = condicoes.find((f) => f.chave === values.condicao)
  const personalizado = values.condicao === PERSONALIZADO
  // Condição com faixa publicada (ex.: lactação 3,0 a 6,0): a veterinária pode ajustar dentro dela.
  const ajustavel = condicao && condicao.fatorMin < condicao.fatorMax
  const usaMeta = condicao?.usaPesoMeta || personalizado
  const manual = values.racaoId === MANUAL
  const racao = racoes.find((r) => r.id === values.racaoId)
  const racoesDaEspecie = racoes.filter((r) => r.especie === 'Ambos' || r.especie === especie)
  const pesoDiferente = pet && parseDecimal(values.pesoAtualKg) !== parseDecimal(pet.peso)

  const set = (campo, valor) => {
    setValues((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: '' }))
  }

  const escolherPet = (id) => {
    const escolhido = pets.find((p) => p.id === id)
    setValues((prev) => ({
      ...prev,
      petId: id,
      especie: ESPECIES_CALCULO.includes(escolhido?.especie) ? escolhido.especie : prev.especie,
      pesoAtualKg: escolhido?.peso || prev.pesoAtualKg,
      // A condição e a ração dependem da espécie.
      condicao: escolhido && escolhido.especie !== especie ? '' : prev.condicao,
      racaoId: escolhido && escolhido.especie !== especie ? '' : prev.racaoId,
      atualizarPeso: false,
    }))
  }

  const payload = {
    petId: values.petId || null,
    especie,
    pesoAtualKg: parseDecimal(values.pesoAtualKg),
    pesoMetaKg: usaMeta ? parseDecimal(values.pesoMetaKg) : null,
    condicao: values.condicao,
    fatorPersonalizado: personalizado || ajustavel ? parseDecimal(values.fatorPersonalizado) : null,
    racaoId: manual ? null : values.racaoId || null,
    racao: manual ? values.racao.trim() : (racao?.nome ?? ''),
    kcalPorKg: manual ? parseDecimal(values.kcalPorKg) : null,
    refeicoes: Number(values.refeicoes) || 2,
  }

  const pronto = Boolean(
    especieValida &&
    payload.pesoAtualKg &&
    payload.condicao &&
    (!condicao?.usaPesoMeta || payload.pesoMetaKg) &&
    (!personalizado || payload.fatorPersonalizado) &&
    (payload.racaoId || (manual && payload.kcalPorKg)),
  )
  const { result, error, fields, loading } = useSimulation(clinicService.simularAlimentacao, payload, pronto)
  const errosCampo = { ...fields, ...erros }

  const salvar = async () => {
    const proximos = {
      petId: values.petId ? '' : 'Selecione o paciente para salvar o plano.',
      racao: manual && !values.racao.trim() ? 'Informe o nome da ração.' : '',
    }
    setErros(proximos)
    if (Object.values(proximos).some(Boolean) || !result) return

    setSalvando(true)
    try {
      await dataService.create('planosAlimentares', {
        ...payload,
        observacoes: values.observacoes.trim(),
        atualizarPesoPaciente: Boolean(pesoDiferente && values.atualizarPeso),
      })
      toast.success('Plano alimentar salvo na ficha do paciente!')
      router.push(`/pacientes/${encodeURIComponent(values.petId)}`)
    } catch (err) {
      if (err.fields) setErros(err.fields)
      toast.error(err.message)
      setSalvando(false)
    }
  }

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
                options={ESPECIES_CALCULO.map((v) => ({ value: v, label: v }))}
                value={values.especie}
                onChange={(v) => setValues((prev) => ({ ...prev, especie: v, condicao: '', racaoId: '' }))}
              />
            )}
            <Field
              label="Peso atual (kg)"
              required
              inputMode="decimal"
              placeholder="Ex.: 12,5"
              value={values.pesoAtualKg}
              onChange={(v) => set('pesoAtualKg', maskDecimal(v, 6))}
              error={errosCampo.pesoAtualKg}
            />
            {usaMeta && (
              <Field
                label={personalizado ? 'Peso para o cálculo (kg)' : 'Peso ideal (kg)'}
                required={!personalizado}
                inputMode="decimal"
                placeholder="Ex.: 10"
                hint={
                  personalizado
                    ? 'Opcional. Em branco, usa o peso atual.'
                    : 'A AAHA calcula a perda de peso no peso ideal.'
                }
                value={values.pesoMetaKg}
                onChange={(v) => set('pesoMetaKg', maskDecimal(v, 6))}
                error={errosCampo.pesoMetaKg}
              />
            )}
          </FieldGrid>
          {!especieValida && (
            <View style={calc.info}>
              <Texto style={calc.infoTexto}>O cálculo de ração por energia está disponível para cães e gatos.</Texto>
            </View>
          )}
          {pesoDiferente && especieValida && (
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

        {especieValida && (
          <>
            <Secao titulo="Condição" numero={2}>
              <FieldGrid>
                <Field
                  label="Fase e condição corporal"
                  as="select"
                  required
                  placeholder="Selecione…"
                  options={[
                    ...condicoes.map((f) => ({ value: f.chave, label: `${f.rotulo} (× ${faixa(f)})` })),
                    { value: PERSONALIZADO, label: 'Fator personalizado' },
                  ]}
                  value={values.condicao}
                  onChange={(v) => setValues((prev) => ({ ...prev, condicao: v, fatorPersonalizado: '' }))}
                  error={errosCampo.condicao}
                  hint={condicao ? `Fonte: ${condicao.fonte}` : undefined}
                />
                {ajustavel && (
                  <Field
                    label={`Fator (${faixa(condicao)})`}
                    inputMode="decimal"
                    placeholder={formatNumber(condicao.fator, 1)}
                    hint={`Em branco, usa ${formatNumber(condicao.fator, 1)}.`}
                    value={values.fatorPersonalizado}
                    onChange={(v) => set('fatorPersonalizado', maskDecimal(v, 4))}
                    error={errosCampo.fatorPersonalizado}
                  />
                )}
                {personalizado && (
                  <Field
                    label="Fator (0,5 a 8)"
                    required
                    inputMode="decimal"
                    placeholder="Ex.: 1,3"
                    value={values.fatorPersonalizado}
                    onChange={(v) => set('fatorPersonalizado', maskDecimal(v, 4))}
                    error={errosCampo.fatorPersonalizado}
                  />
                )}
              </FieldGrid>
            </Secao>

            <Secao titulo="Ração" numero={3}>
              <FieldGrid>
                <Field
                  span={2}
                  label="Ração"
                  as="select"
                  required
                  placeholder="Selecione do catálogo…"
                  options={[
                    ...racoesDaEspecie.map((r) => ({
                      value: r.id,
                      label: `${r.nome} · ${formatNumber(r.kcalPorKg, 0)} kcal/kg`,
                    })),
                    { value: MANUAL, label: 'Outra (informar a energia do rótulo)' },
                  ]}
                  value={values.racaoId}
                  onChange={(v) => set('racaoId', v)}
                  error={errosCampo.racaoId}
                />
                {manual && (
                  <>
                    <Field
                      label="Nome da ração"
                      required
                      maxLength={80}
                      value={values.racao}
                      onChange={(v) => set('racao', v)}
                      error={errosCampo.racao}
                    />
                    <Field
                      label="Energia metabolizável (kcal/kg)"
                      required
                      inputMode="decimal"
                      placeholder="Ex.: 3800"
                      hint="No rótulo, em “Energia metabolizável”."
                      value={values.kcalPorKg}
                      onChange={(v) => set('kcalPorKg', maskDecimal(v, 6))}
                      error={errosCampo.kcalPorKg}
                    />
                  </>
                )}
                <Field
                  label="Refeições por dia"
                  as="select"
                  options={[1, 2, 3, 4, 5, 6].map((n) => ({
                    value: String(n),
                    label: `${n} ${n === 1 ? 'refeição' : 'refeições'}`,
                  }))}
                  value={values.refeicoes}
                  onChange={(v) => set('refeicoes', v)}
                />
                <Field
                  span={2}
                  label="Observações"
                  as="textarea"
                  maxLength={500}
                  placeholder="Ex.: reavaliar peso em 30 dias, transição gradual de ração…"
                  value={values.observacoes}
                  onChange={(v) => set('observacoes', v)}
                />
              </FieldGrid>
              {racoesDaEspecie.length === 0 && (
                <View style={calc.info}>
                  <Texto style={calc.infoTexto}>
                    Nenhuma ração para esta espécie no catálogo.{' '}
                    <Texto
                      style={[calc.infoTexto, { textDecorationLine: 'underline' }]}
                      onPress={() => router.push('/calculadoras/racoes')}
                    >
                      Cadastre as rações da clínica
                    </Texto>{' '}
                    ou use “Outra”.
                  </Texto>
                </View>
              )}
            </Secao>
          </>
        )}
      </View>

      <View
        style={[calc.cartao, calc.resultado]}
        accessibilityLiveRegion="polite"
        accessibilityLabel="Resultado do cálculo"
      >
        {!pronto && (
          <Pendencias
            icone={BowlIcon}
            titulo="Quantidade diária"
            itens={[
              { rotulo: 'Peso atual', ok: Boolean(payload.pesoAtualKg) },
              { rotulo: 'Fase e condição corporal', ok: Boolean(payload.condicao) },
              ...(condicao?.usaPesoMeta && !personalizado
                ? [{ rotulo: 'Peso ideal', ok: Boolean(payload.pesoMetaKg) }]
                : []),
              ...(personalizado ? [{ rotulo: 'Fator', ok: Boolean(payload.fatorPersonalizado) }] : []),
              { rotulo: 'Ração', ok: Boolean(payload.racaoId || (manual && payload.kcalPorKg)) },
            ]}
          />
        )}
        {pronto && error && !result ? <Mensagem tipo="erro">{error}</Mensagem> : null}
        {pronto && result && (
          <View style={loading && calc.carregando}>
            <Texto peso={700} style={calc.rotuloResultado}>
              QUANTIDADE POR DIA
            </Texto>
            <Titulo style={calc.destaque}>{formatNumber(result.gramasDia, result.gramasDia < 100 ? 1 : 0)} g</Titulo>
            <Texto style={calc.destaqueApoio}>
              {Number(values.refeicoes)} × {formatNumber(result.gramasPorRefeicao, 1)} g por refeição
            </Texto>

            <GradeNumeros largura={width}>
              <Numero rotulo="RER (repouso)" valor={`${formatNumber(result.rer, 0)} kcal/dia`} />
              <Numero rotulo="MER (manutenção)" valor={`${formatNumber(result.mer, 0)} kcal/dia`} />
              <Numero rotulo="Fator aplicado" valor={`× ${formatNumber(result.fator, 2)}`} />
              <Numero rotulo="Peso usado" valor={`${formatNumber(result.pesoCalculoKg, 2)} kg`} />
              <Numero rotulo="Petiscos (máx. 10%)" valor={`${formatNumber(result.kcalPetiscosMax, 0)} kcal/dia`} />
              <Numero
                rotulo="Água (manutenção)"
                valor={`${formatNumber(result.aguaMinMlDia, 0)} a ${formatNumber(result.aguaMaxMlDia, 0)} mL/dia`}
              />
            </GradeNumeros>

            <View style={calc.acoes}>
              <PillButton size="lg" onPress={salvar} loading={salvando} disabled={loading}>
                Salvar plano na ficha
              </PillButton>
            </View>
            {errosCampo.petId ? <Texto style={calc.formula}>{errosCampo.petId}</Texto> : null}

            <Texto style={calc.formula}>
              Gramas por dia = MER ÷ energia da ração (kcal/kg) × 1.000. O resultado é um ponto de partida: ajuste a
              quantidade acompanhando o peso e o escore corporal, como recomendam as fontes abaixo.
            </Texto>
            <View style={calc.fontes}>
              {result.fontes.map((fonte) => (
                <Texto key={fonte} style={calc.fonteMed}>
                  • {fonte}
                </Texto>
              ))}
            </View>
          </View>
        )}
      </View>
    </Grade>
  )
}
