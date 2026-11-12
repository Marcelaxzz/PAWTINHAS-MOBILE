import { useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { AlertIcon, CheckIcon } from '../web/components/Icons/Icons.jsx'
import { cores, texto } from '../tema.js'
import { Texto } from './Texto.jsx'

/** Caixa de seleção (Checkbox do site). */
export function Checkbox({ label, checked, onChange }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      hitSlop={6}
      style={estilos.checkbox}
    >
      <View style={[estilos.caixa, checked && estilos.caixaMarcada]}>
        {checked && <CheckIcon size={11} strokeWidth={3} color={cores.branco} />}
      </View>
      <Texto style={estilos.checkTexto}>{label}</Texto>
    </Pressable>
  )
}

/** Aviso dentro do formulário (FormAlert do site). tone: erro | sucesso */
export function AlertaForm({ tone = 'erro', children }) {
  if (!children) return null
  const sucesso = tone === 'sucesso'
  const Icon = sucesso ? CheckIcon : AlertIcon
  const cor = sucesso ? cores.sucesso : cores.erro
  return (
    <View
      accessibilityRole={sucesso ? 'text' : 'alert'}
      accessibilityLiveRegion="polite"
      style={[estilos.alerta, sucesso ? estilos.alertaSucesso : estilos.alertaErro]}
    >
      <Icon size={16} color={cor} style={{ marginTop: 1 }} />
      <Texto peso={500} style={[estilos.alertaTexto, { color: cor }]}>
        {children}
      </Texto>
    </View>
  )
}

/**
 * Código de 6 dígitos (OtpInput do site). Um campo invisível recebe a digitação, a colagem e o
 * preenchimento automático do código; as seis caixas mostram cada dígito.
 */
export function OtpInput({ length = 6, onChange, onComplete, disabled = false, invalid = false }) {
  const [codigo, setCodigo] = useState('')
  const [foco, setFoco] = useState(false)
  const entrada = useRef(null)

  const mudar = (valor) => {
    const limpo = valor.replace(/\D/g, '').slice(0, length)
    setCodigo(limpo)
    onChange?.(limpo)
    if (limpo.length === length) onComplete?.(limpo)
  }

  return (
    <Pressable
      onPress={() => entrada.current?.focus()}
      accessibilityLabel="Código de verificação de 6 dígitos"
      style={estilos.grupo}
    >
      {Array.from({ length }, (_, i) => {
        const digito = codigo[i] ?? ''
        const atual = foco && i === Math.min(codigo.length, length - 1)
        return (
          <View
            key={i}
            style={[
              estilos.digito,
              digito && estilos.preenchido,
              atual && estilos.digitoFoco,
              invalid && estilos.invalido,
              disabled && { opacity: 0.6 },
            ]}
          >
            <Texto peso={700} style={estilos.digitoTexto}>
              {digito}
            </Texto>
          </View>
        )
      })}
      <TextInput
        ref={entrada}
        value={codigo}
        onChangeText={mudar}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus
        caretHidden
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        accessibilityLabel="Código de verificação"
        style={estilos.oculto}
      />
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caixa: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.bordaForte,
    borderRadius: 5,
  },
  caixaMarcada: { backgroundColor: cores.cafe, borderColor: cores.cafe },
  checkTexto: { fontSize: 16, color: cores.taupeEscuro },

  alerta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertaErro: { backgroundColor: cores.erroFundo, borderColor: 'rgba(179, 38, 30, 0.2)' },
  alertaSucesso: { backgroundColor: cores.sucessoFundo, borderColor: 'rgba(63, 106, 69, 0.2)' },
  alertaTexto: { flex: 1, fontSize: 15, lineHeight: 21 },

  grupo: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  digito: {
    flex: 1,
    maxWidth: 72,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 14,
  },
  preenchido: { backgroundColor: cores.branco, borderColor: cores.cafe },
  digitoFoco: { borderColor: cores.caramelo },
  invalido: { borderColor: cores.erro },
  digitoTexto: { fontSize: 25, lineHeight: 32, color: cores.cafeEscuro },
  oculto: { position: 'absolute', width: '100%', height: '100%', opacity: 0, color: 'transparent', ...texto(400) },
})
