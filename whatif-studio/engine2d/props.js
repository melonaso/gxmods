// Piezas compartidas para los Shorts 2D de calidad alta (nubes, Sol, mar, lluvia, grietas, termómetro…).
// Todas dibujan con contorno negro grueso y sombreado suave, igual que engine2d/hq.js.
import * as hq from './hq.js';
import { rng } from './kit.js';

export const TAU = Math.PI * 2;

/** Personaje fijo del canal (el del logo): camisa verde, pantalón azul, pelo oscuro. Uso: hq.toon(ctx, x, y, h, { ...HERO, t, … }). */
export const HERO = { shirt: '#22c55e', pants: '#1e3a8a', skin: '#e8b48a', hair: '#2b1a10', hairStyle: 'short', iris: '#4b2e1a' };

/** Pez de perfil (mira a la izquierda; dir = -1 lo voltea). sick 0..1: se pone panza arriba. */
export function fish(ctx, x, y, s, color, { sick = 0, t = 0, seed = 0, dir = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(sick * Math.PI * 0.9);
  const wag = Math.sin(t * 9 + seed) * 8 * (1 - sick);
  ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(88, -26 + wag); ctx.lineTo(88, 26 + wag); ctx.closePath(); ctx.fillStyle = hq.shade(color, -0.15); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 56, 28 * (1 - 0.3 * sick), 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -30, 30, [[0, hq.shade(color, 0.2)], [1, hq.shade(color, -0.2)]]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(15,23,42,0.35)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-10 + i * 14, -6 + (i % 2) * 10, 4, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(-28, -6, 10, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(-30, -4, sick > 0.4 ? 3 : 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

/** Cubito de sal (o de azúcar) visto de frente. */
export function saltCube(ctx, x, y, s, rot = 0, fill = '#ffffff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  hq.roundRectPath(ctx, -s / 2, -s / 2, s, s, s * 0.15); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(2, s * 0.12); ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

/** Olla con agua sobre una estufa; boil 0..1 = burbujas. */
export function pot(ctx, x, y, w, t, { boil = 0, flame = 1, water = '#38bdf8' } = {}) {
  ctx.save(); ctx.translate(x, y);
  // Estufa y llama.
  hq.roundRectPath(ctx, -w * 0.75, 0, w * 1.5, w * 0.22, 14); ctx.fillStyle = '#334155'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  if (flame > 0) for (let i = 0; i < 7; i++) { const fx = -w * 0.42 + i * w * 0.14, fh = w * (0.1 + 0.04 * Math.sin(t * 14 + i * 2)) * flame; ctx.beginPath(); ctx.moveTo(fx - 12, -2); ctx.quadraticCurveTo(fx, -fh * 1.6, fx + 12, -2); ctx.closePath(); ctx.fillStyle = '#3b82f6'; ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - 6, -2); ctx.quadraticCurveTo(fx, -fh, fx + 6, -2); ctx.closePath(); ctx.fillStyle = '#bae6fd'; ctx.fill(); }
  // Olla.
  const top = -w * 0.78, bot = -w * 0.12;
  ctx.beginPath(); ctx.moveTo(-w / 2, top); ctx.lineTo(-w / 2 + 10, bot); ctx.quadraticCurveTo(-w / 2 + 14, bot + 14, -w / 2 + 30, bot + 14); ctx.lineTo(w / 2 - 30, bot + 14); ctx.quadraticCurveTo(w / 2 - 14, bot + 14, w / 2 - 10, bot); ctx.lineTo(w / 2, top); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, top, bot, [[0, '#cbd5e1'], [1, '#64748b']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  for (const s of [-1, 1]) { hq.roundRectPath(ctx, s > 0 ? w / 2 - 6 : -w / 2 - w * 0.16 + 6, top + w * 0.1, w * 0.16, w * 0.07, 10); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.stroke(); }
  // Agua y burbujas.
  ctx.beginPath(); ctx.ellipse(0, top + 4, w / 2 - 4, w * 0.07, 0, 0, TAU); ctx.fillStyle = water; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  if (boil > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const u = (t * 2.2 + i * 0.37) % 1, bx = -w * 0.38 + ((i * 0.618) % 1) * w * 0.76, r = (6 + (i % 3) * 4) * boil * Math.sin(u * Math.PI); if (r > 1) { ctx.beginPath(); ctx.arc(bx, top + 4 - r * 0.3, r, 0, TAU); ctx.fill(); ctx.stroke(); } }
    ctx.save(); ctx.globalAlpha = 0.55 * boil; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const sx = -w * 0.25 + i * w * 0.25; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const u = k / 8; ctx.lineTo(sx + 16 * Math.sin(u * 6 + t * 3 + i), top - 20 - u * w * 0.5); } ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}

/** Huevo entero con cáscara (s = alto aproximado). */
export function egg(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.55, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -s * 0.55, s * 0.55, [[0, '#fff7ed'], [1, '#fed7aa']]); ctx.fill(); ctx.lineWidth = Math.max(3, s * 0.06); ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-s * 0.14, -s * 0.22, s * 0.08, s * 0.14, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}
export const INK = '#0b0f1a';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, k) => a + (b - a) * k;
/** Rebote al aparecer: 0 → 1.12 → 1. */
export const pop = (x) => { x = clamp(x); return x < 0.7 ? (x / 0.7) * 1.12 : 1.12 - 0.12 * ((x - 0.7) / 0.3); };

/** Mezcla dos colores #rrggbb. */
export function mixc(c1, c2, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], clamp(k)))).join(',')})`;
}

/** Fondo de cielo (degradado vertical) de y0 a y1. */
export function sky(ctx, W, y0, y1, top, bottom) { ctx.fillStyle = hq.vgrad(ctx, 0, y0, y1, [[0, top], [1, bottom]]); ctx.fillRect(0, y0, W, y1 - y0); }

/** Suelo desde y hasta abajo, con línea de horizonte. */
export function ground(ctx, W, H, y, top, bottom) {
  ctx.fillStyle = hq.vgrad(ctx, 0, y, H, [[0, top], [1, bottom]]); ctx.fillRect(0, y, W, H - y);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}

export function cloud(ctx, x, y, s, fill = '#ffffff', a = 1) {
  if (a <= 0) return;
  const blobs = [[-0.55, 0.12, 0.36], [-0.2, -0.16, 0.5], [0.28, -0.06, 0.44], [0.62, 0.14, 0.3], [0.04, 0.2, 0.4]];
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = INK; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, r * s + 6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = fill; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, r * s, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - 0.25 * s, y - 0.32 * s, 0.24 * s, 0.07 * s, -0.2, 0, TAU); ctx.fill();
  ctx.restore();
}

export function sunDisc(ctx, x, y, r, t, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  hq.glow(ctx, x, y, r * 3, 'rgba(253,224,71,A)', 0.55);
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.2);
  for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-r * 0.13, -r * 1.16); ctx.lineTo(0, -r * 1.5); ctx.lineTo(r * 0.13, -r * 1.16); ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, '#fef08a'], [1, '#f59e0b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

export function rain(ctx, W, y0, y1, tt, a, n = 70, x0 = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(219,234,254,0.95)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = x0 + ((i * 157.3) % W), y = y0 + ((i * 263.7 + tt * 1500) % (y1 - y0)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 44); ctx.stroke(); }
  ctx.restore();
}

/** Mar visto de lado: agua de y hacia abajo con olas. */
export function sea(ctx, W, H, y, t, { top = '#38bdf8', bottom = '#0c4a6e', amp = 7 } = {}) {
  ctx.fillStyle = hq.vgrad(ctx, 0, y, H, [[0, top], [1, bottom]]);
  ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y + amp * Math.sin(x * 0.03 + t * 3)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(224,242,254,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y + amp * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
}

export function cracks(ctx, x0, y0, x1, y1, seed, a = 1, n = 14) {
  if (a <= 0) return;
  const R = rng(seed);
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(69,26,3,0.65)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) { let x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 90; y += (R() - 0.35) * 26; ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.restore();
}

/** Árbol frondoso (copa de varias bolas) con la base en (x, y). k = escala (0 = no se ve). */
export function bushyTree(ctx, x, y, h, { k = 1, leaf = '#22c55e', trunk = '#92400e', seed = 1 } = {}) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  hq.groundShadow(ctx, 0, 0, h * 0.28, 0.25);
  ctx.beginPath(); ctx.moveTo(-h * 0.06, 0); ctx.lineTo(-h * 0.04, -h * 0.5); ctx.lineTo(h * 0.04, -h * 0.5); ctx.lineTo(h * 0.06, 0); ctx.closePath();
  ctx.fillStyle = trunk; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  const R = rng(seed), blobs = [[0, -h * 0.72, h * 0.26]];
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + R(); blobs.push([Math.cos(a) * h * 0.2, -h * 0.68 + Math.sin(a) * h * 0.14, h * (0.15 + R() * 0.06)]); }
  ctx.fillStyle = INK; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r + 5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = leaf; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(h * 0.1, -h * 0.6, h * 0.24, h * 0.16, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-h * 0.1, -h * 0.84, h * 0.12, h * 0.05, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Palmera con la base en (x, y). */
export function palm(ctx, x, y, s, { dead = false, k = 1 } = {}) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -90, 50, -170); ctx.stroke();
  ctx.strokeStyle = dead ? '#78350f' : '#a16207'; ctx.lineWidth = 18; ctx.stroke();
  const leaf = dead ? '#a16207' : '#16a34a';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55, L = 120, droop = dead ? 70 : 35;
    ctx.beginPath(); ctx.moveTo(50, -170);
    ctx.quadraticCurveTo(50 + Math.cos(a) * L * 0.6, -170 + Math.sin(a) * L * 0.6 - 30, 50 + Math.cos(a) * L, -170 + Math.sin(a) * L + droop);
    ctx.quadraticCurveTo(50 + Math.cos(a) * L * 0.5, -170 + Math.sin(a) * L * 0.5 + 10, 50, -165);
    ctx.fillStyle = leaf; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}

/** Termómetro vertical: k = nivel 0..1. */
export function thermometer(ctx, x, y, h, k, color = '#ef4444') {
  hq.roundRectPath(ctx, x - 22, y - h, 44, h, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  const top = y - 30 - (h - 60) * clamp(k);
  hq.roundRectPath(ctx, x - 10, top, 20, y - top, 10); ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + 6, 36, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; for (let i = 1; i < 6; i++) { const yy = y - 30 - ((h - 60) * i) / 6; ctx.beginPath(); ctx.moveTo(x + 22, yy); ctx.lineTo(x + 36, yy); ctx.stroke(); }
}

/** Gotita de agua (o de sudor). */
export function drop(ctx, x, y, r, fill = '#38bdf8') {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.8); ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.1, x, y + r); ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.1, x, y - r * 1.8);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
}

/** Nubecita de humo/polvo que aparece al desaparecer algo (k 0..1). */
export function puff(ctx, x, y, k, s = 90, color = '#ffffff') {
  if (k <= 0 || k >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * k, y + Math.sin(a) * s * k * 0.7, s * 0.24 * (1 - k * 0.5), 0, TAU); ctx.fill(); }
  ctx.restore();
}

/** Fondo de espacio con estrellas fijas. */
const STARS = (() => { const R = rng(7); return Array.from({ length: 130 }, () => [R() * 1080, R() * 1920, 0.8 + R() * 2.2, R() * 6]); })();
export function space(ctx, W, H, t, top = '#020617', bottom = '#1e1b4b') {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, top], [1, bottom]]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  for (const [x, y, s, tw] of STARS) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 1.5 + tw); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}

/** Edificio simple con ventanas, base en y. */
export function tower(ctx, x, base, w, floors, color, fh = 26) {
  const h = floors * fh;
  hq.roundRectPath(ctx, x, base - h, w, h, 6); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (let f = 0; f < floors; f++) for (let c = 0; c < Math.floor(w / 30); c++) { ctx.fillStyle = (f * 7 + c * 3) % 5 ? '#fde68a' : '#334155'; ctx.fillRect(x + 10 + c * 30, base - h + 8 + f * fh, 16, 14); }
}

/** Estrella con su color según el tipo: 'sun' (amarilla), 'blue' (blanca azulada, tipo Sirio), 'red' (roja chica),
 *  'giant' (roja enorme con manchas), 'white' (blanca diminuta y muy brillante). rays: picos alrededor. */
const STAR_COLORS = {
  sun: ['#fef08a', '#f59e0b', '#fbbf24', 'rgba(253,224,71,A)'],
  blue: ['#ffffff', '#93c5fd', '#e0f2fe', 'rgba(224,242,254,A)'],
  red: ['#fdba74', '#dc2626', '#f97316', 'rgba(248,113,113,A)'],
  giant: ['#fb923c', '#991b1b', '#ef4444', 'rgba(239,68,68,A)'],
  white: ['#ffffff', '#e0f2fe', '#ffffff', 'rgba(255,255,255,A)'],
};
export function starBall(ctx, x, y, r, t, { kind = 'sun', rays = true, glowK = 1 } = {}) {
  const [c0, c1, cr, cg] = STAR_COLORS[kind] || STAR_COLORS.sun;
  hq.glow(ctx, x, y, r * (kind === 'white' ? 6 : 3), cg, 0.55 * glowK);
  if (rays && kind !== 'giant') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.2);
    for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); ctx.beginPath(); ctx.moveTo(-r * 0.12, -r * 1.14); ctx.lineTo(0, -r * 1.45); ctx.lineTo(r * 0.12, -r * 1.14); ctx.closePath(); ctx.fillStyle = cr; ctx.fill(); ctx.lineWidth = Math.min(4, r * 0.08); ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, c0], [1, c1]]); ctx.fill();
  if (kind === 'giant') {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const R = rng(13); ctx.fillStyle = 'rgba(127,29,29,0.35)';
    for (let i = 0; i < 14; i++) { const a = R() * TAU, d = R() * r * 0.85, s = r * (0.08 + R() * 0.14); ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d + Math.sin(t * 0.5 + i) * r * 0.02, y + Math.sin(a) * d, s * 1.3, s, a, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = Math.max(3, Math.min(7, r * 0.06)); ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.14, -0.6, 0, TAU); ctx.fill();
}

/** Agujero negro quieto: disco negro con un anillo de luz doblada alrededor. */
export function blackHole(ctx, x, y, r, t) {
  hq.glow(ctx, x, y, r * 3.2, 'rgba(251,191,36,A)', 0.25);
  ctx.save(); ctx.lineWidth = r * 0.18; ctx.strokeStyle = 'rgba(253,230,138,0.85)'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.35, r * 1.35, 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = r * 0.08; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x, y, r * 1.22, t % TAU, (t % TAU) + 1.2); ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#000000'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fde68a'; ctx.stroke();
}

/** Órbita punteada (arco) alrededor de (cx, cy). */
export function orbit(ctx, cx, cy, r, a0 = 0, a1 = TAU, color = 'rgba(226,232,240,0.5)') {
  ctx.save(); ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke(); ctx.restore();
}

/** Planeta simple con degradado. */
export function planet(ctx, x, y, r, c0, c1) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, c0], [1, c1]]); ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.12); ctx.strokeStyle = INK; ctx.stroke();
}
