import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Endereços do app. Em produção, defina no .env (veja .env.example):
 *   EXPO_PUBLIC_API_URL=https://pawtinhas.exemplo.com.br/api
 * No desenvolvimento, sem .env, o app usa o mesmo computador que roda o Expo
 * (API na porta 5135 e site na 5173), como no "npm run dev" do site.
 */
const semBarraFinal = (url) => url.replace(/\/+$/, '')

/** "https://site.com.br/api" → "https://site.com.br" (o URL do React Native não tem origin em todas as versões). */
export const origemDe = (url) => /^[a-z]+:\/\/[^/?#]+/i.exec(url)?.[0] ?? ''

function hostDoDesenvolvimento() {
  if (Platform.OS === 'web') return typeof location === 'undefined' ? 'localhost' : location.hostname
  // "192.168.0.10:8081": o computador onde o Expo está rodando.
  const host = Constants.expoConfig?.hostUri ?? Constants.linkingUri ?? ''
  return host.replace(/^[a-z]+:\/\//, '').split(/[:/]/)[0] || 'localhost'
}

const host = hostDoDesenvolvimento()

export const API_URL = semBarraFinal(process.env.EXPO_PUBLIC_API_URL || `http://${host}:5135/api`)

/**
 * WhatsApp da clínica (somente dígitos, com DDI e DDD, ex.: 5534999990000).
 * Sem um número válido, os botões de WhatsApp não aparecem (igual ao site).
 */
// Padrão: o WhatsApp da clínica, (34) 99882-0471.
const whatsapp = (process.env.EXPO_PUBLIC_WHATSAPP || '5534998820471').replace(/\D/g, '')
const WHATSAPP = whatsapp.length >= 12 && whatsapp.length <= 13 ? whatsapp : ''

/**
 * Link do WhatsApp da clínica (código QR), igual ao do site. Vale enquanto o número não está em
 * EXPO_PUBLIC_WHATSAPP: abre a conversa, mas não leva texto, então a tela copia a mensagem.
 */
const WHATSAPP_QR = (process.env.EXPO_PUBLIC_WHATSAPP_QR ?? 'https://wa.me/qr/Q3DOO4QNN3FHO1').trim()

/** true quando o link já abre o WhatsApp com a mensagem escrita (número configurado). */
export const whatsappLevaMensagem = Boolean(WHATSAPP)

/** Link do WhatsApp com a mensagem pronta (ou o link do QR da clínica), ou null se nenhum foi configurado. */
export function whatsappLink(message) {
  if (WHATSAPP) return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`
  return WHATSAPP_QR || null
}
