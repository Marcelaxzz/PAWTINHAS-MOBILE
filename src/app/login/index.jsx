import { useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AuthLayout } from '../../componentes/AuthLayout.jsx'
import { CampoTexto } from '../../componentes/CampoTexto.jsx'
import { AlertaForm, Checkbox } from '../../componentes/Formulario.jsx'
import { Botao } from '../../componentes/Botao.jsx'
import { GuestRoute } from '../../componentes/Guardas.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { LockIcon, UserIcon } from '../../web/components/Icons/Icons.jsx'
import { authService } from '../../web/services/authService.js'
import { validateEmail, validateLoginPassword } from '../../web/utils/validators.js'
import { fluxoAcesso } from '../../fluxoAcesso.js'
import { estilosAcesso } from '../../telas/acesso/estilosAcesso.js'

const validators = {
  identifier: (values) => validateEmail(values.identifier),
  password: (values) => validateLoginPassword(values.password),
}

export default function TelaLogin() {
  return (
    <GuestRoute>
      <Login />
    </GuestRoute>
  )
}

function Login() {
  const router = useRouter()
  const { de } = useLocalSearchParams()
  const [notice] = useState(() => {
    const aviso = fluxoAcesso.ler()?.notice
    if (aviso) fluxoAcesso.limpar()
    return aviso
  })

  const [values, setValues] = useState({ identifier: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef(null)
  const identifierRef = useRef(null)

  const update = (field) => (text) => {
    const next = { ...values, [field]: text }
    setValues(next)
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validators[field](next) }))
  }

  const handleSubmit = async () => {
    if (loading) return

    const nextErrors = {
      identifier: validators.identifier(values),
      password: validators.password(values),
    }
    setErrors(nextErrors)
    setFormError('')
    if (nextErrors.identifier) return identifierRef.current?.focus()
    if (nextErrors.password) return passwordRef.current?.focus()

    setLoading(true)
    try {
      const challenge = await authService.login(values)
      fluxoAcesso.definir({
        challengeId: challenge.challengeId,
        resendIn: challenge.resendIn,
        purpose: 'login',
        from: de,
      })
      router.push('/login/verificacao')
    } catch (error) {
      setFormError(error.message)
      setValues((prev) => ({ ...prev, password: '' }))
      passwordRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Titulo style={estilosAcesso.titulo}>Entrar</Titulo>

      {notice && !formError ? (
        <View style={estilosAcesso.alerta}>
          <AlertaForm tone="sucesso">{notice}</AlertaForm>
        </View>
      ) : null}
      {formError ? (
        <View style={estilosAcesso.alerta}>
          <AlertaForm>{formError}</AlertaForm>
        </View>
      ) : null}

      <View style={estilosAcesso.campos}>
        <CampoTexto
          ref={identifierRef}
          label="E-mail"
          icon={UserIcon}
          type="email"
          autoComplete="email"
          placeholder="exemplo@pawtinhas.com.br"
          maxLength={254}
          value={values.identifier}
          onChangeText={update('identifier')}
          error={errors.identifier}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <CampoTexto
          ref={passwordRef}
          label="Senha"
          icon={LockIcon}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          maxLength={128}
          value={values.password}
          onChangeText={update('password')}
          error={errors.password}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <View style={estilos.opcoes}>
        <Checkbox
          label="Lembrar de mim"
          checked={values.remember}
          onChange={(remember) => setValues((prev) => ({ ...prev, remember }))}
        />
        <Pressable onPress={() => router.push('/redefinir-senha')} accessibilityRole="link" hitSlop={8}>
          <Texto peso={700} style={estilosAcesso.linkForte}>
            Esqueceu a senha?
          </Texto>
        </Pressable>
      </View>

      <Botao style={estilosAcesso.acao} altura={54} loading={loading} loadingText="Entrando…" onPress={handleSubmit}>
        Entrar
      </Botao>

      <Pressable onPress={() => router.replace('/')} accessibilityRole="link" style={estilosAcesso.voltar} hitSlop={8}>
        <Texto peso={700} style={estilosAcesso.linkForte}>
          Voltar ao início
        </Texto>
      </Pressable>
    </AuthLayout>
  )
}

const estilos = StyleSheet.create({
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
  },
})
