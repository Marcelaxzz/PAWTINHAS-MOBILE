// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { todayIso, toIsoDate } from './dates.js'
import { todaysTimeline } from './agenda.js'
import { proximoToque, textoDoToque } from './alarmes.js'

/** Coleções que o painel inicial carrega. */
export const RECURSOS_PAINEL = [
  'consultas',
  'vacinas',
  'cirurgias',
  'banhos',
  'visitas',
  'emergencias',
  'alarmes',
  'animais',
]

const ABERTOS = ['Agendado', 'Pendente', 'Em atendimento', 'Em andamento']
const CONCLUIDOS = ['Concluído', 'Concluída', 'Aplicada', 'Alta médica']
const AGENDA = ['consultas', 'vacinas', 'cirurgias', 'banhos', 'visitas', 'emergencias']

/** Cor de cada serviço (mesmos tons dos cartões da agenda). */
export const TOM_SERVICO = {
  Consulta: 'ceu',
  Vacina: 'salvia',
  Cirurgia: 'lavanda',
  'Banho e tosa': 'mel',
  'Visita de pet sitter': 'rosa',
  Emergência: 'terracota',
}

export function saudacao(hora) {
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const isoDe = (d) => toIsoDate(d)

/**
 * Tudo o que o painel mostra, calculado dos dados já carregados.
 * estoque: lista de /api/estoque (ou null enquanto carrega).
 */
export function montarPainel(data, lookup, estoque, agora = new Date()) {
  const hoje = todayIso()
  const horaAgora = agora.toTimeString().slice(0, 5)
  const linha = todaysTimeline(data, lookup)
  const abertosHoje = linha.filter((i) => ABERTOS.includes(i.status))
  const emergenciasAtivas = data.emergencias.filter((e) => e.status === 'Em atendimento')

  // Próximos 7 dias, para o gráfico da semana.
  const semana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(agora)
    dia.setDate(agora.getDate() + i)
    const iso = isoDe(dia)
    const total = AGENDA.reduce((soma, rec) => soma + data[rec].filter((r) => r.data === iso).length, 0)
    return {
      iso,
      rotulo: i === 0 ? 'Hoje' : dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dia: dia.getDate(),
      total,
    }
  })

  const repor = (estoque ?? []).filter((i) => i.situacao === 'Zerado' || i.situacao === 'Baixo')
  const validade = (estoque ?? []).filter((i) => i.situacao === 'Vencido' || i.situacao === 'Vencendo')
  const atencaoEstoque = (estoque ?? [])
    .filter((i) => i.situacao !== 'Normal')
    .sort((a, b) => ordemSituacao(a.situacao) - ordemSituacao(b.situacao))

  const alarmesAtivos = data.alarmes.filter((a) => a.ativo)
  // Próximo toque de cada alarme, com as mesmas regras do ESP32 e do app (semanal, a cada 8 h, uma vez...).
  const proximosAlarmes = alarmesAtivos
    .map((a) => ({ alarme: a, quando: proximoToque(a, agora) }))
    .filter((x) => x.quando)
    .sort((x, y) => x.quando - y.quando)
    .slice(0, 4)
    .map(({ alarme, quando }) => {
      const [dia, hora] = textoDoToque(quando, agora).split(' às ')
      return { ...alarme, hora, dia, pet: lookup.pet(alarme.petId)?.nome ?? alarme.petNome ?? '' }
    })

  const adocao = {
    disponiveis: data.animais.filter((a) => a.status === 'Disponível').length,
    emProcesso: data.animais.filter((a) => a.status === 'Em processo').length,
  }

  return {
    hoje,
    linha,
    proximo: abertosHoje.find((i) => i.hora >= horaAgora) ?? null,
    indicadores: [
      {
        id: 'agenda',
        valor: linha.length,
        rotulo: linha.length === 1 ? 'atendimento hoje' : 'atendimentos hoje',
        apoio: `${linha.filter((i) => CONCLUIDOS.includes(i.status)).length} concluídos · ${abertosHoje.length} em aberto`,
        to: '/agenda',
        tom: 'ceu',
      },
      {
        id: 'emergencias',
        valor: emergenciasAtivas.length,
        rotulo: emergenciasAtivas.length === 1 ? 'emergência em atendimento' : 'emergências em atendimento',
        apoio: emergenciasAtivas.length
          ? `Prioridade mais alta: ${maiorPrioridade(emergenciasAtivas)}`
          : 'Nenhum caso em andamento',
        to: '/agenda/emergencias',
        tom: 'terracota',
      },
      {
        id: 'pacientes',
        valor: data.pets.length,
        rotulo: data.pets.length === 1 ? 'paciente cadastrado' : 'pacientes cadastrados',
        apoio: `${data.tutores.length} ${data.tutores.length === 1 ? 'tutor' : 'tutores'}`,
        to: '/pacientes',
        tom: 'salvia',
      },
      {
        id: 'estoque',
        valor: estoque ? repor.length : '–',
        rotulo: repor.length === 1 ? 'item para repor' : 'itens para repor',
        apoio: estoque ? `${validade.length} com validade perto ou vencida` : 'Carregando estoque…',
        to: '/calculadoras/medicamentos',
        tom: 'mel',
      },
    ],
    semana,
    maxSemana: Math.max(1, ...semana.map((d) => d.total)),
    atencaoEstoque,
    proximosAlarmes,
    alarmesAtivos: alarmesAtivos.length,
    adocao,
  }
}

const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa']
function maiorPrioridade(emergencias) {
  return PRIORIDADES.find((p) => emergencias.some((e) => e.prioridade === p)) ?? 'não informada'
}

function ordemSituacao(s) {
  return ['Vencido', 'Zerado', 'Baixo', 'Vencendo'].indexOf(s)
}
