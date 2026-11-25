import { StyleSheet, View } from 'react-native'
import { PawFilled } from '../../web/components/Icons/Icons.jsx'
import { tomDaEspecie } from '../../web/utils/enfeites.js'
import { cores } from '../../tema.js'
import { Titulo } from '../Texto.jsx'

/** Pet sem foto: a inicial do nome na cor da espécie, com uma patinha (igual ao site). */
export function InicialPet({ nome = '', especie, tamanho, style }) {
  const tom = tomDaEspecie(especie)
  const cor = cores[`${tom}Texto`]
  return (
    <View style={[estilos.caixa, { backgroundColor: cores[`${tom}Fundo`] }, style]}>
      <Titulo style={{ fontSize: tamanho * 0.42, lineHeight: tamanho * 0.5, color: cor }}>{nome.slice(0, 1)}</Titulo>
      <PawFilled
        size={Math.max(10, tamanho * 0.14)}
        color={cor}
        style={[estilos.pata, { right: tamanho * 0.13, bottom: tamanho * 0.13 }]}
      />
    </View>
  )
}

const estilos = StyleSheet.create({
  caixa: { alignItems: 'center', justifyContent: 'center' },
  pata: { position: 'absolute', opacity: 0.55 },
})
