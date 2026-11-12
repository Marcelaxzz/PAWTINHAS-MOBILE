import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { PetCard } from '../../../componentes/ui/PetCard.jsx'
import { Grade } from '../../../componentes/ui/Grade.jsx'
import { Chip, StatusChip } from '../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState, SummaryBar } from '../../../componentes/ui/Basicos.jsx'
import { Dialog } from '../../../componentes/ui/Dialog.jsx'
import { RecordDialog } from '../../../componentes/ui/RecordDialog.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { listas } from '../../../componentes/listas.js'
import { PawOutline, ShieldCheckIcon, StethoscopeIcon } from '../../../web/components/Icons/Icons.jsx'
import { useClinic } from '../../../web/hooks/useClinic.js'
import { useRecordActions } from '../../../web/hooks/useRecordActions.js'
import { compareSchedule, formatDateBr, relativeDayLabel, todayIso } from '../../../web/utils/dates.js'
import { AGENDA_TABS } from '../../../web/pages/panel/agendaTabs.js'
import { imprimirDocumento } from '../../../plataforma/imprimir.js'
import { cores } from '../../../tema.js'

const STATUS_CONSULTA = ['Agendado', 'Em andamento', 'Concluído', 'Cancelado']
const STATUS_VACINA = ['Agendado', 'Pendente', 'Aplicada', 'Cancelado']
const COR_STATUS = { Pendente: cores.aviso, Aplicada: cores.sucesso }

export default function ConsultasVacinas() {
  const { secao } = useLocalSearchParams()
  const pagina = useRef(null)
  const posicoes = useRef({})
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(['consultas', 'vacinas'])
  const consultaActions = useRecordActions('consultas', patchLocal)
  const vacinaActions = useRecordActions('vacinas', patchLocal)
  const [consultaId, setConsultaId] = useState(null)
  const [comprovanteId, setComprovanteId] = useState(null)
  const [vacinaId, setVacinaId] = useState(null)
  const [aplicando, setAplicando] = useState(null)

  const hoje = todayIso()
  const consultas = useMemo(
    () => (data ? data.consultas.filter((c) => c.data >= hoje).sort(compareSchedule) : []),
    [data, hoje],
  )
  const vacinas = useMemo(
    () => (data ? data.vacinas.filter((v) => v.data >= hoje).sort(compareSchedule) : []),
    [data, hoje],
  )
  const consultasHoje = consultas.filter((c) => c.data === hoje && c.status !== 'Cancelado')
  const vacinasPendentes = vacinas.filter(
    (v) => v.data === hoje && v.status !== 'Cancelado' && v.status !== 'Aplicada',
  ).length

  const consulta = data?.consultas.find((c) => c.id === consultaId)
  const comprovante = data?.vacinas.find((v) => v.id === comprovanteId)
  const vacina = data?.vacinas.find((v) => v.id === vacinaId)

  // "#vacinas" do site: rola até a seção pedida.
  useEffect(() => {
    if (!data || !secao) return undefined
    const timer = setTimeout(() => {
      const y = posicoes.current[secao]
      if (y !== undefined) pagina.current?.scrollTo({ y: Math.max(0, posicoes.current.corpo + y - 12), animated: true })
    }, 250)
    return () => clearTimeout(timer)
  }, [data, secao])

  const registrarAplicacao = async (v) => {
    setAplicando(v.id)
    try {
      const agora = new Date()
      const stamp = `${hoje}T${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
      await vacinaActions.update(v.id, { status: 'Aplicada', aplicadaEm: stamp }, 'Aplicação registrada!')
    } catch {
      /* aviso já exibido */
    } finally {
      setAplicando(null)
    }
  }

  const petTitle = (petId) => {
    const pet = lookup.pet(petId)
    return pet ? `${pet.nome}, ${pet.idade}` : 'Pet removido'
  }

  const linhasComprovante = comprovante
    ? [
        { rotulo: 'Paciente', valor: lookup.pet(comprovante.petId)?.nome },
        { rotulo: 'Tutor(a)', valor: lookup.tutor(comprovante.tutorId)?.nome },
        { rotulo: 'Vacina', valor: `${comprovante.nome} · ${comprovante.dose}` },
        {
          rotulo: 'Aplicada em',
          valor: comprovante.aplicadaEm
            ? `${formatDateBr(comprovante.aplicadaEm.slice(0, 10))} às ${comprovante.aplicadaEm.slice(11, 16)}`
            : formatDateBr(comprovante.data),
        },
        { rotulo: 'Responsável', valor: lookup.staff(comprovante.profissionalId)?.nome },
        { rotulo: 'Observações', valor: comprovante.observacoes },
      ]
    : []

  return (
    <Page
      width="largo"
      ref={pagina}
      onCorpoLayout={(y) => (posicoes.current.corpo = y)}
      title="Consultas & Vacinas"
      subtitle="Consultas e aplicações de vacina do dia."
      tabs={AGENDA_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          <Grade colunas={2} quebras={{ 1000: 1 }} gap={24} esticar={false}>
            <View style={estilos.coluna} onLayout={(e) => (posicoes.current.consultas = e.nativeEvent.layout.y)}>
              <View style={listas.subtitulo}>
                <StethoscopeIcon size={22} color={cores.cafe} />
                <Titulo style={listas.subtituloTexto}>Consultas de hoje</Titulo>
              </View>
              {consultas.length === 0 ? (
                <EmptyState title="Sem consultas">Nenhuma consulta agendada.</EmptyState>
              ) : (
                consultas.map((c) => (
                  <PetCard
                    key={c.id}
                    avatar={80}
                    variant="branco"
                    titleSize="sm"
                    photo={lookup.photoOf(c)}
                    title={petTitle(c.petId)}
                    badges={c.status !== 'Agendado' ? <StatusChip status={c.status} /> : null}
                    actions={
                      <PillButton variant="contorno" size="sm" onPress={() => setConsultaId(c.id)}>
                        Detalhes
                      </PillButton>
                    }
                  >
                    <Texto style={estilos.dono}>Dono(a): {lookup.tutor(c.tutorId)?.nome ?? '-'}</Texto>
                    <View style={estilos.meta}>
                      <Chip tone="tag" size="xs">
                        {c.motivo}
                      </Chip>
                      <Texto peso={700} style={estilos.hora}>
                        {c.data === hoje ? c.hora : `${relativeDayLabel(c.data)} ${c.hora}`}
                      </Texto>
                    </View>
                  </PetCard>
                ))
              )}
            </View>

            <View style={estilos.coluna} onLayout={(e) => (posicoes.current.vacinas = e.nativeEvent.layout.y)}>
              <View style={listas.subtitulo}>
                <ShieldCheckIcon size={22} color={cores.cafe} />
                <Titulo style={listas.subtituloTexto}>Vacinas de hoje</Titulo>
              </View>
              {vacinas.length === 0 ? (
                <EmptyState title="Sem vacinas">Nenhuma vacina agendada.</EmptyState>
              ) : (
                vacinas.map((v) => (
                  <PetCard
                    key={v.id}
                    avatar={80}
                    titleSize="sm"
                    photo={lookup.photoOf(v)}
                    title={petTitle(v.petId)}
                    actions={
                      <View style={estilos.acoesVacina}>
                        {v.status === 'Aplicada' ? (
                          <PillButton variant="contorno" size="sm" onPress={() => setComprovanteId(v.id)}>
                            Ver comprovante
                          </PillButton>
                        ) : (
                          <PillButton
                            size="sm"
                            loading={aplicando === v.id}
                            onPress={() => registrarAplicacao(v)}
                            disabled={v.status === 'Cancelado'}
                          >
                            Registrar aplicação
                          </PillButton>
                        )}
                        <PillButton variant="fantasma" size="sm" onPress={() => setVacinaId(v.id)}>
                          Detalhes
                        </PillButton>
                      </View>
                    }
                  >
                    <Texto style={estilos.dono}>Dono(a): {lookup.tutor(v.tutorId)?.nome ?? '-'}</Texto>
                    <View style={estilos.meta}>
                      <Chip tone="neutro" size="xs">
                        {v.nome}
                      </Chip>
                      <Texto
                        peso={600}
                        style={[estilos.status, COR_STATUS[v.status] && { color: COR_STATUS[v.status] }]}
                      >
                        {v.data === hoje ? v.status : `${v.status} · ${relativeDayLabel(v.data)}`}
                      </Texto>
                    </View>
                  </PetCard>
                ))
              )}
            </View>
          </Grade>

          <Grade colunas={2} quebras={{ 1000: 1 }} gap={20} style={estilos.rodape}>
            <SummaryBar
              actions={
                <PillButton size="sm" to="/agenda/consultas/nova">
                  Agendar consulta
                </PillButton>
              }
            >
              Resumo de consultas: você possui {consultasHoje.length} {consultasHoje.length === 1 ? 'pet' : 'pets'} para
              hoje.
            </SummaryBar>
            <SummaryBar
              actions={
                <PillButton size="sm" to="/agenda/vacinas/nova">
                  Agendar vacina
                </PillButton>
              }
            >
              Resumo de vacinas: você possui {vacinasPendentes} {vacinasPendentes === 1 ? 'pet' : 'pets'} para hoje.
            </SummaryBar>
          </Grade>

          {consulta && (
            <RecordDialog
              open={Boolean(consultaId)}
              eventoId={consultaId}
              onClose={() => setConsultaId(null)}
              title={lookup.pet(consulta.petId)?.nome ?? 'Consulta'}
              subtitle={consulta.motivo}
              photo={lookup.photoOf(consulta)}
              status={consulta.status}
              statusOptions={STATUS_CONSULTA}
              onStatusChange={(status) =>
                consultaActions.update(consulta.id, { status }, 'Status da consulta atualizado.')
              }
              onDelete={async () => {
                await consultaActions.remove(consulta.id, 'Consulta excluída.')
                setConsultaId(null)
              }}
              editTo={`/agenda/consultas/${consulta.id}/editar`}
              rows={[
                { label: 'Data', value: `${formatDateBr(consulta.data)} às ${consulta.hora}` },
                { label: 'Veterinário(a)', value: lookup.staff(consulta.veterinarioId)?.nome },
                { label: 'Tutor(a)', value: lookup.tutor(consulta.tutorId)?.nome },
                { label: 'Telefone do tutor', value: lookup.tutor(consulta.tutorId)?.telefone },
                { label: 'Observações', value: consulta.observacoes || 'Sem observações.' },
              ]}
            />
          )}

          {vacina && (
            <RecordDialog
              open={Boolean(vacinaId)}
              eventoId={vacinaId}
              onClose={() => setVacinaId(null)}
              title={lookup.pet(vacina.petId)?.nome ?? 'Vacina'}
              subtitle={`${vacina.nome} · ${vacina.dose}`}
              photo={lookup.photoOf(vacina)}
              status={vacina.status}
              statusOptions={STATUS_VACINA}
              onStatusChange={(status) => vacinaActions.update(vacina.id, { status }, 'Status da vacina atualizado.')}
              onDelete={async () => {
                await vacinaActions.remove(vacina.id, 'Vacina excluída.')
                setVacinaId(null)
              }}
              editTo={`/agenda/vacinas/${vacina.id}/editar`}
              rows={[
                { label: 'Data', value: `${formatDateBr(vacina.data)} às ${vacina.hora}` },
                { label: 'Profissional', value: lookup.staff(vacina.profissionalId)?.nome },
                { label: 'Tutor(a)', value: lookup.tutor(vacina.tutorId)?.nome },
                { label: 'Telefone do tutor', value: lookup.tutor(vacina.tutorId)?.telefone },
                { label: 'Observações', value: vacina.observacoes || 'Sem observações.' },
              ]}
            />
          )}

          {comprovante && (
            <Dialog
              open={Boolean(comprovanteId)}
              onClose={() => setComprovanteId(null)}
              title="Comprovante de vacinação"
              footer={
                <>
                  <PillButton
                    variant="contorno"
                    onPress={() =>
                      imprimirDocumento({
                        titulo: 'Clínica Pawtinhas',
                        subtitulo: 'Comprovante de vacinação',
                        linhas: linhasComprovante,
                        selo: 'Aplicada',
                      }).catch(() => {})
                    }
                  >
                    Imprimir
                  </PillButton>
                  <PillButton onPress={() => setComprovanteId(null)}>Fechar</PillButton>
                </>
              }
            >
              <View style={estilos.comprovante}>
                <PawOutline size={42} color={cores.caramelo} style={estilos.comprovanteMarca} />
                <Titulo style={estilos.comprovanteClinica}>Clínica Pawtinhas</Titulo>
                <Grade colunas={2} quebras={{ 560: 1 }} gap={12} esticar={false} style={{ alignSelf: 'stretch' }}>
                  {linhasComprovante
                    .filter((l) => l.valor)
                    .map((l) => (
                      <View key={l.rotulo}>
                        <Texto peso={600} style={estilos.dt}>
                          {l.rotulo.toUpperCase()}
                        </Texto>
                        <Texto peso={600} style={{ marginTop: 2 }}>
                          {l.valor}
                        </Texto>
                      </View>
                    ))}
                </Grade>
                <StatusChip status="Aplicada" size="md" />
              </View>
            </Dialog>
          )}
        </>
      )}
    </Page>
  )
}

const estilos = StyleSheet.create({
  coluna: { gap: 16, marginBottom: 4 },
  dono: { fontSize: 17, color: cores.taupe },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 8, marginTop: 4 },
  hora: { fontSize: 15, color: cores.cafeEscuro },
  status: { fontSize: 15, color: cores.taupe },
  acoesVacina: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 },
  rodape: { marginTop: 12 },
  comprovante: {
    alignItems: 'flex-start',
    gap: 16,
    padding: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.caramelo,
    borderRadius: 18,
    backgroundColor: cores.branco,
  },
  comprovanteMarca: { position: 'absolute', top: 18, right: 18, opacity: 0.6 },
  comprovanteClinica: { fontSize: 23, lineHeight: 28 },
  dt: { fontSize: 15, color: cores.taupe },
})
