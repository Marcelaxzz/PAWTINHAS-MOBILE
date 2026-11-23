import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ConfirmDialog } from '../componentes/ui/Dialog.jsx'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { StatusChip } from '../componentes/ui/Chip.jsx'
import { SelectFiltro } from '../componentes/Filtros.jsx'
import { Texto, Titulo } from '../componentes/Texto.jsx'
import { BowlIcon, ChipIcon, PillIcon, TrashIcon } from '../web/components/Icons/Icons.jsx'
import { useToast } from '../web/hooks/useToast.js'
import { dataService } from '../web/services/dataService.js'
import { addDaysIso, formatDateBr, todayIso } from '../web/utils/dates.js'
import { formatNumber, formatQuantidade, intervaloLabel } from '../web/utils/numbers.js'
import { alarmeTocando } from '../alarmes/estado.js'
import { cores, fs } from '../tema.js'
import { Grade } from '../componentes/ui/Grade.jsx'

const STATUS_PRESCRICAO = ['Ativa', 'Suspensa', 'Concluída']

/** Último dia de tratamento: início + duração − 1. */
function fimDoTratamento(p) {
  return addDaysIso(p.duracaoDias - 1, new Date(`${p.inicio}T12:00:00`))
}

/** "Ativa" vira "Concluída" na tela quando o período já terminou. */
function statusExibido(p) {
  return p.status === 'Ativa' && fimDoTratamento(p) < todayIso() ? 'Concluída' : p.status
}

function Secao({ icon: Icon, titulo, acao, children, style }) {
  return (
    <View style={[estilos.cuidado, style]}>
      <View style={estilos.topo}>
        <View style={estilos.subtitulo}>
          <Icon size={20} color={cores.carameloEscuro} />
          <Titulo style={estilos.subtituloTexto}>{titulo}</Titulo>
        </View>
        {acao}
      </View>
      {children}
    </View>
  )
}

function BotaoExcluir({ onPress, rotulo }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
      style={({ pressed }) => [estilos.excluir, pressed && { backgroundColor: cores.erroFundo }]}
    >
      {({ pressed }) => <TrashIcon size={16} color={pressed ? cores.erro : cores.taupe} />}
    </Pressable>
  )
}

export function Tratamentos({ pet, prescricoes, patchLocal }) {
  const toast = useToast()
  const [excluindo, setExcluindo] = useState(null)
  const [ocupado, setOcupado] = useState(null)

  const alterarStatus = async (p, status) => {
    if (status === p.status) return
    setOcupado(p.id)
    try {
      patchLocal('prescricoes', await dataService.update('prescricoes', p.id, { status }))
      if (p.alarmeId) alarmeTocando.pedirSincronia()
      toast.success(
        p.alarmeId && status !== 'Ativa'
          ? `Tratamento ${status.toLowerCase()} e alarme pausado.`
          : 'Status atualizado.',
      )
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(null)
    }
  }

  const excluir = async () => {
    setOcupado(excluindo.id)
    try {
      await dataService.remove('prescricoes', excluindo.id)
      patchLocal('prescricoes', excluindo, 'remove')
      if (excluindo.alarmeId) alarmeTocando.pedirSincronia()
      toast.success('Prescrição excluída.')
      setExcluindo(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(null)
    }
  }

  return (
    <Secao
      icon={PillIcon}
      titulo="Tratamentos"
      acao={
        <PillButton size="sm" to={`/calculadoras/dose?pet=${encodeURIComponent(pet.id)}`}>
          Calcular dose
        </PillButton>
      }
    >
      {prescricoes.length === 0 ? (
        <Texto style={estilos.vazio}>Nenhuma prescrição registrada.</Texto>
      ) : (
        <View style={estilos.lista}>
          {prescricoes.map((p, i) => {
            const status = statusExibido(p)
            return (
              <View key={p.id} style={[estilos.item, i === prescricoes.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={estilos.linha}>
                  <Texto peso={700}>{p.medicamento}</Texto>
                  <StatusChip status={status} />
                </View>
                <Texto peso={600} style={estilos.dose}>
                  {formatQuantidade(p.quantidadePorDose, p.unidade)} ({formatNumber(p.doseRealMg, 2)} mg) ·{' '}
                  {intervaloLabel(p.intervaloHoras)}
                </Texto>
                <Texto style={estilos.apoio}>
                  {formatNumber(p.doseMgKg, 3)} mg/kg para {formatNumber(p.pesoKg, 2)} kg · {formatDateBr(p.inicio)} a{' '}
                  {formatDateBr(fimDoTratamento(p))} · 1ª dose às {p.horaPrimeiraDose} · total{' '}
                  {formatQuantidade(p.quantidadeTotal, p.unidade)}
                </Texto>
                {p.alarmeId ? (
                  <View style={estilos.apoioLinha}>
                    <ChipIcon size={14} color={cores.taupe} />
                    <Texto style={estilos.apoio}>Alarme no ESP32</Texto>
                  </View>
                ) : null}
                {p.alertasConfirmados ? (
                  <Texto style={estilos.alerta}>Alertas confirmados: {p.alertasConfirmados}</Texto>
                ) : null}
                {p.observacoes ? <Texto style={estilos.apoio}>{p.observacoes}</Texto> : null}
                <View style={estilos.acoes}>
                  <View style={ocupado === p.id && { opacity: 0.6 }} pointerEvents={ocupado === p.id ? 'none' : 'auto'}>
                    <SelectFiltro
                      titulo={`Status de ${p.medicamento}`}
                      value={p.status}
                      onChange={(s) => alterarStatus(p, s)}
                      options={STATUS_PRESCRICAO.map((s) => ({ value: s, label: s }))}
                    />
                  </View>
                  <BotaoExcluir onPress={() => setExcluindo(p)} rotulo={`Excluir prescrição de ${p.medicamento}`} />
                </View>
              </View>
            )
          })}
        </View>
      )}

      <ConfirmDialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        onConfirm={excluir}
        loading={Boolean(ocupado)}
        title="Excluir prescrição?"
        message={
          excluindo?.alarmeId
            ? 'A prescrição e o alarme do ESP32 ligado a ela serão removidos.'
            : 'A prescrição será removida da ficha.'
        }
        confirmLabel="Excluir"
      />
    </Secao>
  )
}

export function Alimentacao({ pet, planos, patchLocal }) {
  const toast = useToast()
  const [excluindo, setExcluindo] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [atual, ...anteriores] = planos

  const excluir = async () => {
    setOcupado(true)
    try {
      await dataService.remove('planosAlimentares', excluindo.id)
      patchLocal('planosAlimentares', excluindo, 'remove')
      toast.success('Plano alimentar excluído.')
      setExcluindo(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Secao
      icon={BowlIcon}
      titulo="Alimentação"
      acao={
        <PillButton size="sm" to={`/calculadoras/racao?pet=${encodeURIComponent(pet.id)}`}>
          Calcular ração
        </PillButton>
      }
    >
      {!atual ? (
        <Texto style={estilos.vazio}>Nenhum plano alimentar calculado.</Texto>
      ) : (
        <>
          <View style={estilos.plano}>
            <Titulo style={estilos.gramas}>
              {formatNumber(atual.gramasDia, atual.gramasDia < 100 ? 1 : 0)} g
              <Texto peso={600} style={estilos.gramasUnidade}>
                {' '}
                /dia
              </Texto>
            </Titulo>
            <Texto peso={600} style={estilos.dose}>
              {atual.refeicoes} × {formatNumber(atual.gramasPorRefeicao, 1)} g de {atual.racao}
            </Texto>
            <Grade minimo={130} gap={16} linhaGap={10} esticar={false} style={estilos.planoDados}>
              {[
                ['Condição', atual.condicao],
                ['Energia', `${formatNumber(atual.mer, 0)} kcal/dia`],
                ['Peso usado', `${formatNumber(atual.pesoCalculoKg, 2)} kg`],
                ['Petiscos', `até ${formatNumber(atual.kcalPetiscosMax, 0)} kcal`],
                ['Água', `≈ ${formatNumber(atual.aguaMlDia, 0)} mL`],
                ['Calculado em', formatDateBr(atual.criadoEm.slice(0, 10))],
              ].map(([rotulo, valor]) => (
                <View key={rotulo} style={estilos.planoDado}>
                  <Texto peso={600} style={estilos.dt}>
                    {rotulo.toUpperCase()}
                  </Texto>
                  <Texto peso={600} style={{ fontSize: fs(16) }}>
                    {valor}
                  </Texto>
                </View>
              ))}
            </Grade>
            {atual.observacoes ? <Texto style={estilos.apoio}>{atual.observacoes}</Texto> : null}
          </View>

          <View style={estilos.anteriores}>
            {[atual, ...anteriores].map((p, index) => (
              <View key={p.id} style={estilos.anterior}>
                <Texto style={estilos.anteriorTexto}>
                  {formatDateBr(p.criadoEm.slice(0, 10))} · {formatNumber(p.gramasDia, p.gramasDia < 100 ? 1 : 0)} g/dia
                  · {p.racao}
                  {index === 0 && ' (atual)'}
                </Texto>
                <BotaoExcluir
                  onPress={() => setExcluindo(p)}
                  rotulo={`Excluir plano de ${formatDateBr(p.criadoEm.slice(0, 10))}`}
                />
              </View>
            ))}
          </View>
        </>
      )}

      <ConfirmDialog
        open={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        onConfirm={excluir}
        loading={ocupado}
        title="Excluir plano alimentar?"
        message="O cálculo será removido do histórico do paciente."
        confirmLabel="Excluir"
      />
    </Secao>
  )
}

const estilos = StyleSheet.create({
  cuidado: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 28,
    backgroundColor: cores.branco,
  },
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  subtitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtituloTexto: { fontSize: fs(25), lineHeight: fs(30) },
  vazio: { marginTop: 12, color: cores.taupe },
  lista: { marginTop: 14 },
  item: { gap: 4, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6 },
  dose: { fontSize: fs(16), color: cores.cafe },
  apoio: { fontSize: fs(15), lineHeight: fs(21), color: cores.taupe },
  apoioLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alerta: { fontSize: fs(15), color: cores.erro },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  excluir: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  plano: {
    marginTop: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: cores.superficie,
  },
  gramas: { fontSize: fs(36), lineHeight: fs(41) },
  gramasUnidade: { fontSize: fs(16), color: cores.taupe },
  planoDados: { marginTop: 14 },
  planoDado: { minWidth: 0 },
  dt: { fontSize: fs(15), letterSpacing: 0.4, color: cores.taupe },
  anteriores: { marginTop: 12 },
  anterior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
  },
  anteriorTexto: { flex: 1, fontSize: fs(15), lineHeight: fs(21), color: cores.taupeEscuro },
  origem: { fontSize: fs(15), color: cores.taupe },
  modelo: { fontSize: fs(15), color: cores.ferrugem },
})
