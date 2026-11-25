// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Números das abas (quantos atendimentos hoje, quantos pacientes...).
 * Ficam guardados por 1 minuto e são esquecidos a cada cadastro, edição ou exclusão.
 */
const memoria = new Map()
const VALIDADE_MS = 60_000

export function lerContagem(chave) {
  const salvo = memoria.get(chave)
  return salvo && Date.now() - salvo.em < VALIDADE_MS ? salvo.valor : null
}

export function guardarContagem(chave, valor) {
  memoria.set(chave, { valor, em: Date.now() })
}

export function esquecerContagens() {
  memoria.clear()
}
