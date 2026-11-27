// Short 62: ¿y si el mar estuviera caliente como una tina?  (SERIE EL AGUA · 8)
// Gancho: el mar humea → los huracanes se vuelven monstruos (el agua caliente es su combustible) → los peces se ahogan
// (el agua caliente guarda menos oxígeno) y los corales se blanquean → la playa sería un baño de vapor → casi pasa: el
// golfo Pérsico pasa de 35 °C en verano; prueba: el refresco caliente pierde las burbujas más rápido.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, sea, sunDisc, cloud, fish, thermometer, puff, HERO } from '../../engine2d/props.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.06, vig: 0.3 });
  return {};
}

const HOT = { top: '#2dd4bf', bottom: '#b45309' };

function steam(ctx, x0, x1, y, t, a = 0.6, n = 6, hgt = 260) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const sx = lerp(x0, x1, (i + 0.5) / n); ctx.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10; ctx.lineTo(sx + 22 * Math.sin(u * 6 + t * 2.5 + i), y - u * hgt); } ctx.stroke(); }
  ctx.restore();
}

function bubbles(ctx, x0, x1, y0, y1, t, n, a = 1, r = 8) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) { const u = (t * 0.5 + i * 0.137) % 1, x = lerp(x0, x1, (i * 0.618) % 1) + 8 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.arc(x, lerp(y0, y1, u), r * (0.6 + (i % 3) * 0.3), 0, TAU); ctx.stroke(); }
  ctx.restore();
}

function coral(ctx, x, y, h, color, dead) {
  const c = mixc(color, '#f1f5f9', dead);
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  const br = (bx, by, a, len, w, d) => { if (d > 3) return; const x2 = bx + Math.cos(a) * len, y2 = by + Math.sin(a) * len; ctx.lineWidth = w + 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); br(x2, y2, a - 0.45, len * 0.72, w * 0.75, d + 1); br(x2, y2, a + 0.45, len * 0.72, w * 0.75, d + 1); };
  br(0, 0, -Math.PI / 2, h * 0.38, h * 0.12, 0);
  ctx.restore();
}

function glassSoda(ctx, x, y, w, h, t, fizz, { ice = false } = {}) {
  const top = y - h;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w * 0.42, y); ctx.lineTo(x + w * 0.42, y); ctx.lineTo(x + w / 2, top); ctx.closePath();
  ctx.fillStyle = 'rgba(241,245,249,0.5)'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(120,53,15,0.85)'; ctx.fillRect(x - w, top + h * 0.15, w * 2, h);
  if (ice) for (let i = 0; i < 3; i++) { hq.roundRectPath(ctx, x - 60 + i * 40, top + h * 0.18 + (i % 2) * 30, 52, 52, 10); ctx.fillStyle = 'rgba(224,242,254,0.85)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  bubbles(ctx, x - w * 0.35, x + w * 0.35, y - 10, top + h * 0.17, t * 2, Math.round(30 * fizz), 1, 6);
  ctx.restore();
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Playa: el mar humea; el termómetro sube a 40 °C; luego el protagonista se mete como en tina.
    const c1 = cue(1), heat = ease((local - 0.2) / 1.2);
    sky(ctx, W, 0, 940, '#7dd3fc', '#fef3c7');
    sunDisc(ctx, 880, 560, 60, t);
    sea(ctx, W, H, 940, t, { top: mixc('#38bdf8', HOT.top, heat), bottom: mixc('#0369a1', HOT.bottom, heat * 0.6) });
    steam(ctx, 60, 1020, 960, t, 0.55 * heat, 7);
    ctx.beginPath(); ctx.moveTo(0, 1300); ctx.quadraticCurveTo(500, 1240, W, 1340); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1240, H, [[0, '#fde68a'], [1, '#d97706']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    thermometer(ctx, 960, 1290, 300, lerp(0.35, 0.85, heat), '#ef4444');
    kit.text(ctx, `${Math.round(lerp(24, 40, heat))} °C`, 960, 940, { size: 54, fill: '#fecaca' });
    if (local < c1) hq.toon(ctx, 330, 1320, 380, { ...HERO, t, seed: 1, armL: [0.3, 0.2], armR: [0.3, 0.2], eyes: 'open', mouth: 'o', brows: 1, look: [1, 0.2] });
    else {
      // En el agua, relajado, con toalla en la cabeza.
      hq.toon(ctx, 500, 1130, 380, { ...HERO, t, seed: 1, armL: [2.3, -0.3], armR: [2.3, -0.3], eyes: 'happy', mouth: 'smile' });
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = mixc('#2dd4bf', '#0f766e', 0.3); ctx.fillRect(0, 1010, W, 300); ctx.restore();
      steam(ctx, 300, 700, 1010, t, 0.6, 4, 200);
      hq.bubble(ctx, 760, 640, 300, 96, 600, 780, '¡QUÉ RICO!', { size: 44 });
    }
  },

  huracanes(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Vista desde el espacio: mar rojo de calor y un huracán que crece; el vapor sube a alimentarlo.
    const c1 = cue(1), grow = ease((local - 0.2) / 2.4);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#dc2626'], [0.5, '#f97316'], [1, '#b91c1c']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.25; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse((i * 173) % W, 500 + (i * 211) % 1200, 220, 80, 0.3, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); } ctx.restore();
    // Tierra en la esquina.
    ctx.beginPath(); ctx.moveTo(0, 1400); ctx.quadraticCurveTo(300, 1300, 420, 1500); ctx.lineTo(380, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = '#65a30d'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // Huracán: brazos en espiral que giran.
    const cx = 600, cy = 860, R = 140 + 260 * grow, rot = t * 1.4;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-rot);
    for (let arm = 0; arm < 4; arm++) {
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const u = k / 60, a = arm * (TAU / 4) + u * 4.2, r = R * (0.12 + u); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.lineWidth = 70 * (0.5 + grow * 0.5); ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, TAU); ctx.fillStyle = '#b91c1c'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
    if (local > c1) {
      // Flechas de vapor caliente que suben del mar al huracán.
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, r0 = R + 140, x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 0.8, u = (t * 0.9 + i / 6) % 1, x = lerp(x0, cx + Math.cos(a) * R * 0.6, u), y = lerp(y0, cy + Math.sin(a) * R * 0.5, u); ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'HURACANES MONSTRUO' : 'SU GASOLINA: AGUA CALIENTE', { size: 44, fill: '#fde047' });
  },

  oxigeno(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1), dead = ease((local - c1) / 1.4);
    // Bajo el agua caliente: pocas burbujas de oxígeno; los peces suben a boquear; los corales se blanquean.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#5eead4'], [0.55, '#0f766e'], [1, '#78350f']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 560 + 6 * Math.sin(x * 0.02 + t * 2)); ctx.stroke();
    bubbles(ctx, 80, 1000, 1200, 580, t, 6, 0.9, 12);
    ctx.beginPath(); ctx.moveTo(0, 1220); ctx.quadraticCurveTo(540, 1150, W, 1220); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = '#a16207'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const C = [[120, '#f472b6'], [320, '#fb923c'], [520, '#a78bfa'], [720, '#f472b6'], [920, '#facc15']];
    C.forEach(([x, c], i) => coral(ctx, x, 1210, 260 + (i % 2) * 60, c, dead));
    // Peces boqueando en la superficie.
    for (let i = 0; i < 3; i++) {
      const x = 260 + i * 280, y = 620 + 10 * Math.sin(t * 4 + i);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-1.2); fish(ctx, 0, 0, 1.0, ['#38bdf8', '#facc15', '#a3e635'][i], { t, seed: i, sick: 0.1 * Math.sin(t + i) }); ctx.restore();
      if (local < c1) { ctx.beginPath(); ctx.arc(x + 20, y - 70 - ((t * 60 + i * 20) % 40), 8, 0, TAU); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke(); }
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'MENOS OXÍGENO' : 'CORALES BLANCOS', { size: 48, fill: local < c1 ? '#bae6fd' : '#f8fafc' });
  },

  playa(ctx, o) {
    const { W, H, local, t } = o;
    // Playa con bruma pesada: sudor y vapor; sensación de sauna.
    sky(ctx, W, 0, 940, '#fdba74', '#fef3c7');
    sunDisc(ctx, 860, 560, 60, t);
    sea(ctx, W, H, 940, t, HOT);
    steam(ctx, 40, 1040, 1000, t, 0.5, 9, 420);
    ctx.beginPath(); ctx.moveTo(0, 1240); ctx.quadraticCurveTo(500, 1190, W, 1260); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1190, H, [[0, '#fde68a'], [1, '#d97706']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.toon(ctx, 540, 1300, 420, { ...HERO, t, seed: 3, armL: [0.5, 0.4], armR: [1.4, -1.2], eyes: 'closed', mouth: 'o', brows: -1, blush: 1 });
    for (let i = 0; i < 5; i++) { const u = (t * 1.1 + i / 5) % 1; ctx.save(); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(470 + i * 35, 860 + u * 140, 9, 14, 0, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.25 * ease(local / 1.2); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore();
    hq.tag(ctx, 540, 410, 'UN BAÑO DE VAPOR', { size: 50, fill: '#fde68a' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // El golfo Pérsico: costa de desierto, mar caliente.
      sky(ctx, W, 0, 900, '#fbbf24', '#fef3c7');
      sunDisc(ctx, 860, 540, 70, t);
      for (const [x, w, h, c] of [[-80, 620, 160, '#f59e0b'], [440, 760, 130, '#d97706']]) { ctx.beginPath(); ctx.moveTo(x, 910); ctx.quadraticCurveTo(x + w / 2, 910 - h * 2, x + w, 910); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
      sea(ctx, W, H, 900, t, HOT);
      steam(ctx, 80, 1000, 930, t, 0.35, 6, 180);
      thermometer(ctx, 900, 1250, 300, 0.82, '#ef4444');
      kit.text(ctx, '+35 °C', 900, 900, { size: 60, fill: '#fecaca' });
      hq.tag(ctx, 540, 410, 'GOLFO PÉRSICO', { size: 52, fill: '#fde68a' });
      hq.tag(ctx, 540, 500, 'EL MAR MÁS CALIENTE', { size: 34, fill: '#ffffff' });
    } else {
      // La prueba: refresco frío vs. caliente.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#fef9c3'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = hq.vgrad(ctx, 0, 1080, H, [[0, '#a16207'], [1, '#713f12']]); ctx.fillRect(0, 1080, W, H - 1080); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1080); ctx.lineTo(W, 1080); ctx.stroke();
      const k = ease((local - c1) / 1.2);
      glassSoda(ctx, 300, 1080, 280, 420, t, 1, { ice: true });
      glassSoda(ctx, 780, 1080, 280, 420, t, lerp(0.6, 0.06, k));
      steam(ctx, 700, 860, 640, t, 0.5, 3, 120);
      kit.text(ctx, 'FRÍO', 300, 1410, { size: 54, fill: '#bae6fd' });
      kit.text(ctx, 'CALIENTE', 780, 1410, { size: 54, fill: '#fca5a5' });
      hq.tag(ctx, 540, 410, k < 0.5 ? 'PRUÉBALO EN CASA' : 'EL CALIENTE SE QUEDA SIN GAS', { size: 44, fill: '#fde047' });
    }
  },
};
