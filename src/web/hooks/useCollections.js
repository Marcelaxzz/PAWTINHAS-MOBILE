// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useCallback, useEffect, useState } from 'react'
import { dataService } from '../services/dataService.js'

/**
 * Carrega uma ou mais coleções em paralelo.
 * const { data, loading, error, reload } = useCollections(['pets', 'tutores'])
 * data.pets, data.tutores…
 */
export function useCollections(resources) {
  const key = resources.join('|')
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    const names = key.split('|')
    Promise.all(names.map((name) => dataService.list(name)))
      .then((lists) => {
        if (!active) return
        setState({ data: Object.fromEntries(names.map((name, i) => [name, lists[i]])), loading: false, error: '' })
      })
      .catch((err) => {
        if (!active) return
        setState({ data: null, loading: false, error: err.message || 'Não foi possível carregar os dados.' })
      })
    return () => {
      active = false
    }
  }, [key, version])

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: prev.data === null, error: '' }))
    setVersion((v) => v + 1)
  }, [])

  /** Atualiza um item localmente após uma mutação, sem recarregar tudo. */
  const patchLocal = useCallback((resource, item, mode = 'upsert') => {
    setState((prev) => {
      if (!prev.data) return prev
      const list = prev.data[resource] ?? []
      let next
      if (mode === 'remove') next = list.filter((row) => row.id !== item.id)
      else if (list.some((row) => row.id === item.id)) next = list.map((row) => (row.id === item.id ? item : row))
      else next = [...list, item]
      return { ...prev, data: { ...prev.data, [resource]: next } }
    })
  }, [])

  return { ...state, reload, patchLocal }
}

/** Índices por id para resolver nomes (pet, tutor, profissional). */
export function indexById(list = []) {
  return Object.fromEntries(list.map((item) => [item.id, item]))
}
