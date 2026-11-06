// Short 05: ¿Y si el Sol se apagara ahora mismo? Interruptor → 8 minutos de luz en camino → noche
// total → congelador → Antártida → mar helado con vida en el fondo → órbita alrededor del Sol apagado.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(260, C.W, C.H, 8); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }, a = 0.9) => { kit.gradientBG(ctx, W, H, '#03040f', '#0f0b2e'); kit.drawStars(ctx, stars, a, t); };

/** Termómetro vertical de +20 °C a −80 °C. */
function thermo(ctx, kit, x, yTop, h, temp) {
  const T0 = 20, T1 = -80, yOf = (T) => yTop + ((T0 - T) / (T0 - T1)) * h;
  kit.roundRect(ctx, x - 42, yTop - 50, 84, h + 90, 42); kit.shape(ctx, '#f8fafc', 8);
  ctx.beginPath(); ctx.arc(x, yTop + h + 70, 70, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 8);
  const col = temp > 0 ? '#ef4444' : '#38bdf8';
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, yTop + h + 70, 52, 0, Math.PI * 2); ctx.fill();
  const yl = yOf(temp);
  ctx.fillRect(x - 20, yl, 40, yTop + h + 40 - yl);
  for (let T = 20; T >= -80; T -= 20) {
    const y = yOf(T);
    ctx.fillStyle = kit.INK; ctx.fillRect(x + 42, y - 3, 30, 6);
    kit.text(ctx, `${T > 0 ? '+' : T < 0 ? '−' : ''}${Math.abs(T)}°`, x + 82, y, { size: 34, weight: 800, align: 'left', lw: 7 });
  }
}

/** Interruptor de pared: on 1 = arriba. */
function lightSwitch(ctx, kit, x, y, s, on) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  kit.roundRect(ctx, -80, -120, 160, 240, 26); kit.shape(ctx, '#f1f5f9', 8);
  kit.roundRect(ctx, -36, -70, 72, 140, 14); kit.shape(ctx, '#cbd5e1', 6);
  const ty = on ? -34 : 34;
  kit.roundRect(ctx, -30, ty - 34, 60, 68, 12); kit.shape(ctx, on ? '#facc15' : '#64748b', 6);
  ctx.restore();
}

function penguin(ctx, kit, x, y, h, t) {
  ctx.save(); ctx.translate(x + Math.sin(t * 60) * 3, y);
  for (const fx of [-0.16, 0.16]) { ctx.beginPath(); ctx.ellipse(fx * h, -4, h * 0.12, h * 0.05, 0, 0, Math.PI * 2); kit.shape(ctx, '#f59e0b', 5); }
  ctx.beginPath(); ctx.ellipse(0, -h * 0.45, h * 0.3, h * 0.45, 0, 0, Math.PI * 2); kit.shape(ctx, '#111827', 6);
  ctx.beginPath(); ctx.ellipse(0, -h * 0.38, h * 0.2, h * 0.34, 0, 0, Math.PI * 2); ctx.fillStyle = '#f8fafc'; ctx.fill();
  for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * h * 0.28, -h * 0.55); ctx.rotate(sx * (0.35 + Math.sin(t * 40) * 0.08)); ctx.beginPath(); ctx.ellipse(0, h * 0.16, h * 0.07, h * 0.2, 0, 0, Math.PI * 2); kit.shape(ctx, '#111827', 5); ctx.restore(); }
  ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(-h * 0.09, -h * 0.72, h * 0.05, 0, Math.PI * 2); ctx.arc(h * 0.09, -h * 0.72, h * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = kit.INK; ctx.beginPath(); ctx.arc(-h * 0.08, -h * 0.72, h * 0.025, 0, Math.PI * 2); ctx.arc(h * 0.08, -h * 0.72, h * 0.025, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-h * 0.06, -h * 0.64); ctx.lineTo(h * 0.06, -h * 0.64); ctx.lineTo(0, -h * 0.56); ctx.closePath(); kit.shape(ctx, '#f59e0b', 4);
  // Bufanda roja.
  kit.roundRect(ctx, -h * 0.26, -h * 0.6, h * 0.52, h * 0.08, h * 0.03); kit.shape(ctx, '#ef4444', 5);
  kit.roundRect(ctx, h * 0.1, -h * 0.56, h * 0.08, h * 0.22, h * 0.03); kit.shape(ctx, '#ef4444', 5);
  ctx.restore();
}

function snow(ctx, kit, W, y0, y1, t, n = 70, seed = 2) {
  const r = kit.rng(seed);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 120 + r() * 160, size = 3 + r() * 6, ph = r() * 10;
    const y = y0 + ((r() * (y1 - y0) + t * sp) % (y1 - y0));
    ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(x0 + Math.sin(t * 1.5 + ph) * 20, y, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function frostEdges(ctx, W, H, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.62);
  g.addColorStop(0, 'rgba(224,242,254,0)'); g.addColorStop(1, 'rgba(224,242,254,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    const off = cue(1) + 0.08, on = local < off ? 1 : 0;
    space(ctx, o, 0.5 + 0.5 * (1 - on));
    ctx.save();
    kit.shake(ctx, 18 * kit.impulse(local, off, 0.5), t);
    // Antes de apagarse, el Sol "late" un poco.
    kit.sun(ctx, W / 2, 720, 240 * (1 + 0.03 * Math.sin(t * 6) * on), { t, on });
    lightSwitch(ctx, kit, 860, 1020, 0.75, on);
    ctx.restore();
    kit.flash(ctx, W, H, 0.6 * kit.impulse(local, off, 0.12), '#000000');
  },

  luz(ctx, o) {
    const { W, kit, local, s, t } = o;
    space(ctx, o);
    const sx = 190, sy = 520, ex = 830, ey = 990, u = kit.clamp(local / (s.dur - 0.1));
    kit.sun(ctx, sx, sy, 120, { t, on: 0 });
    // La última luz: una franja que viaja del Sol (ya apagado) a la Tierra.
    const tx = sx + (ex - sx) * u, ty = sy + (ey - sy) * u;
    const ang = Math.atan2(ey - sy, ex - sx);
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
    const len = Math.hypot(ex - tx, ey - ty);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(253,224,71,0.25)'); g.addColorStop(0.15, 'rgba(253,224,71,0.85)'); g.addColorStop(1, 'rgba(253,224,71,0.9)');
    ctx.fillStyle = g; ctx.fillRect(0, -70, len, 140);
    ctx.restore();
    const lit = u < 0.98 ? 1 : 0;
    drawGlobe(ctx, ex, ey, 130, { lon0: -100 + t * 8, lat0: 12, night: lit ? 0 : 1, glow: lit === 1,
      extra: (c, R) => { if (!lit) { c.fillStyle = 'rgba(3,7,30,0.85)'; c.fillRect(-R, -R, 2 * R, 2 * R); } } });
    if (u < 0.9) {
      const mx = sx + (ex - sx) * (u + 1) / 2, my = sy + (ey - sy) * (u + 1) / 2;
      ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
      kit.text(ctx, 'ÚLTIMA LUZ', 0, -110, { size: 40, weight: 900, fill: '#fde68a' });
      ctx.restore();
    }
    // Cuenta regresiva: 8:20 (500 s) hasta 0:00, acelerada.
    const rem = Math.max(0, Math.round(500 * (1 - u)));
    kit.text(ctx, `${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`, W / 2, 300, { size: 150, fill: kit.YELLOW });
    kit.text(ctx, 'HASTA QUE LO NOTES', W / 2, 400, { size: 36, weight: 800 });
  },

  oscuro(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    const dark = local < 0.25 ? 0 : 1, gy = 1060;
    if (!dark) kit.gradientBG(ctx, W, H, '#38bdf8', '#bae6fd');
    else { kit.gradientBG(ctx, W, H, '#000000', '#0b1026'); kit.drawStars(ctx, stars, kit.ramp(local, 0.4, 1.2), t); }
    // Luna: brilla hasta que se apaga (su luz también era luz del Sol).
    const moonOn = local < cue(1) + 0.5 ? 1 : 0;
    if (dark && moonOn) { ctx.beginPath(); ctx.arc(820, 420, 80, 0, Math.PI * 2); kit.shape(ctx, '#f1f5f9', 6); ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.beginPath(); ctx.arc(795, 400, 16, 0, Math.PI * 2); ctx.arc(845, 445, 11, 0, Math.PI * 2); ctx.fill(); }
    else if (dark) { ctx.beginPath(); ctx.arc(820, 420, 80, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 4; ctx.stroke(); }
    if (!dark) kit.sun(ctx, 820, 420, 80, { t });
    ctx.fillStyle = dark ? '#0f172a' : '#5cb85c'; ctx.fillRect(0, gy, W, H - gy);
    const r = kit.rng(4);
    const blds = [[110, 170, 420], [290, 150, 560], [450, 140, 380], [610, 170, 620], [790, 150, 460], [960, 160, 520]];
    blds.forEach(([x, w, h], i) => {
      kit.building(ctx, x, gy, w, h, { color: dark ? '#1e293b' : ['#64748b', '#475569', '#94a3b8'][i % 3],
        lit: (j) => (dark && r() < 0.55 ? kit.ramp(local, 0.6 + (j % 7) * 0.05, 0.8 + (j % 7) * 0.05) : 0) });
    });
    if (dark) frostEdges(ctx, W, H, 0);
    kit.flash(ctx, W, H, 0.9 * kit.impulse(local, 0.25, 0.15), '#000000');
  },

  semana(ctx, o) {
    const { W, H, kit, local, cue, t, ease } = o;
    kit.gradientBG(ctx, W, H, '#0b1026', '#1e3a5f');
    kit.drawStars(ctx, stars, 0.4, t);
    const temp = 15 - 33 * ease.inOut(kit.ramp(local, 0.1, cue(1)));
    thermo(ctx, kit, 200, 480, 480, temp);
    // Congelador con la Tierra adentro.
    const k = kit.ramp(local, cue(1), cue(1) + 0.2);
    const fx = 470, fy = 470, fw = 470, fh = 640;
    kit.roundRect(ctx, fx, fy, fw, fh, 30); kit.shape(ctx, '#e2e8f0', 9);
    kit.roundRect(ctx, fx + 30, fy + 30, fw - 60, fh - 60, 18); kit.shape(ctx, '#bae6fd', 6);
    ctx.fillStyle = '#e0f2fe'; ctx.fillRect(fx + 30, fy + 360, fw - 60, 14);
    drawGlobe(ctx, fx + fw / 2, fy + 220, 140, { lon0: -100, lat0: 12, glow: false,
      extra: (c, R) => { c.fillStyle = `rgba(224,242,254,${0.55 * kit.ramp(local, 0.3, cue(1) + 0.4)})`; c.fillRect(-R, -R, 2 * R, 2 * R); } });
    // Carámbanos que crecen.
    for (let i = 0; i < 7; i++) {
      const x = fx + 60 + i * 58, L = (30 + (i % 3) * 18) * kit.ramp(local, 0.4 + i * 0.08, 1.2 + i * 0.08);
      ctx.beginPath(); ctx.moveTo(x - 12, fy + 30); ctx.lineTo(x + 12, fy + 30); ctx.lineTo(x, fy + 30 + L); ctx.closePath(); kit.shape(ctx, '#f0f9ff', 3);
    }
    kit.roundRect(ctx, fx + fw / 2 - 120, fy + 420, 240, 90, 16); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, `${temp < 0 ? '−' : '+'}${Math.abs(Math.round(temp))} °C`, fx + fw / 2, fy + 467, { size: 56, fill: '#7dd3fc', stroke: null });
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'CONGELADOR', fx + fw / 2, fy + 565, { size: 50 * (0.8 + 0.2 * k), fill: kit.YELLOW }); ctx.restore(); }
    frostEdges(ctx, W, H, kit.ramp(local, 0.2, cue(1) + 0.6));
  },

  anio(ctx, o) {
    const { W, H, kit, local, cue, t, ease } = o;
    kit.gradientBG(ctx, W, H, '#020617', '#1e293b');
    kit.drawStars(ctx, stars, 0.7, t);
    const gy = 1080;
    const blds = [[150, 170, 360], [330, 150, 500], [520, 170, 300], [700, 150, 440], [900, 180, 380]];
    blds.forEach(([x, w, h]) => {
      kit.building(ctx, x, gy, w, h, { color: '#334155', win: '#94a3b8', lit: () => 0 });
      kit.roundRect(ctx, x - w / 2 - 8, gy - h - 16, w + 16, 30, 12); kit.shape(ctx, '#f8fafc', 5);
      for (let i = 0; i < 4; i++) { const ix = x - w / 2 + 18 + i * (w - 36) / 3; ctx.beginPath(); ctx.moveTo(ix - 8, gy - h + 12); ctx.lineTo(ix + 8, gy - h + 12); ctx.lineTo(ix, gy - h + 50 + (i % 2) * 20); ctx.closePath(); kit.shape(ctx, '#e0f2fe', 3); }
    });
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, gy, W, H - gy);
    ctx.beginPath(); ctx.moveTo(0, gy); for (let x = 0; x <= W; x += 60) ctx.quadraticCurveTo(x + 30, gy - 30, x + 60, gy); ctx.lineTo(W, gy + 20); ctx.lineTo(0, gy + 20); ctx.fillStyle = '#f1f5f9'; ctx.fill();
    snow(ctx, kit, W, 300, gy, t);
    const temp = -18 - 55 * ease.inOut(kit.ramp(local, 0.05, cue(0) + 0.9));
    kit.roundRect(ctx, 70, 440, 300, 120, 24); kit.shape(ctx, 'rgba(15,23,42,0.85)', 6);
    kit.text(ctx, `−${Math.abs(Math.round(temp))} °C`, 220, 500, { size: 76, fill: '#7dd3fc' });
    const k = kit.ramp(local, cue(1), cue(1) + 0.25);
    if (k > 0) penguin(ctx, kit, 760, gy + 40 - 0 * k, 320 * (0.7 + 0.3 * k), t);
    frostEdges(ctx, W, H, 0.9);
  },

  mar(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Corte del océano: hielo arriba, agua líquida abajo, chimenea volcánica en el fondo.
    const zoom = 1 + 0.35 * o.ease.inOut(kit.ramp(local, cue(1), cue(2) + 0.3));
    ctx.save();
    ctx.translate(700, 1020); ctx.scale(zoom, zoom); ctx.translate(-700, -1020);
    ctx.fillStyle = '#020617'; ctx.fillRect(-200, -200, W + 400, 600);
    kit.drawStars(ctx, stars.slice(0, 60), 0.8, t);
    const g = ctx.createLinearGradient(0, 520, 0, 1120);
    g.addColorStop(0, '#1e40af'); g.addColorStop(1, '#0b1a4a');
    ctx.fillStyle = g; ctx.fillRect(-200, 400, W + 400, 760);
    const iceH = 60 + 90 * kit.ramp(local, 0, cue(1));
    ctx.fillStyle = '#e0f2fe'; ctx.fillRect(-200, 400, W + 400, iceH);
    ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) { const x = 90 + i * 180; ctx.beginPath(); ctx.moveTo(x, 400); ctx.lineTo(x + 30, 400 + iceH * 0.5); ctx.lineTo(x + 10, 400 + iceH); ctx.stroke(); }
    kit.text(ctx, 'HIELO', 160, 400 + iceH / 2, { size: 40, weight: 900, fill: '#0369a1', stroke: null });
    kit.text(ctx, 'AGUA LÍQUIDA', 230, 680, { size: 40, weight: 900, fill: '#bfdbfe', stroke: null });
    // Fondo marino y chimenea.
    ctx.beginPath(); ctx.moveTo(-200, 1120); for (let x = -200; x <= W + 200; x += 80) ctx.lineTo(x, 1100 + Math.sin(x * 0.03) * 14); ctx.lineTo(W + 200, H + 200); ctx.lineTo(-200, H + 200); ctx.closePath(); kit.shape(ctx, '#3f2a1d', 6);
    ctx.beginPath(); ctx.moveTo(640, 1110); ctx.lineTo(670, 940); ctx.lineTo(730, 940); ctx.lineTo(760, 1110); ctx.closePath(); kit.shape(ctx, '#57534e', 6);
    // Pluma caliente: burbujas oscuras con brillo naranja.
    const glow = ctx.createRadialGradient(700, 930, 10, 700, 930, 160);
    glow.addColorStop(0, 'rgba(251,146,60,0.9)'); glow.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(700, 930, 160, 0, Math.PI * 2); ctx.fill();
    const r = kit.rng(12);
    for (let i = 0; i < 16; i++) {
      const ph = (t * 0.6 + r()) % 1, x = 700 + Math.sin(ph * 6 + i) * (20 + ph * 60), y = 930 - ph * 360;
      ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(x, y, 14 + ph * 26, 0, Math.PI * 2); ctx.fillStyle = '#44403c'; ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Gusanos de tubo (viven del calor y los químicos de la chimenea, sin luz del Sol).
    const wk = kit.ramp(local, cue(2) - 0.2, cue(2) + 0.2);
    for (let i = 0; i < 7; i++) {
      const x = 560 + i * 26 + (i > 3 ? 160 : 0), h = (60 + (i % 3) * 30) * (0.3 + 0.7 * wk), sway = Math.sin(t * 2 + i) * 6;
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, 1110); ctx.quadraticCurveTo(x, 1110 - h / 2, x + sway, 1110 - h); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + sway, 1110 - h, 13, 0, Math.PI * 2); kit.shape(ctx, '#ef4444', 4);
    }
    // Un pez que nada.
    const fxp = ((t * 120) % (W + 300)) - 150;
    ctx.save(); ctx.translate(fxp, 820);
    ctx.beginPath(); ctx.ellipse(0, 0, 50, 26, 0, 0, Math.PI * 2); kit.shape(ctx, '#fbbf24', 5);
    ctx.beginPath(); ctx.moveTo(-45, 0); ctx.lineTo(-80, -25); ctx.lineTo(-80, 25); ctx.closePath(); kit.shape(ctx, '#fbbf24', 5);
    ctx.fillStyle = kit.INK; ctx.beginPath(); ctx.arc(26, -6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  },

  orbita(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    const cx = W / 2, cy = 780, rx = 400, ry = 170;
    ctx.save(); ctx.setLineDash([18, 16]); ctx.strokeStyle = 'rgba(148,163,184,0.7)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const a = 0.6 + t * 0.5, ex = cx + Math.cos(a) * rx, ey = cy + Math.sin(a) * ry;
    const front = Math.sin(a) > 0;
    const earth = () => drawGlobe(ctx, ex, ey, 62, { lon0: -t * 60, lat0: 12, glow: false, ocean: '#94a3b8', land: '#e2e8f0', outline: 5,
      extra: (c, R) => { c.fillStyle = 'rgba(2,6,23,0.35)'; c.fillRect(-R, -R, 2 * R, 2 * R); } });
    if (!front) earth();
    kit.sun(ctx, cx, cy, 120, { t, on: 0 });
    if (front) earth();
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'SIGUE EN ÓRBITA', W / 2, 330, { size: 92 * (0.8 + 0.2 * k), fill: kit.YELLOW }); ctx.restore(); }
    kit.text(ctx, 'SOL APAGADO', cx, cy + 245, { size: 34, weight: 800, fill: '#94a3b8' });
  },
};
