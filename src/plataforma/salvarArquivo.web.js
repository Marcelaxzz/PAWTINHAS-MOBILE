/** No navegador, o arquivo é baixado como no site. */
export async function salvarArquivo(conteudo, nome, tipo = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
