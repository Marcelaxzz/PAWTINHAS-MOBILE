import { VISAO_WORKER_FONTE } from '../web/pages/protese/visao/visaoWorkerFonte.js'

/**
 * Página que hospeda a visão computacional da medição dentro de uma WebView (no celular) ou de um
 * iframe (no navegador). Ela faz o mesmo que o useVisao.js do site: sobe o worker do OpenCV
 * (o mesmo código do site, copiado pelo sincronizar-web) e roda a detecção do cartão e o encaixe
 * nas bordas sobre a foto. Recebe pixels e devolve coordenadas: a foto não sai do aparelho.
 *
 * Protocolo: { id, tipo, dados } → { id, ok, resultado | erro }; e { tipo: 'estado', estado }.
 */
export function paginaVisao(opencvUrl) {
  const configuracao = JSON.stringify({ opencvUrl, worker: VISAO_WORKER_FONTE }).replace(/</g, '\\u003c')
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
(function () {
  const CONFIG = ${configuracao};
  const LADO_DETECCAO = 1000;
  const enviar = (msg) => {
    const texto = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(texto);
    else window.parent.postMessage({ pawtinhasVisao: texto }, '*');
  };

  const worker = new Worker(URL.createObjectURL(new Blob([CONFIG.worker], { type: 'text/javascript' })));
  const pendentes = new Map();
  let proximo = 1;
  worker.onmessage = ({ data }) => {
    const p = pendentes.get(data.id);
    if (!p) return;
    pendentes.delete(data.id);
    data.ok ? p.resolve(data.resultado) : p.reject(new Error(data.erro));
  };
  worker.onerror = () => {
    enviar({ tipo: 'estado', estado: 'erro' });
    pendentes.forEach((p) => p.reject(new Error('A análise da foto falhou.')));
    pendentes.clear();
  };
  const chamar = (tipo, dados, transferir) =>
    new Promise((resolve, reject) => {
      const id = proximo++;
      pendentes.set(id, { resolve, reject });
      worker.postMessage({ id, tipo, dados }, transferir || []);
    });

  const pronto = chamar('iniciar', { url: CONFIG.opencvUrl });
  pronto.then(() => enviar({ tipo: 'estado', estado: 'pronto' }), () => enviar({ tipo: 'estado', estado: 'erro' }));

  const fotos = new Map();

  async function carregarFoto({ fotoId, dataUrl }) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
    fotos.clear();
    fotos.set(fotoId, canvas);
    return { width: canvas.width, height: canvas.height };
  }

  function foto(fotoId) {
    const c = fotos.get(fotoId);
    if (!c) throw new Error('Foto não carregada.');
    return c;
  }

  async function detectarCartao({ fotoId }) {
    const f = foto(fotoId);
    const fator = Math.min(1, LADO_DETECCAO / Math.max(f.width, f.height));
    const reduzida = document.createElement('canvas');
    reduzida.width = Math.round(f.width * fator);
    reduzida.height = Math.round(f.height * fator);
    const ctx = reduzida.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(f, 0, 0, reduzida.width, reduzida.height);
    const imagem = ctx.getImageData(0, 0, reduzida.width, reduzida.height);

    await pronto;
    const { contornos } = await chamar('detectarCartao', { imagem }, [imagem.data.buffer]);

    // A busca roda na foto reduzida; o acerto fino dos cantos, na foto inteira.
    const original = f.getContext('2d', { willReadFrequently: true });
    const refinados = [];
    for (const q of contornos) {
      const cantos = q.map((p) => ({ x: p.x / fator, y: p.y / fator }));
      const x0 = Math.max(0, Math.floor(Math.min(...cantos.map((c) => c.x)) - 16));
      const y0 = Math.max(0, Math.floor(Math.min(...cantos.map((c) => c.y)) - 16));
      const x1 = Math.min(f.width, Math.ceil(Math.max(...cantos.map((c) => c.x)) + 16));
      const y1 = Math.min(f.height, Math.ceil(Math.max(...cantos.map((c) => c.y)) + 16));
      const recorte = original.getImageData(x0, y0, x1 - x0, y1 - y0);
      const r = await chamar('refinarCartao', { imagem: recorte, cantos: cantos.map((c) => ({ x: c.x - x0, y: c.y - y0 })) }, [recorte.data.buffer]);
      refinados.push(r.cantos.map((c) => ({ x: c.x + x0, y: c.y + y0 })));
    }
    return refinados;
  }

  async function encaixarBordas({ fotoId, a, b }) {
    const f = foto(fotoId);
    const comprimento = Math.hypot(b.x - a.x, b.y - a.y);
    const margem = Math.max(10, Math.min(60, comprimento * 0.15)) + 6;
    const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - margem));
    const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - margem));
    const x1 = Math.min(f.width, Math.ceil(Math.max(a.x, b.x) + margem));
    const y1 = Math.min(f.height, Math.ceil(Math.max(a.y, b.y) + margem));
    const imagem = f.getContext('2d', { willReadFrequently: true }).getImageData(x0, y0, x1 - x0, y1 - y0);

    await pronto;
    const r = await chamar('encaixarBordas', { imagem, a: { x: a.x - x0, y: a.y - y0 }, b: { x: b.x - x0, y: b.y - y0 } }, [imagem.data.buffer]);
    const volta = (p) => ({ x: p.x + x0, y: p.y + y0, movido: p.movido });
    return { a: volta(r.a), b: volta(r.b) };
  }

  const TAREFAS = { carregarFoto, detectarCartao, encaixarBordas };

  window.__receber = async (msg) => {
    try {
      if (!Object.prototype.hasOwnProperty.call(TAREFAS, msg.tipo)) throw new Error('Tarefa desconhecida.');
      enviar({ id: msg.id, ok: true, resultado: await TAREFAS[msg.tipo](msg.dados) });
    } catch (erro) {
      enviar({ id: msg.id, ok: false, erro: String((erro && erro.message) || erro) });
    }
  };
  window.addEventListener('message', (e) => {
    if (e.source === window.parent && e.data && e.data.pawtinhasPedido) window.__receber(JSON.parse(e.data.pawtinhasPedido));
  });
  enviar({ tipo: 'estado', estado: 'carregando' });
})();
</script></body></html>`
}
