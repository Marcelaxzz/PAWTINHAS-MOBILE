import { StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg'
import { Texto } from '../componentes/Texto.jsx'
import { LIGACOES } from '../web/pages/panel/Alarmes/ligacoesAlarme.js'
import { cores } from '../tema.js'

const Y = [62, 98, 134, 170, 236, 272, 308]
const BRANCO = { fill: '#ffffff', fontSize: 17, fontWeight: '700' }

/** Esquema de ligação do alarme (EsquemaAlarme do site) e a tabela de pinos. */
export function EsquemaAlarme() {
  return (
    <View style={{ gap: 16 }}>
      <View style={estilos.quadro}>
        <Svg
          viewBox="0 0 640 350"
          width="100%"
          style={{ aspectRatio: 640 / 350 }}
          accessibilityLabel={`Esquema de ligação: ${LIGACOES.map((l) => `${l.peca} ${l.pino} no pino ${l.esp} do ESP32`).join(', ')}.`}
        >
          <Rect x="30" y="28" width="190" height="304" rx="12" fill="#1f2a2e" />
          <SvgText x="62" y="186" fill="#ffffff" fontSize="30" fontWeight="800">
            ESP32
          </SvgText>
          <Rect x="50" y="300" width="36" height="22" rx="4" fill="#b9c0c2" />
          <SvgText x="96" y="316" fill="#c9d1d3" fontSize="13">
            USB
          </SvgText>

          <Rect x="420" y="34" width="190" height="158" rx="10" fill="#2c6e49" />
          <Rect x="500" y="56" width="96" height="44" rx="4" fill="#3d6fd1" />
          <SvgText x="548" y="84" textAnchor="middle" {...BRANCO}>
            16x2
          </SvgText>
          <SvgText x="548" y="180" textAnchor="middle" {...BRANCO}>
            Display LCD
          </SvgText>

          <Rect x="420" y="214" width="190" height="118" rx="10" fill="#2c6e49" />
          <Circle cx="560" cy="268" r="26" fill="#1b1b1b" />
          <SvgText x="560" y="322" textAnchor="middle" {...BRANCO}>
            Buzzer
          </SvgText>

          {LIGACOES.map((l, i) => (
            <G key={i}>
              <Line x1="220" x2="420" y1={Y[i]} y2={Y[i]} stroke={l.cor} strokeWidth="5" strokeLinecap="round" />
              <Circle cx="220" cy={Y[i]} r="5" fill={l.cor} />
              <Circle cx="420" cy={Y[i]} r="5" fill={l.cor} />
              <SvgText x="208" y={Y[i] + 5} textAnchor="end" {...BRANCO}>
                {l.esp}
              </SvgText>
              <SvgText x="432" y={Y[i] + 5} {...BRANCO}>
                {l.pino}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>

      <View>
        <View style={[estilos.linha, estilos.cabecalho]}>
          {['Peça', 'Pino da peça', 'Pino do ESP32'].map((t) => (
            <Texto key={t} peso={700} style={estilos.th}>
              {t}
            </Texto>
          ))}
        </View>
        {LIGACOES.map((l, i) => (
          <View key={i} style={estilos.linha}>
            <View style={[estilos.celula, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[estilos.fio, { backgroundColor: l.cor }]} />
              <Texto style={estilos.td}>{l.peca}</Texto>
            </View>
            <Texto style={[estilos.celula, estilos.td]}>{l.pino}</Texto>
            <Texto peso={800} style={[estilos.celula, estilos.td]}>
              {l.esp}
            </Texto>
          </View>
        ))}
      </View>

      <Texto style={estilos.nota}>
        Use jumpers fêmea-fêmea, ligando pino com pino. O programa e o passo a passo de gravação estão na pasta
        firmware/alarme-esp32 do projeto da API.
      </Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  quadro: {
    padding: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 16,
    backgroundColor: cores.cremeClaro,
  },
  linha: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: cores.borda },
  cabecalho: { borderBottomWidth: 2 },
  celula: { flex: 1, paddingVertical: 8, paddingHorizontal: 6 },
  th: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 15, color: cores.taupe },
  td: { fontSize: 17, color: cores.cafeEscuro },
  fio: { width: 14, height: 6, borderRadius: 3 },
  nota: { fontSize: 16, lineHeight: 23, color: cores.taupeEscuro },
})
