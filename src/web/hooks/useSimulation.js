// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useEffect, useState } from 'react'

/**
 * Recalcula no servidor enquanto o usuário digita (com espera de 350 ms e cancelamento
 * do pedido anterior). Sem `ready`, nada é enviado e o resultado fica vazio.
 * const { result, error, fields, loading } = useSimulation(clinicService.simularDose, payload, ready)
 */
export function useSimulation(run, payload, ready) {
  const key = ready ? JSON.stringify(payload) : ''
  const [state, setState] = useState({ key: '', result: null, error: '', fields: {} })

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      run(JSON.parse(key), controller.signal)
        .then((result) => setState({ key, result, error: '', fields: {} }))
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ key, result: null, error: err.message, fields: err.fields ?? {} })
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, run])

  const current = state.key === key && key ? state : null
  return {
    result: current?.result ?? null,
    error: current?.error ?? '',
    fields: current?.fields ?? {},
    loading: Boolean(key) && !current,
  }
}
