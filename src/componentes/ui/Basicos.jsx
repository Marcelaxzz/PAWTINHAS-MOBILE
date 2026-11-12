import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { AlertIcon } from '../../web/components/Icons/Icons.jsx'
import { cores, sombras } from '../../tema.js'
import { Texto, Titulo } from '../Texto.jsx'

/** Título das páginas internas, com subtítulo opcional (PageHeading do site). */
export function PageHeading({ title, subtitle }) {
  return (
    <View style={estilos.cabecalho}>
      <Titulo style={estilos.titulo}>{title}</Titulo>
      {subtitle ? <Texto style={estilos.subtitulo}>{subtitle}</Texto> : null}
    </View>
  )
}

export function LoadingState({ label = 'Carregando…' }) {
  return (
    <View style={estilos.estado} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={cores.cafe} />
      <Texto style={estilos.estadoTexto}>{label}</Texto>
    </View>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={[estilos.estado, estilos.estadoErro]} accessibilityRole="alert">
      <AlertIcon size={28} color={cores.erro} />
      <Texto style={[estilos.estadoTexto, { color: cores.erro }]}>{message}</Texto>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" style={[estilos.tentar, { borderColor: cores.erro }]}>
          <Texto peso={600} style={{ color: cores.erro }}>
            Tentar novamente
          </Texto>
        </Pressable>
      )}
    </View>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <View style={estilos.estado}>
      <Titulo style={estilos.vazioTitulo}>{title}</Titulo>
      {children ? <Texto style={[estilos.estadoTexto, { maxWidth: 420 }]}>{children}</Texto> : null}
      {action}
    </View>
  )
}

/** Barra de resumo no rodapé das listas ("Resumo de cirurgias…"). */
export function SummaryBar({ icon, children, actions, style }) {
  return (
    <View style={[estilos.barra, sombras.suave, style]} accessibilityLabel="Resumo">
      <View style={estilos.barraLinha}>
        {icon ? <View style={estilos.barraIcone}>{icon}</View> : null}
        <Texto peso={600} style={estilos.barraTexto}>
          {children}
        </Texto>
      </View>
      {actions ? <View style={estilos.barraAcoes}>{actions}</View> : null}
    </View>
  )
}

/** Interruptor (Toggle do site). */
export function Toggle({ checked, onChange, label, description, disabled, hideLabel = false }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      style={estilos.toggle}
    >
      {!hideLabel && (
        <View style={estilos.toggleTextos}>
          <Texto peso={600} style={estilos.toggleRotulo}>
            {label}
          </Texto>
          {description ? <Texto style={estilos.toggleDescricao}>{description}</Texto> : null}
        </View>
      )}
      <Chave ligada={checked} disabled={disabled} />
    </Pressable>
  )
}

/** A chave em si (48×26), também usada no formulário de alarme. */
export function Chave({ ligada, disabled }) {
  return (
    <View style={[estilos.chave, ligada && estilos.ligada, disabled && { opacity: 0.6 }]}>
      <View style={[estilos.bolinha, ligada && { transform: [{ translateX: 22 }] }]} />
    </View>
  )
}

const estilos = StyleSheet.create({
  cabecalho: { alignItems: 'center' },
  titulo: { fontSize: 34, lineHeight: 44, textAlign: 'center' },
  subtitulo: { maxWidth: 620, marginTop: 12, fontSize: 18, lineHeight: 27, color: cores.taupe, textAlign: 'center' },

  estado: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 246, 235, 0.6)',
  },
  estadoErro: { borderColor: 'rgba(179, 38, 30, 0.25)' },
  estadoTexto: { textAlign: 'center', color: cores.taupe, lineHeight: 26 },
  vazioTitulo: { fontSize: 25, lineHeight: 30, textAlign: 'center' },
  tentar: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 22, borderWidth: 1.5, borderRadius: 999 },

  barra: {
    gap: 12,
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  barraLinha: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  barraIcone: { alignItems: 'center', justifyContent: 'center' },
  barraTexto: { flex: 1, fontSize: 17, lineHeight: 26 },
  barraAcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  toggleTextos: { flex: 1, gap: 2 },
  toggleRotulo: { fontSize: 17 },
  toggleDescricao: { fontSize: 15, lineHeight: 20, color: cores.taupe },
  chave: { width: 48, height: 26, borderRadius: 999, backgroundColor: cores.bordaForte },
  ligada: { backgroundColor: cores.cafe },
  bolinha: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: cores.branco,
    ...sombras.elevada,
  },
})
