// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[\p{L}][\p{L}' -]*[\p{L}]$/u

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

export function validateEmail(value) {
  const email = value.trim()
  if (!email) return 'Informe seu e-mail.'
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Informe um e-mail válido.'
  return ''
}

export function validateLoginPassword(value) {
  if (!value) return 'Informe sua senha.'
  if (value.length > PASSWORD_MAX) return 'Senha muito longa.'
  return ''
}

export function passwordRules(value) {
  return [
    {
      id: 'tamanho',
      label: `${PASSWORD_MIN}+ caracteres`,
      ok: value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX,
    },
    { id: 'maiuscula', label: 'letra maiúscula', ok: /\p{Lu}/u.test(value) },
    { id: 'minuscula', label: 'letra minúscula', ok: /\p{Ll}/u.test(value) },
    { id: 'numero', label: 'número', ok: /\p{N}/u.test(value) },
    { id: 'simbolo', label: 'símbolo', ok: /[^\p{L}\p{N}\s]/u.test(value) },
  ]
}

export function validateNewPassword(value) {
  if (!value) return 'Crie uma senha.'
  if (value.length > PASSWORD_MAX) return `Use no máximo ${PASSWORD_MAX} caracteres.`
  const missing = passwordRules(value).filter((rule) => !rule.ok)
  if (missing.length) return `A senha precisa de: ${missing.map((rule) => rule.label).join(', ')}.`
  return ''
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) return 'Confirme a senha.'
  if (password !== confirmation) return 'As senhas não coincidem.'
  return ''
}

export function validateName(value) {
  const name = value.trim().replace(/\s+/g, ' ')
  if (!name) return 'Informe seu nome completo.'
  if (name.length < 3 || name.length > 100 || !NAME_RE.test(name)) return 'Use apenas letras no nome.'
  if (!name.includes(' ')) return 'Informe nome e sobrenome.'
  return ''
}

export function validatePhone(value) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 'Informe seu telefone.'
  if (digits.length < 10 || digits.length > 11) return 'Informe um telefone com DDD.'
  return ''
}

export function validateCode(value) {
  return /^\d{6}$/.test(value) ? '' : 'Digite os 6 dígitos do código.'
}

/** CPF opcional: vazio passa; preenchido precisa ter os dígitos verificadores certos. */
export function validateCpf(value) {
  const d = value.replace(/\D/g, '')
  if (!d) return ''
  const confere = (posicao) => {
    let soma = 0
    for (let i = 0; i < posicao; i++) soma += Number(d[i]) * (posicao + 1 - i)
    return ((soma * 10) % 11) % 10 === Number(d[posicao])
  }
  return d.length === 11 && !/^(\d)\1{10}$/.test(d) && confere(9) && confere(10)
    ? ''
    : 'CPF inválido. Confira os números.'
}

export function validateOptionalEmail(value) {
  return value.trim() ? validateEmail(value) : ''
}
