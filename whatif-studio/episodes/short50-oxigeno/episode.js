// Short 50: ¿y si el aire tuviera el doble de oxígeno?  (calidad alta: engine2d/hq.js + props.js)
// Gancho corto: ¿respirarías mejor? (se contesta enseguida: no, y se abre otra pregunta: lo que cambia es el fuego).
// La sangre ya va casi llena de oxígeno → el fuego arde mucho más rápido; hasta una planta mojada podría prenderse →
// los bosques se quemarían a cada rato (un rayo prende selvas enteras) → el metal se oxidaría más rápido →
// sorpresa: hace unos 300 millones de años el aire tenía mucho más oxígeno y había libélulas como palomas.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, ground, cloud, sunDisc, rain, bushyTree, drop } from '../../engine2d/props.js';

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

/** Llama con base en (x, y), alto h. */
function flame(ctx, x, y, h, t, seed = 0) {
  const w = h * 0.45, f = Math.sin(t * 11 + seed) * 0.08 + Math.sin(t * 17 + seed * 2) * 0.05;
  hq.glow(ctx, x, y - h * 0.4, h * 1.1, 'rgba(251,146,60,A)', 0.45);
  for (const [k, c] of [[1, '#ef4444'], [0.72, '#f97316'], [0.45, '#fde047']]) {
    ctx.beginPath(); ctx.moveTo(x - w * k, y);
    ctx.bezierCurveTo(x - w * k * 1.1, y - h * k * 0.5, x - w * k * 0.2 + f * h, y - h * k * 0.7, x + f * h * 1.5, y - h * k);
    ctx.bezierCurveTo(x + w * k * 0.3 + f * h, y - h * k * 0.6, x + w * k * 1.1, y - h * k * 0.45, x + w * k, y);
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    if (k === 1) { ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  }
}

function dragonfly(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const f = Math.sin(t * 30) * 0.18;
  for (const [dx, sy, r] of [[-14, -1, -0.25], [-14, 1, 0.25], [14, -1, -0.15], [14, 1, 0.15]]) {
    ctx.save(); ctx.translate(dx, 0); ctx.rotate(r + sy * f);
    ctx.beginPath(); ctx.ellipse(0, sy * 70, 18, 70, 0, 0, TAU); ctx.fillStyle = 'rgba(224,242,254,0.75)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = 'rgba(14,116,144,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, sy * 10); ctx.lineTo(0, sy * 130); ctx.stroke();
    ctx.restore();
  }
  hq.roundRectPath(ctx, -10, -12, 150, 24, 12); ctx.fillStyle = hq.vgrad(ctx, 0, -12, 12, [[0, '#2dd4bf'], [1, '#0f766e']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.strokeStyle = 'rgba(15,23,42,0.4)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(20 + i * 20, -11); ctx.lineTo(20 + i * 20, 11); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(-24, 0, 26, 22, 0, 0, TAU); ctx.fillStyle = '#14b8a6'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(-58, 0, 22, 0, TAU); ctx.fillStyle = '#0d9488'; ctx.fill(); ctx.stroke();
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(-64, sy * 10, 11, 0, TAU); ctx.fillStyle = '#991b1b'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}

function pigeon(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const f = Math.sin(t * 9) * 0.5;
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-60, -60 - 40 * f, -140, -40 - 50 * f); ctx.quadraticCurveTo(-70, -10, -10, 10); ctx.closePath(); ctx.fillStyle = '#94a3b8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(60, -60 - 40 * f, 140, -40 - 50 * f); ctx.quadraticCurveTo(70, -10, 10, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 4, 26, 40, 0, 0, TAU); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -40, 16, 0, TAU); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -52); ctx.lineTo(0, -66); ctx.lineTo(5, -52); ctx.fillStyle = '#f59e0b'; ctx.fill();
  ctx.restore();
}

function bike(ctx, x, y, s, rust) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const metal = mixc('#3b82f6', '#9a3412', rust);
  for (const wx of [-150, 150]) { ctx.beginPath(); ctx.arc(wx, 0, 95, 0, TAU); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = mixc('#1f2937', '#7c2d12', rust * 0.6); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = mixc('#9ca3af', '#b45309', rust); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx + Math.cos(a) * 88, Math.sin(a) * 88); ctx.stroke(); } }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const frame = () => { ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(-30, 0); ctx.lineTo(90, -130); ctx.lineTo(-60, -130); ctx.lineTo(-30, 0); ctx.moveTo(-60, -130); ctx.lineTo(-150, 0); ctx.moveTo(90, -130); ctx.lineTo(150, 0); ctx.moveTo(90, -130); ctx.lineTo(70, -190); ctx.lineTo(120, -200); ctx.moveTo(-60, -130); ctx.lineTo(-70, -165); };
  ctx.strokeStyle = INK; ctx.lineWidth = 22; frame(); ctx.stroke(); ctx.strokeStyle = metal; ctx.lineWidth = 12; frame(); ctx.stroke();
  hq.roundRectPath(ctx, -110, -180, 80, 22, 10); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  if (rust > 0) { const R = kit.rng(4); ctx.globalAlpha = rust; ctx.fillStyle = '#c2410c'; for (let i = 0; i < 26; i++) { const u = R(); const px = lerp(-150, 90, u), py = lerp(0, -130, R()) * (R() < 0.5 ? 1 : 0.1); ctx.beginPath(); ctx.arc(px, py, 4 + R() * 6, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Fogata de noche: de golpe la llama crece al doble; quien asa un bombón salta hacia atrás.
    const k = ease((local - 1.0) / 0.5);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 1000, [[0, '#0f172a'], [1, '#312e81']]); ctx.fillRect(0, 0, W, 1000);
    const st = kit.makeStars(60, W, 900, 3); kit.drawStars(ctx, st, 0.8, t);
    ground(ctx, W, H, 1000, '#1e293b', '#020617');
    for (let i = 0; i < 4; i++) bushyTree(ctx, 80 + i * 300, 1004, 260, { seed: i, leaf: '#14532d', trunk: '#422006' });
    hq.glow(ctx, 540, 960, 300 + 280 * k, 'rgba(251,146,60,A)', 0.35 + 0.2 * k);
    // Leña.
    ctx.lineCap = 'round'; for (const [a, c] of [[0.35, '#78350f'], [-0.35, '#92400e']]) { ctx.save(); ctx.translate(540, 1010); ctx.rotate(a); ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(110, 0); ctx.stroke(); ctx.lineWidth = 22; ctx.strokeStyle = c; ctx.stroke(); ctx.restore(); }
    flame(ctx, 540, 1000, 200 + 260 * k, t);
    if (k > 0) for (let i = 0; i < 14; i++) { const u = (t * 0.8 + i / 14) % 1; ctx.fillStyle = '#fde047'; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(540 + 120 * Math.sin(i * 2.3 + t), 980 - u * 520, 5, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    const back = k > 0.3;
    hq.toon(ctx, 800 + 60 * k, 1100, 360, {
      t, seed: 7, shirt: '#2563eb', skin: '#e0ac69', hair: '#1f2937', armR: [1.6, back ? -1.0 : 0.1], armL: [0.3, 0.2], lean: back ? 0.15 : 0, eyes: back ? 'wide' : 'happy', mouth: back ? 'o' : 'smile', brows: back ? 1 : 0, look: [-1, 0],
      hold: (c, h) => { const [hx, hy] = h.R; c.strokeStyle = INK; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - 170, hy - 40); c.stroke(); c.beginPath(); c.ellipse(hx - 180, hy - 42, 18, 14, 0.2, 0, TAU); c.fillStyle = back ? '#1f2937' : '#fef3c7'; c.fill(); c.lineWidth = 4; c.stroke(); },
    });
  },

  respirar(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Por dentro de una vena: los glóbulos rojos ya van casi llenos de oxígeno (burbujas).
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#7f1d1d'], [1, '#450a0a']]); ctx.fillRect(0, 0, W, H);
      hq.bokeh(ctx, W, 380, 1300, t, { n: 14, seed: 2, color: 'rgba(252,165,165,A)', r: [30, 80], a: 0.15 });
      for (let i = 0; i < 7; i++) {
        const x = ((i * 190 + t * 140) % 1300) - 110, y = 560 + (i % 3) * 170 + 14 * Math.sin(t * 2 + i);
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.3 * Math.sin(t + i));
        ctx.beginPath(); ctx.ellipse(0, 0, 92, 58, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -58, 58, [[0, '#f87171'], [1, '#b91c1c']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, 52, 28, 0, 0, TAU); ctx.fillStyle = 'rgba(127,29,29,0.45)'; ctx.fill();
        for (let b = 0; b < 4; b++) { const a = (b / 4) * TAU + 0.4; ctx.beginPath(); ctx.arc(Math.cos(a) * 52, Math.sin(a) * 26 - 6, 14, 0, TAU); ctx.fillStyle = '#bae6fd'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
        ctx.restore();
      }
      // Medidor casi lleno.
      hq.card(ctx, 290, 1000, 500, 70, '#0f172a', 35);
      hq.roundRectPath(ctx, 306, 1014, 468 * 0.97, 42, 21); ctx.fillStyle = '#38bdf8'; ctx.fill();
      hq.tag(ctx, 540, 410, 'TU SANGRE YA VA CASI LLENA', { size: 40, fill: '#bae6fd' });
      return;
    }
    // Un cerillo que se enciende: lo que cambia es el fuego.
    const k = ease((local - c1) / 0.4);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#1e1b4b'], [1, '#0f172a']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(540, 1000); ctx.rotate(-0.15);
    hq.roundRectPath(ctx, -14, -300, 28, 300, 8); ctx.fillStyle = '#fde68a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -310, 26, 34, 0, 0, TAU); ctx.fillStyle = '#b91c1c'; ctx.fill(); ctx.stroke();
    if (k > 0) { ctx.save(); ctx.translate(0, -318); ctx.scale(k, k); flame(ctx, 0, 0, 220, t); ctx.restore(); }
    ctx.restore();
    hq.tag(ctx, 540, 410, 'LO QUE CAMBIA: EL FUEGO', { size: 44, fill: '#fdba74' });
  },

  fuego(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Dos velas: la de hoy y la del aire con el doble de oxígeno (llama enorme que se consume rápido).
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#312e81'], [1, '#0f172a']]); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, 1000, W, H); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
      const melt = ease((local - 0.3) / Math.max(1, c1));
      for (const [x, big] of [[300, false], [780, true]]) {
        const h = big ? lerp(380, 120, melt) : 380;
        hq.roundRectPath(ctx, x - 60, 1000 - h, 120, h, 14); ctx.fillStyle = hq.vgrad(ctx, 0, 1000 - h, 1000, [[0, '#fef3c7'], [1, '#fcd34d']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
        ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 1000 - h); ctx.lineTo(x, 1000 - h - 24); ctx.stroke();
        flame(ctx, x, 1000 - h - 18, big ? 300 : 110, t, big ? 1 : 0);
        hq.tag(ctx, x, 1050, big ? 'EL DOBLE' : 'HOY', { size: 32, fill: big ? '#fdba74' : '#e2e8f0' });
      }
      hq.tag(ctx, 540, 410, 'ARDE MUCHO MÁS RÁPIDO', { size: 44, fill: '#fdba74' });
      return;
    }
    // Una planta empapada (con gotas) que aun así se prende.
    const k = ease((local - c1 - 0.9) / 0.8);
    sky(ctx, W, 0, 1000, '#94a3b8', '#e2e8f0');
    rain(ctx, W, 380, 1000, t, 0.6 * (1 - k), 50);
    ground(ctx, W, H, 1000, '#4d7c0f', '#1a2e05');
    ctx.save(); ctx.translate(540, 1000);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32, L = 300 - Math.abs(i - 3) * 30; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * L * 0.6 - 30, Math.sin(a) * L * 0.6, Math.cos(a) * L, Math.sin(a) * L); ctx.quadraticCurveTo(Math.cos(a) * L * 0.5 + 30, Math.sin(a) * L * 0.5, 0, 0); ctx.fillStyle = mixc('#22c55e', '#3f3f46', k * 0.4); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 9; i++) drop(ctx, 400 + (i * 47) % 280, 760 + (i * 61) % 200, 11, '#7dd3fc');
    if (k > 0) for (let i = 0; i < 4; i++) flame(ctx, 440 + i * 66, 1000 - (i % 2) * 90, (110 + (i % 3) * 40) * k, t, i);
    hq.tag(ctx, 540, 410, '¡HASTA MOJADA SE PRENDE!', { size: 44, fill: '#fdba74' });
  },

  bosques(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Cae un rayo y el fuego corre por todo el bosque en segundos.
    const c1 = cue(1), strike = clamp((local - 0.4) / 0.25), spread = clamp((local - 0.6) / Math.max(1.6, o.s.dur - 0.8));
    sky(ctx, W, 0, 1000, mixc('#475569', '#7c2d12', spread), mixc('#94a3b8', '#fb923c', spread));
    cloud(ctx, 300, 480, 170, '#475569'); cloud(ctx, 720, 450, 190, '#475569');
    if (strike > 0 && strike < 1) { ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - strike)})`; ctx.fillRect(0, 0, W, H); ctx.lineWidth = 14; ctx.strokeStyle = '#fde047'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(300, 540); ctx.lineTo(260, 700); ctx.lineTo(320, 700); ctx.lineTo(240, 900); ctx.stroke(); }
    ground(ctx, W, H, 1000, '#365314', '#1a2e05');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) {
      const x = 40 + i * 125 + r * 60, y = 990 + r * 70, burn = clamp(spread * 3.2 - Math.abs(i - 2) * 0.28 - r * 0.15);
      bushyTree(ctx, x, y, 240 - r * 20, { seed: i + r * 9, leaf: mixc('#16a34a', '#57534e', burn), trunk: mixc('#92400e', '#292524', burn) });
      if (burn > 0.05 && burn < 0.97) flame(ctx, x, y - 110, 230 * Math.sin(Math.PI * burn) ** 0.6, t, i + r);
    }
    if (spread > 0) { ctx.save(); ctx.globalAlpha = 0.35 * spread; ctx.fillStyle = '#44403c'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(150 + i * 170, 700 - (t * 40 + i * 30) % 200, 90, 0, TAU); ctx.fill(); } ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? 'SE QUEMARÍAN A CADA RATO' : 'UN RAYO, UNA SELVA EN LLAMAS', { size: 38, fill: '#fdba74' });
  },

  oxido(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Una bici nueva que se llena de óxido en segundos.
    const c1 = cue(1), rust = ease((local - 0.4) / Math.max(1.2, c1 + 0.8));
    sky(ctx, W, 0, 1000, '#bae6fd', '#f0f9ff');
    for (let i = 0; i < 5; i++) kit.building(ctx, 110 + i * 215, 1000, 170, 280 + (i % 3) * 70, { color: hq.shade('#cbd5e1', -0.05 * i), lw: 5 });
    ground(ctx, W, H, 1000, '#9ca3af', '#4b5563');
    bike(ctx, 540, 960, 1.15, rust);
    if (local > c1) {
      const k = ease((local - c1) / 0.5);
      ctx.save(); ctx.globalAlpha = k;
      hq.card(ctx, 330, 460, 420, 220, '#fff7ed', 30);
      const g = ease((local - c1 - 0.3) / 1.2);
      ctx.beginPath(); ctx.arc(540, 570, 62, 0, TAU); ctx.fillStyle = mixc('#9ca3af', '#c2410c', g); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      for (let b = 0; b < 6; b++) { const a = (b / 6) * TAU + t, d = lerp(150, 60, ((t * 0.8 + b / 6) % 1)); ctx.beginPath(); ctx.arc(540 + Math.cos(a) * d, 570 + Math.sin(a) * d * 0.6, 14, 0, TAU); ctx.fillStyle = '#bae6fd'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'TODO SE OXIDARÍA MÁS RÁPIDO' : 'EL ÓXIDO: HIERRO CON OXÍGENO', { size: 38, fill: '#fdba74' });
  },

  libelulas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Pantano de hace 300 millones de años: helechos gigantes y una libélula del tamaño de una paloma.
    const c1 = cue(1), k = pop((local - c1 + 0.1) / 0.6);
    sky(ctx, W, 0, 1000, '#a7f3d0', '#ecfccb');
    sunDisc(ctx, 880, 520, 44, t);
    ctx.fillStyle = hq.vgrad(ctx, 0, 940, H, [[0, '#0f766e'], [1, '#134e4a']]); ctx.fillRect(0, 940, W, H);
    ctx.strokeStyle = 'rgba(204,251,241,0.6)'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 942 + 4 * Math.sin(x * 0.03 + t * 2)); ctx.stroke();
    // Helechos y «colas de caballo» gigantes.
    for (const [x, h] of [[90, 520], [980, 480], [250, 360], [820, 380]]) {
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(x, 960); ctx.lineTo(x + 10, 960 - h); ctx.stroke(); ctx.strokeStyle = '#4d7c0f'; ctx.lineWidth = 20; ctx.stroke();
      for (let i = 0; i < 6; i++) { const yy = 960 - h + i * 34; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + 10, yy); ctx.quadraticCurveTo(x + s * 90, yy - 30, x + s * 150, yy + 30 + i * 6); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#65a30d'; ctx.stroke(); } }
    }
    const dx = 520 + 120 * Math.sin(t * 0.8), dy = 680 + 40 * Math.sin(t * 1.7);
    dragonfly(ctx, dx, dy, 1.4, t);
    if (local > c1) {
      ctx.save(); ctx.translate(820, 640); ctx.scale(k, k); pigeon(ctx, 0, 0, 1.0, t); ctx.restore();
      if (k > 0.5) { hq.tag(ctx, 820, 760, 'PALOMA', { size: 28, fill: '#e2e8f0' }); hq.tag(ctx, dx + 40, dy + 150, 'LIBÉLULA', { size: 28, fill: '#5eead4' }); }
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'HACE 300 MILLONES DE AÑOS' : '¡LIBÉLULAS COMO PALOMAS!', { size: 40, fill: '#fde047' });
  },
};
