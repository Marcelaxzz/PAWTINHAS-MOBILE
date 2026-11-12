// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useCallback } from 'react'
import { dataService } from '../services/dataService.js'
import { useToast } from './useToast.js'

/** Atualizar/excluir registros com aviso de sucesso ou erro e atualização local da lista. */
export function useRecordActions(resource, patchLocal) {
  const toast = useToast()

  const update = useCallback(
    async (id, changes, message = 'Alterações salvas.') => {
      try {
        const updated = await dataService.update(resource, id, changes)
        patchLocal(resource, updated)
        toast.success(message)
        return updated
      } catch (error) {
        toast.error(error.message)
        throw error
      }
    },
    [resource, patchLocal, toast],
  )

  const remove = useCallback(
    async (id, message = 'Registro excluído.') => {
      try {
        await dataService.remove(resource, id)
        patchLocal(resource, { id }, 'remove')
        toast.success(message)
      } catch (error) {
        toast.error(error.message)
        throw error
      }
    },
    [resource, patchLocal, toast],
  )

  return { update, remove }
}
