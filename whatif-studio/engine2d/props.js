// Piezas compartidas para los Shorts 2D de calidad alta (nubes, Sol, mar, lluvia, grietas, termómetro…).
// Todas dibujan con contorno negro grueso y sombreado suave, igual que engine2d/hq.js.
import * as hq from './hq.js';
import { rng } from './kit.js';

export const TAU = Math.PI * 2;
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
