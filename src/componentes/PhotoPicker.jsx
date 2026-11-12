import { useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { CameraIcon, UploadIcon } from '../web/components/Icons/Icons.jsx'
import { escolherFoto } from '../plataforma/fotos.js'
import { Dialog } from './ui/Dialog.jsx'
import { PillButton } from './ui/PillButton.jsx'
import { cores, sombras } from '../tema.js'
import { Texto } from './Texto.jsx'

/**
 * Área de envio de foto (PhotoPicker do site). No celular, toca e escolhe entre câmera e galeria;
 * a foto é reduzida e regravada sem metadados antes de ir para a API.
 */
export function PhotoPicker({
  value,
  onChange,
  label = 'Enviar foto do animal',
  hint = 'PNG ou JPG de até 5MB',
  variant = 'camera',
}) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [escolhendo, setEscolhendo] = useState(false)

  const escolher = async (origem) => {
    setEscolhendo(false)
    setBusy(true)
    setError('')
    try {
      const foto = await escolherFoto(origem)
      if (foto) onChange(foto.uri)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const Icon = variant === 'upload' ? UploadIcon : CameraIcon

  return (
    <View style={estilos.envolve}>
      {value ? (
        <Image
          source={{ uri: value }}
          style={[estilos.previa, sombras.suave]}
          contentFit="cover"
          accessibilityLabel="Pré-visualização da foto"
        />
      ) : null}
      <Pressable
        onPress={() => (Platform.OS === 'web' ? escolher('galeria') : setEscolhendo(true))}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={value ? 'Trocar foto' : label}
        style={({ pressed }) => [
          estilos.area,
          (pressed || busy) && estilos.areaAtiva,
          error && { borderColor: cores.erro },
        ]}
      >
        <Icon size={variant === 'upload' ? 18 : 22} color={cores.cafe} />
        <Texto peso={700} style={estilos.titulo}>
          {busy ? 'Processando imagem…' : value ? 'Trocar foto' : label}
        </Texto>
        <Texto style={estilos.dica}>{hint}</Texto>
      </Pressable>
      {error ? (
        <Texto peso={500} style={estilos.erro} accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}

      <Dialog
        open={escolhendo}
        onClose={() => setEscolhendo(false)}
        title="Foto"
        footer={
          <>
            <PillButton variant="contorno" onPress={() => escolher('galeria')}>
              <UploadIcon size={15} />
              Galeria
            </PillButton>
            <PillButton onPress={() => escolher('camera')}>
              <CameraIcon size={15} />
              Câmera
            </PillButton>
          </>
        }
      >
        <Texto style={{ color: cores.taupeEscuro }}>Tire uma foto agora ou escolha uma da galeria do celular.</Texto>
      </Dialog>
    </View>
  )
}

const estilos = StyleSheet.create({
  envolve: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  previa: { width: 100, height: 100, borderRadius: 14 },
  area: {
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
    borderRadius: 18,
    backgroundColor: cores.superficie,
  },
  areaAtiva: { borderColor: cores.caramelo, backgroundColor: 'rgba(216, 161, 107, 0.1)' },
  titulo: { fontSize: 16, color: cores.cafe, textAlign: 'center' },
  dica: { fontSize: 15, color: cores.taupe, textAlign: 'center' },
  erro: { flexBasis: '100%', fontSize: 15, color: cores.erro },
})
