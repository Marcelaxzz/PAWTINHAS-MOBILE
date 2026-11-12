import * as SecureStore from 'expo-secure-store'

/**
 * Cookies da API no celular.
 *
 * A sessão é a mesma do site: JWT em cookie httpOnly, renovação rotativa e token CSRF. O site
 * deixa os cookies com o navegador; no app, o fetch nativo trata SameSite de um jeito no Android
 * e de outro no iOS, então o próprio app guarda os cookies e os devolve só para o caminho e o
 * protocolo certos, como o navegador faria. Cookies persistentes ("Lembrar de mim") ficam no
 * Keychain/Keystore (expo-secure-store, criptografado); os de sessão, só na memória do app.
 */

const CHAVE = (nome) => `pawtinhas.cookie.${nome.replace(/[^A-Za-z0-9._-]/g, '_')}`
const NOMES = ['pawtinhas_sessao', 'pawtinhas_renovacao', 'XSRF-TOKEN']

/** nome → { valor, caminho, seguro, expira (ms) | null } */
const pote = new Map()
let carregado = null

/** Lê os cookies persistentes guardados no aparelho (uma vez, na abertura do app). */
export function carregarCookies() {
  carregado ??= Promise.all(
    NOMES.map(async (nome) => {
      try {
        const salvo = await SecureStore.getItemAsync(CHAVE(nome))
        if (!salvo) return
        const cookie = JSON.parse(salvo)
        if (cookie.expira && cookie.expira > Date.now()) pote.set(nome, cookie)
        else await SecureStore.deleteItemAsync(CHAVE(nome))
      } catch {
        // Um registro ilegível é descartado: no pior caso, entra-se de novo.
      }
    }),
  )
  return carregado
}

const caminhoDe = (url) => /^[a-z]+:\/\/[^/?#]+([^?#]*)/i.exec(url)?.[1] || '/'

/** Regra de caminho dos cookies (RFC 6265, 5.1.4). */
function caminhoCombina(caminhoCookie, caminhoUrl) {
  if (caminhoUrl === caminhoCookie) return true
  if (!caminhoUrl.startsWith(caminhoCookie)) return false
  return caminhoCookie.endsWith('/') || caminhoUrl[caminhoCookie.length] === '/'
}

/** Cabeçalho Cookie para a URL, ou null. */
export function cabecalhoCookie(url) {
  const https = url.startsWith('https://')
  const caminho = caminhoDe(url)
  const agora = Date.now()
  const pares = []
  for (const [nome, c] of pote) {
    if (c.expira && c.expira <= agora) continue
    if (c.seguro && !https) continue
    if (!caminhoCombina(c.caminho, caminho)) continue
    pares.push(`${nome}=${c.valor}`)
  }
  return pares.length ? pares.join('; ') : null
}

/**
 * Guarda os cookies de uma resposta. O React Native junta vários Set-Cookie com ", ";
 * a separação respeita a vírgula das datas ("Expires=Wed, 21 Oct ...").
 */
export async function guardarCookies(setCookie) {
  if (!setCookie) return
  const linhas = setCookie.split(/,(?=\s*[A-Za-z0-9_.-]+=)/)
  for (const linha of linhas) {
    const [par, ...atributos] = linha.split(';').map((p) => p.trim())
    const igual = par.indexOf('=')
    if (igual <= 0) continue
    const nome = par.slice(0, igual)
    if (!NOMES.includes(nome)) continue
    const valor = par.slice(igual + 1)

    const cookie = { valor, caminho: '/', seguro: false, expira: null }
    let maxAge = null
    for (const atributo of atributos) {
      const [chave, ...resto] = atributo.split('=')
      const v = resto.join('=')
      switch (chave.toLowerCase()) {
        case 'path':
          cookie.caminho = v.startsWith('/') ? v : '/'
          break
        case 'secure':
          cookie.seguro = true
          break
        case 'max-age':
          maxAge = Number(v)
          break
        case 'expires': {
          const data = Date.parse(v)
          if (Number.isFinite(data)) cookie.expira = data
          break
        }
      }
    }
    if (maxAge !== null && Number.isFinite(maxAge)) cookie.expira = Date.now() + maxAge * 1000

    const apagar = !valor || (cookie.expira !== null && cookie.expira <= Date.now())
    if (apagar) pote.delete(nome)
    else pote.set(nome, cookie)

    try {
      if (!apagar && cookie.expira) await SecureStore.setItemAsync(CHAVE(nome), JSON.stringify(cookie))
      else await SecureStore.deleteItemAsync(CHAVE(nome))
    } catch {
      // Sem o armazenamento seguro, o cookie vale só enquanto o app estiver aberto.
    }
  }
}

/** Token CSRF atual (o servidor também o devolve no cabeçalho X-XSRF-TOKEN). */
export const tokenCsrf = () => pote.get('XSRF-TOKEN')?.valor ?? null

/** No celular os cookies não vão pelo fetch: o app os envia no cabeçalho. */
export const CREDENCIAIS = 'omit'
