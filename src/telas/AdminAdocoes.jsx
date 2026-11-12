import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimalForm } from './AnimalForm.jsx'
import { ConfirmDialog } from '../componentes/ui/Dialog.jsx'
import { EmptyState, ErrorState, LoadingState } from '../componentes/ui/Basicos.jsx'
import { FolhaOpcoes } from '../componentes/ui/Field.jsx'
import {
  CloseIcon,
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  TrashIcon,
} from '../web/components/Icons/Icons.jsx'
import { useCollections } from '../web/hooks/useCollections.js'
import { Page } from '../componentes/Page.jsx'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { Texto, Titulo } from '../componentes/Texto.jsx'
import { useToast } from '../web/hooks/useToast.js'
import { dataService } from '../web/services/dataService.js'
import { relatoriosService } from '../web/services/gestaoService.js'
import { photoSrc } from '../plataforma/imagens.js'
import { sexoEspecie } from '../web/utils/adocao.js'
import { normalize } from '../web/utils/text.js'
import logoContorno from '../web/assets/images/logo-pawtinhas-contorno.webp'
import { cores, sombras, texto } from '../tema.js'
import { Grade } from '../componentes/ui/Grade.jsx'

const STATUS_FILTRO = ['Todos', 'Disponível', 'Em processo', 'Adotado']
const TONS = { cafe: cores.cafeEscuro, verde: cores.sucesso, ambar: cores.aviso, vermelho: cores.erro }

/** Animais para adoção (AdminAdocoes do site). Em /admin/adocoes/:id/editar, abre a edição por cima. */
export function AdminAdocoes() {
  const { id: editId } = useLocalSearchParams()
  const router = useRouter()
  const toast = useToast()
  const { data, loading, error, reload, patchLocal } = useCollections(['animais'])
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [filterOpen, setFilterOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [baixando, setBaixando] = useState(false)

  const baixarRelatorio = async () => {
    setBaixando(true)
    try {
      await relatoriosService.pdfAdocao()
      toast.success('Relatório de adoção pronto.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBaixando(false)
    }
  }

  const animais = useMemo(() => data?.animais ?? [], [data])
  const editing = editId ? animais.find((a) => a.id === editId) : null

  const stats = [
    { label: 'Total de animais', value: animais.length, tone: 'cafe' },
    { label: 'Disponíveis', value: animais.filter((a) => a.status === 'Disponível').length, tone: 'verde' },
    { label: 'Em processo', value: animais.filter((a) => a.status === 'Em processo').length, tone: 'ambar' },
    { label: 'Adotados', value: animais.filter((a) => a.status === 'Adotado').length, tone: 'vermelho' },
  ]

  const lista = animais.filter((a) => {
    const termo = normalize(busca)
    return (!termo || normalize(a.nome).includes(termo)) && (statusFiltro === 'Todos' || a.status === statusFiltro)
  })

  const fecharEdicao = () => (router.canGoBack() ? router.back() : router.replace('/admin/adocoes'))

  const salvarEdicao = async (payload) => {
    setBusy(true)
    try {
      const updated = await dataService.update('animais', editing.id, payload)
      patchLocal('animais', updated)
      toast.success(`${updated.nome} foi atualizado(a)!`)
      fecharEdicao()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const excluir = async () => {
    setBusy(true)
    try {
      await dataService.remove('animais', deleting.id)
      patchLocal('animais', deleting, 'remove')
      toast.success(`${deleting.nome} foi removido(a) do catálogo.`)
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page
      title="Animais para adoção"
      subtitle="Cadastre, edite e acompanhe os animais disponíveis para adoção."
      onRefresh={reload}
      actions={
        <>
          <PillButton to="/admin/adocoes/novo" size="lg">
            <PlusIcon size={18} strokeWidth={2.4} />
            Novo animal
          </PillButton>
          <PillButton variant="contorno" size="lg" onPress={baixarRelatorio} loading={baixando}>
            <DownloadIcon size={18} />
            Relatório em PDF
          </PillButton>
        </>
      }
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <>
          <Grade colunas={4} quebras={{ 1100: 2 }} gap={12}>
            {stats.map((s) => (
              <View key={s.label} style={[estilos.stat, sombras.suave]}>
                <Texto style={{ fontSize: 16, color: cores.taupe }}>{s.label}</Texto>
                <Texto peso={700} style={[estilos.statValor, { color: TONS[s.tone] }]}>
                  {s.value}
                </Texto>
              </View>
            ))}
          </Grade>

          <View style={estilos.barra}>
            <Titulo style={estilos.secao}>Animais cadastrados</Titulo>
            <View style={estilos.ferramentas}>
              <View style={estilos.busca}>
                <SearchIcon size={16} color={cores.taupe} />
                <TextInput
                  value={busca}
                  onChangeText={setBusca}
                  placeholder="Buscar por nome..."
                  placeholderTextColor={cores.taupe}
                  maxLength={60}
                  accessibilityLabel="Buscar por nome"
                  style={estilos.buscaEntrada}
                />
              </View>
              <Pressable
                onPress={() => setFilterOpen(true)}
                accessibilityRole="button"
                style={[estilos.filtrar, statusFiltro !== 'Todos' && { borderColor: cores.caramelo }]}
              >
                <SlidersIcon size={16} color={cores.cafeEscuro} />
                <Texto peso={600} style={{ fontSize: 16 }}>
                  Filtrar
                  {statusFiltro !== 'Todos' && (
                    <Texto style={{ fontSize: 16, color: cores.taupe }}>: {statusFiltro}</Texto>
                  )}
                </Texto>
              </Pressable>
              <FolhaOpcoes
                aberto={filterOpen}
                onFechar={() => setFilterOpen(false)}
                titulo="Status"
                options={STATUS_FILTRO.map((s) => ({ value: s, label: s }))}
                value={statusFiltro}
                onChange={setStatusFiltro}
              />
            </View>
          </View>

          {lista.length === 0 ? (
            <EmptyState title={animais.length ? 'Nenhum animal encontrado' : 'Nenhum animal cadastrado'}>
              {animais.length ? 'Tente outro nome ou limpe o filtro.' : 'Cadastre o primeiro animal para adoção.'}
            </EmptyState>
          ) : (
            <Grade colunas={3} quebras={{ 1100: 2, 680: 1 }} gap={26} style={{ marginTop: 18 }}>
              {lista.map((animal) => (
                <View key={animal.id} style={[estilos.card, sombras.suave]}>
                  <View style={estilos.foto}>
                    {photoSrc(animal.foto) ? (
                      <Image
                        source={{ uri: photoSrc(animal.foto) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        contentPosition={{ top: '25%' }}
                        accessibilityLabel={`Foto de ${animal.nome}`}
                      />
                    ) : null}
                    <View
                      style={[estilos.status, animal.status === 'Adotado' && { backgroundColor: cores.superficie }]}
                    >
                      <Texto
                        peso={600}
                        style={{ fontSize: 15, color: animal.status === 'Adotado' ? cores.taupe : cores.cafeEscuro }}
                      >
                        {animal.status}
                      </Texto>
                    </View>
                    <View style={estilos.selo}>
                      <Texto peso={700} style={{ fontSize: 15, color: cores.branco }}>
                        {sexoEspecie(animal).toUpperCase()}
                      </Texto>
                    </View>
                  </View>
                  <View style={estilos.corpo}>
                    <View style={estilos.nomeLinha}>
                      <Titulo style={{ flexShrink: 1, fontSize: 24, lineHeight: 29 }}>{animal.nome}</Titulo>
                      <Texto style={{ fontSize: 16, color: cores.taupe }}>{animal.idade}</Texto>
                    </View>
                    <Texto style={estilos.raca}>
                      {animal.raca || animal.especie} • Porte {animal.porte}
                    </Texto>
                    <View style={estilos.acoes}>
                      <Acao icon={EyeIcon} onPress={() => router.push(`/adocao/${animal.id}`)}>
                        Ver
                      </Acao>
                      <Acao icon={PencilIcon} onPress={() => router.push(`/admin/adocoes/${animal.id}/editar`)}>
                        Editar
                      </Acao>
                      <Acao icon={TrashIcon} perigo onPress={() => setDeleting(animal)}>
                        Excluir
                      </Acao>
                    </View>
                  </View>
                </View>
              ))}
            </Grade>
          )}
        </>
      )}

      {editId && data ? (
        <EditarAnimalModal animal={editing} saving={busy} onSave={salvarEdicao} onClose={fecharEdicao} />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={excluir}
        loading={busy}
        title={`Excluir ${deleting?.nome ?? ''}?`}
        message="O animal sai do catálogo de adoção e da lista de favoritos dos visitantes."
        confirmLabel="Excluir animal"
      />
    </Page>
  )
}

function Acao({ icon: Icon, perigo, onPress, children }) {
  const cor = perigo ? cores.erro : cores.cafeEscuro
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        estilos.acao,
        perigo && { backgroundColor: cores.erroFundo },
        pressed && { backgroundColor: perigo ? cores.erroFundoForte : 'rgba(110, 77, 54, 0.16)' },
      ]}
    >
      <Icon size={15} color={cor} />
      <Texto peso={600} style={{ fontSize: 15, color: cor }}>
        {children}
      </Texto>
    </Pressable>
  )
}

function EditarAnimalModal({ animal, onClose, onSave, saving }) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[estilos.modalFundo, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={[estilos.modal, sombras.card]} accessibilityViewIsModal>
          <View style={estilos.modalTopo}>
            <Image source={logoContorno} style={estilos.modalLogo} contentFit="contain" />
            <View style={{ flex: 1 }}>
              <View style={estilos.modalTituloLinha}>
                <Titulo style={{ fontSize: 27, lineHeight: 33, color: cores.branco }}>Editar animal</Titulo>
                {animal && (
                  <View style={estilos.modalId}>
                    <Texto peso={700} style={{ fontSize: 15, color: cores.branco }}>
                      ID #{animal.id.slice(-6).toUpperCase()}
                    </Texto>
                  </View>
                )}
              </View>
              <Texto style={{ marginTop: 6, color: 'rgba(255, 255, 255, 0.88)' }}>Altere o que mudou e salve.</Texto>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={estilos.modalFechar}
            >
              <CloseIcon size={22} color={cores.branco} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={estilos.modalCorpo} keyboardShouldPersistTaps="handled">
            {animal ? (
              <AnimalForm
                animal={animal}
                variant="modal"
                onSubmit={onSave}
                onCancel={onClose}
                saving={saving}
                submitLabel="Salvar alterações"
              />
            ) : (
              <EmptyState title="Animal não encontrado">Ele pode ter sido excluído.</EmptyState>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const estilos = StyleSheet.create({
  stat: {
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  statValor: { fontSize: 36, lineHeight: 39 },
  barra: { gap: 16, marginTop: 16 },
  secao: { fontSize: 27, lineHeight: 34 },
  ferramentas: { flexDirection: 'row', gap: 12 },
  busca: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 38,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.branco,
  },
  buscaEntrada: { flex: 1, minHeight: 38, padding: 0, fontSize: 16, color: cores.cafeEscuro, ...texto(400) },
  filtrar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.branco,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  foto: { aspectRatio: 432 / 220, backgroundColor: cores.fotoVazia },
  status: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: cores.caramelo,
  },
  selo: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: cores.cafeEscuro,
  },
  corpo: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 18 },
  nomeLinha: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  raca: { marginTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: cores.borda, color: cores.taupe },
  acoes: { flexDirection: 'row', gap: 12, marginTop: 12 },
  acao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(110, 77, 54, 0.08)',
  },
  modalFundo: { flex: 1, paddingHorizontal: 16, backgroundColor: 'rgba(249, 246, 239, 0.7)' },
  modal: { flex: 1, overflow: 'hidden', borderRadius: 28, backgroundColor: cores.superficie },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 54,
    backgroundColor: cores.cafe,
  },
  modalLogo: { width: 54, height: 71 },
  modalTituloLinha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 10 },
  modalId: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  modalFechar: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalCorpo: { paddingVertical: 24, paddingHorizontal: 18 },
})
