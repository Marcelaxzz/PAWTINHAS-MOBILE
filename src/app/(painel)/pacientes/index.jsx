import { useMemo, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { InfoLine, PetCard } from '../../../componentes/ui/PetCard.jsx'
import { Chip } from '../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { Grade } from '../../../componentes/ui/Grade.jsx'
import { EmptyState, ErrorState, LoadingState, SummaryBar } from '../../../componentes/ui/Basicos.jsx'
import { ReportDialog } from '../../../componentes/ui/RecordDialog.jsx'
import { BuscaFiltro, Filtros, SelectFiltro } from '../../../componentes/Filtros.jsx'
import { Forte } from '../../../componentes/Texto.jsx'
import { listas } from '../../../componentes/listas.js'
import { useClinic } from '../../../web/hooks/useClinic.js'
import { normalize } from '../../../web/utils/text.js'
import { PACIENTES_TABS } from '../../../web/pages/panel/pacientesTabs.js'

export default function Pacientes() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { data, loading, error, reload, lookup } = useClinic()
  const [especie, setEspecie] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const busca = typeof params.busca === 'string' ? params.busca : ''

  const setBusca = (value) => router.setParams({ busca: value ? value.slice(0, 80) : undefined })

  const pets = useMemo(() => data?.pets ?? [], [data])
  const especies = useMemo(() => [...new Set(pets.map((p) => p.especie))].sort(), [pets])

  const filtered = pets.filter((pet) => {
    const termo = normalize(busca)
    const texto = normalize(`${pet.nome} ${pet.raca} ${lookup.tutor(pet.tutorId)?.nome ?? ''}`)
    return (!termo || texto.includes(termo)) && (!especie || pet.especie === especie)
  })

  return (
    <Page
      title="Pacientes"
      subtitle="Todos os pawtinhas atendidos pela clínica."
      tabs={PACIENTES_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          <Filtros>
            <BuscaFiltro
              value={busca}
              onChange={setBusca}
              placeholder="Filtrar por nome, raça ou tutor..."
              maxLength={80}
            />
            <SelectFiltro
              titulo="Espécie"
              value={especie}
              onChange={setEspecie}
              options={[
                { value: '', label: 'Espécie: Todos' },
                ...especies.map((e) => ({ value: e, label: `Espécie: ${e}` })),
              ]}
            />
            <PillButton style={{ flexBasis: '100%' }} to="/pacientes/novo">
              + Novo paciente
            </PillButton>
          </Filtros>

          {filtered.length === 0 ? (
            <EmptyState
              title={pets.length ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              action={!pets.length ? <PillButton to="/pacientes/novo">Cadastrar paciente</PillButton> : null}
            >
              {pets.length
                ? 'Confira o nome digitado ou limpe os filtros.'
                : 'Cadastre o primeiro pawtinha da clínica.'}
            </EmptyState>
          ) : (
            <Grade colunas={2} quebras={{ 900: 1 }} gap={16} style={listas.lista}>
              {filtered.map((pet) => (
                <PetCard
                  key={pet.id}
                  avatar={96}
                  photo={lookup.petPhoto(pet.id)}
                  title={pet.nome}
                  badges={pet.idade ? <Chip size="sm">{pet.idade}</Chip> : null}
                  actions={
                    <PillButton variant="contorno" size="lg" to={`/pacientes/${pet.id}`}>
                      Abrir ficha
                    </PillButton>
                  }
                >
                  <InfoLine label="Raça:">{pet.raca || '-'}</InfoLine>
                  <InfoLine label="Tutor(a):">{lookup.tutor(pet.tutorId)?.nome ?? '-'}</InfoLine>
                </PetCard>
              ))}
            </Grade>
          )}

          <SummaryBar
            actions={
              <PillButton variant="contorno" onPress={() => setReportOpen(true)}>
                Relatório
              </PillButton>
            }
          >
            <Forte>{pets.length}</Forte> {pets.length === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}.
          </SummaryBar>

          <ReportDialog
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            title="Relatório de pacientes"
            stats={[
              { label: 'Pacientes', value: pets.length },
              ...especies.map((e) => ({ label: `${e}s`, value: pets.filter((p) => p.especie === e).length })),
              { label: 'Tutores', value: new Set(pets.map((p) => p.tutorId)).size },
            ]}
            items={[...pets]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((p) => ({
                id: p.id,
                when: p.especie,
                title: p.nome,
                detail: `${p.raca} · ${p.idade} · Tutor(a): ${lookup.tutor(p.tutorId)?.nome ?? '-'}`,
              }))}
          />
        </>
      )}
    </Page>
  )
}
