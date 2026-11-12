import { API_URL, origemDe } from '../config.js'

/**
 * Fotos dos registros (troca o utils/images.js do site): só aceita origens seguras.
 * Arquivo salvo na API, foto recém-escolhida no aparelho ou link https.
 */

const DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i
// Fotos enviadas ficam no servidor: "/api/arquivos/<32 hex>.<ext>".
const API_FILE_RE = /^\/api\/arquivos\/[a-f0-9]{32}\.(jpg|png|webp)$/
const LOCAL_RE = /^(file|content|ph):\/\//

export function safeImageSrc(value) {
  if (typeof value !== 'string') return null
  if (DATA_URL_RE.test(value) || LOCAL_RE.test(value)) return value
  return /^https:\/\/[^/@\s]+(\/\S*)?$/i.test(value) ? value : null
}

/** Resolve a foto de um registro: arquivo salvo na API, foto escolhida agora ou link https. */
export function photoSrc(value) {
  if (typeof value !== 'string' || !value) return null
  if (API_FILE_RE.test(value)) return origemDe(API_URL) + value
  return safeImageSrc(value)
}

export function isHttpsImageUrl(value) {
  if (!value.trim()) return true
  return safeImageSrc(value.trim())?.startsWith('https://') ?? false
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
