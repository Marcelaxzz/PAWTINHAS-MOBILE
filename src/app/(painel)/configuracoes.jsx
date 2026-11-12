import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Page } from '../../componentes/Page.jsx'
import { PillButton } from '../../componentes/ui/PillButton.jsx'
import { Grade } from '../../componentes/ui/Grade.jsx'
import { ErrorState, LoadingState, SummaryBar, Toggle } from '../../componentes/ui/Basicos.jsx'
import { Chip } from '../../componentes/ui/Chip.jsx'
import { Field, FieldGrid } from '../../componentes/ui/Field.jsx'
import { ConfirmDialog, Dialog } from '../../componentes/ui/Dialog.jsx'
import { Texto, Titulo } from '../../componentes/Texto.jsx'
import { DownloadIcon } from '../../web/components/Icons/Icons.jsx'
import { useCollections } from '../../web/hooks/useCollections.js'
import { useToast } from '../../web/hooks/useToast.js'
import { clinicService } from '../../web/services/clinicService.js'
import { dataService } from '../../web/services/dataService.js'
import { formatDateBr } from '../../web/utils/dates.js'
import { maskPhone } from '../../web/utils/masks.js'
import { initials } from '../../web/utils/text.js'
import { validateEmail, validateName } from '../../web/utils/validators.js'
import { salvarArquivo } from '../../plataforma/salvarArquivo'
import { cores, texto } from '../../tema.js'

// Minutos sem contato a partir dos quais o ESP32 é considerado desconectado.
const ESP32_ONLINE_MINUTOS = 10

/** Converte "2026-10-18T22:01:09.2" em "18/10/2026 às 22:01". */
function dataHora(valor) {
  return valor ? `${formatDateBr(valor.slice(0, 10))} às ${valor.slice(11, 16)}` : null
}

function statusEsp32(status) {
  if (!status) return { tone: 'neutro', texto: 'Verificando…', detalhe: '' }
  if (!status.dispositivoConfigurado)
    return { tone: 'perigo', texto: 'Sem chave', detalhe: 'Configure Dispositivo:Chave na API para ativar.' }
  if (!status.dispositivoUltimoContato)
    return { tone: 'neutro', texto: 'Aguardando', detalhe: 'O dispositivo ainda não se conectou.' }
  const minutos = (Date.now() - new Date(status.dispositivoUltimoContato).getTime()) / 60000
  return {
    tone: minutos <= ESP32_ONLINE_MINUTOS ? 'sucesso' : 'alerta',
    texto: minutos <= ESP32_ONLINE_MINUTOS ? 'Online' : 'Sem contato',
    detalhe: `Último contato: ${dataHora(status.dispositivoUltimoContato)}`,
  }
}

// A função define em quais agendamentos a pessoa aparece (cirurgião, groomer, pet sitter…).
const FUNCOES = ['Veterinário', 'Técnico', 'Groomer', 'Pet Sitter', 'Recepcionista']
const papelDa = (funcao) => (funcao === 'Veterinário' || funcao === 'Recepcionista' ? funcao : 'Equipe')

function maskCnpj(value) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const clonar = (valor) => JSON.parse(JSON.stringify(valor))

export default function Configuracoes() {
  const { data, loading, error, reload, patchLocal } = useCollections(['configuracoes', 'profissionais'])

  return (
    <Page title="Configurações" subtitle="Dados da clínica, notificações, equipe e integrações.">
      {loading && <LoadingState />}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data?.configuracoes[0] && (
        <ConfigContent settings={data.configuracoes[0]} usuarios={data.profissionais} patchLocal={patchLocal} />
      )}
    </Page>
  )
}

function Avatar({ usuario }) {
  return (
    <View style={estilos.avatar}>
      <Texto peso={700} style={estilos.avatarTexto}>
        {usuario.iniciais || initials(usuario.nome)}
      </Texto>
    </View>
  )
}

function ConfigContent({ settings, usuarios, patchLocal }) {
  const toast = useToast()
  const [form, setForm] = useState(() => clonar(settings))
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const [baixando, setBaixando] = useState(false)
  const [invite, setInvite] = useState({ nome: '', email: '', funcao: 'Veterinário' })
  const [inviteErrors, setInviteErrors] = useState({})
  const [inviting, setInviting] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removingBusy, setRemovingBusy] = useState(false)

  const carregarStatus = useCallback(() => {
    clinicService
      .statusIntegracoes()
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  useEffect(() => {
    carregarStatus()
  }, [carregarStatus])

  const baixarBackup = async () => {
    setBaixando(true)
    try {
      const dados = await clinicService.baixarBackup()
      const agora = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const nome = `pawtinhas-backup-${agora.getFullYear()}${pad(agora.getMonth() + 1)}${pad(agora.getDate())}-${pad(agora.getHours())}${pad(agora.getMinutes())}.json`
      await salvarArquivo(JSON.stringify(dados, null, 2), nome, 'application/json')
      toast.success('Backup baixado. Guarde o arquivo em um local seguro.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBaixando(false)
    }
  }

  const setClinic = (field, value) => setForm((prev) => ({ ...prev, clinica: { ...prev.clinica, [field]: value } }))
  const setGroup = (group, key, value) => setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))

  const save = async () => {
    if (!form.clinica.nome.trim()) {
      toast.error('Informe o nome da clínica.')
      return
    }
    setSaving(true)
    try {
      const updated = await dataService.update('configuracoes', settings.id, form)
      patchLocal('configuracoes', updated)
      setForm(clonar(updated))
      setEditing(false)
      carregarStatus()
      toast.success('Alterações salvas!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetInvite = () => {
    setEditingUser(null)
    setInvite({ nome: '', email: '', funcao: 'Veterinário' })
    setInviteErrors({})
  }

  const startEdit = (user) => {
    setEditingUser(user)
    setInvite({
      nome: user.nome,
      email: user.email ?? '',
      funcao: FUNCOES.includes(user.funcao) ? user.funcao : 'Veterinário',
    })
    setInviteErrors({})
  }

  /** Adiciona uma pessoa à equipe ou salva a edição da pessoa selecionada. */
  const sendInvite = async () => {
    const errors = { nome: validateName(invite.nome), email: validateEmail(invite.email) }
    setInviteErrors(errors)
    if (errors.nome || errors.email) return
    setInviting(true)
    try {
      const payload = {
        nome: invite.nome.trim(),
        email: invite.email.trim().toLowerCase(),
        funcao: invite.funcao,
        // A conta Admin (veterinária responsável) mantém o papel ao trocar a função.
        papel: editingUser?.papel === 'Admin' ? 'Admin' : papelDa(invite.funcao),
        iniciais: initials(invite.nome),
      }
      const saved = editingUser
        ? await dataService.update('profissionais', editingUser.id, payload)
        : await dataService.create('profissionais', payload)
      patchLocal('profissionais', saved)
      toast.success(editingUser ? `${saved.nome} foi atualizado(a).` : `${saved.nome} foi adicionado(a) à equipe.`)
      resetInvite()
    } catch (err) {
      if (err.fields) setInviteErrors(err.fields)
      toast.error(err.message)
    } finally {
      setInviting(false)
    }
  }

  const removeUser = async () => {
    setRemovingBusy(true)
    try {
      await dataService.remove('profissionais', removing.id)
      patchLocal('profissionais', removing, 'remove')
      toast.success(`${removing.nome} foi removido(a) da equipe.`)
      if (editingUser?.id === removing.id) resetInvite()
      setRemoving(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRemovingBusy(false)
    }
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(settings)
  const esp = statusEsp32(status)
  const campo = { variant: 'areia', editable: editing, labelStyle: estilos.rotuloCampo }

  return (
    <>
      <Grade colunas={2} quebras={{ 900: 1 }} gap={24} esticar={false}>
        <View style={estilos.coluna}>
          <View style={estilos.cartao}>
            <View style={estilos.cartaoTopo}>
              <Titulo style={estilos.titulo}>Perfil da clínica</Titulo>
              <PillButton variant="contorno" onPress={() => setEditing((v) => !v)}>
                {editing ? 'Concluir edição' : 'Editar perfil'}
              </PillButton>
            </View>
            <FieldGrid style={{ marginTop: 20 }}>
              <Field
                span={2}
                label="Nome da clínica"
                {...campo}
                maxLength={80}
                value={form.clinica.nome}
                onChange={(v) => setClinic('nome', v)}
              />
              <Field
                span={2}
                label="Endereço"
                {...campo}
                maxLength={140}
                value={form.clinica.endereco}
                onChange={(v) => setClinic('endereco', v)}
              />
              <Field
                label="Telefone"
                {...campo}
                inputMode="tel"
                maxLength={15}
                value={form.clinica.telefone}
                onChange={(v) => setClinic('telefone', maskPhone(v))}
              />
              <Field
                label="CNPJ"
                {...campo}
                inputMode="numeric"
                maxLength={18}
                value={form.clinica.cnpj}
                onChange={(v) => setClinic('cnpj', maskCnpj(v))}
              />
            </FieldGrid>
          </View>

          <View style={estilos.cartao}>
            <View style={estilos.cartaoTopo}>
              <Titulo style={estilos.titulo}>Equipe</Titulo>
              <PillButton variant="contorno" onPress={() => setUsersOpen(true)}>
                Gerenciar equipe
              </PillButton>
            </View>
            <View style={{ marginTop: 18 }}>
              {usuarios.slice(0, 4).map((u, i, lista) => (
                <View key={u.id} style={[estilos.usuario, i === lista.length - 1 && { borderBottomWidth: 0 }]}>
                  <Avatar usuario={u} />
                  <View style={estilos.usuarioTexto}>
                    <Texto peso={700} style={{ fontSize: 17 }}>
                      {u.nome}
                    </Texto>
                    <Texto style={estilos.usuarioApoio}>{u.papel === 'Admin' ? `${u.funcao} - Admin` : u.funcao}</Texto>
                  </View>
                  {u.papel === 'Admin' && <Chip size="xs">Admin</Chip>}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={estilos.coluna}>
          <View style={estilos.cartao}>
            <Titulo style={estilos.titulo}>Notificações</Titulo>
            <View style={{ marginTop: 10 }}>
              <View style={estilos.toggle}>
                <Toggle
                  label="Resumo diário da agenda por e-mail"
                  description={
                    status?.emailResumo
                      ? `Enviado às 7h para ${status.emailResumo}.`
                      : 'Enviado às 7h para o e-mail da veterinária.'
                  }
                  checked={Boolean(form.notificacoes.resumoDiarioEmail)}
                  onChange={(value) => setGroup('notificacoes', 'resumoDiarioEmail', value)}
                />
              </View>
              <View style={[estilos.toggle, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Toggle
                  label="Alarmes no dispositivo ESP32"
                  description="Desligado, o ESP32 deixa de receber os lembretes cadastrados."
                  checked={Boolean(form.notificacoes.alarmesEsp32)}
                  onChange={(value) => setGroup('notificacoes', 'alarmesEsp32', value)}
                />
              </View>
            </View>
          </View>

          <View style={estilos.cartao}>
            <Titulo style={estilos.titulo}>Integrações</Titulo>
            <View style={{ marginTop: 14 }}>
              <View style={estilos.integracao}>
                <View style={{ flex: 1 }}>
                  <Texto peso={700} style={{ fontSize: 17 }}>
                    ESP32 (alarme de medicação)
                  </Texto>
                  {esp.detalhe ? <Texto style={estilos.usuarioApoio}>{esp.detalhe}</Texto> : null}
                </View>
                <Chip tone={esp.tone} size="sm">
                  {esp.texto}
                </Chip>
              </View>
              <View style={estilos.integracao}>
                <View style={{ flex: 1 }}>
                  <Texto peso={700} style={{ fontSize: 17 }}>
                    E-mail (códigos de acesso e resumo)
                  </Texto>
                  <Texto style={estilos.usuarioApoio}>Servidor SMTP definido na configuração da API.</Texto>
                </View>
                <Chip tone={status?.emailConfigurado ? 'sucesso' : 'perigo'} size="sm">
                  {status ? (status.emailConfigurado ? 'Configurado' : 'Não configurado') : '…'}
                </Chip>
              </View>
              <View
                style={[
                  estilos.integracao,
                  { flexDirection: 'column', alignItems: 'stretch', gap: 12, borderBottomWidth: 0 },
                ]}
              >
                <Toggle
                  label="Backup automático diário"
                  description={
                    status?.ultimoBackup
                      ? `Cópia às 3h na pasta de backups do servidor. Último: ${dataHora(status.ultimoBackup)}.`
                      : 'Cópia às 3h na pasta de backups do servidor (mantém os 14 mais recentes).'
                  }
                  checked={Boolean(form.integracoes.backupAutomatico)}
                  onChange={(value) => setGroup('integracoes', 'backupAutomatico', value)}
                />
                <PillButton
                  variant="contorno"
                  size="sm"
                  onPress={baixarBackup}
                  loading={baixando}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <DownloadIcon size={15} />
                  Baixar backup agora
                </PillButton>
              </View>
            </View>
          </View>
        </View>
      </Grade>

      <SummaryBar
        actions={
          <PillButton size="lg" onPress={save} loading={saving}>
            Salvar alterações
          </PillButton>
        }
      >
        Última atualização do sistema realizada em: {formatDateBr(settings.atualizadoEm.slice(0, 10))} às{' '}
        {settings.atualizadoEm.slice(11, 16)}
        {dirty ? <Texto style={{ color: cores.aviso }}> · Você tem alterações não salvas.</Texto> : null}
      </SummaryBar>

      <Dialog
        open={usersOpen && !removing}
        onClose={() => {
          setUsersOpen(false)
          resetInvite()
        }}
        title="Gerenciar equipe"
        size="lg"
        description="Cadastre as pessoas da equipe e o papel de cada uma. Elas aparecem nos agendamentos; o acesso ao painel continua exclusivo da veterinária responsável."
      >
        {usuarios.map((u, i) => (
          <View
            key={u.id}
            style={[estilos.usuario, { flexWrap: 'wrap' }, i === usuarios.length - 1 && { borderBottomWidth: 0 }]}
          >
            <Avatar usuario={u} />
            <View style={estilos.usuarioTexto}>
              <Texto peso={700} style={{ fontSize: 17 }}>
                {u.nome}
              </Texto>
              <Texto style={estilos.usuarioApoio}>{u.email || 'Sem e-mail cadastrado'}</Texto>
            </View>
            <Chip size="xs">{u.funcao}</Chip>
            <View style={estilos.usuarioAcoes}>
              <Pressable
                onPress={() => startEdit(u)}
                accessibilityRole="button"
                accessibilityState={{ selected: editingUser?.id === u.id }}
                style={[estilos.acaoTexto, editingUser?.id === u.id && { backgroundColor: cores.creme }]}
              >
                <Texto peso={600} style={{ fontSize: 15, color: cores.ferrugem }}>
                  Editar
                </Texto>
              </Pressable>
              {u.papel !== 'Admin' && (
                <Pressable onPress={() => setRemoving(u)} accessibilityRole="button" style={estilos.acaoTexto}>
                  <Texto peso={600} style={{ fontSize: 15, color: cores.erro }}>
                    Remover
                  </Texto>
                </Pressable>
              )}
            </View>
          </View>
        ))}
        <View style={estilos.convite}>
          <Titulo style={estilos.conviteTitulo}>
            {editingUser ? `Editar ${editingUser.nome}` : 'Adicionar à equipe'}
          </Titulo>
          <FieldGrid>
            <Field
              label="Nome completo"
              required
              value={invite.nome}
              maxLength={100}
              error={inviteErrors.nome}
              onChange={(v) => setInvite((p) => ({ ...p, nome: v }))}
            />
            <Field
              label="E-mail"
              required
              inputMode="email"
              autoCapitalize="none"
              autoComplete="off"
              value={invite.email}
              maxLength={254}
              error={inviteErrors.email}
              onChange={(v) => setInvite((p) => ({ ...p, email: v }))}
            />
            <Field
              label="Função"
              as="select"
              value={invite.funcao}
              options={FUNCOES.map((f) => ({ value: f, label: f }))}
              onChange={(v) => setInvite((p) => ({ ...p, funcao: v }))}
            />
          </FieldGrid>
          <View style={estilos.conviteAcoes}>
            {editingUser && (
              <PillButton variant="contorno" onPress={resetInvite} disabled={inviting}>
                Cancelar edição
              </PillButton>
            )}
            <PillButton onPress={sendInvite} loading={inviting}>
              {editingUser ? 'Salvar' : 'Adicionar'}
            </PillButton>
          </View>
        </View>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={removeUser}
        loading={removingBusy}
        title={`Remover ${removing?.nome ?? ''}?`}
        message="A pessoa sai da equipe e deixa de aparecer como responsável nos agendamentos. Os registros antigos continuam salvos."
        confirmLabel="Remover"
      />
    </>
  )
}

const estilos = StyleSheet.create({
  coluna: { gap: 16 },
  cartao: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 24,
    backgroundColor: cores.branco,
  },
  cartaoTopo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titulo: { fontSize: 25, lineHeight: 30 },
  rotuloCampo: { fontSize: 15, color: cores.taupe, ...texto(500) },
  toggle: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: cores.borda },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: cores.caramelo,
  },
  avatarTexto: { fontSize: 15, color: cores.cafeEscuro },
  usuarioTexto: { flex: 1, minWidth: 140 },
  usuarioApoio: { fontSize: 15, color: cores.taupe },
  usuarioAcoes: { flexDirection: 'row', gap: 2, marginLeft: 'auto' },
  acaoTexto: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  integracao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  convite: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: cores.borda },
  conviteTitulo: { marginBottom: 16, fontSize: 20, lineHeight: 26 },
  conviteAcoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
})
