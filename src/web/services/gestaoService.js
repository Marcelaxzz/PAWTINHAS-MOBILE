// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { ApiError, request } from './http.js'
import { salvarArquivo } from '../utils/salvarArquivo.js'

const consulta = (params) => {
  const busca = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  const texto = busca.toString()
  return texto ? `?${texto}` : ''
}

/** Baixa um PDF da API e entrega ao navegador (ou ao compartilhamento, no app). Devolve o nome do arquivo. */
async function baixar(caminho) {
  const arquivo = await request(caminho, { arquivo: true })
  await salvarArquivo(arquivo.conteudo, arquivo.nome, 'application/pdf')
  return arquivo.nome
}

/** Categorias do estoque como a API recebe. */
export const CATEGORIA = { medicamento: 'Medicamento', racao: 'Racao', material: 'Material' }

/** Estoque por lote dos medicamentos, das rações e dos materiais do catálogo. */
export const estoqueService = {
  listar: () => request('/estoque'),
  movimentacoes: ({ categoria, itemId, de, ate, limite } = {}) =>
    request(`/estoque/movimentacoes${consulta({ categoria, itemId, de, ate, limite })}`),
  entrada: (dados) => request('/estoque/entradas', { method: 'POST', body: dados }),
  saida: (dados) => request('/estoque/saidas', { method: 'POST', body: dados }),
  descarte: (dados) => request('/estoque/descartes', { method: 'POST', body: dados }),
  minimo: (dados) => request('/estoque/minimo', { method: 'PUT', body: dados }),
}

/** Relatório do atendimento (preenchido pela veterinária) e relatórios automáticos em PDF. */
export const relatoriosService = {
  /** Relatório salvo do atendimento, ou null se ainda não foi preenchido. */
  async obterAtendimento(eventoId) {
    try {
      return await request(`/eventos/${encodeURIComponent(eventoId)}/relatorio`)
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 404) return null
      throw erro
    }
  },
  salvarAtendimento: (eventoId, dados) =>
    request(`/eventos/${encodeURIComponent(eventoId)}/relatorio`, { method: 'PUT', body: dados }),
  /** Ids (texto) dos atendimentos que já têm relatório. */
  comRelatorio: async () => (await request('/relatorios/atendimentos-com-relatorio')).map(String),

  pdfAtendimento: (eventoId) => baixar(`/eventos/${encodeURIComponent(eventoId)}/relatorio/pdf`),
  pdfAgenda: ({ de, ate, tipo } = {}) => baixar(`/relatorios/agenda${consulta({ de, ate, tipo })}`),
  pdfEstoque: ({ de, ate } = {}) => baixar(`/relatorios/estoque${consulta({ de, ate })}`),
  pdfPaciente: (petId) => baixar(`/relatorios/pacientes/${encodeURIComponent(petId)}`),
  pdfAlarmes: () => baixar('/relatorios/alarmes'),
  pdfAdocao: () => baixar('/relatorios/adocao'),
}

/** Tipos de atendimento do relatório da agenda (nome na API → nome na tela). */
export const TIPOS_RELATORIO_AGENDA = [
  { value: '', label: 'Todos os serviços' },
  { value: 'Consulta', label: 'Consultas' },
  { value: 'Vacina', label: 'Vacinas' },
  { value: 'Cirurgia', label: 'Cirurgias' },
  { value: 'BanhoTosa', label: 'Banho e tosa' },
  { value: 'PetSitter', label: 'Pet sitter' },
  { value: 'Emergencia', label: 'Emergências' },
]
