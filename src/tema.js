import { Dimensions, Platform } from 'react-native'
import { estilosRegistrados } from './estilosRegistrados.js'
import { lerTemaSalvo, salvarTema } from './preferenciaTema'

/*
 * Tamanho das letras de acordo com a tela: ~86% no celular (360-430px de largura),
 * subindo até 94% no tablet. fs(16) = tamanho de 16 já ajustado à tela.
 */
const larguraTela = Math.min(Dimensions.get('window').width || 390, 1024)
export const escalaFonte = Math.min(0.94, Math.max(0.85, 0.85 + ((larguraTela - 360) / 664) * 0.09))
export const fs = (n) => Math.round(n * escalaFonte * 2) / 2

/** Paleta clara do site (styles/global.css), com os mesmos nomes. */
const CLARO = {
  areia: '#f4e6d3',
  creme: '#fbf6eb',
  cremeClaro: '#f9f6ef',
  borda: '#e9dfca',
  caramelo: '#d8a16b',
  carameloEscuro: '#c18c5e',
  ferrugem: '#8a4f26',
  cafe: '#6e4d36',
  cafeMedio: '#493424',
  cafeEscuro: '#36241a',
  taupe: '#897260',
  taupeEscuro: '#6e574b',
  branco: '#ffffff',
  cafeHover: '#5d402c',
  bordaForte: '#d9cdb8',
  superficie: '#fffdf9',
  fotoVazia: '#ecdfcc',

  erro: '#b3261e',
  erroEscuro: '#8f1d17',
  erroFundo: '#fbe9e7',
  erroFundoForte: '#f6d3cd',
  sucesso: '#3f6a45',
  sucessoFundo: '#e7efe0',
  aviso: '#8a5f12',
  avisoFundo: '#fbf0d6',

  salvia: '#6f8f62',
  salviaTexto: '#3f6a45',
  salviaFundo: '#e7efe0',
  ceu: '#5b7f99',
  ceuTexto: '#3d6079',
  ceuFundo: '#e2edf3',
  mel: '#d9a441',
  melTexto: '#8a5f12',
  melFundo: '#fbf0d6',
  rosa: '#d4566a',
  rosaTexto: '#a83c4c',
  rosaFundo: '#fbe7e8',
  lavanda: '#8a76b0',
  lavandaTexto: '#5e4d82',
  lavandaFundo: '#ede7f6',
  terracota: '#c8573c',
  terracotaTexto: '#a8432c',
  terracotaFundo: '#fbe6dd',

  // Papel fixo (não mudam de sentido no modo escuro). Valores quase iguais aos de cima de propósito:
  // a troca de tema reconhece cada cor pelo valor, então cada nome precisa de um valor só seu.
  papel: '#fffffe',
  cafeFundo: '#6e4d37',
  cafeEscuroFundo: '#36241b',
  areiaFixa: '#f4e6d4',
  cremeFixo: '#fbf6ec',

  // Fundos translúcidos sobre fotos e cartões.
  vidroCreme: 'rgba(251, 246, 235, 0.95)',
  vidroSuperficie: 'rgba(255, 253, 249, 0.75)',
  vidroPapel: 'rgba(255, 255, 254, 0.85)',
  vidroCremeLeve: 'rgba(251, 246, 235, 0.6)',
}

/** Paleta escura: fundos em café bem escuro, textos em creme (igual ao modo escuro do site). */
const ESCURO = {
  ...CLARO,
  areia: '#1b1410',
  creme: '#211913',
  cremeClaro: '#261d17',
  borda: '#45362b',
  carameloEscuro: '#e3b282',
  ferrugem: '#e9a06a',
  cafe: '#e7c39b',
  cafeMedio: '#e4d4c2',
  cafeEscuro: '#f3e9dc',
  taupe: '#bba795',
  taupeEscuro: '#d0bfaf',
  cafeHover: '#8a6446',
  bordaForte: '#5c4a3b',
  superficie: '#2a2019',
  fotoVazia: '#3a2d24',

  erro: '#ff8f85',
  erroEscuro: '#ffb4ab',
  erroFundo: '#3b1d1a',
  erroFundoForte: '#522520',
  sucesso: '#93d29c',
  sucessoFundo: '#1d3122',
  aviso: '#f0c46a',
  avisoFundo: '#3a2e14',

  salviaTexto: '#93d29c',
  salviaFundo: '#1d3122',
  ceuTexto: '#a3c8e3',
  ceuFundo: '#1a2a35',
  melTexto: '#f0c46a',
  melFundo: '#3a2e14',
  rosaTexto: '#f5a5b1',
  rosaFundo: '#3e1f25',
  lavandaTexto: '#cbb9ef',
  lavandaFundo: '#2a2338',
  terracotaTexto: '#f5ab93',
  terracotaFundo: '#3e2219',

  papel: '#2e231c',
  cafeFundo: '#7a5539',

  vidroCreme: 'rgba(33, 25, 19, 0.95)',
  vidroSuperficie: 'rgba(42, 32, 25, 0.75)',
  vidroPapel: 'rgba(46, 35, 28, 0.85)',
  vidroCremeLeve: 'rgba(33, 25, 19, 0.6)',
}

export const temaInicial = lerTemaSalvo()
/** Cores atuais. O objeto é o mesmo o tempo todo: a troca de tema muda os valores dentro dele. */
export const cores = { ...(temaInicial === 'escuro' ? ESCURO : CLARO) }
export const temaAtual = () => (cores.areia === ESCURO.areia ? 'escuro' : 'claro')

const CHAVES_DE_COR = /^(color|backgroundColor|border(Top|Right|Bottom|Left)?Color|tintColor|textDecorationColor|placeholderTextColor|fill|stroke)$/

/**
 * Objeto que relê as cores a cada uso (para constantes como as variantes dos botões,
 * que precisam acompanhar a troca de tema).
 */
export function vivo(criar) {
  return new Proxy(
    {},
    {
      get: (_, chave) => {
        const atual = criar()
        const valor = atual[chave]
        return typeof valor === 'function' ? valor.bind(atual) : valor
      },
      has: (_, chave) => chave in criar(),
      ownKeys: () => Reflect.ownKeys(criar()),
      getOwnPropertyDescriptor: (_, chave) => {
        const d = Object.getOwnPropertyDescriptor(criar(), chave)
        return d && { ...d, configurable: true }
      },
    },
  )
}

/** Troca o tema na hora: atualiza os valores de cor dos estilos já criados e das cores. */
export function trocarTema() {
  const destino = temaAtual() === 'escuro' ? 'claro' : 'escuro'
  const de = destino === 'escuro' ? CLARO : ESCURO
  const para = destino === 'escuro' ? ESCURO : CLARO
  const mapa = {}
  for (const chave of Object.keys(para)) mapa[de[chave].toLowerCase()] = para[chave]
  for (const folha of estilosRegistrados) {
    for (const estilo of Object.values(folha)) {
      if (!estilo || typeof estilo !== 'object') continue
      for (const [chave, valor] of Object.entries(estilo)) {
        if (typeof valor !== 'string' || !CHAVES_DE_COR.test(chave)) continue
        const novo = mapa[valor.toLowerCase()]
        if (novo) estilo[chave] = novo
      }
    }
  }
  Object.assign(cores, para)
  salvarTema(destino)
  return destino
}



/** Gradientes do site: [início, fim] (90° = da esquerda para a direita). */
export const gradientes = {
  cafe: ['#6e4d36', '#36241a'],
  ferrugem: ['#8a4f26', '#36241a'],
  painel: ['#7a5539', '#5a3d2a', '#36241a'],
}

/** Fontes carregadas em app/_layout (no app, cada peso é uma família). */
export const FONTES = {
  Lexend_400Regular: require('@expo-google-fonts/lexend/400Regular/Lexend_400Regular.ttf'),
  Lexend_500Medium: require('@expo-google-fonts/lexend/500Medium/Lexend_500Medium.ttf'),
  Lexend_600SemiBold: require('@expo-google-fonts/lexend/600SemiBold/Lexend_600SemiBold.ttf'),
  Lexend_700Bold: require('@expo-google-fonts/lexend/700Bold/Lexend_700Bold.ttf'),
  Lexend_800ExtraBold: require('@expo-google-fonts/lexend/800ExtraBold/Lexend_800ExtraBold.ttf'),
  Fraunces_800ExtraBold: require('@expo-google-fonts/fraunces/800ExtraBold/Fraunces_800ExtraBold.ttf'),
  Fraunces_900Black: require('@expo-google-fonts/fraunces/900Black/Fraunces_900Black.ttf'),
  Fraunces_600SemiBold_Italic: require('@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf'),
}

const LEXEND = {
  400: 'Lexend_400Regular',
  500: 'Lexend_500Medium',
  600: 'Lexend_600SemiBold',
  700: 'Lexend_700Bold',
  800: 'Lexend_800ExtraBold',
}

/** Lexend (texto) no peso pedido. */
export const texto = (peso = 400) => ({ fontFamily: LEXEND[peso] ?? LEXEND[400] })
/** Fraunces (títulos), como os h1/h2 do site. */
export const serifa = (peso = 900) => ({ fontFamily: peso >= 900 ? 'Fraunces_900Black' : 'Fraunces_800ExtraBold' })

/** Escala de tamanhos do site, já ajustada à tela (fs). */
export const tamanho = {
  xs: fs(15),
  sm: fs(17),
  base: fs(18),
  md: fs(19),
  lg: fs(20),
  tituloSm: fs(23),
  tituloMd: fs(27),
  tituloLg: fs(34),
}

export const raio = { campo: 12, sm: 10, md: 16, lg: 24, card: 32, pilula: 999 }

/** Sombras equivalentes (no Android, elevation). */
function sombra(cor, opacidade, raioBlur, y, elevation) {
  return Platform.select({
    web: { boxShadow: `0 ${y}px ${raioBlur}px -${Math.round(raioBlur / 2)}px rgba(54, 36, 26, ${opacidade})` },
    default: {
      shadowColor: cor,
      shadowOpacity: opacidade,
      shadowRadius: raioBlur / 2,
      shadowOffset: { width: 0, height: y },
      elevation,
    },
  })
}

export const sombras = {
  botao: sombra('#36241a', 0.35, 24, 10, 6),
  suave: sombra('#36241a', 0.18, 30, 14, 2),
  media: sombra('#36241a', 0.3, 40, 22, 4),
  elevada: sombra('#36241a', 0.16, 32, 12, 3),
  card: sombra('#36241a', 0.18, 60, 30, 6),
}

/** Margem lateral das páginas no celular (clamp(16px, 4vw, 48px) do site). */
export const MARGEM = 16
