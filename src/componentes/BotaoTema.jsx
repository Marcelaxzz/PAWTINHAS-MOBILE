import { Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, G, Path } from 'react-native-svg'
import { cores, sombras } from '../tema.js'

/** Lua fixa no canto de baixo à esquerda: liga e desliga o modo escuro. */
export function BotaoTema({ escuro, onTrocar }) {
  const margens = useSafeAreaInsets()
  return (
    <Pressable
      onPress={onTrocar}
      accessibilityRole="switch"
      accessibilityState={{ checked: escuro }}
      accessibilityLabel={escuro ? 'Voltar para o modo claro' : 'Ativar o modo escuro'}
      hitSlop={8}
      style={({ pressed }) => [
        estilos.botao,
        { left: 14 + margens.left, bottom: 14 + margens.bottom, backgroundColor: cores.papel, borderColor: cores.bordaForte },
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      {escuro ? (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="4.2" fill={cores.cafe} />
          <G stroke={cores.cafe} strokeWidth="2" strokeLinecap="round">
            <Path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </G>
        </Svg>
      ) : (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path
            fill={cores.cafe}
            d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a.7.7 0 0 0-.9-.9A9.6 9.6 0 1 0 21.1 15.5a.7.7 0 0 0-.9-.9Z"
          />
        </Svg>
      )}
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  botao: {
    position: 'absolute',
    zIndex: 50,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 23,
    ...sombras.media,
  },
})
