// Short 48: ¿y si el mar fuera de agua dulce?  (calidad alta: engine2d/hq.js + props.js)
// Gancho corto: ¿sería buena idea? (se contesta con lo bueno y lo malo). Sin palabras técnicas.
// Lo bueno: podrías tomártelo y los desiertos junto al mar serían huertas → lo malo: casi todos los peces del mar
// morirían (se llenan de agua) → flotarías menos (la sal te empuja) → el mar se congelaría más fácil →
// sorpresa: toda la sal del mar taparía los continentes con más de 150 m (un edificio de 40 pisos).
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, ground, cloud, sunDisc, sea, bushyTree, tower, puff } from '../../engine2d/props.js';

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

function saltCube(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  hq.roundRectPath(ctx, -s / 2, -s / 2, s, s, s * 0.15); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.fillRect(-s / 2 + 3, s * 0.1, s - 6, s * 0.35);
  ctx.restore();
}

function fish(ctx, x, y, s, color, { swell = 0, t = 0, seed = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const rx = 62 * (1 - 0.3 * swell), ry = 34 * (1 + 0.95 * swell), wag = Math.sin(t * 9 + seed) * 8 * (1 - swell);
  ctx.beginPath(); ctx.moveTo(rx - 8, 0); ctx.lineTo(rx + 42, -30 + wag); ctx.lineTo(rx + 42, 30 + wag); ctx.closePath(); ctx.fillStyle = hq.shade(color, -0.15); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -ry + 4); ctx.quadraticCurveTo(10, -ry - 26, 30, -ry + 8); ctx.closePath(); ctx.fillStyle = hq.shade(color, -0.15); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -ry, ry, [[0, hq.shade(color, 0.2)], [1, hq.shade(color, -0.2)]]); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(4, -ry, 14, ry * 2); ctx.fillRect(28, -ry, 10, ry * 2); ctx.restore();
  ctx.beginPath(); ctx.arc(-rx * 0.5, -ry * 0.18, 11, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(-rx * 0.5 - 2, -ry * 0.18 + (swell > 0.4 ? 3 : 0), 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.lineWidth = 4; ctx.beginPath();
  if (swell > 0.4) { ctx.moveTo(-rx * 0.85, ry * 0.32); ctx.quadraticCurveTo(-rx * 0.7, ry * 0.18, -rx * 0.55, ry * 0.32); } else { ctx.moveTo(-rx * 0.9, ry * 0.15); ctx.quadraticCurveTo(-rx * 0.75, ry * 0.32, -rx * 0.6, ry * 0.18); }
  ctx.stroke();
  ctx.restore();
}

function glass(ctx, x, y, w, h, fill, frozen) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w * 0.4, y); ctx.lineTo(x - w * 0.4, y); ctx.closePath();
  ctx.save(); ctx.clip();
  if (frozen) { ctx.fillStyle = hq.vgrad(ctx, 0, y - h * 0.8, y, [[0, '#e0f2fe'], [1, '#60a5fa']]); ctx.fillRect(x - w, y - h * 0.8, w * 2, h); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - w * 0.2, y - h * 0.7); ctx.lineTo(x - w * 0.05, y - h * 0.4); ctx.lineTo(x - w * 0.25, y - h * 0.2); ctx.stroke(); }
  else { ctx.fillStyle = fill; ctx.fillRect(x - w, y - h * 0.8, w * 2, h); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w * 0.4, y); ctx.lineTo(x + w * 0.4, y); ctx.lineTo(x + w / 2, y - h); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Playa: el agua sabe salada… la sal sale volando del mar y el agua se vuelve dulce.
    const k = ease((local - 1.0) / 0.9);
    sky(ctx, W, 0, 840, '#38bdf8', '#e0f2fe');
    sunDisc(ctx, 870, 520, 48, t);
    cloud(ctx, 200, 520, 110);
    sea(ctx, W, H, 820, t, { top: mixc('#0369a1', '#22d3ee', k), bottom: mixc('#082f49', '#0e7490', k) });
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const x = (i * 83 + t * 40) % W, y = 850 + (i * 37) % 140; ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillRect(-2, -10, 4, 20); ctx.fillRect(-10, -2, 20, 4); ctx.restore(); } ctx.restore(); }
    // La sal sale del agua (cubitos que suben y desaparecen).
    if (local > 0.9) for (let i = 0; i < 26; i++) { const u = clamp((local - 0.9 - (i % 9) * 0.06) / 0.9); if (u <= 0 || u >= 1) continue; const x = 60 + (i * 41) % 980; saltCube(ctx, x + 20 * Math.sin(u * 6 + i), 900 - u * 360, 22, u * 4 + i); }
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#fde68a'], [1, '#f59e0b']]); ctx.fillRect(0, 1000, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    const sweet = local > 1.9;
    hq.toon(ctx, 330, 1100, 400, {
      t, seed: 4, shirt: '#f43f5e', pants: '#0ea5e9', skin: '#e0ac69', hair: '#1f2937', armR: [1.7, -1.5], armL: [0.25, 0.2],
      eyes: sweet ? 'happy' : 'closed', mouth: sweet ? 'smile' : 'flat', brows: sweet ? 0 : -1,
      hold: (c, h) => { const [hx, hy] = h.R; c.beginPath(); c.moveTo(hx - 30, hy - 60); c.lineTo(hx + 30, hy - 60); c.lineTo(hx + 22, hy + 20); c.lineTo(hx - 22, hy + 20); c.closePath(); c.fillStyle = 'rgba(56,189,248,0.6)'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); },
    });
    hq.bubble(ctx, 650, 640, 280, 100, 440, 760, sweet ? '¡DULCE!' : '¡SALADA!', { size: 46, fill: sweet ? '#0e7490' : '#b91c1c' });
  },

  tomar(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Alguien se toma el mar con un popote gigante.
      sky(ctx, W, 0, 840, '#38bdf8', '#e0f2fe');
      sunDisc(ctx, 880, 520, 46, t);
      sea(ctx, W, H, 820, t, { top: '#22d3ee', bottom: '#0e7490' });
      ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#fde68a'], [1, '#f59e0b']]); ctx.fillRect(0, 1000, W, H);
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
      // Popote.
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(470, 830); ctx.quadraticCurveTo(470, 760, 400, 735); ctx.lineTo(330, 735); ctx.stroke();
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 22; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.setLineDash([16, 20]); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 4; i++) { const u = ((t * 1.4 + i * 0.25) % 1); ctx.beginPath(); ctx.arc(lerp(470, 330, u), u < 0.5 ? lerp(820, 740, u * 2) : 735, 6, 0, TAU); ctx.fillStyle = '#38bdf8'; ctx.fill(); }
      hq.toon(ctx, 250, 1090, 380, { t, seed: 6, shirt: '#22c55e', skin: '#8d5524', hair: '#111827', hairStyle: 'curly', eyes: 'happy', mouth: 'o', armL: [0.25, 0.2], armR: [0.6, -1.0] });
      hq.tag(ctx, 540, 410, 'PODRÍAS TOMÁRTELO', { size: 46, fill: '#a5f3fc' });
      return;
    }
    // Desierto junto al mar: tuberías y regaderas… y crecen huertas.
    const g = ease((local - c1 - 0.2) / 1.6);
    sky(ctx, W, 0, 900, '#fdba74', '#fef3c7');
    sunDisc(ctx, 860, 520, 52, t);
    sea(ctx, W, H, 880, t, { top: '#22d3ee', bottom: '#0e7490' });
    ctx.beginPath(); ctx.moveTo(120, H); ctx.lineTo(420, 885); ctx.quadraticCurveTo(700, 820, W, 860); ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 840, H, [[0, mixc('#fcd34d', '#84cc16', g)], [1, mixc('#d97706', '#3f6212', g)]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // Tubo del mar a la tierra.
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(250, 930); ctx.lineTo(1040, 930); ctx.stroke(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 14; ctx.stroke();
    for (let i = 0; i < 4; i++) { const x = 520 + i * 150; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, 930); ctx.lineTo(x, 880); ctx.stroke(); if (g > 0) for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + (j - 2) * 0.4, u = ((t * 1.5 + j * 0.2) % 1); ctx.beginPath(); ctx.arc(x + Math.cos(a) * 80 * u, 880 + Math.sin(a) * 60 * u + 60 * u * u, 5, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); } }
    // Hileras de cultivo que crecen.
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const x = 470 + i * 105 + r * 20, y = 1000 + r * 95, k = clamp(g * 1.4 - (r * 6 + i) * 0.04); if (k <= 0) continue; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s2 * 18, -24, 14, 34, s2 * 0.6, 0, TAU); ctx.fillStyle = '#22c55e'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); } ctx.beginPath(); ctx.arc(0, -40, 14, 0, TAU); ctx.fillStyle = i % 2 ? '#ef4444' : '#f97316'; ctx.fill(); ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 540, 410, 'DESIERTOS CONVERTIDOS EN HUERTAS', { size: 34, fill: '#bef264' });
  },

  peces(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Bajo el mar: los peces nadan… y luego se inflan de agua y flotan, tristes.
    const c1 = cue(1), sw = ease((local - c1) / 1.3);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#22d3ee'], [0.5, '#0369a1'], [1, '#082f49']]); ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 1400, t, { n: 16, seed: 4, color: 'rgba(255,255,255,A)', r: [20, 60], a: 0.12 });
    ctx.fillStyle = hq.vgrad(ctx, 0, 1040, H, [[0, '#fcd34d'], [1, '#b45309']]); ctx.fillRect(0, 1040, W, H);
    for (let i = 0; i < 7; i++) { const x = 60 + i * 160; ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 1050); for (let k = 1; k <= 6; k++) ctx.lineTo(x + 20 * Math.sin(k + t * 2 + i), 1050 - k * 40); ctx.stroke(); ctx.strokeStyle = i % 2 ? '#16a34a' : '#22c55e'; ctx.lineWidth = 12; ctx.stroke(); }
    const F = [[260, 560, 1.0, '#f97316'], [700, 620, 1.2, '#facc15'], [430, 780, 0.9, '#ec4899'], [850, 860, 1.0, '#a855f7'], [220, 930, 0.8, '#22c55e'], [620, 950, 0.85, '#38bdf8']];
    F.forEach(([x0, y0, s, c], i) => { const x = ((x0 - t * 60 * (1 - sw) + 1400) % 1400) - 160, y = y0 + 10 * Math.sin(t * 2 + i) - sw * (y0 - 470) * 0.55; fish(ctx, x, y, s, c, { swell: sw, t, seed: i }); });
    if (sw > 0) for (let i = 0; i < 18; i++) { const x = (i * 63 + 40) % W, y = 1040 - ((t * 90 + i * 57) % 640); ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); }
    hq.tag(ctx, 540, 410, local < c1 ? 'CASI TODOS LOS PECES MORIRÍAN' : 'SE LLENAN DE AGUA', { size: local < c1 ? 36 : 44, fill: '#fca5a5' });
  },

  flotar(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dos tanques: en el salado flotas hasta el pecho; en el dulce, apenas asoma la cabeza.
    const c1 = cue(1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#f0f9ff'], [1, '#bae6fd']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(0, 1060, W, H); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1060); ctx.lineTo(W, 1060); ctx.stroke();
    const lvl = 720;
    for (const [x0, salty] of [[80, true], [570, false]]) {
      const w = 430, bob = 6 * Math.sin(t * 2 + (salty ? 0 : 1));
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, 520, w, 540);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, 520, w, 540); ctx.clip();
      hq.toon(ctx, x0 + w / 2, (salty ? 940 : 990) + bob, 300, { t, seed: salty ? 1 : 2, shirt: salty ? '#f97316' : '#8b5cf6', skin: '#e0ac69', hair: '#1f2937', armL: [1.4, 0.3], armR: [1.4, 0.3], eyes: salty ? 'happy' : 'wide', mouth: salty ? 'smile' : 'o', brows: salty ? 0 : 1 });
      ctx.fillStyle = salty ? 'rgba(14,165,233,0.72)' : 'rgba(56,189,248,0.6)'; ctx.fillRect(x0, lvl, w, 400);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = x0; x <= x0 + w; x += 20) ctx.lineTo(x, lvl + 5 * Math.sin(x * 0.05 + t * 3)); ctx.stroke();
      if (salty) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; const R = kit.rng(5); for (let i = 0; i < 40; i++) { ctx.fillRect(x0 + R() * w, lvl + 20 + R() * 300, 5, 5); } }
      else for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x0 + w / 2 + 30 + 10 * Math.sin(t * 4 + i), lvl - 10 - ((t * 80 + i * 30) % 100), 7, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
      if (salty && local > c1) { const k = ease((local - c1) / 0.5); ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 12; ctx.lineCap = 'round'; for (const dx of [-140, 140]) { const y = 1000 - ((t * 120) % 60); ctx.beginPath(); ctx.moveTo(x0 + w / 2 + dx, y); ctx.lineTo(x0 + w / 2 + dx, y - 160); ctx.moveTo(x0 + w / 2 + dx - 24, y - 136); ctx.lineTo(x0 + w / 2 + dx, y - 160); ctx.lineTo(x0 + w / 2 + dx + 24, y - 136); ctx.stroke(); } ctx.restore(); }
      ctx.restore();
      ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeRect(x0, 520, w, 540);
      hq.tag(ctx, x0 + w / 2, 1000, salty ? 'SALADA' : 'DULCE', { size: 34, fill: salty ? '#ffffff' : '#a5f3fc' });
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'FLOTARÍAS MENOS' : 'LA SAL TE EMPUJA HACIA ARRIBA', { size: local < c1 ? 46 : 38, fill: '#fde047' });
  },

  hielo(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Mar frío: el hielo se extiende sobre el agua; un pingüino llega patinando.
      const k = ease((local - 0.2) / Math.max(1, c1 - 0.2));
      sky(ctx, W, 0, 880, '#bae6fd', '#f0f9ff');
      sea(ctx, W, H, 860, t, { top: '#0ea5e9', bottom: '#0c4a6e', amp: 4 });
      for (const [x0, dir] of [[0, 1], [W, -1]]) {
        const w = 560 * k;
        ctx.beginPath(); ctx.moveTo(x0, 852); for (let i = 0; i <= 10; i++) { const x = x0 + dir * w * (i / 10); ctx.lineTo(x, 852 + (i % 2 ? -6 : 4)); } ctx.lineTo(x0 + dir * w, 930); ctx.lineTo(x0, 930); ctx.closePath();
        ctx.fillStyle = hq.vgrad(ctx, 0, 846, 930, [[0, '#ffffff'], [1, '#bfdbfe']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      }
      ctx.save(); ctx.translate(200 + 200 * k, 850); ctx.beginPath(); ctx.ellipse(0, -60, 34, 60, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.ellipse(6, -52, 22, 46, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.moveTo(26, -100); ctx.lineTo(50, -94); ctx.lineTo(26, -86); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.beginPath(); ctx.arc(14, -104, 5, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.arc(16, -104, 2.5, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
      hq.tag(ctx, 540, 410, 'SE CONGELARÍA MÁS FÁCIL', { size: 42, fill: '#e0f2fe' });
      return;
    }
    // Congelador: el vaso de agua dulce ya es hielo; el de agua salada sigue líquido.
    const k = ease((local - c1 - 0.3) / 0.8);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#e0f2fe'], [1, '#93c5fd']]); ctx.fillRect(0, 0, W, H);
    hq.card(ctx, 140, 500, 800, 560, '#f8fafc', 30);
    ctx.fillStyle = 'rgba(186,230,253,0.6)'; ctx.fillRect(170, 530, 740, 500);
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 18; i++) { const x = 180 + (i * 97) % 720, y = 540 + (i * 53) % 480; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.5 + i); ctx.fillRect(-2, -9, 4, 18); ctx.fillRect(-9, -2, 18, 4); ctx.restore(); }
    glass(ctx, 350, 980, 210, 300, 'rgba(56,189,248,0.7)', k > 0.5);
    glass(ctx, 730, 980, 210, 300, 'rgba(14,165,233,0.75)', false);
    hq.tag(ctx, 350, 620, 'DULCE: HIELO', { size: 30, fill: '#bae6fd' }); hq.tag(ctx, 730, 620, 'SALADA: AÚN LÍQUIDA', { size: 30, fill: '#ffffff' });
    hq.tag(ctx, 540, 410, 'LA SALADA AGUANTA MÁS FRÍO', { size: 40, fill: '#e0f2fe' });
  },

  sal(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Un salero gigante cubre los continentes: la sal sube hasta la azotea de un edificio de 40 pisos.
    const c1 = cue(1), up = ease((local - c1 + 0.2) / Math.max(1.4, o.s.dur - c1 - 0.6)), lvl = lerp(990, 440, up);
    sky(ctx, W, 0, 1000, '#7dd3fc', '#f0f9ff');
    ground(ctx, W, H, 1000, '#65a30d', '#3f6212');
    for (let i = 0; i < 6; i++) bushyTree(ctx, 60 + i * 170, 1004, 150 + (i % 2) * 40, { seed: i });
    for (let i = 0; i < 4; i++) tower(ctx, 520 + i * 110, 1000, 90, 6 + (i % 3) * 4, hq.shade('#94a3b8', -0.1 + i * 0.07), 22);
    tower(ctx, 140, 1000, 120, 40, '#64748b', 14);
    // Salero vertiendo.
    if (local < c1 + 0.6) {
      const a = 1 - clamp((local - c1) / 0.6);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(720, 560); ctx.rotate(2.6);
      hq.roundRectPath(ctx, -70, -110, 140, 190, 30); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      hq.roundRectPath(ctx, -72, -140, 144, 50, 16); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; for (const dx of [-30, 0, 30]) { ctx.beginPath(); ctx.arc(dx, -118, 6, 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { const u = ((t * 1.2 + i * 0.025) % 1); ctx.fillRect(760 + 30 * Math.sin(i) + u * 20, 660 + u * (lvl - 660), 6, 6); } ctx.restore();
    }
    // Capa de sal.
    ctx.fillStyle = hq.vgrad(ctx, 0, lvl, H, [[0, '#ffffff'], [1, '#e2e8f0']]); ctx.fillRect(0, lvl, W, H - lvl);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, lvl + 4 * Math.sin(x * 0.07)); ctx.stroke();
    const R = kit.rng(6); for (let i = 0; i < 26; i++) { const x = R() * W, y = lvl + 20 + R() * 400; saltCube(ctx, x, y, 14, R() * 2); }
    // Regla de altura junto al edificio.
    if (local > c1) { ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(300, 1000); ctx.lineTo(300, 440); ctx.stroke(); for (let i = 0; i <= 4; i++) { const y = lerp(1000, 440, i / 4); ctx.beginPath(); ctx.moveTo(290, y); ctx.lineTo(320, y); ctx.stroke(); } }
    hq.tag(ctx, 540, 410, local < c1 ? '¿Y TODA LA SAL?' : up > 0.9 ? '¡COMO 40 PISOS!' : '¡MÁS DE 150 METROS DE SAL!', { size: 42, fill: '#fde047' });
  },
};
