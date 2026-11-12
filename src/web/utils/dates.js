// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
const pad = (n) => String(n).padStart(2, '0')

/** Data local no formato ISO (AAAA-MM-DD). */
export function toIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function addDaysIso(days, from = new Date()) {
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Converte "2026-09-24" em "24/09/2026". */
export function formatDateBr(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Converte "24/09/2026" em "2026-09-24" (ou null se a data não existir). */
export function parseDateBr(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!match) return null
  const [, d, m, y] = match.map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  if (y < 2000 || y > 2100) return null
  return toIsoDate(date)
}

export function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim())
}

export function maskDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function maskTime(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

/** "Hoje", "Amanhã", "Ontem" ou a data por extenso curta. */
export function relativeDayLabel(iso) {
  if (iso === todayIso()) return 'Hoje'
  if (iso === addDaysIso(1)) return 'Amanhã'
  if (iso === addDaysIso(-1)) return 'Ontem'
  return formatDateBr(iso)
}

export function compareSchedule(a, b) {
  return `${a.data ?? ''} ${a.hora ?? ''}`.localeCompare(`${b.data ?? ''} ${b.hora ?? ''}`)
}

export function formatHourShort(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

/** "3 meses", "1 ano", "4 anos" a partir da data de nascimento (mesma regra da API). */
export function idadeDe(isoNascimento, hoje = new Date()) {
  if (!isoNascimento) return ''
  const [y, m, d] = isoNascimento.split('-').map(Number)
  const meses = (hoje.getFullYear() - y) * 12 + (hoje.getMonth() + 1 - m) - (hoje.getDate() < d ? 1 : 0)
  if (meses < 0) return ''
  if (meses < 1) return 'Menos de 1 mês'
  if (meses < 12) return meses === 1 ? '1 mês' : `${meses} meses`
  const anos = Math.floor(meses / 12)
  return anos === 1 ? '1 ano' : `${anos} anos`
}
