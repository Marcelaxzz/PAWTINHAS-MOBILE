import { Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as IntentLauncher from 'expo-intent-launcher'
import { horariosDoAlarme } from './recorrencia.js'

/**
 * Alarmes no próprio celular: cada alarme ativo do painel vira uma notificação local agendada,
 * que toca mesmo com o aparelho bloqueado e sem internet.
 *
 * Android: canal próprio no fluxo de áudio de ALARME (não silencia com o volume de notificações),
 * importância máxima, ignora o Não perturbe quando o sistema permite e aparece na tela de bloqueio.
 * O agendamento é exato (USE_EXACT_ALARM / SCHEDULE_EXACT_ALARM no app.json) e sobrevive ao reinício.
 * iOS: som próprio de até 30 s e nível "time sensitive"; o iOS respeita a chave de silencioso.
 */

export const CANAL = 'pawtinhas-alarmes-v1'
export const SOM = 'alarme_pawtinhas.wav'
const CHAVE_ATIVO = 'pawtinhas.alarmesNoCelular'
const PREFIXO = 'pawtinhas-alarme-'

export const suportado = true

/** Como o app mostra uma notificação de alarme com ele aberto: com som e banner. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function prepararCanal() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Alarmes de medicação',
    description: 'Lembretes do painel Pawtinhas (medicação, vacinas e visitas). Tocam mesmo com o celular bloqueado.',
    importance: Notifications.AndroidImportance.MAX,
    sound: SOM,
    vibrationPattern: [0, 600, 400, 600, 400, 600],
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    showBadge: false,
  })
}

/** Preferência deste aparelho (padrão: ligado). */
export async function tocarNesteCelular() {
  try {
    return (await AsyncStorage.getItem(CHAVE_ATIVO)) !== 'nao'
  } catch {
    return true
  }
}

export async function definirTocarNesteCelular(ligado) {
  await AsyncStorage.setItem(CHAVE_ATIVO, ligado ? 'sim' : 'nao')
}

/** Situação das permissões: 'concedida' | 'negada' | 'pendente'. */
export async function situacaoPermissao() {
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted' ? 'concedida' : status === 'denied' ? 'negada' : 'pendente'
}

export async function pedirPermissao() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  })
  return status === 'granted' ? 'concedida' : 'negada'
}

/**
 * Refaz a agenda do aparelho a partir da lista de alarmes da API.
 * Devolve quantos lembretes ficaram agendados.
 */
export async function sincronizarAlarmes(alarmes, { nomePet = () => null } = {}) {
  await prepararCanal()
  const agendadas = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    agendadas
      .filter((n) => n.identifier.startsWith(PREFIXO))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  )

  if (!(await tocarNesteCelular())) return 0
  if ((await situacaoPermissao()) !== 'concedida') return 0

  const ativos = alarmes.filter((a) => a.ativo)
  let total = 0

  for (const alarme of ativos) {
    const pet = nomePet(alarme.petId) ?? alarme.petNome
    const gatilhos = horariosDoAlarme(alarme, new Date())
    for (const [i, gatilho] of gatilhos.entries()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIXO}${alarme.id}-${i}`,
        content: {
          title: `⏰ ${alarme.nome}`,
          body: [pet, alarme.descricao].filter(Boolean).join(' · ') || `Alarme das ${alarme.hora}`,
          data: { alarmeId: alarme.id, tipo: 'alarme' },
          sound: SOM,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 600, 400, 600, 400, 600],
          sticky: false,
          autoDismiss: true,
          interruptionLevel: 'timeSensitive',
          color: '#6e4d36',
        },
        trigger: { ...gatilho, channelId: CANAL },
      })
      total++
    }
  }
  return total
}

export async function cancelarTodos() {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    agendadas
      .filter((n) => n.identifier.startsWith(PREFIXO))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  )
}

/** Toca um alarme de teste em alguns segundos (para conferir som e tela de bloqueio). */
export async function testarAlarme(segundos = 10) {
  await prepararCanal()
  await Notifications.scheduleNotificationAsync({
    identifier: `${PREFIXO}teste`,
    content: {
      title: '⏰ Teste de alarme',
      body: 'Se você ouviu este som, os alarmes vão tocar neste celular.',
      data: { tipo: 'alarme', teste: true },
      sound: SOM,
      priority: Notifications.AndroidNotificationPriority.MAX,
      interruptionLevel: 'timeSensitive',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: segundos, channelId: CANAL },
  })
}

/** Android: abre o ajuste de bateria, para o fabricante não adiar os alarmes. */
export async function abrirAjusteBateria() {
  if (Platform.OS !== 'android') return
  await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS).catch(
    () => {},
  )
}

/** Abre os ajustes do app no sistema (notificações, som, tela de bloqueio). */
export const abrirAjustesDoApp = () => Linking.openSettings()

export const ouvirToque = Notifications.addNotificationResponseReceivedListener
export const ouvirChegada = Notifications.addNotificationReceivedListener
export const ultimoToque = Notifications.getLastNotificationResponseAsync
