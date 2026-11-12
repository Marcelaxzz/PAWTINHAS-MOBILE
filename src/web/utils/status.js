// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/** Cor de cada status nas etiquetas. */
const STATUS_TONES = {
  Concluída: 'sucesso',
  Concluído: 'sucesso',
  Aplicada: 'sucesso',
  Ativo: 'sucesso',
  Ativa: 'sucesso',
  Suspensa: 'alerta',
  'Alta médica': 'sucesso',
  Disponível: 'sucesso',
  Pendente: 'alerta',
  Pausado: 'alerta',
  'Em atendimento': 'perigo',
  Cancelado: 'perigo',
  Adotado: 'neutro',
  Estabilizado: 'alerta',
  'Em processo': 'alerta',
  'Em andamento': 'alerta',
  Agendado: 'info',
}

export function statusTone(status) {
  return STATUS_TONES[status] ?? 'neutro'
}
