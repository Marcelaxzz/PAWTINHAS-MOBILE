import { useState } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Page } from '../componentes/Page.jsx'
import { Field } from '../componentes/ui/Field.jsx'
import { Grade } from '../componentes/ui/Grade.jsx'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { Texto, Titulo } from '../componentes/Texto.jsx'
import { CameraIcon } from '../web/components/Icons/Icons.jsx'
import { proteseTabs } from '../web/pages/protese/proteseTabs.js'
import { useToast } from '../web/hooks/useToast.js'
import { useCollections } from '../web/hooks/useCollections.js'
import { dataService } from '../web/services/dataService.js'
import { maskDecimal, parseDecimal } from '../web/utils/numbers.js'
import { usePetFromQuery } from './usePetFromQuery.js'
import { BotaoProtese, PacienteChip } from './comum.jsx'
import { SITE_URL } from '../config.js'
import { cores, gradientes, sombras } from '../tema.js'

/** As quatro medidas do modelo 3D (as mesmas da tela do site). */
const MEDIDAS = [
  { key: 'comprimentoMembro', label: 'Comprimento do membro', dica: 'Do cotovelo (ou joelho) até a ponta da pata' },
  { key: 'alturaChao', label: 'Altura até o chão', dica: 'Do fim do coto até o chão' },
  { key: 'larguraPata', label: 'Largura da pata', dica: 'De um lado ao outro, na parte mais larga' },
  { key: 'larguraEncaixe', label: 'Largura no encaixe', dica: 'Onde a prótese vai encaixar' },
]
const VAZIAS = Object.fromEntries(MEDIDAS.map((m) => [m.key, '']))
const MEMBROS = ['Anterior esquerdo', 'Anterior direito', 'Posterior esquerdo', 'Posterior direito']
const medidaValida = (n) => Number.isFinite(n) && n >= 0.1 && n <= 200

/**
 * Medição da prótese no app. A câmera com realidade aumentada (como o app Medida do iPhone) roda no
 * Chrome do celular, pela página do site: o Expo Go não tem acesso ao ARCore. As medidas feitas lá
 * vão direto para a ficha; aqui também dá para digitar o que foi medido com fita.
 */
export function TelaMedicao() {
  const router = useRouter()
  const toast = useToast()
  const { petId, pet, query } = usePetFromQuery()
  const { data } = useCollections(['pets'])
  const [medidas, setMedidas] = useState(VAZIAS)
  const [membro, setMembro] = useState('')
  const [petEscolhido, setPetEscolhido] = useState('')
  const [salvando, setSalvando] = useState(false)
  const alvo = petId ?? petEscolhido

  const abrirCamera = () => {
    const pet = alvo ? `?pet=${encodeURIComponent(alvo)}` : ''
    Linking.openURL(`${SITE_URL}/protese-3d${pet}`).catch(() =>
      toast.error('Não foi possível abrir o navegador do celular.'),
    )
  }

  const salvar = async () => {
    if (!alvo) return toast.error('Escolha o paciente.')
    if (!membro) return toast.error('Escolha qual membro foi medido.')
    const numeros = Object.fromEntries(MEDIDAS.map(({ key }) => [key, parseDecimal(medidas[key])]))
    const faltando = MEDIDAS.filter(({ key }) => !medidaValida(numeros[key]))
    if (faltando.length) return toast.error(`Falta: ${faltando.map((m) => m.label.toLowerCase()).join(', ')}.`)

    setSalvando(true)
    try {
      const agora = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      await dataService.create('medicoes', {
        petId: alvo,
        membro,
        metodo: 'Fita métrica',
        leituras: 1,
        ...Object.fromEntries(MEDIDAS.map(({ key }) => [key, numeros[key].toFixed(2)])),
        criadoEm: `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`,
      })
      toast.success('Medidas salvas. Agora é só gerar o modelo 3D.')
      router.push(`/protese-3d/modelo?pet=${encodeURIComponent(alvo)}`)
    } catch (err) {
      toast.error(err.message)
      setSalvando(false)
    }
  }

  return (
    <Page title="Medição para prótese" tabs={proteseTabs(query)}>
      {pet ? <PacienteChip pet={pet} /> : null}

      <View style={[estilos.cartao, sombras.suave]}>
        <LinearGradient colors={gradientes.painel} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.camera}>
          <View style={estilos.cameraTopo}>
            <View style={estilos.cameraIcone}>
              <CameraIcon size={24} color={cores.caramelo} />
            </View>
            <View style={{ flex: 1 }}>
              <Titulo peso={800} style={estilos.cameraTitulo}>
                Medir com a câmera
              </Titulo>
              <Texto style={estilos.cameraTexto}>
                Abre no Chrome do Android. As medidas aparecem na hora e já vão para a ficha.
              </Texto>
            </View>
          </View>
          <PillButton size="lg" variant="caramelo" onPress={abrirCamera}>
            Abrir câmera
          </PillButton>
        </LinearGradient>

        <Texto peso={700} style={estilos.ou}>
          Ou digite o que mediu com fita:
        </Texto>

        <Grade minimo={240} gap={14}>
          {!petId && (
            <Field
              label="Paciente"
              as="select"
              placeholder="Escolha…"
              options={[...(data?.pets ?? [])]
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((p) => ({ value: p.id, label: `${p.nome} · ${p.especie}` }))}
              value={petEscolhido}
              onChange={setPetEscolhido}
            />
          )}
          <Field
            label="Membro"
            as="select"
            placeholder="Escolha…"
            options={MEMBROS.map((m) => ({ value: m, label: m }))}
            value={membro}
            onChange={setMembro}
          />
          {MEDIDAS.map((m) => (
            <Field
              key={m.key}
              label={`${m.label} (cm)`}
              keyboardType="decimal-pad"
              placeholder="0,0"
              hint={m.dica}
              value={medidas[m.key]}
              onChange={(v) => setMedidas((atual) => ({ ...atual, [m.key]: maskDecimal(v, 5) }))}
            />
          ))}
        </Grade>

        <BotaoProtese onPress={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar medidas'}
        </BotaoProtese>
      </View>
    </Page>
  )
}

const estilos = StyleSheet.create({
  cartao: {
    gap: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  camera: { gap: 16, padding: 20, borderRadius: 20 },
  cameraTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cameraIcone: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  cameraTitulo: { fontSize: 23, lineHeight: 29, color: cores.branco },
  cameraTexto: { color: 'rgba(255, 255, 255, 0.85)' },
  ou: { color: cores.cafeEscuro },
})
