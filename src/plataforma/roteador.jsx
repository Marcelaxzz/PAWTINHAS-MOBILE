import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'

/**
 * O pouco do react-router-dom que as telas copiadas do site usam, sobre o expo-router.
 * "#secao" vira "?secao=" (o app não tem âncoras).
 */
export const rotaDoApp = (to) =>
  typeof to === 'string' ? to.replace(/#(\w+)$/, (_, s) => `${to.includes('?') ? '&' : '?'}secao=${s}`) : to

export function useParams() {
  const params = useLocalSearchParams()
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
}

export function useSearchParams() {
  const params = useParams()
  return [{ get: (nome) => params[nome] ?? null }]
}

export function useNavigate() {
  const router = useRouter()
  return (to, { replace = false } = {}) => {
    if (to === -1) return router.canGoBack() ? router.back() : undefined
    return replace ? router.replace(rotaDoApp(to)) : router.push(rotaDoApp(to))
  }
}

export function Navigate({ to }) {
  return <Redirect href={rotaDoApp(to)} />
}
