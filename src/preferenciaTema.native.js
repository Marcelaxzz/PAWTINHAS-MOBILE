import * as SecureStore from 'expo-secure-store'

const CHAVE = 'pawtinhas-tema'

/** Lido na hora em que o app abre, antes das telas (por isso a leitura é síncrona). */
export function lerTemaSalvo() {
  try {
    return SecureStore.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'
  } catch {
    return 'claro'
  }
}

export function salvarTema(tema) {
  try {
    SecureStore.setItem(CHAVE, tema)
  } catch {
    // Sem armazenamento: vale até fechar o app.
  }
}
