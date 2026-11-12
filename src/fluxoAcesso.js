/**
 * Dados que passam de uma tela de acesso para a próxima (o "state" da navegação no site).
 * Ficam só na memória: o código do desafio nunca vai para a URL nem para o armazenamento.
 */
let atual = null

export const fluxoAcesso = {
  definir: (dados) => {
    atual = dados
  },
  ler: () => atual,
  limpar: () => {
    atual = null
  },
}
