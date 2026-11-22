// Video largo (≈3 min, horizontal 2D con voz): ¿y si cambiáramos el Sol por otra estrella?
// Amplía los Shorts del Sol (doble, mitad, mil veces) y se enlaza desde ellos como video relacionado.
// Gancho (6 estrellas, de la más parecida a la más extraña) → regla (la Tierra no se mueve) → la gemela (Alfa Centauri A:
// brilla la mitad más y ya nos saca de la zona perfecta) → Sirio → una estrella roja (Próxima) → Betelgeuse →
// un agujero negro (no nos tragaría) → una estrella muerta (así terminará el Sol; Sirio tiene una al lado) → cierre.
// Cada escena cambia de imagen en cada frase (sub-escenas por frase, con un pequeño golpe de zoom al cortar).
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, sea, starBall, blackHole, orbit, planet, thermometer, puff, bushyTree, cracks } from '../../engine2d/props.js';
import { drawGlobe } from '../../engine2d/earth.js';

export function setup() {}

const STARS = (() => { const R = kit.rng(21); return Array.from({ length: 220 }, () => [R() * 1920, R() * 1080, 0.8 + R() * 2.2, R() * 6]); })();
function space(ctx, W, H, t, top = '#020617', bottom = '#1e1b4b') {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, top], [1, bottom]]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  for (const [x, y, s, tw] of STARS) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 1.5 + tw); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}

export function draw(ctx, C, { t, scene: s, local }) {
  const n = s.cueTimes.length, cue = (i) => s.cueTimes[Math.min(i, n - 1)][0];
  let ci = 0; for (let i = 0; i < n; i++) if (local >= cue(i)) ci = i;
  const lt = local - cue(ci), end = (i) => (i + 1 < n ? cue(i + 1) : s.dur);
  ctx.save();
  hq.camera(ctx, 1 + 0.03 * Math.min(1, local / s.dur), 960, 480);
  // Golpe de zoom al cambiar de frase (corte dentro de la escena).
  if (ci > 0) { const k = 1 + 0.04 * Math.pow(Math.max(0, 1 - lt / 0.25), 2); ctx.translate(960, 480); ctx.scale(k, k); ctx.translate(-960, -480); }
  const o = { ...C, t, local, s, cue, ci, lt, span: end(ci) - cue(ci) };
  const fn = SCENES[s.id][Math.min(ci, SCENES[s.id].length - 1)];
  fn(ctx, o);
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.05, vig: 0.28 });
  return {};
}

// ---------- piezas ----------
const label = (ctx, text, x = 960, y = 70, fill = '#fde047', size = 42) => hq.tag(ctx, x, y, text, { size, fill });

function twoStars(ctx, o, a, b) {
  const { W, H, t } = o;
  space(ctx, W, H, t);
  starBall(ctx, 620, 450, a.r, t, { kind: a.kind, rays: a.kind !== 'giant' }); hq.tag(ctx, 620, 450 + Math.max(a.r, 90) + 70, a.name, { size: 32, fill: a.fill || '#fde047' });
  const k = pop(o.lt / 0.5);
  ctx.save(); ctx.translate(1300, 450); ctx.scale(k, k); starBall(ctx, 0, 0, b.r, t, { kind: b.kind, rays: b.kind !== 'giant' }); ctx.restore();
  hq.tag(ctx, 1300, 450 + Math.max(b.r, 90) + 70, b.name, { size: 32, fill: b.fill || '#bae6fd' });
}

function bulbs(ctx, o, n, lit, x0, y0, cols = 5) {
  for (let i = 0; i < n; i++) {
    const x = x0 + (i % cols) * 70, y = y0 + Math.floor(i / cols) * 74, on = clamp((lit - i / n) * 6);
    if (on > 0) hq.glow(ctx, x, y - 8, 60, 'rgba(253,224,71,A)', 0.55 * on);
    ctx.beginPath(); ctx.arc(x, y - 10, 24, 0, TAU); ctx.fillStyle = on > 0 ? mixc('#e5e7eb', '#fde047', on) : '#64748b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, x - 11, y + 10, 22, 16, 4); ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.stroke();
  }
}

/** Vista desde arriba: estrella a la izquierda, órbitas y la Tierra que se mueve de r0 a r1 (en px). */
function orbitView(ctx, o, { kind, sr, r0, r1, merc = 0, k = 1, swallow = 0, planets = [] }) {
  const { W, H, t } = o, sx = 160, sy = 470;
  space(ctx, W, H, t);
  for (const [d] of planets) orbit(ctx, sx, sy, d, -0.9, 0.9);
  if (merc) { orbit(ctx, sx, sy, merc, -0.9, 0.9); }
  starBall(ctx, sx, sy, sr, t, { kind, rays: kind !== 'giant' });
  if (merc) { const x = sx + Math.cos(-0.45) * merc, y = sy + Math.sin(-0.45) * merc; planet(ctx, x, y, 14, '#d6d3d1', '#78716c'); hq.tag(ctx, x, y - 46, 'MERCURIO', { size: 24, fill: '#e2e8f0' }); }
  for (const [d, a, r, c0, c1, name] of planets) {
    const x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d;
    if (sr > d) { puff(ctx, x, y, clamp((sr - d) / 60), 50, '#fde68a'); continue; }
    if (!c0) drawGlobe(ctx, x, y, r, { lon0: t * 30, lat0: 15, outline: 4 }); else planet(ctx, x, y, r, c0, c1);
    if (name) hq.tag(ctx, x, y + r + 32, name, { size: 24, fill: '#fdba74' });
  }
  if (r0 != null) {
    const er = lerp(r0, r1, k), ex = sx + er;
    if (!(swallow && sr > er)) { drawGlobe(ctx, ex, sy, 36, { lon0: t * 30, lat0: 15, outline: 4 }); hq.tag(ctx, ex, sy + 76, 'TIERRA', { size: 26, fill: '#86efac' }); }
    if (k > 0 && k < 1) { ctx.save(); ctx.strokeStyle = '#86efac'; ctx.lineWidth = 6; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(sx + r0, sy); ctx.lineTo(ex + (r1 < r0 ? 46 : -46), sy); ctx.stroke(); ctx.restore(); }
  }
}

function iceGlobe(ctx, cx, cy, R, k, t) {
  drawGlobe(ctx, cx, cy, R, { lon0: t * 8, lat0: 15 });
  if (k <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  const h = R * k; ctx.fillStyle = 'rgba(241,245,249,0.96)'; ctx.fillRect(cx - R, cy - R, R * 2, h * 1.02); ctx.fillRect(cx - R, cy + R - h * 1.02, R * 2, h * 1.02);
  ctx.restore();
}

function steamGlobe(ctx, cx, cy, R, k, t) {
  drawGlobe(ctx, cx, cy, R, { lon0: t * 8, lat0: 15, ocean: mixc('#2b7bd6', '#a16207', k), land: mixc('#4fbf5a', '#92400e', k) });
  for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.28, u = (t * 0.6 + i * 0.13) % 1; ctx.save(); ctx.globalAlpha = (1 - u) * 0.8 * (1 - k * 0.6); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let j = 0; j < 7; j++) ctx.lineTo(cx + Math.cos(a) * (R + 10 + u * 80 + j * 14) + 8 * Math.sin(j + t * 3), cy + Math.sin(a) * (R + 10 + u * 80 + j * 14)); ctx.stroke(); ctx.restore(); }
}

function skyView(ctx, o, { kind, r, top, bottom, ground = '#65a30d', toon = {}, snowK = 0, glasses = false }) {
  const { W, H, t } = o;
  sky(ctx, W, 0, 760, top, bottom);
  if (kind) starBall(ctx, 960, 330, r, t, { kind });
  ctx.fillStyle = hq.vgrad(ctx, 0, 740, H, [[0, ground], [1, hq.shade(ground, -0.45)]]); ctx.fillRect(0, 740, W, H - 740);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 740); ctx.lineTo(W, 740); ctx.stroke();
  if (snowK > 0) { ctx.save(); ctx.globalAlpha = snowK; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 80; i++) { const x = (i * 131.7 + 30 * Math.sin(t + i)) % W, y = (i * 97.3 + t * 80) % 760; ctx.beginPath(); ctx.arc(x, y, 4 + (i % 3) * 2, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(241,245,249,0.9)'; ctx.fillRect(0, 740, W, H); ctx.restore(); }
  const r2 = hq.toon(ctx, 1500, 860, 300, { t, seed: 6, shirt: '#22c55e', pants: '#0ea5e9', skin: '#e0ac69', hair: '#92400e', armL: [0.4, 0.3], armR: [0.4, 0.3], look: [-0.7, -0.8], ...toon });
  if (glasses) { const [hx, hy] = r2.head, R = 0.12 * 300; ctx.fillStyle = '#0f172a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; for (const sx of [-1, 1]) { hq.roundRectPath(ctx, hx + sx * R * 0.36 - R * 0.3, hy + R * 0.08 - R * 0.2, R * 0.6, R * 0.38, R * 0.15); ctx.fill(); ctx.stroke(); } }
}

function lifeBars(ctx, o, rows, mark) {
  const { W, H, t } = o, x0 = 300, unit = 110;
  space(ctx, W, H, t);
  rows.forEach(([kind, name, len, fill], i) => {
    const y = 330 + i * 230, g = ease((o.lt - 0.1 - i * 0.2) / 0.9);
    starBall(ctx, 200, y, 44, t, { kind, rays: false });
    hq.tag(ctx, x0 + 140, y - 70, name, { size: 30, fill: '#e2e8f0' });
    const w = Math.max(50, Math.min(W - x0 - 40, len * unit) * g);
    hq.roundRectPath(ctx, x0, y - 25, w, 50, 25); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    if (len * unit > W - x0 - 40 && g > 0.95) { ctx.font = '900 64px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = fill; ctx.fillText('→', W - 10, y); }
  });
  if (mark) { const k = ease((o.lt - 0.6) / 0.4), mx = x0 + mark.at * unit; ctx.save(); ctx.globalAlpha = k; ctx.setLineDash([12, 10]); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mx, 240); ctx.lineTo(mx, 330 + (rows.length - 1) * 230 + 50); ctx.stroke(); ctx.setLineDash([]); hq.tag(ctx, mx, 220, mark.text, { size: 28, fill: mark.fill || '#c4b5fd' }); ctx.restore(); }
}

function orion(ctx, o, { boom = 0, day = 0, highlight = 'bet' } = {}) {
  const { W, H, t } = o;
  sky(ctx, W, 0, 1080, mixc('#020617', '#38bdf8', day), mixc('#4c1d95', '#e0f2fe', day));
  ctx.save(); ctx.globalAlpha = 1 - day; ctx.fillStyle = '#ffffff'; for (const [x, y, s2, tw] of STARS) { ctx.globalAlpha = (1 - day) * (0.5 + 0.4 * Math.sin(t * 1.5 + tw)); ctx.beginPath(); ctx.arc(x, y * 0.8, s2, 0, TAU); ctx.fill(); } ctx.restore();
  const S = { bet: [860, 200], bel: [1080, 225], a1: [920, 420], a2: [970, 400], a3: [1020, 380], sai: [900, 600], rig: [1100, 570] };
  ctx.save(); ctx.globalAlpha = 1 - day; ctx.strokeStyle = 'rgba(191,219,254,0.3)'; ctx.lineWidth = 3;
  for (const [a, b] of [['bet', 'a1'], ['bel', 'a3'], ['a1', 'sai'], ['a3', 'rig'], ['bet', 'bel'], ['a1', 'a2'], ['a2', 'a3']]) { ctx.beginPath(); ctx.moveTo(...S[a]); ctx.lineTo(...S[b]); ctx.stroke(); }
  for (const k of ['bel', 'sai', 'rig', 'a1', 'a2', 'a3']) { hq.glow(ctx, S[k][0], S[k][1], 34, 'rgba(224,242,254,A)', 0.6); ctx.beginPath(); ctx.arc(S[k][0], S[k][1], 7, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  hq.tag(ctx, 1150, 330, 'LAS TRES MARÍAS', { size: 24, fill: '#e2e8f0' });
  ctx.restore();
  const [bx, by] = S.bet;
  if (boom <= 0) { hq.glow(ctx, bx, by, 90 * (1 + 0.15 * Math.sin(t * 8)), 'rgba(248,113,113,A)', 0.8); ctx.beginPath(); ctx.arc(bx, by, 15, 0, TAU); ctx.fillStyle = '#fb923c'; ctx.fill(); if (highlight === 'bet') hq.tag(ctx, bx - 60, by + 70, 'BETELGEUSE', { size: 28, fill: '#fca5a5' }); }
  else { const r = 30 + 110 * boom; hq.glow(ctx, bx, by, r * 4, 'rgba(255,255,255,A)', 0.9); ctx.save(); ctx.translate(bx, by); ctx.rotate(t * 0.3); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.ellipse(0, 0, 9, r * 1.6, 0, 0, TAU); ctx.fill(); } ctx.restore(); ctx.beginPath(); ctx.arc(bx, by, r * 0.4, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(0, 820); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 790 - 40 * Math.sin(x * 0.004 + 0.5)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 740, H, [[0, mixc('#1e293b', '#4d7c0f', day)], [1, mixc('#020617', '#1a2e05', day)]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  hq.toon(ctx, 1500, 930, 300, { t, seed: 9, shirt: '#6366f1', hair: '#111827', hairStyle: 'curly', skin: '#a0522d', armL: [2.35, 0.15], armR: boom > 0 ? [2.6, 0.2] : [0.25, 0.2], eyes: 'wide', mouth: boom > 0 ? 'o' : 'smile', look: [-0.8, -0.8] });
}

function lineup(ctx, o, { crosses = 0, q = 0 } = {}) {
  const { W, H, t } = o;
  space(ctx, W, H, t);
  const L = [['sun', 'LA GEMELA', 62], ['blue', 'SIRIO', 72], ['red', 'ESTRELLA ROJA', 42], ['giant', 'BETELGEUSE', 92], ['hole', 'AGUJERO NEGRO', 40], ['white', 'ESTRELLA MUERTA', 16]];
  L.forEach(([kind, name, r], i) => {
    const x = 210 + i * 300, y = 470, k = pop((o.lt - i * 0.12) / 0.45);
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    if (kind === 'hole') blackHole(ctx, 0, 0, r, t); else starBall(ctx, 0, 0, r, t, { kind, rays: kind !== 'giant' });
    ctx.restore();
    hq.tag(ctx, x, y + 150, name, { size: 24, fill: '#e2e8f0' });
    if (crosses > 0) { const c = ease((crosses - i * 0.1) * 3); if (c > 0) { ctx.save(); ctx.globalAlpha = c; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 70, y - 70); ctx.lineTo(x + 70, y + 70); ctx.moveTo(x + 70, y - 70); ctx.lineTo(x - 70, y + 70); ctx.stroke(); ctx.restore(); } }
  });
  if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.font = '900 150px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeText('?', 960, 250); ctx.fillStyle = '#fde047'; ctx.fillText('?', 960, 250); ctx.restore(); }
}

function football(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.fillStyle = '#111827';
  const pent = (cx, cy, s) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } ctx.closePath(); ctx.fill(); };
  pent(x, y, r * 0.28); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; pent(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, r * 0.22); }
  ctx.restore();
}

// ---------- escenas (una función por frase) ----------
const SCENES = {
  hook: [
    (ctx, o) => { // El Sol con la Tierra… y empieza a cambiar.
      const { W, H, t } = o; space(ctx, W, H, t);
      const kinds = ['sun', 'giant', 'red', 'hole', 'white', 'blue'], i = o.lt < 1.0 ? 0 : Math.floor((o.lt - 1.0) / 0.45) % kinds.length, kind = kinds[i];
      const r = { sun: 110, giant: 210, red: 60, hole: 50, white: 20, blue: 140 }[kind];
      if (kind === 'hole') blackHole(ctx, 760, 620, r, t); else starBall(ctx, 760, 620, r, t, { kind, rays: kind !== 'giant' });
      orbit(ctx, 760, 620, 560, -0.5, 0.5); drawGlobe(ctx, 760 + 560 * Math.cos(Math.sin(t * 0.4) * 0.3), 620 + 560 * Math.sin(Math.sin(t * 0.4) * 0.3), 46, { lon0: t * 30, lat0: 15, outline: 4 });
    },
    (ctx, o) => { // Una nos congelaría (roja), otra nos tragaría (gigante).
      const { W, H, t } = o; space(ctx, W, H, t);
      const half = o.lt < o.span * 0.5;
      if (half) { starBall(ctx, 760, 620, 60, t, { kind: 'red' }); iceGlobe(ctx, 1320, 620, 80, ease(o.lt / (o.span * 0.45)), t); }
      else { const g = ease((o.lt - o.span * 0.5) / (o.span * 0.45)); starBall(ctx, 760, 620, lerp(120, 640, g), t, { kind: 'giant', rays: false }); if (g < 0.95) drawGlobe(ctx, 1320, 620, 80, { lon0: t * 20, lat0: 15 }); }
    },
    (ctx, o) => { // Y una nos dejaría dando vueltas igual… pero a oscuras (agujero negro).
      const { W, H, t } = o; space(ctx, W, H, t, '#000000', '#0b0f1a');
      blackHole(ctx, 760, 620, 50, t); orbit(ctx, 760, 620, 520, 0, TAU, 'rgba(148,163,184,0.35)');
      const a = t * 0.5; drawGlobe(ctx, 760 + Math.cos(a) * 520, 620 + Math.sin(a) * 260, 46, { lon0: t * 30, lat0: 15, outline: 4, ocean: '#1e3a5f', land: '#334155' });
    },
    (ctx, o) => lineup(ctx, o),
  ],

  regla: [
    (ctx, o) => { // La Tierra se queda en su lugar, a la misma distancia.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 420, 470, 130, t, { kind: 'sun' }); drawGlobe(ctx, 1500, 470, 70, { lon0: t * 20, lat0: 15 });
      ctx.save(); ctx.strokeStyle = '#86efac'; ctx.lineWidth = 7; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(600, 470); ctx.lineTo(1410, 470); ctx.stroke(); ctx.restore();
      hq.tag(ctx, 1000, 400, 'LA MISMA DISTANCIA', { size: 36, fill: '#86efac' });
      ctx.beginPath(); ctx.arc(1500, 370, 18, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(1500, 388); ctx.lineTo(1500, 410); ctx.stroke();
    },
    (ctx, o) => { // Solo cambiamos la estrella del centro.
      const { W, H, t } = o; space(ctx, W, H, t);
      const k = pop(o.lt / 0.5);
      ctx.save(); ctx.globalAlpha = 1 - clamp(o.lt / 0.5); starBall(ctx, 420, 470, 130, t, { kind: 'sun' }); ctx.restore();
      ctx.save(); ctx.translate(420, 470); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 130, 0, TAU); ctx.fillStyle = 'rgba(148,163,184,0.25)'; ctx.fill(); ctx.setLineDash([14, 12]); ctx.lineWidth = 6; ctx.strokeStyle = '#e2e8f0'; ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '900 150px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeText('?', 0, 8); ctx.fillStyle = '#fde047'; ctx.fillText('?', 0, 8); ctx.restore();
      drawGlobe(ctx, 1500, 470, 70, { lon0: t * 20, lat0: 15 });
      label(ctx, 'SOLO CAMBIA LA ESTRELLA', 960, 70, '#fde047', 40);
    },
    (ctx, o) => { // El Sol es mediano… y caben un millón de Tierras dentro.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 760, 480, 330, t, { kind: 'sun' });
      const k = ease(o.lt / 1.6); ctx.save(); ctx.beginPath(); ctx.arc(760, 480, 320, 0, TAU); ctx.clip(); ctx.fillStyle = '#2563eb';
      for (let y = 170; y < 800; y += 16) for (let x = 440; x < 1080; x += 16) { if (((x * 7 + y * 3) % 97) / 97 > k) continue; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
      ctx.restore();
      drawGlobe(ctx, 1450, 480, 40, { lon0: t * 20, lat0: 15, outline: 4 }); hq.tag(ctx, 1450, 560, 'TIERRA', { size: 26, fill: '#86efac' });
      label(ctx, 'UN MILLÓN DE TIERRAS', 960, 70, '#fde047', 42);
    },
  ],

  gemela: [
    (ctx, o) => { twoStars(ctx, o, { kind: 'sun', r: 120, name: 'NUESTRO SOL' }, { kind: 'sun', r: 140, name: 'LA GEMELA', fill: '#fde68a' }); label(ctx, 'ALFA CENTAURI', 960, 70, '#fde68a'); },
    (ctx, o) => { // Su luz tarda 4 años en llegar.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 260, 470, 70, t, { kind: 'sun' }); drawGlobe(ctx, 1650, 470, 60, { lon0: t * 20, lat0: 15 });
      const u = clamp(o.lt / Math.max(1, o.span - 0.3)), x = lerp(340, 1580, u);
      ctx.save(); ctx.strokeStyle = 'rgba(253,224,71,0.85)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(340, 470); ctx.lineTo(x, 470); ctx.stroke(); ctx.restore();
      hq.glow(ctx, x, 470, 60, 'rgba(253,224,71,A)', 0.8);
      for (let i = 0; i < 4; i++) { const on = u > (i + 1) / 4.2; hq.roundRectPath(ctx, 640 + i * 170, 230, 120, 120, 14); ctx.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.25)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = on ? '#ef4444' : 'rgba(239,68,68,0.3)'; ctx.fillRect(640 + i * 170, 230, 120, 30); }
      label(ctx, 'SU LUZ TARDA 4 AÑOS', 960, 70, '#fde68a');
    },
    (ctx, o) => skyView(ctx, o, { kind: 'sun', r: 100, top: '#38bdf8', bottom: '#e0f2fe', toon: { eyes: 'happy', mouth: 'smile' } }),
    (ctx, o) => { // Brilla la mitad más: los mares se evaporan.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 330, 470, 150, t, { kind: 'sun' });
      steamGlobe(ctx, 1250, 500, 260, ease(o.lt / Math.max(1.5, o.span)), t);
      label(ctx, 'LA MITAD MÁS DE LUZ', 960, 70, '#fdba74');
    },
    (ctx, o) => { // La zona perfecta se corre y la Tierra queda fuera.
      const { W, H, t } = o; space(ctx, W, H, t);
      const sh = ease((o.lt - 0.4) / 1.2), sx = 160, sy = 470, g0 = lerp(560, 720, sh);
      ctx.save(); ctx.globalAlpha = 0.35; ctx.lineWidth = 140;
      for (const [r, c] of [[g0 - 200, '#ef4444'], [g0, '#22c55e'], [g0 + 200, '#3b82f6']]) { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(sx, sy, r, -0.8, 0.8); ctx.stroke(); }
      ctx.restore();
      starBall(ctx, sx, sy, lerp(90, 110, sh), t, { kind: 'sun' });
      drawGlobe(ctx, sx + 560, sy, 40, { lon0: t * 20, lat0: 15, outline: 4 });
      hq.tag(ctx, sx + g0, sy - 330, 'ZONA PERFECTA', { size: 28, fill: '#86efac' });
      label(ctx, sh > 0.6 ? 'NOS SACA DE LA ZONA PERFECTA' : 'UN CAMBIO CHIQUITO', 960, 70, '#fca5a5', 38);
    },
  ],

  sirio: [
    (ctx, o) => { twoStars(ctx, o, { kind: 'sun', r: 100, name: 'NUESTRO SOL' }, { kind: 'blue', r: 170, name: 'SIRIO' }); label(ctx, 'EL DOBLE DE MASA', 960, 70, '#bae6fd'); },
    (ctx, o) => { // 25 veces más luz.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 360, 360, 70, t, { kind: 'sun' }); bulbs(ctx, o, 1, 1, 360, 600);
      starBall(ctx, 1240, 300, 110, t, { kind: 'blue' }); bulbs(ctx, o, 25, ease(o.lt / Math.max(1, o.span - 0.3)), 1100, 520, 5);
      label(ctx, '25 VECES MÁS LUZ', 960, 70, '#fde047');
    },
    (ctx, o) => skyView(ctx, o, { kind: 'blue', r: 180, top: '#fef9c3', bottom: '#ffffff', ground: '#d6b36a', toon: { eyes: 'wide', mouth: 'o' }, glasses: true }),
    (ctx, o) => { // Mares que hierven → desierto de piedra.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 300, 470, 150, t, { kind: 'blue' });
      steamGlobe(ctx, 1250, 500, 260, ease(o.lt / Math.max(1.4, o.span)), t);
      label(ctx, o.lt < o.span * 0.5 ? 'LOS MARES HIERVEN' : 'UN DESIERTO DE PIEDRA', 960, 70, '#fdba74');
    },
    (ctx, o) => { lifeBars(ctx, o, [['sun', 'NUESTRO SOL', 10, '#facc15'], ['blue', 'SIRIO', 1, '#e0f2fe']]); label(ctx, 'VIVIRÍA 10 VECES MENOS', 960, 70, '#bae6fd'); },
  ],

  roja: [
    (ctx, o) => { twoStars(ctx, o, { kind: 'sun', r: 120, name: 'NUESTRO SOL' }, { kind: 'red', r: 64, name: 'ESTRELLA ROJA', fill: '#fca5a5' }); label(ctx, 'LA MITAD DE GRANDE', 960, 70, '#fca5a5'); },
    (ctx, o) => { const { W, H, t } = o; space(ctx, W, H, t); starBall(ctx, 330, 470, 64, t, { kind: 'red' }); iceGlobe(ctx, 1200, 500, 280, ease(o.lt / Math.max(1.4, o.span)), t); label(ctx, '¡CONGELADA ENTERA!', 960, 70, '#bae6fd'); },
    (ctx, o) => { orbitView(ctx, o, { kind: 'red', sr: 44, r0: 1300, r1: 290, merc: 500, k: ease((o.lt - 0.2) / Math.max(1, o.span - 0.4)) }); label(ctx, 'MÁS CERCA QUE MERCURIO', 960, 70, '#86efac'); },
    (ctx, o) => { // Mitad día, mitad noche.
      const { W, H, t } = o; space(ctx, W, H, t);
      hq.glow(ctx, 120, 480, 500, 'rgba(248,113,113,A)', 0.5); starBall(ctx, 120, 480, 180, t, { kind: 'red' });
      const cx = 1150, cy = 480, R = 300; drawGlobe(ctx, cx, cy, R, { lon0: 40, lat0: 10 });
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(2,6,23,0.78)'; ctx.fillRect(cx, cy - R, R, R * 2);
      ctx.fillStyle = '#fde047'; const Rr = kit.rng(4); for (let i = 0; i < 26; i++) { const x = cx + 20 + Rr() * (R - 40), y = cy - R * 0.8 + Rr() * R * 1.6; if (Math.hypot(x - cx, y - cy) < R - 10) { ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); } }
      ctx.restore(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      hq.tag(ctx, cx - 160, cy + R + 50, 'SIEMPRE DE DÍA', { size: 28, fill: '#fdba74' }); hq.tag(ctx, cx + 180, cy + R + 50, 'SIEMPRE DE NOCHE', { size: 28, fill: '#a5b4fc' });
      label(ctx, 'MITAD DÍA, MITAD NOCHE', 960, 70, '#fde68a');
    },
    (ctx, o) => { skyView(ctx, o, { kind: 'red', r: 110, top: '#7c2d12', bottom: '#fdba74', ground: '#a16207', toon: { eyes: 'happy', mouth: 'smile' } }); label(ctx, 'UN ATARDECER ETERNO', 960, 70, '#fdba74'); },
    (ctx, o) => { // Próxima Centauri y su planeta.
      const { W, H, t } = o; space(ctx, W, H, t);
      const a = t * 0.6, cx = 900, cy = 470; starBall(ctx, cx, cy, 100, t, { kind: 'red' });
      ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 44; ctx.beginPath(); ctx.ellipse(cx, cy, 420, 150, 0, 0, TAU); ctx.stroke(); ctx.restore();
      const px = cx + Math.cos(a) * 420, py = cy + Math.sin(a) * 150, k = pop(o.lt / 0.6);
      ctx.save(); ctx.translate(px, py); ctx.scale(k, k); drawGlobe(ctx, 0, 0, 44, { lon0: 90, lat0: 10, outline: 4, ocean: '#2563eb', land: '#a3a35a' }); ctx.restore();
      hq.tag(ctx, px, py - 80, '¿AGUA?', { size: 26, fill: '#86efac' });
      label(ctx, 'PRÓXIMA CENTAURI', 960, 70, '#fca5a5');
    },
    (ctx, o) => { // Casi 3 de cada 4 estrellas son así.
      const { W, H, t } = o; space(ctx, W, H, t);
      const k = ease((o.lt - 0.3) / 1.2), R = kit.rng(8);
      for (let i = 0; i < 60; i++) { const x = 60 + R() * 1800, y = 150 + R() * 640, r = 10 + R() * 14, red = i % 4 !== 0; starBall(ctx, x, y, r, t, { kind: red && k > (i % 10) / 10 ? 'red' : (i % 4 === 0 ? 'blue' : 'sun'), rays: false, glowK: 0.6 }); }
      label(ctx, 'CASI 3 DE CADA 4 ESTRELLAS', 960, 70, '#fca5a5');
    },
  ],

  gigante: [
    (ctx, o) => orion(ctx, o),
    (ctx, o) => { // Pelota de fútbol contra granito de arena.
      const { W, H, t } = o; space(ctx, W, H, t);
      hq.glow(ctx, 760, 470, 380, 'rgba(239,68,68,A)', 0.4); football(ctx, 760, 470, 260);
      ctx.beginPath(); ctx.arc(1380, 600, 5, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); hq.glow(ctx, 1380, 600, 30, 'rgba(253,224,71,A)', 0.8);
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1380, 590); ctx.lineTo(1450, 470); ctx.stroke();
      hq.tag(ctx, 760, 800, 'BETELGEUSE', { size: 30, fill: '#fca5a5' }); hq.tag(ctx, 1500, 440, 'NUESTRO SOL', { size: 28, fill: '#fde047' });
      label(ctx, 'EL SOL: UN GRANITO DE ARENA', 960, 70, '#fde047', 38);
    },
    (ctx, o) => { const S = 150, g = ease((o.lt - 0.2) / Math.max(1.4, o.span - 0.3)); orbitView(ctx, o, { kind: 'giant', sr: lerp(60, 3.6 * S, g), planets: [[0.39 * S, -0.6, 12, '#d6d3d1', '#78716c', ''], [0.72 * S, 0.5, 16, '#fde68a', '#d97706', ''], [1.0 * S, -0.25, 20, null, null, 'TIERRA'], [1.52 * S, 0.35, 16, '#fb923c', '#b91c1c', 'MARTE'], [5.2 * S, -0.12, 50, '#fde68a', '#b45309', 'JÚPITER']] }); label(ctx, 'NOS TRAGARÍA', 960, 70, '#fca5a5'); },
    (ctx, o) => { // Más fría… pero cien mil veces más brillante.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 360, 430, 110, t, { kind: 'sun' }); thermometer(ctx, 360, 840, 200, 0.9, '#f59e0b');
      starBall(ctx, 1250, 470, 340, t, { kind: 'giant', rays: false }); thermometer(ctx, 760, 840, 200, 0.55, '#ef4444');
      label(ctx, o.lt < o.span * 0.45 ? 'MÁS FRÍA QUE EL SOL' : '…PERO 100 MIL VECES MÁS LUZ', 960, 70, '#fde68a', 38);
    },
    (ctx, o) => { // Plutón, un horno.
      const { W, H, t } = o, hot = ease((o.lt - 0.1) / 1.0); space(ctx, W, H, t);
      hq.glow(ctx, -200, 480, 900, 'rgba(248,113,113,A)', 0.6); starBall(ctx, -260, 480, 460, t, { kind: 'giant', rays: false });
      planet(ctx, 1250, 470, 170, mixc('#e7e5e4', '#fb923c', hot), mixc('#a8a29e', '#b91c1c', hot));
      ctx.save(); ctx.beginPath(); ctx.arc(1250, 470, 170, 0, TAU); ctx.clip(); ctx.fillStyle = mixc('#fff7ed', '#fde047', hot); const hx = 1275, hy = 490, s2 = 70; ctx.beginPath(); ctx.moveTo(hx, hy + s2 * 0.9); ctx.bezierCurveTo(hx - s2 * 1.4, hy - s2 * 0.2, hx - s2 * 0.6, hy - s2 * 1.2, hx, hy - s2 * 0.4); ctx.bezierCurveTo(hx + s2 * 0.6, hy - s2 * 1.2, hx + s2 * 1.4, hy - s2 * 0.2, hx, hy + s2 * 0.9); ctx.fill(); ctx.restore();
      for (let i = 0; i < 6; i++) { const u = (t * 0.7 + i / 6) % 1; ctx.save(); ctx.globalAlpha = (1 - u) * hot; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 8; k++) ctx.lineTo(1150 + i * 40 + 10 * Math.sin(k + t * 4), 280 - u * 140 - k * 16); ctx.stroke(); ctx.restore(); }
      hq.tag(ctx, 1250, 690, 'PLUTÓN', { size: 30, fill: '#fdba74' });
      label(ctx, '¡HASTA PLUTÓN, UN HORNO!', 960, 70, '#fdba74');
    },
    (ctx, o) => { const boom = clamp((o.lt - 0.5) / 0.5), day = ease((o.lt - 0.9) / 1.0); orion(ctx, o, { boom, day, highlight: 'none' }); label(ctx, day > 0.3 ? '¡SE VERÁ DE DÍA!' : 'VA A EXPLOTAR', 960, 70, '#fde047'); },
  ],

  negro: [
    (ctx, o) => { // El Sol se encoge hasta ser un agujero negro.
      const { W, H, t } = o; space(ctx, W, H, t, '#000000', '#0b0f1a');
      const g = ease((o.lt - 0.3) / 1.2);
      if (g < 1) { ctx.save(); ctx.globalAlpha = 1 - g; starBall(ctx, 960, 470, lerp(160, 30, g), t, { kind: 'sun' }); ctx.restore(); }
      if (g > 0.5) blackHole(ctx, 960, 470, 60, t);
      label(ctx, 'LA MISMA MASA QUE EL SOL', 960, 70, '#fde68a');
    },
    (ctx, o) => { // ¿Nos tragaría? Pues no.
      const { W, H, t } = o; space(ctx, W, H, t, '#000000', '#0b0f1a');
      blackHole(ctx, 700, 470, 60, t);
      ctx.save(); ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 8; ctx.setLineDash([16, 12]); ctx.beginPath(); for (let u = 0; u < 3.6; u += 0.05) { const r = 520 - u * 120; ctx.lineTo(700 + Math.cos(u * 2) * r, 470 + Math.sin(u * 2) * r * 0.5); } ctx.stroke(); ctx.restore();
      drawGlobe(ctx, 1220, 470, 50, { lon0: t * 20, lat0: 15, outline: 4 });
      if (o.lt > o.span * 0.5) { const k = pop((o.lt - o.span * 0.5) / 0.4); ctx.save(); ctx.translate(960, 470); ctx.scale(k, k); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-200, -200); ctx.lineTo(200, 200); ctx.moveTo(200, -200); ctx.lineTo(-200, 200); ctx.stroke(); ctx.restore(); }
      label(ctx, o.lt > o.span * 0.5 ? '¡PUES NO!' : '¿NOS TRAGARÍA?', 960, 70, '#fca5a5');
    },
    (ctx, o) => { // La Tierra sigue dando la misma vuelta.
      const { W, H, t } = o; space(ctx, W, H, t, '#000000', '#0b0f1a');
      blackHole(ctx, 960, 480, 40, t); orbit(ctx, 960, 480, 620, 0, TAU, 'rgba(134,239,172,0.55)');
      const a = t * 0.45; ctx.save(); ctx.translate(960, 480); ctx.scale(1, 0.55); const ex = Math.cos(a) * 620, ey = Math.sin(a) * 620; ctx.restore();
      drawGlobe(ctx, 960 + ex, 480 + ey * 0.55, 44, { lon0: t * 30, lat0: 15, outline: 4, ocean: '#1e3a5f', land: '#334155' });
      ctx.save(); ctx.strokeStyle = 'rgba(134,239,172,0.55)'; ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(960, 480, 620, 341, 0, 0, TAU); ctx.stroke(); ctx.restore();
      label(ctx, 'LA MISMA VUELTA', 960, 70, '#86efac');
    },
    (ctx, o) => { // Mediría 6 km: del tamaño de un pueblo. A oscuras y congelados.
      const { W, H, t } = o; space(ctx, W, H, t, '#000000', '#0b0f1a');
      const k = ease((o.lt - 0.2) / 0.8);
      ctx.save(); ctx.globalAlpha = 1 - ease((o.lt - o.span * 0.55) / 0.5);
      for (let i = 0; i < 9; i++) kit.building(ctx, 520 + i * 100, 640, 80, 140 + (i % 4) * 50, { color: '#475569', lw: 4 });
      ctx.fillStyle = '#334155'; ctx.fillRect(400, 640, 1120, 30);
      blackHole(ctx, 960, 470, 60 * k, t);
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(500, 720); ctx.lineTo(1420, 720); ctx.stroke(); hq.tag(ctx, 960, 760, 'UNOS 6 KILÓMETROS', { size: 30, fill: '#fde047' });
      ctx.restore();
      if (o.lt > o.span * 0.55) { const g = ease((o.lt - o.span * 0.55) / 0.6); ctx.save(); ctx.globalAlpha = g; iceGlobe(ctx, 960, 470, 260, 1, t); ctx.fillStyle = 'rgba(2,6,23,0.45)'; ctx.beginPath(); ctx.arc(960, 470, 260, 0, TAU); ctx.fill(); ctx.restore(); }
      label(ctx, o.lt > o.span * 0.55 ? 'A OSCURAS Y CONGELADOS' : 'MEDIRÍA SOLO 6 KM', 960, 70, '#bae6fd');
    },
    (ctx, o) => { // Ojo: al Sol le falta peso para ser agujero negro.
      const { W, H, t } = o; space(ctx, W, H, t);
      const tilt = -0.18 * ease(o.lt / 0.8);
      ctx.save(); ctx.translate(960, 600); ctx.fillStyle = '#94a3b8'; ctx.fillRect(-14, -10, 28, 300); ctx.rotate(tilt);
      ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-460, 0); ctx.lineTo(460, 0); ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
      ctx.restore();
      const ly = 600 - Math.sin(-tilt) * 430, ry = 600 + Math.sin(-tilt) * 430;
      starBall(ctx, 530, ly - 120, 90, t, { kind: 'sun' }); hq.tag(ctx, 530, ly + 60, 'EL SOL', { size: 28, fill: '#fde047' });
      blackHole(ctx, 1390, ry - 90, 70, t); hq.tag(ctx, 1390, ry + 60, 'MUCHOS SOLES', { size: 28, fill: '#fde68a' });
      label(ctx, 'AL SOL LE FALTA PESO', 960, 70, '#fde68a');
    },
    (ctx, o) => { // Cielo negro de día, con estrellas, sobre un paisaje nevado.
      skyView(ctx, o, { kind: null, top: '#000000', bottom: '#0f172a', ground: '#e2e8f0', snowK: 0.6, toon: { eyes: 'wide', mouth: 'o', shirt: '#ef4444' } });
      const { t } = o; ctx.fillStyle = '#ffffff'; for (const [x, y, s2, tw] of STARS) { if (y * 0.7 > 720) continue; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 1.5 + tw); ctx.beginPath(); ctx.arc(x, y * 0.7, s2, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(420, 400, 120, 0, TAU); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(420, 400); ctx.lineTo(420, 310); ctx.moveTo(420, 400); ctx.lineTo(425, 320); ctx.stroke();
      hq.tag(ctx, 420, 560, 'MEDIODÍA', { size: 28, fill: '#e2e8f0' });
      label(ctx, 'NEGRO Y LLENO DE ESTRELLAS', 960, 70, '#e2e8f0', 38);
    },
  ],

  blanca: [
    (ctx, o) => { // Del tamaño de la Tierra, con la masa del Sol.
      const { W, H, t } = o; space(ctx, W, H, t);
      hq.glow(ctx, 300, 470, 380, 'rgba(253,224,71,A)', 0.25); starBall(ctx, -200, 470, 520, t, { kind: 'sun', rays: false });
      starBall(ctx, 1100, 470, 60, t, { kind: 'white', rays: false }); drawGlobe(ctx, 1450, 470, 62, { lon0: t * 20, lat0: 15, outline: 4 });
      hq.tag(ctx, 1100, 580, 'ESTRELLA MUERTA', { size: 28, fill: '#e2e8f0' }); hq.tag(ctx, 1450, 580, 'TIERRA', { size: 28, fill: '#86efac' });
      label(ctx, 'TAMAÑO DE TIERRA, PESO DE SOL', 960, 70, '#e2e8f0', 38);
    },
    (ctx, o) => { // Una cucharadita… que rompe la mesa.
      const { W, H, t } = o; space(ctx, W, H, t, '#1e1b4b', '#312e81');
      const crack = ease((o.lt - 0.6) / 0.4), sag = 40 * crack;
      ctx.fillStyle = '#92400e'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(500, 600); ctx.lineTo(940, 600 + sag); ctx.lineTo(980, 600 + sag); ctx.lineTo(1420, 600); ctx.lineTo(1420, 640); ctx.lineTo(980, 640 + sag); ctx.lineTo(940, 640 + sag); ctx.lineTo(500, 640); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const x of [540, 1380]) { ctx.fillRect(x - 15, 640, 30, 260); ctx.strokeRect(x - 15, 640, 30, 260); }
      ctx.save(); ctx.translate(960, 560 + sag); ctx.rotate(-0.1);
      ctx.beginPath(); ctx.ellipse(-60, 0, 70, 34, 0, 0, TAU); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      hq.glow(ctx, -60, -10, 80, 'rgba(255,255,255,A)', 0.9); ctx.beginPath(); ctx.ellipse(-60, -8, 50, 18, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(240, -20); ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
      ctx.restore();
      if (crack > 0) { ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(960, 600 + sag); ctx.lineTo(940, 620 + sag); ctx.lineTo(975, 640 + sag); ctx.stroke(); }
      label(ctx, 'UNA CUCHARADITA: VARIAS TONELADAS', 960, 70, '#e2e8f0', 36);
    },
    (ctx, o) => { // Ya no produce luz: se enfría como una brasa.
      const { W, H, t } = o; space(ctx, W, H, t, '#0b0f1a', '#1c1917');
      const k = ease(o.lt / Math.max(1.2, o.span));
      hq.glow(ctx, 960, 470, 300, 'rgba(251,146,60,A)', 0.6 * (1 - 0.6 * k));
      // Brasa: un carbón redondo con grietas que brillan y se van apagando; chispas que suben.
      ctx.beginPath(); ctx.moveTo(700, 600); ctx.bezierCurveTo(680, 420, 860, 340, 980, 360); ctx.bezierCurveTo(1150, 370, 1260, 470, 1230, 600); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, 350, 600, [[0, mixc('#57534e', '#292524', k)], [1, '#1c1917']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, c] of [[22, mixc('#f97316', '#44403c', k)], [10, mixc('#fde047', '#57534e', k)]]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(760, 560); ctx.lineTo(860, 470); ctx.lineTo(960, 520); ctx.lineTo(1060, 430); ctx.moveTo(860, 470); ctx.lineTo(900, 380); ctx.moveTo(960, 520); ctx.lineTo(1000, 600); ctx.moveTo(1060, 430); ctx.lineTo(1180, 500); ctx.stroke(); }
      ctx.restore();
      if (k < 0.9) for (let i = 0; i < 10; i++) { const u = (t * 0.5 + i / 10) % 1; ctx.globalAlpha = (1 - u) * (1 - k); ctx.fillStyle = '#fdba74'; ctx.beginPath(); ctx.arc(820 + i * 40 + 20 * Math.sin(t + i), 380 - u * 260, 5, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
      label(ctx, 'SE ENFRÍA COMO UNA BRASA', 960, 70, '#fdba74');
    },
    (ctx, o) => { // Un puntito cegador que casi no calienta.
      skyView(ctx, o, { kind: 'white', r: 14, top: '#1e293b', bottom: '#64748b', ground: '#e2e8f0', snowK: 0.5, toon: { eyes: 'closed', mouth: 'flat', shirt: '#ef4444', armR: [2.4, 1.4] } });
      label(ctx, 'UN PUNTITO… Y MUCHO FRÍO', 960, 70, '#e2e8f0');
    },
    (ctx, o) => { // Así terminará nuestro Sol: amarillo → gigante roja → estrella muerta.
      const { W, H, t } = o; space(ctx, W, H, t);
      const st = [[420, 'sun', 110, 'HOY'], [960, 'giant', 210, 'DESPUÉS'], [1500, 'white', 30, 'AL FINAL']];
      st.forEach(([x, kind, r, name], i) => { const k = pop((o.lt - i * 0.6) / 0.5); if (k <= 0) return; ctx.save(); ctx.translate(x, 470); ctx.scale(k, k); starBall(ctx, 0, 0, r, t, { kind, rays: kind !== 'giant' }); ctx.restore(); hq.tag(ctx, x, 760, name, { size: 30, fill: '#e2e8f0' }); if (i < 2 && k > 0.5) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 250, 470); ctx.lineTo(x + 330, 470); ctx.moveTo(x + 305, 450); ctx.lineTo(x + 330, 470); ctx.lineTo(x + 305, 490); ctx.stroke(); } });
      label(ctx, 'ASÍ TERMINARÁ NUESTRO SOL', 960, 70, '#fde047');
    },
    (ctx, o) => { // Sirio y su compañera escondida.
      const { W, H, t } = o; space(ctx, W, H, t);
      starBall(ctx, 860, 470, 170, t, { kind: 'blue' });
      const a = t * 0.7, k = pop(o.lt / 0.6), px = 860 + Math.cos(a) * 470, py = 470 + Math.sin(a) * 190;
      ctx.save(); ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.beginPath(); ctx.ellipse(860, 470, 470, 190, 0, 0, TAU); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(px, py); ctx.scale(k, k); starBall(ctx, 0, 0, 16, t, { kind: 'white', rays: false }); ctx.restore();
      hq.tag(ctx, px, py - 70, 'SU COMPAÑERA', { size: 26, fill: '#e2e8f0' });
      label(ctx, 'SIRIO TIENE UNA ESCONDIDA', 960, 70, '#bae6fd');
    },
  ],

  cierre: [
    (ctx, o) => { lineup(ctx, o, { crosses: clamp((o.lt - 0.6) / 0.8) }); label(ctx, '¿CUÁL NOS CONVIENE? NINGUNA', 960, 70, '#fca5a5', 38); },
    (ctx, o) => { // Nuestro Sol, justo de la medida, con la Tierra en la zona perfecta.
      const { W, H, t } = o; space(ctx, W, H, t);
      const sx = 160, sy = 470;
      ctx.save(); ctx.globalAlpha = 0.35; ctx.lineWidth = 140; for (const [r, c] of [[360, '#ef4444'], [560, '#22c55e'], [760, '#3b82f6']]) { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(sx, sy, r, -0.8, 0.8); ctx.stroke(); } ctx.restore();
      starBall(ctx, sx, sy, 100, t, { kind: 'sun' });
      const a = Math.sin(t * 0.4) * 0.4; drawGlobe(ctx, sx + Math.cos(a) * 560, sy + Math.sin(a) * 560, 48, { lon0: t * 30, lat0: 15, outline: 4 });
      hq.tag(ctx, sx + 560, sy - 340, 'ZONA PERFECTA', { size: 28, fill: '#86efac' });
      label(ctx, 'JUSTO DE LA MEDIDA', 960, 70, '#86efac');
    },
    (ctx, o) => { lifeBars(ctx, o, [['sun', 'NUESTRO SOL', 10, '#facc15']], { at: 4.6, text: 'HOY ESTAMOS AQUÍ', fill: '#86efac' }); label(ctx, 'Y LE QUEDA OTRO TANTO', 960, 70, '#fde047'); },
    (ctx, o) => { lineup(ctx, o, { q: ease(o.lt / 0.5) }); },
  ],
};
