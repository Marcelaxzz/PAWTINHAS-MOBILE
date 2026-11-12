// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Quando cada alarme toca. As mesmas regras do ESP32 (Pawtinhas-Back/firmware/alarme-esp32) e do app,
 * para o alarme tocar igual em todo lugar:
 * - nada toca antes do dia de início (`inicio`, "aaaa-mm-dd");
 * - "A cada 8/12 horas" conta a partir do horário marcado (14:00 → 22:00 → 06:00...);
 * - "Semanal" toca no dia da semana do início;
 * - "Somente hoje" toca uma vez, no dia do início.
 */

import { formatDateBr, toIsoDate } from './dates.js'

export const RECORRENCIAS = [
  'Diário (Todos os dias)',
  'A cada 8 horas',
  'A cada 12 horas',
  'Dias úteis',
  'Semanal',
  'Somente hoje',
]

const UMA_VEZ = 'Somente hoje'
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const DIA_MS = 86_400_000

/** Texto da recorrência nos formulários ("Somente hoje" virou "Uma vez", porque o dia pode ser outro). */
export const rotuloRecorrencia = (r) => (r === UMA_VEZ ? 'Uma vez (só no dia marcado)' : r)

/** Opções do select de recorrência. */
export const OPCOES_RECORRENCIA = RECORRENCIAS.map((r) => ({ value: r, label: rotuloRecorrencia(r) }))

function minutoDoDia(hora) {
  const [h, m] = String(hora ?? '')
    .split(':')
    .map(Number)
  return Number.isInteger(h) && Number.isInteger(m) ? h * 60 + m : null
}

/** Número do dia (local), para comparar datas sem se preocupar com fuso e horário de verão. */
function numeroDoDia(data) {
  return Math.round(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / DIA_MS)
}

function numeroDoInicio(alarme) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(alarme.inicio ?? '')
  return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DIA_MS) : -Infinity
}

/** O alarme toca no minuto de `quando`? */
export function tocaEm(alarme, quando) {
  const minuto = minutoDoDia(alarme.hora)
  if (minuto === null) return false
  const dia = numeroDoDia(quando)
  const inicio = numeroDoInicio(alarme)
  if (dia < inicio) return false
  const diferenca = (quando.getHours() * 60 + quando.getMinutes() - minuto + 1440) % 1440

  switch (alarme.recorrencia) {
    case 'A cada 8 horas':
      return diferenca % 480 === 0
    case 'A cada 12 horas':
      return diferenca % 720 === 0
    case 'Dias úteis':
      return diferenca === 0 && quando.getDay() >= 1 && quando.getDay() <= 5
    case 'Semanal':
      return diferenca === 0 && (dia - inicio) % 7 === 0
    case UMA_VEZ:
      return diferenca === 0 && dia === inicio
    default:
      return diferenca === 0
  }
}

/** Horários do dia em que o alarme pode tocar (vários no "a cada 8/12 horas"). */
export function horariosDoDia(alarme) {
  const minuto = minutoDoDia(alarme.hora)
  if (minuto === null) return []
  const passo = { 'A cada 8 horas': 480, 'A cada 12 horas': 720 }[alarme.recorrencia]
  if (!passo) return [minuto]
  return Array.from({ length: 1440 / passo }, (_, i) => (minuto + i * passo) % 1440).sort((a, b) => a - b)
}

/** Próximo toque depois de `agora` (até `dias` dias à frente), ou null. */
export function proximoToque(alarme, agora = new Date(), dias = 8) {
  const minutos = horariosDoDia(alarme)
  for (let d = 0; d <= dias; d++) {
    const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + d)
    for (const m of minutos) {
      const quando = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), Math.floor(m / 60), m % 60)
      if (quando > agora && tocaEm(alarme, quando)) return quando
    }
  }
  return null
}

/** Os próximos toques (para agendar no celular). */
export function proximosToques(alarme, agora = new Date(), { dias = 8, maximo = 24 } = {}) {
  const lista = []
  let depois = agora
  while (lista.length < maximo) {
    const quando = proximoToque(alarme, depois, dias - Math.floor((depois - agora) / DIA_MS))
    if (!quando) break
    lista.push(quando)
    depois = quando
  }
  return lista
}

const doisDigitos = (n) => String(n).padStart(2, '0')
const horaDe = (data) => `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`

/** "hoje às 14:00", "amanhã às 06:00", "sexta às 09:00" ou "12/11 às 09:00". */
export function textoDoToque(quando, agora = new Date()) {
  const dias = numeroDoDia(quando) - numeroDoDia(agora)
  const dia =
    dias === 0
      ? 'hoje'
      : dias === 1
        ? 'amanhã'
        : dias < 7
          ? DIAS[quando.getDay()]
          : formatDateBr(toIsoDate(quando)).slice(0, 5)
  return `${dia} às ${horaDe(quando)}`
}

/** Resumo da repetição para a lista: "Toda segunda às 09:00", "Uma vez, em 12/11 às 15:00"... */
export function resumoDoAlarme(alarme) {
  const hora = alarme.hora
  const inicio = numeroDoInicio(alarme)
  const dataInicio = Number.isFinite(inicio) ? new Date(inicio * DIA_MS) : null
  const diaSemana = dataInicio ? DIAS[dataInicio.getUTCDay()] : null
  const dataBr = alarme.inicio ? formatDateBr(alarme.inicio.slice(0, 10)) : ''
  switch (alarme.recorrencia) {
    case 'A cada 8 horas':
    case 'A cada 12 horas': {
      const horas = alarme.recorrencia === 'A cada 8 horas' ? 8 : 12
      const lista = horariosDoDia(alarme).map((m) => `${doisDigitos(Math.floor(m / 60))}:${doisDigitos(m % 60)}`)
      return `De ${horas} em ${horas} horas: ${lista.join(', ')}`
    }
    case 'Dias úteis':
      return `De segunda a sexta às ${hora}`
    case 'Semanal':
      if (!diaSemana) return `Toda semana às ${hora}`
      return `${diaSemana === 'domingo' || diaSemana === 'sábado' ? 'Todo' : 'Toda'} ${diaSemana} às ${hora}`
    case UMA_VEZ:
      return dataBr ? `Uma vez, em ${dataBr.slice(0, 5)} às ${hora}` : `Uma vez às ${hora}`
    default:
      return `Todo dia às ${hora}`
  }
}
