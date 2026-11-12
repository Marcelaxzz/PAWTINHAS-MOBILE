// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useMemo } from 'react'
import { indexById, useCollections } from './useCollections.js'
import { photoSrc } from '../utils/images.js'

const BASE = ['pets', 'tutores', 'profissionais']

/**
 * Carrega as coleções pedidas + pets, tutores e profissionais,
 * e expõe funções para resolver nomes e fotos a partir dos ids.
 */
export function useClinic(resources = []) {
  const all = [...new Set([...BASE, ...resources])]
  const result = useCollections(all)
  const { data } = result

  const lookup = useMemo(() => {
    const pets = indexById(data?.pets)
    const tutores = indexById(data?.tutores)
    const staff = indexById(data?.profissionais)
    return {
      pet: (id) => pets[id],
      tutor: (id) => tutores[id],
      staff: (id) => staff[id],
      petPhoto: (id) => photoSrc(pets[id]?.foto),
      /** Foto de um agendamento: a da própria tela, se houver; senão, a do paciente. */
      photoOf: (record) => photoSrc(record?.foto) ?? photoSrc(pets[record?.petId]?.foto),
      tutorOfPet: (petId) => tutores[pets[petId]?.tutorId],
    }
  }, [data])

  return { ...result, lookup }
}
