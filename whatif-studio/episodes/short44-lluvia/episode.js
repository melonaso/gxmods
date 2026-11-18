// Short 44: ¿y si dejara de llover para siempre?  (calidad alta: engine2d/hq.js)
// Gancho corto: ¿qué se acaba primero? (se contesta en orden). Sin palabras técnicas.
// Ríos (los llena la lluvia; se secan en meses) → agua de la casa (presas y pozos se vacían; la llave se seca) →
// comida (8 de cada 10 campos solo reciben lluvia; maíz y trigo se secan) → el aire se ensucia (la lluvia lo lava) →
// sorpresa: Atacama, tan seco que la NASA prueba ahí robots para Marte… y cuando llueve, se llena de flores.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.06, vig: 0.3 });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const INK = '#0b0f1a';
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
function mixc(c1, c2, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], clamp(k)))).join(',')})`;
}

function cloud(ctx, x, y, s, fill = '#ffffff', a = 1) {
  if (a <= 0) return;
  const blobs = [[-0.55, 0.12, 0.36], [-0.2, -0.16, 0.5], [0.28, -0.06, 0.44], [0.62, 0.14, 0.3], [0.04, 0.2, 0.4]];
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = INK; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, r * s + 6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = fill; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, r * s, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - 0.25 * s, y - 0.32 * s, 0.24 * s, 0.07 * s, -0.2, 0, TAU); ctx.fill();
  ctx.restore();
}

function sunDisc(ctx, x, y, r, t, a = 1, dim = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  hq.glow(ctx, x, y, r * 3, 'rgba(253,224,71,A)', 0.55 * (1 - dim));
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.2);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-r * 0.13, -r * 1.16); ctx.lineTo(0, -r * 1.5); ctx.lineTo(r * 0.13, -r * 1.16); ctx.closePath();
    ctx.fillStyle = mixc('#fbbf24', '#c2410c', dim); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, mixc('#fef08a', '#fb923c', dim)], [1, mixc('#f59e0b', '#9a3412', dim)]]); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

function rain(ctx, W, y0, y1, tt, a, n = 70) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(219,234,254,0.95)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = (i * 157.3) % W, y = y0 + ((i * 263.7 + tt * 1500) % (y1 - y0)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 44); ctx.stroke(); }
  ctx.restore();
}

function cracks(ctx, x0, y0, x1, y1, seed, a = 1, n = 14) {
  if (a <= 0) return;
  const R = kit.rng(seed);
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(69,26,3,0.65)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    let x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 90; y += (R() - 0.35) * 26; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.restore();
}

function umbrella(ctx, hx, hy) {
  const cx = hx - 30, cy = hy - 85, R = 165;
  ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(hx + 6, hy + 22); ctx.quadraticCurveTo(hx + 22, hy + 30, hx + 18, hy + 10); ctx.moveTo(hx + 6, hy + 22); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.quadraticCurveTo(cx - R, cy - R * 0.85, cx, cy - R * 0.85); ctx.quadraticCurveTo(cx + R, cy - R * 0.85, cx + R, cy);
  for (let i = 0; i < 4; i++) { const x0 = cx + R - (i * R) / 2; ctx.quadraticCurveTo(x0 - R / 4, cy - R * 0.16, x0 - R / 2, cy); }
  ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, cy - R, cy, [[0, '#f87171'], [1, '#dc2626']]); ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.lineWidth = 4; for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(cx, cy - R * 0.85); ctx.quadraticCurveTo(cx + k * R * 0.8, cy - R * 0.5, cx + k * R, cy); ctx.stroke(); }
}

function cornPlant(ctx, x, y, h, wilt, seed) {
  const leaf = mixc('#22c55e', '#a16207', wilt), stalk = mixc('#16a34a', '#92400e', wilt);
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.12 * wilt * (seed % 2 ? 1 : -1));
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = h * 0.07 + 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h); ctx.stroke();
  ctx.strokeStyle = stalk; ctx.lineWidth = h * 0.07; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const s = i % 2 ? 1 : -1, y0 = -h * (0.25 + i * 0.17), droop = 0.25 + 0.9 * wilt;
    ctx.beginPath(); ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(s * h * 0.25, y0 - h * 0.18 * (1 - droop), s * h * 0.42, y0 + h * 0.12 * droop);
    ctx.quadraticCurveTo(s * h * 0.22, y0 + h * 0.02, 0, y0 + h * 0.05); ctx.closePath();
    ctx.fillStyle = leaf; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  // Mazorca.
  ctx.save(); ctx.translate(h * 0.05, -h * 0.55); ctx.rotate(0.35);
  ctx.beginPath(); ctx.ellipse(0, 0, h * 0.06, h * 0.13, 0, 0, TAU); ctx.fillStyle = mixc('#facc15', '#a16207', wilt * 0.7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-h * 0.06, h * 0.1); ctx.quadraticCurveTo(-h * 0.08, -h * 0.05, 0, -h * 0.1); ctx.lineTo(h * 0.02, h * 0.12); ctx.closePath(); ctx.fillStyle = leaf; ctx.fill(); ctx.stroke();
  ctx.restore();
  // Espiga.
  ctx.strokeStyle = mixc('#fde68a', '#92400e', wilt); ctx.lineWidth = 5; for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(Math.sin(a) * h * 0.12, -h - Math.cos(a) * h * 0.12 + wilt * h * 0.05); ctx.stroke(); }
  ctx.restore();
}

function rover(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  hq.groundShadow(ctx, 0, 0, 170, 0.3);
  // Brazos de la suspensión.
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const arms = () => { ctx.beginPath(); ctx.moveTo(-115, -34); ctx.lineTo(-55, -92); ctx.lineTo(0, -34); ctx.moveTo(-55, -92); ctx.lineTo(115, -34); };
  ctx.strokeStyle = INK; ctx.lineWidth = 16; arms(); ctx.stroke(); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 8; arms(); ctx.stroke();
  for (const wx of [-115, 0, 115]) {
    ctx.beginPath(); ctx.arc(wx, -34, 34, 0, TAU); ctx.fillStyle = '#374151'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.translate(wx, -34); ctx.rotate(t * 2.2); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 5;
    for (let k = 0; k < 4; k++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(wx, -34, 10, 0, TAU); ctx.fillStyle = '#d1d5db'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  // Cuerpo.
  hq.roundRectPath(ctx, -150, -165, 300, 76, 12); ctx.fillStyle = hq.vgrad(ctx, 0, -165, -89, [[0, '#f8fafc'], [1, '#cbd5e1']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  hq.roundRectPath(ctx, -132, -152, 110, 50, 8); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(146,64,14,0.5)'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-132 + i * 27, -150); ctx.lineTo(-132 + i * 27, -104); ctx.stroke(); }
  // Mástil con «cara» (cámaras).
  ctx.fillStyle = '#d1d5db'; ctx.fillRect(66, -285, 20, 122); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(66, -285, 20, 122);
  hq.roundRectPath(ctx, 26, -332, 100, 52, 12); ctx.fillStyle = '#e5e7eb'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  for (const ex of [56, 96]) { ctx.beginPath(); ctx.arc(ex, -306, 14, 0, TAU); ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); ctx.beginPath(); ctx.arc(ex - 4, -310, 4, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  // Antena.
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-60, -165); ctx.lineTo(-60, -225); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-60, -228, 26, 10, 0, 0, TAU); ctx.fillStyle = '#e5e7eb'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}

function flower(ctx, x, y, r, color, k) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = '#15803d'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 1.2); ctx.stroke();
  ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.ellipse(r * 0.4, -r * 0.4, r * 0.4, r * 0.16, -0.5, 0, TAU); ctx.fill();
  const cy = -r * 1.3;
  for (const [fill, pad] of [[INK, 4], [color, 0]]) {
    ctx.fillStyle = fill;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5 + pad, r * 0.34 + pad, a, 0, TAU); ctx.fill(); }
  }
  ctx.beginPath(); ctx.arc(0, cy, r * 0.28, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Llueve sobre la ciudad… y de golpe deja de llover: se van las nubes, sale un Sol fuerte y el pasto se seca.
    const stop = ease((local - 0.9) / 0.8), dry = ease((local - 1.8) / 2.2);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 1000, [[0, '#475569'], [1, '#94a3b8']]); ctx.fillRect(0, 0, W, 1000);
    ctx.save(); ctx.globalAlpha = stop; ctx.fillStyle = hq.vgrad(ctx, 0, 0, 1000, [[0, '#38bdf8'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 1000); ctx.restore();
    sunDisc(ctx, 860, 560, 54 + 24 * stop, t, stop);
    for (let i = 0; i < 7; i++) kit.building(ctx, 80 + i * 155, 1000, 124, 170 + ((i * 53) % 5) * 46, { color: mixc('#64748b', '#94a3b8', stop), lw: 5 });
    ctx.fillStyle = hq.vgrad(ctx, 0, 990, H, [[0, '#4ade80'], [1, '#15803d']]); ctx.fillRect(0, 990, W, H);
    ctx.save(); ctx.globalAlpha = dry; ctx.fillStyle = hq.vgrad(ctx, 0, 990, H, [[0, '#d6b36a'], [1, '#92400e']]); ctx.fillRect(0, 990, W, H); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 990); ctx.lineTo(W, 990); ctx.stroke();
    cracks(ctx, 0, 1020, W, 1500, 7, dry, 22);
    const pw = 380 * (1 - dry);
    if (pw > 6) { ctx.beginPath(); ctx.ellipse(540, 1050, pw / 2, pw / 9, 0, 0, TAU); ctx.fillStyle = 'rgba(56,189,248,0.8)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    for (const [x, y, s] of [[180, 470, 190], [560, 430, 230], [920, 480, 170]]) cloud(ctx, x + (x < 540 ? -1 : 1) * stop * 520, y - stop * 140, s, '#64748b', 1 - stop);
    rain(ctx, W, 380, 1000, Math.min(local, 0.9), 1 - stop);
    // Gotas que se quedan quietas y desaparecen (pop).
    if (stop > 0 && stop < 1) for (let i = 0; i < 26; i++) { const x = (i * 211.7) % W, y = 420 + ((i * 97.3) % 560); ctx.save(); ctx.globalAlpha = 1 - stop; ctx.beginPath(); ctx.arc(x, y, 6 + 18 * stop, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = '#e0f2fe'; ctx.stroke(); ctx.restore(); }
    const shock = local > 1.2;
    hq.toon(ctx, 540, 1060, 400, {
      t, seed: 2, shirt: '#f97316', hair: '#1f2937', armR: [2.75, 0.1], armL: [0.25, 0.2],
      eyes: shock ? 'wide' : 'open', mouth: shock ? 'o' : 'smile', look: shock ? [0.4, -1] : [0, 0], brows: shock ? 1 : 0,
      hold: (c, h) => umbrella(c, h.R[0], h.R[1]),
    });
  },

  rios(ctx, o) {
    const { W, H, local, cue, t, s } = o;
    // Un río bajo un puente: la nube que lo llenaba se va y el agua baja hasta dejar el lecho seco y el bote varado.
    const c1 = cue(1), k0 = clamp(local / Math.max(0.6, c1)), k1 = ease((local - c1) / Math.max(0.8, s.dur - c1 - 0.3));
    const lvl = 715 + 45 * k0 + 260 * k1;
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 760, [[0, '#38bdf8'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 760);
    sunDisc(ctx, 880, 520, 52, t, 0.4 + 0.6 * k0);
    // Montañas al fondo.
    ctx.beginPath(); ctx.moveTo(0, 720); ctx.lineTo(160, 560); ctx.lineTo(300, 650); ctx.lineTo(470, 520); ctx.lineTo(640, 660); ctx.lineTo(820, 570); ctx.lineTo(W, 690); ctx.lineTo(W, 760); ctx.lineTo(0, 760); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 520, 760, [[0, '#a8a29e'], [1, '#78716c']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // La nube de lluvia que llenaba el río (se va).
    rain(ctx, 380, 520, 700, t, (1 - k0) * 0.9, 18);
    cloud(ctx, 200 - 300 * k0, 500, 150, '#94a3b8', 1 - k0);
    // Cauce: lodo (y grietas) + agua recortada al cauce.
    const bed = () => { ctx.beginPath(); ctx.moveTo(200, 705); ctx.bezierCurveTo(320, 1010, 760, 1010, 880, 705); ctx.closePath(); };
    bed(); ctx.fillStyle = hq.vgrad(ctx, 0, 705, 940, [[0, '#a16207'], [1, '#713f12']]); ctx.fill();
    ctx.save(); bed(); ctx.clip();
    cracks(ctx, 280, 760, 800, 920, 3, k1, 12);
    ctx.fillStyle = hq.vgrad(ctx, 0, lvl, 960, [[0, 'rgba(14,165,233,0.95)'], [1, 'rgba(12,74,110,0.95)']]); ctx.fillRect(0, lvl, W, 400);
    ctx.strokeStyle = 'rgba(224,242,254,0.85)'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, lvl + 6 * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
    ctx.restore();
    // Orillas.
    ctx.beginPath(); ctx.moveTo(0, 700); ctx.lineTo(200, 705); ctx.bezierCurveTo(320, 1010, 760, 1010, 880, 705); ctx.lineTo(W, 700); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 700, H, [[0, mixc('#4ade80', '#ca8a04', k1)], [0.15, '#92400e'], [1, '#451a03']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    kit.tree(ctx, 95, 702, 240, { leaf: mixc('#3fae5a', '#b45309', k1) });
    kit.tree(ctx, 990, 702, 220, { leaf: mixc('#3fae5a', '#b45309', k1) });
    // Puente de piedra.
    ctx.beginPath(); ctx.moveTo(230, 712); ctx.quadraticCurveTo(540, 470, 850, 712); ctx.lineTo(850, 712); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#d6d3d1'; ctx.stroke();
    for (const x of [320, 420, 540, 660, 760]) { const u = (x - 230) / 620, ya = 712 - 484 * u * (1 - u); if (ya < 612) continue; ctx.fillStyle = '#d6d3d1'; ctx.fillRect(x - 7, 600, 14, ya - 600); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x - 7, 600, 14, ya - 600); }
    hq.roundRectPath(ctx, 130, 572, 820, 38, 8); ctx.fillStyle = '#e7e5e4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // Bote: flota y al final queda varado y ladeado en el lodo.
    const by = Math.min(lvl, 925), tilt = k1 > 0.85 ? 0.25 * ease((k1 - 0.85) / 0.15) : 0.04 * Math.sin(t * 2);
    ctx.save(); ctx.translate(600, by); ctx.rotate(tilt);
    ctx.beginPath(); ctx.moveTo(-90, -18); ctx.lineTo(90, -18); ctx.lineTo(62, 22); ctx.lineTo(-62, 22); ctx.closePath(); ctx.fillStyle = '#b91c1c'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(-90, -24, 180, 8); ctx.strokeRect(-90, -24, 180, 8);
    ctx.restore();
    hq.tag(ctx, 540, 410, local < c1 ? 'LOS LLENA LA LLUVIA' : 'SECOS EN MESES', { size: 44, fill: local < c1 ? '#bae6fd' : '#fca5a5' });
  },

  casa(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Corte de una presa: el agua baja y deja la «marca de la bañera» en la montaña.
      const k = ease((local - 0.2) / Math.max(0.8, c1 - 0.3)), lvl = 600 + 330 * k;
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#7dd3fc'], [1, '#f0f9ff']]); ctx.fillRect(0, 0, W, H);
      sunDisc(ctx, 900, 520, 50, t);
      const xs = (y) => ((y - 480) / 520) * 620, xw = (y) => 650 - ((y - 540) / 460) * 30;
      // Agua del embalse (triángulo entre la ladera y la cortina).
      ctx.beginPath(); ctx.moveTo(xs(lvl), lvl); ctx.lineTo(xw(lvl), lvl); ctx.lineTo(620, 1000); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, lvl, 1000, [[0, '#38bdf8'], [1, '#0c4a6e']]); ctx.fill();
      ctx.strokeStyle = 'rgba(224,242,254,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(xs(lvl), lvl); ctx.lineTo(xw(lvl), lvl); ctx.stroke();
      // Ladera y suelo.
      ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(620, 1000); ctx.lineTo(W, 1000); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, 480, H, [[0, '#a8a29e'], [0.4, '#78716c'], [1, '#44403c']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      // Marca clara donde antes llegaba el agua.
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(xs(600) - 4, 598); ctx.lineTo(xs(lvl) - 4, lvl - 2); ctx.stroke();
      // Cortina de la presa.
      ctx.beginPath(); ctx.moveTo(650, 540); ctx.lineTo(710, 540); ctx.lineTo(760, 1000); ctx.lineTo(620, 1000); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, 540, 1000, [[0, '#e5e7eb'], [1, '#9ca3af']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      // Tubo hacia el pueblo.
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(740, 970); ctx.lineTo(1000, 970); ctx.stroke(); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 12; ctx.stroke();
      kit.house(ctx, 860, 950, 110, 90, { lw: 5 }); kit.house(ctx, 990, 950, 100, 80, { wall: '#bfdbfe', lw: 5 });
      hq.tag(ctx, 540, 410, 'LAS PRESAS SE VACÍAN', { size: 44, fill: '#fde047' });
      return;
    }
    // Cocina: una última gota… y ya no sale nada.
    const k = local - c1;
    ctx.fillStyle = '#e0f2fe'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(14,116,144,0.18)'; ctx.lineWidth = 4;
    for (let y = 0; y < 1000; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1000); ctx.stroke(); }
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#94a3b8'], [1, '#475569']]); ctx.fillRect(0, 1000, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    // Llave en la pared.
    hq.roundRectPath(ctx, 690, 520, 50, 90, 10); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pipe = () => { ctx.beginPath(); ctx.moveTo(690, 565); ctx.lineTo(470, 565); ctx.quadraticCurveTo(430, 565, 430, 605); ctx.lineTo(430, 625); };
    ctx.strokeStyle = INK; ctx.lineWidth = 46; pipe(); ctx.stroke(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 34; pipe(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(670, 556); ctx.lineTo(480, 556); ctx.stroke();
    // Manija que gira.
    ctx.save(); ctx.translate(600, 520); ctx.rotate(-0.6 * ease(k / 0.5));
    ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(55, 0); ctx.stroke(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 12; ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(600, 520); ctx.lineTo(600, 548); ctx.stroke();
    // Persona con un vaso vacío.
    const look = [0.7, -0.6];
    hq.toon(ctx, 260, 1060, 430, {
      t, seed: 5, shirt: '#8b5cf6', hair: '#7c2d12', hairStyle: 'long', armR: [1.4, -0.4], armL: [0.2, 0.15],
      eyes: k > 1.2 ? 'bored' : 'open', mouth: k > 1.2 ? 'flat' : 'smile', look,
      hold: (c, h) => {
        const [hx, hy] = h.R;
        c.beginPath(); c.moveTo(hx - 34, hy - 75); c.lineTo(hx + 34, hy - 75); c.lineTo(hx + 26, hy + 25); c.lineTo(hx - 26, hy + 25); c.closePath();
        c.fillStyle = 'rgba(224,242,254,0.55)'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
        if (k > 1.0) { c.fillStyle = 'rgba(56,189,248,0.8)'; c.fillRect(hx - 24, hy + 15, 48, 8); }
      },
    });
    // Una última gota que cae.
    const dk = clamp((k - 0.3) / 0.7);
    if (dk > 0 && dk < 1) {
      const dy = dk < 0.4 ? 632 + 8 * (dk / 0.4) : 640 + 140 * ((dk - 0.4) / 0.6) ** 2, r = dk < 0.4 ? 6 + 6 * (dk / 0.4) : 12;
      ctx.beginPath(); ctx.moveTo(430, dy - r * 1.8); ctx.quadraticCurveTo(430 + r, dy - r * 0.2, 430, dy + r); ctx.quadraticCurveTo(430 - r, dy - r * 0.2, 430, dy - r * 1.8);
      ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
    if (k > 1.1) hq.tag(ctx, 540, 410, 'NO SALE NADA', { size: 48, fill: '#fca5a5' });
  },

  comida(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Un maizal bajo el Sol: verde… y luego se seca (hojas caídas, color paja). El agricultor se preocupa.
    const c1 = cue(1), wilt = ease((local - c1 + 0.1) / 1.6);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 780, [[0, mixc('#7dd3fc', '#fcd34d', wilt)], [1, mixc('#e0f2fe', '#fef3c7', wilt)]]); ctx.fillRect(0, 0, W, 780);
    sunDisc(ctx, 870, 520, 56 + 12 * wilt, t);
    ctx.fillStyle = hq.vgrad(ctx, 0, 760, H, [[0, mixc('#65a30d', '#b45309', wilt)], [0.3, '#92400e'], [1, '#451a03']]); ctx.fillRect(0, 760, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 760); ctx.lineTo(W, 760); ctx.stroke();
    // Surcos en perspectiva.
    ctx.strokeStyle = 'rgba(69,26,3,0.35)'; ctx.lineWidth = 5; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 30, 760); ctx.lineTo(540 + i * 260, H); ctx.stroke(); }
    cracks(ctx, 0, 1040, W, 1500, 11, wilt, 20);
    for (const [y, h, n] of [[800, 120, 9], [890, 175, 7], [1010, 250, 5]]) for (let i = 0; i < n; i++) cornPlant(ctx, (i + 0.5) * (W / n) + (y % 3) * 12, y, h, wilt, i + n);
    const r = hq.toon(ctx, 880, 1080, 360, {
      t, seed: 3, shirt: '#2563eb', pants: '#1e3a8a', skin: '#c68642', armL: [0.3, 0.3], armR: [0.25, 0.2],
      eyes: local > c1 + 0.4 ? 'wide' : 'happy', mouth: local > c1 + 0.4 ? 'o' : 'smile', brows: local > c1 + 0.4 ? 1 : 0, look: [-0.6, 0],
    });
    // Sombrero de paja.
    const [hx, hy] = r.head;
    ctx.beginPath(); ctx.ellipse(hx, hy - 22, 82, 18, 0, 0, TAU); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, hx - 40, hy - 70, 80, 52, 18); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dc2626'; ctx.fillRect(hx - 40, hy - 34, 80, 10);
    hq.tag(ctx, 540, 410, local < c1 ? '8 DE CADA 10 CAMPOS: SOLO LLUVIA' : 'SE SECAN', { size: local < c1 ? 34 : 48, fill: local < c1 ? '#bae6fd' : '#fca5a5' });
  },

  aire(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La ciudad se llena de polvo y humo (neblina café); la gente tose. Luego: cómo la lluvia «lava» el aire.
    const c1 = cue(1), haze = ease((local + 0.4) / Math.max(1.0, c1 + 0.2));
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 1000, [[0, '#38bdf8'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 1000);
    sunDisc(ctx, 830, 540, 60, t, 1, haze);
    const R = (i) => Math.sin(i * 77.7) * 0.5 + 0.5;
    for (let i = 0; i < 8; i++) kit.building(ctx, 70 + i * 135, 1000, 112, 260 + R(i) * 300, { color: hq.shade('#64748b', -0.1 + R(i + 4) * 0.3), lit: (j) => ((j * 7 + i) % 4 ? 0.8 : 0), lw: 5 });
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 1000, W, H); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    ctx.fillStyle = '#facc15'; for (let x = (t * 120) % 160 - 160; x < W; x += 160) ctx.fillRect(x, 1090, 80, 10);
    kit.car(ctx, ((t * 260) % 1400) - 160, 1060, 170, { color: '#ef4444', lw: 5 });
    kit.car(ctx, 1240 - ((t * 200 + 500) % 1400), 1140, 170, { color: '#22c55e', lw: 5 });
    // Neblina café y polvo flotando.
    ctx.save(); ctx.globalAlpha = 0.85 * haze; ctx.fillStyle = hq.vgrad(ctx, 0, 300, 1100, [[0, 'rgba(146,64,14,0.55)'], [1, 'rgba(120,53,15,0.95)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
    const Rd = kit.rng(9);
    for (let i = 0; i < 60; i++) { const x = (Rd() * W + t * 20 * (0.5 + Rd())) % W, y = 380 + Rd() * 700 + 14 * Math.sin(t + i); ctx.globalAlpha = haze * (i / 60); ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(x, y, 5 + Rd() * 7, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    hq.toon(ctx, 260, 1080, 380, { t, seed: 8, shirt: '#0ea5e9', hair: '#111827', hairStyle: 'curly', skin: '#8d5524', armL: [0.25, 0.3], armR: [0.3, 0.4], eyes: haze > 0.5 ? 'closed' : 'open', mouth: haze > 0.5 ? 'o' : 'smile', brows: haze > 0.5 ? -1 : 0 });
    if (haze > 0.5 && local < c1 + 0.3) hq.bubble(ctx, 470, 560, 260, 96, 360, 650, '¡COF, COF!', { size: 40 });
    if (local > c1) {
      // Tarjeta: las gotas atrapan el polvo y lo bajan al suelo.
      const k = ease((local - c1) / 0.4);
      ctx.save(); ctx.globalAlpha = k;
      hq.card(ctx, 600, 470, 400, 400, '#e0f2fe', 36);
      ctx.save(); hq.roundRectPath(ctx, 600, 470, 400, 400, 36); ctx.clip();
      for (let i = 0; i < 5; i++) {
        const x = 650 + i * 75, y = 480 + (((local - c1) * 260 + i * 90) % 360);
        ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.quadraticCurveTo(x + 22, y + 2, x, y + 20); ctx.quadraticCurveTo(x - 22, y + 2, x, y - 34);
        ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.fillStyle = '#78350f'; for (const [dx, dy] of [[-5, 2], [5, 8], [0, -8]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 3.5, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      ctx.restore();
      hq.tag(ctx, 540, 410, 'LA LLUVIA LAVA EL AIRE', { size: 44, fill: '#bae6fd' });
    } else hq.tag(ctx, 540, 410, 'POLVO Y HUMO', { size: 46, fill: '#fdba74' });
  },

  atacama(ctx, o) {
    const { W, H, local, cue, t, s } = o;
    // Desierto de Atacama: un robot de prueba para Marte avanza… llueve un poco y el desierto se llena de flores.
    const c1 = cue(1), bloom = (i) => ease((local - c1 - 0.5 - (i % 12) * 0.06) / 0.5);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 880, [[0, '#1d4ed8'], [1, '#93c5fd']]); ctx.fillRect(0, 0, W, 880);
    sunDisc(ctx, 880, 520, 50, t);
    // Volcanes de los Andes con nieve.
    ctx.beginPath(); ctx.moveTo(0, 860); ctx.lineTo(180, 700); ctx.lineTo(360, 860); ctx.moveTo(300, 860); ctx.lineTo(560, 610); ctx.lineTo(820, 860); ctx.moveTo(760, 860); ctx.lineTo(950, 690); ctx.lineTo(1140, 860);
    ctx.fillStyle = hq.vgrad(ctx, 0, 610, 860, [[0, '#a78bfa'], [1, '#7c3aed']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(560, 610); ctx.lineTo(505, 663); ctx.lineTo(530, 655); ctx.lineTo(560, 672); ctx.lineTo(590, 655); ctx.lineTo(615, 663); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    // Suelo rojizo.
    ctx.fillStyle = hq.vgrad(ctx, 0, 860, H, [[0, '#ea580c'], [0.35, '#c2410c'], [1, '#7c2d12']]); ctx.fillRect(0, 860, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 860); ctx.lineTo(W, 860); ctx.stroke();
    const Rr = kit.rng(4);
    for (let i = 0; i < 16; i++) { const x = Rr() * W, y = 900 + Rr() * 560, r = 10 + Rr() * 22; ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r * 0.7, 0, 0, TAU); ctx.fillStyle = '#9a3412'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    // Pasto que aparece con la lluvia.
    const green = ease((local - c1 - 0.3) / 1.0);
    if (green > 0) { ctx.save(); ctx.globalAlpha = 0.35 * green; ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 862, W, H); ctx.restore(); }
    // Flores (detrás del robot las lejanas, delante las cercanas).
    const Rf = kit.rng(21), fl = [];
    for (let i = 0; i < 70; i++) fl.push([Rf() * W, 880 + Rf() * 620, 14 + Rf() * 16, Rf() < 0.75 ? (Rf() < 0.5 ? '#d946ef' : '#c026d3') : (Rf() < 0.5 ? '#fde047' : '#ffffff')]);
    fl.sort((a, b) => a[1] - b[1]);
    fl.forEach(([x, y, r, c], i) => { if (y < 1000) flower(ctx, x, y, r * (0.6 + (y - 860) / 900), c, bloom(i)); });
    const rx = 230 + 380 * ease(local / Math.max(1, c1)), moving = local < c1 ? t : c1;
    rover(ctx, rx, 1000, 0.95, moving);
    fl.forEach(([x, y, r, c], i) => { if (y >= 1000) flower(ctx, x, y, r * (0.6 + (y - 860) / 900), c, bloom(i)); });
    // Un chubasco breve.
    const sh = clamp((local - c1 + 0.1) / 0.3) * (1 - clamp((local - c1 - 0.9) / 0.4));
    if (sh > 0) { cloud(ctx, 540, 520, 220, '#94a3b8', sh); rain(ctx, W, 600, 1000, t, sh, 50); }
    if (local < c1) hq.tag(ctx, 540, 410, local < c1 * 0.45 ? 'ATACAMA, CHILE' : 'AQUÍ PRUEBAN ROBOTS PARA MARTE', { size: local < c1 * 0.45 ? 48 : 34, fill: '#fde047' });
    else hq.tag(ctx, 540, 410, '¡SE LLENA DE FLORES!', { size: 46, fill: '#f0abfc' });
    void s;
  },
};
