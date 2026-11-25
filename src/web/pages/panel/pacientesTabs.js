// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { dataService } from '../../services/dataService.js'

/** Abas compartilhadas por Pacientes e Tutores (com quantos há de cada). */
export const PACIENTES_TABS = Object.assign(
  [
    { to: '/pacientes', label: 'Pacientes' },
    { to: '/pacientes/tutores', label: 'Tutores' },
  ],
  {
    chaveContagem: 'pacientes',
    async contar() {
      const [pets, tutores] = await Promise.all([dataService.list('pets'), dataService.list('tutores')])
      return { '/pacientes': pets.length, '/pacientes/tutores': tutores.length }
    },
  },
)
