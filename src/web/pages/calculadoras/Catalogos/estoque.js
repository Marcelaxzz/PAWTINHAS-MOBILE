// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useCallback, useEffect, useState } from 'react'
import { estoqueService } from '../../../services/gestaoService.js'
import { formatNumber } from '../../../utils/numbers.js'

/** Situação do item no estoque → tom do chip e texto curto. */
export const SITUACOES = {
  Zerado: { tom: 'perigo', texto: 'Sem estoque' },
  Vencido: { tom: 'perigo', texto: 'Lote vencido' },
  Baixo: { tom: 'alerta', texto: 'Estoque baixo' },
  Vencendo: { tom: 'alerta', texto: 'Vence em breve' },
  Normal: { tom: 'sucesso', texto: 'Em dia' },
}

export const FILTROS_ESTOQUE = [
  { id: 'todos', label: 'Todos', test: () => true },
  { id: 'repor', label: 'Para repor', test: (i) => i?.situacao === 'Zerado' || i?.situacao === 'Baixo' },
  { id: 'validade', label: 'Validade', test: (i) => i?.situacao === 'Vencido' || i?.situacao === 'Vencendo' },
  { id: 'emDia', label: 'Em dia', test: (i) => i?.situacao === 'Normal' },
]

/** Tipos e unidades aceitos pela API no catálogo de materiais. */
export const TIPOS_MATERIAL = ['Curativo', 'Fluidoterapia', 'Cirúrgico', 'Descartável', 'Antissepsia']
export const UNIDADES_MATERIAL = ['unidade', 'pacote', 'caixa', 'frasco', 'bolsa', 'rolo', 'par', 'kit']

export const MOTIVOS = {
  entrada: ['Compra', 'Doação', 'Devolução', 'Ajuste de inventário'],
  saida: ['Uso em atendimento', 'Venda ao tutor', 'Perda ou avaria', 'Ajuste de inventário'],
}

/** "12 comprimidos", "2,5 kg". */
export const qtd = (n, unidade) => `${formatNumber(n, n % 1 ? 2 : 0)} ${unidade}`

/** Estoque de uma categoria (Medicamento | Racao), indexado pelo id do item no catálogo. */
export function useEstoque(categoria) {
  const [itens, setItens] = useState(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      const lista = await estoqueService.listar()
      setItens(Object.fromEntries(lista.filter((i) => i.categoria === categoria).map((i) => [String(i.itemId), i])))
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }, [categoria])

  useEffect(() => {
    // Primeira carga da tela; o setState acontece depois do await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar()
  }, [carregar])

  const atualizar = (item) => setItens((atual) => ({ ...atual, [String(item.itemId)]: item }))
  return { itens, erro, recarregar: carregar, atualizar }
}
