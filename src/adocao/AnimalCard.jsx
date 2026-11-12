import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowRightIcon, HeartIcon, MapPinIcon } from '../web/components/Icons/Icons.jsx'
import { FotoInteira } from '../componentes/ui/FotoInteira.jsx'
import { photoSrc } from '../plataforma/imagens.js'
import { sexoEspecie } from '../web/utils/adocao.js'
import { Texto, Titulo } from '../componentes/Texto.jsx'
import { cores, sombras } from '../tema.js'

/** Botão de coração dos favoritos, sobre a foto. */
export function BotaoFavorito({ animal, favorite, onToggle, style }) {
  return (
    <Pressable
      onPress={() => onToggle(animal.id)}
      accessibilityRole="button"
      accessibilityState={{ selected: favorite }}
      accessibilityLabel={favorite ? `Remover ${animal.nome} dos favoritos` : `Adicionar ${animal.nome} aos favoritos`}
      hitSlop={6}
      style={({ pressed }) => [estilos.favorito, sombras.media, pressed && { transform: [{ scale: 1.08 }] }, style]}
    >
      <HeartIcon size={20} filled={favorite} strokeWidth={2.2} color={favorite ? cores.rosa : cores.cafeMedio} />
    </Pressable>
  )
}

/** Card vertical do catálogo público (AnimalCard do site). */
export function AnimalCard({ animal, favorite, onToggleFavorite, style }) {
  const router = useRouter()
  const foto = photoSrc(animal.foto)

  return (
    <View style={[estilos.card, sombras.suave, style]}>
      <FotoInteira uri={foto} accessibilityLabel={`Foto de ${animal.nome}`} style={estilos.foto}>
        <BotaoFavorito
          animal={animal}
          favorite={favorite}
          onToggle={onToggleFavorite}
          style={estilos.favoritoPosicao}
        />
        <View style={estilos.selo}>
          <Texto peso={700} style={estilos.seloTexto}>
            {sexoEspecie(animal).toUpperCase()}
          </Texto>
        </View>
        {animal.status === 'Em processo' && (
          <View style={estilos.processo}>
            <Texto peso={700} style={estilos.processoTexto}>
              Em processo de adoção
            </Texto>
          </View>
        )}
      </FotoInteira>
      <View style={estilos.corpo}>
        <View style={estilos.topo}>
          <Titulo style={estilos.nome}>{animal.nome}</Titulo>
          <Texto style={estilos.idade}>{animal.idade}</Texto>
        </View>
        <View style={estilos.local}>
          <MapPinIcon size={15} color={cores.rosa} />
          <Texto style={estilos.localTexto}>{animal.cidade}</Texto>
          {animal.porte ? (
            <Texto peso={600} style={estilos.porte}>
              Porte {animal.porte.toLowerCase()}
            </Texto>
          ) : null}
        </View>
        <Texto style={estilos.descricao} numberOfLines={2}>
          {animal.descricao}
        </Texto>
        <Pressable
          onPress={() => router.push(`/adocao/${animal.id}`)}
          accessibilityRole="link"
          accessibilityLabel={`Conhecer ${animal.nome}`}
          style={({ pressed }) => [estilos.botao, pressed && { backgroundColor: cores.cafe }]}
        >
          {({ pressed }) => (
            <>
              <Texto peso={700} style={{ flexShrink: 1, color: pressed ? cores.branco : cores.cafeEscuro }}>
                Conhecer {animal.nome}
              </Texto>
              <View style={[estilos.botaoSeta, pressed && { backgroundColor: cores.caramelo }]}>
                <ArrowRightIcon size={18} color={pressed ? cores.cafeEscuro : cores.branco} />
              </View>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const estilos = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.superficie,
  },
  // 4:3 e foto inteira: bicho em pé ou deitado aparece sem cortar a cabeça.
  foto: { aspectRatio: 4 / 3 },
  favorito: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: cores.branco,
  },
  favoritoPosicao: { position: 'absolute', top: 12, right: 12 },
  selo: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: cores.cafeEscuro,
  },
  seloTexto: { fontSize: 15, letterSpacing: 0.24, color: cores.branco },
  processo: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: cores.caramelo,
  },
  processoTexto: { fontSize: 15, color: cores.cafeEscuro },
  corpo: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 24 },
  topo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  nome: { flexShrink: 1, fontSize: 25, lineHeight: 30 },
  idade: { fontSize: 16, color: cores.taupeEscuro },
  local: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  localTexto: { fontSize: 16, color: cores.taupeEscuro },
  porte: {
    marginLeft: 'auto',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: cores.areia,
    fontSize: 15,
    color: cores.cafe,
  },
  descricao: { marginTop: 12, lineHeight: 26, color: cores.taupeEscuro },
  botao: {
    flexDirection: 'row',
    minHeight: 48,
    marginTop: 18,
    paddingLeft: 20,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 999,
    backgroundColor: cores.areia,
  },
  botaoSeta: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: cores.cafe,
  },
})
