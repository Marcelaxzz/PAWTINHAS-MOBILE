import { StyleSheet } from 'react-native'
import { cores } from '../tema.js'

/** Estilos compartilhados pelas listas do painel (panelLists.module.css do site). */
export const listas = StyleSheet.create({
  lista: { gap: 20 },
  horario: { fontSize: 16, color: cores.cafe },
  metaLinha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 8, marginTop: 2 },
  subtitulo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  subtituloTexto: { fontSize: 27, lineHeight: 34 },
  decoracaoRodape: { alignSelf: 'center', marginBottom: -56 },
})
