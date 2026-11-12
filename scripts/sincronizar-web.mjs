// Copia do site (Pawtinhas-Front) tudo o que o app usa sem mudar: contratos da API, validações,
// regras da agenda, cálculos da prótese, hooks de dados, ícones e imagens. Assim uma mudança no
// site chega ao app rodando `npm run sincronizar` (roda sozinho antes do `npm start`).
//
// Os arquivos copiados ficam em src/web/ e não devem ser editados à mão: mude no site e sincronize.
// O que depende do navegador (fetch com cookies, fotos, câmera) é trocado no app pelos módulos de
// src/plataforma/ (veja metro.config.js).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = path.resolve(process.env.PAWTINHAS_FRONT ?? path.join(raiz, '..', 'Pawtinhas-Front'), 'src')
const destino = path.join(raiz, 'src', 'web')

const CABECALHO =
  '// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.\n'

/** Módulos copiados como estão (caminhos relativos a src/ do site). */
const MODULOS = [
  'services/adaptadores.js',
  'services/resources.js',
  'services/authService.js',
  'services/clinicService.js',
  'services/dataService.js',
  'services/gestaoService.js',
  'context/authContext.js',
  'context/toastContext.js',
  'hooks/useAuth.js',
  'hooks/useClinic.js',
  'hooks/useCollections.js',
  'hooks/useCountdown.js',
  'hooks/useRecordActions.js',
  'hooks/useSimulation.js',
  'hooks/useToast.js',
  'utils/adocao.js',
  'utils/agenda.js',
  'utils/dates.js',
  'utils/masks.js',
  'utils/navigation.js',
  'utils/numbers.js',
  'utils/status.js',
  'utils/text.js',
  'utils/validators.js',
  'utils/painel.js',
  'utils/alarmes.js',
  'pages/calculadoras/Catalogos/estoque.js',
  'components/ResourceForm/constants.js',
  'pages/calculadoras/calculadorasTabs.js',
  'pages/panel/agendaTabs.js',
  'pages/panel/pacientesTabs.js',
  'pages/protese/proteseTabs.js',
  'pages/protese/visao/geometria.js',
  'pages/protese/impressao/modeloProtese.js',
  'pages/protese/impressao/vista3d.js',
  'pages/panel/Alarmes/ligacoesAlarme.js',
  // Telas que são só configuração (o ResourceForm e o roteador são trocados pelos do app).
  'pages/panel/Formularios/Formularios.jsx',
]

if (!fs.existsSync(site)) {
  // Sem o site ao lado (ex.: build na nuvem), usa a cópia que já está no repositório.
  if (fs.existsSync(destino)) {
    console.log(`Pawtinhas-Front não encontrado em ${site}; usando a cópia atual de src/web.`)
    process.exit(0)
  }
  console.error(`Pawtinhas-Front não encontrado em ${site}. Defina PAWTINHAS_FRONT com o caminho do site.`)
  process.exit(1)
}

const escritos = new Set()
let alterados = 0

function gravar(relativo, conteudo) {
  const alvo = path.join(destino, relativo)
  escritos.add(path.normalize(alvo))
  const atual = fs.existsSync(alvo) ? fs.readFileSync(alvo) : null
  const novo = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo, 'utf8')
  if (atual && atual.equals(novo)) return
  fs.mkdirSync(path.dirname(alvo), { recursive: true })
  fs.writeFileSync(alvo, novo)
  alterados++
}

const ler = (relativo) => fs.readFileSync(path.join(site, relativo), 'utf8')

for (const modulo of MODULOS) gravar(modulo, CABECALHO + ler(modulo))

// O worker de visão computacional roda dentro de uma WebView (ou iframe, no navegador):
// vai como texto, para virar um Worker por Blob lá dentro.
gravar(
  'pages/protese/visao/visaoWorkerFonte.js',
  `${CABECALHO}export const VISAO_WORKER_FONTE = ${JSON.stringify(ler('pages/protese/visao/visao-worker.js'))}\n`,
)

// Ícones: o mesmo desenho, com os elementos do react-native-svg no lugar dos do HTML.
gravar('components/Icons/Icons.jsx', CABECALHO + iconesNativos(ler('components/Icons/Icons.jsx')))

// Imagens
const imagens = path.join(site, 'assets', 'images')
for (const arquivo of fs.readdirSync(imagens)) {
  gravar(path.join('assets', 'images', arquivo), fs.readFileSync(path.join(imagens, arquivo)))
}

// Remove o que saiu do site.
for (const arquivo of listar(destino)) {
  if (!escritos.has(path.normalize(arquivo))) {
    fs.rmSync(arquivo)
    alterados++
  }
}

console.log(
  alterados
    ? `src/web sincronizado com o site (${alterados} arquivo(s) atualizado(s)).`
    : 'src/web já está igual ao site.',
)

function listar(pasta) {
  if (!fs.existsSync(pasta)) return []
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(pasta, e.name)
    return e.isDirectory() ? listar(p) : [p]
  })
}

/**
 * Converte Icons.jsx (SVG do navegador) para react-native-svg. A cor vem de `color`
 * (currentColor), como no site, onde vem do CSS.
 */
function iconesNativos(fonte) {
  let s = fonte
    .replace(/<svg\b/g, '<Svg')
    .replace(/<\/svg>/g, '</Svg>')
    .replace(/<path\b/g, '<Path')
    .replace(/<circle\b/g, '<Circle')
    .replace(/<rect\b/g, '<Rect')
    .replace(
      /<span className=\{className\} aria-hidden="true">/g,
      "<View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }, style]}>",
    )
    .replace(/<\/span>/g, '</View>')
    .replace(/\s+aria-hidden="true"/g, '')
    .replace(/\s+focusable="false"/g, '')
    .replace(/\s+className=\{[^}]*\}/g, '')

  // O componente base do site se chama Svg: vira BaseSvg para não colidir com o do react-native-svg.
  s = s.replace(/function Svg\(/, 'function BaseSvg(').replace(/<Svg \{\.\.\.props\}/g, '<BaseSvg {...props}')
  s = s.replace(/<Svg\s*\{\.\.\.props\} fill=/g, '<BaseSvg {...props} fill=')
  s = s.replace(/(<BaseSvg[^>]*>[\s\S]*?)<\/Svg>/g, '$1</BaseSvg>')

  // Patas preenchidas: no site o preenchimento vem do CSS.
  s = s.replace(
    /<Svg viewBox="6 5 154 192"/,
    '<Svg viewBox="6 5 154 192" fill="currentColor" height={size ? (size * 192) / 154 : undefined}',
  )
  s = s.replace(/<Svg viewBox="2 1.7 38.1 41"/, '<Svg viewBox="2 1.7 38.1 41" fill="currentColor"')
  s = s.replace(
    /export function PawFilled\(\{ className, size, \.\.\.props \}\)/,
    'export function PawFilled({ size, ...props })',
  )
  s = s.replace(/export function PawPanel\(\{ className, \.\.\.props \}\)/, 'export function PawPanel(props)')
  s = s.replace(
    /export function PawOutline\(\{ className, size, \.\.\.props \}\)/,
    'export function PawOutline({ size, ...props })',
  )
  s = s.replace(/export function PawPair\(\{ className \}\)/, 'export function PawPair({ style, color })')
  s = s.replace(/<PawOutline width="(\d+)" height="(\d+)" \/>/g, '<PawOutline width={$1} height={$2} color={color} />')
  s = s.replace(
    /width=\{props\.size \?\? 24\}/,
    'width={props.size ?? 24}\n      color={props.color}\n      style={props.style}',
  )

  const imports = "import { View } from 'react-native'\nimport Svg, { Circle, Path, Rect } from 'react-native-svg'\n\n"
  return imports + s
}
