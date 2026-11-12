import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Page } from '../../../../componentes/Page.jsx'
import { InfoLine, PetCard } from '../../../../componentes/ui/PetCard.jsx'
import { Chip, StatusChip } from '../../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState, SummaryBar } from '../../../../componentes/ui/Basicos.jsx'
import { RecordDialog, ReportDialog } from '../../../../componentes/ui/RecordDialog.jsx'
import { BuscaFiltro, Filtros, SelectFiltro } from '../../../../componentes/Filtros.jsx'
import { listas } from '../../../../componentes/listas.js'
import { useClinic } from '../../../../web/hooks/useClinic.js'
import { useRecordActions } from '../../../../web/hooks/useRecordActions.js'
import { formatDateBr, relativeDayLabel } from '../../../../web/utils/dates.js'
import { normalize } from '../../../../web/utils/text.js'
import { AGENDA_TABS } from '../../../../web/pages/panel/agendaTabs.js'
import { relatoriosService } from '../../../../web/services/gestaoService.js'

const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica']
const STATUS = ['Em atendimento', 'Estabilizado', 'Alta médica']
const PESO = { 'Em atendimento': 0, Estabilizado: 1, 'Alta médica': 2 }

function entryLabel(e) {
  const day = relativeDayLabel(e.data)
  return day === 'Hoje' ? e.hora : `${day.toLowerCase()} ${e.hora}`
}

export default function Emergencias() {
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(['emergencias'])
  const { update, remove } = useRecordActions('emergencias', patchLocal)
  const [busca, setBusca] = useState('')
  const [gravidade, setGravidade] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)

  const all = useMemo(
    () =>
      data
        ? [...data.emergencias].sort(
            (a, b) => PESO[a.status] - PESO[b.status] || `${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`),
          )
        : [],
    [data],
  )

  const filtered = all.filter((e) => {
    const termo = normalize(busca)
    const petNome = lookup.pet(e.petId)?.nome ?? e.petNome
    const tutor = lookup.tutor(e.tutorId)?.nome ?? ''
    const okBusca = !termo || normalize(`${petNome} ${tutor}`).includes(termo)
    return okBusca && (!gravidade || e.prioridade === gravidade)
  })

  const count = (status) => all.filter((e) => e.status === status).length
  const selected = data?.emergencias.find((e) => e.id === selectedId)
  const petName = (e) => lookup.pet(e.petId)?.nome || e.petNome || 'Pet não cadastrado'

  return (
    <Page
      title="Emergências"
      subtitle="Atendimentos de urgência em andamento e recentes."
      tabs={AGENDA_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          <Filtros>
            <BuscaFiltro value={busca} onChange={setBusca} placeholder="Filtrar por nome do pet ou tutor..." />
            <SelectFiltro
              titulo="Gravidade"
              value={gravidade}
              onChange={setGravidade}
              options={[
                { value: '', label: 'Gravidade: Todos' },
                ...PRIORIDADES.map((p) => ({ value: p, label: `Gravidade: ${p}` })),
              ]}
            />
            <PillButton style={{ flexBasis: '100%' }} to="/agenda/emergencias/nova">
              + Registrar emergência
            </PillButton>
          </Filtros>

          {filtered.length === 0 ? (
            <EmptyState title={all.length ? 'Nenhum resultado' : 'Nenhuma emergência registrada'}>
              {all.length ? 'Tente outro nome ou gravidade.' : 'Que bom! Nenhum pawtinha em emergência.'}
            </EmptyState>
          ) : (
            <View style={listas.lista}>
              {filtered.map((e) => {
                const pet = lookup.pet(e.petId)
                return (
                  <PetCard
                    key={e.id}
                    photo={lookup.photoOf(e)}
                    title={petName(e)}
                    badges={
                      <>
                        {pet?.raca ? <Chip size="sm">{pet.raca}</Chip> : null}
                        <StatusChip status={e.status} />
                      </>
                    }
                    actions={
                      <PillButton size="lg" onPress={() => setSelectedId(e.id)}>
                        Detalhes
                      </PillButton>
                    }
                  >
                    <InfoLine label="Caso:">{e.motivo}</InfoLine>
                    <InfoLine label="Tutor(a):">{lookup.tutor(e.tutorId)?.nome ?? 'Não informado'}</InfoLine>
                    <InfoLine label="Entrada:" tone="cafe">
                      {entryLabel(e)}
                    </InfoLine>
                  </PetCard>
                )
              })}
            </View>
          )}

          <SummaryBar
            actions={
              <PillButton variant="contorno" onPress={() => setReportOpen(true)}>
                Relatório
              </PillButton>
            }
          >
            Resumo: {count('Em atendimento')} {count('Em atendimento') === 1 ? 'emergência' : 'emergências'} em
            atendimento, {count('Estabilizado')} {count('Estabilizado') === 1 ? 'estabilizada' : 'estabilizadas'},{' '}
            {count('Alta médica')} com alta médica.
          </SummaryBar>

          {selected && (
            <RecordDialog
              open={Boolean(selectedId)}
              eventoId={selectedId}
              onClose={() => setSelectedId(null)}
              title={petName(selected)}
              subtitle={`Caso: ${selected.motivo}`}
              photo={lookup.photoOf(selected)}
              status={selected.status}
              statusOptions={STATUS}
              onStatusChange={(status) => update(selected.id, { status }, 'Status da emergência atualizado.')}
              onDelete={async () => {
                await remove(selected.id, 'Registro de emergência excluído.')
                setSelectedId(null)
              }}
              editTo={`/agenda/emergencias/${selected.id}/editar`}
              deleteLabel="Excluir registro"
              rows={[
                { label: 'Entrada', value: `${formatDateBr(selected.data)} às ${selected.hora}` },
                { label: 'Prioridade', value: selected.prioridade },
                { label: 'Profissional responsável', value: lookup.staff(selected.profissionalId)?.nome },
                { label: 'Tutor(a)', value: lookup.tutor(selected.tutorId)?.nome },
                { label: 'Telefone do tutor', value: lookup.tutor(selected.tutorId)?.telefone },
                { label: 'Observações de triagem', value: selected.observacoes || 'Sem observações.' },
              ]}
            />
          )}

          <ReportDialog
            open={reportOpen}
            pdf={(p) => relatoriosService.pdfAgenda({ ...p, tipo: 'Emergencia' })}
            onClose={() => setReportOpen(false)}
            title="Relatório de emergências"
            stats={STATUS.map((s) => ({ label: s, value: count(s) }))}
            items={all.map((e) => ({
              id: e.id,
              when: `${formatDateBr(e.data).slice(0, 5)} ${e.hora}`,
              title: `${petName(e)} · ${e.prioridade}`,
              detail: e.motivo,
              status: e.status,
            }))}
          />
        </>
      )}
    </Page>
  )
}
