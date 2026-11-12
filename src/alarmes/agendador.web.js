/**
 * No navegador (Expo web) não há agendamento de notificações locais: os alarmes tocam no app
 * instalado no celular e no dispositivo ESP32. Mesma interface do agendador.native.js.
 */
export const suportado = false
export const prepararCanal = async () => {}
export const tocarNesteCelular = async () => false
export const definirTocarNesteCelular = async () => {}
export const situacaoPermissao = async () => 'negada'
export const pedirPermissao = async () => 'negada'
export const sincronizarAlarmes = async () => 0
export const cancelarTodos = async () => {}
export const testarAlarme = async () => {}
export const abrirAjusteBateria = async () => {}
export const abrirAjustesDoApp = async () => {}
const semOuvinte = () => ({ remove() {} })
export const ouvirToque = semOuvinte
export const ouvirChegada = semOuvinte
export const ultimoToque = async () => null
