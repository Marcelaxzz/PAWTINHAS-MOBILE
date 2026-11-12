// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/** Minúsculas e sem acentos, para buscas ("Salém" encontra "salem"). */
export function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts.at(-1)[0]).toUpperCase()
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] ?? ''
}
