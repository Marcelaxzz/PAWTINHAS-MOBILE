/** Avisos de "a lista de alarmes mudou": as telas de alarme chamam e o app refaz a agenda do celular. */
const ouvintesSincronia = new Set()

export const alarmeTocando = {
  /** Telas de alarme chamam depois de salvar, pausar ou excluir. */
  pedirSincronia() {
    ouvintesSincronia.forEach((ouvinte) => ouvinte())
  },
  aoPedirSincronia(ouvinte) {
    ouvintesSincronia.add(ouvinte)
    return () => ouvintesSincronia.delete(ouvinte)
  },
}
