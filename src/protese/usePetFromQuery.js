import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { dataService } from '../web/services/dataService.js'

/** Lê ?pet=ID e carrega o paciente correspondente (se existir). query repete o ?pet= para os links. */
export function usePetFromQuery() {
  const params = useLocalSearchParams()
  const petId = typeof params.pet === 'string' && params.pet ? params.pet : null
  const [state, setState] = useState({ petId: null, pet: null })

  useEffect(() => {
    if (!petId) return undefined
    let active = true
    dataService
      .get('pets', petId)
      .then((pet) => active && setState({ petId, pet }))
      .catch(() => active && setState({ petId, pet: null }))
    return () => {
      active = false
    }
  }, [petId])

  const query = petId ? `?pet=${encodeURIComponent(petId)}` : ''
  return { petId, pet: state.petId === petId ? state.pet : null, query }
}
