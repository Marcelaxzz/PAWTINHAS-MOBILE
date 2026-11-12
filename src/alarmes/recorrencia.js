import { proximosToques } from '../web/utils/alarmes.js'

/**
 * Recorrências do alarme (as mesmas da API: Alarme.Recorrencias) em gatilhos de notificação local.
 * As regras de quando toca são as do site e do ESP32 (src/web/utils/alarmes.js): nada antes do dia
 * de início, "Semanal" no dia da semana do início e "Somente hoje" uma vez, no dia do início.
 * Os tipos ('daily', 'weekly', 'date') são os valores de Notifications.SchedulableTriggerInputTypes.
 * No gatilho semanal, 1 = domingo … 7 = sábado.
 */

const DIAS_UTEIS = [2, 3, 4, 5, 6]
const DIA_MS = 86_400_000

function dataDoInicio(alarme) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(alarme.inicio ?? '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}

/** Gatilhos de data exata (alarme de uma vez ou que ainda não começou). O app refaz a lista a cada sincronia. */
function datasExatas(alarme, agora, dias) {
  return proximosToques(alarme, agora, { dias, maximo: 24 }).map((quando) => ({
    type: 'date',
    date: quando.getTime(),
  }))
}

export function horariosDoAlarme(alarme, agora = new Date()) {
  const [hour, minute] = String(alarme.hora ?? '')
    .split(':')
    .map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return []

  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const inicio = dataDoInicio(alarme) ?? hoje
  const diasAteInicio = Math.max(0, Math.round((inicio - hoje) / DIA_MS))

  if (alarme.recorrencia === 'Somente hoje') return datasExatas(alarme, agora, diasAteInicio + 1)
  // Começa em outro dia: os primeiros toques com data certa; depois do início viram repetições do sistema.
  if (diasAteInicio > 0) return datasExatas(alarme, agora, diasAteInicio + 7)

  const diario = (h) => ({ type: 'daily', hour: h % 24, minute })
  const semanal = (weekday) => ({ type: 'weekly', weekday, hour, minute })

  switch (alarme.recorrencia) {
    case 'A cada 8 horas':
      return [diario(hour), diario(hour + 8), diario(hour + 16)]
    case 'A cada 12 horas':
      return [diario(hour), diario(hour + 12)]
    case 'Dias úteis':
      return DIAS_UTEIS.map(semanal)
    case 'Semanal':
      return [semanal(inicio.getDay() + 1)]
    default:
      return [diario(hour)]
  }
}
