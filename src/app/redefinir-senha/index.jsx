import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '../../componentes/AuthLayout.jsx'
import { CampoTexto } from '../../componentes/CampoTexto.jsx'
import { AlertaForm } from '../../componentes/Formulario.jsx'
import { Botao } from '../../componentes/Botao.jsx'
import { GuestRoute } from '../../componentes/Guardas.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { LockIcon, UserIcon } from '../../web/components/Icons/Icons.jsx'
import { authService } from '../../web/services/authService.js'
import { validateEmail, validateNewPassword, validatePasswordConfirmation } from '../../web/utils/validators.js'
import { fluxoAcesso } from '../../fluxoAcesso.js'
import { estilosAcesso } from '../../telas/acesso/estilosAcesso.js'

const FIELDS = ['email', 'password', 'confirmation']

const validators = {
  email: (v) => validateEmail(v.email),
  password: (v) => validateNewPassword(v.password),
  confirmation: (v) => validatePasswordConfirmation(v.password, v.confirmation),
}

export default function TelaRedefinirSenha() {
  return (
    <GuestRoute>
      <ResetPassword />
    </GuestRoute>
  )
}

function ResetPassword() {
  const router = useRouter()
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmationRef = useRef(null)

  const [values, setValues] = useState({ email: '', password: '', confirmation: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (text) => {
    const next = { ...values, [field]: text }
    setValues(next)
    setErrors((prev) => {
      const updated = { ...prev }
      if (prev[field]) updated[field] = validators[field](next)
      if (field === 'password' && prev.confirmation) updated.confirmation = validators.confirmation(next)
      return updated
    })
  }

  const handleSubmit = async () => {
    if (loading) return

    const nextErrors = Object.fromEntries(FIELDS.map((field) => [field, validators[field](values)]))
    setErrors(nextErrors)
    setFormError('')
    const firstInvalid = FIELDS.find((field) => nextErrors[field])
    if (firstInvalid)
      return { email: emailRef, password: passwordRef, confirmation: confirmationRef }[firstInvalid].current?.focus()

    setLoading(true)
    try {
      const challenge = await authService.requestPasswordReset(values)
      fluxoAcesso.definir({ challengeId: challenge.challengeId, resendIn: challenge.resendIn, purpose: 'reset' })
      router.push('/redefinir-senha/verificacao')
    } catch (error) {
      setFormError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Titulo style={estilosAcesso.titulo}>Redefinir senha</Titulo>
      <Texto style={estilosAcesso.descricao}>Enviaremos um código para o seu e-mail para confirmar a troca.</Texto>

      {formError ? (
        <View style={estilosAcesso.alerta}>
          <AlertaForm>{formError}</AlertaForm>
        </View>
      ) : null}

      <View style={estilosAcesso.campos}>
        <CampoTexto
          ref={emailRef}
          error={errors.email}
          label="E-mail de cadastro"
          icon={UserIcon}
          type="email"
          autoComplete="email"
          placeholder="exemplo@pawtinhas.com.br"
          maxLength={254}
          value={values.email}
          onChangeText={update('email')}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <CampoTexto
          ref={passwordRef}
          error={errors.password}
          label="Nova senha"
          icon={LockIcon}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          maxLength={128}
          hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
          value={values.password}
          onChangeText={update('password')}
          returnKeyType="next"
          onSubmitEditing={() => confirmationRef.current?.focus()}
          submitBehavior="submit"
        />
        <CampoTexto
          ref={confirmationRef}
          error={errors.confirmation}
          label="Confirmar nova senha"
          icon={LockIcon}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          maxLength={128}
          value={values.confirmation}
          onChangeText={update('confirmation')}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Botao
        style={estilosAcesso.acao}
        altura={54}
        loading={loading}
        loadingText="Enviando código…"
        onPress={handleSubmit}
      >
        Redefinir senha
      </Botao>

      <Pressable
        onPress={() => router.dismissTo('/login')}
        accessibilityRole="link"
        style={estilosAcesso.voltar}
        hitSlop={8}
      >
        <Texto peso={700} style={estilosAcesso.linkForte}>
          Voltar ao login
        </Texto>
      </Pressable>
    </AuthLayout>
  )
}
