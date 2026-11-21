import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { useAuth } from '../web/hooks/useAuth.js'
import { dataService } from '../web/services/dataService.js'
import { paradasAlarmeService } from '../web/services/gestaoService.js'
import { minutoDoToque, paradaDoToque, tocaEm } from '../web/utils/alarmes.js'
import {
  dispensarAlarmes,
  ouvirChegada,
  ouvirToque,
  sincronizarAlarmes,
  tocarNesteCelular,
  ultimoToque,
} from './agendador'
import { alarmeTocando } from './estado.js'
import { AvisoAlarme } from './AvisoAlarme.jsx'

const MINUTO = 60_000
/** Sem ninguém desligar, o aviso some depois de 5 minutos (o painel e a caixinha param antes, em 45 s). */
const LIMITE_MS = 5 * MINUTO
const CONFERIR_PARADA_MS = 2500
const MOSTRAR_PARADO_MS = 3000
const doisDigitos = (n) => String(n).padStart(2, '0')
const horaDe = (minuto) => {
  const d = new Date(minuto * MINUTO)
  return `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
}

/**
 * Alarmes no celular:
 * - mantém a agenda de notificações do aparelho igual à do painel (tocam com o app fechado, com o botão
 *   "Desligar alarme" na própria notificação);
 * - com o app aberto, mostra o aviso no alto da tela, por cima de tudo, com som e o botão de desligar;
 * - desligar aqui desliga no painel e na caixinha; desligar lá fecha o aviso aqui.
 */
export function AlarmesDoCelular() {
  const { status } = useAuth()
  const logado = status === 'autenticado'
  const [toque, setToque] = useState(null)
  const [comSom, setComSom] = useState(true)
  const toqueAtual = useRef(null)
  const alarmes = useRef([])
  const nomesPets = useRef({})
  const jaTocados = useRef(new Set())
  const ultimaSincronia = useRef(0)

  useEffect(() => {
    toqueAtual.current = toque
  }, [toque])

  const itemDoAlarme = useCallback((alarme) => {
    const pet = nomesPets.current[alarme.petId] ?? alarme.petNome
    return { id: alarme.id, nome: alarme.nome, detalhe: [pet, alarme.descricao].filter(Boolean).join(' · ') }
  }, [])

  /** Mostra o aviso (junta no mesmo aviso os alarmes do mesmo minuto; não repete um que já tocou). */
  const iniciar = useCallback((itens, minuto) => {
    const novos = itens.filter((item) => !jaTocados.current.has(`${item.id}|${minuto}`))
    if (novos.length === 0) return
    novos.forEach((item) => jaTocados.current.add(`${item.id}|${minuto}`))
    tocarNesteCelular()
      .then(setComSom)
      .catch(() => setComSom(true))
    setToque((atual) =>
      atual && !atual.paradoOnde && atual.minuto === minuto
        ? { ...atual, lista: [...atual.lista, ...novos] }
        : { minuto, hora: horaDe(minuto), lista: novos, paradoOnde: null },
    )
  }, [])

  const fechar = useCallback(() => setToque(null), [])

  /** Desliga aqui, tira as notificações desse minuto e avisa o servidor (painel e caixinha param junto). */
  const desligar = useCallback((ids, minuto) => {
    const reais = ids.filter((id) => id > 0)
    reais.forEach((id) => jaTocados.current.add(`${id}|${minuto}`))
    dispensarAlarmes((dados, m) => Math.abs(m - minuto) <= 1).catch(() => {})
    if (reais.length > 0) paradasAlarmeService.parar(reais, minuto, 'app').catch(() => {})
    const atual = toqueAtual.current
    if (atual && Math.abs(atual.minuto - minuto) <= 1) setToque(null)
  }, [])

  const desligarAtual = useCallback(() => {
    const atual = toqueAtual.current
    if (!atual || atual.paradoOnde) return
    desligar(
      atual.lista.map((a) => a.id),
      atual.minuto,
    )
  }, [desligar])

  // Sincroniza ao entrar, quando o app volta para a frente e quando um alarme é salvo.
  useEffect(() => {
    if (!logado) return undefined
    const sincronizar = async (forcar = false) => {
      if (!forcar && Date.now() - ultimaSincronia.current < MINUTO) return
      ultimaSincronia.current = Date.now()
      try {
        const [lista, pets] = await Promise.all([dataService.list('alarmes'), dataService.list('pets')])
        nomesPets.current = Object.fromEntries(pets.map((p) => [p.id, p.nome]))
        alarmes.current = lista.filter((a) => a.ativo)
        await sincronizarAlarmes(lista, { nomePet: (id) => nomesPets.current[id] })
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
  }, [logado])

  // Com o app aberto, confere a cada 5 s se algum alarme está na hora (mesmo com o som do celular desligado).
  useEffect(() => {
    if (!logado) return undefined
    let ultimo = Math.floor(Date.now() / MINUTO)
    const conferir = () => {
      if (AppState.currentState !== 'active') return
      const agora = Math.floor(Date.now() / MINUTO)
      for (let m = Math.max(ultimo + 1, agora - 2); m <= agora; m++) {
        const lista = alarmes.current.filter((a) => tocaEm(a, new Date(m * MINUTO)))
        if (lista.length > 0) iniciar(lista.map(itemDoAlarme), m)
      }
      ultimo = Math.max(ultimo, agora)
    }
    const intervalo = setInterval(conferir, 5000)
    return () => clearInterval(intervalo)
  }, [logado, iniciar, itemDoAlarme])

  // Notificações: chegou com o app aberto, tocou no corpo ou apertou "Desligar alarme".
  useEffect(() => {
    if (!logado) return undefined
    const itemDaNotificacao = (notificacao) => {
      const { content } = notificacao.request
      const id = content.data?.alarmeId ?? 0
      const alarme = alarmes.current.find((a) => a.id === id)
      if (alarme) return itemDoAlarme(alarme)
      return { id, nome: (content.title ?? 'Alarme').replace(/^⏰\s*/, ''), detalhe: content.body ?? '' }
    }
    const chegou = (notificacao) => {
      if (notificacao.request.content.data?.tipo !== 'alarme') return
      iniciar([itemDaNotificacao(notificacao)], minutoDoToque(notificacao.date))
    }
    const respondeu = (resposta, recente = true) => {
      const { notification, actionIdentifier } = resposta
      if (notification.request.content.data?.tipo !== 'alarme') return
      const minuto = minutoDoToque(notification.date)
      if (actionIdentifier === 'parar') {
        desligar([notification.request.content.data?.alarmeId ?? 0], minuto)
        return
      }
      if (recente) iniciar([itemDaNotificacao(notification)], minuto)
    }
    const chegada = ouvirChegada(chegou)
    const toque = ouvirToque((resposta) => respondeu(resposta))
    // App aberto pela notificação (estava fechado): trata o toque ou o "Desligar alarme" que o abriu.
    ultimoToque().then((resposta) => {
      if (resposta) respondeu(resposta, Date.now() - resposta.notification.date < LIMITE_MS)
    })
    return () => {
      chegada.remove()
      toque.remove()
    }
  }, [logado, iniciar, desligar, itemDoAlarme])

  // Voltou para o app: tira da tela as notificações de alarmes que já foram desligados em outro aparelho.
  useEffect(() => {
    if (!logado) return undefined
    const limpar = async () => {
      try {
        const paradas = await paradasAlarmeService.recentes()
        if (paradas.length === 0) return
        await dispensarAlarmes((dados, minuto) => Boolean(paradaDoToque(paradas, [dados?.alarmeId], minuto)))
      } catch {
        // Sem conexão: as notificações ficam até alguém mexer nelas.
      }
    }
    limpar()
    const app = AppState.addEventListener('change', (estado) => estado === 'active' && limpar())
    return () => app.remove()
  }, [logado])

  const minutoTocando = toque && !toque.paradoOnde ? toque.minuto : null
  const idsTocando = toque?.lista.map((a) => a.id).join(',')

  // Ninguém desligou: o aviso some sozinho depois do limite.
  useEffect(() => {
    if (minutoTocando === null) return undefined
    const fim = setTimeout(fechar, LIMITE_MS)
    return () => clearTimeout(fim)
  }, [minutoTocando, fechar])

  // Enquanto toca, pergunta ao servidor se desligaram no painel ou na caixinha.
  useEffect(() => {
    if (minutoTocando === null) return undefined
    const ids = idsTocando.split(',').map(Number)
    let ativo = true
    const conferir = async () => {
      try {
        const parada = paradaDoToque(await paradasAlarmeService.recentes(), ids, minutoTocando)
        if (!ativo || !parada) return
        dispensarAlarmes((dados, m) => Math.abs(m - minutoTocando) <= 1).catch(() => {})
        setToque((atual) => (atual?.minuto === minutoTocando ? { ...atual, paradoOnde: parada.origem } : atual))
      } catch {
        // Sem conexão: continua tocando até desligar aqui ou o tempo acabar.
      }
    }
    conferir()
    const intervalo = setInterval(conferir, CONFERIR_PARADA_MS)
    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [minutoTocando, idsTocando])

  // "Desligado na caixinha" fica alguns segundos e some.
  useEffect(() => {
    if (!toque?.paradoOnde) return undefined
    const fim = setTimeout(fechar, MOSTRAR_PARADO_MS)
    return () => clearTimeout(fim)
  }, [toque?.paradoOnde, fechar])

  if (!logado) return null
  return <AvisoAlarme toque={toque} comSom={comSom} onDesligar={desligarAtual} />
}
