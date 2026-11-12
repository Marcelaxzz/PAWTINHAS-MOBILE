// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Código copiado do site: o Metro troca alguns imports pelos de src/plataforma (veja metro.config.js).
    files: ['src/web/**'],
    rules: { 'import/no-unresolved': 'off' },
  },
])
