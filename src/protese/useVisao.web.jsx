import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SITE_URL } from '../config.js'
import { paginaVisao } from './visaoHost.js'

/**
 * Visão computacional no Expo web: a mesma página da WebView, num iframe invisível.
 * Mesma interface do useVisao.native.jsx.
 */
export function useVisao() {
  const iframe = useRef(null)
  const pendentes = useRef(new Map())
  const proximoId = useRef(1)
  const fotoCarregada = useRef(null)
  const fila = useRef([])
  const paginaPronta = useRef(false)
  const [estado, setEstado] = useState('carregando')

  const enviar = useCallback((msg) => {
    iframe.current?.contentWindow?.postMessage({ pawtinhasPedido: JSON.stringify(msg) }, '*')
  }, [])

  const chamar = useCallback(
    (tipo, dados) =>
      new Promise((resolve, reject) => {
        const id = proximoId.current++
        pendentes.current.set(id, { resolve, reject })
        const msg = { id, tipo, dados }
        if (paginaPronta.current) enviar(msg)
        else fila.current.push(msg)
      }),
    [enviar],
  )

  useEffect(() => {
    const aoMensagem = (evento) => {
      if (evento.source !== iframe.current?.contentWindow || !evento.data?.pawtinhasVisao) return
      const msg = JSON.parse(evento.data.pawtinhasVisao)
      if (msg.tipo === 'estado') {
        if (!paginaPronta.current) {
          paginaPronta.current = true
          fila.current.splice(0).forEach(enviar)
        }
        if (msg.estado !== 'carregando') setEstado(msg.estado)
        return
      }
      const pendente = pendentes.current.get(msg.id)
      if (!pendente) return
      pendentes.current.delete(msg.id)
      if (msg.ok) pendente.resolve(msg.resultado)
      else pendente.reject(new Error(msg.erro))
    }
    window.addEventListener('message', aoMensagem)
    return () => window.removeEventListener('message', aoMensagem)
  }, [enviar])

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

  const html = useMemo(() => paginaVisao(`${SITE_URL}/vendor/opencv.js`), [])

  const hospedeiro = (
    <iframe
      ref={iframe}
      srcDoc={html}
      title="Visão computacional da medição"
      aria-hidden="true"
      tabIndex={-1}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0, left: -10, top: -10 }}
    />
  )

  return { estado, detectarCartao, encaixarBordas, hospedeiro }
}
