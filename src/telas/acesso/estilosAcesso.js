import { StyleSheet } from 'react-native'
import { cores } from '../../tema.js'

/** Estilos compartilhados pelas telas de acesso (AuthPages.module.css do site). */
export const estilosAcesso = StyleSheet.create({
  titulo: { fontSize: 36, lineHeight: 42 },
  descricao: { marginTop: 10, fontSize: 17, lineHeight: 27, color: cores.taupeEscuro },
  alerta: { marginTop: 22 },
  campos: { gap: 18, marginTop: 24 },
  linkForte: { fontSize: 16, color: cores.cafe },
  acao: { marginTop: 24 },
  voltar: { alignSelf: 'center', marginTop: 24 },
  otp: { marginTop: 24 },
  otpAlerta: { marginTop: 20 },
  reenvio: { alignItems: 'center', gap: 6, marginTop: 22 },
  contador: { fontSize: 16, color: cores.taupe, fontVariant: ['tabular-nums'] },
  botaoReenviar: { paddingVertical: 4, paddingHorizontal: 8 },
})
