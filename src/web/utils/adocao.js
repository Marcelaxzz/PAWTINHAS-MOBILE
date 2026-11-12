// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
const FEMININO = { Gato: 'Gata', Cachorro: 'Cachorra', Coelho: 'Coelha' }

/** "Fêmea • Gata", "Macho • Cachorro", "Casal • Calopsita" */
export function sexoEspecie(animal) {
  const especie = animal.sexo === 'Fêmea' ? (FEMININO[animal.especie] ?? animal.especie) : animal.especie
  return `${animal.sexo} • ${especie}`
}

/** Filhote se a idade estiver em meses; caso contrário, adulto. */
export function faseDaIdade(idade = '') {
  return /m[eê]s/i.test(idade) ? 'Filhote' : 'Adulto'
}

export function faseDe(animal) {
  return animal.fase || faseDaIdade(animal.idade)
}

/** "Gata - Adulto" */
export function categoria(animal) {
  const especie = animal.sexo === 'Fêmea' ? (FEMININO[animal.especie] ?? animal.especie) : animal.especie
  return `${especie} - ${faseDe(animal)}`
}

export const FILTROS = [
  { id: 'todos', label: 'Todos', test: () => true },
  { id: 'cachorros', label: 'Cachorros', test: (a) => a.especie === 'Cachorro' },
  { id: 'gatos', label: 'Gatos', test: (a) => a.especie === 'Gato' },
  { id: 'filhotes', label: 'Filhotes', test: (a) => faseDe(a) === 'Filhote' },
  { id: 'adultos', label: 'Adultos', test: (a) => faseDe(a) === 'Adulto' },
  { id: 'machos', label: 'Machos', test: (a) => a.sexo === 'Macho' },
  { id: 'femeas', label: 'Fêmeas', test: (a) => a.sexo === 'Fêmea' },
]

/** Animais que aparecem na vitrine pública. */
export function visivelNoCatalogo(animal) {
  return animal.status === 'Disponível' || animal.status === 'Em processo'
}
