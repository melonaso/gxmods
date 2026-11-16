// Short 35: ¿y si el Sol nos lanzara una tormenta gigante?
// Pregunta al inicio (¿nos quedaríamos sin luz?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// El Sol escupe una nube de gas eléctrico → llega en 1–2 días → el escudo magnético la manda a los polos (auroras)
// → la sacudida mete corriente en los cables: transformadores quemados y apagón → sin internet ni GPS →
// 1989: Quebec, 6 millones sin luz en 90 segundos → 1859: auroras tan brillantes que unos mineros se
// levantaron a desayunar creyendo que ya era de día.

import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(170, C.W, C.H, 35); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const FLOOR = 1090;

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.8)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

function space(ctx, o) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, '#020617', '#0f172a');
  kit.drawStars(ctx, stars, 1, t);
}

/** Nube de gas eléctrico (eyección del Sol): burbuja brillante con partículas. */
function cme(ctx, kit, x, y, r, t, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, 'rgba(253,224,71,0.15)'); g.addColorStop(0.75, 'rgba(249,115,22,0.45)'); g.addColorStop(1, 'rgba(236,72,153,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(253,186,116,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r * 0.8, -1.2, 1.2); ctx.stroke();
  const R = kit.rng(5);
  for (let i = 0; i < 40; i++) { const an = R() * TAU, d = r * (0.3 + 0.6 * R()), w = 1 + 0.4 * Math.sin(t * 6 + i); ctx.fillStyle = R() > 0.5 ? '#fde047' : '#f472b6'; ctx.beginPath(); ctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, 4 * w, 0, TAU); ctx.fill(); }
  ctx.restore();
}

/** Torre de alta tensión con la base en (x, y). */
function tower(ctx, kit, x, y, h) {
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - h * 0.22, y); ctx.lineTo(x - h * 0.06, y - h); ctx.lineTo(x + h * 0.06, y - h); ctx.lineTo(x + h * 0.22, y);
  ctx.moveTo(x - h * 0.17, y - h * 0.25); ctx.lineTo(x + h * 0.12, y - h * 0.55); ctx.moveTo(x + h * 0.17, y - h * 0.25); ctx.lineTo(x - h * 0.12, y - h * 0.55);
  ctx.moveTo(x - h * 0.3, y - h * 0.82); ctx.lineTo(x + h * 0.3, y - h * 0.82); ctx.moveTo(x - h * 0.22, y - h * 0.65); ctx.lineTo(x + h * 0.22, y - h * 0.65);
  ctx.stroke();
}

function spark(ctx, x, y, s, t, seed = 0) {
  ctx.save(); ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 7 + seed, l = s * (0.6 + 0.4 * Math.sin(t * 13 + i + seed)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, s * 0.25, 0, TAU); ctx.fill(); ctx.restore();
}

/** Cortinas de aurora ondulando sobre el cielo. */
function aurora(ctx, o, a = 1, y0 = 420, y1 = 860) {
  const { W, t } = o;
  if (a <= 0) return;
  ctx.save();
  const cols = [['74,222,128', 0], ['167,139,250', 1.7], ['244,114,182', 3.1]];
  for (const [c, ph] of cols) {
    for (let x = 0; x < W; x += 14) {
      const top = y0 + 60 * Math.sin(x * 0.006 + t * 0.9 + ph) + 30 * Math.sin(x * 0.017 - t * 1.4);
      const g = ctx.createLinearGradient(0, top, 0, y1);
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.35, `rgba(${c},${0.55 * a})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.fillRect(x, top, 14, y1 - top);
    }
  }
  ctx.restore();
}

/** Silueta de ciudad; lit 0..1 ventanas encendidas. */
function skyline(ctx, kit, y, lit, seed = 2) {
  const R = kit.rng(seed);
  for (let x = -20; x < 1100;) {
    const w = 90 + R() * 80, h = 140 + R() * 260;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(x, y - h, w, h);
    for (let wy = y - h + 20; wy < y - 20; wy += 40) for (let wx = x + 14; wx < x + w - 20; wx += 30) { ctx.fillStyle = R() < 0.7 * lit ? '#fde68a' : '#1e293b'; ctx.fillRect(wx, wy, 14, 20); }
    x += w + 6;
  }
}

function phone(ctx, kit, x, y, h, noSignal = 0) {
  kit.roundRect(ctx, x - h * 0.25, y - h / 2, h * 0.5, h, h * 0.06); kit.shape(ctx, '#111827', 6);
  kit.roundRect(ctx, x - h * 0.21, y - h * 0.44, h * 0.42, h * 0.84, h * 0.03); ctx.fillStyle = '#1e3a8a'; ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = noSignal > 0.5 ? '#475569' : '#ffffff'; ctx.fillRect(x - h * 0.16 + i * h * 0.05, y - h * 0.36 - i * h * 0.025, h * 0.03, h * 0.03 + i * h * 0.025); }
  if (noSignal > 0.5) {
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - h * 0.18, y - h * 0.42); ctx.lineTo(x + h * 0.02, y - h * 0.28); ctx.stroke();
    kit.text(ctx, 'SIN', x, y - h * 0.02, { size: h * 0.12, fill: '#fca5a5', stroke: null });
    kit.text(ctx, 'SEÑAL', x, y + h * 0.12, { size: h * 0.1, fill: '#fca5a5', stroke: null });
  } else kit.text(ctx, '12:00', x, y, { size: h * 0.11, fill: '#ffffff', stroke: null });
}

function satellite(ctx, kit, x, y, s, rot, broken = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  kit.roundRect(ctx, -s * 0.25, -s * 0.2, s * 0.5, s * 0.4, 6); kit.shape(ctx, '#e5e7eb', 4);
  for (const sg of [-1, 1]) { kit.roundRect(ctx, sg > 0 ? s * 0.3 : -s * 0.95, -s * 0.15, s * 0.65, s * 0.3, 4); kit.shape(ctx, '#1d4ed8', 4); }
  ctx.restore();
  if (broken > 0) spark(ctx, x, y - s * 0.25, s * 0.5, t, 2);
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, t } = o;
    // El Sol estalla y lanza una nube gigante directo a la Tierra.
    space(ctx, o);
    kit.sun(ctx, -120, 820, 440, { t });
    const u = kit.ramp(local, 0, 3.6);
    ctx.save(); ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(250, 700, 120 + 30 * Math.sin(t * 3), Math.PI * 1.1, Math.PI * 1.95); ctx.stroke(); ctx.restore();
    cme(ctx, kit, 330 + 470 * u, 760 - 20 * u, 160 + 140 * u, t);
    drawGlobe(ctx, 960, 760, 80, { lon0: -90 + t * 20, lat0: 15 });
    void W;
  },

  viaje(ctx, o) {
    const { W, kit, local, cue, t } = o;
    // La nube viaja por el espacio; un calendario cuenta los días.
    space(ctx, o);
    kit.sun(ctx, -260, 760, 380, { t });
    const u = kit.ramp(local, 0.1, o.s.dur);
    cme(ctx, kit, 250 + 560 * u, 760, 200, t);
    drawGlobe(ctx, 960, 760, 90, { lon0: -90 + t * 20, lat0: 15 });
    kit.roundRect(ctx, 720, 960, 240, 180, 20); kit.shape(ctx, '#ffffff', 6);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(724, 964, 232, 46);
    const days = local < cue(1) ? 0 : (u < 0.75 ? 1 : 2);
    kit.text(ctx, 'DÍA', 840, 988, { size: 30, fill: '#ffffff', stroke: null });
    kit.text(ctx, `${days}`, 840, 1075, { size: 90, fill: '#0f172a', stroke: null });
    label(ctx, kit, 420, 470, 'GAS ELÉCTRICO', { size: 46, fill: '#fdba74' });
    void W;
  },

  auroras(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    if (local < cue(1)) {
      // El escudo magnético: líneas que rodean la Tierra y mandan las partículas a los polos.
      space(ctx, o);
      const cx = 600, cy = 760, R = 150;
      ctx.strokeStyle = 'rgba(96,165,250,0.75)'; ctx.lineWidth = 5;
      for (const k of [1.6, 2.2, 2.9]) for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sg * R * k * 0.55, cy, R * k * 0.6, R * k * 0.8, 0, 0, TAU); ctx.stroke(); }
      const r = kit.rng(9);
      for (let i = 0; i < 30; i++) {
        const ph = (t * 0.6 + r()) % 1, yy = cy + (r() - 0.5) * 600, top = yy < cy;
        let x, y;
        if (ph < 0.55) { x = -20 + ph / 0.55 * (cx - R * 1.9); y = yy; }
        else { const q = (ph - 0.55) / 0.45; x = cx - R * 1.9 + q * R * 1.9; y = yy + (cy + (top ? -R : R) * 0.92 - yy) * q; }
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
      }
      drawGlobe(ctx, cx, cy, R, { lon0: -90 + t * 20, lat0: 15 });
      for (const sg of [-1, 1]) { ctx.fillStyle = 'rgba(74,222,128,0.8)'; ctx.beginPath(); ctx.ellipse(cx, cy + sg * R * 0.9, R * 0.45, R * 0.12, 0, 0, TAU); ctx.fill(); }
      label(ctx, kit, 540, 430, 'ESCUDO MAGNÉTICO', { size: 46, fill: '#93c5fd' });
      return;
    }
    // Cielo de noche lleno de auroras sobre un pueblo.
    kit.gradientBG(ctx, W, H, '#020617', '#1e1b4b');
    kit.drawStars(ctx, stars, 0.7, t);
    aurora(ctx, o, kit.ramp(local, cue(1), cue(1) + 0.5));
    ctx.fillStyle = '#0b1324'; ctx.beginPath(); ctx.moveTo(0, 980); ctx.lineTo(260, 860); ctx.lineTo(520, 960); ctx.lineTo(800, 840); ctx.lineTo(W, 950); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    kit.house(ctx, 300, FLOOR, 220, 200, { lit: 1 });
    kit.person(ctx, 640, FLOOR, 260, { shirt: '#f97316', arms: 0.6 });
    ctx.fillStyle = '#14532d'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    label(ctx, kit, 540, 430, '¡AURORAS!', { size: 52, fill: '#86efac' });
  },

  cables(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Torres de alta tensión: la corriente extra corre por los cables, el transformador revienta y se va la luz.
    const out = local > cue(1) + 0.5;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e293b');
    aurora(ctx, o, 0.6, 380, 700);
    skyline(ctx, kit, FLOOR, out ? 0 : 1);
    const xs = [120, 540, 960];
    for (const x of xs) tower(ctx, kit, x, 980, 420);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
    for (const dy of [0.82, 0.65]) { ctx.beginPath(); for (let i = 0; i < xs.length - 1; i++) { const y = 980 - 420 * dy; ctx.moveTo(xs[i], y); ctx.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, y + 60, xs[i + 1], y); } ctx.stroke(); }
    // Pulsos de corriente que corren por el cable.
    const surge = kit.ramp(local, 0.6, 1.4);
    if (surge > 0 && !out) for (let i = 0; i < 4; i++) { const u = (t * 0.9 + i / 4) % 1, x = 120 + u * 840, mid = (x < 540 ? (x - 120) / 420 : (x - 540) / 420), y = 980 - 420 * 0.82 + 60 * 4 * mid * (1 - mid) * 0.5 * 2; spark(ctx, x, y, 26 * surge, t, i); }
    // Transformador.
    const bx = 760, by = FLOOR;
    kit.roundRect(ctx, bx - 90, by - 170, 180, 170, 12); kit.shape(ctx, '#64748b', 6);
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(bx, by - 140); ctx.lineTo(bx - 30, by - 80); ctx.lineTo(bx + 30, by - 80); ctx.closePath(); ctx.fill();
    const boom = kit.impulse(local, cue(1) + 0.5, 0.8);
    if (boom > 0) { ctx.fillStyle = `rgba(254,240,138,${boom})`; ctx.beginPath(); ctx.arc(bx, by - 120, 60 + 200 * (1 - boom), 0, TAU); ctx.fill(); }
    if (out) { ctx.fillStyle = 'rgba(71,85,105,0.7)'; for (let i = 0; i < 4; i++) { const u = (t * 0.5 + i / 4) % 1; ctx.beginPath(); ctx.arc(bx + 20 * Math.sin(i + t), by - 200 - u * 300, 30 + u * 40, 0, TAU); ctx.fill(); } }
    label(ctx, kit, 540, 430, out ? '¡APAGÓN!' : 'CORRIENTE EN LOS CABLES', { size: out ? 56 : 44, fill: out ? '#fca5a5' : '#fde047' });
  },

  internet(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Cuarto a oscuras: el satélite echa chispas por la ventana y el celular no tiene señal.
    kit.gradientBG(ctx, W, H, '#111827', '#030712');
    kit.roundRect(ctx, 600, 430, 380, 330, 14); kit.shape(ctx, '#0f172a', 8);
    ctx.save(); ctx.beginPath(); ctx.rect(606, 436, 368, 318); ctx.clip(); kit.drawStars(ctx, stars, 0.9, t); satellite(ctx, kit, 790, 590, 130, 0.3 + 0.2 * Math.sin(t), 1, t); ctx.restore();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(790, 430); ctx.lineTo(790, 760); ctx.moveTo(600, 595); ctx.lineTo(980, 595); ctx.stroke();
    kit.person(ctx, 330, FLOOR, 420, { shirt: '#64748b', arms: 0.35 });
    const ns = local > cue(1) + 0.2 ? 1 : 0;
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.moveTo(450, 770); ctx.lineTo(300, 1090); ctx.lineTo(560, 1090); ctx.closePath(); ctx.fill(); ctx.restore();
    phone(ctx, kit, 460, 760, 190, ns);
    label(ctx, kit, 540, 1040, 'SIN INTERNET · SIN GPS', { size: 44, fill: '#fca5a5' });
    void W; void H;
  },

  quebec(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // 1989, Canadá en invierno: la ciudad se apaga en 90 segundos.
    kit.gradientBG(ctx, W, H, '#0b1026', '#1e3a8a');
    kit.drawStars(ctx, stars, 0.6, t);
    aurora(ctx, o, 0.5, 380, 650);
    const T0 = cue(1) - 0.3, k = kit.ramp(local, T0, T0 + 1.0);
    skyline(ctx, kit, FLOOR, 1 - k, 7);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    const r = kit.rng(3); ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) { const x = (r() * W + t * 20) % W, y = 380 + ((r() * 760 + t * 90 * (0.5 + r())) % 760); ctx.beginPath(); ctx.arc(x, y, 3 + r() * 3, 0, TAU); ctx.fill(); }
    const secs = Math.min(90, Math.round(90 * kit.ramp(local, 0.2, T0 + 1.0)));
    kit.roundRect(ctx, 720, 480, 280, 150, 24); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 860, 560, { size: 76, fill: secs >= 90 ? '#fca5a5' : '#fde047', stroke: null });
    label(ctx, kit, 330, 450, '1989 · CANADÁ', { size: 44, fill: '#ffffff' });
    if (k >= 1) label(ctx, kit, 540, 1040, '6 MILLONES SIN LUZ', { size: 50, fill: '#fca5a5' });
  },

  carrington(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // 1859, campamento minero en las montañas: el cielo brilla tanto que parece de día.
    const glow = kit.ramp(local, 0, 1.2);
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#7f1d1d');
    kit.drawStars(ctx, stars, 0.4, t);
    aurora(ctx, o, 1, 380, 900);
    ctx.save(); ctx.globalAlpha = 0.25 * glow; ctx.fillStyle = '#fecaca'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.fillStyle = '#1c1917'; ctx.beginPath(); ctx.moveTo(0, 900); ctx.lineTo(220, 700); ctx.lineTo(420, 880); ctx.lineTo(700, 640); ctx.lineTo(W, 900); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f2a1d'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    // Tienda de campaña.
    ctx.beginPath(); ctx.moveTo(90, FLOOR); ctx.lineTo(250, 860); ctx.lineTo(410, FLOOR); ctx.closePath(); kit.shape(ctx, '#d6d3d1', 6);
    ctx.beginPath(); ctx.moveTo(220, FLOOR); ctx.lineTo(250, 920); ctx.lineTo(280, FLOOR); ctx.closePath(); ctx.fillStyle = '#292524'; ctx.fill();
    // Fogata con sartén y cafetera.
    const fx = 700;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#f97316', '#facc15', '#ef4444'][i]; ctx.beginPath(); ctx.moveTo(fx - 40 + i * 25, FLOOR); ctx.quadraticCurveTo(fx - 30 + i * 25, FLOOR - 60 - 15 * Math.sin(t * 8 + i), fx - 10 + i * 25, FLOOR); ctx.fill(); }
    kit.roundRect(ctx, fx - 70, FLOOR - 70, 110, 22, 8); kit.shape(ctx, '#111827', 4); ctx.fillStyle = '#111827'; ctx.fillRect(fx + 38, FLOOR - 64, 70, 10);
    ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.ellipse(fx - 15, FLOOR - 74, 22, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(fx - 15, FLOOR - 76, 7, 0, TAU); ctx.fill();
    kit.person(ctx, 520, FLOOR, 300, { shirt: '#b45309', pants: '#1e3a8a', arms: local > cue(1) ? 0.3 : 0.05 });
    kit.person(ctx, 890, FLOOR, 280, { shirt: '#4d7c0f', pants: '#1e3a8a', arms: 0.55 });
    label(ctx, kit, 300, 450, '1859', { size: 52, fill: '#fde047' });
    if (local > cue(1)) {
      kit.roundRect(ctx, 600, 470, 360, 120, 30); kit.shape(ctx, '#ffffff', 6);
      ctx.beginPath(); ctx.moveTo(700, 588); ctx.lineTo(660, 650); ctx.lineTo(760, 588); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
      kit.text(ctx, '¿YA AMANECIÓ?', 780, 532, { size: 42, fill: '#0f172a', stroke: null });
    }
  },
};
