/** Fotos no Expo web: chegam como data URL, igual ao site (mesma conversão do services/arquivos.js). */

export function ehFotoNova(valor) {
  return typeof valor === 'string' && valor.startsWith('data:image/')
}

export function formularioDaFoto(dataUrl) {
  const [cabecalho, base64] = dataUrl.split(',')
  const tipo = cabecalho.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream'
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  const formulario = new FormData()
  formulario.append('arquivo', new Blob([bytes], { type: tipo }), 'foto')
  return formulario
}
