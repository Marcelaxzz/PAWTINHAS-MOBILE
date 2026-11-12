import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { AuthLayout } from '../../componentes/AuthLayout.jsx'
import { AlertaForm, OtpInput } from '../../componentes/Formulario.jsx'
import { Botao } from '../../componentes/Botao.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { useAuth } from '../../web/hooks/useAuth.js'
import { useCountdown } from '../../web/hooks/useCountdown.js'
import { HOME_PATH, authService } from '../../web/services/authService.js'
import { formatCountdown } from '../../web/utils/masks.js'
import { safeRedirect } from '../../web/utils/navigation.js'
import { validateCode } from '../../web/utils/validators.js'
import { fluxoAcesso } from '../../fluxoAcesso.js'
import { cores } from '../../tema.js'
import { estilosAcesso } from './estilosAcesso.js'

const CONTENT = {
  login: {
    description: 'Digite o código de 6 dígitos enviado para o seu e-mail.',
    back: { to: '/login', label: 'Voltar ao login' },
  },
  reset: {
    description: 'Digite o código de 6 dígitos enviado para o seu e-mail.',
    back: { to: '/redefinir-senha', label: 'Voltar para redefinição de senha' },
  },
}

/**
 * Segunda etapa da autenticação. O `challengeId` vem da tela anterior, só na memória
 * (nunca pela URL); sem ele, a pessoa volta para o início do fluxo.
 */
export function VerifyCode({ mode }) {
  const purpose = mode === 'reset' ? 'reset' : 'login'
  const [state] = useState(() => fluxoAcesso.ler())

  if (!state?.challengeId || state.purpose !== purpose) {
    return <Redirect href={CONTENT[purpose].back.to} />
  }

  return (
    <VerifyCodeForm
      key={state.challengeId}
      purpose={purpose}
      challengeId={state.challengeId}
      resendIn={state.resendIn}
      from={state.from}
    />
  )
}

function VerifyCodeForm({ purpose, challengeId, resendIn, from }) {
  const router = useRouter()
  const { completeSignIn } = useAuth()
  const content = CONTENT[purpose]

  const [code, setCode] = useState('')
  const [otpKey, setOtpKey] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [remaining, restartCountdown] = useCountdown(resendIn ?? 60)
  const submitting = useRef(false)

  const verify = async (value) => {
    if (submitting.current) return
    const validation = validateCode(value)
    if (validation) {
      setError(validation)
      return
    }

    submitting.current = true
    setLoading(true)
    setError('')
    setInfo('')
    try {
      if (purpose === 'reset') {
        await authService.confirmPasswordReset({ challengeId, code: value })
        fluxoAcesso.definir({ notice: 'Senha redefinida com sucesso! Entre com a sua nova senha.' })
        router.dismissTo('/login')
      } else {
        const { user } = await authService.verifyLogin({ challengeId, code: value })
        fluxoAcesso.limpar()
        completeSignIn(user)
        if (router.canDismiss()) router.dismissAll()
        router.replace(safeRedirect(from, HOME_PATH))
      }
    } catch (err) {
      setError(err.message)
      setCode('')
      setOtpKey((k) => k + 1)
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  const resend = async () => {
    if (remaining > 0 || resending) return
    setResending(true)
    setError('')
    setInfo('')
    try {
      const result = await authService.resendCode({ challengeId })
      restartCountdown(result.resendIn ?? 60)
      setCode('')
      setOtpKey((k) => k + 1)
      setInfo('Enviamos um novo código para o seu e-mail.')
    } catch (err) {
      if (err.retryAfter) restartCountdown(err.retryAfter)
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout>
      <Titulo style={estilosAcesso.titulo}>Verificação</Titulo>
      <Texto style={estilosAcesso.descricao}>{content.description}</Texto>

      <View style={estilosAcesso.otp}>
        <OtpInput
          key={otpKey}
          onChange={(value) => {
            setCode(value)
            if (error) setError('')
          }}
          onComplete={verify}
          disabled={loading}
          invalid={Boolean(error)}
        />
      </View>

      {error || info ? (
        <View style={estilosAcesso.otpAlerta}>
          {error ? <AlertaForm>{error}</AlertaForm> : <AlertaForm tone="sucesso">{info}</AlertaForm>}
        </View>
      ) : null}

      <View style={estilosAcesso.reenvio}>
        <Texto peso={600} style={estilosAcesso.contador}>
          {remaining > 0 ? `Reenviar código em ${formatCountdown(remaining)}` : 'Não recebeu o código?'}
        </Texto>
        <Pressable
          onPress={resend}
          disabled={remaining > 0 || resending}
          accessibilityRole="button"
          accessibilityState={{ disabled: remaining > 0 || resending }}
          style={estilosAcesso.botaoReenviar}
        >
          <Texto
            peso={700}
            style={{
              fontSize: 16,
              color: remaining > 0 || resending ? cores.taupe : cores.cafe,
              opacity: remaining > 0 || resending ? 0.5 : 1,
            }}
          >
            {resending ? 'Reenviando…' : 'Reenviar código'}
          </Texto>
        </Pressable>
      </View>

      <Botao
        style={estilosAcesso.acao}
        altura={54}
        loading={loading}
        loadingText="Verificando…"
        onPress={() => verify(code)}
      >
        Verificar código
      </Botao>

      <Pressable
        onPress={() => router.dismissTo(content.back.to)}
        accessibilityRole="link"
        style={estilosAcesso.voltar}
        hitSlop={8}
      >
        <Texto peso={700} style={estilosAcesso.linkForte}>
          {content.back.label}
        </Texto>
      </Pressable>
    </AuthLayout>
  )
}
