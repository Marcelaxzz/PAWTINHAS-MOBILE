/** Alarme que está tocando agora e avisos de "a lista de alarmes mudou". Só na memória do app. */
let atual = null
const atendidos = new Set()
const ouvintesSincronia = new Set()

export const alarmeTocando = {
  /** Registra o alarme disparado. Devolve false se ele já foi atendido (não toca duas vezes). */
  iniciar(alarme) {
    const chave = `${alarme.id}|${alarme.quando}`
    if (atendidos.has(chave)) return false
    atendidos.add(chave)
    atual = alarme
    return true
  },
  ler: () => atual,
  encerrar() {
    atual = null
  },
  /** Telas de alarme chamam depois de salvar, pausar ou excluir. */
  pedirSincronia() {
    ouvintesSincronia.forEach((ouvinte) => ouvinte())
  },
  aoPedirSincronia(ouvinte) {
    ouvintesSincronia.add(ouvinte)
    return () => ouvintesSincronia.delete(ouvinte)
  },
}
