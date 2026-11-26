// Muestra de documental animado (horizontal): «De Rotterdam al uptempo».
// Estilo: fotos reales (Wikimedia Commons, licencias libres; créditos en assets/CREDITOS.md) con zoom lento, color de cine
// y grano, más gráficos animados encima (osciloscopio, contador de BPM, medidor, línea del tiempo).
// El audio (audio.py) se genera desde cero y va a tiempo con estas escenas: 909 a 140, gabber a 180, hardstyle a 150,
// uptempo a 210 golpes por minuto.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc } from '../../engine2d/props.js';

const FILES = { rotterdam: 'rotterdam.jpg', tr909: 'tr909.jpg', crowd: 'crowd.jpg', stage: 'stage.jpg', decks: 'decks.jpg', red: 'red.jpg', crowd2: 'crowd2.jpg' };
const IMG = {};
let GRAIN = null;
// Clips de video real (Wikimedia Commons), ya pasados a cuadros JPG por prep_media.py en build/clips/<nombre>/.
let CLIPINFO = {};
const CACHE = new Map(), CUR = {};
// Créditos en pantalla (clips y canciones), ver assets/CREDITOS.md. Se llenan en prep_media.py → build/clips/index.json.
let CREDITS = { clips: {}, songs: {} };

export async function setup() {
  const load = (k, f) => new Promise((res) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => res(); im.src = `../episodes/hc00-muestra/assets/${f}`; });
  await Promise.all(Object.entries(FILES).map(([k, f]) => load(k, f)));
  try { const r = await fetch('../episodes/hc00-muestra/build/clips/index.json'); if (r.ok) { const j = await r.json(); CLIPINFO = j.clips || {}; CREDITS = j.credits || CREDITS; } } catch (e) { /* sin clips: se usan las fotos */ }
  // Grano de película (fijo; se mueve de lugar en cada cuadro).
  GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 512;
  const g = GRAIN.getContext('2d'), d = g.createImageData(512, 512), R = kit.rng(11);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (R() - 0.5) * 200; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
}

const BPM = { tr909: 140, gabber: 185, hardstyle: 150, uptempo: 210 };   // gabber: la canción real (KASCHADE) va a ~185

/** Qué clip se ve en este momento de la escena (y en qué segundo del clip). */
function clipAt(s, local) {
  const voiceEnd = s.audio ?? s.dur;
  if (s.id === 'gabber') return { name: 'gabber', lt: local };
  if (s.id === 'hardstyle') return local < voiceEnd ? { name: 'te2007', lt: local } : { name: 'jump', lt: local - voiceEnd };
  if (s.id === 'uptempo') { const k = UPKEYS[Math.floor((local * BPM.uptempo) / 60 / 2) % UPKEYS.length]; return k.startsWith('v:') ? { name: k.slice(2), lt: local } : null; }
  return null;
}
const UPKEYS = ['v:rave', 'red', 'v:jump', 'decks', 'crowd2'];

export async function prepare(t, { scene: s, local }) {
  const c = clipAt(s, local); if (!c) return;
  const info = CLIPINFO[c.name]; if (!info) return;
  const i = Math.floor(c.lt * info.fps) % info.n, key = `${c.name}/${i}`;
  if (!CACHE.has(key)) {
    const im = new Image();
    await new Promise((r) => { im.onload = r; im.onerror = r; im.src = `../episodes/hc00-muestra/build/clips/${c.name}/f_${String(i + 1).padStart(4, '0')}.jpg`; });
    CACHE.set(key, im); if (CACHE.size > 240) CACHE.delete(CACHE.keys().next().value);
  }
  IMG['v:' + c.name] = CACHE.get(key);
}

/** Crédito pequeño arriba a la derecha (clips) y nombre de la canción abajo a la izquierda. */
function clipCredit(ctx, W, name) { const c = CREDITS.clips[name]; if (c) kit.text(ctx, c, W - 40, 50, { size: 22, fill: '#cbd5e1', align: 'right', stroke: '#020617', lw: 4 }); }
function songTag(ctx, scene, k) {
  const c = CREDITS.songs[scene]; if (!c || k <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k * 2); label(ctx, 60, 120, '♪ SUENA: ' + c, { size: 30, accent: '#facc15' }); ctx.restore();
}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  const beat = BPM[s.id] ? (local * BPM[s.id]) / 60 : 0;            // golpes desde que empezó la escena
  const hit = BPM[s.id] ? Math.exp(-(beat % 1) * 7) : 0;            // 1 justo en el golpe, baja rápido
  ctx.save();
  SCENES[s.id](ctx, { ...C, t, local, s, cue, beat, hit });
  ctx.restore();
  grain(ctx, C.W, C.H, t, 0.07);
  hq.vignette(ctx, C.W, C.H, 0.45);
  return {};
}

/* ---------- piezas ---------- */

function grain(ctx, W, H, t, a) {
  if (!GRAIN) return;
  const f = Math.floor(t * 24), ox = (f * 137) % 512, oy = (f * 251) % 512;
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  ctx.restore();
}

function scanlines(ctx, W, H, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000000';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  ctx.restore();
}

/** Foto que llena el rectángulo (como «cover»), con zoom/paneo y color: gray 0..1 (blanco y negro), tint encima. */
function photo(ctx, key, x, y, w, h, { zoom = 1, px = 0, py = 0, gray = 0.6, bright = 0.9, contrast = 1.15, tint = null, tintA = 0.45, blend = 'color' } = {}) {
  const img = IMG[key];
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (img) {
    const sc = Math.max(w / img.width, h / img.height) * zoom, iw = img.width * sc, ih = img.height * sc;
    const ox = x + (w - iw) / 2 + (px * (iw - w)) / 2, oy = y + (h - ih) / 2 + (py * (ih - h)) / 2;
    ctx.filter = `grayscale(${gray}) contrast(${contrast}) brightness(${bright})`;
    ctx.drawImage(img, ox, oy, iw, ih);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = hq.vgrad(ctx, 0, y, y + h, [[0, '#334155'], [1, '#0f172a']]); ctx.fillRect(x, y, w, h);
    kit.text(ctx, `FOTO: ${key}`, x + w / 2, y + h / 2, { size: 40, fill: '#94a3b8', stroke: null });
  }
  if (tint) { ctx.globalCompositeOperation = blend; ctx.globalAlpha = tintA; ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}

/** Foto impresa (borde blanco, sombra, un poco girada). */
function print(ctx, key, cx, cy, w, h, rot, k = 1, opts = {}) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(lerp(1.25, 1, k), lerp(1.25, 1, k)); ctx.globalAlpha = clamp(k * 1.5);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(-w / 2 - 18, -h / 2 - 18, w + 36, h + 70);
  ctx.shadowColor = 'transparent';
  photo(ctx, key, -w / 2, -h / 2, w, h, { gray: 0.15, bright: 1, contrast: 1.05, ...opts });
  ctx.restore();
}

function label(ctx, x, y, txt, { size = 34, fill = '#ffffff', bg = 'rgba(2,6,23,0.85)', accent = '#f43f5e', align = 'left' } = {}) {
  ctx.save(); ctx.font = `900 ${size}px Inter, sans-serif`;
  const w = ctx.measureText(txt).width + size * 1.4, h = size * 1.6, x0 = align === 'left' ? x : x - w / 2;
  ctx.fillStyle = bg; ctx.fillRect(x0, y - h / 2, w, h);
  ctx.fillStyle = accent; ctx.fillRect(x0, y - h / 2, size * 0.22, h);
  ctx.fillStyle = fill; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x0 + size * 0.75, y + size * 0.04);
  ctx.restore();
}

function pin(ctx, x, y, s, color = '#f43f5e') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-26, -34, -26, -64, 0, -64); ctx.bezierCurveTo(26, -64, 26, -34, 0, 0); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -42, 9, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

/** Título grande con contorno y sombra (entra con golpe: k 0..1). */
function bigTitle(ctx, x, y, txt, size, k, { fill = '#ffffff', align = 'center', stroke = '#020617' } = {}) {
  if (k <= 0) return;
  const sc = lerp(1.6, 1, ease(k)) ; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 2);
  ctx.font = `900 ${size}px Inter, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.lineWidth = size * 0.14; ctx.strokeStyle = stroke; ctx.strokeText(txt, 0, 0);
  ctx.shadowColor = 'transparent'; ctx.fillStyle = fill; ctx.fillText(txt, 0, 0);
  ctx.restore();
}

/** Contador de BPM tipo pantalla de equipo. */
function bpmBox(ctx, x, y, value, hit, color = '#f43f5e') {
  ctx.save(); ctx.translate(x, y);
  hq.roundRectPath(ctx, -170, -85, 340, 170, 18); ctx.fillStyle = 'rgba(2,6,23,0.88)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.stroke();
  ctx.font = '900 96px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = color; ctx.shadowBlur = 10 + 30 * hit; ctx.fillStyle = '#ffffff'; ctx.fillText(String(Math.round(value)), -20, -6); ctx.shadowColor = 'transparent';
  ctx.font = '900 28px Inter, sans-serif'; ctx.fillStyle = color; ctx.fillText('BPM', 120, 22);
  ctx.beginPath(); ctx.arc(130, -40, 12, 0, TAU); ctx.fillStyle = mixc('#334155', color, hit); ctx.fill();
  ctx.restore();
}

/** Forma de onda de un kick (0.4 s): limpia o rota por la distorsión (drive). */
function kickWave(u, drive) {
  const tt = u * 0.4, f = 52 + 178 * Math.exp(-tt / 0.028);
  const ph = 2 * Math.PI * (52 * tt + 178 * 0.028 * (1 - Math.exp(-tt / 0.028)));
  const v = Math.sin(ph) * Math.exp(-tt / 0.22);
  return drive > 1 ? Math.tanh(v * drive) * 0.95 : v;
}

function scope(ctx, x, y, w, h, fn, progress, color, lw = 6) {
  ctx.save();
  hq.roundRectPath(ctx, x, y, w, h, 18); ctx.fillStyle = 'rgba(2,6,23,0.9)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#334155'; ctx.stroke();
  ctx.beginPath(); ctx.rect(x + 8, y + 8, w - 16, h - 16); ctx.clip();
  ctx.strokeStyle = 'rgba(148,163,184,0.15)'; ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + (w * i) / 8, y); ctx.lineTo(x + (w * i) / 8, y + h); ctx.stroke(); }
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + (h * i) / 4); ctx.lineTo(x + w, y + (h * i) / 4); ctx.stroke(); }
  ctx.beginPath(); const n = 600;
  for (let i = 0; i <= n * progress; i++) { const u = i / n; const yy = y + h / 2 - fn(u) * h * 0.42; i ? ctx.lineTo(x + u * w, yy) : ctx.moveTo(x + u * w, yy); }
  ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

function gauge(ctx, cx, cy, R, value, hit) {
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, toA = (v) => lerp(a0, a1, clamp(v / 240));
  ctx.save(); ctx.lineCap = 'butt';
  for (const [v0, v1, c] of [[0, 150, '#22c55e'], [150, 200, '#facc15'], [200, 240, '#ef4444']]) { ctx.beginPath(); ctx.arc(cx, cy, R, toA(v0), toA(v1)); ctx.lineWidth = 34; ctx.strokeStyle = c; ctx.stroke(); }
  ctx.font = '900 30px Inter, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const v of [0, 60, 120, 180, 240]) { const a = toA(v); ctx.fillText(String(v), cx + Math.cos(a) * (R - 70), cy + Math.sin(a) * (R - 70)); }
  const a = toA(value) + 0.02 * Math.sin(hit * 9);
  ctx.lineCap = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = '#020617'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); ctx.stroke();
  ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

/* ---------- escenas ---------- */

const SCENES = {
  intro(ctx, o) {
    const { W, H, local, t } = o;
    // Rotterdam de noche, acercamiento lento; el título entra con el golpe (0.55 s).
    const shake = local > 0.55 && local < 0.9 ? Math.sin(t * 90) * 10 * (0.9 - local) : 0;
    ctx.translate(shake, 0);
    photo(ctx, 'rotterdam', 0, 0, W, H, { zoom: 1.04 + 0.012 * local, px: -0.3 + 0.05 * local, gray: 0.15, bright: 1.0, tint: '#312e81', tintA: 0.3 });
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, 'rgba(2,6,23,0.2)'], [0.6, 'rgba(2,6,23,0.35)'], [1, 'rgba(2,6,23,0.85)']]); ctx.fillRect(0, 0, W, H);
    if (local > 0.5 && local < 0.75) kit.flash(ctx, W, H, 0.6 * (0.75 - local) / 0.25);
    const k = clamp((local - 0.55) / 0.35);
    label(ctx, 960, 250, 'DOCUMENTAL ANIMADO · MUESTRA', { size: 30, align: 'center', accent: '#f43f5e' });
    bigTitle(ctx, 960, 400, 'DE ROTTERDAM', 150, k);
    bigTitle(ctx, 960, 560, 'AL UPTEMPO', 170, clamp((local - 0.75) / 0.35), { fill: '#f43f5e' });
    if (local > 1.6) { ctx.save(); ctx.globalAlpha = clamp((local - 1.6) / 0.5); pin(ctx, 120, 820, 0.8); label(ctx, 160, 790, 'ROTTERDAM, PAÍSES BAJOS', { size: 30 }); ctx.restore(); }
  },

  tr909(ctx, o) {
    const { W, H, local, cue, beat, hit } = o;
    // Foto impresa de la caja de ritmos + osciloscopio: el kick limpio… y luego roto (distorsión).
    const c1 = cue(1), rot = local >= c1;
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#111827'], [1, '#020617']]); ctx.fillRect(0, 0, W, H);
    photo(ctx, 'tr909', 0, 0, W, H, { zoom: 1.3, gray: 1, bright: 0.25, contrast: 1.2 });
    print(ctx, 'tr909', 560, 430, 820, 470, -0.04 + 0.01 * Math.sin(local * 0.6), ease(local / 0.5), { zoom: 1.02 + 0.01 * local });
    label(ctx, 170, 150, 'CAJA DE RITMOS · 1983', { size: 34, accent: '#facc15' });
    const drive = rot ? lerp(1, 14, ease((local - c1) / 0.4)) : 1;
    scope(ctx, 1080, 230, 720, 380, (u) => kickWave(u, drive), clamp((beat % 1) * 2.2), rot ? '#f43f5e' : '#38bdf8');
    label(ctx, 1080, 660, rot ? 'DISTORSIONADO' : 'LIMPIO', { size: 34, accent: rot ? '#f43f5e' : '#38bdf8' });
    bpmBox(ctx, 1630, 690, 140, hit, rot ? '#f43f5e' : '#38bdf8');
  },

  gabber(ctx, o) {
    const { W, H, local, hit } = o;
    // Multitud con color rojo; destellos en cada golpe (180 por minuto).
    ctx.save(); const z = 1 + 0.02 * hit; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    if (IMG['v:gabber']) photo(ctx, 'v:gabber', 0, 0, W, H, { zoom: 1.05, gray: 0.5, bright: 1.7, contrast: 1.15, tint: '#be123c', tintA: 0.5, blend: 'color' });
    else photo(ctx, 'crowd', 0, 0, W, H, { zoom: 1.08 + 0.01 * local, px: 0.2, gray: 1, bright: 0.62, contrast: 1.6, tint: '#be123c', tintA: 0.75, blend: 'color' });
    ctx.restore();
    scanlines(ctx, W, H, 0.12);
    if (IMG['v:gabber']) clipCredit(ctx, W, 'gabber');
    kit.flash(ctx, W, H, 0.22 * hit);
    ctx.fillStyle = 'rgba(2,6,23,0.35)'; ctx.fillRect(0, 0, W, H);
    bigTitle(ctx, 960, 380, 'GABBER', 260, clamp(local / 0.35), { fill: '#ffffff', stroke: '#9f1239' });
    if (local > 0.6) { ctx.save(); ctx.globalAlpha = clamp((local - 0.6) / 0.4); pin(ctx, 150, 640, 0.8); label(ctx, 190, 610, 'ROTTERDAM · 1991–1992', { size: 32 }); label(ctx, 190, 700, 'ENTRE 160 Y 200 BPM', { size: 32, accent: '#facc15' }); ctx.restore(); }
    bpmBox(ctx, 1630, 680, lerp(140, 185, ease(local / 1.2)), hit, '#f43f5e');
    songTag(ctx, 'gabber', (local - (o.s.audio ?? 99)) / 0.4);
  },

  hardstyle(ctx, o) {
    const { W, H, local, cue, beat, hit } = o;
    // Escenario con láseres (azul/morado) y la onda corriendo: kick + bajo que crece al revés.
    const c1 = cue(1);
    ctx.save(); const z = 1 + 0.015 * hit; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    const hv = local < (o.s.audio ?? 99) ? 'te2007' : 'jump';
    if (IMG['v:' + hv]) photo(ctx, 'v:' + hv, 0, 0, W, H, { zoom: 1.04, gray: 0.35, bright: 0.95, contrast: 1.2, tint: '#7c3aed', tintA: 0.3, blend: 'color' });
    else photo(ctx, 'stage', 0, 0, W, H, { zoom: 1.12 - 0.01 * local, py: -0.2, gray: 0.5, bright: 0.8, contrast: 1.2, tint: '#7c3aed', tintA: 0.4, blend: 'color' });
    ctx.restore();
    if (IMG['v:' + hv]) clipCredit(ctx, W, hv);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, 'rgba(2,6,23,0.15)'], [1, 'rgba(2,6,23,0.75)']]); ctx.fillRect(0, 0, W, H);
    bigTitle(ctx, 960, 200, 'HARDSTYLE', 170, clamp(local / 0.35), { fill: '#a5f3fc', stroke: '#1e1b4b' });
    label(ctx, 960, 330, 'PAÍSES BAJOS · HACIA EL AÑO 2000 · ~150 BPM', { size: 30, align: 'center', accent: '#22d3ee' });
    // Onda de 2 golpes que corre: en cada golpe el kick y entre golpes el bajo que crece.
    const show = (u) => {
      const b = (u * 2 + beat) % 1;                                   // posición dentro del golpe
      if (b < 0.5) { const tt = b * 0.4; return Math.tanh(Math.sin(2 * Math.PI * (55 * tt + 8 * (1 - Math.exp(-tt / 0.012)))) * 3) * Math.exp(-tt / 0.3) * (b < 0.45 ? 1 : (0.5 - b) * 20); }
      const r = (b - 0.5) / 0.5; return Math.tanh(Math.sin(2 * Math.PI * 22 * r) * 3) * r ** 2.2 * (r < 0.97 ? 1 : 0);
    };
    if (local < (o.s.audio ?? 99) + 0.3) scope(ctx, 260, 430, 1400, 300, show, 1, '#22d3ee', 5);
    if (local > c1 - 0.2) { ctx.save(); ctx.globalAlpha = clamp((local - c1 + 0.2) / 0.4); label(ctx, 300, 790, 'KICK', { size: 30, accent: '#22d3ee' }); label(ctx, 1200, 790, 'BAJO AL REVÉS', { size: 30, accent: '#e879f9' }); ctx.restore(); }
    bpmBox(ctx, 1700, 200, 150, hit, '#22d3ee');
    songTag(ctx, 'hardstyle', (local - (o.s.audio ?? 99)) / 0.4);
  },

  uptempo(ctx, o) {
    const { W, H, local, beat, hit, t } = o;
    // Cortes rápidos entre fotos, cada 2 golpes; rebanadas «glitch» en el golpe; medidor en rojo.
    let k = UPKEYS[Math.floor(beat / 2) % UPKEYS.length]; if (k.startsWith('v:') && !IMG[k]) k = 'stage';
    photo(ctx, k, 0, 0, W, H, { zoom: 1.15 + 0.05 * hit, gray: 1, bright: 0.8, contrast: 1.4, tint: '#dc2626', tintA: 0.6, blend: 'color' });
    if (hit > 0.5) {
      const R = kit.rng(Math.floor(beat) + 3);
      for (let i = 0; i < 6; i++) { const y = R() * H, h = 20 + R() * 70, dx = (R() - 0.5) * 120 * hit; ctx.drawImage(ctx.canvas, 0, y * (ctx.canvas.height / H), ctx.canvas.width, h * (ctx.canvas.height / H), dx, y, W, h); }
    }
    ctx.fillStyle = 'rgba(2,6,23,0.4)'; ctx.fillRect(0, 0, W, H);
    kit.flash(ctx, W, H, 0.18 * hit);
    bigTitle(ctx, 720, 300, 'UPTEMPO', 230, clamp(local / 0.3), { fill: '#ffffff', stroke: '#7f1d1d' });
    label(ctx, 360, 480, 'MÁS DE 200 BPM', { size: 40, accent: '#ef4444' });
    gauge(ctx, 1500, 560, 260, lerp(150, 210, ease(local / 1.5)), hit);
    kit.text(ctx, String(Math.round(lerp(150, 210, ease(local / 1.5)))), 1500, 690, { size: 80, fill: '#ffffff' });
    if (k.startsWith('v:')) clipCredit(ctx, W, k.slice(2));
    songTag(ctx, 'uptempo', (local - (o.s.audio ?? 99)) / 0.4);
  },

  cierre(ctx, o) {
    const { W, H, local } = o;
    // Línea del tiempo con los tres estilos y su velocidad; «próximamente».
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0f172a'], [1, '#020617']]); ctx.fillRect(0, 0, W, H);
    photo(ctx, 'decks', 0, 0, W, H, { zoom: 1.1, gray: 1, bright: 0.25 });
    const k = ease(local / 1.2);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(260, 420); ctx.lineTo(lerp(260, 1660, k), 420); ctx.stroke(); ctx.restore();
    const N = [[400, '1991–92', 'GABBER', '160–200 BPM', '#f43f5e'], [960, '~2000', 'HARDSTYLE', '~150 BPM', '#22d3ee'], [1520, 'HOY', 'UPTEMPO', '+200 BPM', '#ef4444']];
    N.forEach(([x, yr, name, bpm, c], i) => {
      const a = clamp((local - 0.3 - i * 0.35) / 0.35); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(x, 420, 26, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      kit.text(ctx, yr, x, 340, { size: 38, fill: '#cbd5e1', stroke: null });
      kit.text(ctx, name, x, 510, { size: 62, fill: c });
      kit.text(ctx, bpm, x, 580, { size: 36, fill: '#ffffff', stroke: null });
      ctx.restore();
    });
    if (local > 1.6) { ctx.save(); ctx.globalAlpha = clamp((local - 1.6) / 0.5); label(ctx, 960, 720, 'PRÓXIMAMENTE: EL DOCUMENTAL COMPLETO', { size: 40, align: 'center', accent: '#facc15' }); ctx.restore(); }
    kit.text(ctx, 'Fotos, videos y música: Wikimedia Commons (licencias libres) · Créditos completos en la descripción', 960, 1040, { size: 22, fill: '#94a3b8', stroke: null });
  },
};
