import { useCallback, useEffect, useState } from 'react'
import { AppState, Platform, StyleSheet, View } from 'react-native'
import { PillButton } from '../componentes/ui/PillButton.jsx'
import { Toggle } from '../componentes/ui/Basicos.jsx'
import { Texto } from '../componentes/Texto.jsx'
import { PhoneIcon } from '../web/components/Icons/Icons.jsx'
import { useToast } from '../web/hooks/useToast.js'
import {
  abrirAjusteBateria,
  abrirAjustesDoApp,
  definirTocarNesteCelular,
  pedirPermissao,
  situacaoPermissao,
  suportado,
  testarAlarme,
  tocarNesteCelular,
} from './agendador'
import { alarmeTocando } from './estado.js'
import { cores, sombras } from '../tema.js'

/**
 * Cartão "Neste celular" da tela de alarmes: liga os alarmes no aparelho, pede a permissão de
 * notificação e permite um teste com a tela bloqueada.
 */
export function NesteCelular() {
  const toast = useToast()
  const [ligado, setLigado] = useState(null)
  const [permissao, setPermissao] = useState('pendente')

  const atualizar = useCallback(
    () =>
      Promise.all([tocarNesteCelular(), situacaoPermissao()]).then(([tocar, situacao]) => {
        setLigado(tocar)
        setPermissao(situacao)
      }),
    [],
  )

  useEffect(() => {
    // Ao voltar dos ajustes do sistema, a permissão pode ter mudado.
    const app = AppState.addEventListener('change', (estado) => estado === 'active' && atualizar())
    atualizar()
    return () => app.remove()
  }, [atualizar])

  if (!suportado) {
    return (
      <View style={[estilos.cartao, sombras.suave]}>
        <View style={estilos.topo}>
          <View style={estilos.icone}>
            <PhoneIcon size={20} color={cores.cafe} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto peso={700}>Alarmes no celular</Texto>
            <Texto style={estilos.texto}>
              Instale o app Pawtinhas no celular para os alarmes tocarem nele também, mesmo com a tela bloqueada.
            </Texto>
          </View>
        </View>
      </View>
    )
  }

  const alternar = async (valor) => {
    if (valor && permissao !== 'concedida') {
      const resultado = await pedirPermissao()
      setPermissao(resultado)
      if (resultado !== 'concedida') {
        toast.error('Sem permissão de notificação os alarmes não tocam. Libere nos ajustes do celular.')
        return
      }
    }
    await definirTocarNesteCelular(valor)
    setLigado(valor)
    alarmeTocando.pedirSincronia()
    toast.success(valor ? 'Os alarmes vão tocar neste celular.' : 'Os alarmes não vão mais tocar neste celular.')
  }

  const testar = async () => {
    if (permissao !== 'concedida') {
      const resultado = await pedirPermissao()
      setPermissao(resultado)
      if (resultado !== 'concedida') return toast.error('Libere as notificações para testar o alarme.')
    }
    await testarAlarme(10)
    toast.success('Alarme de teste em 10 segundos. Pode bloquear a tela.')
  }

  return (
    <View style={[estilos.cartao, sombras.suave]} accessibilityLabel="Alarmes neste celular">
      <View style={estilos.topo}>
        <View style={estilos.icone}>
          <PhoneIcon size={20} color={cores.cafe} />
        </View>
        <View style={{ flex: 1 }}>
          <Toggle
            label="Tocar os alarmes neste celular"
            description="Os alarmes ativos tocam no horário marcado, mesmo com a tela bloqueada e sem internet."
            checked={Boolean(ligado) && permissao === 'concedida'}
            onChange={alternar}
            disabled={ligado === null}
          />
        </View>
      </View>
      {permissao === 'negada' && (
        <Texto style={[estilos.texto, { color: cores.erro }]}>
          As notificações do Pawtinhas estão bloqueadas neste celular. Libere nos ajustes para os alarmes tocarem.
        </Texto>
      )}
      <View style={estilos.acoes}>
        <PillButton variant="contorno" size="sm" onPress={testar}>
          Testar alarme
        </PillButton>
        {permissao === 'negada' && (
          <PillButton variant="fantasma" size="sm" onPress={abrirAjustesDoApp}>
            Abrir ajustes
          </PillButton>
        )}
        {Platform.OS === 'android' && (
          <PillButton variant="fantasma" size="sm" onPress={abrirAjusteBateria}>
            Bateria sem restrição
          </PillButton>
        )}
      </View>
    </View>
  )
}

const estilos = StyleSheet.create({
  cartao: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  icone: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(216, 161, 107, 0.2)',
  },
  texto: { marginTop: 2, fontSize: 16, lineHeight: 23, color: cores.taupe },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
})
