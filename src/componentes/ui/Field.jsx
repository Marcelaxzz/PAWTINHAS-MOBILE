import { forwardRef, useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '../../web/components/Icons/Icons.jsx'
import { normalize } from '../../web/utils/text.js'
import { cores, texto } from '../../tema.js'
import { Texto, Titulo } from '../Texto.jsx'
import { Grade } from './Grade.jsx'

const FUNDOS = { branco: cores.branco, creme: cores.superficie, areia: cores.cremeClaro }

/**
 * Campo de formulário das telas internas (Field do site).
 * as: input | select | textarea · options: [{ value, label }]
 * onChange recebe o valor (no site, o evento).
 */
export const Field = forwardRef(function Field(
  {
    label,
    as = 'input',
    options = [],
    placeholder,
    error,
    hint,
    icon: Icon,
    required,
    variant = 'branco',
    caps = false,
    value,
    onChange,
    inputMode,
    maxLength,
    editable = true,
    style,
    labelStyle,
    span, // lido pela Grade: campo que ocupa a linha inteira
    ...props
  },
  ref,
) {
  const [foco, setFoco] = useState(false)
  const select = as === 'select'
  const area = as === 'textarea'

  return (
    <View style={[estilos.campo, style]}>
      <Texto peso={700} style={[estilos.rotulo, caps && estilos.caps, labelStyle]}>
        {caps ? label.toUpperCase() : label}
        {required ? <Texto style={{ color: cores.terracotaTexto }}> *</Texto> : null}
      </Texto>

      {select ? (
        <Seletor
          label={label}
          value={value}
          options={options}
          placeholder={placeholder}
          onChange={onChange}
          error={error}
          icon={Icon}
          fundo={FUNDOS[variant]}
          disabled={!editable || props.disabled}
        />
      ) : (
        <View
          style={[
            estilos.caixa,
            { backgroundColor: FUNDOS[variant] ?? cores.branco },
            area && estilos.caixaTexto,
            foco && estilos.caixaFoco,
            error && estilos.caixaErro,
          ]}
        >
          {Icon && <Icon size={16} color={cores.cafe} />}
          <TextInput
            ref={ref}
            value={value ?? ''}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={cores.taupe}
            multiline={area}
            textAlignVertical={area ? 'top' : 'center'}
            keyboardType={
              inputMode === 'numeric'
                ? 'number-pad'
                : inputMode === 'decimal'
                  ? 'decimal-pad'
                  : inputMode === 'email'
                    ? 'email-address'
                    : inputMode === 'tel'
                      ? 'phone-pad'
                      : 'default'
            }
            maxLength={maxLength}
            editable={editable}
            accessibilityLabel={label}
            accessibilityHint={error || hint}
            onFocus={() => setFoco(true)}
            onBlur={() => setFoco(false)}
            style={[estilos.controle, area && estilos.textarea, props.disabled && { opacity: 0.7 }]}
            {...props}
          />
        </View>
      )}

      {hint && !error ? <Texto style={estilos.dica}>{hint}</Texto> : null}
      {error ? (
        <Texto peso={500} style={estilos.erro} accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}
    </View>
  )
})

/** Grade dos formulários: duas colunas, uma só até 720 px (como no site). Campos com span={2} ocupam a linha. */
export function FieldGrid({ children, style }) {
  return (
    <Grade colunas={2} quebras={{ 720: 1 }} gap={16} linhaGap={20} esticar={false} style={style}>
      {children}
    </Grade>
  )
}

/** <select> do site: abre a lista de opções numa folha na parte de baixo da tela. */
function Seletor({ label, value, options, placeholder, onChange, error, icon: Icon, fundo, disabled }) {
  const [aberto, setAberto] = useState(false)
  const atual = options.find((o) => String(o.value) === String(value))

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${atual?.label ?? placeholder ?? 'nenhum'}`}
        accessibilityHint={error}
        style={[
          estilos.caixa,
          { backgroundColor: fundo ?? cores.branco },
          error && estilos.caixaErro,
          disabled && { opacity: 0.7 },
        ]}
      >
        {Icon && <Icon size={16} color={cores.cafe} />}
        <Texto numberOfLines={1} style={[estilos.valor, !atual && { color: cores.taupe }]}>
          {atual?.label ?? placeholder ?? ''}
        </Texto>
        <ChevronDownIcon size={16} color={cores.cafe} />
      </Pressable>
      <FolhaOpcoes
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={label}
        options={options}
        value={value}
        onChange={onChange}
      />
    </>
  )
}

/** Folha com as opções de um seletor (com busca quando a lista é longa). */
export function FolhaOpcoes({ aberto, onFechar, titulo, options, value, onChange }) {
  const [busca, setBusca] = useState('')
  const insets = useSafeAreaInsets()
  const comBusca = options.length > 8

  const filtradas = useMemo(() => {
    const termo = normalize(busca)
    return termo ? options.filter((o) => normalize(String(o.label)).includes(termo)) : options
  }, [busca, options])

  const fechar = () => {
    onFechar()
    setBusca('')
  }

  return (
    <Modal visible={aberto} transparent animationType="slide" onRequestClose={fechar} statusBarTranslucent>
      <View style={estilos.folhaFundo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityLabel="Fechar" />
        <View style={[estilos.folha, { paddingBottom: insets.bottom + 12 }]}>
          <View style={estilos.folhaTopo}>
            <Titulo style={estilos.folhaTitulo} numberOfLines={2}>
              {titulo}
            </Titulo>
            <Pressable
              onPress={fechar}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={estilos.folhaFechar}
            >
              <CloseIcon size={20} color={cores.cafeEscuro} />
            </Pressable>
          </View>
          {comBusca && (
            <View style={estilos.busca}>
              <SearchIcon size={16} color={cores.taupe} />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar…"
                placeholderTextColor={cores.taupe}
                autoCorrect={false}
                style={[estilos.controle, { minHeight: 42 }]}
              />
            </View>
          )}
          <FlatList
            data={filtradas}
            keyExtractor={(o) => String(o.value)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Texto style={estilos.vazio}>Nenhuma opção encontrada.</Texto>}
            renderItem={({ item }) => {
              const marcado = String(item.value) === String(value)
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value)
                    fechar()
                  }}
                  disabled={item.disabled}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: marcado, disabled: item.disabled }}
                  style={({ pressed }) => [
                    estilos.opcao,
                    (pressed || marcado) && estilos.opcaoAtiva,
                    item.disabled && { opacity: 0.5 },
                  ]}
                >
                  <Texto peso={marcado ? 700 : 500} style={estilos.opcaoTexto}>
                    {item.label}
                  </Texto>
                  {marcado && <CheckIcon size={18} color={cores.cafe} strokeWidth={2.6} />}
                </Pressable>
              )
            }}
          />
        </View>
      </View>
    </Modal>
  )
}

const estilos = StyleSheet.create({
  campo: { gap: 8, minWidth: 0 },
  rotulo: { fontSize: 16, lineHeight: 20, color: cores.cafeEscuro },
  caps: { fontSize: 15, letterSpacing: 0.13 },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
  },
  caixaTexto: { alignItems: 'stretch', paddingHorizontal: 0 },
  caixaFoco: { borderColor: cores.caramelo },
  caixaErro: { borderColor: cores.erro },
  controle: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    padding: 0,
    fontSize: 17,
    color: cores.cafeEscuro,
    ...texto(400),
  },
  textarea: { minHeight: 100, paddingVertical: 14, paddingHorizontal: 16, lineHeight: 25 },
  valor: { flex: 1, fontSize: 17, color: cores.cafeEscuro },
  dica: { fontSize: 15, lineHeight: 20, color: cores.taupe },
  erro: { fontSize: 15, lineHeight: 20, color: cores.erro },

  folhaFundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(54, 36, 26, 0.45)' },
  folha: {
    maxHeight: '80%',
    paddingTop: 18,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: cores.cremeClaro,
  },
  folhaTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12, paddingHorizontal: 4 },
  folhaTitulo: { flex: 1, fontSize: 25, lineHeight: 32 },
  folhaFechar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.branco,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  opcaoAtiva: { backgroundColor: 'rgba(216, 161, 107, 0.18)' },
  opcaoTexto: { flex: 1, fontSize: 17, color: cores.cafeEscuro },
  vazio: { padding: 16, textAlign: 'center', color: cores.taupe },
})
