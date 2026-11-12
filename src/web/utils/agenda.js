// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { compareSchedule, formatHourShort, todayIso } from './dates.js'

const ATIVO = (item) => !['Cancelado', 'Concluído', 'Concluída', 'Aplicada'].includes(item.status)

/** Lista unificada dos compromissos de hoje (para o resumo e "Ver o dia completo"). */
export function todaysTimeline(data, lookup) {
  const hoje = todayIso()
  const name = (petId, fallback) => lookup.pet(petId)?.nome || fallback || 'Pet não cadastrado'

  const items = [
    ...data.consultas
      .filter((c) => c.data === hoje)
      .map((c) => ({
        id: c.id,
        tipo: 'Consulta',
        hora: c.hora,
        pet: name(c.petId),
        detalhe: c.motivo,
        status: c.status,
      })),
    ...data.vacinas
      .filter((v) => v.data === hoje)
      .map((v) => ({
        id: v.id,
        tipo: 'Vacina',
        hora: v.hora,
        pet: name(v.petId),
        detalhe: `${v.nome} · ${v.dose}`,
        status: v.status,
      })),
    ...data.cirurgias
      .filter((s) => s.data === hoje)
      .map((s) => ({
        id: s.id,
        tipo: 'Cirurgia',
        hora: s.hora,
        pet: name(s.petId),
        detalhe: s.procedimento,
        status: s.status,
      })),
    ...data.banhos
      .filter((b) => b.data === hoje)
      .map((b) => ({
        id: b.id,
        tipo: 'Banho e tosa',
        hora: b.hora,
        pet: name(b.petId),
        detalhe: b.servico,
        status: b.status,
      })),
    ...data.visitas
      .filter((v) => v.dataInicio <= hoje && v.dataFim >= hoje)
      .map((v) => ({
        id: v.id,
        tipo: 'Visita de pet sitter',
        hora: v.hora,
        pet: name(v.petId),
        detalhe: v.servico,
        status: v.status,
      })),
    ...data.emergencias
      .filter((e) => e.data === hoje)
      .map((e) => ({
        id: e.id,
        tipo: 'Emergência',
        hora: e.hora,
        pet: name(e.petId, e.petNome),
        detalhe: e.motivo,
        status: e.status,
      })),
  ]
  return items.sort(compareSchedule)
}

function plural(n, singular, pluralForm) {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** Textos dos seis cartões de "Horários do Dia", calculados a partir dos dados. */
export function agendaSummaries(data) {
  const hoje = todayIso()
  const consultas = data.consultas.filter((c) => c.data === hoje && c.status !== 'Cancelado')
  const cirurgias = data.cirurgias.filter((s) => s.data === hoje && s.status !== 'Cancelado').sort(compareSchedule)
  const vacinasPendentes = data.vacinas.filter((v) => v.data === hoje && v.status === 'Pendente')
  const banhos = data.banhos.filter((b) => b.data === hoje && b.status !== 'Cancelado')
  const visitasHoje = data.visitas.filter((v) => v.dataInicio <= hoje && v.dataFim >= hoje && v.status !== 'Cancelado')
  const visitasPendentes = visitasHoje.filter((v) => v.status === 'Pendente').sort(compareSchedule)
  const emergencias = data.emergencias.filter((e) => e.status === 'Em atendimento')

  return {
    consultas: consultas.length
      ? `${plural(consultas.length, 'consulta agendada', 'consultas agendadas')} para hoje`
      : 'Nenhuma consulta para hoje',
    cirurgias:
      cirurgias.length === 1
        ? `1 cirurgia marcada para às ${formatHourShort(cirurgias[0].hora)}`
        : cirurgias.length
          ? `${cirurgias.length} cirurgias agendadas para hoje`
          : 'Nenhuma cirurgia para hoje',
    vacinas: vacinasPendentes.length
      ? `${plural(vacinasPendentes.length, 'aplicação de vacina pendente', 'aplicações de vacina pendentes')}`
      : 'Nenhuma vacina pendente hoje',
    banhos: banhos.length
      ? `${plural(banhos.length, 'pet agendado', 'pets agendados')} para banho`
      : 'Nenhum banho agendado hoje',
    visitas: visitasPendentes.length
      ? `Próxima visita domiciliar às ${formatHourShort(visitasPendentes[0].hora)}`
      : visitasHoje.length
        ? 'Todas as visitas de hoje concluídas'
        : 'Nenhuma visita para hoje',
    emergencias: emergencias.length
      ? `${plural(emergencias.length, 'emergência em atendimento', 'emergências em atendimento')}`
      : 'Nenhuma emergência no momento',
  }
}

/** Quantos pets têm compromisso ativo nas próximas 12 horas. */
export function petsInNext12Hours(timeline, now = new Date()) {
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const limit = minutesNow + 12 * 60
  const pets = new Set(
    timeline
      .filter(ATIVO)
      .filter((item) => {
        const [h, m] = (item.hora ?? '00:00').split(':').map(Number)
        const minutes = h * 60 + m
        return minutes >= minutesNow - 60 && minutes <= limit
      })
      .map((item) => item.pet),
  )
  return pets.size
}
