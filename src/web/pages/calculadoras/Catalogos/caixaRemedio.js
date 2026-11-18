// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/**
 * Caixa padronizada de cada medicamento do catálogo, no modelo das embalagens veterinárias do Brasil:
 * nome e concentração em destaque, forma farmacêutica, "Uso veterinário" e a tarja vermelha de venda
 * sob prescrição. A cor da faixa indica a classe do remédio. Tudo sai dos dados cadastrados, então um
 * remédio novo já ganha a sua caixa. O site (CaixaRemedio.jsx) e o app desenham a partir daqui.
 */

const CLASSES = [
  {
    nome: 'Antibiótico',
    cor: '#1f5fa8',
    padrao: /amoxicilin|clavul|cefalex|enrofloxac|doxicicl|metronidaz|clindamic|azitromic|sulfa|ciproflox|marboflox/i,
  },
  { nome: 'Anti-inflamatório', cor: '#d9672a', padrao: /meloxicam|maxicam|carprofen|firocox|cetoprofen|robenacox/i },
  { nome: 'Corticoide', cor: '#6b4aa0', padrao: /prednis|dexamet|hidrocortis|triancinol/i },
  { nome: 'Analgésico', cor: '#13827f', padrao: /dipiron|metamizol|tramadol|gabapent|morfin|metadon|codein/i },
  {
    nome: 'Antiparasitário',
    cor: '#2f8a3e',
    padrao: /drontal|praziquant|pirantel|febantel|sarolaner|simparic|ivermect|fipronil|milbemic|afoxolaner|fluralaner/i,
  },
  { nome: 'Gastrointestinal', cor: '#bf3b78', padrao: /omepraz|maropit|ondansetr|ranitid|sucralf|metoclopram/i },
  { nome: 'Cardiorrenal', cor: '#2d3f73', padrao: /furosem|enalapril|benazepril|pimobend|espironol/i },
]
const OUTROS = { nome: 'Medicamento', cor: '#9a5b2a' }

const FORMA_NA_CAIXA = {
  Comprimido: 'Comprimidos',
  Cápsula: 'Cápsulas',
  Gotas: 'Solução oral em gotas',
  'Solução oral': 'Solução oral',
  'Suspensão oral': 'Suspensão oral',
  Injetável: 'Solução injetável',
}

const VIA_NA_CAIXA = {
  Oral: 'Uso oral',
  Subcutânea: 'Uso subcutâneo',
  Intramuscular: 'Uso intramuscular',
  Intravenosa: 'Uso intravenoso',
}

const UNIDADE_DA_CONCENTRACAO = { comprimido: 'mg', cápsula: 'mg', mL: 'mg/mL', gota: 'mg/gota' }

// "250 mg", "500 mg/mL", "0,5 mg", "10 kg"
const CONCENTRACAO = /(\d+(?:[.,]\d+)?\s?(?:mg|mcg|g|UI|kg)(?:\/mL)?)/i
// Palavras da forma que já aparecem na linha de baixo da caixa
const PALAVRAS_DA_FORMA = /\b(injetável|gotas|suspensão|solução oral|solução|comprimidos?|cápsulas?)\b/gi

const formatar = (n) => String(n).replace('.', ',')

/** Quebra o texto em linhas de até `largura` letras, sem cortar palavras. */
export function quebrarLinhas(texto, largura, maximo = 3) {
  const linhas = []
  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const ultima = linhas[linhas.length - 1]
    if (ultima != null && `${ultima} ${palavra}`.length <= largura) linhas[linhas.length - 1] = `${ultima} ${palavra}`
    else linhas.push(palavra)
  }
  if (linhas.length > maximo) {
    const sobra = linhas.slice(maximo - 1).join(' ')
    linhas.splice(maximo - 1, linhas.length, sobra.length > largura ? `${sobra.slice(0, largura - 1)}…` : sobra)
  }
  return linhas
}

/** O que vai impresso na caixa do medicamento `m` (um item do catálogo). */
export function caixaDoRemedio(m) {
  const nome = (m.nome ?? '').trim()
  const texto = `${nome} ${m.principioAtivo ?? ''}`
  const classe = CLASSES.find((c) => c.padrao.test(texto)) ?? OUTROS

  const achada = nome.match(CONCENTRACAO)
  const concentracao = achada
    ? achada[1].replace(/\s?(mg|mcg|g|UI|kg)/i, ' $1')
    : m.concentracao
      ? `${formatar(m.concentracao)} ${UNIDADE_DA_CONCENTRACAO[m.unidade] ?? 'mg'}`
      : ''

  // Nome sem a concentração, sem a forma e sem o que está entre parênteses (vai para a linha extra).
  const parenteses = nome.match(/\(([^)]+)\)/)
  const titulo =
    nome
      .replace(CONCENTRACAO, '')
      .replace(/\([^)]*\)/g, '')
      .replace(PALAVRAS_DA_FORMA, '')
      .replace(/\s{2,}/g, ' ')
      .trim() ||
    m.principioAtivo ||
    'Medicamento'

  // Produto de marca (Drontal, Simparic): o princípio ativo aparece embaixo do nome.
  const ativo = (m.principioAtivo ?? '').trim()
  const mostraAtivo = ativo && !titulo.toLowerCase().includes(ativo.split(/[\s+]/)[0].toLowerCase())

  return {
    classe: classe.nome,
    cor: classe.cor,
    titulo: quebrarLinhas(titulo, 13),
    // Antiparasitário por faixa de peso (Drontal Plus 10 kg): "Até 10 kg"
    concentracao: (/kg$/i.test(concentracao) ? `Até ${concentracao}` : concentracao).replace('.', ','),
    ativo: mostraAtivo ? quebrarLinhas(ativo, 30, 2) : [],
    extra: parenteses ? parenteses[1] : '',
    forma: FORMA_NA_CAIXA[m.forma] ?? m.forma ?? '',
    via: VIA_NA_CAIXA[m.via] ?? (m.via ? `Uso ${m.via.toLowerCase()}` : ''),
  }
}
