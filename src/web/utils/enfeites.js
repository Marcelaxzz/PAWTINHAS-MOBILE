// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { addDaysIso, todayIso } from './dates.js'
import { normalize } from './text.js'

/** Cor de cada espécie (os mesmos pares de texto + fundo da paleta de apoio). */
const TOM_DA_ESPECIE = {
  cachorro: 'mel',
  cao: 'mel',
  gato: 'lavanda',
  coelho: 'salvia',
  hamster: 'salvia',
  calopsita: 'ceu',
  ave: 'ceu',
  passaro: 'ceu',
  periquito: 'ceu',
  papagaio: 'ceu',
  cavalo: 'terracota',
  boi: 'terracota',
}

export function tomDaEspecie(especie = '') {
  return TOM_DA_ESPECIE[normalize(especie)] ?? 'rosa'
}

/**
 * Aniversário de hoje até daqui a 7 dias.
 * Devolve null fora dessa janela (ou sem data de nascimento).
 */
export function aniversario(isoNascimento, agora = new Date()) {
  if (!isoNascimento || !/^\d{4}-\d{2}-\d{2}/.test(isoNascimento)) return null
  const [ano, mes, dia] = isoNascimento.slice(0, 10).split('-').map(Number)
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  let proximo = new Date(hoje.getFullYear(), mes - 1, dia)
  if (proximo < hoje) proximo = new Date(hoje.getFullYear() + 1, mes - 1, dia)
  const dias = Math.round((proximo - hoje) / 86400000)
  const anos = proximo.getFullYear() - ano
  if (anos < 1 || dias > 7) return null
  const idade = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return {
    hoje: dias === 0,
    dias,
    anos,
    texto: dias === 0 ? `Faz ${idade} hoje` : dias === 1 ? `Faz ${idade} amanhã` : `Faz ${idade} em ${dias} dias`,
  }
}

/** Chegou à adoção nos últimos 14 dias e ainda procura um lar. */
export function chegouHaPouco(animal) {
  const entrada = String(animal?.dataEntrada ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada) || animal.status === 'Adotado') return false
  return entrada >= addDaysIso(-14) && entrada <= todayIso()
}

/** Emoji da saudação: sol de manhã, sol entre nuvens à tarde e lua à noite. */
export function emojiDaHora(hora) {
  if (hora < 12) return '☀️'
  if (hora < 18) return '🌤️'
  return '🌙'
}
