import { useCallback, useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native'

const CORES = ['#d8a16b', '#d4566a', '#6f8f62', '#5b7f99', '#d9a441', '#8a76b0', '#c8573c']
const ouvintes = new Set()

/** Chuva de confete por cima de tudo (um animal foi adotado!). Some sozinha em ~4 s. */
export function soltarConfete() {
  ouvintes.forEach((ouvir) => ouvir())
}

/** Camada do confete, montada uma vez no layout raiz. Não bloqueia toques. */
export function CamadaConfete() {
  const [rodada, setRodada] = useState(0)

  useEffect(() => {
    const ouvir = () => {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((menosMovimento) => !menosMovimento && setRodada((n) => n + 1))
        .catch(() => setRodada((n) => n + 1))
    }
    ouvintes.add(ouvir)
    return () => ouvintes.delete(ouvir)
  }, [])

  const terminar = useCallback(() => setRodada(0), [])
  return rodada ? <Chuva key={rodada} onFim={terminar} /> : null
}

function Chuva({ onFim }) {
  const { width, height } = useWindowDimensions()
  const [pecas] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      x: Math.random() * width,
      desvio: (Math.random() - 0.5) * 160,
      giro: `${(Math.random() - 0.5) * 900}deg`,
      largura: 7 + Math.random() * 6,
      redonda: Math.random() < 0.3,
      pata: i % 9 === 0,
      cor: CORES[i % CORES.length],
      atraso: Math.random() * 450,
      duracao: 2200 + Math.random() * 1500,
      valor: new Animated.Value(0),
    })),
  )

  useEffect(() => {
    const animacao = Animated.parallel(
      pecas.map((p) =>
        Animated.timing(p.valor, {
          toValue: 1,
          duration: p.duracao,
          delay: p.atraso,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    )
    animacao.start(() => onFim())
    return () => animacao.stop()
  }, [pecas, onFim])

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pecas.map((p, i) => {
        const transform = [
          { translateX: p.valor.interpolate({ inputRange: [0, 1], outputRange: [0, p.desvio] }) },
          { translateY: p.valor.interpolate({ inputRange: [0, 1], outputRange: [-30, height + 40] }) },
          { rotate: p.valor.interpolate({ inputRange: [0, 1], outputRange: ['0deg', p.giro] }) },
        ]
        const opacity = p.valor.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] })
        return p.pata ? (
          <Animated.View key={i} style={[estilos.peca, { left: p.x, opacity, transform }]}>
            <Text style={estilos.pata}>🐾</Text>
          </Animated.View>
        ) : (
          <Animated.View
            key={i}
            style={[
              estilos.peca,
              {
                left: p.x,
                width: p.largura,
                height: p.largura * 0.6,
                borderRadius: p.redonda ? p.largura : 2,
                backgroundColor: p.cor,
                opacity,
                transform,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const estilos = StyleSheet.create({
  peca: { position: 'absolute', top: 0 },
  pata: { fontSize: 18 },
})
