import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

/**
 * Grava um arquivo gerado pelo app (backup, STL da prótese) e abre o compartilhamento do
 * sistema: dá para salvar em Arquivos/Drive, mandar por e-mail ou abrir no app da impressora.
 */
export async function salvarArquivo(conteudo, nome, tipo = 'application/octet-stream') {
  const arquivo = new File(Paths.cache, nome)
  if (arquivo.exists) arquivo.delete()
  arquivo.create()
  // PDFs e STL chegam como ArrayBuffer; o File grava texto ou Uint8Array.
  arquivo.write(conteudo instanceof ArrayBuffer ? new Uint8Array(conteudo) : conteudo)
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este celular não permite compartilhar arquivos.')
  await Sharing.shareAsync(arquivo.uri, { mimeType: tipo, dialogTitle: nome })
}
