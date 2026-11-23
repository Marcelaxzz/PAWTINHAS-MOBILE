import { StyleSheet } from 'react-native'
import { cores, fs } from '../../tema.js'

/** Estilos compartilhados pelas telas de acesso (AuthPages.module.css do site). */
export const estilosAcesso = StyleSheet.create({
  titulo: { fontSize: fs(36), lineHeight: fs(42) },
  descricao: { marginTop: 10, fontSize: fs(17), lineHeight: fs(27), color: cores.taupeEscuro },
  alerta: { marginTop: 22 },
  campos: { gap: 18, marginTop: 24 },
  linkForte: { fontSize: fs(16), color: cores.cafe },
  acao: { marginTop: 24 },
  voltar: { alignSelf: 'center', marginTop: 24 },
  otp: { marginTop: 24 },
  otpAlerta: { marginTop: 20 },
  reenvio: { alignItems: 'center', gap: 6, marginTop: 22 },
  contador: { fontSize: fs(16), color: cores.taupe, fontVariant: ['tabular-nums'] },
  botaoReenviar: { paddingVertical: 4, paddingHorizontal: 8 },
})
