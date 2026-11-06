// Control de calidad del render, antes de gastar media hora en un video completo.
//   node tools/qa.mjs --ep ep06-mar [--times 10,40,70] [--frames 8] [--w 1920 --h 1080]
// 1) Choques: objetos sólidos (casas, árboles, edificios) cuyas cajas se superponen en planta.
// 2) Parpadeo: en fotogramas consecutivos cuenta los píxeles que cambian y vuelven a su valor
//    en el siguiente fotograma (A→B→A). Así se ve el z-fighting (dos superficies peleando por
//    el mismo píxel) y el temblor de sombras; el movimiento normal de cámara casi no lo produce.
//    Guarda un mapa de calor por tiempo en out/qa/ (blanco = píxel que parpadea).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const ep = args.ep;
const page2d = args.page || 'engine';
const W = +(args.w || 1920), H = +(args.h || 1080);
const N = +(args.frames || 8);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[navegador]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/${page2d}/index.html?ep=${ep}&w=${W}&h=${H}`);
await page.waitForFunction(() => window.studioReady === true, null, { timeout: 120000 });
const duration = await page.evaluate(() => studio.duration);
const times = String(args.times || [0.15, 0.35, 0.55, 0.75, 0.92].map((f) => (f * duration).toFixed(1)).join(',')).split(',').map(Number);

// 1) Choques entre objetos sólidos.
const clashes = await page.evaluate(() => (studio.overlaps ? studio.overlaps() : []));
console.log(`Choques entre objetos sólidos: ${clashes.length}`);
clashes.slice(0, 10).forEach((c) => console.log('  ', c));

// 2) Parpadeo.
const outDir = path.join(ROOT, 'out', 'qa');
fs.mkdirSync(outDir, { recursive: true });
let worst = 0;
for (const t0 of times) {
  const r = await page.evaluate(({ t0, N }) => {
    const out = document.getElementById('out');
    const ctx = out.getContext('2d', { willReadFrequently: true });
    const w = out.width, h = out.height, lum = [];
    for (let k = 0; k < N; k++) {
      studio.renderFrame(t0 + k / studio.fps, { bare: true }); // solo la escena 3D: los textos cambian a propósito
      const d = ctx.getImageData(0, 0, w, h).data, L = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) L[i] = (d[i * 4] * 3 + d[i * 4 + 1] * 6 + d[i * 4 + 2]) / 10;
      lum.push(L);
    }
    const heat = new Uint8Array(w * h);
    let flick = 0;
    const T = 22;
    for (let k = 1; k < N - 1; k++) {
      const a = lum[k - 1], b = lum[k], c = lum[k + 1];
      for (let i = 0; i < w * h; i++) {
        if (Math.abs(b[i] - a[i]) > T && Math.abs(c[i] - b[i]) > T && Math.abs(c[i] - a[i]) < T / 3) { flick++; heat[i] = 255; }
      }
    }
    // Mapa de calor sobre el último fotograma atenuado.
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < w * h; i++) {
      const v = heat[i] ? 255 : img.data[i * 4] * 0.25;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
    return { pct: (100 * flick) / (w * h * (N - 2)), png: out.toDataURL('image/jpeg', 0.8) };
  }, { t0, N });
  worst = Math.max(worst, r.pct);
  const f = path.join(outDir, `${ep}_t${t0}.jpg`);
  fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64'));
  console.log(`t=${t0}s  parpadeo ${r.pct.toFixed(4)}% de píxeles/fotograma  → ${path.relative(ROOT, f)}`);
}
console.log(`Peor parpadeo: ${worst.toFixed(4)}%  (objetivo < 0.01%)`);
await browser.close();
server.close();
process.exit(clashes.length > 0 || worst > 0.01 ? 1 : 0);
