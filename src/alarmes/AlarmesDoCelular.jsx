import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../web/hooks/useAuth.js'
import { dataService } from '../web/services/dataService.js'
import { ouvirChegada, ouvirToque, sincronizarAlarmes, ultimoToque } from './agendador'
import { alarmeTocando } from './estado.js'

/** Mantém a agenda do aparelho igual à do painel; sem interface. */
export function AlarmesDoCelular() {
  const { status } = useAuth()
  const router = useRouter()
  const ultimaSincronia = useRef(0)

  // Sincroniza ao entrar, quando o app volta para a frente e quando um alarme é salvo.
  useEffect(() => {
    if (status !== 'autenticado') return undefined
    const sincronizar = async (forcar = false) => {
      if (!forcar && Date.now() - ultimaSincronia.current < 60_000) return
      ultimaSincronia.current = Date.now()
      try {
        const [alarmes, pets] = await Promise.all([dataService.list('alarmes'), dataService.list('pets')])
        const nomes = Object.fromEntries(pets.map((p) => [p.id, p.nome]))
        await sincronizarAlarmes(alarmes, { nomePet: (id) => nomes[id] })
      } catch {
        // Sem conexão: fica valendo a última agenda gravada no aparelho.
      }
    }
    sincronizar(true)
    const app = AppState.addEventListener('change', (estado) => estado === 'active' && sincronizar())
    const pedido = alarmeTocando.aoPedirSincronia(() => sincronizar(true))
    return () => {
      app.remove()
      pedido()
    }
  }, [status])

  // Alarme disparado: com o app aberto ou ao tocar na notificação, abre a tela do alarme tocando.
  useEffect(() => {
    const abrir = (notificacao) => {
      const { content, identifier } = notificacao.request
      if (content.data?.tipo !== 'alarme') return
      if (
        !alarmeTocando.iniciar({ id: identifier, titulo: content.title, texto: content.body, quando: notificacao.date })
      )
        return
      router.push('/alarme-tocando')
    }
    const chegada = ouvirChegada(abrir)
    const toque = ouvirToque((resposta) => abrir(resposta.notification))
    ultimoToque().then((resposta) => {
      // Só se o alarme for recente (o app foi aberto pela notificação).
      if (resposta && Date.now() - resposta.notification.date < 10 * 60_000) abrir(resposta.notification)
    })
    return () => {
      chegada.remove()
      toque.remove()
    }
  }, [router])

  return null
}
