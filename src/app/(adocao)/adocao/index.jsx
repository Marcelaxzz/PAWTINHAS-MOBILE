import { useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Page } from '../../../componentes/Page.jsx'
import { PillButton } from '../../../componentes/ui/PillButton.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../../componentes/ui/Basicos.jsx'
import { FotoInteira } from '../../../componentes/ui/FotoInteira.jsx'
import { Texto, Titulo } from '../../../componentes/Texto.jsx'
import { useCollections } from '../../../web/hooks/useCollections.js'
import { FILTROS, sexoEspecie, visivelNoCatalogo } from '../../../web/utils/adocao.js'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '../../../web/components/Icons/Icons.jsx'
import { photoSrc } from '../../../plataforma/imagens.js'
import { useFavorites } from '../../../adocao/useFavorites.js'
import { AnimalCard } from '../../../adocao/AnimalCard.jsx'
import { cores, gradientes, MARGEM, sombras } from '../../../tema.js'
import { Grade, useAte } from '../../../componentes/ui/Grade.jsx'

/** Cartões por vez na grade; "Mostrar mais" soma outro tanto (igual ao site). */
const POR_PAGINA = 12
export default function Catalogo() {
  const { data, loading, error, reload } = useCollections(['animais'])
  const { isFavorite, toggle } = useFavorites()
  const [filtro, setFiltro] = useState('todos')
  const [slide, setSlide] = useState(0)
  const [mostrando, setMostrando] = useState(POR_PAGINA)
  const [largura, setLargura] = useState(0)
  const trilho = useRef(null)
  // Como no site: acima de 860 px o texto fica ao lado da foto; abaixo, a foto vem em cima.
  const empilhado = useAte(860)

  const animais = useMemo(() => (data ? data.animais.filter(visivelNoCatalogo) : []), [data])
  const destaques = animais.filter((a) => a.status === 'Disponível').slice(0, 3)
  const ativo = FILTROS.find((f) => f.id === filtro)
  const lista = animais.filter(ativo.test)

  const goTo = (index) => {
    if (!largura || destaques.length === 0) return
    const next = (index + destaques.length) % destaques.length
    trilho.current?.scrollTo({ x: next * largura, animated: true })
    setSlide(next)
  }

  return (
    <Page
      width="largo"
      title="Animais para adoção"
      subtitle="Filtre por espécie, idade ou sexo e toque no coração para guardar quem você quer rever."
      onRefresh={reload}
    >
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {destaques.length > 0 && (
        <LinearGradient
          colors={gradientes.painel}
          locations={[0, 0.48, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[estilos.carrossel, sombras.media]}
          onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
          accessibilityLabel="Animais em destaque"
        >
          {largura > 0 && (
            <ScrollView
              ref={trilho}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / largura))}
              onScroll={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / largura))}
              scrollEventThrottle={64}
            >
              {destaques.map((animal, index) => (
                <View
                  key={animal.id}
                  style={[estilos.slide, !empilhado && estilos.slideLado, { width: largura }]}
                  accessibilityLabel={`${index + 1} de ${destaques.length}`}
                >
                  <FotoInteira
                    uri={photoSrc(animal.foto)}
                    accessibilityLabel={`Foto de ${animal.nome}`}
                    style={[estilos.slideFoto, !empilhado && estilos.slideFotoLado]}
                  />
                  <View style={[estilos.slideTexto, !empilhado && estilos.slideTextoLado]}>
                    <View style={estilos.destaque}>
                      <Texto peso={700} style={estilos.destaqueTexto}>
                        DESTAQUE {index + 1} DE {destaques.length}
                      </Texto>
                    </View>
                    <Titulo style={[estilos.slideNome, !empilhado && estilos.slideNomeLado]}>{animal.nome}</Titulo>
                    <View style={estilos.slideMeta}>
                      <Texto peso={600} style={estilos.slideMetaTexto}>
                        {`${sexoEspecie(animal)} · ${animal.idade}${animal.cidade ? ' · ' : ''}`}
                      </Texto>
                      {animal.cidade ? (
                        <>
                          <MapPinIcon size={14} color={cores.caramelo} />
                          <Texto peso={600} style={estilos.slideMetaTexto}>
                            {animal.cidade}
                          </Texto>
                        </>
                      ) : null}
                    </View>
                    {animal.frase ? <Titulo style={estilos.slideFrase}>{`“${animal.frase}”`}</Titulo> : null}
                    <Texto style={estilos.slideDescricao}>{animal.descricao}</Texto>
                    <PillButton to={`/adocao/${animal.id}`} style={estilos.slideBotao}>
                      <Texto peso={600} style={{ fontSize: 16, color: cores.cafeEscuro }}>
                        Conhecer {animal.nome}
                      </Texto>
                      <ArrowRightIcon size={18} color={cores.cafeEscuro} />
                    </PillButton>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          {destaques.length > 1 && (
            <View style={[estilos.controles, !empilhado && estilos.controlesLado]}>
              <Pressable
                onPress={() => goTo(slide - 1)}
                accessibilityRole="button"
                accessibilityLabel="Destaque anterior"
                style={({ pressed }) => [estilos.seta, pressed && estilos.setaPressionada]}
              >
                <ChevronLeftIcon size={20} color={cores.branco} />
              </Pressable>
              <View style={estilos.pontos}>
                {destaques.map((animal, index) => (
                  <Pressable
                    key={animal.id}
                    onPress={() => goTo(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ir para o destaque ${index + 1}`}
                    hitSlop={8}
                    style={[estilos.ponto, index === slide && estilos.pontoAtivo]}
                  />
                ))}
              </View>
              <Pressable
                onPress={() => goTo(slide + 1)}
                accessibilityRole="button"
                accessibilityLabel="Próximo destaque"
                style={({ pressed }) => [estilos.seta, pressed && estilos.setaPressionada]}
              >
                <ChevronRightIcon size={20} color={cores.branco} />
              </Pressable>
            </View>
          )}
        </LinearGradient>
      )}

      {data && (
        <View accessibilityLabel="Animais para adoção">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginRight: -MARGEM, marginTop: 0 }}
            contentContainerStyle={estilos.filtros}
            accessibilityLabel="Filtrar animais"
          >
            {FILTROS.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => {
                  setFiltro(f.id)
                  setMostrando(POR_PAGINA)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === f.id }}
                style={[estilos.filtro, filtro === f.id && estilos.filtroAtivo]}
              >
                <Texto peso={600} style={{ fontSize: 16, color: filtro === f.id ? cores.branco : cores.taupeEscuro }}>
                  {f.label}
                </Texto>
              </Pressable>
            ))}
          </ScrollView>

          {lista.length === 0 ? (
            <View style={{ marginTop: 28 }}>
              <EmptyState title="Nenhum animal nesse filtro">Tente outra categoria ou volte para “Todos”.</EmptyState>
            </View>
          ) : (
            <>
              <Grade colunas={3} quebras={{ 1100: 2, 620: 1 }} gap={20} style={estilos.grade}>
                {lista.slice(0, mostrando).map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    animal={animal}
                    favorite={isFavorite(animal.id)}
                    onToggleFavorite={toggle}
                  />
                ))}
              </Grade>
              {lista.length > mostrando ? (
                <View style={estilos.mais}>
                  <Texto style={estilos.maisTexto}>
                    Mostrando {mostrando} de {lista.length} animais
                  </Texto>
                  <PillButton variant="contorno" size="lg" onPress={() => setMostrando((n) => n + POR_PAGINA)}>
                    Mostrar mais animais
                  </PillButton>
                </View>
              ) : null}
            </>
          )}
        </View>
      )}
    </Page>
  )
}

const estilos = StyleSheet.create({
  carrossel: { overflow: 'hidden', borderRadius: 32 },
  slide: { padding: 12 },
  slideLado: { flexDirection: 'row-reverse', height: 440, padding: 20, gap: 8 },
  slideFoto: { aspectRatio: 4 / 3, borderRadius: 22 },
  slideFotoLado: { flex: 1.05, aspectRatio: undefined },
  slideTexto: { paddingTop: 20, paddingHorizontal: 12, paddingBottom: 76, alignItems: 'flex-start' },
  slideTextoLado: { flex: 1, justifyContent: 'center', paddingTop: 36, paddingHorizontal: 40, paddingBottom: 84 },
  destaque: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  destaqueTexto: { fontSize: 15, letterSpacing: 0.5, color: cores.areia },
  slideNome: { marginTop: 14, fontSize: 36, lineHeight: 41, color: cores.branco },
  slideNomeLado: { fontSize: 54, lineHeight: 59 },
  slideMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 10 },
  slideMetaTexto: { fontSize: 16, color: cores.caramelo },
  slideFrase: { marginTop: 18, fontSize: 19, lineHeight: 26, fontStyle: 'italic', color: cores.areia },
  slideDescricao: { maxWidth: 460, marginTop: 8, fontSize: 18, lineHeight: 27, color: 'rgba(255, 255, 255, 0.82)' },
  slideBotao: { marginTop: 24, backgroundColor: cores.caramelo },
  controles: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  controlesLado: { left: 60, bottom: 40, alignSelf: 'auto' },
  seta: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 21,
  },
  setaPressionada: { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  pontos: { flexDirection: 'row', gap: 8 },
  ponto: { width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  pontoAtivo: { width: 28, backgroundColor: cores.caramelo },
  filtros: { gap: 10, paddingRight: MARGEM },
  filtro: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.branco,
  },
  filtroAtivo: { borderColor: cores.cafe, backgroundColor: cores.cafe },
  grade: { marginTop: 28 },
  mais: { alignItems: 'center', gap: 12, marginTop: 32 },
  maisTexto: { fontSize: 17, color: cores.taupeEscuro },
})
