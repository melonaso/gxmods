// Short 40: ¿y si el café no te diera energía?  (calidad alta: engine2d/hq.js)
// Gancho: el café te engaña; ¿por qué te despierta? y, al final, por qué las plantas lo inventaron.
// Adenosina = sustancia del sueño que se junta → la cafeína tiene casi su forma y bloquea su lugar (tapa el cansancio)
// → ¿sueño de golpe? la adenosina se siguió juntando y entra toda junta → el café de la tarde: en ~5 h solo se va la
// mitad → sorpresa: las plantas la hicieron como veneno para insectos, pero a las abejas les ayuda a recordar la flor.
import * as hq from '../../engine2d/hq.js';

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
const FLOOR = 1060;
const ME = { skin: '#e0ac69', hair: '#1f2937', shirt: '#7c3aed', pants: '#1f2937', iris: '#3f2a1d' };
const ADE = '#a78bfa', CAF = '#92400e';
const clamp = (x) => Math.max(0, Math.min(1, x));

/** Taza con café y vapor; (x, y) = base. */
function mug(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 3; i++) { const u = (t * 0.6 + i / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - u)})`; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.2 + i * s * 0.2, -s * 1.05 - u * s * 0.6); ctx.bezierCurveTo(-s * 0.35 + i * s * 0.2, -s * 1.25 - u * s * 0.6, -s * 0.05 + i * s * 0.2, -s * 1.35 - u * s * 0.6, -s * 0.2 + i * s * 0.2, -s * 1.55 - u * s * 0.6); ctx.stroke(); }
  ctx.lineWidth = Math.max(4, s * 0.06); ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.5, s * 0.25, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = s * 0.12; ctx.stroke(); ctx.lineWidth = s * 0.06; ctx.strokeStyle = '#f8fafc'; ctx.stroke();
  hq.roundRectPath(ctx, -s * 0.5, -s * 0.95, s, s * 0.95, s * 0.15); ctx.fillStyle = hq.vgrad(ctx, 0, -s, 0, [[0, '#ffffff'], [1, '#e2e8f0']]); ctx.fill(); ctx.lineWidth = Math.max(4, s * 0.06); ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -s * 0.9, s * 0.44, s * 0.08, 0, 0, TAU); ctx.fillStyle = '#78350f'; ctx.fill();
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -s * 0.45, s * 0.12, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Molécula dibujada como llave (cabeza redonda, vástago y dientes). */
function key(ctx, x, y, s, color, rot = 0, label = '') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.lineWidth = Math.max(3, s * 0.08); ctx.strokeStyle = INK; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -s * 0.55, s * 0.35, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -s * 0.55, s * 0.13, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  hq.roundRectPath(ctx, -s * 0.1, -s * 0.25, s * 0.2, s * 0.8, s * 0.06); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  ctx.fillRect(s * 0.08, s * 0.25, s * 0.18, s * 0.1); ctx.strokeRect(s * 0.08, s * 0.25, s * 0.18, s * 0.1);
  ctx.fillRect(s * 0.08, s * 0.42, s * 0.12, s * 0.1); ctx.strokeRect(s * 0.08, s * 0.42, s * 0.12, s * 0.1);
  if (label) { ctx.font = `900 ${Math.round(s * 0.3)}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText(label, 0, -s * 0.55); }
  ctx.restore();
}

/** Membrana de la neurona con 4 cerraduras (receptores). Devuelve las posiciones de las cerraduras. */
function membrane(ctx, W, y, t) {
  ctx.fillStyle = hq.vgrad(ctx, 0, y - 40, y + 300, [[0, '#f9a8d4'], [1, '#be185d']]);
  ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + 12 * Math.sin(x * 0.012 + t)); ctx.lineTo(W, y + 400); ctx.lineTo(0, y + 400); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  const locks = [180, 420, 660, 900].map((x) => [x, y + 12 * Math.sin(x * 0.012 + t)]);
  for (const [x, ly] of locks) { hq.roundRectPath(ctx, x - 45, ly - 10, 90, 110, 20); ctx.fillStyle = '#fbcfe8'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#831843'; hq.roundRectPath(ctx, x - 18, ly - 10, 36, 70, 10); ctx.fill(); }
  return locks;
}

/** Medidor de sueño (barra con Zzz). */
function sleepMeter(ctx, x, y, w, lvl) {
  hq.card(ctx, x, y, w, 110, 'rgba(15,23,42,0.9)', 26);
  ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#c4b5fd'; ctx.fillText('SUEÑO', x + 24, y + 55);
  hq.roundRectPath(ctx, x + 150, y + 38, w - 180, 34, 17); ctx.fillStyle = '#334155'; ctx.fill();
  hq.roundRectPath(ctx, x + 150, y + 38, Math.max(34, (w - 180) * lvl), 34, 17); ctx.fillStyle = hq.vgrad(ctx, 0, y + 38, y + 72, [[0, '#c4b5fd'], [1, '#7c3aed']]); ctx.fill();
}

function bee(ctx, x, y, s, t, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const flap = Math.sin(t * 40);
  for (const k of [-1, 1]) { ctx.save(); ctx.rotate(-0.3 + 0.25 * flap * k); ctx.beginPath(); ctx.ellipse(-s * 0.05, -s * 0.45, s * 0.22, s * 0.32, k * 0.3, 0, TAU); ctx.fillStyle = 'rgba(224,242,254,0.85)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.33, 0, 0, TAU); ctx.fillStyle = '#facc15'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = INK; for (const bx of [-0.25, 0, 0.25]) ctx.fillRect(bx * s - s * 0.06, -s, s * 0.12, s * 2); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.33, 0, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.05, s * 0.22, 0, TAU); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.1, s * 0.06, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

function beetle(ctx, x, y, s, dead = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(dead * Math.PI);
  ctx.strokeStyle = INK; ctx.lineWidth = 4; for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(k * s * 0.25, 0); ctx.lineTo(k * s * 0.35, s * 0.45); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.36, 0, Math.PI, TAU); ctx.lineTo(s * 0.5, s * 0.05); ctx.lineTo(-s * 0.5, s * 0.05); ctx.closePath(); ctx.fillStyle = '#16a34a'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.05, s * 0.18, 0, TAU); ctx.fillStyle = '#14532d'; ctx.fill(); ctx.stroke();
  if (dead > 0.5) { ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.1); ctx.lineTo(s * 0.62, s * 0.02); ctx.moveTo(s * 0.62, -s * 0.1); ctx.lineTo(s * 0.5, s * 0.02); ctx.stroke(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, t } = o;
    // Cocina en la mañana: medio dormido, con la taza en la mano.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#fff7ed'], [1, '#fed7aa']]); ctx.fillRect(0, 0, W, FLOOR);
    hq.card(ctx, 90, 430, 330, 300, hq.vgrad(ctx, 0, 430, 730, [[0, '#fdba74'], [1, '#fde68a']]), 18);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(255, 700, 70, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(255, 430); ctx.lineTo(255, 730); ctx.moveTo(90, 580); ctx.lineTo(420, 580); ctx.stroke();
    ctx.fillStyle = hq.vgrad(ctx, 0, 820, 860, [[0, '#a16207'], [1, '#854d0e']]); ctx.fillRect(0, 830, W, 40);
    hq.roundRectPath(ctx, 720, 760, 200, 80, 16); ctx.fillStyle = '#334155'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#e7e5e4'], [1, '#a8a29e']]); ctx.fillRect(0, FLOOR - 40, W, H);
    hq.toon(ctx, 560, FLOOR, 640, { ...ME, t, eyes: 'bored', mouth: 'flat', brows: -0.4, look: [0.3, 0.5], armL: [0.15, 0.1], armR: [0.45, -1.75],
      hold: (c, h) => mug(c, h.R[0] + 20, h.R[1] + 40, 85, t) });
    for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - u; ctx.font = `900 ${44 + i * 12}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeText('Z', 420 - i * 40 - u * 30, 470 - u * 110); ctx.fillStyle = '#c4b5fd'; ctx.fillText('Z', 420 - i * 40 - u * 30, 470 - u * 110); ctx.restore(); }
  },

  adenosina(ctx, o) {
    const { W, H, local, t } = o;
    // Dentro del cerebro: llaves moradas (adenosina) llegan y encajan en las cerraduras; el sueño sube.
    const bg = ctx.createRadialGradient(540, 600, 60, 540, 700, 1000); bg.addColorStop(0, '#312e81'); bg.addColorStop(1, '#0b0620'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 900, t, { n: 12, seed: 4, color: 'rgba(196,181,253,A)', a: 0.2 });
    const locks = membrane(ctx, W, 860, t);
    const k = clamp(local / (o.s.dur - 0.5));
    locks.forEach(([x, y], i) => {
      const u = clamp(k * 1.6 - i * 0.18), kx = x + (1 - u) * (i % 2 ? 120 : -120), ky = y - 40 - (1 - u) * 330;
      key(ctx, kx, ky, 120, ADE, (1 - u) * (i % 2 ? 0.8 : -0.8));
    });
    for (let i = 0; i < 5; i++) { const ph = (t * 0.25 + i / 5) % 1; key(ctx, 120 + i * 210, 470 + 60 * Math.sin(t + i), 70, ADE, ph * TAU); }
    sleepMeter(ctx, 240, 560, 600, 0.15 + 0.85 * k);
    hq.tag(ctx, 540, 420, 'ADENOSINA: LA SUSTANCIA DEL SUEÑO', { size: 34, fill: '#c4b5fd' });
  },

  bloqueo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La cafeína (llaves cafés) ocupa las cerraduras; las moradas rebotan y el sueño baja.
    const bg = ctx.createRadialGradient(540, 600, 60, 540, 700, 1000); bg.addColorStop(0, '#451a03'); bg.addColorStop(1, '#0c0a09'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 900, t, { n: 12, seed: 6, color: 'rgba(253,186,116,A)', a: 0.2 });
    const locks = membrane(ctx, W, 860, t);
    const k = clamp(local / 1.6);
    locks.forEach(([x, y], i) => {
      const u = clamp(k * 1.5 - i * 0.15), kx = x + (1 - u) * (i % 2 ? 160 : -160), ky = y - 40 - (1 - u) * 350;
      key(ctx, kx, ky, 120, CAF, (1 - u) * (i % 2 ? -0.9 : 0.9));
      const b = local > 0.5 + i * 0.2 ? clamp((local - 0.5 - i * 0.2) / 0.8) : 0;
      if (b > 0) key(ctx, x + (i % 2 ? 1 : -1) * 90 * b, y - 150 - 220 * b, 80, ADE, b * 3 * (i % 2 ? 1 : -1));
    });
    const blocked = local > cue(1);
    sleepMeter(ctx, 240, 560, 600, blocked ? 0.9 - 0.75 * clamp((local - cue(1)) / 0.6) : 0.9);
    hq.tag(ctx, 540, 420, blocked ? 'NO DA ENERGÍA: TAPA EL CANSANCIO' : 'CAFEÍNA: CASI LA MISMA FORMA', { size: 34, fill: '#fdba74' });
  },

  bajon(ctx, o) {
    const { W, H, local, cue, t } = o;
    // En la oficina: detrás de la «compuerta» se acumula la adenosina; cuando la cafeína se va, cae de golpe.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#f1f5f9'], [1, '#cbd5e1']]); ctx.fillRect(0, 0, W, FLOOR);
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#94a3b8'], [1, '#64748b']]); ctx.fillRect(0, FLOOR - 40, W, H);
    const crashT = cue(1) + 2.0, crash = clamp((local - crashT) / 0.5), asleep = local > crashT;
    // Depósito con llaves moradas y compuerta café.
    hq.card(ctx, 600, 420, 400, 330, 'rgba(255,255,255,0.75)', 26);
    const fill = clamp(local / crashT);
    const R = (i) => Math.sin(i * 91.7) * 0.5 + 0.5;
    const n = Math.floor(6 + 16 * fill);
    for (let i = 0; i < n; i++) {
      let kx = 640 + R(i) * 320, ky = 720 - R(i + 9) * 260 * fill;
      if (asleep) { kx += (220 - kx + 640) * 0 + crash * (R(i + 3) * 200 - 500); ky += crash * (200 + R(i + 5) * 150); }
      key(ctx, kx, ky, 58, ADE, R(i + 2) * 6 + t * 0.3);
    }
    if (!asleep) { hq.roundRectPath(ctx, 590, 730, 420, 44, 12); ctx.fillStyle = CAF; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.font = '900 26px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fde68a'; ctx.fillText('CAFEÍNA', 800, 753); }
    // Escritorio con computadora y la persona.
    hq.roundRectPath(ctx, 120, 880, 560, 40, 12); ctx.fillStyle = '#a16207'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, 420, 740, 200, 130, 12); ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.stroke();
    ctx.save(); if (asleep) { ctx.translate(300, FLOOR); ctx.rotate(0.25 * crash); ctx.translate(-300, -FLOOR); }
    hq.toon(ctx, 300, FLOOR, 560, { ...ME, t, eyes: asleep ? 'closed' : 'open', mouth: asleep ? 'o' : 'smile', tilt: asleep ? 0.5 * crash : 0, armL: [0.3, -1.4], armR: [0.4, -1.5] });
    ctx.restore();
    if (asleep) for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - u; ctx.font = `900 ${44 + i * 12}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeText('Z', 420 + i * 40, 520 - u * 110); ctx.fillStyle = '#c4b5fd'; ctx.fillText('Z', 420 + i * 40, 520 - u * 110); ctx.restore(); }
    hq.tag(ctx, 800, 405, asleep ? '¡ENTRA TODA JUNTA!' : 'SE SIGUE JUNTANDO…', { size: 34, fill: asleep ? '#fca5a5' : '#c4b5fd' });
  },

  noche: function (ctx, o) {
    const { W, H, local, cue, t } = o;
    // En la cama a las 10 de la noche, con los ojos bien abiertos; la mitad de la cafeína sigue ahí.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#1e1b4b'], [1, '#0f172a']]); ctx.fillRect(0, 0, W, H);
    hq.card(ctx, 700, 430, 280, 230, hq.vgrad(ctx, 0, 430, 660, [[0, '#0b1026'], [1, '#312e81']]), 18);
    ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(860, 520, 40, 0, TAU); ctx.fill(); ctx.fillStyle = '#1e1b4b'; ctx.beginPath(); ctx.arc(880, 506, 36, 0, TAU); ctx.fill();
    // Cama y persona acostada (cabeza a la izquierda).
    hq.roundRectPath(ctx, 80, 860, 720, 60, 18); ctx.fillStyle = '#7c2d12'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, 60, 720, 50, 260, 20); ctx.fillStyle = '#7c2d12'; ctx.fill(); ctx.stroke();
    hq.roundRectPath(ctx, 120, 760, 190, 100, 40); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(820, 820); ctx.rotate(-Math.PI / 2);
    hq.toon(ctx, 0, 0, 640, { ...ME, t, eyes: 'wide', mouth: 'flat', breathe: false, look: [0.6, 0], armL: [0.1, 0], armR: [0.1, 0] });
    ctx.restore();
    hq.roundRectPath(ctx, 300, 790, 500, 110, 40); ctx.fillStyle = hq.vgrad(ctx, 0, 790, 900, [[0, '#6366f1'], [1, '#4338ca']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // Medidor de cafeína: 5 de la tarde → 10 de la noche, se queda a la mitad.
    const u = clamp(local / Math.max(1, cue(1)));
    hq.card(ctx, 90, 430, 560, 220, 'rgba(15,23,42,0.92)', 26);
    ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fdba74'; ctx.fillText('CAFEÍNA EN TU CUERPO', 120, 475);
    hq.roundRectPath(ctx, 120, 510, 500, 46, 23); ctx.fillStyle = '#334155'; ctx.fill();
    hq.roundRectPath(ctx, 120, 510, 500 * (1 - 0.5 * u), 46, 23); ctx.fillStyle = hq.vgrad(ctx, 0, 510, 556, [[0, '#d97706'], [1, '#92400e']]); ctx.fill();
    const hour = Math.round(17 + 5 * u), shown = hour > 12 ? hour - 12 : hour;
    ctx.font = '900 40px Inter, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.fillText(`${shown}:00 PM`, 120, 610);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fde047'; ctx.fillText(`${Math.round(100 - 50 * u)} %`, 620, 610);
    if (local > cue(1)) hq.tag(ctx, 540, 712, 'NO TE PUEDES DORMIR', { size: 44, fill: '#fca5a5' });
  },

  plantas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // En el jardín: la planta de café con flores; un insecto que la muerde cae, y las abejas vuelven a la flor.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#bae6fd'], [1, '#dcfce7']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#4ade80'], [1, '#16a34a']]); ctx.fillRect(0, 1000, W, H);
    // Rama con hojas, flores blancas y granos rojos.
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, 980); ctx.quadraticCurveTo(400, 780, 1100, 720); ctx.stroke();
    for (let i = 0; i < 7; i++) { const x = 80 + i * 150, y = 900 - i * 28; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6 + (i % 2) * 1.2 + 0.05 * Math.sin(t + i)); ctx.beginPath(); ctx.ellipse(0, -60, 34, 70, 0, 0, TAU); ctx.fillStyle = i % 2 ? '#15803d' : '#16a34a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    for (const [x, y] of [[300, 850], [520, 800], [760, 760]]) { ctx.fillStyle = '#dc2626'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + k * 26 - 26, y + 30, 18, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); } }
    const fx = 640, fy = 640;
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 46, fy + Math.sin(a) * 46, 40, 20, a, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(fx, fy, 22, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.stroke();
    hq.glow(ctx, fx, fy, 120, 'rgba(253,224,71,A)', 0.3 + 0.2 * Math.sin(t * 3));
    // Insecto: muerde la hoja y cae patas arriba.
    const dead = clamp((local - 1.2) / 0.5);
    beetle(ctx, 210 + 50 * clamp(local / 1.2), 850 + 150 * dead, 110, dead);
    if (local < cue(1)) hq.tag(ctx, 540, 420, 'VENENO PARA INSECTOS', { size: 42, fill: '#fca5a5' });
    else {
      // Abejas que van y vuelven a la flor (recuerdan dónde está).
      for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.1, bx = fx + Math.cos(a) * (200 + i * 40), by = fy - 40 + Math.sin(a * 1.3) * 90; bee(ctx, bx, by, 80, t + i, Math.cos(a + Math.PI / 2) > 0 ? 1 : -1); }
      hq.tag(ctx, 540, 420, 'LAS ABEJAS RECUERDAN Y REGRESAN', { size: 36, fill: '#fde047' });
    }
  },
};
