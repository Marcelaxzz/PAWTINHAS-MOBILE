// Metro com uma troca de módulos: o código copiado do site (src/web) usa alguns módulos que
// dependem do navegador. Quando ele os importa, o app entrega a versão de src/plataforma.
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

const web = path.join(__dirname, 'src', 'web')
const plataforma = path.join(__dirname, 'src', 'plataforma')

/** Módulo do site (relativo a src/web, sem extensão) → substituto do app. */
const SUBSTITUTOS = {
  'services/http': 'http',
  'services/arquivos': 'arquivos',
  'utils/images': 'imagens',
  'utils/salvarArquivo': 'salvarArquivo',
  'components/ResourceForm/ResourceForm': '../componentes/ResourceForm',
}

/** Pacotes do site → equivalentes no app. */
const PACOTES = {
  'react-router-dom': 'roteador',
}

const resolverPadrao = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (PACOTES[moduleName] && context.originModulePath.startsWith(web)) {
    return context.resolveRequest(context, path.join(plataforma, PACOTES[moduleName]), platform)
  }
  if (moduleName.startsWith('.') && context.originModulePath.startsWith(web)) {
    const alvo = path.relative(web, path.resolve(path.dirname(context.originModulePath), moduleName))
    const chave = alvo.replace(/\\/g, '/').replace(/\.jsx?$/, '')
    if (SUBSTITUTOS[chave]) {
      return context.resolveRequest(context, path.join(plataforma, SUBSTITUTOS[chave]), platform)
    }
  }
  return (resolverPadrao ?? context.resolveRequest)(context, moduleName, platform)
}

module.exports = config
