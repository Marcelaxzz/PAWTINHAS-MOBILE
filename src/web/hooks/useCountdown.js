// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useCallback, useEffect, useState } from 'react'

/** Contagem regressiva em segundos baseada em horário absoluto (não atrasa com a aba em segundo plano). */
export function useCountdown(initialSeconds = 0) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + initialSeconds * 1000)
  const [remaining, setRemaining] = useState(initialSeconds)

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endsAt])

  const restart = useCallback((seconds) => setEndsAt(Date.now() + seconds * 1000), [])

  return [remaining, restart]
}
