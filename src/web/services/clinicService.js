// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { ApiError, request } from './http.js'
import { camposDaTela, paraCalculoAlimentacao, paraCalculoDose } from './adaptadores.js'

/** Na tela o paciente é "petId"; na API, "animalId". */
async function simular(caminho, corpo, signal) {
  try {
    return await request(caminho, { method: 'POST', body: corpo, signal })
  } catch (erro) {
    if (erro instanceof ApiError && erro.fields) {
      throw new ApiError(erro.message, { ...erro, fields: camposDaTela(erro.fields, { animalId: 'petId' }) })
    }
    throw erro
  }
}

/** Cálculos clínicos (simulação, sem salvar) e rotinas da clínica. */
export const clinicService = {
  /** Fatores de manutenção (MER = RER × fator) com faixa e fonte, intervalos de dose e referências. */
  fatores: () => request('/calculos/fatores'),
  simularDose: (dados, signal) => simular('/calculos/dose', paraCalculoDose(dados), signal),
  simularAlimentacao: (dados, signal) => simular('/calculos/alimentacao', paraCalculoAlimentacao(dados), signal),
  statusIntegracoes: () => request('/configuracoes/status'),
  baixarBackup: () => request('/configuracoes/backup'),
}
