import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { EyeIcon, EyeOffIcon } from '../web/components/Icons/Icons.jsx'
import { cores, texto } from '../tema.js'
import { Texto } from './Texto.jsx'

/** Teclado e preenchimento automático equivalentes ao type/autoComplete do site. */
const TIPOS = {
  email: { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false },
  password: { autoCapitalize: 'none', autoCorrect: false },
  text: {},
}

/**
 * Campo das telas de acesso (TextField do site): rótulo, ícone, olho da senha, dica e erro.
 * autoComplete: 'email' | 'username' | 'current-password' | 'new-password' ...
 */
export const CampoTexto = forwardRef(function CampoTexto(
  { label, icon: Icon, type = 'text', error, hint, value, onChangeText, autoComplete, style, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [foco, setFoco] = useState(false)
  const isPassword = type === 'password'
  const entrada = useRef(null)
  const voltarFoco = useRef(false)

  // Sem lista de dependências: o campo é recriado ao mostrar/ocultar a senha e o ref precisa acompanhar.
  useImperativeHandle(ref, () => entrada.current)

  // Trocar o secureTextEntry de um campo já montado nem sempre tem efeito (Android, nova arquitetura):
  // o campo é recriado (key) e, se estava em uso, volta o foco para continuar digitando.
  const alternarSenha = () => {
    voltarFoco.current = entrada.current?.isFocused?.() ?? false
    setVisible((v) => !v)
  }

  useEffect(() => {
    if (voltarFoco.current) entrada.current?.focus()
    voltarFoco.current = false
  }, [visible])

  return (
    <View style={[estilos.campo, style]}>
      <Texto peso={600} style={estilos.rotulo} nativeID={label}>
        {label}
      </Texto>
      <View style={[estilos.caixa, foco && estilos.caixaFoco, error && estilos.caixaErro]}>
        {Icon && <Icon size={15} color={cores.cafe} />}
        <TextInput
          key={isPassword && visible ? 'senha-visivel' : 'senha-oculta'}
          ref={entrada}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !visible}
          autoComplete={autoComplete}
          textContentType={
            autoComplete === 'new-password'
              ? 'newPassword'
              : autoComplete === 'current-password'
                ? 'password'
                : type === 'email'
                  ? 'emailAddress'
                  : undefined
          }
          placeholderTextColor={cores.taupe}
          accessibilityLabel={label}
          accessibilityHint={error || hint}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          style={[estilos.entrada, isPassword && value && !visible && estilos.senha]}
          {...TIPOS[type]}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={alternarSenha}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={8}
            style={estilos.alternar}
          >
            {visible ? <EyeOffIcon size={17} color={cores.cafe} /> : <EyeIcon size={17} color={cores.cafe} />}
          </Pressable>
        )}
      </View>
      {hint && !error ? <Texto style={estilos.dica}>{hint}</Texto> : null}
      {error ? (
        <Texto peso={500} style={estilos.erro} accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}
    </View>
  )
})

const estilos = StyleSheet.create({
  campo: { gap: 8 },
  rotulo: { fontSize: 16, lineHeight: 20, color: cores.cafeMedio },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    paddingLeft: 17,
    paddingRight: 12,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
  },
  caixaFoco: { borderColor: cores.caramelo, backgroundColor: cores.branco },
  caixaErro: { borderColor: cores.erro },
  entrada: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 0,
    fontSize: 17,
    color: cores.cafeEscuro,
    ...texto(400),
  },
  senha: { letterSpacing: 1.8 },
  alternar: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  dica: { fontSize: 15, lineHeight: 20, color: cores.taupe },
  erro: { fontSize: 15, lineHeight: 20, color: cores.erro },
})
