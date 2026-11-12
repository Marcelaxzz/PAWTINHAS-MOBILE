/**
 * Fotos escolhidas no celular, antes de irem para a API (troca o services/arquivos.js do site).
 * A foto chega como arquivo local já reduzido e regravado em JPEG (veja plataforma/fotos.js).
 */

export function ehFotoNova(valor) {
  return typeof valor === 'string' && /^(file|content|ph|data:image\/)/.test(valor)
}

/** Corpo multipart com o campo "arquivo", como o site envia. */
export function formularioDaFoto(uri) {
  const formulario = new FormData()
  formulario.append('arquivo', { uri, name: 'foto.jpg', type: 'image/jpeg' })
  return formulario
}
