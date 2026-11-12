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

export default function BanhoTosa() {
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(['banhos'])
  const { update, remove } = useRecordActions('banhos', patchLocal)
  const [selectedId, setSelectedId] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)

  const hoje = todayIso()
  const upcoming = useMemo(
    () => (data ? data.banhos.filter((b) => b.data >= hoje).sort(compareSchedule) : []),
    [data, hoje],
  )
  const today = upcoming.filter((b) => b.data === hoje && b.status !== 'Cancelado')
  const selected = data?.banhos.find((b) => b.id === selectedId)

  return (
    <Page
      title="Banho e tosa de hoje"
      subtitle="Banhos, tosas e higienizações agendados."
      tabs={AGENDA_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nenhum banho agendado"
              action={<PillButton to="/agenda/banho-tosa/novo">Agendar banho ou tosa</PillButton>}
            >
              Os serviços de banho, tosa e higienização aparecem aqui.
            </EmptyState>
          ) : (
            <View style={listas.lista}>
              {upcoming.map((banho) => {
                const pet = lookup.pet(banho.petId)
                return (
                  <PetCard
                    key={banho.id}
                    avatar={110}
                    photo={lookup.photoOf(banho)}
                    title={pet ? `${pet.nome}, ${pet.raca}` : 'Pet removido'}
                    badges={
                      <>
                        {pet?.idade ? <Chip>{pet.idade}</Chip> : null}
                        {banho.data !== hoje && (
                          <Chip tone="tag">
                            {relativeDayLabel(banho.data)} · {banho.hora}
                          </Chip>
                        )}
                        {banho.status !== 'Agendado' && (
                          <Chip
                            tone={
                              banho.status === 'Concluído'
                                ? 'sucesso'
                                : banho.status === 'Cancelado'
                                  ? 'perigo'
                                  : 'alerta'
                            }
                            size="sm"
                          >
                            {banho.status}
                          </Chip>
                        )}
                      </>
                    }
                    actions={
                      <PillButton size="lg" onPress={() => setSelectedId(banho.id)}>
                        Detalhes do serviço
                      </PillButton>
                    }
                  >
                    <InfoLine label="Dono(a):">{lookup.tutor(banho.tutorId)?.nome ?? '-'}</InfoLine>
                    <InfoLine label="Serviço:" tone="cafe">
                      {banho.servico}
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
                  Ver todos os banhos
                </PillButton>
                <PillButton size="sm" to="/agenda/banho-tosa/novo">
                  Agendar banho ou tosa
                </PillButton>
              </>
            }
          >
            {today.length
              ? `Hoje: ${today.length} ${today.length === 1 ? 'pet agendado' : 'pets agendados'} para banho e tosa.`
              : 'Nenhum banho ou tosa marcado para hoje.'}
          </SummaryBar>

          {selected && (
            <RecordDialog
              open={Boolean(selectedId)}
              eventoId={selectedId}
              onClose={() => setSelectedId(null)}
              title={lookup.pet(selected.petId)?.nome ?? 'Serviço'}
              subtitle={selected.servico}
              photo={lookup.photoOf(selected)}
              status={selected.status}
              statusOptions={STATUS}
              onStatusChange={(status) => update(selected.id, { status }, 'Status do serviço atualizado.')}
              onDelete={async () => {
                await remove(selected.id, 'Serviço excluído.')
                setSelectedId(null)
              }}
              editTo={`/agenda/banho-tosa/${selected.id}/editar`}
              rows={[
                { label: 'Data', value: `${formatDateBr(selected.data)} às ${selected.hora}` },
                { label: 'Profissional', value: lookup.staff(selected.profissionalId)?.nome },
                { label: 'Tutor(a)', value: lookup.tutor(selected.tutorId)?.nome },
                { label: 'Telefone do tutor', value: lookup.tutor(selected.tutorId)?.telefone },
                { label: 'Observações', value: selected.observacoes || 'Sem observações.' },
              ]}
            />
          )}

          <ReportDialog
            open={reportOpen}
            pdf={(p) => relatoriosService.pdfAgenda({ ...p, tipo: 'BanhoTosa' })}
            onClose={() => setReportOpen(false)}
            title="Painel de banho e tosa"
            stats={[
              { label: 'Hoje', value: today.length },
              { label: 'Concluídos hoje', value: today.filter((b) => b.status === 'Concluído').length },
              { label: 'Próximos dias', value: upcoming.filter((b) => b.data > hoje).length },
            ]}
            items={upcoming.map((b) => ({
              id: b.id,
              when: `${relativeDayLabel(b.data)} ${b.hora}`,
              title: lookup.pet(b.petId)?.nome ?? 'Pet',
              detail: `${b.servico} · ${lookup.staff(b.profissionalId)?.nome ?? ''}`,
              status: b.status,
            }))}
          />
        </>
      )}
    </Page>
  )
}
