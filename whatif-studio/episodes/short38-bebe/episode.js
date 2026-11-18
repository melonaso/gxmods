// Short 38: ¿y si pudieras recordar cuando eras bebé?  (calidad alta: engine2d/hq.js)
// Gancho con dos preguntas abiertas (¿por qué no recuerdas nada? ¿tu primer recuerdo es falso?), que se cierran
// una tras otra: casi nadie recuerda antes de los 3 años → el hipocampo seguía en obra → ¿se borraron? 2025: los
// bebés sí guardan recuerdos → en ratones se encendieron con luz recuerdos olvidados → sorpresa: 4 de cada 10
// dicen recordar algo de antes de los 2 años y lo más probable es que sea inventado.
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
const ME = { skin: '#f1c27d', hair: '#3b2a20', shirt: '#0d9488', pants: '#1f2937', iris: '#6b4226' };
const BABY = { kid: true, skin: '#f8d1a8', hair: '#7c4a1e', hairStyle: 'tuft', shirt: '#fde68a', pants: '#fde68a', shoes: '#f9a8d4', iris: '#3b82f6' };
const clamp = (x) => Math.max(0, Math.min(1, x));

/** Habitación de bebé: pared pastel con estrellas, ventana con luna, cuna y móvil. */
function nursery(ctx, W, H, t) {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#e0f2fe'], [1, '#c7d2fe']]); ctx.fillRect(0, 0, W, FLOOR);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 26; i++) { const x = (i * 173) % W, y = 400 + ((i * 97) % 560); star(ctx, x, y, 10 + (i % 3) * 4); }
  hq.card(ctx, 760, 430, 230, 230, hq.vgrad(ctx, 0, 430, 660, [[0, '#1e1b4b'], [1, '#4338ca']]), 20);
  ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(900, 510, 38, 0, TAU); ctx.fill(); ctx.fillStyle = '#312e81'; ctx.beginPath(); ctx.arc(918, 498, 34, 0, TAU); ctx.fill();
  ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#fbcfe8'], [1, '#f9a8d4']]); ctx.fillRect(0, FLOOR - 40, W, H);
  // Cuna.
  ctx.lineWidth = 6; ctx.strokeStyle = INK;
  hq.roundRectPath(ctx, 70, 760, 430, 40, 16); ctx.fillStyle = '#c2410c'; ctx.fill(); ctx.stroke();
  hq.roundRectPath(ctx, 70, 960, 430, 40, 16); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 9; i++) { hq.roundRectPath(ctx, 95 + i * 47, 790, 16, 175, 8); ctx.fillStyle = '#ea580c'; ctx.fill(); ctx.stroke(); }
  for (const x of [60, 480]) { hq.roundRectPath(ctx, x, 720, 34, 330, 14); ctx.fillStyle = '#9a3412'; ctx.fill(); ctx.stroke(); }
  // Móvil con estrellas que giran.
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(285, 380); ctx.lineTo(285, 470); ctx.stroke();
  for (let i = 0; i < 4; i++) { const a = t * 0.8 + i * Math.PI / 2, x = 285 + Math.cos(a) * 120, z = Math.sin(a); ctx.beginPath(); ctx.moveTo(285, 470); ctx.lineTo(x, 470 + 8 * z); ctx.lineTo(x, 540 + 8 * z); ctx.stroke(); ctx.fillStyle = ['#fde047', '#f472b6', '#60a5fa', '#a78bfa'][i]; star(ctx, x, 560 + 8 * z, 26, true); }
}

function star(ctx, x, y, r, outline = false) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); if (outline) { ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
}

/** Globo de pensamiento (nubecita) con burbujitas hacia (tx, ty). draw(ctx) dibuja adentro. */
function thought(ctx, x, y, w, h, tx, ty, inner, { dashed = false } = {}) {
  ctx.save();
  for (let i = 1; i <= 2; i++) { const u = i / 3; ctx.beginPath(); ctx.arc(tx + (x - tx) * u * 0.6, ty + (y + h / 2 - ty) * u * 0.6, 10 + i * 6, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  const path = () => { ctx.beginPath(); const n = 9; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = x + Math.cos(a) * w / 2, py = y + Math.sin(a) * h / 2; ctx.moveTo(px + w * 0.16, py); ctx.arc(px, py, w * 0.16, 0, TAU); } ctx.moveTo(x + w * 0.42, y); ctx.ellipse(x, y, w * 0.42, h * 0.4, 0, 0, TAU); };
  ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; path(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowColor = 'transparent';
  if (dashed) ctx.setLineDash([14, 10]); ctx.lineWidth = 5; ctx.strokeStyle = INK; path(); ctx.stroke(); ctx.setLineDash([]);
  path(); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w * 0.47, h * 0.45, 0, 0, TAU); ctx.clip(); inner && inner(ctx);
  ctx.restore();
}

/** Carita de bebé (para fotos y recuerdos). */
function babyFace(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#f8d1a8'; ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.06); ctx.strokeStyle = INK; ctx.stroke();
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * r * 0.35, y - r * 0.05, r * 0.11, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + s * r * 0.35 - r * 0.03, y - r * 0.09, r * 0.04, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(x, y + r * 0.25, r * 0.22, 0.15, Math.PI - 0.15); ctx.stroke();
  ctx.fillStyle = 'rgba(244,114,182,0.5)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * 0.58, y + r * 0.2, r * 0.15, r * 0.09, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#7c4a1e'; ctx.lineWidth = Math.max(3, r * 0.08); ctx.beginPath(); ctx.moveTo(x - r * 0.05, y - r * 0.95); ctx.bezierCurveTo(x - r * 0.1, y - r * 1.35, x + r * 0.35, y - r * 1.3, x + r * 0.2, y - r * 1.05); ctx.stroke();
}

/** Ratón de laboratorio de lado (mira a la derecha). */
function mouse(ctx, x, y, s, t, { color = '#f1f5f9', baby = false } = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#f9a8d4'; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.05;
  ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.1); ctx.quadraticCurveTo(-s * 0.95, s * 0.05 + 10 * Math.sin(t * 3), -s * 1.05, -s * 0.2); ctx.stroke();
  const body = () => { ctx.beginPath(); ctx.moveTo(-s * 0.52, s * 0.15); ctx.bezierCurveTo(-s * 0.62, -s * 0.25, -s * 0.2, -s * 0.42, s * 0.15, -s * 0.33); ctx.bezierCurveTo(s * 0.45, -s * 0.25, s * 0.6, -s * 0.1, s * 0.75, s * 0.05); ctx.quadraticCurveTo(s * 0.55, s * 0.2, s * 0.3, s * 0.2); ctx.quadraticCurveTo(-s * 0.2, s * 0.28, -s * 0.52, s * 0.15); ctx.closePath(); };
  body(); ctx.fillStyle = hq.vgrad(ctx, 0, -s * 0.4, s * 0.25, [[0, color], [1, '#cbd5e1']]); ctx.fill(); ctx.lineWidth = Math.max(3, s * 0.03); ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(s * 0.28, -s * 0.32, s * 0.14, s * 0.15, -0.2, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(s * 0.28, -s * 0.31, s * 0.08, s * 0.09, -0.2, 0, TAU); ctx.fillStyle = '#f9a8d4'; ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.08, s * (baby ? 0.05 : 0.04), 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.76, s * 0.05, s * 0.04, 0, TAU); ctx.fillStyle = '#ec4899'; ctx.fill();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, t } = o;
    // En el cuarto de bebé: miras tu foto de bebé… y no recuerdas nada.
    nursery(ctx, W, H, t);
    hq.toon(ctx, 760, FLOOR, 620, { ...ME, t, eyes: 'open', mouth: 'o', look: [-0.4, 0.5], brows: 0.6, armL: [0.55, -1.5], armR: [0.55, -1.5],
      hold: (c, h) => { const mx = (h.L[0] + h.R[0]) / 2, my = (h.L[1] + h.R[1]) / 2 - 40; c.save(); c.translate(mx, my); c.rotate(-0.05); hq.card(c, -75, -90, 150, 180, '#fef3c7', 10); babyFace(c, 0, 5, 50); c.restore(); } });
    thought(ctx, 430, 560, 280, 190, 650, 600, (c) => { c.font = '900 110px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#94a3b8'; c.fillText('?', 430, 565); }, { dashed: true });
  },

  olvido(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Línea de tu vida: de 0 a 3 años, todo en gris (sin recuerdos)… aunque aprendiste muchísimo.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#fef9c3'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#86efac'], [1, '#4ade80']]); ctx.fillRect(0, FLOOR - 40, W, H);
    const yb = 520;
    ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(80, yb + 100); ctx.lineTo(1000, yb + 100); ctx.stroke();
    for (let a = 0; a <= 8; a++) { const x = 100 + a * 110; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, yb + 85); ctx.lineTo(x, yb + 115); ctx.stroke(); ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(String(a), x, yb + 150); }
    const scenes = [['#93c5fd', '🏖'], ['#fca5a5', '🎂'], ['#c4b5fd', '🎒'], ['#86efac', '⚽'], ['#fdba74', '🎁']];
    for (let a = 0; a < 8; a++) {
      const x = 100 + a * 110, gray = a < 3;
      hq.roundRectPath(ctx, x + 8, yb - 40, 94, 110, 12); ctx.fillStyle = gray ? '#cbd5e1' : scenes[a % 5][0]; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.font = gray ? '900 54px Inter, sans-serif' : '48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = gray ? '#64748b' : INK;
      if (gray) ctx.fillText('?', x + 55, yb + 15);
      else { ctx.save(); hq.roundRectPath(ctx, x + 8, yb - 40, 94, 110, 12); ctx.clip(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x + 80, yb - 10, 13, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(21,128,61,0.8)'; ctx.beginPath(); ctx.moveTo(x, yb + 75); ctx.quadraticCurveTo(x + 40, yb + 5, x + 110, yb + 60); ctx.lineTo(x + 110, yb + 80); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    hq.tag(ctx, 270, 420, 'SIN RECUERDOS', { size: 34, fill: '#fca5a5' });
    // Bebé que aprende a caminar.
    const step = Math.sin(t * 6), bx = 300 + 300 * clamp(local / o.s.dur);
    hq.toon(ctx, bx, FLOOR, 330, { ...BABY, t, eyes: 'open', mouth: local > cue(1) ? 'laugh' : 'smile', blush: 0.6, armL: [1.4, 0.3 + 0.2 * step], armR: [1.4, 0.3 - 0.2 * step], legs: 0.04 + 0.03 * step, lean: 0.05 * step });
    if (local > cue(1)) hq.bubble(ctx, bx + 190, 800, 230, 90, bx + 70, 870, '¡MAMÁ!', { size: 44, fill: '#be185d' });
    void H;
  },

  hipocampo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dentro de tu cabeza de bebé: el hipocampo (el «archivo») está en obra y revuelve los recuerdos.
    const bg = ctx.createRadialGradient(540, 700, 60, 540, 700, 1000); bg.addColorStop(0, '#4c1d95'); bg.addColorStop(1, '#0b0620');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 1200, t, { n: 14, seed: 5, color: 'rgba(196,181,253,A)', a: 0.2 });
    hq.brain(ctx, 540, 700, 300, 0.6);
    // Hipocampo dorado (forma de caballito de mar).
    ctx.save(); ctx.translate(560, 790); ctx.rotate(0.3);
    ctx.beginPath(); ctx.moveTo(-60, -50); ctx.bezierCurveTo(-10, -90, 60, -60, 50, -10); ctx.bezierCurveTo(40, 40, -30, 30, -10, 70); ctx.bezierCurveTo(10, 100, 50, 80, 40, 60);
    ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 24; ctx.strokeStyle = '#fbbf24'; ctx.stroke();
    ctx.restore();
    hq.glow(ctx, 560, 790, 120, 'rgba(251,191,36,A)', 0.4 + 0.2 * Math.sin(t * 4));
    hq.tag(ctx, 820, 950, 'GUARDA RECUERDOS', { size: 34, fill: '#fde68a' });
    const mess = clamp((local - cue(1)) / 0.5);
    if (mess > 0) {
      for (let i = 0; i < 10; i++) {
        const a = t * (1.5 + i * 0.2) + i, rr = 160 + 40 * Math.sin(t * 2 + i);
        ctx.save(); ctx.globalAlpha = mess; ctx.translate(560 + Math.cos(a) * rr, 760 + Math.sin(a) * rr * 0.7); ctx.rotate(a * 2);
        hq.roundRectPath(ctx, -26, -32, 52, 64, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-16, -16 + k * 14); ctx.lineTo(16, -16 + k * 14); ctx.stroke(); }
        ctx.restore();
      }
      // Cono de obra y letrero.
      ctx.save(); ctx.globalAlpha = mess;
      ctx.beginPath(); ctx.moveTo(190, 1020); ctx.lineTo(230, 900); ctx.lineTo(270, 1020); ctx.closePath(); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(212, 950, 36, 14);
      ctx.restore();
      hq.tag(ctx, 540, 430, 'EN OBRA: REVUELVE TODO', { size: 40, fill: '#fdba74' });
    } else hq.tag(ctx, 540, 430, 'EL ARCHIVO DE RECUERDOS', { size: 40, fill: '#fde68a' });
  },

  escaneo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Hospital, 2025: un bebé entra al escáner; en el monitor su hipocampo se enciende al ver imágenes nuevas.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#f0f9ff'], [1, '#bae6fd']]); ctx.fillRect(0, 0, W, FLOOR);
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#cbd5e1'], [1, '#94a3b8']]); ctx.fillRect(0, FLOOR - 40, W, H);
    // Escáner (anillo grande).
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.beginPath(); ctx.arc(330, 780, 230, 0, TAU); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.restore();
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(330, 780, 230, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(330, 780, 120, 0, TAU); ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(330, 780, 175, -0.6 + t, 0.6 + t); ctx.stroke();
    // Camilla y bebé entrando (con audífonos).
    const slide = clamp(local / 2.2);
    hq.roundRectPath(ctx, 330 - 40 * slide, 850, 520, 36, 14); ctx.fillStyle = '#e2e8f0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.translate(560 - 220 * slide, 820); ctx.rotate(-Math.PI / 2);
    hq.toon(ctx, 0, 60, 240, { ...BABY, t, eyes: 'closed', mouth: 'smile', breathe: true, armL: [0.3, 0.2], armR: [0.3, 0.2] });
    ctx.restore();
    // Monitor con el cerebro.
    hq.card(ctx, 650, 430, 360, 300, '#0f172a', 22);
    const lit = clamp((local - cue(1)) / 0.4);
    ctx.save(); hq.roundRectPath(ctx, 670, 450, 320, 260, 12); ctx.clip();
    hq.brain(ctx, 830, 590, 110, 0);
    if (lit > 0) { hq.glow(ctx, 840, 625, 70, 'rgba(250,204,21,A)', lit); ctx.fillStyle = `rgba(250,204,21,${lit})`; ctx.beginPath(); ctx.ellipse(840, 625, 26, 14, 0.4, 0, TAU); ctx.fill(); }
    ctx.restore();
    hq.tag(ctx, 270, 430, '2025 · BEBÉS DE 1 AÑO', { size: 36, fill: '#ffffff' });
    if (lit > 0) hq.tag(ctx, 830, 780, '¡SÍ GUARDA!', { size: 42, fill: '#86efac' });
  },

  ratones(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Laboratorio: una fibra de luz azul enciende un recuerdo de cuando el ratón era cría.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#e2e8f0'], [1, '#cbd5e1']]); ctx.fillRect(0, 0, W, FLOOR);
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 60, H, [[0, '#f8fafc'], [1, '#cbd5e1']]); ctx.fillRect(0, FLOOR - 60, W, H);
    const on = clamp((local - cue(0) - 1.3) / 0.4);
    // Fuente de luz y fibra.
    hq.roundRectPath(ctx, 120, 400, 220, 120, 20); ctx.fillStyle = '#334155'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.glow(ctx, 230, 460, 50, 'rgba(56,189,248,A)', 0.4 + 0.6 * on);
    ctx.strokeStyle = on > 0 ? '#38bdf8' : '#64748b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(230, 520); ctx.bezierCurveTo(230, 700, 470, 640, 500, 830); ctx.stroke();
    if (on > 0) for (let i = 0; i < 4; i++) { const u = (t * 1.2 + i / 4) % 1, bx = Math.pow(1 - u, 3) * 230 + 3 * Math.pow(1 - u, 2) * u * 230 + 3 * (1 - u) * u * u * 470 + u * u * u * 500, by = Math.pow(1 - u, 3) * 520 + 3 * Math.pow(1 - u, 2) * u * 700 + 3 * (1 - u) * u * u * 640 + u * u * u * 830; hq.glow(ctx, bx, by, 22, 'rgba(125,211,252,A)', 0.9); }
    mouse(ctx, 470, 940, 300, t);
    hq.glow(ctx, 500, 830, 30, 'rgba(56,189,248,A)', on);
    // Recuerdo encendido: la cría con su mamá.
    if (on > 0) {
      ctx.save(); ctx.globalAlpha = on;
      thought(ctx, 780, 600, 380, 270, 600, 800, (c) => {
        c.fillStyle = hq.vgrad(c, 0, 470, 740, [[0, '#fef3c7'], [1, '#fde68a']]); c.fillRect(580, 460, 400, 300);
        mouse(c, 730, 650, 170, t); mouse(c, 860, 680, 90, t, { baby: true });
        hq.glow(c, 780, 600, 200, 'rgba(255,255,255,A)', 0.3);
      });
      ctx.restore();
    }
    if (local > cue(1)) {
      // Candado: el recuerdo sigue ahí, pero sin llave.
      ctx.save(); ctx.translate(880, 900);
      ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, -40, 40, Math.PI, TAU); ctx.stroke();
      hq.roundRectPath(ctx, -60, -40, 120, 100, 18); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill(); ctx.fillRect(-5, 0, 10, 28);
      ctx.restore();
    }
    hq.tag(ctx, 540, 405, local > cue(1) ? 'SIGUEN AHÍ, PERO SIN LLAVE' : on > 0 ? 'RECUERDO ENCENDIDO CON LUZ' : 'RATÓN ADULTO', { size: 38, fill: local > cue(1) ? '#fde047' : on > 0 ? '#7dd3fc' : '#ffffff' });
  },

  falso(ctx, o) {
    const { W, H, local, cue, t } = o;
    // En la sala, con el álbum de fotos: tu «primer recuerdo» se arma con pedazos de fotos… y es inventado.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, FLOOR, [[0, '#fde7c7'], [1, '#f3c999']]); ctx.fillRect(0, 0, W, FLOOR);
    ctx.fillStyle = hq.vgrad(ctx, 0, FLOOR - 40, H, [[0, '#b7793f'], [1, '#7c4a1e']]); ctx.fillRect(0, FLOOR - 40, W, H);
    // Mesa con fotos.
    hq.roundRectPath(ctx, 520, 930, 520, 40, 14); ctx.fillStyle = '#92400e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const photos = [[600, 905, -0.2], [720, 900, 0.15], [840, 908, -0.05], [960, 900, 0.2]];
    for (const [x, y, r] of photos) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); hq.roundRectPath(ctx, -50, -40, 100, 80, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#93c5fd'; ctx.fillRect(-40, -30, 80, 50); babyFace(ctx, 0, -2, 18); ctx.restore(); }
    hq.toon(ctx, 300, FLOOR, 600, { ...ME, t, eyes: local > cue(1) ? 'wide' : 'open', mouth: local > cue(1) ? 'o' : 'smile', look: [0.6, -0.6], armL: [0.2, 0.1], armR: [0.4, -1.2] });
    // Pedazos de foto que vuelan al globo y forman el «recuerdo».
    const build = clamp((local - 0.4) / (cue(1) - 0.2)), cx = 700, cy = 560;
    thought(ctx, cx, cy, 420, 290, 420, 520, (c) => {
      c.fillStyle = '#e0f2fe'; c.fillRect(cx - 230, cy - 160, 460, 320);
      for (let i = 0; i < 6; i++) {
        const tx = cx - 120 + (i % 3) * 120, ty = cy - 50 + Math.floor(i / 3) * 100, u = clamp(build * 1.6 - i * 0.12);
        const sx = photos[i % 4][0], sy = photos[i % 4][1], x = sx + (tx - sx) * u, y = sy + (ty - sy) * u;
        c.save(); c.translate(x, y); c.rotate((1 - u) * (i - 2.5) * 0.5); hq.roundRectPath(c, -58, -48, 116, 96, 8); c.fillStyle = ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#c4b5fd', '#fdba74'][i]; c.fill(); c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.stroke(); c.restore();
      }
      if (build > 0.8) babyFace(c, cx, cy + 10, 70);
    });
    hq.tag(ctx, 300, 410, '4 DE CADA 10', { size: 44, fill: '#fde047' });
    if (local > cue(1) + 0.3) {
      const k = clamp((local - cue(1) - 0.3) / 0.25), sc = 1.6 - 0.6 * k;
      ctx.save(); ctx.globalAlpha = k; ctx.translate(cx, cy + 10); ctx.rotate(-0.22); ctx.scale(sc, sc);
      ctx.lineWidth = 10; ctx.strokeStyle = '#dc2626'; hq.roundRectPath(ctx, -225, -48, 450, 96, 14); ctx.stroke();
      ctx.font = '900 60px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#dc2626'; ctx.fillText('INVENTADO', 0, 4);
      ctx.restore();
    }
    void W;
  },
};
