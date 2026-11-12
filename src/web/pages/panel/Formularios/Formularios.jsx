// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { useParams } from 'react-router-dom'
import { ResourceForm } from '../../../components/ResourceForm/ResourceForm.jsx'
import { NEW_PET } from '../../../components/ResourceForm/constants.js'
import { formatDateBr, parseDateBr, todayIso } from '../../../utils/dates.js'

const VETS = ['Veterinária', 'Veterinário']

const PET = {
  name: 'petId',
  label: 'Pet',
  type: 'pet',
  placeholder: 'Selecione o pet',
  required: true,
  requiredMessage: 'Selecione o pet.',
}
const TUTOR = {
  name: 'tutorId',
  label: 'Tutor/Responsável',
  type: 'tutor',
  placeholder: 'Selecione o tutor',
  required: true,
  requiredMessage: 'Selecione o tutor.',
}
const DATA = (placeholder) => ({ name: 'data', label: 'Data', type: 'date', placeholder, required: true, future: true })
const HORA = (placeholder) => ({ name: 'hora', label: 'Horário', type: 'time', placeholder, required: true })
const OBS = (placeholder) => ({
  name: 'observacoes',
  label: 'Observações',
  type: 'textarea',
  placeholder,
  span: 2,
  maxLength: 1000,
})
const STATUS = (options, defaultValue = options[0]) => ({
  name: 'status',
  label: 'Status',
  type: 'select',
  options,
  defaultValue,
  span: 2,
})

const schedulePayload = (values) => ({ ...values, data: parseDateBr(values.data) })

export function NovaCirurgia() {
  const { id } = useParams()
  return (
    <ResourceForm
      title={id ? 'Editar cirurgia' : 'Nova cirurgia'}
      subtitle={id ? 'Atualize os dados do procedimento.' : 'Preencha os dados para agendar um procedimento cirúrgico.'}
      recordId={id}
      resource="cirurgias"
      submitLabel="Agendar cirurgia"
      successMessage="Cirurgia agendada!"
      redirectTo="/agenda/cirurgias"
      fields={[
        PET,
        TUTOR,
        DATA('Ex.: 24/09/2026'),
        HORA('Ex.: 09:30'),
        {
          name: 'procedimento',
          label: 'Procedimento',
          placeholder: 'Ex.: castração, limpeza de tártaro, ortopedia',
          required: true,
          maxLength: 120,
        },
        {
          name: 'cirurgiaoId',
          label: 'Cirurgião',
          type: 'staff',
          roles: VETS,
          placeholder: 'Selecione o cirurgião',
          required: true,
          requiredMessage: 'Selecione o cirurgião.',
        },
        OBS('Ex.: jejum de 8 h, exames pedidos antes da cirurgia'),
        STATUS(['Agendado', 'Em andamento', 'Concluído', 'Cancelado']),
      ]}
      toPayload={schedulePayload}
    />
  )
}

export function NovaConsulta() {
  const { id } = useParams()
  return (
    <ResourceForm
      title={id ? 'Editar consulta' : 'Nova consulta'}
      subtitle={id ? 'Atualize os dados da consulta.' : 'Preencha os dados para agendar uma consulta veterinária.'}
      recordId={id}
      resource="consultas"
      submitLabel="Agendar consulta"
      successMessage="Consulta agendada!"
      redirectTo="/agenda/consultas-vacinas"
      fields={[
        PET,
        TUTOR,
        DATA('Ex.: 23/09/2026'),
        HORA('Ex.: 14:00'),
        {
          name: 'veterinarioId',
          label: 'Veterinário',
          type: 'staff',
          roles: VETS,
          placeholder: 'Selecione o profissional',
          required: true,
          requiredMessage: 'Selecione o profissional.',
        },
        {
          name: 'motivo',
          label: 'Motivo da consulta',
          placeholder: 'Ex.: check-up, tosse, coceira',
          required: true,
          maxLength: 120,
        },
        OBS('Ex.: tosse há 3 dias, comendo menos'),
        STATUS(['Agendado', 'Em andamento', 'Concluído', 'Cancelado']),
      ]}
      toPayload={schedulePayload}
    />
  )
}

export function NovaVacina() {
  const { id } = useParams()
  return (
    <ResourceForm
      title={id ? 'Editar vacina' : 'Nova vacina'}
      subtitle={id ? 'Atualize os dados da vacinação.' : 'Preencha os dados para agendar a vacinação do pet.'}
      recordId={id}
      resource="vacinas"
      submitLabel="Agendar vacina"
      successMessage="Vacina agendada!"
      redirectTo="/agenda/consultas-vacinas#vacinas"
      fields={[
        PET,
        TUTOR,
        {
          name: 'nome',
          label: 'Nome da vacina',
          placeholder: 'Ex.: V10, antirrábica, gripe',
          required: true,
          maxLength: 60,
        },
        {
          name: 'dose',
          label: 'Dose',
          type: 'select',
          placeholder: 'Selecione a dose',
          options: ['1ª Dose', '2ª Dose', '3ª Dose', 'Reforço'],
          required: true,
          requiredMessage: 'Selecione a dose.',
        },
        DATA('Ex.: 23/09/2026'),
        HORA('Ex.: 10:30'),
        {
          name: 'profissionalId',
          label: 'Profissional',
          type: 'staff',
          roles: [...VETS, 'Técnico'],
          placeholder: 'Selecione quem vai aplicar',
          required: true,
          requiredMessage: 'Selecione o profissional.',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['Agendado', 'Pendente', 'Aplicada', 'Cancelado'],
          defaultValue: 'Agendado',
        },
        OBS('Ex.: lote da vacina, reação na dose anterior'),
      ]}
      toPayload={(values) => ({
        ...schedulePayload(values),
        // Vacina marcada para hoje já entra como pendente de aplicação.
        status: values.status === 'Agendado' && parseDateBr(values.data) === todayIso() ? 'Pendente' : values.status,
      })}
    />
  )
}

export function NovoBanho() {
  const { id } = useParams()
  return (
    <ResourceForm
      title={id ? 'Editar banho e tosa' : 'Novo banho e tosa'}
      subtitle={id ? 'Atualize os dados do serviço.' : 'Preencha os dados para agendar banho, tosa ou higienização.'}
      recordId={id}
      resource="banhos"
      submitLabel="Agendar banho e tosa"
      successMessage="Banho & tosa agendado!"
      redirectTo="/agenda/banho-tosa"
      fields={[
        PET,
        TUTOR,
        DATA('Ex.: 23/09/2026'),
        HORA('Ex.: 14:00'),
        {
          name: 'servico',
          label: 'Tipo de serviço',
          type: 'select',
          placeholder: 'Selecione o serviço',
          options: [
            'Banho completo',
            'Banho completo + Tosa higiênica',
            'Banho + Tosa bebê completa',
            'Hidratação de pelagem + Banho a seco',
            'Tosa na máquina',
            'Higienização (ouvidos e unhas)',
          ],
          required: true,
          requiredMessage: 'Selecione o serviço.',
        },
        {
          name: 'profissionalId',
          label: 'Profissional',
          type: 'staff',
          roles: ['Groomer', ...VETS],
          placeholder: 'Selecione o profissional',
          required: true,
          requiredMessage: 'Selecione o profissional.',
        },
        OBS('Ex.: tem medo de secador, pele sensível'),
        STATUS(['Agendado', 'Em andamento', 'Concluído', 'Cancelado']),
      ]}
      toPayload={schedulePayload}
    />
  )
}

export function NovaVisita() {
  const { id } = useParams()
  return (
    <ResourceForm
      title={id ? 'Editar visita de pet sitter' : 'Nova visita de pet sitter'}
      subtitle={id ? 'Atualize os dados da visita.' : 'Preencha os dados para agendar uma visita domiciliar.'}
      recordId={id}
      resource="visitas"
      submitLabel="Agendar visita"
      successMessage="Visita agendada!"
      redirectTo="/agenda/pet-sitter"
      fields={[
        { ...PET, fillAddress: true },
        TUTOR,
        {
          name: 'cuidadorId',
          label: 'Cuidador',
          type: 'staff',
          roles: ['Pet Sitter'],
          placeholder: 'Selecione o cuidador',
          required: true,
          requiredMessage: 'Selecione o cuidador.',
        },
        {
          name: 'periodo',
          label: 'Período',
          type: 'select',
          placeholder: 'Selecione o período',
          options: ['Manhã', 'Tarde', 'Noite', 'Integral'],
          required: true,
          requiredMessage: 'Selecione o período.',
        },
        {
          name: 'dataInicio',
          label: 'Data de início',
          type: 'date',
          placeholder: 'Ex.: 23/09/2026',
          required: true,
          future: true,
        },
        {
          name: 'dataFim',
          label: 'Data de fim',
          type: 'date',
          placeholder: 'Ex.: 30/09/2026',
          required: true,
          future: true,
          after: 'dataInicio',
        },
        {
          name: 'endereco',
          label: 'Endereço',
          placeholder: 'Rua, número e bairro',
          required: true,
          span: 2,
          maxLength: 160,
        },
        {
          name: 'servico',
          label: 'Serviço',
          type: 'select',
          placeholder: 'Selecione o tipo de cuidado',
          options: [
            'Passeio + Alimentação',
            'Alimentação + Companhia',
            'Medicação + Passeio rápido',
            'Passeio longo + Companhia',
          ],
          required: true,
          requiredMessage: 'Selecione o serviço.',
        },
        { name: 'hora', label: 'Horário da visita', type: 'time', placeholder: 'Ex.: 09:00', required: true },
        OBS('Ex.: chave com o porteiro, ração às 18 h'),
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['Pendente', 'Concluída', 'Cancelado'],
          defaultValue: 'Pendente',
          span: 2,
        },
      ]}
      toPayload={(values) => ({
        ...values,
        dataInicio: parseDateBr(values.dataInicio),
        dataFim: parseDateBr(values.dataFim),
      })}
    />
  )
}

export function NovaEmergencia() {
  const { id } = useParams()
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const agora = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`

  return (
    <ResourceForm
      title={id ? 'Editar emergência' : 'Nova emergência'}
      subtitle={id ? 'Atualize o registro do atendimento.' : 'Registre um atendimento de emergência veterinária.'}
      recordId={id}
      resource="emergencias"
      submitLabel="Registrar emergência"
      successMessage="Emergência registrada. Bom atendimento!"
      redirectTo="/agenda/emergencias"
      initialValues={{ entrada: agora }}
      fromRecord={(r) => ({
        petId: r.petId ?? NEW_PET,
        tutorId: r.tutorId ?? '',
        petNome: r.petNome ?? '',
        prioridade: r.prioridade,
        entrada: `${formatDateBr(r.data)} - ${r.hora}`,
        motivo: r.motivo,
        profissionalId: r.profissionalId ?? '',
        status: r.status,
        observacoes: r.observacoes ?? '',
      })}
      fields={[
        { ...PET, placeholder: 'Selecione o pet', allowUnregistered: true },
        { ...TUTOR, placeholder: 'Selecione o tutor responsável', required: false },
        {
          name: 'petNome',
          label: 'Identificação do animal',
          placeholder: 'Ex.: cão sem raça definida, preto, porte médio',
          required: true,
          span: 2,
          maxLength: 120,
          when: (values) => values.petId === NEW_PET,
        },
        {
          name: 'prioridade',
          label: 'Prioridade',
          type: 'select',
          placeholder: 'Selecione a prioridade',
          options: ['Baixa', 'Média', 'Alta', 'Crítica'],
          required: true,
          requiredMessage: 'Selecione a prioridade.',
        },
        {
          name: 'entrada',
          label: 'Data e horário de entrada',
          type: 'datetime',
          placeholder: 'Ex.: 23/09/2026 - 15:45',
          required: true,
        },
        {
          name: 'motivo',
          label: 'Motivo da emergência',
          placeholder: 'Ex.: atropelado, sangrando na pata traseira',
          required: true,
          span: 2,
          maxLength: 200,
        },
        {
          name: 'profissionalId',
          label: 'Profissional responsável',
          type: 'staff',
          roles: VETS,
          placeholder: 'Selecione o veterinário de plantão',
          required: true,
          requiredMessage: 'Selecione o profissional.',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['Em atendimento', 'Estabilizado', 'Alta médica'],
          defaultValue: 'Em atendimento',
        },
        OBS('Ex.: temperatura, mucosas, como chegou'),
      ]}
      toPayload={(values) => {
        const [data, hora] = values.entrada.split(' - ')
        const unregistered = values.petId === NEW_PET
        return {
          petId: unregistered ? null : values.petId,
          petNome: unregistered ? values.petNome.trim() : '',
          tutorId: values.tutorId || null,
          prioridade: values.prioridade,
          data: parseDateBr(data),
          hora,
          motivo: values.motivo,
          profissionalId: values.profissionalId,
          status: values.status,
          observacoes: values.observacoes,
        }
      }}
    />
  )
}
