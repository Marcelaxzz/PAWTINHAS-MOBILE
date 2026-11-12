// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { request } from './http.js'

const post = (path, body) => request(path, { method: 'POST', body })

/**
 * Login único da veterinária, em duas etapas:
 * e-mail e senha, depois o código de 6 dígitos enviado por e-mail e, por fim, a sessão em cookies httpOnly (JWT).
 */
export const authService = {
  /** Retorna `{ challengeId, resendIn }`; o código chega no e-mail cadastrado. */
  login: ({ identifier, password, remember }) =>
    post('/auth/login', { identifier: identifier.trim(), password, remember: Boolean(remember) }),
  /** Retorna `{ user }` e inicia a sessão. */
  verifyLogin: ({ challengeId, code }) => post('/auth/login/verify', { challengeId, code }),
  resendCode: ({ challengeId }) => post('/auth/code/resend', { challengeId }),
  requestPasswordReset: ({ email, password }) =>
    post('/auth/password/forgot', { email: email.trim().toLowerCase(), password }),
  confirmPasswordReset: ({ challengeId, code }) => post('/auth/password/verify', { challengeId, code }),
  me: () => request('/auth/me'),
  logout: () => post('/auth/logout'),
}

/** Página inicial após o login. */
export const HOME_PATH = '/inicio'
