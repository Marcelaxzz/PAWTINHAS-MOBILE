import { Children, Fragment } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CloseIcon } from '../../web/components/Icons/Icons.jsx'
import { cores, sombras } from '../../tema.js'
import { Texto, Titulo } from '../Texto.jsx'

/**
 * Janela modal (Dialog do site): fecha no X, no fundo escurecido e no botão voltar do Android.
 * size: sm | md | lg · tone: claro | escuro (cabeçalho café)
 */
/** Largura máxima de cada tamanho, a mesma do site. */
const LARGURAS = { sm: 440, md: 560, lg: 880 }

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', tone = 'claro' }) {
  const insets = useSafeAreaInsets()
  const escuro = tone === 'escuro'

  return (
    <Modal visible={Boolean(open)} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[estilos.fundo, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <View
          style={[estilos.dialogo, { maxWidth: LARGURAS[size] ?? LARGURAS.md }, sombras.card]}
          accessibilityViewIsModal
        >
          <View style={[estilos.cabecalho, escuro ? estilos.escuro : estilos.claro]}>
            <View style={{ flex: 1 }}>
              <Titulo style={[estilos.titulo, escuro && { color: cores.branco }]}>{title}</Titulo>
              {description ? (
                <Texto style={[estilos.descricao, escuro && { color: cores.branco }]}>{description}</Texto>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={estilos.fechar}
            >
              <CloseIcon size={20} color={escuro ? cores.branco : cores.cafeEscuro} />
            </Pressable>
          </View>
          <ScrollView
            style={estilos.corpo}
            contentContainerStyle={estilos.corpoConteudo}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? (
            <View style={estilos.rodape}>
              {/* No celular cada botão do rodapé ocupa a largura disponível, como no site. */}
              {Children.toArray(footer?.type === Fragment ? footer.props.children : footer).map((item, i) => (
                <View key={i} style={estilos.rodapeItem}>
                  {item}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/** Confirmação para ações destrutivas. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Pressable
            onPress={onClose}
            disabled={loading}
            accessibilityRole="button"
            style={({ pressed }) => [estilos.botao, estilos.secundario, pressed && { backgroundColor: cores.creme }]}
          >
            <Texto peso={700} style={estilos.botaoTexto}>
              Cancelar
            </Texto>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ busy: loading }}
            style={({ pressed }) => [estilos.botao, estilos.perigo, pressed && { backgroundColor: cores.erroEscuro }]}
          >
            <Texto peso={700} style={[estilos.botaoTexto, { color: cores.branco }]}>
              {loading ? 'Aguarde…' : confirmLabel}
            </Texto>
          </Pressable>
        </>
      }
    >
      <Texto style={estilos.mensagem}>{message}</Texto>
    </Dialog>
  )
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(54, 36, 26, 0.45)',
  },
  dialogo: {
    maxHeight: '100%',
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: cores.cremeClaro,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 20,
    paddingRight: 14,
    paddingBottom: 14,
    paddingLeft: 20,
  },
  claro: { borderBottomWidth: 1, borderBottomColor: cores.borda },
  escuro: { backgroundColor: cores.cafe },
  titulo: { fontSize: 27, lineHeight: 33 },
  descricao: { marginTop: 6, fontSize: 16, lineHeight: 23, opacity: 0.85 },
  fechar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  corpo: { flexGrow: 0 },
  corpoConteudo: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 22 },
  rodape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  rodapeItem: { flexGrow: 1 },
  mensagem: { fontSize: 17, lineHeight: 26, color: cores.taupeEscuro },
  botao: {
    flexGrow: 1,
    minHeight: 42,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  secundario: { borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.branco },
  perigo: { backgroundColor: cores.erro },
  botaoTexto: { fontSize: 16, color: cores.cafeEscuro },
})
