import * as Print from 'expo-print'

const escapar = (texto) =>
  String(texto ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

/**
 * Imprime (ou salva em PDF, pelo diálogo do sistema) um documento simples no visual do Pawtinhas.
 * linhas: [{ rotulo, valor }]
 */
export async function imprimirDocumento({ titulo, subtitulo, linhas, selo }) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: #36241a; margin: 32px; }
  .doc { border: 1.5px dashed #d8a16b; border-radius: 18px; padding: 24px; }
  h1 { font-family: Georgia, serif; font-size: 22px; margin: 0 0 4px; }
  p.sub { color: #897260; margin: 0 0 20px; }
  dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin: 0; }
  dt { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #897260; }
  dd { margin: 2px 0 0; font-weight: 600; }
  .selo { display: inline-block; margin-top: 20px; padding: 4px 12px; border-radius: 999px; background: #e7efe0; color: #3f6a45; font-weight: 600; }
</style></head><body><div class="doc">
<h1>${escapar(titulo)}</h1>${subtitulo ? `<p class="sub">${escapar(subtitulo)}</p>` : ''}
<dl>${linhas
    .filter((l) => l.valor)
    .map((l) => `<div><dt>${escapar(l.rotulo)}</dt><dd>${escapar(l.valor)}</dd></div>`)
    .join('')}</dl>
${selo ? `<span class="selo">${escapar(selo)}</span>` : ''}
</div></body></html>`
  await Print.printAsync({ html })
}
