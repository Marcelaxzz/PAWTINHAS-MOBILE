const CHAVE = 'pawtinhas-tema'

export function lerTemaSalvo() {
  try {
    return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'
  } catch {
    return 'claro'
  }
}

export function salvarTema(tema) {
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // Sem armazenamento: vale até fechar a aba.
  }
}
