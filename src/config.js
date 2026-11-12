import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Endereços do app. Em produção, defina no .env (veja .env.example):
 *   EXPO_PUBLIC_API_URL=https://pawtinhas.exemplo.com.br/api
 *   EXPO_PUBLIC_SITE_URL=https://pawtinhas.exemplo.com.br
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

/** Site do Pawtinhas: o app usa o OpenCV.js publicado nele (/vendor/opencv.js) na medição da prótese. */
export const SITE_URL = semBarraFinal(
  process.env.EXPO_PUBLIC_SITE_URL || (process.env.EXPO_PUBLIC_API_URL ? origemDe(API_URL) : `http://${host}:5173`),
)

/**
 * WhatsApp da clínica (somente dígitos, com DDI e DDD, ex.: 5534999990000).
 * Sem um número válido, os botões de WhatsApp não aparecem (igual ao site).
 */
const whatsapp = (process.env.EXPO_PUBLIC_WHATSAPP ?? '').replace(/\D/g, '')
const WHATSAPP = whatsapp.length >= 12 && whatsapp.length <= 13 ? whatsapp : ''

/** Link do WhatsApp com a mensagem pronta, ou null se o número não foi configurado. */
export function whatsappLink(message) {
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}` : null
}
