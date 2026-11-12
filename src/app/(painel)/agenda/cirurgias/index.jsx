import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Page } from '../../../../componentes/Page.jsx'
import { InfoLine, PetCard } from '../../../../componentes/ui/PetCard.jsx'
import { Chip } from '../../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState, SummaryBar } from '../../../../componentes/ui/Basicos.jsx'
import { RecordDialog, ReportDialog } from '../../../../componentes/ui/RecordDialog.jsx'
import { listas } from '../../../../componentes/listas.js'
import { useClinic } from '../../../../web/hooks/useClinic.js'
import { useRecordActions } from '../../../../web/hooks/useRecordActions.js'
import { compareSchedule, formatDateBr, relativeDayLabel, todayIso } from '../../../../web/utils/dates.js'
import { AGENDA_TABS } from '../../../../web/pages/panel/agendaTabs.js'
import { relatoriosService } from '../../../../web/services/gestaoService.js'

const STATUS = ['Agendado', 'Em andamento', 'Concluído', 'Cancelado']

function listNames(names) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`
}

export default function Cirurgias() {
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(['cirurgias'])
  const { update, remove } = useRecordActions('cirurgias', patchLocal)
  const [selectedId, setSelectedId] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)

  const hoje = todayIso()
  const upcoming = useMemo(
    () => (data ? data.cirurgias.filter((s) => s.data >= hoje).sort(compareSchedule) : []),
    [data, hoje],
  )
  const today = upcoming.filter((s) => s.data === hoje && s.status !== 'Cancelado')
  const selected = upcoming.find((s) => s.id === selectedId) ?? data?.cirurgias.find((s) => s.id === selectedId)

  return (
    <Page
      title="Cirurgias de hoje"
      subtitle="Procedimentos cirúrgicos de hoje e dos próximos dias."
      tabs={AGENDA_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nenhuma cirurgia agendada"
              action={<PillButton to="/agenda/cirurgias/nova">Agendar cirurgia</PillButton>}
            >
              Quando você agendar um procedimento ele aparece aqui.
            </EmptyState>
          ) : (
            <View style={listas.lista}>
              {upcoming.map((cirurgia) => {
                const pet = lookup.pet(cirurgia.petId)
                return (
                  <PetCard
                    key={cirurgia.id}
                    photo={lookup.photoOf(cirurgia)}
                    title={pet?.nome ?? 'Pet removido'}
                    badges={
                      <>
                        {pet?.idade ? <Chip>{pet.idade}</Chip> : null}
                        {cirurgia.data !== hoje && (
                          <Chip tone="tag">
                            {relativeDayLabel(cirurgia.data)} · {cirurgia.hora}
                          </Chip>
                        )}
                        {cirurgia.status !== 'Agendado' && (
                          <Chip tone={cirurgia.status === 'Cancelado' ? 'perigo' : 'alerta'} size="sm">
                            {cirurgia.status}
                          </Chip>
                        )}
                      </>
                    }
                    actions={
                      <PillButton size="lg" onPress={() => setSelectedId(cirurgia.id)}>
                        Detalhes do procedimento
                      </PillButton>
                    }
                  >
                    <InfoLine label="Dono(a):">{lookup.tutor(cirurgia.tutorId)?.nome ?? '-'}</InfoLine>
                    <InfoLine label="Procedimento:" tone="cafe">
                      {cirurgia.procedimento}
                    </InfoLine>
                  </PetCard>
                )
              })}
            </View>
          )}

          <SummaryBar
            actions={
              <>
                <PillButton size="sm" onPress={() => setReportOpen(true)}>
                  Ver todas as cirurgias
                </PillButton>
                <PillButton size="sm" to="/agenda/cirurgias/nova">
                  Agendar cirurgia
                </PillButton>
              </>
            }
          >
            {today.length
              ? `Hoje: ${today.length} ${today.length === 1 ? 'cirurgia' : 'cirurgias'}. ${listNames(
                  today.map((s) => `${lookup.pet(s.petId)?.nome.split(' ')[0] ?? 'Pet'} (${s.hora})`),
                )}.`
              : 'Nenhuma cirurgia agendada para hoje.'}
          </SummaryBar>

          {selected && (
            <RecordDialog
              open={Boolean(selectedId)}
              eventoId={selectedId}
              onClose={() => setSelectedId(null)}
              title={lookup.pet(selected.petId)?.nome ?? 'Cirurgia'}
              subtitle={selected.procedimento}
              photo={lookup.photoOf(selected)}
              status={selected.status}
              statusOptions={STATUS}
              onStatusChange={(status) => update(selected.id, { status }, 'Status da cirurgia atualizado.')}
              onDelete={async () => {
                await remove(selected.id, 'Cirurgia excluída.')
                setSelectedId(null)
              }}
              editTo={`/agenda/cirurgias/${selected.id}/editar`}
              rows={[
                { label: 'Data', value: `${formatDateBr(selected.data)} às ${selected.hora}` },
                { label: 'Cirurgião', value: lookup.staff(selected.cirurgiaoId)?.nome },
                { label: 'Tutor(a)', value: lookup.tutor(selected.tutorId)?.nome },
                { label: 'Telefone do tutor', value: lookup.tutor(selected.tutorId)?.telefone },
                {
                  label: 'Espécie / Raça',
                  value: [lookup.pet(selected.petId)?.especie, lookup.pet(selected.petId)?.raca]
                    .filter(Boolean)
                    .join(' · '),
                },
                { label: 'Observações', value: selected.observacoes || 'Sem observações.' },
              ]}
            />
          )}

          <ReportDialog
            open={reportOpen}
            pdf={(p) => relatoriosService.pdfAgenda({ ...p, tipo: 'Cirurgia' })}
            onClose={() => setReportOpen(false)}
            title="Painel cirúrgico"
            description="Visão geral dos procedimentos agendados."
            stats={[
              { label: 'Hoje', value: today.length },
              { label: 'Próximos dias', value: upcoming.filter((s) => s.data > hoje).length },
              { label: 'Concluídas (total)', value: data.cirurgias.filter((s) => s.status === 'Concluído').length },
            ]}
            items={upcoming.map((s) => ({
              id: s.id,
              when: `${relativeDayLabel(s.data)} ${s.hora}`,
              title: lookup.pet(s.petId)?.nome ?? 'Pet',
              detail: `${s.procedimento} · ${lookup.staff(s.cirurgiaoId)?.nome ?? ''}`,
              status: s.status,
            }))}
          />
        </>
      )}
    </Page>
  )
}
