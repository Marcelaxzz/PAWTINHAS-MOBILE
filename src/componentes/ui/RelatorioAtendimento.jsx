import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Dialog } from './Dialog.jsx'
import { Field, FieldGrid } from './Field.jsx'
import { PillButton } from './PillButton.jsx'
import { DownloadIcon, PencilIcon } from '../../web/components/Icons/Icons.jsx'
import { useAuth } from '../../web/hooks/useAuth.js'
import { useToast } from '../../web/hooks/useToast.js'
import { relatoriosService } from '../../web/services/gestaoService.js'
import { formatDateBr, maskDate, parseDateBr } from '../../web/utils/dates.js'
import { maskDecimal, parseDecimal } from '../../web/utils/numbers.js'
import { cores } from '../../tema.js'
import { Texto } from '../Texto.jsx'

const decimal = (n) => (n == null ? '' : String(n).replace('.', ','))

/** Bloco dentro dos detalhes do atendimento (BlocoRelatorio do site). */
export function BlocoRelatorio({ eventoId, onEditar }) {
  const toast = useToast()
  const [relatorio, setRelatorio] = useState(undefined)
  const [baixando, setBaixando] = useState(false)

  useEffect(() => {
    let ativo = true
    relatoriosService
      .obterAtendimento(eventoId)
      .then((r) => ativo && setRelatorio(r))
      .catch(() => ativo && setRelatorio(null))
    return () => {
      ativo = false
    }
  }, [eventoId])

  const baixar = async () => {
    setBaixando(true)
    try {
      await relatoriosService.pdfAtendimento(eventoId)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <View style={estilos.bloco} accessibilityLabel="Relatório do atendimento">
      <View style={{ gap: 2 }}>
        <Texto peso={700} style={{ color: cores.cafeEscuro }}>
          Relatório do atendimento
        </Texto>
        <Texto style={estilos.apoio}>
          {relatorio === undefined
            ? 'Carregando…'
            : relatorio
              ? `Preenchido · atualizado em ${formatDateBr(relatorio.atualizadoEm.slice(0, 10))}`
              : 'Ainda não preenchido'}
        </Texto>
      </View>
      <View style={estilos.acoes}>
        <PillButton size="sm" variant={relatorio ? 'contorno' : 'solido'} onPress={() => onEditar(relatorio ?? null)}>
          <PencilIcon size={14} />
          {relatorio ? 'Editar' : 'Preencher'}
        </PillButton>
        <PillButton size="sm" variant="contorno" onPress={baixar} loading={baixando}>
          <DownloadIcon size={14} />
          PDF
        </PillButton>
      </View>
    </View>
  )
}

/** Formulário do relatório de um atendimento (RelatorioAtendimentoDialog do site). */
export function RelatorioAtendimentoDialog({ eventoId, titulo, relatorio, onClose, onSaved }) {
  const toast = useToast()
  const { user } = useAuth()
  const [valores, setValores] = useState(() => ({
    queixa: relatorio?.queixa ?? '',
    avaliacao: relatorio?.avaliacao ?? '',
    procedimentos: relatorio?.procedimentos ?? '',
    diagnostico: relatorio?.diagnostico ?? '',
    orientacoes: relatorio?.orientacoes ?? '',
    pesoKg: decimal(relatorio?.pesoKg),
    temperaturaC: decimal(relatorio?.temperaturaC),
    retorno: relatorio?.retorno ? formatDateBr(relatorio.retorno) : '',
    responsavel: relatorio?.responsavel ?? user?.name ?? '',
  }))
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const set = (campo, mascara) => (v) => {
    setValores((atual) => ({ ...atual, [campo]: mascara ? mascara(v) : v }))
    setErros((atual) => ({ ...atual, [campo]: '' }))
  }

  const salvar = async (baixarDepois) => {
    const retorno = valores.retorno ? parseDateBr(valores.retorno) : null
    if (valores.retorno && !retorno) return setErros({ retorno: 'Use o formato dd/mm/aaaa.' })
    setSalvando(true)
    try {
      const salvo = await relatoriosService.salvarAtendimento(eventoId, {
        ...valores,
        pesoKg: parseDecimal(valores.pesoKg),
        temperaturaC: parseDecimal(valores.temperaturaC),
        retorno,
      })
      toast.success('Relatório salvo.')
      if (baixarDepois) await relatoriosService.pdfAtendimento(eventoId)
      onSaved(salvo)
    } catch (err) {
      if (err.fields) setErros(err.fields)
      toast.error(err.message)
      setSalvando(false)
    }
  }

  const area = (campo, label, placeholder, max) => (
    <Field
      label={label}
      as="textarea"
      span={2}
      maxLength={max}
      placeholder={placeholder}
      value={valores[campo]}
      onChange={set(campo)}
      error={erros[campo]}
    />
  )

  return (
    <Dialog
      open
      onClose={onClose}
      title="Relatório do atendimento"
      description={titulo}
      size="lg"
      footer={
        <>
          <PillButton variant="contorno" onPress={onClose} disabled={salvando}>
            Cancelar
          </PillButton>
          <PillButton variant="contorno" onPress={() => salvar(true)} loading={salvando}>
            <DownloadIcon size={15} />
            Salvar e baixar PDF
          </PillButton>
          <PillButton onPress={() => salvar(false)} loading={salvando}>
            Salvar relatório
          </PillButton>
        </>
      }
    >
      <FieldGrid>
        {area('queixa', 'Queixa principal', 'O que o tutor relatou: sintomas, desde quando…', 1000)}
        <Field
          label="Peso (kg)"
          inputMode="decimal"
          value={valores.pesoKg}
          onChange={set('pesoKg', (v) => maskDecimal(v, 5))}
          error={erros.pesoKg}
        />
        <Field
          label="Temperatura (°C)"
          inputMode="decimal"
          placeholder="Ex.: 38,5"
          value={valores.temperaturaC}
          onChange={set('temperaturaC', (v) => maskDecimal(v, 5))}
          error={erros.temperaturaC}
        />
        {area('avaliacao', 'Avaliação e exame físico', 'Mucosas, hidratação, ausculta, pele, dor…', 2000)}
        {area('procedimentos', 'Procedimentos realizados', '', 2000)}
        {area('diagnostico', 'Diagnóstico', '', 1000)}
        {area('orientacoes', 'Orientações ao tutor', 'Medicação, cuidados em casa, sinais de alerta…', 2000)}
        <Field
          label="Retorno"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          value={valores.retorno}
          onChange={set('retorno', maskDate)}
          error={erros.retorno}
        />
        <Field
          label="Assinatura"
          maxLength={120}
          placeholder="Nome e CRMV"
          hint="Aparece no fim do PDF."
          value={valores.responsavel}
          onChange={set('responsavel')}
          error={erros.responsavel}
        />
      </FieldGrid>
    </Dialog>
  )
}

const estilos = StyleSheet.create({
  bloco: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: cores.borda,
    borderLeftColor: cores.caramelo,
    borderRadius: 14,
    backgroundColor: cores.cremeClaro,
  },
  apoio: { fontSize: 16, color: cores.taupe },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
