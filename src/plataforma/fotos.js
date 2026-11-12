import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * Escolhe uma foto (câmera ou galeria), reduz para no máximo `ladoMaximo` px e regrava em JPEG,
 * o que descarta os metadados (EXIF, localização), como o site faz.
 * Devolve um arquivo local no celular ou uma data URL no navegador; null se a pessoa desistir.
 */
export async function escolherFoto(origem = 'galeria', { ladoMaximo = 960, qualidade = 0.85 } = {}) {
  const permissao =
    origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permissao.granted && Platform.OS !== 'web') {
    throw new Error(
      origem === 'camera'
        ? 'O acesso à câmera foi negado. Libere a permissão nos ajustes do celular para continuar.'
        : 'O acesso às fotos foi negado. Libere a permissão nos ajustes do celular para continuar.',
    )
  }

  const opcoes = { mediaTypes: ['images'], quality: 1, exif: false }
  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes)
  if (resultado.canceled || !resultado.assets?.length) return null

  const original = resultado.assets[0]
  if (
    original.mimeType &&
    !['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'].includes(original.mimeType)
  ) {
    throw new Error('Envie uma imagem PNG, JPG ou WebP.')
  }

  return reduzir(original.uri, original.width, original.height, { ladoMaximo, qualidade })
}

/** Reduz e regrava em JPEG. Também usado na medição da prótese (com lado maior). */
export async function reduzir(uri, largura, altura, { ladoMaximo = 960, qualidade = 0.85, base64 = false } = {}) {
  const escala = Math.min(1, ladoMaximo / Math.max(largura || ladoMaximo, altura || ladoMaximo))
  const contexto = ImageManipulator.manipulate(uri)
  if (escala < 1) contexto.resize({ width: Math.round(largura * escala) })
  const imagem = await contexto.renderAsync()
  const salva = await imagem.saveAsync({
    format: SaveFormat.JPEG,
    compress: qualidade,
    base64: base64 || Platform.OS === 'web',
  })
  const resultado = {
    uri: Platform.OS === 'web' ? `data:image/jpeg;base64,${salva.base64}` : salva.uri,
    width: salva.width,
    height: salva.height,
    dataUrl: salva.base64 ? `data:image/jpeg;base64,${salva.base64}` : null,
  }
  if (Platform.OS === 'web' && salva.base64.length * 0.75 > MAX_IMAGE_BYTES)
    throw new Error('A imagem deve ter até 5MB.')
  return resultado
}
