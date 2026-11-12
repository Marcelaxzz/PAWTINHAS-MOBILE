import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { HeartIcon, MapPinIcon } from '../../web/components/Icons/Icons.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../componentes/ui/Basicos.jsx'
import { PillButton } from '../../componentes/ui/PillButton.jsx'
import { Chip } from '../../componentes/ui/Chip.jsx'
import { Page } from '../../componentes/Page.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { useCollections } from '../../web/hooks/useCollections.js'
import { sexoEspecie } from '../../web/utils/adocao.js'
import { photoSrc } from '../../plataforma/imagens.js'
import { useFavorites } from '../../adocao/useFavorites.js'
import { cores, sombras } from '../../tema.js'
import { Grade, useAte } from '../../componentes/ui/Grade.jsx'

export default function Favoritos() {
  const { data, loading, error, reload } = useCollections(['animais'])
  const { ids, toggle } = useFavorites()
  const emLinha = !useAte(560)

  const favoritos = useMemo(() => (data ? data.animais.filter((a) => ids.includes(a.id)) : []), [data, ids])

  return (
    <Page
      title="Meus favoritos"
      subtitle="Os animais que você marcou com o coração no catálogo."
      onRefresh={reload}
      actions={
        data ? (
          <View style={estilos.contador}>
            <Texto peso={700} style={{ fontSize: 20, color: cores.branco }}>
              {favoritos.length}
            </Texto>
            <Texto peso={600} style={{ fontSize: 16, color: cores.branco }}>
              {favoritos.length === 1 ? 'animal salvo' : 'animais salvos'}
            </Texto>
          </View>
        ) : null
      }
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && favoritos.length === 0 && (
        <EmptyState title="Nenhum favorito ainda" action={<PillButton to="/adocao">Conhecer os animais</PillButton>}>
          Toque no coração dos animais do catálogo para guardá-los aqui.
        </EmptyState>
      )}

      {favoritos.length > 0 && (
        <Grade colunas={2} quebras={{ 1000: 1 }} gap={24}>
          {favoritos.map((animal) => (
            <View key={animal.id} style={[estilos.card, emLinha && estilos.cardLinha, sombras.suave]}>
              <View style={[estilos.foto, emLinha && estilos.fotoLinha]}>
                {photoSrc(animal.foto) ? (
                  <Image
                    source={{ uri: photoSrc(animal.foto) }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    accessibilityLabel={`Foto de ${animal.nome}`}
                  />
                ) : null}
                <View style={estilos.selo}>
                  <Texto peso={700} style={{ fontSize: 15, color: cores.branco }}>
                    {sexoEspecie(animal).toUpperCase()}
                  </Texto>
                </View>
              </View>
              <View style={estilos.corpo}>
                <View style={estilos.linhaNome}>
                  <Titulo style={estilos.nome}>{animal.nome}</Titulo>
                  <Texto style={{ fontSize: 16, color: cores.taupeEscuro }}>{animal.idade}</Texto>
                  <Chip tone="tag" size="xs" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                    Porte {animal.porte}
                  </Chip>
                </View>
                <View style={estilos.local}>
                  <MapPinIcon size={15} color={cores.caramelo} />
                  <Texto style={{ fontSize: 16, color: cores.taupeEscuro }}>{animal.cidade}</Texto>
                </View>
                <Texto style={estilos.descricao}>{animal.descricao}</Texto>
                <View style={estilos.acoes}>
                  <PillButton to={`/adocao/${animal.id}`}>Ver detalhes</PillButton>
                  <Pressable
                    onPress={() => toggle(animal.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${animal.nome} dos favoritos`}
                    style={({ pressed }) => [estilos.remover, pressed && { transform: [{ scale: 1.08 }] }]}
                  >
                    <HeartIcon size={18} filled color={cores.rosa} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </Grade>
      )}
    </Page>
  )
}

const estilos = StyleSheet.create({
  contador: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: cores.cafe,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  // Acima de 560 px a foto fica ao lado do texto, como no site.
  cardLinha: { flexDirection: 'row', minHeight: 220 },
  foto: { aspectRatio: 16 / 10, backgroundColor: cores.fotoVazia },
  fotoLinha: { aspectRatio: undefined, flexBasis: 210, flexGrow: 0, flexShrink: 0 },
  selo: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(51, 28, 14, 0.85)',
  },
  corpo: { flex: 1, minWidth: 0, paddingVertical: 20, paddingHorizontal: 22 },
  linhaNome: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10, rowGap: 4 },
  nome: { fontSize: 23, lineHeight: 28 },
  local: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  descricao: {
    marginTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    lineHeight: 26,
    color: cores.taupe,
  },
  acoes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  remover: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 21,
    backgroundColor: cores.branco,
  },
})
