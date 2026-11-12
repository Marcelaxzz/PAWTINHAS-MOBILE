import { StyleSheet, View } from 'react-native'
import { statusTone } from '../../web/utils/status.js'
import { cores } from '../../tema.js'
import { Texto } from '../Texto.jsx'

const TONS = {
  neutro: { backgroundColor: 'rgba(110, 77, 54, 0.08)', color: cores.cafe },
  tag: { backgroundColor: 'rgba(216, 161, 107, 0.18)', color: cores.cafe },
  sucesso: { backgroundColor: cores.salviaFundo, color: cores.salviaTexto },
  perigo: { backgroundColor: cores.terracotaFundo, color: cores.terracotaTexto },
  alerta: { backgroundColor: cores.melFundo, color: cores.melTexto },
  info: { backgroundColor: cores.ceuFundo, color: cores.ceuTexto },
}

const TAMANHOS = {
  md: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 16 },
  sm: { paddingVertical: 3, paddingHorizontal: 11, fontSize: 15 },
  xs: { paddingVertical: 3, paddingHorizontal: 10, fontSize: 15 },
}

/**
 * Etiquetas de status, idade, raça e serviço.
 * tone: neutro (idade/raça), tag (serviço), sucesso, perigo, alerta, info
 */
export function Chip({ tone = 'neutro', size = 'md', children, style }) {
  const { backgroundColor, color } = TONS[tone] ?? TONS.neutro
  const { fontSize, ...espaco } = TAMANHOS[size] ?? TAMANHOS.md
  return (
    <View style={[estilos.chip, espaco, { backgroundColor }, style]}>
      <Texto peso={600} numberOfLines={1} style={{ fontSize, lineHeight: Math.round(fontSize * 1.2), color }}>
        {children}
      </Texto>
    </View>
  )
}

export function StatusChip({ status, size = 'sm' }) {
  return (
    <Chip tone={statusTone(status)} size={size}>
      {status}
    </Chip>
  )
}

const estilos = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, borderRadius: 999 },
})
