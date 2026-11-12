import { Children, Fragment } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { PawOutline } from '../../web/components/Icons/Icons.jsx'
import { cores, sombras } from '../../tema.js'
import { Texto, Titulo } from '../Texto.jsx'

/** No celular o site reduz as fotos: 120/110/100/96 → 80px e 80 → 64px. */
const AVATAR_CELULAR = { 120: 80, 110: 80, 100: 80, 96: 80, 80: 64 }

/**
 * Card das listas (cirurgias, banho, visitas, alarmes, pacientes…), no layout de celular do site:
 * foto e texto lado a lado, ações embaixo ocupando a largura.
 */
export function PetCard({
  photo,
  title,
  badges,
  children,
  actions,
  avatar = 120,
  variant = 'creme',
  titleSize = 'lg',
  onPress,
  style,
}) {
  const lado = AVATAR_CELULAR[avatar] ?? 80
  const Corpo = onPress ? Pressable : View
  return (
    <Corpo
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        estilos.card,
        sombras.elevada,
        { backgroundColor: variant === 'branco' ? cores.branco : cores.superficie },
        style,
      ]}
    >
      <View style={estilos.linhaTopo}>
        <View style={[estilos.foto, { width: lado, height: lado, borderRadius: lado / 2 }]}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={estilos.imagem}
              contentFit="cover"
              transition={150}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <PawOutline size={lado * 0.4} color={cores.cafe} style={{ opacity: 0.4 }} />
          )}
        </View>
        <View style={estilos.corpo}>
          <View style={estilos.topo}>
            <Titulo style={[estilos.titulo, titleSize === 'sm' && { fontSize: 21, lineHeight: 26 }]}>{title}</Titulo>
            {badges}
          </View>
          {children ? <View style={estilos.linhas}>{children}</View> : null}
        </View>
      </View>
      {actions ? (
        <View style={estilos.acoes}>
          {Children.toArray(actions?.type === Fragment ? actions.props.children : actions).map((acao, i) => (
            <View key={i} style={estilos.acao}>
              {acao}
            </View>
          ))}
        </View>
      ) : null}
    </Corpo>
  )
}

/** "Dono(a): Marcela Marques", com rótulo em taupe e valor em destaque. tone: escuro | cafe | normal */
export function InfoLine({ label, children, tone = 'escuro' }) {
  const valor = {
    escuro: { peso: 600, color: cores.cafeEscuro },
    cafe: { peso: 600, color: cores.cafe },
    normal: { peso: 400, color: cores.taupe },
  }[tone]
  return (
    <Texto style={estilos.linha}>
      <Texto style={estilos.rotulo}>{label} </Texto>
      <Texto peso={valor.peso} style={{ color: valor.color }}>
        {children}
      </Texto>
    </Texto>
  )
}

const estilos = StyleSheet.create({
  card: {
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
  },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  foto: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(110, 77, 54, 0.08)',
    borderWidth: 4,
    borderColor: cores.branco,
    ...sombras.suave,
  },
  imagem: { width: '100%', height: '100%' },
  corpo: { flex: 1, minWidth: 0 },
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 6 },
  titulo: { fontSize: 23, lineHeight: 27 },
  linhas: { gap: 4, marginTop: 10 },
  linha: { fontSize: 17, lineHeight: 25, color: cores.taupe },
  rotulo: { color: cores.taupe },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  acao: { flexGrow: 1 },
})
