// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { ApiError, request } from './http.js'
import { pickFields } from './resources.js'
import { ADAPTADORES, camposDaTela } from './adaptadores.js'
import { ehFotoNova, formularioDaFoto } from './arquivos.js'

function adaptador(recurso) {
  const a = ADAPTADORES[recurso]
  if (!a) throw new Error(`Recurso desconhecido: ${recurso}`)
  return a
}

const comId = (a, id) => `${a.caminho}/${encodeURIComponent(id)}`

/** Erros de validação voltam com os nomes de campo da tela (petId em vez de animalId...). */
async function traduzindoErros(a, operacao) {
  try {
    return await operacao()
  } catch (erro) {
    if (erro instanceof ApiError && erro.fields) {
      throw new ApiError(erro.message, { ...erro, fields: camposDaTela(erro.fields, a.campos) })
    }
    throw erro
  }
}

/** Envia uma foto escolhida na hora à API; devolve a URL dela. */
async function enviarFoto(foto) {
  const { url } = await request('/arquivos', { method: 'POST', body: formularioDaFoto(foto) })
  return url
}

async function prepararFoto(dados) {
  return ehFotoNova(dados.foto) ? { ...dados, foto: await enviarFoto(dados.foto) } : dados
}

/** CRUD dos recursos da clínica, já no formato das telas (pets, consultas, alarmes, adoção...). */
export const dataService = {
  async list(recurso) {
    const a = adaptador(recurso)
    const resposta = await request(a.caminho + (a.consulta ?? ''))
    return a.unico ? [a.de(resposta)] : resposta.map(a.de)
  },

  async get(recurso, id) {
    const a = adaptador(recurso)
    return a.de(await request(a.unico ? a.caminho : comId(a, id)))
  },

  async create(recurso, dados) {
    const a = adaptador(recurso)
    const valores = await prepararFoto(pickFields(recurso, dados))
    return traduzindoErros(a, async () => a.de(await request(a.caminho, { method: 'POST', body: a.para(valores) })))
  },

  /** Envie só os campos alterados: o restante vem do registro atual. */
  async update(recurso, id, mudancas) {
    const a = adaptador(recurso)
    const alteracoes = await prepararFoto(pickFields(recurso, mudancas))

    return traduzindoErros(a, async () => {
      const parcial = a.parcial?.(encodeURIComponent(id), alteracoes)
      if (parcial) return a.de(await request(parcial.caminho, { method: parcial.metodo, body: parcial.corpo }))

      const atual = await this.get(recurso, id)
      const corpo = a.para({ ...atual, ...alteracoes })
      return a.de(await request(a.unico ? a.caminho : comId(a, id), { method: 'PUT', body: corpo }))
    })
  },

  remove: (recurso, id) => request(comId(adaptador(recurso), id), { method: 'DELETE' }),
}
