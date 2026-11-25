// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { dataService } from '../../services/dataService.js'
import { contagemDeHoje } from '../../utils/agenda.js'

const RECURSOS = ['consultas', 'vacinas', 'cirurgias', 'banhos', 'visitas', 'emergencias']

/** Abas compartilhadas pelas telas da Agenda (o número é o de atendimentos de hoje). */
export const AGENDA_TABS = Object.assign(
  [
    { to: '/agenda', label: 'Visão geral' },
    { to: '/agenda/consultas-vacinas', label: 'Consultas e vacinas' },
    { to: '/agenda/cirurgias', label: 'Cirurgias' },
    { to: '/agenda/banho-tosa', label: 'Banho e tosa' },
    { to: '/agenda/pet-sitter', label: 'Pet sitter' },
    { to: '/agenda/emergencias', label: 'Emergências', alerta: true },
  ],
  {
    chaveContagem: 'agenda',
    async contar() {
      const listas = await Promise.all(RECURSOS.map((r) => dataService.list(r)))
      const c = contagemDeHoje(Object.fromEntries(RECURSOS.map((r, i) => [r, listas[i]])))
      return {
        '/agenda': c.total,
        '/agenda/consultas-vacinas': c.consultasVacinas,
        '/agenda/cirurgias': c.cirurgias,
        '/agenda/banho-tosa': c.banhos,
        '/agenda/pet-sitter': c.visitas,
        '/agenda/emergencias': c.emergencias,
      }
    },
  },
)
