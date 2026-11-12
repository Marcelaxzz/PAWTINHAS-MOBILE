// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/** Abas das telas de prótese 3D. O paciente escolhido (?pet=) acompanha a troca de aba. */
export const proteseTabs = (query = '') => [
  { to: `/protese-3d${query}`, label: 'Medição' },
  { to: `/protese-3d/modelo${query}`, label: 'Modelo 3D' },
  { to: `/protese-3d/como-funciona${query}`, label: 'Como funciona' },
  { to: `/protese-3d/suporte${query}`, label: 'Suporte' },
]
