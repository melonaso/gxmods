// Short 37: ¿y si pudieras hacerte cosquillas a ti mismo?  — versión de mayor calidad (engine2d/hq.js)
// Pregunta al inicio (¿por qué no puedes?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// El cerebro predice lo que vas a sentir y le baja el volumen → las cosquillas necesitan sorpresa →
// una teoría: alarma de zonas débiles (te ríes aunque no quieras) → 1999, Londres: un robot que copiaba tu
// mano con un retraso pequeño sí daba cosquillas → sorpresa: las ratas también se ríen (ultrasonido).
import * as hq from '../../engine2d/hq.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  const o = { ...C, t, local, s, cue };
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, o);
  ctx.restore();
  hq.paperTexture(ctx, C.W, C.H, 0.06);
  hq.vignette(ctx, C.W, C.H, 0.3);
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const INK = '#0b0f1a';
const FLOOR = 1060;
const ME = { skin: '#f1c27d', hair: '#3b2a20', shirt: '#2563eb', pants: '#1f2937', iris: '#6b4226' };
const FRIEND = { skin: '#c68642', hair: '#111827', hairStyle: 'curly', shirt: '#f97316', pants: '#334155', iris: '#3f2a1d' };

/** Pluma con degradado y barbas. (x, y) = cañón; rot = dirección. */
function feather(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, -s * 0.2, s, s * 0.1); g.addColorStop(0, '#f5d0fe'); g.addColorStop(1, '#c026d3');
  ctx.beginPath(); ctx.moveTo(s * 0.08, 0); ctx.bezierCurveTo(s * 0.3, -s * 0.32, s * 0.8, -s * 0.28, s * 1.05, -s * 0.06);
  ctx.bezierCurveTo(s * 0.75, s * 0.18, s * 0.35, s * 0.2, s * 0.08, 0); ctx.closePath();
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) { const u = 0.15 + i * 0.065; ctx.beginPath(); ctx.moveTo(s * u, -s * 0.02 * u); ctx.lineTo(s * u + s * 0.09, -s * 0.3); ctx.moveTo(s * u, -s * 0.02 * u); ctx.lineTo(s * u + s * 0.09, s * 0.25); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#701a75'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.1, s * 0.04); ctx.quadraticCurveTo(s * 0.5, -s * 0.06, s * 1.05, -s * 0.06); ctx.stroke();
  ctx.restore();
}

function jaja(ctx, x, y, t, a = 1) {
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.9 + i / 3) % 1; ctx.save(); ctx.globalAlpha = a * (1 - u);
    ctx.translate(x + (i - 1) * 90 + 10 * Math.sin(t * 10 + i), y - u * 130); ctx.rotate(0.15 * Math.sin(t * 8 + i));
    ctx.font = `900 ${52 + i * 8}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.strokeText('JA', 0, 0); ctx.fillStyle = '#fde047'; ctx.fillText('JA', 0, 0);
    ctx.restore();
  }
}

/** Sala acogedora: pared, ventana con luz, cuadro, lámpara, planta, sillón y piso de madera. */
function livingRoom(ctx, W, H, t) {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#fde7c7'], [1, '#f3c999']]); ctx.fillRect(0, 0, W, FLOOR);
  ctx.fillStyle = 'rgba(180,83,9,0.06)'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 24, FLOOR);
  // Ventana con cielo y haz de luz.
  hq.card(ctx, 70, 430, 300, 360, hq.vgrad(ctx, 0, 430, 790, [[0, '#7dd3fc'], [1, '#e0f2fe']]), 18);
  ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(220, 430); ctx.lineTo(220, 790); ctx.moveTo(70, 610); ctx.lineTo(370, 610); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = hq.vgrad(ctx, 0, 430, FLOOR + 200, [[0, '#fffbeb'], [1, 'rgba(255,251,235,0)']]);
  ctx.beginPath(); ctx.moveTo(70, 430); ctx.lineTo(370, 430); ctx.lineTo(760, FLOOR + 200); ctx.lineTo(300, FLOOR + 200); ctx.closePath(); ctx.fill(); ctx.restore();
  // Cuadro.
  hq.card(ctx, 760, 430, 200, 150, '#fef3c7', 10);
  ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.moveTo(775, 565); ctx.lineTo(830, 500); ctx.lineTo(880, 545); ctx.lineTo(910, 520); ctx.lineTo(945, 565); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(915, 470, 18, 0, TAU); ctx.fill();
  // Lámpara de pie con resplandor.
  hq.glow(ctx, 1000, 690, 200, 'rgba(253,224,71,A)', 0.35);
  ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(1000, 700); ctx.lineTo(1000, FLOOR - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(940, 700); ctx.lineTo(1060, 700); ctx.lineTo(1030, 620); ctx.lineTo(970, 620); ctx.closePath(); ctx.fillStyle = '#fde68a'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  // Piso de madera en perspectiva.
  ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#b7793f'], [1, '#7c4a1e']]); ctx.fillRect(0, FLOOR - 40, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3;
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 70, FLOOR - 40); ctx.lineTo(540 + i * 260, H); ctx.stroke(); }
  ctx.fillStyle = '#92400e'; ctx.fillRect(0, FLOOR - 52, W, 14);
  // Sillón detrás.
  hq.roundRectPath(ctx, 230, 820, 620, 190, 50); ctx.fillStyle = '#0f766e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const x of [250, 545]) { hq.roundRectPath(ctx, x, 850, 285, 120, 36); ctx.fillStyle = '#14b8a6'; ctx.fill(); ctx.stroke(); }
  for (const x of [200, 820]) { hq.roundRectPath(ctx, x, 880, 60, 150, 26); ctx.fillStyle = '#0d9488'; ctx.fill(); ctx.stroke(); }
  // Planta.
  hq.roundRectPath(ctx, 40, FLOOR - 150, 110, 120, 18); ctx.fillStyle = '#c2410c'; ctx.fill(); ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.35 + 0.05 * Math.sin(t + i); ctx.save(); ctx.translate(95, FLOOR - 150); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -90, 26, 90, 0, 0, TAU); ctx.fillStyle = i % 2 ? '#16a34a' : '#22c55e'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.restore(); }
}

/** Cerebro con degradado y circunvoluciones. */
function brain(ctx, cx, cy, R, t, glowA = 0) {
  if (glowA > 0) hq.glow(ctx, cx, cy, R * 2, 'rgba(244,114,182,A)', 0.5 * glowA);
  const outline = () => { ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 0.2); ctx.bezierCurveTo(cx - R * 1.15, cy - R * 0.6, cx - R * 0.4, cy - R * 1.05, cx + R * 0.15, cy - R * 0.9); ctx.bezierCurveTo(cx + R * 0.9, cy - R * 0.85, cx + R * 1.2, cy - R * 0.2, cx + R, cy + R * 0.3); ctx.bezierCurveTo(cx + R * 0.85, cy + R * 0.75, cx + R * 0.2, cy + R * 0.7, cx - R * 0.1, cy + R * 0.62); ctx.bezierCurveTo(cx - R * 0.6, cy + R * 0.7, cx - R * 0.95, cy + R * 0.6, cx - R, cy + R * 0.2); ctx.closePath(); };
  outline(); ctx.fillStyle = hq.vgrad(ctx, 0, cy - R, cy + R, [[0, '#fbcfe8'], [1, '#ec4899']]); ctx.fill();
  ctx.save(); outline(); ctx.clip();
  ctx.strokeStyle = 'rgba(157,23,77,0.55)'; ctx.lineWidth = R * 0.045; ctx.lineCap = 'round';
  const Rn = (k) => Math.sin(k * 12.9898) * 0.5 + 0.5;
  for (let i = 0; i < 16; i++) { const x0 = cx - R + Rn(i) * 2 * R, y0 = cy - R + Rn(i + 7) * 1.6 * R; ctx.beginPath(); ctx.moveTo(x0, y0); for (let k = 1; k < 5; k++) ctx.quadraticCurveTo(x0 + k * R * 0.12 - R * 0.06, y0 + (k % 2 ? -1 : 1) * R * 0.14, x0 + k * R * 0.12, y0 + Math.sin(k + i) * R * 0.08); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx + R * 0.05, cy - R * 0.9); ctx.quadraticCurveTo(cx - R * 0.05, cy - R * 0.2, cx + R * 0.1, cy + R * 0.6); ctx.lineWidth = R * 0.06; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx - R * 0.4, cy - R * 0.55, R * 0.35, R * 0.15, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
  outline(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  void t;
}

/** Mano abierta (icono) en (x, y). */
function handIcon(ctx, x, y, s, color = '#f1c27d') {
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.fillStyle = color;
  hq.roundRectPath(ctx, -s * 0.4, -s * 0.2, s * 0.8, s * 0.7, s * 0.25); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 4; i++) { hq.roundRectPath(ctx, -s * 0.38 + i * s * 0.2, -s * 0.62 + Math.abs(i - 1.5) * s * 0.06, s * 0.16, s * 0.5, s * 0.08); ctx.fill(); ctx.stroke(); }
  ctx.save(); ctx.translate(s * 0.38, s * 0.05); ctx.rotate(-0.7); hq.roundRectPath(ctx, -s * 0.08, -s * 0.3, s * 0.17, s * 0.36, s * 0.08); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.restore();
}

/** Rata de lado (mira a la derecha), con panza clara; laugh 0..1 abre la boca y entrecierra los ojos. */
function rat(ctx, x, y, s, t, laugh = 1) {
  ctx.save(); ctx.translate(x, y + Math.abs(Math.sin(t * 14)) * -6 * laugh);
  // Cola larga que se adelgaza.
  ctx.strokeStyle = '#f9a8d4'; ctx.lineCap = 'round';
  let px = -0.55 * s, py = 0.1 * s;
  for (let i = 1; i <= 10; i++) { const nx = -0.55 * s - i * 0.07 * s, ny = 0.1 * s + Math.sin(t * 3 + i * 0.5) * 0.05 * s - i * 0.012 * s; ctx.lineWidth = s * (0.055 - i * 0.004); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke(); px = nx; py = ny; }
  // Patas.
  for (const fx of [-0.33, -0.15, 0.3, 0.45]) { ctx.beginPath(); ctx.ellipse(fx * s, 0.24 * s, 0.075 * s, 0.04 * s, 0, 0, TAU); ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  const body = () => {
    ctx.beginPath(); ctx.moveTo(-0.55 * s, 0.15 * s);
    ctx.bezierCurveTo(-0.68 * s, -0.2 * s, -0.35 * s, -0.42 * s, 0, -0.38 * s);
    ctx.bezierCurveTo(0.3 * s, -0.35 * s, 0.45 * s, -0.25 * s, 0.55 * s, -0.12 * s);
    ctx.quadraticCurveTo(0.75 * s, -0.04 * s, 0.84 * s, 0.03 * s);
    ctx.quadraticCurveTo(0.72 * s, 0.14 * s, 0.46 * s, 0.13 * s);
    ctx.bezierCurveTo(0.2 * s, 0.24 * s, -0.3 * s, 0.27 * s, -0.55 * s, 0.15 * s); ctx.closePath();
  };
  body(); ctx.fillStyle = hq.vgrad(ctx, 0, -0.4 * s, 0.25 * s, [[0, '#9ca3af'], [1, '#d1d5db']]); ctx.fill();
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = '#f3f4f6'; ctx.beginPath(); ctx.ellipse(0.05 * s, 0.22 * s, 0.6 * s, 0.17 * s, -0.05, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-0.15 * s, -0.27 * s, 0.3 * s, 0.07 * s, -0.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(75,85,99,0.25)'; ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const fx = -0.45 * s + i * 0.07 * s; ctx.beginPath(); ctx.moveTo(fx, -0.3 * s + Math.abs(i - 6) * 0.01 * s); ctx.lineTo(fx + 8, -0.24 * s + Math.abs(i - 6) * 0.01 * s); ctx.stroke(); }
  ctx.restore();
  body(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // Oreja.
  ctx.beginPath(); ctx.ellipse(0.36 * s, -0.36 * s, 0.13 * s, 0.15 * s, -0.2, 0, TAU); ctx.fillStyle = '#d1d5db'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0.36 * s, -0.35 * s, 0.08 * s, 0.1 * s, -0.2, 0, TAU); ctx.fillStyle = '#f9a8d4'; ctx.fill();
  // Ojo (entrecerrado de risa) y nariz.
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  if (laugh > 0.5) { ctx.beginPath(); ctx.arc(0.57 * s, -0.08 * s, 0.045 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(0.57 * s, -0.1 * s, 0.035 * s, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0.56 * s, -0.11 * s, 0.012 * s, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(0.84 * s, 0.03 * s, 0.04 * s, 0, TAU); ctx.fillStyle = '#ec4899'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  if (laugh > 0) { const m = 0.03 * s + 0.02 * s * Math.abs(Math.sin(t * 16)); ctx.beginPath(); ctx.ellipse(0.72 * s, 0.1 * s, 0.04 * s, m, 0, 0, TAU); ctx.fillStyle = '#7f1d1d'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(15,23,42,0.55)'; ctx.lineWidth = 2;
  for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0.8 * s, 0.05 * s); ctx.lineTo(1.02 * s, (0.04 + d * 0.07) * s); ctx.stroke(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // En la sala: se pasa una pluma por la panza… y nada. Cara de aburrimiento total.
    livingRoom(ctx, W, H, t);
    const wig = Math.sin(t * 9);
    hq.toon(ctx, 540, FLOOR, 640, { ...ME, t, eyes: 'bored', mouth: 'flat', brows: -0.3, armL: [0.2, 0.15], armR: [0.35, -2.05 + 0.15 * wig], look: [-0.3, 0.6],
      hold: (c, h) => feather(c, h.R[0], h.R[1], 210, -2.7 + 0.2 * wig) });
    hq.bubble(ctx, 800, 660, 170, 100, 660, 560, '…', { size: 64 });
    void local;
  },

  prediccion(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dentro de tu cabeza: la señal de tu mano llega al cerebro, que ya sabía lo que venía, y baja el volumen.
    const bg = ctx.createRadialGradient(540, 640, 50, 540, 700, 1100); bg.addColorStop(0, '#4c1d95'); bg.addColorStop(1, '#0b0620');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 1200, t, { n: 16, seed: 3, color: 'rgba(196,181,253,A)', a: 0.22 });
    brain(ctx, 600, 620, 210, t, 0.6 + 0.4 * Math.sin(t * 3));
    // Mano y chispas que viajan hacia el cerebro.
    handIcon(ctx, 170, 860, 150);
    for (let i = 0; i < 6; i++) {
      const u = (t * 0.7 + i / 6) % 1, bx = 220 + (450 - 220) * u, by = 800 + (700 - 800) * u - 160 * Math.sin(u * Math.PI);
      hq.glow(ctx, bx, by, 28, 'rgba(253,224,71,A)', 0.9 * (1 - u)); ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill();
    }
    hq.bubble(ctx, 760, 400, 400, 96, 700, 470, 'YA SÉ LO QUE VIENE', { size: 36, fill: '#4c1d95' });
    // Barra de volumen.
    const down = Math.min(1, Math.max(0, (local - cue(1)) / 0.7)), lvl = 1 - 0.8 * down;
    hq.card(ctx, 330, 900, 640, 150, 'rgba(15,23,42,0.85)', 40);
    ctx.fillStyle = '#334155'; hq.roundRectPath(ctx, 470, 955, 450, 40, 20); ctx.fill();
    const lg = ctx.createLinearGradient(470, 0, 920, 0); lg.addColorStop(0, '#22c55e'); lg.addColorStop(0.7, '#facc15'); lg.addColorStop(1, '#ef4444');
    ctx.save(); hq.roundRectPath(ctx, 470, 955, 450 * lvl, 40, 20); ctx.fillStyle = lg; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(470 + 450 * lvl, 975, 30, 0, TAU); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // Bocina con ondas que se apagan.
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(360, 955); ctx.lineTo(385, 955); ctx.lineTo(415, 930); ctx.lineTo(415, 1020); ctx.lineTo(385, 995); ctx.lineTo(360, 995); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { if (i / 3 < lvl) { ctx.beginPath(); ctx.arc(415, 975, 20 + i * 14, -0.8, 0.8); ctx.stroke(); } }
    hq.tag(ctx, 650, 870, 'VOLUMEN DE LO QUE SIENTES', { size: 32, fill: '#c4b5fd' });
  },

  sorpresa(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dos paneles: si otro te sorprende, carcajada; si lo haces tú, nada.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#ecfccb'], [1, '#86efac']]); ctx.fillRect(0, 0, W, H);
    hq.card(ctx, 40, 400, 480, 660, hq.vgrad(ctx, 0, 400, 1060, [[0, '#fff7ed'], [1, '#fed7aa']]));
    hq.card(ctx, 560, 400, 480, 660, hq.vgrad(ctx, 0, 400, 1060, [[0, '#eff6ff'], [1, '#bfdbfe']]));
    hq.tag(ctx, 280, 400, 'OTRO TE SORPRENDE', { size: 32, fill: '#fdba74' });
    hq.tag(ctx, 800, 400, 'TÚ MISMO', { size: 32, fill: '#93c5fd' });
    ctx.save(); hq.roundRectPath(ctx, 40, 400, 480, 660, 36); ctx.clip();
    hq.toon(ctx, 120, 1030, 400, { ...FRIEND, t, seed: 2, mouth: 'smile', eyes: 'open', look: [0.8, 0.2], armL: [0.3, 0.3], armR: [1.35, -0.5 + 0.2 * Math.sin(t * 14)] });
    hq.toon(ctx, 300, 1030, 440, { ...ME, t, eyes: 'happy', mouth: 'laugh', blush: 1, tilt: 0.12 * Math.sin(t * 9), armL: [2.3 + 0.2 * Math.sin(t * 11), 0.3], armR: [2.2 + 0.2 * Math.sin(t * 13), 0.4], legs: 0.08 });
    jaja(ctx, 330, 560, t);
    ctx.restore();
    ctx.save(); hq.roundRectPath(ctx, 560, 400, 480, 660, 36); ctx.clip();
    const wig = Math.sin(t * 9);
    hq.toon(ctx, 800, 1030, 440, { ...ME, t, seed: 1, eyes: 'bored', mouth: 'flat', brows: -0.3, armL: [0.2, 0.1], armR: [0.35, -2.05 + 0.15 * wig], look: [-0.3, 0.6],
      hold: (c, h) => feather(c, h.R[0], h.R[1], 150, -2.7 + 0.2 * wig) });
    ctx.restore();
    if (local > cue(1)) hq.tag(ctx, 540, 1085, 'SIN SORPRESA, NO HAY COSQUILLAS', { size: 38, fill: '#fde047' });
  },

  alarma(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Escáner: el cuerpo en holograma con las zonas débiles en rojo; luego se retuerce de risa.
    const bg = ctx.createRadialGradient(540, 700, 80, 540, 700, 1000); bg.addColorStop(0, '#0c4a6e'); bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(56,189,248,0.12)'; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const laugh = local > cue(1);
    const holo = { skin: '#7dd3fc', hair: '#0369a1', shirt: '#38bdf8', pants: '#0284c7', shoes: '#075985', iris: '#0c4a6e' };
    ctx.save(); if (!laugh) ctx.globalAlpha = 0.85;
    hq.toon(ctx, 540, FLOOR, 640, { ...(laugh ? ME : holo), t, eyes: laugh ? 'happy' : 'open', mouth: laugh ? 'laugh' : 'flat', blush: laugh ? 1 : 0,
      lean: laugh ? 0.07 * Math.sin(t * 14) : 0, tilt: laugh ? 0.15 * Math.sin(t * 9) : 0, armL: laugh ? [0.9, -2.0] : [0.35, 0.1], armR: laugh ? [0.9, -2.0] : [0.35, 0.1], legs: laugh ? 0.03 : 0.06 });
    ctx.restore();
    // Línea de escaneo.
    if (!laugh) { const sy = 420 + ((t * 300) % 680); const g = hq.vgrad(ctx, 0, sy - 40, sy + 4, [[0, 'rgba(56,189,248,0)'], [1, 'rgba(125,211,252,0.7)']]); ctx.fillStyle = g; ctx.fillRect(140, sy - 40, 800, 44); }
    const on = Math.min(1, Math.max(0, (local - 0.4) / 0.6)), pulse = 0.5 + 0.5 * Math.sin(t * 9);
    const zones = [[540, FLOOR - 0.79 * 640, 'CUELLO', 1], [475, FLOOR - 0.72 * 640, 'AXILAS', -1], [600, FLOOR - 0.62 * 640, 'COSTILLAS', 1], [500, FLOOR - 15, 'PIES', -1]];
    for (const [x, y, name, side] of zones) {
      hq.glow(ctx, x, y, 70, 'rgba(239,68,68,A)', on * (0.4 + 0.5 * pulse));
      ctx.beginPath(); ctx.arc(x, y, 26 + 10 * pulse, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = `rgba(254,202,202,${on})`; ctx.stroke();
      if (on > 0.5) { const lx = side < 0 ? 200 : 880; ctx.strokeStyle = 'rgba(254,202,202,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx + (side < 0 ? 90 : -90), y); ctx.stroke(); hq.tag(ctx, lx, y, name, { size: 30, fill: '#fecaca', bg: 'rgba(127,29,29,0.85)' }); }
    }
    if (laugh) jaja(ctx, 760, 520, t);
    hq.tag(ctx, 540, 420, laugh ? '¡TE RÍES SIN QUERER!' : 'ALARMA: ZONAS DÉBILES', { size: 42, fill: laugh ? '#fde047' : '#fca5a5' });
  },

  robot(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Laboratorio, Londres 1999: mueves una palanca y el brazo robot copia tu movimiento con retraso.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#f1f5f9'], [1, '#cbd5e1']]); ctx.fillRect(0, 0, W, FLOOR);
    ctx.strokeStyle = 'rgba(100,116,139,0.18)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FLOOR); ctx.stroke(); } for (let y = 0; y < FLOOR; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#94a3b8'], [1, '#475569']]); ctx.fillRect(0, FLOOR - 40, W, H);
    const late = local > cue(1), works = local > cue(2);
    const mv = Math.sin(t * 4), mvLate = Math.sin((t - (late ? 0.35 : 0)) * 4);
    // Monitor con las dos ondas (tu mano y el robot, desfasadas).
    hq.card(ctx, 620, 450, 400, 250, '#0f172a', 20);
    ctx.save(); hq.roundRectPath(ctx, 640, 470, 360, 210, 12); ctx.clip();
    for (const [c, d, yy] of [['#22c55e', 0, 540], ['#f472b6', late ? 0.35 : 0, 620]]) { ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= 360; x += 6) { const v = Math.sin((t - d) * 4 - x * 0.03); x ? ctx.lineTo(640 + x, yy + 28 * v) : ctx.moveTo(640 + x, yy + 28 * v); } ctx.stroke(); }
    ctx.restore();
    ctx.font = '800 22px Inter, sans-serif'; ctx.fillStyle = '#86efac'; ctx.textAlign = 'left'; ctx.fillText('TU MANO', 650, 500); ctx.fillStyle = '#f9a8d4'; ctx.fillText('ROBOT', 650, 660);
    // Brazo robot metálico.
    const bx = 900, by = FLOOR - 40;
    const j1 = [bx, by - 70], a1 = -Math.PI / 2 - 0.45, l1 = 250, j2 = [j1[0] + Math.cos(a1) * l1, j1[1] + Math.sin(a1) * l1];
    const a2 = Math.PI - 0.15 + 0.15 * mvLate, l2 = 300, tip = [j2[0] + Math.cos(a2) * l2, j2[1] + Math.sin(a2) * l2];
    hq.roundRectPath(ctx, bx - 90, by - 80, 180, 80, 20); ctx.fillStyle = hq.vgrad(ctx, 0, by - 80, by, [[0, '#94a3b8'], [1, '#475569']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (const [p, q, w] of [[j1, j2, 46], [j2, tip, 38]]) {
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 12; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = w * 0.25; ctx.beginPath(); ctx.moveTo(p[0] - 6, p[1] - 8); ctx.lineTo(q[0] - 6, q[1] - 8); ctx.stroke();
    }
    for (const p of [j1, j2]) { ctx.beginPath(); ctx.arc(p[0], p[1], 32, 0, TAU); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, TAU); ctx.fillStyle = INK; ctx.fill(); }
    hq.glow(ctx, bx, by - 50, 30, 'rgba(34,197,94,A)', 0.8 + 0.2 * Math.sin(t * 6));
    feather(ctx, tip[0], tip[1], 170, Math.PI + 0.05 + 0.2 * mvLate);
    // Persona con la palanca.
    hq.toon(ctx, 300, FLOOR, 560, { ...ME, t, eyes: works ? 'happy' : 'open', mouth: works ? 'laugh' : 'flat', blush: works ? 1 : 0, look: [0.7, 0], tilt: works ? 0.12 * Math.sin(t * 9) : 0,
      armL: [0.7, -0.9 + 0.1 * mv], armR: [0.2, 0.1] });
    hq.roundRectPath(ctx, 130, FLOOR - 230, 140, 190, 16); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(200, FLOOR - 230); ctx.lineTo(200 + 20 * mv, FLOOR - 270); ctx.stroke();
    ctx.beginPath(); ctx.arc(200 + 20 * mv, FLOOR - 272, 18, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    hq.tag(ctx, 240, 405, '1999 · LONDRES', { size: 38, fill: '#ffffff' });
    if (late) hq.tag(ctx, 820, 405, 'RETRASO: 0.2 s', { size: 36, fill: '#fde047' });
    if (works) { jaja(ctx, 520, 540, t); hq.tag(ctx, 540, 1085, '¡SÍ DA COSQUILLAS!', { size: 46, fill: '#86efac' }); }
  },

  ratas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Jaula de laboratorio: una mano con guante le hace cosquillas a una rata; su risa sale en ultrasonido.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#e2e8f0'], [1, '#94a3b8']]); ctx.fillRect(0, 0, W, H);
    hq.card(ctx, 60, 470, 960, 600, 'rgba(255,255,255,0.35)', 30);
    const R = (k) => Math.sin(k * 91.7) * 0.5 + 0.5;
    for (let i = 0; i < 140; i++) { const x = 90 + R(i) * 900, y = 960 + R(i + 300) * 90; ctx.save(); ctx.translate(x, y); ctx.rotate(R(i + 50) * 3); ctx.fillStyle = i % 3 ? '#fcd34d' : '#f59e0b'; hq.roundRectPath(ctx, -14, -5, 28, 10, 5); ctx.fill(); ctx.restore(); }
    // Bebedero.
    hq.roundRectPath(ctx, 880, 480, 70, 240, 30); ctx.fillStyle = 'rgba(186,230,253,0.85)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(915, 720); ctx.lineTo(880, 790); ctx.stroke();
    const laughing = Math.min(1, Math.max(0, (local - 0.3) / 0.6));
    rat(ctx, 420, 900, 360, t, laughing);
    // Mano con guante morado: los dedos le hacen cosquillas en el lomo.
    const tk = Math.sin(t * 14);
    ctx.save(); ctx.translate(430 + 12 * tk, 690); ctx.rotate(-0.15);
    hq.roundRectPath(ctx, -10, -200, 90, 150, 30); ctx.fillStyle = hq.vgrad(ctx, 0, -200, -50, [[0, '#7c3aed'], [1, '#8b5cf6']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, -30, -70, 140, 90, 40); ctx.fillStyle = '#8b5cf6'; ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-14 + i * 34, 0); ctx.rotate(0.35 * Math.sin(t * 16 + i * 1.3)); hq.roundRectPath(ctx, -13, 0, 26, 70, 13); ctx.fillStyle = '#a78bfa'; ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // Ondas de ultrasonido y detector.
    const on = Math.min(1, Math.max(0, (local - cue(1) + 0.2) / 0.5));
    for (let i = 0; i < 4; i++) { const u = (t * 1.2 + i / 4) % 1; ctx.strokeStyle = `rgba(124,58,237,${on * (1 - u)})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(740, 930, 40 + u * 190, -1.2, 0.1); ctx.stroke(); }
    hq.card(ctx, 700, 520, 300, 170, '#0f172a', 22);
    ctx.save(); hq.roundRectPath(ctx, 720, 590, 260, 80, 10); ctx.clip(); ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 4; ctx.beginPath();
    for (let x = 0; x <= 260; x += 4) { const v = on * Math.sin(x * 0.6 + t * 30) * 30 * Math.sin(x * 0.03); x ? ctx.lineTo(720 + x, 630 + v) : ctx.moveTo(720 + x, 630 + v); } ctx.stroke(); ctx.restore();
    ctx.font = '900 40px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = on > 0.5 ? '#c4b5fd' : '#475569'; ctx.fillText('50 kHz', 850, 570);
    if (on > 0) {
      ctx.save(); ctx.globalAlpha = on; ctx.translate(200, 560);
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.bezierCurveTo(60, -70, 70, 10, 30, 30); ctx.quadraticCurveTo(10, 45, 15, 70); ctx.quadraticCurveTo(-20, 80, -30, 40); ctx.bezierCurveTo(-45, -20, -40, -55, 0, -60); ctx.closePath();
      ctx.fillStyle = '#f1c27d'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(70, 80); ctx.stroke();
      ctx.restore();
      hq.tag(ctx, 540, 1085, 'RISA ULTRASÓNICA', { size: 48, fill: '#c4b5fd' });
    } else hq.tag(ctx, 540, 1085, '¿COSQUILLAS?', { size: 48, fill: '#fde68a' });
  },
};
