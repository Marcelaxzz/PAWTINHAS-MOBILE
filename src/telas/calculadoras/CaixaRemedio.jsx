import Svg, { Polygon, Rect, Text } from 'react-native-svg'
import { caixaDoRemedio } from '../../web/pages/calculadoras/Catalogos/caixaRemedio.js'

/** Posição de cada linha da frente da caixa: o nome, o princípio ativo e, embaixo, a concentração. */
function posicoes(c) {
  const tamTitulo = c.titulo.length <= 2 ? 21 : 18
  const titulo = c.titulo.map((texto, i) => ({ texto, y: 112 + i * (tamTitulo + 3) }))
  const inicioAtivo = 112 + c.titulo.length * (tamTitulo + 3) + 2
  const ativo = c.ativo.map((texto, i) => ({ texto, y: inicioAtivo + i * 13 }))
  return { tamTitulo, titulo, ativo, pillY: inicioAtivo + c.ativo.length * 13 + 4 }
}

/** Caixa do medicamento, igual à do site (CaixaRemedio.jsx do Front); as regras vêm de caixaRemedio.js. */
export function CaixaRemedio({ medicamento }) {
  const c = caixaDoRemedio(medicamento)
  const { tamTitulo, titulo, ativo, pillY } = posicoes(c)
  const larguraPill = Math.max(64, c.concentracao.length * 10.5 + 22)

  return (
    <Svg viewBox="0 0 250 300" width="100%" height="100%" accessibilityLabel={`Caixa de ${medicamento.nome}`}>
      <Polygon points="14,46 48,16 228,16 194,46" fill="#efe7dc" />
      <Polygon points="194,46 228,16 228,260 194,290" fill={c.cor} />
      <Polygon points="194,46 228,16 228,260 194,290" fill="#000" opacity="0.28" />
      <Rect x="14" y="46" width="180" height="244" fill="#fffdf9" />
      <Polygon points="14,262 194,196 194,262" fill={c.cor} opacity="0.1" />
      <Rect x="14" y="46" width="180" height="38" fill={c.cor} />
      <Text x="26" y="70" fontSize="11" fontFamily="Lexend_800ExtraBold" letterSpacing="1.6" fill="#fff">
        USO VETERINÁRIO
      </Text>

      {titulo.map((l) => (
        <Text key={`t${l.y}`} x="26" y={l.y} fontSize={tamTitulo} fontFamily="Lexend_800ExtraBold" fill="#2a1c12">
          {l.texto}
        </Text>
      ))}
      {ativo.map((l) => (
        <Text key={`a${l.y}`} x="26" y={l.y} fontSize="10.5" fill="#6b5a4c" fontFamily="Lexend_400Regular">
          {l.texto}
        </Text>
      ))}

      <Rect x="26" y={pillY} width={larguraPill} height="30" rx="8" fill={c.cor} />
      <Text x="37" y={pillY + 21} fontSize="17" fontFamily="Lexend_800ExtraBold" fill="#fff">
        {c.concentracao}
      </Text>
      {Boolean(c.extra) && (
        <Text x="26" y={pillY + 48} fontSize="11.5" fontFamily="Lexend_700Bold" fill={c.cor}>
          {c.extra}
        </Text>
      )}

      <Text x="26" y="236" fontSize="11.5" fontFamily="Lexend_700Bold" fill="#4a3a2e">
        {c.forma}
      </Text>
      <Text x="26" y="251" fontSize="10.5" fill="#6b5a4c" fontFamily="Lexend_400Regular">
        {c.via}
      </Text>
      <Rect x="14" y="262" width="180" height="28" fill="#d42a2f" />
      <Text
        x="104"
        y="273.5"
        fontSize="7.6"
        fontFamily="Lexend_800ExtraBold"
        fill="#fff"
        textAnchor="middle"
        letterSpacing="0.3"
      >
        VENDA SOB PRESCRIÇÃO DO
      </Text>
      <Text
        x="104"
        y="284"
        fontSize="7.6"
        fontFamily="Lexend_800ExtraBold"
        fill="#fff"
        textAnchor="middle"
        letterSpacing="0.3"
      >
        MÉDICO VETERINÁRIO
      </Text>
      <Rect x="14" y="46" width="180" height="244" fill="none" stroke="#000" strokeOpacity="0.08" />
    </Svg>
  )
}
