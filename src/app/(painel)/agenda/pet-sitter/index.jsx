import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Page } from '../../../../componentes/Page.jsx'
import { InfoLine, PetCard } from '../../../../componentes/ui/PetCard.jsx'
import { Chip, StatusChip } from '../../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState, SummaryBar } from '../../../../componentes/ui/Basicos.jsx'
import { RecordDialog, ReportDialog } from '../../../../componentes/ui/RecordDialog.jsx'
import { Texto } from '../../../../componentes/Texto.jsx'
import { listas } from '../../../../componentes/listas.js'
import { CheckIcon } from '../../../../web/components/Icons/Icons.jsx'
import { useClinic } from '../../../../web/hooks/useClinic.js'
import { useRecordActions } from '../../../../web/hooks/useRecordActions.js'
import { compareSchedule, formatDateBr, todayIso } from '../../../../web/utils/dates.js'
import { AGENDA_TABS } from '../../../../web/pages/panel/agendaTabs.js'
import { cores } from '../../../../tema.js'
import { relatoriosService } from '../../../../web/services/gestaoService.js'

export default function PetSitter() {
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(['visitas'])
  const { update, remove } = useRecordActions('visitas', patchLocal)
  const [reportOpen, setReportOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const hoje = todayIso()
  const visitas = useMemo(
    () =>
      data
        ? data.visitas
            .filter((v) => v.dataFim >= hoje)
            .sort((a, b) => compareSchedule({ data: a.dataInicio, hora: a.hora }, { data: b.dataInicio, hora: b.hora }))
        : [],
    [data, hoje],
  )
  const selected = data?.visitas.find((v) => v.id === selectedId)
  const deHoje = visitas.filter((v) => v.dataInicio <= hoje && v.status !== 'Cancelado')
  const concluidas = deHoje.filter((v) => v.status === 'Concluída').length

  const toggle = async (visita) => {
    setBusyId(visita.id)
    const concluida = visita.status === 'Concluída'
    try {
      await update(
        visita.id,
        { status: concluida ? 'Pendente' : 'Concluída' },
        concluida ? 'Visita marcada como pendente.' : 'Visita marcada como concluída!',
      )
    } catch {
      /* aviso já exibido */
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Page
      title="Visitas Pet Sitter"
      subtitle="Visitas domiciliares de cuidado e companhia."
      tabs={AGENDA_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          {visitas.length === 0 ? (
            <EmptyState
              title="Nenhuma visita agendada"
              action={<PillButton to="/agenda/pet-sitter/nova">Agendar visita</PillButton>}
            >
              As visitas domiciliares aparecem aqui.
            </EmptyState>
          ) : (
            <View style={listas.lista}>
              {visitas.map((visita) => {
                const pet = lookup.pet(visita.petId)
                const concluida = visita.status === 'Concluída'
                const futura = visita.dataInicio > hoje
                const inativo = busyId === visita.id || futura
                return (
                  <PetCard
                    key={visita.id}
                    avatar={100}
                    titleSize="md"
                    photo={lookup.photoOf(visita)}
                    title={pet ? `${pet.nome}, ${pet.raca}` : 'Pet removido'}
                    badges={
                      <>
                        {pet?.idade ? <Chip size="sm">{pet.idade}</Chip> : null}
                        <StatusChip status={visita.status} size="xs" />
                        {futura && (
                          <Chip tone="tag" size="xs">
                            A partir de {formatDateBr(visita.dataInicio)}
                          </Chip>
                        )}
                      </>
                    }
                    actions={
                      <View style={estilos.acoes}>
                        <Pressable
                          onPress={() => toggle(visita)}
                          disabled={inativo}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: concluida, disabled: inativo }}
                          style={[estilos.marcar, concluida && estilos.marcado, inativo && { opacity: 0.55 }]}
                        >
                          <View style={[estilos.caixa, concluida && estilos.caixaMarcada]}>
                            {concluida && <CheckIcon size={12} strokeWidth={3.2} color={cores.branco} />}
                          </View>
                          <Texto peso={600} style={{ fontSize: 16, color: concluida ? cores.sucesso : cores.cafe }}>
                            {concluida ? 'Concluída' : 'Marcar como visitada'}
                          </Texto>
                        </Pressable>
                        <PillButton variant="fantasma" size="sm" onPress={() => setSelectedId(visita.id)}>
                          Detalhes
                        </PillButton>
                      </View>
                    }
                  >
                    <InfoLine label="Tutor(a):">{lookup.tutor(visita.tutorId)?.nome ?? '-'}</InfoLine>
                    <InfoLine label="Endereço:">{visita.endereco}</InfoLine>
                    <View style={listas.metaLinha}>
                      <Chip tone="tag" size="xs">
                        {visita.servico}
                      </Chip>
                      <Texto peso={600} style={listas.horario}>
                        Horário: {visita.hora}
                      </Texto>
                    </View>
                  </PetCard>
                )
              })}
            </View>
          )}

          <SummaryBar
            actions={
              <>
                <PillButton size="sm" onPress={() => setReportOpen(true)}>
                  Relatório
                </PillButton>
                <PillButton size="sm" to="/agenda/pet-sitter/nova">
                  Agendar visita
                </PillButton>
              </>
            }
          >
            Resumo de visitas: {concluidas} de {deHoje.length}{' '}
            {deHoje.length === 1 ? 'visita concluída' : 'visitas concluídas'} hoje.
          </SummaryBar>

          {selected && (
            <RecordDialog
              open={Boolean(selectedId)}
              eventoId={selectedId}
              onClose={() => setSelectedId(null)}
              title={lookup.pet(selected.petId)?.nome ?? 'Visita'}
              subtitle={selected.servico}
              photo={lookup.photoOf(selected)}
              status={selected.status}
              statusOptions={['Pendente', 'Concluída', 'Cancelado']}
              onStatusChange={(status) => update(selected.id, { status }, 'Status da visita atualizado.')}
              onDelete={async () => {
                await remove(selected.id, 'Visita excluída.')
                setSelectedId(null)
              }}
              editTo={`/agenda/pet-sitter/${selected.id}/editar`}
              rows={[
                {
                  label: 'Período',
                  value: `${formatDateBr(selected.dataInicio)} a ${formatDateBr(selected.dataFim)} · ${selected.periodo}`,
                },
                { label: 'Horário', value: selected.hora },
                { label: 'Cuidador(a)', value: lookup.staff(selected.cuidadorId)?.nome },
                { label: 'Tutor(a)', value: lookup.tutor(selected.tutorId)?.nome },
                { label: 'Telefone do tutor', value: lookup.tutor(selected.tutorId)?.telefone },
                { label: 'Endereço', value: selected.endereco },
                { label: 'Observações', value: selected.observacoes || 'Sem observações.' },
              ]}
            />
          )}

          <ReportDialog
            open={reportOpen}
            pdf={(p) => relatoriosService.pdfAgenda({ ...p, tipo: 'PetSitter' })}
            onClose={() => setReportOpen(false)}
            title="Relatório de visitas"
            description="Visitas domiciliares de hoje e próximas."
            stats={[
              { label: 'Visitas hoje', value: deHoje.length },
              { label: 'Concluídas', value: concluidas },
              { label: 'Pendentes', value: deHoje.length - concluidas },
            ]}
            items={visitas.map((v) => ({
              id: v.id,
              when: `${formatDateBr(v.dataInicio).slice(0, 5)} ${v.hora}`,
              title: `${lookup.pet(v.petId)?.nome ?? 'Pet'} · ${v.periodo}`,
              detail: `${v.servico} · ${v.endereco}`,
              status: v.status,
            }))}
          />
        </>
      )}
    </Page>
  )
}

const estilos = StyleSheet.create({
  acoes: { gap: 8 },
  marcar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: cores.cafe,
    borderRadius: 999,
  },
  marcado: { borderColor: cores.salvia, backgroundColor: 'rgba(111, 143, 98, 0.1)' },
  caixa: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: cores.cafe,
    borderRadius: 4,
  },
  caixaMarcada: { borderColor: cores.salvia, backgroundColor: cores.salvia },
})
