import { StyleSheet } from 'react-native'

/**
 * Guarda todas as folhas de estilo criadas pelo app, para a troca de tema mudar as cores delas na hora.
 * Precisa carregar antes de qualquer tela (ver index.js na raiz).
 */
export const estilosRegistrados = []

if (!StyleSheet.__pawtinhasRegistra) {
  StyleSheet.create = (folha) => {
    estilosRegistrados.push(folha)
    return folha
  }
  StyleSheet.__pawtinhasRegistra = true
}
