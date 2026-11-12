// Configuração dinâmica sobre o app.json.
// O Android bloqueia HTTP sem TLS nos builds de release. Só liberamos quando a API configurada
// for http (API de teste na rede local); em produção a API é https e o bloqueio continua.
module.exports = ({ config }) => {
  const apiHttp = (process.env.EXPO_PUBLIC_API_URL ?? '').startsWith('http://')
  return {
    ...config,
    plugins: [...config.plugins, ['expo-build-properties', { android: { usesCleartextTraffic: apiHttp } }]],
  }
}
