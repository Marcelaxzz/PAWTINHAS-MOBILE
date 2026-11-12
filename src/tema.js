import { Platform } from 'react-native'

/** Paleta e medidas do site (styles/global.css), com os mesmos nomes. */
export const cores = {
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

/** Escala de tamanhos do site (1rem = 18px). */
export const tamanho = {
  xs: 15,
  sm: 17,
  base: 18,
  md: 19,
  lg: 20,
  tituloSm: 23,
  tituloMd: 27,
  tituloLg: 34,
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
