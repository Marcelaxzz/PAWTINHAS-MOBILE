import { useRef, useState } from 'react'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Circle, G, Polygon, Polyline, Text as SvgText } from 'react-native-svg'
import { cores, texto } from '../tema.js'

const ZOOM_LUPA = 3
const LADO_LUPA = 132
/**
 * Raio de toque para pegar um ponto já marcado (px de tela). Enquanto faltam pontos, só pega
 * quem toca bem em cima de um: assim dá para marcar duas pontas próximas.
 */
const RAIO_TOQUE = 26
const RAIO_TOQUE_MARCANDO = 11
/** Centro da lupa, descontada a borda branca de 3 px. */
const CENTRO_LUPA = (LADO_LUPA - 6) / 2

/**
 * Foto congelada com as marcações por cima (FotoMedicao do site). Só a camada ativa recebe
 * pontos novos e pode ser arrastada; as outras ficam visíveis para referência.
 * Coordenadas sempre em pixels da foto. Enquanto o dedo arrasta, a lupa mostra o entorno ampliado.
 *
 * camadas: [{ id, pontos, total, cor, fechada?, rotulo?, tracejada? }]
 */
export function FotoMedicao({ foto, camadas, ativa, onPontos, onArrasto }) {
  const arrasto = useRef(null)
  const [arrastando, setArrastando] = useState(null)
  const [largura, setLargura] = useState(0)
  const { height: alturaJanela } = useWindowDimensions()

  // Cabe na largura do cartão e em até 72% da altura da tela (max-height: 72vh no site).
  const proporcao = foto.height / foto.width
  const alturaMax = alturaJanela * 0.72
  const exibida =
    largura * proporcao > alturaMax
      ? { width: alturaMax / proporcao, height: alturaMax }
      : { width: largura, height: largura * proporcao }
  const escala = exibida.width ? foto.width / exibida.width : 1 // px da foto por px de tela

  const camadaAtiva = camadas.find((c) => c.id === ativa)

  // locationX/Y: posição do toque dentro da foto (a imagem e o desenho cobrem a área inteira).
  const paraFoto = (toque) => ({
    x: Math.min(foto.width, Math.max(0, toque.locationX * escala)),
    y: Math.min(foto.height, Math.max(0, toque.locationY * escala)),
  })

  const mover = (camadaId, indice, ponto) => {
    const camada = camadas.find((c) => c.id === camadaId)
    onPontos(
      camadaId,
      camada.pontos.map((p, i) => (i === indice ? ponto : p)),
    )
  }

  const comecar = (toque) => {
    if (!camadaAtiva) return
    const ponto = paraFoto(toque)
    const raio = (camadaAtiva.pontos.length < camadaAtiva.total ? RAIO_TOQUE_MARCANDO : RAIO_TOQUE) * escala
    const perto = camadaAtiva.pontos.findIndex((p) => Math.hypot(p.x - ponto.x, p.y - ponto.y) <= raio)
    if (perto >= 0) {
      arrasto.current = { camada: ativa, indice: perto }
    } else if (camadaAtiva.pontos.length < camadaAtiva.total) {
      // Ponto novo já nasce em arrasto: dá para ajustar sem soltar o dedo.
      onPontos(ativa, [...camadaAtiva.pontos, ponto])
      arrasto.current = { camada: ativa, indice: camadaAtiva.pontos.length }
    } else return
    setArrastando({ ...arrasto.current })
    onArrasto?.(true)
  }

  const responder = {
    onStartShouldSetResponder: () => Boolean(camadaAtiva),
    onMoveShouldSetResponder: () => Boolean(camadaAtiva),
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e) => comecar(e.nativeEvent),
    onResponderMove: (e) => {
      if (arrasto.current) mover(arrasto.current.camada, arrasto.current.indice, paraFoto(e.nativeEvent))
    },
    onResponderRelease: () => soltar(),
    onResponderTerminate: () => soltar(),
  }

  const soltar = () => {
    arrasto.current = null
    setArrastando(null)
    onArrasto?.(false)
  }

  const pontoLupa = arrastando ? camadas.find((c) => c.id === arrastando.camada)?.pontos[arrastando.indice] : null
  const lupaADireita = pontoLupa && pontoLupa.x < foto.width * 0.4 && pontoLupa.y < foto.height * 0.4
  const r = 9 * escala
  const traco = 2.5 * escala

  return (
    <View style={estilos.envolve} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 && (
        <View
          style={[
            { width: exibida.width, height: exibida.height },
            Platform.OS === 'web' && { touchAction: 'none', userSelect: 'none', cursor: 'crosshair' },
          ]}
          accessibilityLabel="Foto do paciente com as marcações da medição"
          {...responder}
        >
          <Image source={{ uri: foto.uri }} style={StyleSheet.absoluteFill} contentFit="fill" />
          <Svg
            width={exibida.width}
            height={exibida.height}
            viewBox={`0 0 ${foto.width} ${foto.height}`}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {camadas.map((c) => {
              const ativo = c.id === ativa
              const pts = c.pontos
              const lista = pts.map((p) => `${p.x},${p.y}`).join(' ')
              return (
                <G key={c.id} opacity={ativo || !ativa ? 1 : 0.55}>
                  {c.fechada && pts.length === c.total ? (
                    <Polygon points={lista} fill={c.cor} fillOpacity={0.18} stroke={c.cor} strokeWidth={traco} />
                  ) : (
                    pts.length > 1 && (
                      <Polyline
                        points={lista}
                        fill="none"
                        stroke={c.cor}
                        strokeWidth={traco}
                        strokeDasharray={c.tracejada ? [8 * escala, 6 * escala] : undefined}
                      />
                    )
                  )}
                  {c.rotulo && pts.length === 2 ? (
                    <>
                      <SvgText
                        x={(pts[0].x + pts[1].x) / 2 + 12 * escala}
                        y={(pts[0].y + pts[1].y) / 2 - 10 * escala}
                        fontSize={15 * escala}
                        fontFamily={texto(700).fontFamily}
                        stroke="rgba(54, 36, 26, 0.85)"
                        strokeWidth={4 * escala}
                        strokeLinejoin="round"
                        fill="rgba(54, 36, 26, 0.85)"
                      >
                        {c.rotulo}
                      </SvgText>
                      <SvgText
                        x={(pts[0].x + pts[1].x) / 2 + 12 * escala}
                        y={(pts[0].y + pts[1].y) / 2 - 10 * escala}
                        fontSize={15 * escala}
                        fontFamily={texto(700).fontFamily}
                        fill="#fff"
                      >
                        {c.rotulo}
                      </SvgText>
                    </>
                  ) : null}
                  {pts.map((p, i) => (
                    <Circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={arrastando?.camada === c.id && arrastando?.indice === i ? r * 1.25 : r}
                      fill={c.cor}
                      stroke="#fff"
                      strokeWidth={2.5 * escala}
                    />
                  ))}
                </G>
              )
            })}
          </Svg>

          {pontoLupa && (
            <View style={[estilos.lupa, lupaADireita ? { right: 14 } : { left: 14 }]} pointerEvents="none">
              <Image
                source={{ uri: foto.uri }}
                contentFit="fill"
                style={{
                  position: 'absolute',
                  width: foto.width * ZOOM_LUPA,
                  height: foto.height * ZOOM_LUPA,
                  left: CENTRO_LUPA - pontoLupa.x * ZOOM_LUPA,
                  top: CENTRO_LUPA - pontoLupa.y * ZOOM_LUPA,
                }}
              />
              <View style={estilos.miraV} />
              <View style={estilos.miraH} />
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  envolve: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  lupa: {
    position: 'absolute',
    top: 14,
    width: LADO_LUPA,
    height: LADO_LUPA,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: LADO_LUPA / 2,
    backgroundColor: cores.cafeEscuro,
  },
  miraV: { position: 'absolute', left: CENTRO_LUPA - 0.5, top: 0, bottom: 0, width: 1, backgroundColor: '#fff' },
  miraH: { position: 'absolute', top: CENTRO_LUPA - 0.5, left: 0, right: 0, height: 1, backgroundColor: '#fff' },
})
