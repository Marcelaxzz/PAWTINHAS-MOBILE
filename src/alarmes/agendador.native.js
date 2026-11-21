import { requireOptionalNativeModule } from 'expo'
import * as semNotificacoes from './agendador.web.js'

/**
 * Escolhe o agendador de alarmes do celular.
 *
 * O expo-notifications carrega o módulo nativo ExpoApplication assim que é importado, e o Expo Go
 * do SDK 58 não traz esse módulo: o import quebrava o app inteiro antes da primeira tela. Por isso
 * o agendador completo (notificacoes.native.js) só é carregado quando o módulo existe, como no APK.
 * Sem ele, o app abre normalmente e os alarmes no celular ficam desligados (os do painel e do ESP32
 * continuam funcionando).
 */
function carregar() {
  if (!requireOptionalNativeModule('ExpoApplication')) return semNotificacoes
  try {
    return require('./notificacoes.native.js')
  } catch {
    return semNotificacoes
  }
}

const agendador = carregar()

export const suportado = agendador.suportado
export const prepararCanal = (...a) => agendador.prepararCanal(...a)
export const tocarNesteCelular = (...a) => agendador.tocarNesteCelular(...a)
export const definirTocarNesteCelular = (...a) => agendador.definirTocarNesteCelular(...a)
export const situacaoPermissao = (...a) => agendador.situacaoPermissao(...a)
export const pedirPermissao = (...a) => agendador.pedirPermissao(...a)
export const sincronizarAlarmes = (...a) => agendador.sincronizarAlarmes(...a)
export const cancelarTodos = (...a) => agendador.cancelarTodos(...a)
export const testarAlarme = (...a) => agendador.testarAlarme(...a)
export const abrirAjusteBateria = (...a) => agendador.abrirAjusteBateria(...a)
export const abrirAjustesDoApp = (...a) => agendador.abrirAjustesDoApp(...a)
export const dispensarAlarmes = (...a) => agendador.dispensarAlarmes(...a)
export const ouvirToque = (...a) => agendador.ouvirToque(...a)
export const ouvirChegada = (...a) => agendador.ouvirChegada(...a)
export const ultimoToque = (...a) => agendador.ultimoToque(...a)
