import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { ConfirmDialog, Dialog } from './Dialog.jsx'
import { PillButton } from './PillButton.jsx'
import { StatusChip } from './Chip.jsx'
import { Field } from './Field.jsx'
import { DownloadIcon, PencilIcon, TrashIcon } from '../../web/components/Icons/Icons.jsx'
import { useToast } from '../../web/hooks/useToast.js'
import { addDaysIso, formatDateBr, maskDate, parseDateBr } from '../../web/utils/dates.js'
import { BlocoRelatorio, RelatorioAtendimentoDialog } from './RelatorioAtendimento.jsx'
import { cores, sombras } from '../../tema.js'
import { Texto } from '../Texto.jsx'
import { Grade } from './Grade.jsx'

/**
 * Detalhes de um agendamento: foto, dados, troca de status, edição e exclusão.
 * rows: [{ label, value }] · editTo: rota da tela de edição
 * eventoId: com ele, aparece o relatório do atendimento (preencher e baixar em PDF)
 */
export function RecordDialog({
  open,
  onClose,
  title,
  subtitle,
  photo,
  rows = [],
  status,
  statusOptions,
  onStatusChange,
  onDelete,
  deleteLabel = 'Excluir agendamento',
  editTo,
  extraActions,
  eventoId,
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  // undefined: formulário fechado; null: relatório novo; objeto: editando o salvo.
  const [relatorio, setRelatorio] = useState(undefined)
  const [versao, setVersao] = useState(0)

  const run = async (action) => {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Dialog
        open={open && !confirming && relatorio === undefined}
        onClose={onClose}
        title={title}
        description={subtitle}
        footer={
          <>
            {onDelete && (
              <PillButton variant="perigo" size="md" onPress={() => setConfirming(true)} disabled={busy}>
                <TrashIcon size={15} />
                {deleteLabel}
              </PillButton>
            )}
            {editTo && (
              <PillButton variant="contorno" size="md" to={editTo} onPress={onClose}>
                <PencilIcon size={15} />
                Editar
              </PillButton>
            )}
            {extraActions}
            <PillButton variant="solido" onPress={onClose}>
              Fechar
            </PillButton>
          </>
        }
      >
        <View style={estilos.topo}>
          {photo ? <Image source={{ uri: photo }} style={estilos.foto} contentFit="cover" /> : <View />}
          {status ? <StatusChip status={status} size="md" /> : null}
        </View>

        <Grade colunas={2} quebras={{ 560: 1 }} gap={20} linhaGap={14} esticar={false}>
          {rows
            .filter((row) => row.value)
            .map((row) => (
              <View key={row.label} style={estilos.item}>
                <Texto peso={600} style={estilos.rotulo}>
                  {row.label.toUpperCase()}
                </Texto>
                <Texto peso={600} style={estilos.valor}>
                  {row.value}
                </Texto>
              </View>
            ))}
        </Grade>

        {statusOptions && onStatusChange && (
          <View style={estilos.status}>
            <Field
              label="Alterar status"
              as="select"
              value={status}
              editable={!busy}
              options={statusOptions.map((o) => ({ value: o, label: o }))}
              onChange={(valor) => valor !== status && run(() => onStatusChange(valor))}
            />
          </View>
        )}

        {eventoId ? <BlocoRelatorio key={versao} eventoId={eventoId} onEditar={setRelatorio} /> : null}
      </Dialog>

      {open && eventoId && relatorio !== undefined ? (
        <RelatorioAtendimentoDialog
          eventoId={eventoId}
          titulo={[title, subtitle].filter(Boolean).join(' · ')}
          relatorio={relatorio}
          onClose={() => setRelatorio(undefined)}
          onSaved={() => {
            setRelatorio(undefined)
            setVersao((v) => v + 1)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={open && confirming}
        onClose={() => setConfirming(false)}
        title="Confirmar exclusão"
        message="Essa ação não pode ser desfeita. Deseja mesmo excluir este registro?"
        confirmLabel="Excluir"
        loading={busy}
        onConfirm={() =>
          run(async () => {
            await onDelete()
            setConfirming(false)
          })
        }
      />
    </>
  )
}

/**
 * Relatório simples: cartões de números + lista detalhada.
 * pdf: ({ de, ate }) => Promise; com ele aparece o download em PDF (com período se pdfPeriodo).
 */
export function ReportDialog({ open, onClose, title, description, stats = [], items = [], pdf, pdfPeriodo = true }) {
  const toast = useToast()
  const [periodo, setPeriodo] = useState(() => ({
    de: formatDateBr(addDaysIso(-30)),
    ate: formatDateBr(addDaysIso(0)),
  }))
  const [baixando, setBaixando] = useState(false)

  const baixar = async () => {
    const de = parseDateBr(periodo.de)
    const ate = parseDateBr(periodo.ate)
    if (pdfPeriodo && (!de || !ate)) return toast.error('Use datas no formato dd/mm/aaaa.')
    setBaixando(true)
    try {
      await pdf(pdfPeriodo ? { de, ate } : {})
      toast.success('Relatório em PDF pronto.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <PillButton variant="solido" onPress={onClose}>
          Fechar
        </PillButton>
      }
    >
      <Grade minimo={150} encaixar gap={12}>
        {stats.map((stat) => (
          <View key={stat.label} style={estilos.numero}>
            <Texto peso={700} style={estilos.numeroValor}>
              {stat.value}
            </Texto>
            <Texto style={estilos.numeroRotulo}>{stat.label}</Texto>
          </View>
        ))}
      </Grade>
      {items.length > 0 && (
        <View style={estilos.relatorio}>
          {items.map((item, i) => (
            <View key={item.id} style={[estilos.relItem, i === items.length - 1 && { borderBottomWidth: 0 }]}>
              <Texto peso={700} style={estilos.relHora}>
                {item.when}
              </Texto>
              <View style={estilos.relTexto}>
                <Texto peso={700} style={{ fontSize: 16 }}>
                  {item.title}
                </Texto>
                {item.detail ? <Texto style={estilos.relDetalhe}>{item.detail}</Texto> : null}
              </View>
              {item.status ? <StatusChip status={item.status} /> : null}
            </View>
          ))}
        </View>
      )}
      {pdf ? (
        <View style={estilos.pdf}>
          <View style={{ gap: 2 }}>
            <Texto peso={700} style={{ color: cores.cafeEscuro }}>
              Relatório completo em PDF
            </Texto>
            <Texto style={estilos.relDetalhe}>
              {pdfPeriodo ? 'Escolha o período e baixe o arquivo.' : 'Com todos os registros atuais.'}
            </Texto>
          </View>
          {pdfPeriodo ? (
            <Grade colunas={2} gap={10} esticar={false}>
              <Field
                label="De"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={periodo.de}
                onChange={(v) => setPeriodo((p) => ({ ...p, de: maskDate(v) }))}
              />
              <Field
                label="Até"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={periodo.ate}
                onChange={(v) => setPeriodo((p) => ({ ...p, ate: maskDate(v) }))}
              />
            </Grade>
          ) : null}
          <PillButton onPress={baixar} loading={baixando}>
            <DownloadIcon size={15} />
            Baixar PDF
          </PillButton>
        </View>
      ) : null}
    </Dialog>
  )
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 },
  foto: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: cores.branco, ...sombras.suave },
  item: { gap: 2 },
  rotulo: { fontSize: 15, letterSpacing: 0.5, color: cores.taupe },
  valor: { fontSize: 17, color: cores.cafeEscuro },
  status: { marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: cores.borda },

  numero: {
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 16,
    backgroundColor: cores.superficie,
  },
  numeroValor: { fontSize: 32, lineHeight: 34, color: cores.cafe },
  numeroRotulo: { fontSize: 15, color: cores.taupe },
  relatorio: { marginTop: 20 },
  relItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  relHora: { minWidth: 92, fontSize: 15, color: cores.cafe, fontVariant: ['tabular-nums'] },
  relTexto: { flex: 1, minWidth: 140 },
  relDetalhe: { fontSize: 15, color: cores.taupe },
  pdf: {
    gap: 14,
    marginTop: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: cores.borda,
    borderLeftColor: cores.caramelo,
    borderRadius: 14,
    backgroundColor: cores.cremeClaro,
  },
})
