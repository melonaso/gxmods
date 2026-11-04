// Exporta las imágenes de marca (página brand/<nombre>.html -> out/brand/<nombre>.png).
// Uso: node brand/render-brand.mjs profile
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2] || 'profile';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[navegador]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/brand/${name}.html`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const data = await page.evaluate(() => window.png());
const dir = path.join(ROOT, 'out', 'brand');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${name}.png`);
fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
console.log('Imagen:', file);
await browser.close();
server.close();
