import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Page } from '../../../../componentes/Page.jsx'
import { Chip, StatusChip } from '../../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../../componentes/ui/PillButton.jsx'
import { ConfirmDialog } from '../../../../componentes/ui/Dialog.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../../../componentes/ui/Basicos.jsx'
import { Texto, Titulo } from '../../../../componentes/Texto.jsx'
import {
  DownloadIcon,
  PawOutline,
  PencilIcon,
  PillIcon,
  RulerIcon,
  TrashIcon,
} from '../../../../web/components/Icons/Icons.jsx'
import { useClinic } from '../../../../web/hooks/useClinic.js'
import { useToast } from '../../../../web/hooks/useToast.js'
import { dataService } from '../../../../web/services/dataService.js'
import { relatoriosService } from '../../../../web/services/gestaoService.js'
import { formatDateBr } from '../../../../web/utils/dates.js'
import { formatNumber, formatQuantidade } from '../../../../web/utils/numbers.js'
import { Alimentacao, Medicoes, Tratamentos } from '../../../../telas/CuidadosPaciente.jsx'
import { cores, sombras } from '../../../../tema.js'
import { Grade, useAte } from '../../../../componentes/ui/Grade.jsx'

const HISTORY = [
  'consultas',
  'vacinas',
  'cirurgias',
  'banhos',
  'visitas',
  'emergencias',
  'medicoes',
  'prescricoes',
  'planosAlimentares',
]

function historyOf(data, petId) {
  if (!data) return []
  const rows = [
    ...data.consultas
      .filter((x) => x.petId === petId)
      .map((x) => ({ id: x.id, data: x.data, hora: x.hora, tipo: 'Consulta', texto: x.motivo, status: x.status })),
    ...data.vacinas
      .filter((x) => x.petId === petId)
      .map((x) => ({
        id: x.id,
        data: x.data,
        hora: x.hora,
        tipo: 'Vacina',
        texto: `${x.nome} · ${x.dose}`,
        status: x.status,
      })),
    ...data.cirurgias
      .filter((x) => x.petId === petId)
      .map((x) => ({
        id: x.id,
        data: x.data,
        hora: x.hora,
        tipo: 'Cirurgia',
        texto: x.procedimento,
        status: x.status,
      })),
    ...data.banhos
      .filter((x) => x.petId === petId)
      .map((x) => ({ id: x.id, data: x.data, hora: x.hora, tipo: 'Banho e tosa', texto: x.servico, status: x.status })),
    ...data.visitas
      .filter((x) => x.petId === petId)
      .map((x) => ({
        id: x.id,
        data: x.dataInicio,
        hora: x.hora,
        tipo: 'Visita de pet sitter',
        texto: x.servico,
        status: x.status,
      })),
    ...data.emergencias
      .filter((x) => x.petId === petId)
      .map((x) => ({ id: x.id, data: x.data, hora: x.hora, tipo: 'Emergência', texto: x.motivo, status: x.status })),
    ...data.medicoes
      .filter((x) => x.petId === petId)
      .map((x) => ({
        id: x.id,
        data: x.criadoEm.slice(0, 10),
        hora: x.criadoEm.slice(11, 16),
        tipo: 'Prótese 3D',
        texto: `Membro ${formatNumber(x.comprimentoMembro, 1)} cm · Altura ${formatNumber(x.alturaChao, 1)} cm · Pata ${formatNumber(x.larguraPata, 1)} cm`,
      })),
    ...data.prescricoes
      .filter((x) => x.petId === petId)
      .map((x) => ({
        id: x.id,
        data: x.criadoEm.slice(0, 10),
        hora: x.criadoEm.slice(11, 16),
        tipo: 'Prescrição',
        texto: `${x.medicamento} · ${formatQuantidade(x.quantidadePorDose, x.unidade)} a cada ${x.intervaloHoras} h por ${x.duracaoDias} ${x.duracaoDias === 1 ? 'dia' : 'dias'}`,
      })),
    ...data.planosAlimentares
      .filter((x) => x.petId === petId)
      .map((x) => ({
        id: x.id,
        data: x.criadoEm.slice(0, 10),
        hora: x.criadoEm.slice(11, 16),
        tipo: 'Plano alimentar',
        texto: `${formatNumber(x.gramasDia, x.gramasDia < 100 ? 1 : 0)} g/dia de ${x.racao}`,
      })),
  ]
  return rows.sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`))
}

export default function PacienteFicha() {
  const { id } = useLocalSearchParams()
  const largo = !useAte(800)
  const celular = useAte(560)
  const router = useRouter()
  const toast = useToast()
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(HISTORY)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [baixando, setBaixando] = useState(false)

  const baixarFicha = async () => {
    setBaixando(true)
    try {
      await relatoriosService.pdfPaciente(id)
      toast.success('Ficha em PDF pronta.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBaixando(false)
    }
  }

  const pet = lookup.pet(id)
  const tutor = lookup.tutor(pet?.tutorId)
  const history = useMemo(() => historyOf(data, id), [data, id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await dataService.remove('pets', id)
      toast.success(`${pet.nome} foi removido(a) dos pacientes.`)
      router.dismissTo('/pacientes')
    } catch (err) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Page title="Ficha do paciente">
        <LoadingState />
      </Page>
    )
  }

  if (error || !pet) {
    return (
      <Page title="Ficha do paciente">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            title="Paciente não encontrado"
            action={<PillButton to="/pacientes">Voltar aos pacientes</PillButton>}
          >
            Esse cadastro pode ter sido removido.
          </EmptyState>
        )}
      </Page>
    )
  }

  const info = [
    ['Espécie', pet.especie],
    ['Raça', pet.raca],
    ['Idade', pet.idade],
    ['Sexo', pet.sexo],
    ['Peso', pet.peso ? `${pet.peso} kg` : ''],
    ['Tutor(a)', tutor?.nome],
    ['Telefone', tutor?.telefone],
    ['Endereço', tutor?.endereco],
  ].filter(([, value]) => value)

  const foto = lookup.petPhoto(pet.id)

  return (
    <Page title="Ficha do paciente" onRefresh={reload}>
      <View style={[estilos.perfil, largo && estilos.perfilLargo, sombras.suave]}>
        <View style={[estilos.foto, largo && estilos.fotoLarga, sombras.media]}>
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityLabel={`Foto de ${pet.nome}`}
            />
          ) : (
            <PawOutline size={60} color={cores.cafe} style={{ opacity: 0.4 }} />
          )}
        </View>
        <View style={[estilos.dados, largo && estilos.dadosLargo]}>
          <View style={[estilos.nomeLinha, largo && [estilos.alinharInicio, estilos.nomeLinhaLarga]]}>
            <Titulo style={estilos.nome}>{pet.nome}</Titulo>
            {pet.idade ? <Chip>{pet.idade}</Chip> : null}
          </View>
          {/* No celular, duas colunas (o endereço ocupa a linha), como no site. */}
          <Grade
            {...(celular ? { colunas: 2 } : { minimo: 180 })}
            gap={celular ? 16 : 24}
            linhaGap={14}
            esticar={false}
            style={estilos.info}
          >
            {info.map(([label, value]) => (
              <View key={label} inteiro={celular && label === 'Endereço'}>
                <Texto peso={600} style={estilos.dt}>
                  {label.toUpperCase()}
                </Texto>
                <Texto peso={600} style={{ marginTop: 2 }}>
                  {value}
                </Texto>
              </View>
            ))}
          </Grade>
          {pet.observacoes ? <Texto style={estilos.obs}>{pet.observacoes}</Texto> : null}
          <View style={[estilos.acoes, largo && estilos.alinharInicio, celular && estilos.acoesCelular]}>
            <PillButton to={`/pacientes/${pet.id}/editar`}>
              <PencilIcon size={15} />
              Editar ficha
            </PillButton>
            <PillButton variant="contorno" to={`/calculadoras/dose?pet=${encodeURIComponent(pet.id)}`}>
              <PillIcon size={15} />
              Calcular dose
            </PillButton>
            <PillButton variant="contorno" to={`/protese-3d?pet=${encodeURIComponent(pet.id)}`}>
              <RulerIcon size={15} />
              Medir prótese 3D
            </PillButton>
            <PillButton variant="contorno" onPress={baixarFicha} loading={baixando}>
              <DownloadIcon size={15} />
              Ficha em PDF
            </PillButton>
            <PillButton variant="perigo" onPress={() => setConfirming(true)}>
              <TrashIcon size={15} />
              Excluir
            </PillButton>
          </View>
        </View>
      </View>

      <Grade colunas={2} quebras={{ 1000: 1 }} gap={20} esticar={false}>
        <Tratamentos
          pet={pet}
          prescricoes={data.prescricoes.filter((p) => p.petId === pet.id)}
          patchLocal={patchLocal}
        />
        <Alimentacao
          pet={pet}
          planos={data.planosAlimentares.filter((p) => p.petId === pet.id)}
          patchLocal={patchLocal}
        />
        <Medicoes
          inteiro
          pet={pet}
          medicoes={data.medicoes.filter((m) => m.petId === pet.id)}
          patchLocal={patchLocal}
        />
      </Grade>

      <View style={estilos.historico}>
        <Titulo style={estilos.subtitulo}>Histórico de atendimentos</Titulo>
        {history.length === 0 ? (
          <Texto style={estilos.vazio}>Nenhum atendimento registrado para este paciente.</Texto>
        ) : (
          <View style={{ marginTop: 16 }}>
            {history.map((item, i) => (
              <View
                key={`${item.tipo}-${item.id}`}
                style={[estilos.evento, i === history.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={estilos.quando}>
                  <Texto peso={700} style={estilos.quandoData}>
                    {formatDateBr(item.data)}
                  </Texto>
                  <Texto peso={500} style={estilos.quandoHora}>
                    {item.hora}
                  </Texto>
                </View>
                <View style={estilos.eventoTexto}>
                  <Chip tone="tag" size="xs">
                    {item.tipo}
                  </Chip>
                  <Texto peso={700} style={{ fontSize: 16 }}>
                    {item.texto}
                  </Texto>
                </View>
                {item.status ? <StatusChip status={item.status} /> : null}
              </View>
            ))}
          </View>
        )}
      </View>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Excluir ${pet.nome}?`}
        message="A ficha sai da lista de pacientes junto com as prescrições, planos alimentares e medições. Consultas, vacinas e demais agendamentos continuam nos registros da clínica."
        confirmLabel="Excluir paciente"
      />
    </Page>
  )
}

const estilos = StyleSheet.create({
  perfil: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 28,
    backgroundColor: cores.superficie,
  },
  // Acima de 800 px a foto fica ao lado dos dados, como no site.
  perfilLargo: { flexDirection: 'row', alignItems: 'flex-start', gap: 36, padding: 32 },
  fotoLarga: { width: 200, height: 200, borderRadius: 100 },
  dados: { alignSelf: 'stretch', alignItems: 'center' },
  dadosLargo: { flex: 1, minWidth: 0, alignItems: 'stretch' },
  alinharInicio: { justifyContent: 'flex-start' },
  nomeLinhaLarga: { marginTop: 0 },
  foto: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: cores.branco,
    borderRadius: 75,
    backgroundColor: 'rgba(110, 77, 54, 0.08)',
  },
  nomeLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 8,
    marginTop: 36,
  },
  nome: { fontSize: 36, lineHeight: 42 },
  info: { alignSelf: 'stretch', gap: 14, marginTop: 20 },
  dt: { fontSize: 15, letterSpacing: 0.5, color: cores.taupe },
  obs: {
    alignSelf: 'stretch',
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: cores.caramelo,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(216, 161, 107, 0.1)',
    fontSize: 16,
    color: cores.taupeEscuro,
  },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 },
  acoesCelular: { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch', alignSelf: 'stretch', gap: 10 },
  historico: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 28,
    backgroundColor: cores.branco,
  },
  subtitulo: { fontSize: 25, lineHeight: 30 },
  vazio: { marginTop: 12, color: cores.taupe },
  evento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 14,
    rowGap: 8,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  quando: { minWidth: 96 },
  quandoData: { fontSize: 16, color: cores.cafe, fontVariant: ['tabular-nums'] },
  quandoHora: { fontSize: 15, color: cores.taupe },
  eventoTexto: { flex: 1, minWidth: 140, gap: 6, alignItems: 'flex-start' },
})
