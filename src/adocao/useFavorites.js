import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'pawtinhas:favoritos'
const ID_RE = /^[a-z0-9-]{1,64}$/i

/** Favoritos do visitante, só neste aparelho (não exige login), como o useFavorites do site. */
const ouvintes = new Set()
let memoria = null

function limpar(lista) {
  return Array.isArray(lista) ? lista.filter((id) => typeof id === 'string' && ID_RE.test(id)).slice(0, 200) : []
}

async function ler() {
  if (memoria) return memoria
  try {
    memoria = limpar(JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]'))
  } catch {
    memoria = []
  }
  return memoria
}

export function useFavorites() {
  const [ids, setIds] = useState(memoria ?? [])

  useEffect(() => {
    let ativo = true
    ler().then((lista) => ativo && setIds(lista))
    ouvintes.add(setIds)
    return () => {
      ativo = false
      ouvintes.delete(setIds)
    }
  }, [])

  const toggle = useCallback((id) => {
    const atual = memoria ?? []
    const next = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    memoria = next
    ouvintes.forEach((ouvinte) => ouvinte(next))
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
      /* sem armazenamento: mantém só nesta sessão */
    })
  }, [])

  return { ids, isFavorite: (id) => ids.includes(id), toggle }
}
