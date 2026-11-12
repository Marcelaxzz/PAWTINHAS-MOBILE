import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Page } from '../../../componentes/Page.jsx'
import { ErrorState, LoadingState, SummaryBar } from '../../../componentes/ui/Basicos.jsx'
import { Grade } from '../../../componentes/ui/Grade.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { ReportDialog } from '../../../componentes/ui/RecordDialog.jsx'
import { Forte, Texto, Titulo } from '../../../componentes/Texto.jsx'
import {
  AlertIcon,
  HouseIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StethoscopeIcon,
} from '../../../web/components/Icons/Icons.jsx'
import { useClinic } from '../../../web/hooks/useClinic.js'
import { agendaSummaries, petsInNext12Hours, todaysTimeline } from '../../../web/utils/agenda.js'
import { AGENDA_TABS } from '../../../web/pages/panel/agendaTabs.js'
import { cores, sombras } from '../../../tema.js'
import { relatoriosService } from '../../../web/services/gestaoService.js'

const RESOURCES = ['consultas', 'vacinas', 'cirurgias', 'banhos', 'visitas', 'emergencias']

const CARDS = [
  {
    key: 'consultas',
    title: 'Consultas',
    to: '/agenda/consultas-vacinas?secao=consultas',
    icon: StethoscopeIcon,
    tom: 'ceu',
  },
  { key: 'cirurgias', title: 'Cirurgias', to: '/agenda/cirurgias', icon: ScissorsIcon, tom: 'lavanda' },
  {
    key: 'vacinas',
    title: 'Vacinas',
    to: '/agenda/consultas-vacinas?secao=vacinas',
    icon: ShieldCheckIcon,
    tom: 'salvia',
  },
  { key: 'banhos', title: 'Banho e tosa', to: '/agenda/banho-tosa', icon: SparkleIcon, tom: 'mel' },
  { key: 'visitas', title: 'Pet sitter', to: '/agenda/pet-sitter', icon: HouseIcon, tom: 'rosa' },
  { key: 'emergencias', title: 'Emergências', to: '/agenda/emergencias', icon: AlertIcon, tom: 'terracota' },
]

export default function Agenda() {
  const router = useRouter()
  const { data, loading, error, reload, lookup } = useClinic(RESOURCES)
  const [dayOpen, setDayOpen] = useState(false)

  const summaries = useMemo(() => (data ? agendaSummaries(data) : null), [data])
  const timeline = useMemo(() => (data ? todaysTimeline(data, lookup) : []), [data, lookup])
  const nextPets = useMemo(() => petsInNext12Hours(timeline), [timeline])

  return (
    <Page
      title="Agenda de hoje"
      subtitle="Consultas, cirurgias, banhos, visitas e emergências do dia."
      tabs={AGENDA_TABS}
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {summaries && (
        <>
          <Grade
            colunas={3}
            quebras={{ 1024: 2, 600: 1 }}
            gap={14}
            style={estilos.grade}
            accessibilityLabel="Categorias da agenda"
          >
            {CARDS.map(({ key, title, to, icon: Icon, tom }) => (
              <Pressable
                key={key}
                onPress={() => router.push(to)}
                accessibilityRole="link"
                style={({ pressed }) => [estilos.cartao, sombras.elevada, pressed && { borderColor: cores[tom] }]}
              >
                <View style={[estilos.icone, { backgroundColor: cores[`${tom}Fundo`] }]}>
                  <Icon size={24} strokeWidth={1.9} color={cores[`${tom}Texto`]} />
                </View>
                <Titulo style={estilos.titulo}>{title}</Titulo>
                <Texto peso={500} style={[estilos.texto, { color: cores[`${tom}Texto`] }]}>
                  {summaries[key]}
                </Texto>
              </Pressable>
            ))}
          </Grade>

          <SummaryBar
            actions={
              <PillButton size="sm" onPress={() => setDayOpen(true)}>
                Ver o dia completo
              </PillButton>
            }
          >
            Nas próximas 12 horas: <Forte>{nextPets}</Forte>{' '}
            {nextPets === 1 ? 'paciente com horário marcado' : 'pacientes com horário marcado'}.
          </SummaryBar>

          <ReportDialog
            open={dayOpen}
            pdf={relatoriosService.pdfAgenda}
            onClose={() => setDayOpen(false)}
            title="Detalhes do dia"
            description="Todos os compromissos de hoje, em ordem de horário."
            stats={[
              { label: 'Compromissos hoje', value: timeline.length },
              {
                label: 'Pendentes',
                value: timeline.filter((i) => ['Agendado', 'Pendente', 'Em atendimento'].includes(i.status)).length,
              },
              {
                label: 'Concluídos',
                value: timeline.filter((i) => ['Concluída', 'Concluído', 'Aplicada', 'Alta médica'].includes(i.status))
                  .length,
              },
            ]}
            items={timeline.map((item) => ({
              id: `${item.tipo}-${item.id}`,
              when: `${item.hora} · ${item.tipo}`,
              title: item.pet,
              detail: item.detalhe,
              status: item.status,
            }))}
          />
        </>
      )}
    </Page>
  )
}

const estilos = StyleSheet.create({
  icone: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  grade: { marginTop: 8, marginBottom: -4 },
  cartao: {
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  titulo: { marginTop: 18, fontSize: 25, lineHeight: 30 },
  texto: { marginTop: 6, fontSize: 16, lineHeight: 23 },
})
