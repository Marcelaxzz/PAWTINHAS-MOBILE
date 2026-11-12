// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Campos aceitos por recurso. Tudo que não estiver aqui é descartado antes de
 * salvar. Assim o cliente não injeta propriedades inesperadas (mass assignment).
 * A API aplica a própria lista do lado do servidor (os DTOs só aceitam os campos declarados).
 */
export const RESOURCE_FIELDS = {
  tutores: ['nome', 'telefone', 'cpf', 'email', 'cep', 'endereco', 'cidade', 'uf'],
  profissionais: ['nome', 'funcao', 'papel', 'iniciais', 'email'],
  pets: ['nome', 'especie', 'raca', 'dataNascimento', 'sexo', 'peso', 'tutorId', 'foto', 'observacoes'],
  consultas: ['foto', 'petId', 'tutorId', 'data', 'hora', 'veterinarioId', 'motivo', 'observacoes', 'status'],
  vacinas: [
    'foto',
    'petId',
    'tutorId',
    'nome',
    'dose',
    'data',
    'hora',
    'profissionalId',
    'status',
    'observacoes',
    'aplicadaEm',
  ],
  cirurgias: ['foto', 'petId', 'tutorId', 'data', 'hora', 'procedimento', 'cirurgiaoId', 'observacoes', 'status'],
  banhos: ['foto', 'petId', 'tutorId', 'data', 'hora', 'servico', 'profissionalId', 'observacoes', 'status'],
  visitas: [
    'foto',
    'petId',
    'tutorId',
    'cuidadorId',
    'periodo',
    'dataInicio',
    'dataFim',
    'hora',
    'endereco',
    'servico',
    'observacoes',
    'status',
  ],
  emergencias: [
    'foto',
    'petId',
    'tutorId',
    'petNome',
    'motivo',
    'prioridade',
    'data',
    'hora',
    'profissionalId',
    'status',
    'observacoes',
  ],
  alarmes: ['foto', 'nome', 'petId', 'descricao', 'hora', 'recorrencia', 'inicio', 'ativo'],
  historicoAlarmes: ['alarmeId', 'nome', 'quando', 'resultado'],
  animais: [
    'nome',
    'especie',
    'sexo',
    'raca',
    'dataNascimento',
    'porte',
    'peso',
    'cidade',
    'status',
    'foto',
    'dataEntrada',
    'descricao',
    'frase',
    'sobre',
    'personalidade',
    'infoAdicional',
    'conviveAnimais',
    'conviveCriancas',
    'vacinado',
    'castrado',
    'necessidades',
  ],
  medicoes: [
    'petId',
    'membro',
    'comprimentoMembro',
    'alturaChao',
    'larguraPata',
    'larguraEncaixe',
    'metodo',
    'leituras',
    'criadoEm',
  ],
  medicamentos: [
    'nome',
    'principioAtivo',
    'forma',
    'concentracao',
    'fracionavel',
    'via',
    'doseMinCao',
    'doseMaxCao',
    'doseMinGato',
    'doseMaxGato',
    'doseMaximaMg',
    'intervaloPadraoHoras',
    'observacoes',
    'unidade',
    'fonte',
  ],
  racoes: ['nome', 'especie', 'fase', 'tipo', 'kcalPorKg', 'observacoes', 'foto'],
  materiais: ['nome', 'tipo', 'unidade', 'especificacao', 'observacoes'],
  // Na criação a API recalcula tudo a partir destes dados; na edição aceita só status e observações.
  prescricoes: [
    'petId',
    'medicamentoId',
    'medicamento',
    'unidade',
    'concentracao',
    'fracionavel',
    'via',
    'pesoKg',
    'doseMgKg',
    'intervaloHoras',
    'duracaoDias',
    'inicio',
    'horaPrimeiraDose',
    'observacoes',
    'confirmarAlertas',
    'criarAlarme',
    'atualizarPesoPaciente',
    'status',
  ],
  planosAlimentares: [
    'petId',
    'racaoId',
    'racao',
    'kcalPorKg',
    'condicao',
    'fatorPersonalizado',
    'pesoAtualKg',
    'pesoMetaKg',
    'refeicoes',
    'observacoes',
    'atualizarPesoPaciente',
  ],
  configuracoes: ['clinica', 'notificacoes', 'integracoes'],
}

const MAX_STRING = 2000
const MAX_DATA_URL = 1_500_000

function cleanValue(value) {
  if (typeof value === 'string') {
    const limit = value.startsWith('data:image/') ? MAX_DATA_URL : MAX_STRING
    return value.slice(0, limit)
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
        .map(([key, v]) => [key, cleanValue(v)]),
    )
  }
  return undefined
}

export function pickFields(resource, data) {
  const fields = RESOURCE_FIELDS[resource]
  if (!fields) throw new Error(`Recurso desconhecido: ${resource}`)
  const result = {}
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      const value = cleanValue(data[field])
      if (value !== undefined) result[field] = value
    }
  }
  return result
}
