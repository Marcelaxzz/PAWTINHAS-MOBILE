import { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { SITE_URL } from '../config.js'
import { paginaVisao } from './visaoHost.js'

/** Sem resposta do OpenCV nesse tempo, a medição segue à mão (como no site, se o worker falhar). */
const LIMITE_CARREGAMENTO_MS = 60_000

/**
 * Visão computacional da medição no celular (useVisao do site): uma WebView invisível roda o
 * worker do OpenCV. estado: 'carregando' | 'pronto' | 'erro'.
 * A foto é { id, dataUrl, width, height }; ela só é enviada à WebView uma vez.
 */
export function useVisao() {
  const webview = useRef(null)
  const pendentes = useRef(new Map())
  const proximoId = useRef(1)
  const fotoCarregada = useRef(null)
  const fila = useRef([])
  const paginaPronta = useRef(false)
  const [estado, setEstado] = useState('carregando')
  const limite = useRef(null)

  const injetar = useCallback((msg) => {
    webview.current?.injectJavaScript(`window.__receber && window.__receber(${JSON.stringify(msg)}); true;`)
  }, [])

  const chamar = useCallback(
    (tipo, dados) =>
      new Promise((resolve, reject) => {
        const id = proximoId.current++
        pendentes.current.set(id, { resolve, reject })
        const msg = { id, tipo, dados }
        if (paginaPronta.current) injetar(msg)
        else fila.current.push(msg)
      }),
    [injetar],
  )

  const aoMensagem = useCallback(
    (evento) => {
      let msg
      try {
        msg = JSON.parse(evento.nativeEvent.data)
      } catch {
        return
      }
      if (msg.tipo === 'estado') {
        if (!paginaPronta.current) {
          paginaPronta.current = true
          fila.current.splice(0).forEach(injetar)
          limite.current = setTimeout(() => setEstado((e) => (e === 'carregando' ? 'erro' : e)), LIMITE_CARREGAMENTO_MS)
        }
        if (msg.estado !== 'carregando') {
          clearTimeout(limite.current)
          setEstado(msg.estado)
          if (msg.estado === 'erro') {
            pendentes.current.forEach(({ reject }) => reject(new Error('A análise da foto falhou.')))
            pendentes.current.clear()
          }
        }
        return
      }
      const pendente = pendentes.current.get(msg.id)
      if (!pendente) return
      pendentes.current.delete(msg.id)
      if (msg.ok) pendente.resolve(msg.resultado)
      else pendente.reject(new Error(msg.erro))
    },
    [injetar],
  )

  const garantirFoto = useCallback(
    async (foto) => {
      if (fotoCarregada.current === foto.id) return
      await chamar('carregarFoto', { fotoId: foto.id, dataUrl: foto.dataUrl })
      fotoCarregada.current = foto.id
    },
    [chamar],
  )

  const detectarCartao = useCallback(
    async (foto) => {
      if (estado === 'erro') throw new Error('Visão computacional indisponível.')
      await garantirFoto(foto)
      return chamar('detectarCartao', { fotoId: foto.id })
    },
    [chamar, garantirFoto, estado],
  )

  const encaixarBordas = useCallback(
    async (foto, a, b) => {
      await garantirFoto(foto)
      return chamar('encaixarBordas', { fotoId: foto.id, a, b })
    },
    [chamar, garantirFoto],
  )

  const fonte = useMemo(() => ({ html: paginaVisao(`${SITE_URL}/vendor/opencv.js`), baseUrl: SITE_URL }), [])

  const hospedeiro = (
    <WebView
      ref={webview}
      source={fonte}
      onMessage={aoMensagem}
      onError={() => setEstado('erro')}
      originWhitelist={['*']}
      javaScriptEnabled
      mixedContentMode="compatibility"
      style={estilos.oculta}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )

  return { estado, detectarCartao, encaixarBordas, hospedeiro }
}

const estilos = StyleSheet.create({
  oculta: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 },
})
