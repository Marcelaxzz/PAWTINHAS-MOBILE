// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Tradução entre o formato usado pelas telas e os contratos da API (Pawtinhas-Back).
 *
 * As telas trabalham com ids em texto, data e hora separadas e nomes em português do dia a dia
 * (petId, tutorId, nome, peso "12,5"). A API usa ids numéricos, dataHora, animalId, responsavelId,
 * nomeCompleto, pesoKg. Cada recurso diz o endpoint, como ler (`de`), como enviar (`para`) e como
 * renomear os campos dos erros de validação (`campos`, da API para a tela).
 */

const idTexto = (v) => (v === null || v === undefined || v === '' ? null : String(v))
const idNumero = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const numero = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n =
    typeof v === 'number'
      ? v
      : Number(
          String(v)
            .replace(/\s*kg$/i, '')
            .replace(',', '.'),
        )
  return Number.isFinite(n) ? n : null
}
const pesoTexto = (kg) => (kg === null || kg === undefined ? '' : String(Math.round(kg * 100) / 100).replace('.', ','))
const data = (iso) => (iso ? iso.slice(0, 10) : '')
const hora = (iso) => (iso ? iso.slice(11, 16) : '')
const horaCurta = (valor) => (valor ? valor.slice(0, 5) : '')
const horaCompleta = (valor) => (valor && valor.length === 5 ? `${valor}:00` : valor || null)
const dataHora = (d, h) => (d && h ? `${d}T${h}:00` : null)

const PORTES = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' }
const PORTE_API = { Pequeno: 'PEQUENO', Médio: 'MEDIO', Grande: 'GRANDE' }

/** Unidade de administração pela forma farmacêutica (a mesma regra da importação da API). */
const UNIDADE_DA_FORMA = {
  Comprimido: 'comprimido',
  Cápsula: 'cápsula',
  Gotas: 'gota',
  'Suspensão oral': 'mL',
  'Solução oral': 'mL',
  Injetável: 'mL',
}

// ---------- Agenda (/api/eventos) ----------

/** Campos comuns de todo compromisso; cada tipo acrescenta os seus em `extra`. */
function evento(tipo, { profissional, de: extraDe, para: extraPara, campos = {} }) {
  return {
    caminho: '/eventos',
    consulta: `?tipo=${tipo}`,
    de: (e) => ({
      id: String(e.id),
      petId: idTexto(e.animalId),
      tutorId: idTexto(e.responsavelId),
      foto: e.animalFotoUrl ?? null,
      data: data(e.dataHora),
      hora: hora(e.dataHora),
      status: e.status,
      observacoes: e.observacoes ?? '',
      [profissional]: idTexto(e.profissionalId),
      ...extraDe(e),
    }),
    para: (v) => ({
      tipoEvento: tipo,
      animalId: idNumero(v.petId),
      dataHora: dataHora(v.data, v.hora),
      profissionalId: idNumero(v[profissional]),
      status: v.status || null,
      observacoes: v.observacoes || null,
      ...extraPara(v),
    }),
    // Só o status mudou (marcar como concluído, aplicar vacina): rota própria.
    parcial: (id, mudancas) =>
      Object.keys(mudancas).length === 1 && 'status' in mudancas
        ? { metodo: 'PATCH', caminho: `/eventos/${id}/status`, corpo: { status: mudancas.status } }
        : null,
    campos: { animalId: 'petId', dataHora: 'data', profissionalId: profissional, ...campos },
  }
}

export const ADAPTADORES = {
  pets: {
    caminho: '/animals',
    de: (a) => ({
      id: String(a.id),
      nome: a.nome,
      especie: a.especie ?? '',
      raca: a.raca ?? '',
      sexo: a.sexo,
      dataNascimento: data(a.dataNascimento),
      idade: a.idade ?? '',
      peso: pesoTexto(a.pesoKg),
      pesoKg: a.pesoKg,
      tutorId: idTexto(a.responsavelId),
      tutorNome: a.responsavelNome ?? '',
      foto: a.fotoUrl ?? null,
      observacoes: a.observacoes ?? '',
      criadoEm: data(a.criadoEm),
    }),
    para: (v) => ({
      responsavelId: idNumero(v.tutorId),
      nome: v.nome,
      especie: v.especie,
      raca: v.raca || null,
      sexo: v.sexo,
      dataNascimento: v.dataNascimento || null,
      pesoKg: numero(v.peso),
      observacoes: v.observacoes || null,
      fotoUrl: v.foto || null,
    }),
    campos: { responsavelId: 'tutorId', pesoKg: 'peso', fotoUrl: 'foto' },
  },

  tutores: {
    caminho: '/responsaveis',
    de: (r) => ({
      id: String(r.id),
      nome: r.nomeCompleto,
      telefone: r.telefone,
      cpf: r.cpf ?? '',
      email: r.email ?? '',
      cep: r.cep ?? '',
      endereco: r.endereco ?? '',
      cidade: r.cidade ?? '',
      uf: r.uf ?? '',
      quantidadeAnimais: r.quantidadeAnimais ?? 0,
    }),
    para: (v) => ({
      nomeCompleto: v.nome,
      telefone: v.telefone,
      cpf: v.cpf || null,
      email: v.email || null,
      cep: v.cep || null,
      endereco: v.endereco || null,
      cidade: v.cidade || null,
      uf: v.uf || null,
    }),
    campos: { nomeCompleto: 'nome' },
  },

  profissionais: {
    caminho: '/profissionais',
    de: (p) => ({ ...p, id: String(p.id), email: p.email ?? '' }),
    para: (v) => ({ nome: v.nome, funcao: v.funcao, email: v.email || null }),
  },

  consultas: evento('consulta', {
    profissional: 'veterinarioId',
    de: (e) => ({ motivo: e.motivo ?? '' }),
    para: (v) => ({ motivo: v.motivo }),
  }),

  vacinas: evento('vacina', {
    profissional: 'profissionalId',
    de: (e) => ({ nome: e.nomeVacina ?? '', dose: e.dose ?? '', aplicadaEm: e.aplicadaEm ?? null }),
    para: (v) => ({ nomeVacina: v.nome, dose: v.dose }),
    campos: { nomeVacina: 'nome' },
  }),

  cirurgias: evento('cirurgia', {
    profissional: 'cirurgiaoId',
    de: (e) => ({ procedimento: e.procedimento ?? '' }),
    para: (v) => ({ procedimento: v.procedimento }),
  }),

  banhos: evento('banhotosa', {
    profissional: 'profissionalId',
    de: (e) => ({ servico: e.tipoServico ?? '' }),
    para: (v) => ({ tipoServico: v.servico }),
    campos: { tipoServico: 'servico' },
  }),

  visitas: (() => {
    const base = evento('petsitter', {
      profissional: 'cuidadorId',
      de: (e) => ({
        dataInicio: data(e.dataHora),
        dataFim: data(e.dataHoraFim),
        endereco: e.local ?? '',
        servico: e.servico ?? '',
        periodo: e.periodo ?? '',
      }),
      para: (v) => ({
        dataHora: dataHora(v.dataInicio, v.hora),
        dataHoraFim: dataHora(v.dataFim, v.hora),
        local: v.endereco,
        servico: v.servico,
        periodo: v.periodo,
      }),
      campos: { local: 'endereco', dataHoraFim: 'dataFim' },
    })
    return { ...base, campos: { ...base.campos, dataHora: 'dataInicio' } }
  })(),

  emergencias: evento('emergencia', {
    profissional: 'profissionalId',
    de: (e) => ({ motivo: e.motivo ?? '', prioridade: e.prioridade ?? '', petNome: e.descricaoAnimal ?? '' }),
    para: (v) => ({ motivo: v.motivo, prioridade: v.prioridade, descricaoAnimal: v.petId ? null : v.petNome }),
    campos: { descricaoAnimal: 'petNome', dataHora: 'entrada' },
  }),

  // ---------- Alarmes (ESP32, app e navegador) ----------

  alarmes: {
    caminho: '/alarmes',
    de: (a) => ({
      id: String(a.id),
      nome: a.nome,
      petId: idTexto(a.animalId),
      foto: a.animalFotoUrl ?? null,
      descricao: a.descricao ?? '',
      hora: horaCurta(a.hora),
      recorrencia: a.recorrencia,
      inicio: a.inicio ?? '',
      petNome: a.animalNome ?? '',
      ativo: a.ativo,
    }),
    para: (v) => ({
      nome: v.nome,
      animalId: idNumero(v.petId),
      descricao: v.descricao || null,
      hora: horaCompleta(v.hora),
      recorrencia: v.recorrencia,
      inicio: v.inicio || null,
      ativo: Boolean(v.ativo),
    }),
    parcial: (id, mudancas) =>
      Object.keys(mudancas).length === 1 && 'ativo' in mudancas
        ? { metodo: 'PATCH', caminho: `/alarmes/${id}/ativo`, corpo: { ativo: Boolean(mudancas.ativo) } }
        : null,
    campos: { animalId: 'petId' },
  },

  historicoAlarmes: {
    caminho: '/alarmes/historico',
    somenteLeitura: true,
    de: (d) => ({
      id: String(d.id),
      alarmeId: idTexto(d.alarmeId),
      nome: d.nome,
      quando: d.quando,
      resultado: d.resultado,
    }),
  },

  // ---------- Vitrine de adoção ----------

  animais: {
    caminho: '/adocao',
    de: (a) => ({
      id: String(a.id),
      nome: a.nome,
      especie: a.especie ?? '',
      sexo: a.sexo,
      raca: a.raca ?? '',
      dataNascimento: data(a.dataNascimento),
      idade: a.idade ?? '',
      fase: a.fase ?? '',
      porte: PORTES[a.porte] ?? '',
      peso: pesoTexto(a.pesoKg),
      cidade: a.localizacao ?? '',
      status: a.situacao,
      foto: a.fotoUrl ?? null,
      dataEntrada: a.dataEntrada,
      descricao: a.descricao,
      frase: a.frase,
      sobre: a.sobre,
      personalidade: a.tracos,
      infoAdicional: a.infoAdicional,
      necessidades: a.necessidades,
      conviveAnimais: a.conviveAnimais,
      conviveCriancas: a.conviveCriancas,
      vacinado: a.vacinado,
      castrado: a.castrado,
    }),
    para: (v) => ({
      nome: v.nome,
      especie: v.especie,
      sexo: v.sexo,
      raca: v.raca || null,
      dataNascimento: v.dataNascimento || null,
      porte: PORTE_API[v.porte] ?? null,
      pesoKg: numero(v.peso),
      localizacao: v.cidade || null,
      situacao: v.status,
      fotoUrl: v.foto || null,
      dataEntrada: v.dataEntrada || null,
      descricao: v.descricao,
      frase: v.frase || null,
      sobre: v.sobre || null,
      tracos: v.personalidade || null,
      infoAdicional: v.infoAdicional || null,
      necessidades: v.necessidades || null,
      conviveAnimais: Boolean(v.conviveAnimais),
      conviveCriancas: Boolean(v.conviveCriancas),
      vacinado: Boolean(v.vacinado),
      castrado: Boolean(v.castrado),
    }),
    campos: { localizacao: 'cidade', situacao: 'status', tracos: 'personalidade', pesoKg: 'peso', fotoUrl: 'foto' },
  },

  // ---------- Prótese 3D ----------

  medicoes: {
    caminho: '/medicoes',
    de: (m) => ({ ...m, id: String(m.id), petId: String(m.animalId) }),
    para: (v) => ({
      animalId: idNumero(v.petId),
      membro: v.membro || null,
      comprimentoMembro: numero(v.comprimentoMembro),
      alturaChao: numero(v.alturaChao),
      larguraPata: numero(v.larguraPata),
      larguraEncaixe: numero(v.larguraEncaixe),
      metodo: v.metodo || null,
      leituras: v.leituras ?? 1,
      criadoEm: v.criadoEm || null,
    }),
    campos: { animalId: 'petId' },
  },

  // ---------- Catálogos e cálculos ----------

  medicamentos: {
    caminho: '/medicamentos',
    de: (m) => ({ ...m, id: String(m.id) }),
    para: (v) => ({
      nome: v.nome,
      principioAtivo: v.principioAtivo,
      forma: v.forma,
      unidade: v.unidade || UNIDADE_DA_FORMA[v.forma] || null,
      concentracao: numero(v.concentracao),
      fracionavel: Boolean(v.fracionavel),
      via: v.via || null,
      doseMinCao: numero(v.doseMinCao),
      doseMaxCao: numero(v.doseMaxCao),
      doseMinGato: numero(v.doseMinGato),
      doseMaxGato: numero(v.doseMaxGato),
      doseMaximaMg: numero(v.doseMaximaMg),
      intervaloPadraoHoras: idNumero(v.intervaloPadraoHoras),
      observacoes: v.observacoes || null,
      fonte: v.fonte || null,
    }),
  },

  racoes: {
    caminho: '/racoes',
    de: (r) => ({ ...r, id: String(r.id), foto: r.fotoUrl ?? null }),
    para: (v) => ({
      nome: v.nome,
      especie: v.especie,
      fase: v.fase,
      tipo: v.tipo,
      kcalPorKg: numero(v.kcalPorKg),
      observacoes: v.observacoes || null,
      fotoUrl: v.foto || null,
    }),
    campos: { fotoUrl: 'foto' },
  },

  materiais: {
    caminho: '/materiais',
    de: (m) => ({ ...m, id: String(m.id) }),
    para: (v) => ({
      nome: v.nome,
      tipo: v.tipo,
      unidade: v.unidade,
      especificacao: v.especificacao || null,
      observacoes: v.observacoes || null,
    }),
  },

  prescricoes: {
    caminho: '/prescricoes',
    de: (p) => ({
      ...p,
      id: String(p.id),
      petId: String(p.animalId),
      medicamentoId: idTexto(p.medicamentoId),
      alarmeId: idTexto(p.alarmeId),
      horaPrimeiraDose: horaCurta(p.horaPrimeiraDose),
    }),
    para: (v) => paraCalculoDose(v),
    // Prescrição salva só muda status e observações: a dose não é recalculada depois.
    parcial: (id, mudancas) => ({
      metodo: 'PATCH',
      caminho: `/prescricoes/${id}`,
      corpo: { status: mudancas.status ?? null, observacoes: mudancas.observacoes ?? null },
    }),
    campos: { animalId: 'petId' },
  },

  planosAlimentares: {
    caminho: '/planos-alimentares',
    de: (p) => ({ ...p, id: String(p.id), petId: String(p.animalId), racaoId: idTexto(p.racaoId) }),
    para: (v) => paraCalculoAlimentacao(v),
    campos: { animalId: 'petId' },
  },

  configuracoes: {
    caminho: '/configuracoes',
    unico: true,
    de: (c) => ({ ...c, id: String(c.id) }),
    para: (v) => ({ id: Number(v.id), clinica: v.clinica, notificacoes: v.notificacoes, integracoes: v.integracoes }),
    campos: { nome: 'clinica.nome', cnpj: 'clinica.cnpj' },
  },
}

/** Dados da tela de dose para a API (simulação e prescrição). */
export function paraCalculoDose(v) {
  return {
    ...v,
    animalId: idNumero(v.petId),
    petId: undefined,
    medicamentoId: idNumero(v.medicamentoId),
    horaPrimeiraDose: horaCompleta(v.horaPrimeiraDose),
  }
}

/** Dados da tela de alimentação para a API (simulação e plano). */
export function paraCalculoAlimentacao(v) {
  return { ...v, animalId: idNumero(v.petId), petId: undefined, racaoId: idNumero(v.racaoId) }
}

/** Renomeia os campos de um erro de validação da API para os nomes usados pela tela. */
export function camposDaTela(fields, mapa = {}) {
  if (!fields) return fields
  return Object.fromEntries(Object.entries(fields).map(([campo, mensagem]) => [mapa[campo] ?? campo, mensagem]))
}
