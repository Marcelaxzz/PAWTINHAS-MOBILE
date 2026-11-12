/**
 * No navegador (Expo web) os cookies httpOnly ficam com o próprio navegador, como no site.
 * O token CSRF vem do cookie XSRF-TOKEN ou, em outra porta/domínio, do cabeçalho X-XSRF-TOKEN.
 */

export const carregarCookies = () => Promise.resolve()
export const cabecalhoCookie = () => null
export const guardarCookies = async () => {}

export function tokenCsrf() {
  const linha = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='))
  return linha ? decodeURIComponent(linha.split('=')[1]) : null
}

export const CREDENCIAIS = 'include'
