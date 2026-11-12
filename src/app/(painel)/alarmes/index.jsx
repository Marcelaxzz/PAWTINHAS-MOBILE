import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Page } from '../../../componentes/Page.jsx'
import { PetCard } from '../../../componentes/ui/PetCard.jsx'
import { Chip, StatusChip } from '../../../componentes/ui/Chip.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState, SummaryBar } from '../../../componentes/ui/Basicos.jsx'
import { ReportDialog } from '../../../componentes/ui/RecordDialog.jsx'
import { Dialog } from '../../../componentes/ui/Dialog.jsx'
import { Forte, Texto } from '../../../componentes/Texto.jsx'
import { listas } from '../../../componentes/listas.js'
import { ChipIcon, ClockIcon, InfoIcon } from '../../../web/components/Icons/Icons.jsx'
import { useClinic } from '../../../web/hooks/useClinic.js'
import { useRecordActions } from '../../../web/hooks/useRecordActions.js'
import { formatDateBr } from '../../../web/utils/dates.js'
import { EsquemaAlarme } from '../../../telas/EsquemaAlarme.jsx'
import { NesteCelular } from '../../../alarmes/NesteCelular.jsx'
import { alarmeTocando } from '../../../alarmes/estado.js'
import { cores, sombras } from '../../../tema.js'
import { relatoriosService } from '../../../web/services/gestaoService.js'
import { proximoToque, resumoDoAlarme, textoDoToque } from '../../../web/utils/alarmes.js'

const PASSOS = [
  'Ligue a caixinha na tomada. Na primeira vez (ou num lugar novo), o display mostra "Configurar Wi-Fi".',
  'No celular, entre na rede Pawtinhas-Alarme (senha pawtinhas). A página de configuração abre sozinha; se não abrir, acesse 192.168.4.1.',
  'Escolha o Wi-Fi do lugar e digite a senha. Ela guarda até 5 redes e acha a API sozinha, sem precisar do IP do computador.',
  'O botão BOOT da placa desliga o alarme tocando. Com a tela parada, um toque mostra a rede e o IP, e segurar 3 segundos abre a configuração de novo.',
]

export default function Alarmes() {
  const { data, loading, error, reload, lookup, patchLocal } = useClinic(['alarmes', 'historicoAlarmes'])
  const { update } = useRecordActions('alarmes', patchLocal)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const alternarAtivo = async (alarme) => {
    setTogglingId(alarme.id)
    try {
      await update(
        alarme.id,
        { ativo: !alarme.ativo },
        alarme.ativo ? `${alarme.nome} foi pausado.` : `${alarme.nome} foi ativado.`,
      )
      alarmeTocando.pedirSincronia()
    } catch {
      // O aviso de erro já foi exibido.
    } finally {
      setTogglingId(null)
    }
  }

  const alarmes = useMemo(() => (data ? [...data.alarmes].sort((a, b) => a.hora.localeCompare(b.hora)) : []), [data])
  const ativos = alarmes.filter((a) => a.ativo).length
  const pausados = alarmes.length - ativos

  const petBadge = (petId) => lookup.pet(petId)?.nome

  return (
    <Page title="Alarmes" subtitle="Lembretes que tocam no ESP32, no app do celular e no painel." onRefresh={reload}>
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          <View style={[estilos.iot, sombras.suave]} accessibilityLabel="Dispositivo ESP32">
            <View style={estilos.iotLinha}>
              <View style={estilos.iotIcone}>
                <ChipIcon size={22} color={cores.cafe} />
              </View>
              <View>
                <Texto peso={700}>Alarmes no dispositivo ESP32</Texto>
                <Texto style={estilos.iotTexto}>
                  A caixinha confere os alarmes a cada 20 segundos e guarda tudo na memória: se a internet cair, ela
                  continua tocando. Os pausados ficam guardados, mas não tocam.
                </Texto>
              </View>
            </View>
            <View style={estilos.iotAcoes}>
              <PillButton variant="contorno" size="lg" onPress={() => setDeviceOpen(true)}>
                Ver dispositivo
              </PillButton>
              <PillButton size="lg" to="/alarmes/novo">
                Novo alarme
              </PillButton>
            </View>
          </View>

          <NesteCelular />

          {alarmes.length === 0 ? (
            <EmptyState title="Nenhum alarme configurado">
              Cadastre lembretes de medicação, vacinas e visitas.
            </EmptyState>
          ) : (
            <View style={listas.lista}>
              {alarmes.map((alarme) => (
                <PetCard
                  key={alarme.id}
                  avatar={80}
                  photo={lookup.photoOf(alarme)}
                  title={alarme.nome}
                  badges={
                    <>
                      {petBadge(alarme.petId) ? <Chip size="sm">{petBadge(alarme.petId)}</Chip> : null}
                      <StatusChip status={alarme.ativo ? 'Ativo' : 'Pausado'} />
                    </>
                  }
                  actions={
                    <>
                      <View style={estilos.hora} accessibilityLabel={`Dispara às ${alarme.hora}`}>
                        <ClockIcon size={17} strokeWidth={2.2} color={cores.cafe} />
                        <Texto peso={600} style={estilos.horaTexto}>
                          {alarme.hora}
                        </Texto>
                      </View>
                      <PillButton
                        variant="contorno"
                        size="lg"
                        onPress={() => alternarAtivo(alarme)}
                        loading={togglingId === alarme.id}
                        accessibilityLabel={`${alarme.ativo ? 'Pausar' : 'Ativar'} ${alarme.nome}`}
                      >
                        {alarme.ativo ? 'Pausar' : 'Ativar'}
                      </PillButton>
                      <PillButton variant="contorno" size="lg" to={`/alarmes/${alarme.id}/editar`}>
                        Editar
                      </PillButton>
                    </>
                  }
                >
                  {alarme.descricao ? <Texto style={estilos.descricao}>{alarme.descricao}</Texto> : null}
                  <Texto peso={600} style={estilos.repeticao}>
                    {resumoDoAlarme(alarme)}
                    {alarme.ativo && proximoToque(alarme) ? ` · próximo ${textoDoToque(proximoToque(alarme))}` : ''}
                  </Texto>
                </PetCard>
              ))}
            </View>
          )}

          <SummaryBar
            icon={<InfoIcon size={20} color={cores.cafe} />}
            actions={<PillButton onPress={() => setHistoryOpen(true)}>Histórico de disparos</PillButton>}
          >
            <Forte>{alarmes.length}</Forte> {alarmes.length === 1 ? 'alarme' : 'alarmes'}: {ativos}{' '}
            {ativos === 1 ? 'ativo' : 'ativos'} e {pausados} {pausados === 1 ? 'pausado' : 'pausados'}.
          </SummaryBar>

          <ReportDialog
            open={historyOpen}
            pdf={relatoriosService.pdfAlarmes}
            pdfPeriodo={false}
            onClose={() => setHistoryOpen(false)}
            title="Histórico de alarmes"
            description="Últimas vezes que o ESP32 tocou."
            stats={[
              { label: 'Ativos', value: ativos },
              { label: 'Pausados', value: pausados },
              { label: 'Disparos registrados', value: data.historicoAlarmes.length },
            ]}
            items={[...data.historicoAlarmes]
              .sort((a, b) => b.quando.localeCompare(a.quando))
              .map((h) => ({
                id: h.id,
                when: `${formatDateBr(h.quando.slice(0, 10)).slice(0, 5)} ${h.quando.slice(11, 16)}`,
                title: h.nome,
                detail: h.resultado,
              }))}
          />

          <Dialog
            open={deviceOpen}
            onClose={() => setDeviceOpen(false)}
            title="Alarme de medicação"
            size="lg"
            description="ESP32 com display LCD 16x2 (módulo I2C) e buzzer. Funciona longe do computador, ligado num carregador de celular ou power bank."
            footer={<PillButton onPress={() => setDeviceOpen(false)}>Fechar</PillButton>}
          >
            <EsquemaAlarme />
            <View style={estilos.passos}>
              {PASSOS.map((passo, i) => (
                <Texto key={i} style={estilos.passo}>
                  {i + 1}. {passo}
                </Texto>
              ))}
            </View>
          </Dialog>
        </>
      )}
    </Page>
  )
}

const estilos = StyleSheet.create({
  iot: {
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.caramelo,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  iotLinha: { gap: 16 },
  iotIcone: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(216, 161, 107, 0.2)',
  },
  iotTexto: { marginTop: 2, fontSize: 16, lineHeight: 23, color: cores.taupe },
  iotAcoes: { alignItems: 'flex-start', gap: 10 },
  descricao: { fontSize: 17, color: cores.taupe },
  repeticao: { marginTop: 4, fontSize: 16, color: cores.cafe },
  passos: { gap: 8, marginTop: 16 },
  passo: { fontSize: 16, lineHeight: 24, color: cores.cafeEscuro },
  hora: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.branco,
  },
  horaTexto: { fontSize: 20, color: cores.cafe, fontVariant: ['tabular-nums'] },
})
