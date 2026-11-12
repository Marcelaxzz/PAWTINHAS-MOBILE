import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { authService } from '../web/services/authService.js'
import { AuthContext } from '../web/context/authContext.js'
import { ToastContext } from '../web/context/toastContext.js'
import { aoExpirarSessao } from '../plataforma/http.js'
import { cancelarTodos } from '../alarmes/agendador'
import { AlertIcon, CheckIcon, CloseIcon } from '../web/components/Icons/Icons.jsx'
import { cores, sombras } from '../tema.js'
import { Texto } from '../componentes/Texto.jsx'

/** Sessão da veterinária (o mesmo contrato do AuthContext do site). */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('carregando')

  useEffect(() => {
    let active = true
    authService
      .me()
      .then(({ user: current }) => {
        if (!active) return
        // Visitante sem sessão: a API responde { user: null }.
        setUser(current ?? null)
        setStatus(current ? 'autenticado' : 'anonimo')
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        setStatus('anonimo')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(
    () =>
      aoExpirarSessao(() => {
        setUser(null)
        setStatus('anonimo')
      }),
    [],
  )

  const completeSignIn = useCallback((signedUser) => {
    setUser(signedUser)
    setStatus('autenticado')
  }, [])

  const logout = useCallback(async () => {
    try {
      // Ao sair de propósito, os lembretes deixam de tocar neste aparelho (eles mostram nomes de pacientes).
      await cancelarTodos().catch(() => {})
      await authService.logout()
    } finally {
      setUser(null)
      setStatus('anonimo')
    }
  }, [])

  const value = useMemo(() => ({ user, status, completeSignIn, logout }), [user, status, completeSignIn, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Avisos rápidos no rodapé da tela (Toast do site). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)
  const insets = useSafeAreaInsets()

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (message, tone = 'sucesso') => {
      counter.current += 1
      const id = counter.current
      setToasts((list) => [...list.slice(-2), { id, message, tone }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ success: (msg) => show(msg, 'sucesso'), error: (msg) => show(msg, 'erro') }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[estilos.area, { bottom: insets.bottom + 16 }]}
        accessibilityLiveRegion="polite"
      >
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[estilos.toast, sombras.media, toast.tone === 'erro' ? estilos.erro : estilos.sucesso]}
          >
            {toast.tone === 'erro' ? (
              <AlertIcon size={18} color={cores.branco} />
            ) : (
              <CheckIcon size={18} strokeWidth={2.6} color={cores.branco} />
            )}
            <Texto peso={600} style={estilos.texto}>
              {toast.message}
            </Texto>
            <Pressable
              onPress={() => dismiss(toast.id)}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
              hitSlop={8}
              style={estilos.fechar}
            >
              <CloseIcon size={16} color={cores.branco} />
            </Pressable>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  )
}

const estilos = StyleSheet.create({
  area: { position: 'absolute', left: 16, right: 16, gap: 10, zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 14,
  },
  sucesso: { backgroundColor: cores.cafe },
  erro: { backgroundColor: cores.erro },
  texto: { flex: 1, fontSize: 16, lineHeight: 23, color: cores.branco },
  fechar: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, opacity: 0.85 },
})
