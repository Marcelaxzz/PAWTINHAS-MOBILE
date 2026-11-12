import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { ChevronDownIcon, SearchIcon } from '../web/components/Icons/Icons.jsx'
import { FolhaOpcoes } from './ui/Field.jsx'
import { cores, texto } from '../tema.js'
import { Texto } from './Texto.jsx'

/** Barra de filtros das listas (busca, seletores e ação), como no site. */
export function Filtros({ children, style }) {
  return (
    <View style={[estilos.filtros, style]} accessibilityRole="search">
      {children}
    </View>
  )
}

export function BuscaFiltro({ value, onChange, placeholder, maxLength = 60 }) {
  return (
    <View style={estilos.busca}>
      <SearchIcon size={15} color={cores.taupe} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={cores.taupe}
        maxLength={maxLength}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={estilos.buscaEntrada}
      />
    </View>
  )
}

/** Seletor em pílula. options: [{ value, label }] */
export function SelectFiltro({ value, onChange, options, titulo }) {
  const [aberto, setAberto] = useState(false)
  const atual = options.find((o) => o.value === value)
  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={atual?.label}
        style={estilos.select}
      >
        <Texto style={estilos.selectTexto} numberOfLines={1}>
          {atual?.label}
        </Texto>
        <ChevronDownIcon size={14} color={cores.cafeEscuro} />
      </Pressable>
      <FolhaOpcoes
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={titulo}
        options={options}
        value={value}
        onChange={onChange}
      />
    </>
  )
}

const estilos = StyleSheet.create({
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 18,
    backgroundColor: cores.branco,
  },
  busca: {
    flexBasis: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.cremeClaro,
  },
  buscaEntrada: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    padding: 0,
    fontSize: 15,
    color: cores.cafeEscuro,
    ...texto(400),
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    paddingLeft: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 999,
    backgroundColor: cores.cremeClaro,
  },
  selectTexto: { fontSize: 15, color: cores.cafeEscuro },
})
