import { VerifyCode } from '../../telas/acesso/VerifyCode.jsx'

/** Fora do GuestRoute: ao validar o código a própria tela redireciona. */
export default function VerificacaoLogin() {
  return <VerifyCode mode="login" />
}
