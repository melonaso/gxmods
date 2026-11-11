// Short 19: ¿y si hoy cayera el asteroide de los dinosaurios?
// Asteroide sobre una ciudad → 10 km (más que el Everest) a 20 km/s → cayó en Yucatán: cráter de
// ~180 km → miles de millones de bombas de Hiroshima → tsunami de 1.5 km y roca ardiendo → años sin
// Sol: 3 de cada 4 especies → uno cada ~100 millones de años → DART (2022) cambió una órbita.
import { drawGlobe, project } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 19); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#1e1b4b'); kit.drawStars(ctx, stars, 0.85, t); };

/** Asteroide rocoso de radio r (forma irregular fija según seed). */
function asteroid(ctx, kit, x, y, r, rot = 0, seed = 3) {
  const R = kit.rng(seed);
  const bumps = Array.from({ length: 14 }, () => 0.86 + R() * 0.2);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  bumps.forEach((b, i) => { const a = (i / bumps.length) * TAU; ctx.lineTo(Math.cos(a) * r * b, Math.sin(a) * r * b); });
  ctx.closePath(); kit.shape(ctx, '#78716c', Math.max(3, r * 0.04));
  for (let i = 0; i < 5; i++) {
    const a = R() * TAU, d = R() * r * 0.55, cr = r * (0.1 + R() * 0.12);
    ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, cr, 0, TAU); ctx.fillStyle = '#57534e'; ctx.fill();
    ctx.beginPath(); ctx.arc(Math.cos(a) * d - cr * 0.2, Math.sin(a) * d - cr * 0.2, cr * 0.7, 0, TAU); ctx.fillStyle = '#a8a29e'; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** Estela de fuego detrás de un objeto que viaja en dirección ang (radianes). */
function fireTrail(ctx, x, y, r, ang, len, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, 'rgba(255,237,160,0.95)'); g.addColorStop(0.25, 'rgba(251,146,60,0.85)'); g.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, -r * 1.05);
  for (let i = 0; i <= 10; i++) { const u = i / 10; ctx.lineTo(len * u, -r * (1.05 - 0.9 * u) + Math.sin(t * 18 + i) * r * 0.08); }
  for (let i = 10; i >= 0; i--) { const u = i / 10; ctx.lineTo(len * u, r * (1.05 - 0.9 * u) + Math.cos(t * 16 + i) * r * 0.08); }
  ctx.closePath(); ctx.fill();
  const glow = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.6);
  glow.addColorStop(0, 'rgba(253,186,116,0.7)'); glow.addColorStop(1, 'rgba(253,186,116,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, TAU); ctx.fill();
  ctx.restore();
}

/** T. rex de perfil mirando a la derecha (flip = -1 a la izquierda); pies en (x, y), alto s. */
function dino(ctx, kit, x, y, s, col = '#22c55e', flip = 1) {
  const P = [[-1.0, -0.55], [-0.55, -0.72], [-0.2, -0.8], [0.08, -0.86], [0.2, -1.0], [0.55, -1.0], [0.66, -0.93], [0.66, -0.84], [0.42, -0.8], [0.52, -0.74], [0.3, -0.7],
    [0.26, -0.55], [0.4, -0.5], [0.42, -0.43], [0.36, -0.44], [0.24, -0.46], [0.18, -0.34], [0.2, -0.04], [0.32, 0], [0.04, 0], [0.04, -0.24], [-0.12, -0.26], [-0.1, -0.04], [0.0, 0],
    [-0.28, 0], [-0.3, -0.3], [-0.5, -0.42]];
  ctx.save(); ctx.translate(x, y); ctx.scale(flip * s, s);
  ctx.beginPath(); P.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6 / s; ctx.lineJoin = 'round'; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0.42, -0.92, 0.035, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
  ctx.restore();
}

/** Ratoncito (mamífero) con los pies en (x, y), largo s. */
function mouse(ctx, kit, x, y, s, col = '#a16207') {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.15); ctx.quadraticCurveTo(-s * 0.8, -s * 0.05, -s * 0.85, -s * 0.35); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -s * 0.22, s * 0.48, s * 0.24, 0, 0, TAU); kit.shape(ctx, col, 5);
  ctx.beginPath(); ctx.ellipse(s * 0.42, -s * 0.3, s * 0.2, s * 0.15, 0.2, 0, TAU); kit.shape(ctx, col, 5);
  ctx.beginPath(); ctx.arc(s * 0.36, -s * 0.48, s * 0.11, 0, TAU); kit.shape(ctx, '#fda4af', 4);
  ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.33, s * 0.03, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
  ctx.restore();
}

/** Hongo de explosión con la base en (x, y), alto s. */
function mushroom(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  kit.roundRect(ctx, -s * 0.12, -s * 0.62, s * 0.24, s * 0.62, s * 0.05); kit.shape(ctx, '#d6d3d1', Math.max(2, s * 0.04));
  ctx.beginPath(); ctx.ellipse(0, -s * 0.72, s * 0.42, s * 0.26, 0, 0, TAU); kit.shape(ctx, '#fb923c', Math.max(2, s * 0.04));
  ctx.beginPath(); ctx.ellipse(0, -s * 0.66, s * 0.3, s * 0.1, 0, 0, TAU); ctx.fillStyle = '#fde68a'; ctx.fill();
  ctx.restore();
}

/** Monte Everest con la base centrada en (x, y), alto h. */
function mountain(ctx, kit, x, y, h) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-h * 0.62, 0); ctx.lineTo(-h * 0.1, -h * 0.92); ctx.lineTo(0, -h); ctx.lineTo(h * 0.16, -h * 0.84); ctx.lineTo(h * 0.62, 0); ctx.closePath(); kit.shape(ctx, '#64748b', 6);
  ctx.beginPath(); ctx.moveTo(-h * 0.24, -h * 0.66); ctx.lineTo(-h * 0.1, -h * 0.92); ctx.lineTo(0, -h); ctx.lineTo(h * 0.16, -h * 0.84); ctx.lineTo(h * 0.3, -h * 0.62); ctx.lineTo(h * 0.12, -h * 0.7); ctx.lineTo(0, -h * 0.6); ctx.lineTo(-h * 0.12, -h * 0.7); ctx.closePath(); kit.shape(ctx, '#f8fafc', 5);
  ctx.restore();
}

/** Línea de rascacielos sobre el suelo (y = base). */
function skyline(ctx, kit, W, y, { lit = 1, color = '#334155' } = {}) {
  const R = kit.rng(4);
  for (let x = 30; x < W; ) {
    const w = 90 + R() * 70, h = 160 + R() * 260;
    kit.building(ctx, x + w / 2, y, w, h, { color, lit: () => lit });
    x += w + 8;
  }
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Cielo de atardecer, ciudad y un T. rex que mira hacia arriba; el asteroide baja y explota.
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#f97316');
    const P = Math.max(0.6, cue(1) + 0.3), k = kit.clamp(local / P);
    const ax = 880 - 340 * k, ay = 620 + 420 * k * k, ar = 105 + 45 * k;
    ctx.save(); if (local > P) kit.shake(ctx, 26 * kit.impulse(local, P, 0.9), t);
    ctx.fillStyle = '#292524'; ctx.fillRect(0, 1080, W, H - 1080);
    skyline(ctx, kit, W, 1085, { lit: 1 });
    dino(ctx, kit, 170, 1085, 230, '#16a34a', 1);
    if (local < P) { fireTrail(ctx, ax, ay, ar, Math.atan2(420 * 2 * k + 60, -340), 420, t); asteroid(ctx, kit, ax, ay, ar, t * 2); }
    else {
      const u = kit.clamp((local - P) / 1.4), rr = 120 + 1100 * o.ease.out(u);
      const g = ctx.createRadialGradient(ax, 1080, 0, ax, 1080, rr);
      g.addColorStop(0, 'rgba(255,251,235,1)'); g.addColorStop(0.35, 'rgba(253,186,116,0.95)'); g.addColorStop(0.7, 'rgba(239,68,68,0.75)'); g.addColorStop(1, 'rgba(127,29,29,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, 1080, rr, Math.PI, TAU); ctx.fill();
    }
    ctx.restore();
    kit.flash(ctx, W, H, 0.9 * kit.impulse(local, P, 0.35), '#ffffff');
  },

  tamano(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0c4a6e', '#7dd3fc');
    // A la misma escala (50 px por km): el Everest (8.8 km) junto al asteroide (10 km).
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (q > 0) kit.speedLines(ctx, W, 480, 1060, t, { n: 22, speed: 3200, color: `rgba(255,255,255,${0.6 * q})` });
    ctx.fillStyle = '#e0f2fe'; ctx.fillRect(0, 1070, W, 20);
    mountain(ctx, kit, 250, 1070, 440);
    kit.text(ctx, '8.8 km', 250, 590, { size: 46, fill: '#ffffff' });
    const shk = q * 6 * Math.sin(t * 40);
    if (q > 0) fireTrail(ctx, 780 + shk, 820, 250, 0, 330 * q, t);
    asteroid(ctx, kit, 780 + shk, 820, 250, t * 0.3, 7);
    // Cota de 10 km.
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1050, 570); ctx.lineTo(1050, 1070); ctx.moveTo(1035, 570); ctx.lineTo(1065, 570); ctx.moveTo(1035, 1070); ctx.lineTo(1065, 1070); ctx.stroke();
    kit.text(ctx, '10 km', 780, 820, { size: 72, fill: '#ffffff' });
    if (q < 0.5) {
      kit.text(ctx, '10 KM DE ANCHO', W / 2, 230, { size: 96, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'MÁS QUE EL EVEREST', W / 2, 335, { size: 52, fill: '#fde68a' });
    } else {
      kit.text(ctx, '20 KM POR SEGUNDO', W / 2, 230, { size: 88, fill: kit.YELLOW, maxW: W * 0.92 });
      kit.text(ctx, '= 72,000 KM/H', W / 2, 340, { size: 56, fill: '#ffffff' });
    }
  },

  mexico(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // Globo centrado en México; el asteroide cae en Yucatán y aparece el cráter.
    const cx = W / 2, cy = 780, R = 420, lon0 = -95 + 3 * kit.ramp(local, 0, 3), lat0 = 20;
    drawGlobe(ctx, cx, cy, R, { lon0, lat0, northCap: false });
    const [px, py] = project(-89.5, 21.3, lon0, lat0, R), X = cx + px, Y = cy + py;
    const P = cue(1);
    if (local < P) {
      const k = kit.clamp(local / P), sx = X + 420 * (1 - k), sy = Y - 520 * (1 - k);
      fireTrail(ctx, sx, sy, 22, Math.atan2(520, -420), 160, t); asteroid(ctx, kit, sx, sy, 22, t * 3, 2);
    } else {
      const u = kit.ramp(local, P, P + 0.6);
      ctx.save(); ctx.globalAlpha = 1 - 0.5 * u; ctx.beginPath(); ctx.arc(X, Y, 20 + 80 * u, 0, TAU); ctx.fillStyle = 'rgba(253,186,116,0.6)'; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(X, Y, 34, 0, TAU); ctx.lineWidth = 8; ctx.strokeStyle = '#ef4444'; ctx.stroke();
      ctx.beginPath(); ctx.arc(X, Y, 12, 0, TAU); ctx.fillStyle = '#7f1d1d'; ctx.fill();
      ctx.save(); ctx.globalAlpha = u;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(X + 30, Y - 30); ctx.lineTo(X + 170, Y - 170); ctx.stroke();
      kit.text(ctx, 'CHICXULUB', X + 180, Y - 200, { size: 46, fill: '#ffffff', align: 'left', maxW: W - X - 200 });
      ctx.restore();
    }
    const q = kit.ramp(local, P, P + 0.3);
    if (q < 0.5) kit.text(ctx, '¡CAYÓ EN MÉXICO!', W / 2, 230, { size: 96, fill: kit.YELLOW, maxW: W * 0.92 });
    else {
      kit.text(ctx, 'CRÁTER DE 180 KM', W / 2, 230, { size: 92, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'YUCATÁN, HACE 66 MILLONES DE AÑOS', W / 2, 335, { size: 44, fill: '#fde68a', maxW: W * 0.92 });
    }
    void H;
  },

  energia(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#450a0a', '#1c1917');
    // Primero una bomba; luego la cuadrícula se llena de hongos y el contador sube a ~4,400 millones.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (q < 1) { ctx.save(); ctx.globalAlpha = 1 - q; mushroom(ctx, kit, W / 2, 1040, 520); ctx.restore(); }
    if (q > 0) {
      const k = kit.ramp(local, cue(1), cue(1) + 1.6), n = Math.floor(k * 80);
      for (let i = 0; i < n; i++) {
        const c = i % 10, r = Math.floor(i / 10);
        mushroom(ctx, kit, 75 + c * 103, 560 + r * 66 + 50, 70 + 4 * Math.sin(t * 6 + i));
      }
      kit.flash(ctx, W, H, 0.35 * kit.impulse(local, cue(1), 0.4), '#fed7aa');
    }
    if (q < 0.5) {
      kit.text(ctx, '1 BOMBA DE HIROSHIMA', W / 2, 230, { size: 80, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, '15 KILOTONES', W / 2, 335, { size: 52, fill: '#fdba74' });
    } else {
      const v = 4400 * o.ease.out(kit.ramp(local, cue(1), cue(1) + 1.6));
      kit.text(ctx, `≈ ${kit.nf(Math.round(v / 100) * 100)} MILLONES`, W / 2, 230, { size: 92, fill: kit.YELLOW, maxW: W * 0.92 });
      kit.text(ctx, 'DE BOMBAS COMO ESA', W / 2, 340, { size: 52, fill: '#ffffff' });
    }
  },

  tsunami(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7c2d12', '#fdba74');
    // Ola de 1.5 km junto al edificio más alto del mundo (828 m), a escala: 400 px por km.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (q > 0) {
      const r = kit.rng(8);
      for (let i = 0; i < 14; i++) {
        const x = r() * W, sp = 0.5 + r() * 0.5, u = ((local - cue(1)) * sp + r()) % 1, y = 420 + u * 700;
        ctx.save(); ctx.globalAlpha = q; fireTrail(ctx, x - u * 200, y, 14, Math.atan2(700, -200), 120, t); ctx.beginPath(); ctx.arc(x - u * 200, y, 14, 0, TAU); kit.shape(ctx, '#57534e', 3); ctx.restore();
      }
    }
    ctx.fillStyle = '#44403c'; ctx.fillRect(0, 1070, W, H - 1070);
    // Edificio de 828 m → 331 px.
    ctx.save(); ctx.translate(860, 1070);
    ctx.beginPath(); ctx.moveTo(-45, 0); ctx.lineTo(-30, -150); ctx.lineTo(-18, -250); ctx.lineTo(-8, -300); ctx.lineTo(0, -331); ctx.lineTo(8, -300); ctx.lineTo(18, -250); ctx.lineTo(30, -150); ctx.lineTo(45, 0); ctx.closePath(); kit.shape(ctx, '#cbd5e1', 5);
    ctx.restore();
    kit.text(ctx, '828 m', 860, 700, { size: 40, fill: '#ffffff' });
    // Ola de 1.5 km → 600 px, avanzando.
    const front = 520 + 60 * kit.ramp(local, 0, 3) + 10 * Math.sin(t * 3);
    ctx.beginPath(); ctx.moveTo(-20, 1070); ctx.lineTo(-20, 470);
    ctx.bezierCurveTo(200, 430, front - 40, 440, front + 40, 520);
    ctx.bezierCurveTo(front + 90, 580, front + 20, 640, front - 30, 600);
    ctx.bezierCurveTo(front + 30, 760, front + 140, 960, front + 200, 1070); ctx.closePath();
    const g = ctx.createLinearGradient(0, 470, 0, 1070); g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = kit.INK; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(60, 480); ctx.bezierCurveTo(240, 455, front - 60, 460, front + 20, 520); ctx.stroke();
    kit.text(ctx, '1.5 km', 250, 560, { size: 56, fill: '#ffffff' });
    if (q < 0.5) {
      kit.text(ctx, 'OLA DE 1.5 KM', W / 2, 230, { size: 100, fill: '#ffffff' });
      kit.text(ctx, 'CASI 2 VECES EL EDIFICIO MÁS ALTO', W / 2, 335, { size: 44, fill: '#fde68a', maxW: W * 0.92 });
    } else {
      kit.text(ctx, 'LLUVIA DE ROCA', W / 2, 230, { size: 100, fill: '#fde68a' });
      kit.text(ctx, 'ARDIENDO EN TODO EL PLANETA', W / 2, 335, { size: 48, fill: '#ffffff', maxW: W * 0.92 });
    }
  },

  invierno(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // El cielo se oscurece y el Sol se apaga tras el polvo; 3 de 4 especies desaparecen (sobrevive el ratón).
    const d = kit.ramp(local, 0, 1.5);
    kit.gradientBG(ctx, W, H, '#44403c', '#78716c');
    ctx.save(); ctx.globalAlpha = d * 0.55; ctx.fillStyle = '#0c0a09'; ctx.fillRect(0, 0, W, H); ctx.restore();
    kit.sun(ctx, 820, 560, 70, { t, on: 1 - 0.85 * d });
    const r = kit.rng(12);
    for (let i = 0; i < 60; i++) { const x = (r() * W + local * 40 * (0.5 + r())) % W, y = 420 + ((r() * 660 + local * 30) % 660); ctx.fillStyle = 'rgba(214,211,209,0.5)'; ctx.fillRect(x, y, 5, 5); }
    ctx.fillStyle = '#292524'; ctx.fillRect(0, 1070, W, H - 1070);
    const q = kit.ramp(local, cue(1), cue(1) + 0.5);
    const gone = (col) => (q > 0.5 ? '#57534e' : col);
    const items = [[150, 210, '#16a34a', 1], [420, 170, '#0ea5e9', -1], [660, 140, '#eab308', 1]];
    items.forEach(([x, s, col, f], i) => {
      ctx.save(); ctx.globalAlpha = 1 - 0.55 * q; dino(ctx, kit, x, 1070, s, gone(col), f); ctx.restore();
      if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 60, 1070 - s * 0.9); ctx.lineTo(x + 60, 1070 - s * 0.2); ctx.moveTo(x + 60, 1070 - s * 0.9); ctx.lineTo(x - 60, 1070 - s * 0.2); ctx.stroke(); ctx.restore(); void i; }
    });
    mouse(ctx, kit, 900, 1070, 120 * (1 + 0.15 * q));
    if (q > 0.5) kit.text(ctx, 'SOBREVIVIÓ', 900, 900, { size: 40, fill: '#4ade80' });
    if (q < 0.5) {
      kit.text(ctx, 'AÑOS SIN SOL', W / 2, 230, { size: 104, fill: '#ffffff' });
      kit.text(ctx, 'EL POLVO TAPA LA LUZ', W / 2, 335, { size: 50, fill: '#d6d3d1' });
    } else {
      kit.text(ctx, '3 DE CADA 4', W / 2, 230, { size: 110, fill: '#fca5a5' });
      kit.text(ctx, 'ESPECIES SE EXTINGUIERON', W / 2, 340, { size: 52, fill: '#ffffff', maxW: W * 0.92 });
    }
  },

  cada(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#064e3b', '#10b981');
    // Línea del tiempo: el último cayó hace 66 millones de años; en promedio, uno cada ~100 millones.
    const y = 790, x0 = 100, x1 = 980, k = kit.ramp(local, 0.1, 1.4);
    kit.roundRect(ctx, x0, y - 14, (x1 - x0) * k, 28, 14); kit.shape(ctx, '#ffffff', 5);
    dino(ctx, kit, x0 + 40, y - 60, 120, '#16a34a', 1);
    asteroid(ctx, kit, x0 + 40, y - 270, 40, t, 5);
    kit.text(ctx, 'HACE 66', x0 + 40, y + 70, { size: 44, fill: '#ffffff' });
    kit.text(ctx, 'MILLONES', x0 + 40, y + 120, { size: 36, fill: '#d1fae5' });
    if (k > 0.95) {
      kit.person(ctx, x1 - 40, y - 30, 190, { shirt: '#f97316', arms: 0.15 + 0.1 * Math.sin(t * 4) });
      kit.text(ctx, 'HOY', x1 - 40, y + 70, { size: 48, fill: '#ffffff' });
    }
    kit.text(ctx, '1 CADA 100 MILLONES', W / 2, 230, { size: 84, fill: kit.YELLOW, maxW: W * 0.92 });
    kit.text(ctx, 'DE AÑOS, MÁS O MENOS', W / 2, 335, { size: 52, fill: '#ffffff' });
    void H;
  },

  dart(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // Didymos (grande) con su lunita Dimorphos; la nave DART la golpea y la vuelta se acorta.
    const cx = W / 2, cy = 780, P = cue(1) + 0.1;
    const hit = local >= P, shrink = kit.ramp(local, P, P + 0.8);
    const rx = 330 - 40 * shrink, ry = 110 - 12 * shrink;
    ctx.save(); ctx.setLineDash([14, 12]); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, 330, 110, 0, 0, TAU); ctx.stroke();
    if (shrink > 0) { ctx.strokeStyle = 'rgba(250,204,21,0.9)'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // La luna está en la posición del choque (abajo a la izquierda) justo en P.
    const w = 1.1, aHit = 2.3, a = aHit + (local - P) * w * (hit ? 1.15 : 1);
    const mx = cx + Math.cos(a) * rx, my = cy + Math.sin(a) * ry, front = Math.sin(a) > 0;
    if (!front) asteroid(ctx, kit, mx, my, 42, t, 9);
    asteroid(ctx, kit, cx, cy, 150, t * 0.2, 4);
    if (front) asteroid(ctx, kit, mx, my, 42, t, 9);
    kit.text(ctx, 'DIDYMOS', cx, cy - 190, { size: 40, fill: '#e2e8f0' });
    if (!hit) {
      const k = kit.clamp(local / P), sx = mx - 520 * (1 - k), sy = my + 300 * (1 - k);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.atan2(-300, 520));
      kit.roundRect(ctx, -26, -18, 52, 36, 6); kit.shape(ctx, '#e5e7eb', 4);
      for (const s of [-1, 1]) { ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-20, s * 22 + (s < 0 ? -40 : 0), 40, 40); ctx.strokeStyle = kit.INK; ctx.lineWidth = 3; ctx.strokeRect(-20, s * 22 + (s < 0 ? -40 : 0), 40, 40); }
      ctx.restore();
      kit.text(ctx, 'DART', sx, sy + 70, { size: 36, fill: '#fde68a' });
    } else {
      const u = kit.clamp((local - P) / 0.5);
      if (u < 1) { ctx.save(); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(mx, my, 40 + 120 * u, 0, TAU); ctx.fillStyle = '#fde68a'; ctx.fill(); ctx.restore(); }
      if (shrink > 0.5) kit.text(ctx, '−32 MIN', cx + 230, cy + 190, { size: 64, fill: kit.YELLOW });
    }
    if (local < P + 0.3) {
      kit.text(ctx, 'MISIÓN DART · 2022', W / 2, 230, { size: 84, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'UNA NAVE CONTRA UN ASTEROIDE', W / 2, 335, { size: 46, fill: '#bae6fd', maxW: W * 0.92 });
    } else {
      kit.text(ctx, '¡LO DESVIAMOS!', W / 2, 230, { size: 100, fill: '#4ade80' });
      kit.text(ctx, 'SU VUELTA SE ACORTÓ 32 MIN', W / 2, 335, { size: 48, fill: '#ffffff', maxW: W * 0.92 });
    }
    void H;
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    drawGlobe(ctx, W / 2, 820, 300, { lon0: -95 + t * 6, lat0: 20 });
    const k = kit.clamp(local / 2.2), ax = -100 + 1300 * k, ay = 520 + 80 * k;
    fireTrail(ctx, ax, ay, 40, 0.06, 220, t); asteroid(ctx, kit, ax, ay, 40, t * 2, 2);
    kit.text(ctx, '¡PASÓ DE LARGO!', W / 2, 260, { size: 92, fill: kit.YELLOW, maxW: W * 0.92 });
  },
};
