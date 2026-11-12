import { API_URL } from '../config.js'
import { CREDENCIAIS, cabecalhoCookie, carregarCookies, guardarCookies, tokenCsrf } from './cookies'

/**
 * Cliente da API no app: o mesmo contrato do services/http.js do site (request, ApiError,
 * renovação automática da sessão), com os cookies tratados pelo app no celular.
 */

export { API_URL }
const TIMEOUT_MS = 15000
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'erro_desconhecido', retryAfter = null, fields = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
    this.fields = fields
  }
}

const GENERIC_MESSAGES = {
  0: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
  400: 'Confira os dados informados e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  408: 'O servidor demorou para responder. Tente novamente.',
  429: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  500: 'Algo deu errado do nosso lado. Tente novamente em instantes.',
}

function messageFor(status, serverMessage) {
  // Mensagens do servidor só aparecem em erros de validação/regra (4xx), nunca em 5xx.
  if (status >= 400 && status < 500 && typeof serverMessage === 'string' && serverMessage.length <= 200) {
    return serverMessage
  }
  return GENERIC_MESSAGES[status] ?? GENERIC_MESSAGES[status >= 500 ? 500 : 400]
}

// Rotas de autenticação nunca disparam a renovação automática (evita laço).
const NO_REFRESH = /^\/auth\/(login|code|password|refresh|logout)/

/** Avisos de sessão encerrada (o AuthContext volta ao login). */
const ouvintesSessao = new Set()
export function aoExpirarSessao(ouvinte) {
  ouvintesSessao.add(ouvinte)
  return () => ouvintesSessao.delete(ouvinte)
}

let refreshing = null
/** Último token CSRF recebido no cabeçalho (vale quando o cookie não é legível). */
let csrfDoCabecalho = null

function refreshSession() {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

/**
 * Requisição JSON para a API. O token de acesso dura poucos minutos: quando expira,
 * a sessão é renovada e a requisição repetida uma vez.
 */
export async function request(path, options = {}) {
  try {
    return await send(path, options)
  } catch (error) {
    if (error.status !== 401 || NO_REFRESH.test(path)) throw error
    if (!(await refreshSession())) {
      if (path !== '/auth/me') ouvintesSessao.forEach((ouvinte) => ouvinte())
      throw error
    }
    return send(path, options)
  }
}

/** Antes da primeira requisição: garante um token CSRF (a API entrega em qualquer GET). */
async function garantirCsrf() {
  if (tokenCsrf() || csrfDoCabecalho) return
  await send('/auth/me').catch(() => null)
}

/** Nome do arquivo no Content-Disposition (filename*=UTF-8'' tem prioridade, por causa dos acentos). */
function nomeDoArquivo(disposicao, padrao = 'arquivo') {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposicao ?? '')
  if (utf8) return decodeURIComponent(utf8[1])
  const simples = /filename="?([^";]+)"?/i.exec(disposicao ?? '')
  return simples ? simples[1] : padrao
}

/** arquivo: true devolve { conteudo (ArrayBuffer), nome, tipo } (PDF dos relatórios). */
async function send(path, { method = 'GET', body, signal, arquivo = false } = {}) {
  await carregarCookies()
  if (UNSAFE_METHODS.has(method)) await garantirCsrf()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS)
  signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true })

  const url = `${API_URL}${path}`
  const headers = {
    Accept: arquivo ? 'application/pdf, application/json' : 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
  // FormData (envio de foto) define o próprio Content-Type, com o boundary do multipart.
  const multipart = body instanceof FormData
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json'
  if (UNSAFE_METHODS.has(method)) {
    const csrf = tokenCsrf() ?? csrfDoCabecalho
    if (csrf) headers['X-XSRF-TOKEN'] = csrf
  }
  const cookie = cabecalhoCookie(url)
  if (cookie) headers.Cookie = cookie

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      credentials: CREDENCIAIS,
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    const status = controller.signal.aborted ? 408 : 0
    throw new ApiError(GENERIC_MESSAGES[status], { status, code: status ? 'timeout' : 'rede' })
  } finally {
    clearTimeout(timeout)
  }

  await guardarCookies(response.headers.get('set-cookie'))
  csrfDoCabecalho = response.headers.get('x-xsrf-token') ?? csrfDoCabecalho

  if (response.status === 204) return null

  if (arquivo && response.ok) {
    return {
      conteudo: await response.arrayBuffer(),
      nome: nomeDoArquivo(response.headers.get('content-disposition')),
      tipo: response.headers.get('content-type') ?? 'application/octet-stream',
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const retryAfterHeader = Number(response.headers.get('Retry-After'))
    throw new ApiError(messageFor(response.status, data?.message), {
      status: response.status,
      code: typeof data?.code === 'string' ? data.code : 'erro_http',
      retryAfter: Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : null,
      fields: data?.fields && typeof data.fields === 'object' ? data.fields : null,
    })
  }

  return data
}
