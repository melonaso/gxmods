// Render determinista: abre el motor en Chromium headless, pide cada frame por tiempo
// y los envía como JPEG a ffmpeg. Uso:
//   node tools/render.mjs --ep ep01-crecer [--out out/ep01-video.mp4] [--w 1920 --h 1080]
//   node tools/render.mjs --ep ep01-crecer --preview 0,5,20,60   (capturas PNG en out/preview)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);
const ep = args.ep || 'ep01-crecer';
const W = +(args.w || 1920), H = +(args.h || 1080);

// Servidor estático mínimo (los módulos ES no cargan desde file://).
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
// --page engine2d: Shorts 2D (vertical). Por defecto, el motor 3D.
const url = `http://127.0.0.1:${server.address().port}/${args.page || 'engine'}/index.html?ep=${ep}&w=${W}&h=${H}`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
page.on('console', (m) => m.type() === 'error' && console.error('[navegador]', m.text()));
page.on('pageerror', (e) => console.error('[navegador]', e.message));
await page.goto(url);
await page.waitForFunction(() => window.studioReady === true, null, { timeout: 120000 });
const { duration, fps } = await page.evaluate(() => ({ duration: studio.duration, fps: studio.fps }));
// Inicio de cada escena, para colocar la narración en el lugar exacto al mezclar.
const starts = await page.evaluate(() => studio.scenes.map((s) => ({ id: s.id, start: s.start })));
const sfx = await page.evaluate(() => studio.sfx || []); // efectos de sonido (solo Shorts 2D)
fs.mkdirSync(path.join(ROOT, 'episodes', ep, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'episodes', ep, 'build', 'starts.json'), JSON.stringify({ duration, starts, sfx }, null, 1));
console.log(`Episodio ${ep}:${duration.toFixed(2)} s a ${fps} fps (${Math.ceil(duration * fps)} frames)`);

const toBuf = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

if (args.preview) {
  const dir = path.join(ROOT, 'out', 'preview');
  fs.mkdirSync(dir, { recursive: true });
  const times = String(args.preview === true ? '1,10,30,60,90' : args.preview).split(',').map(Number);
  for (const t of times) {
    const d = await page.evaluate((t) => studio.frame(t, 0.9), Math.min(t, duration - 0.01));
    const f = path.join(dir, `${ep}_t${String(t).padStart(4, '0')}.jpg`);
    fs.writeFileSync(f, toBuf(d));
    console.log('captura', f);
  }
} else {
  const out = path.resolve(ROOT, args.out || `out/${ep}-video.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.ceil(duration * fps);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const d = await page.evaluate((t) => studio.frame(t, 0.93), i / fps);
    if (!ff.stdin.write(toBuf(d))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\rframe ${i}/${total}  ${(i / Math.max(el, 0.01)).toFixed(1)} fps  ETA ${Math.round((total - i) * el / Math.max(i, 1))} s   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\nVideo (sin audio) listo: ${out}`);
}

await browser.close();
server.close();
