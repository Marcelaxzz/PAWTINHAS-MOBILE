// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
const pt = (maximumFractionDigits) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits })

/** Lê "12,5" ou "12.5" como 12.5; vazio ou inválido vira null. */
export function parseDecimal(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim().replace(/\s/g, '').replace(',', '.')
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

/** Formata 1234.5 como "1.234,5" (até `decimals` casas). */
export function formatNumber(value, decimals = 2) {
  const n = Number(value)
  return Number.isFinite(n) ? pt(decimals).format(n) : '-'
}

/** Mantém só dígitos e uma vírgula/ponto (campos numéricos digitados no teclado). */
export function maskDecimal(value, maxLength = 8) {
  const clean = value.replace(/[^\d.,]/g, '').replace('.', ',')
  const [inteiro, ...resto] = clean.split(',')
  return (resto.length ? `${inteiro},${resto.join('')}` : inteiro).slice(0, maxLength)
}

const FRACOES = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
const PLURAL = { comprimido: 'comprimidos', cápsula: 'cápsulas', gota: 'gotas', mL: 'mL' }

/** Quantidade para administrar: 1.25 comprimido vira "1¼ comprimido"; 2 mL fica "2 mL". */
export function formatQuantidade(value, unidade) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  const nome = n > 1 ? (PLURAL[unidade] ?? unidade) : unidade
  if (unidade === 'comprimido') {
    const inteiro = Math.floor(n)
    const fracao = FRACOES[Math.round((n - inteiro) * 100) / 100]
    if (fracao) return `${inteiro > 0 ? inteiro : ''}${fracao} ${nome}`
  }
  return `${formatNumber(n, 2)} ${nome}`
}

/** Versão curta para cartões: "a cada 12 h", "1x ao dia". */
export function intervaloCurto(horas) {
  if (horas === 24) return '1x ao dia'
  if (horas === 48) return 'a cada 2 dias'
  if (horas === 72) return 'a cada 3 dias'
  return `a cada ${horas} h`
}

export function intervaloLabel(horas) {
  if (horas === 24) return 'Uma vez ao dia (a cada 24 h)'
  if (horas === 48) return 'A cada 2 dias (48 h)'
  if (horas === 72) return 'A cada 3 dias (72 h)'
  return `A cada ${horas} horas (${24 / horas}x ao dia)`
}
