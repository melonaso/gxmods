// Short 32: ¿y si te tragara una ballena?
// Pregunta al inicio (¿saldrías vivo?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// La jorobada come abriendo la boca sobre un banco de peces → quedas dentro → su garganta es más angosta que
// tus hombros → no le sirves de comida: sube y te escupe → 2021: un buzo respiró con su tanque medio minuto
// dentro de una jorobada y salió con golpes → sorpresa: el cachalote sí podría tragarte (y adentro no hay aire).

export function setup() {}

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

/** Mar con rayos de luz. */
function sea(ctx, o, top = '#0ea5e9', bottom = '#0c4a6e', rays = 0.12) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, top, bottom);
  if (rays > 0) {
    ctx.save(); ctx.globalAlpha = rays; ctx.fillStyle = '#e0f2fe';
    for (let i = 0; i < 5; i++) { const x = 60 + i * 230 + 40 * Math.sin(t * 0.5 + i); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 260, H); ctx.lineTo(x + 120, H); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
}

function bubbles(ctx, o, { n = 14, x0 = 0, x1 = null, y0 = 380, y1 = 1200, seed = 2, speed = 140, a = 0.6 } = {}) {
  const { W, kit, t } = o, r = kit.rng(seed), X1 = x1 ?? W, span = y1 - y0;
  ctx.save(); ctx.strokeStyle = `rgba(224,242,254,${a})`; ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (X1 - x0), rad = 5 + r() * 9, off = r() * span;
    const y = y1 - ((off + t * speed * (0.6 + r() * 0.8)) % span);
    ctx.beginPath(); ctx.arc(x + 6 * Math.sin(t * 3 + i), y, rad, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function fish(ctx, kit, x, y, s, dir = 1, color = '#fbbf24') {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 0.85, -s * 0.3); ctx.lineTo(-s * 0.85, s * 0.3); ctx.closePath(); kit.shape(ctx, color, 3);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.3, 0, 0, TAU); kit.shape(ctx, color, 3);
  ctx.beginPath(); ctx.arc(s * 0.28, -s * 0.06, s * 0.07, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
  ctx.restore();
}

/** Banco de peces girando alrededor de (cx, cy). pull: 0..1 se juntan hacia (px, py). */
function school(ctx, o, cx, cy, rx, ry, n, { seed = 4, pull = 0, px = cx, py = cy, color = '#fbbf24', size = 34 } = {}) {
  const { kit, t } = o, r = kit.rng(seed);
  for (let i = 0; i < n; i++) {
    const a0 = r() * TAU, rr = 0.4 + r() * 0.6, w = 0.6 + r() * 0.5, a = a0 + t * w;
    let x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
    x += (px - x) * pull; y += (py - y) * pull;
    fish(ctx, kit, x, y, size * (0.8 + r() * 0.4), -Math.sin(a) > 0 ? 1 : -1, color);
  }
}

/** Buzo de frente (pies abajo) centrado en (x, y): traje, tanque, visor, regulador y aletas. */
function diver(ctx, kit, x, y, h, { rot = 0, arms = 0.3, eyes = 'open', kick = 0, bruise = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  kit.roundRect(ctx, h * 0.1, -h * 0.3, h * 0.14, h * 0.32, h * 0.06); kit.shape(ctx, '#facc15', 4);
  kit.person(ctx, 0, h / 2, h, { shirt: '#1f2937', pants: '#1f2937', arms });
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * h * 0.085, h / 2); ctx.rotate(s * (0.12 + 0.25 * kick));
    ctx.beginPath(); ctx.moveTo(-h * 0.06, 0); ctx.lineTo(h * 0.06, 0); ctx.lineTo(h * 0.1, h * 0.17); ctx.lineTo(-h * 0.1, h * 0.17); ctx.closePath(); kit.shape(ctx, '#f97316', 4);
    ctx.restore();
  }
  const hs = h * 0.24, hy = -h / 2;
  kit.roundRect(ctx, -hs * 0.46, hy + hs * 0.2, hs * 0.92, hs * 0.4, hs * 0.12); kit.shape(ctx, '#bae6fd', 4);
  const er = eyes === 'wide' ? hs * 0.1 : hs * 0.07;
  for (const ex of [-0.2, 0.2]) { ctx.beginPath(); ctx.arc(ex * hs, hy + hs * 0.4, er, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, hy + hs * 0.82, hs * 0.11, 0, TAU); kit.shape(ctx, '#111827', 3);
  ctx.strokeStyle = '#111827'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hs * 0.1, hy + hs * 0.82); ctx.quadraticCurveTo(h * 0.2, hy + hs * 0.9, h * 0.17, -h * 0.28); ctx.stroke();
  if (bruise > 0) { ctx.fillStyle = `rgba(126,34,206,${0.75 * bruise})`; ctx.beginPath(); ctx.ellipse(-hs * 0.3, hy + hs * 0.75, hs * 0.14, hs * 0.1, 0, 0, TAU); ctx.fill(); kit.roundRect(ctx, -h * 0.16, -h * 0.05, h * 0.12, h * 0.05, 4); kit.shape(ctx, '#f8fafc', 3); }
  ctx.restore();
}

/** Ballena jorobada de lado (cabeza a la derecha), centrada en (x, y), largo s. open: 0..1 boca abierta. */
function humpback(ctx, kit, x, y, s, { open = 0, rot = 0, flip = 1, t = 0 } = {}) {
  const dark = '#3f4f66', light = '#e2e8f0', L = 6000 / s;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip * s / 1000, s / 1000);
  ctx.save(); ctx.translate(-470, 0); ctx.rotate(0.18 * Math.sin(t * 2));
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(-60, -60, -190, -170); ctx.quadraticCurveTo(-150, -60, -110, 0); ctx.quadraticCurveTo(-150, 60, -190, 170); ctx.quadraticCurveTo(-60, 60, 10, 0); ctx.closePath(); kit.shape(ctx, dark, L);
  ctx.restore();
  const hx = 190, hy = 15, a = open * 0.6;
  if (open > 0) {
    const jx = hx + 335 * Math.cos(a), jy = hy + 335 * Math.sin(a);
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(528, 2); ctx.lineTo(jx, jy); ctx.closePath(); ctx.fillStyle = '#7f1d1d'; ctx.fill();
    ctx.strokeStyle = '#1c1917'; ctx.lineWidth = L * 0.7;
    for (let i = 0; i < 11; i++) { const u = i / 10, bx = hx + 30 + u * 300; ctx.beginPath(); ctx.moveTo(bx, hy - u * 12); ctx.lineTo(bx, hy - u * 12 + 25 + open * 25); ctx.stroke(); }
  }
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(-420, 0); ctx.lineTo(338, -12); ctx.quadraticCurveTo(335, 40, 280, 55); ctx.bezierCurveTo(150, 100 + open * 90, -150, 110 + open * 60, -420, 40); ctx.closePath(); kit.shape(ctx, light, L);
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = L * 0.5;
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-380, 6 + i * 6); ctx.quadraticCurveTo(0, 16 + i * (15 + open * 14), 300, i * 8); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-470, -8); ctx.bezierCurveTo(-300, -95, -40, -135, 200, -112); ctx.bezierCurveTo(380, -96, 500, -55, 530, 0); ctx.lineTo(hx, hy); ctx.bezierCurveTo(0, 55, -250, 50, -470, 8); ctx.closePath(); kit.shape(ctx, dark, L);
  ctx.fillStyle = '#1e293b'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(300 + i * 36, -90 + i * 14, 9, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-310, -72); ctx.quadraticCurveTo(-265, -128, -230, -86); ctx.closePath(); kit.shape(ctx, dark, L);
  ctx.save(); ctx.translate(90, 45); ctx.rotate(-0.55 + 0.15 * Math.sin(t * 2));
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(-180, 0, -340, 30); ctx.quadraticCurveTo(-180, 55, 0, 22); ctx.closePath(); kit.shape(ctx, light, L);
  ctx.restore();
  ctx.beginPath(); ctx.arc(250, -16, 12, 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill();
  ctx.restore();
}

/** Cachalote de lado (cabeza cuadrada a la derecha). open: 0..1 mandíbula abierta. */
function spermWhale(ctx, kit, x, y, s, { open = 0, t = 0 } = {}) {
  const c = '#64748b', L = 6000 / s;
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 1000, s / 1000);
  ctx.save(); ctx.translate(-470, 10); ctx.rotate(0.15 * Math.sin(t * 2));
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(-60, -60, -180, -150); ctx.quadraticCurveTo(-140, -50, -100, 0); ctx.quadraticCurveTo(-140, 50, -180, 150); ctx.quadraticCurveTo(-60, 60, 10, 0); ctx.closePath(); kit.shape(ctx, c, L);
  ctx.restore();
  const a = open * 0.55, jx = 80 + 410 * Math.cos(a), jy = 92 + 410 * Math.sin(a);
  if (open > 0) { ctx.beginPath(); ctx.moveTo(80, 90); ctx.lineTo(520, 85); ctx.lineTo(jx, jy); ctx.closePath(); ctx.fillStyle = '#450a0a'; ctx.fill(); }
  ctx.save(); ctx.translate(80, 92); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(400, -8); ctx.quadraticCurveTo(420, 6, 400, 20); ctx.lineTo(0, 26); ctx.closePath(); kit.shape(ctx, '#cbd5e1', L);
  for (let i = 0; i < 9; i++) { const tx = 130 + i * 28; ctx.beginPath(); ctx.moveTo(tx, -8); ctx.lineTo(tx + 8, -30); ctx.lineTo(tx + 16, -8); ctx.closePath(); kit.shape(ctx, '#ffffff', L * 0.5); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-470, 0); ctx.quadraticCurveTo(-250, -120, 100, -150); ctx.lineTo(470, -150); ctx.quadraticCurveTo(540, -150, 540, -80); ctx.lineTo(540, 30); ctx.quadraticCurveTo(540, 85, 470, 85); ctx.lineTo(80, 90); ctx.quadraticCurveTo(-250, 100, -470, 20); ctx.closePath(); kit.shape(ctx, c, L);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = L * 0.6;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); for (let k = 0; k <= 10; k++) { const px = -300 + k * 60, py = -60 + i * 30 + 8 * Math.sin(k * 1.3 + i); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(40, 60); ctx.quadraticCurveTo(-20, 140, -90, 150); ctx.quadraticCurveTo(-20, 100, -10, 60); ctx.closePath(); kit.shape(ctx, c, L);
  ctx.beginPath(); ctx.arc(170, 30, 11, 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill();
  ctx.restore();
}

/** Calamar gigante mirando a la izquierda (brazos hacia la izquierda), centrado en (x, y). */
function squid(ctx, kit, x, y, s, t, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s / 100, s / 100);
  const L = 400 / s;
  ctx.strokeStyle = '#b91c1c'; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) { ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-40, -14 + i * 4); for (let k = 1; k <= 6; k++) ctx.lineTo(-40 - k * 14, -14 + i * 4 + (i - 3.5) * k * 2 + 6 * Math.sin(t * 4 + k * 0.8 + i)); ctx.stroke(); }
  for (const sg of [-1, 1]) { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, 0); for (let k = 1; k <= 12; k++) ctx.lineTo(-40 - k * 16, sg * k * 4 + 10 * Math.sin(t * 3 + k * 0.6 + sg)); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(110, -10); ctx.lineTo(155, -42); ctx.lineTo(140, 0); ctx.lineTo(155, 42); ctx.lineTo(110, 10); ctx.closePath(); kit.shape(ctx, '#dc2626', L);
  ctx.beginPath(); ctx.moveTo(-45, -22); ctx.quadraticCurveTo(60, -36, 145, 0); ctx.quadraticCurveTo(60, 36, -45, 22); ctx.closePath(); kit.shape(ctx, '#dc2626', L);
  ctx.beginPath(); ctx.arc(-25, -4, 10, 0, TAU); kit.shape(ctx, '#fef9c3', L * 0.6); ctx.beginPath(); ctx.arc(-25, -4, 4.5, 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill();
  ctx.restore();
}

function boat(ctx, kit, x, y, w) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - w * 0.12); ctx.lineTo(x + w / 2 + w * 0.08, y - w * 0.12); ctx.lineTo(x + w * 0.4, y + w * 0.08); ctx.lineTo(x - w * 0.45, y + w * 0.08); ctx.closePath(); kit.shape(ctx, '#f8fafc', 6);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(x - w * 0.46, y - w * 0.04, w * 0.95, w * 0.035);
  kit.roundRect(ctx, x + w * 0.05, y - w * 0.32, w * 0.3, w * 0.2, 8); kit.shape(ctx, '#e2e8f0', 6);
  ctx.fillStyle = '#7dd3fc'; ctx.fillRect(x + w * 0.1, y - w * 0.27, w * 0.2, w * 0.08);
}

function lighthouse(ctx, kit, x, y, h) {
  ctx.beginPath(); ctx.moveTo(x - h * 0.14, y); ctx.lineTo(x - h * 0.08, y - h); ctx.lineTo(x + h * 0.08, y - h); ctx.lineTo(x + h * 0.14, y); ctx.closePath(); kit.shape(ctx, '#f8fafc', 6);
  ctx.save(); ctx.clip(); ctx.fillStyle = '#dc2626'; for (let i = 0; i < 3; i++) ctx.fillRect(x - h * 0.2, y - h * (0.25 + i * 0.3), h * 0.4, h * 0.12); ctx.restore();
  kit.roundRect(ctx, x - h * 0.1, y - h * 1.12, h * 0.2, h * 0.12, 6); kit.shape(ctx, '#fde047', 5);
  ctx.beginPath(); ctx.moveTo(x - h * 0.12, y - h * 1.12); ctx.lineTo(x, y - h * 1.24); ctx.lineTo(x + h * 0.12, y - h * 1.12); ctx.closePath(); kit.shape(ctx, '#1e293b', 5);
}

/** Interior oscuro de la boca de una ballena jorobada (barbas arriba, lengua abajo). gap: rendija de luz. */
function mouthInside(ctx, o, gap = 0.3) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, '#1c0a0a', '#7f1d1d');
  if (gap > 0) {
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.ellipse(W - 40, 640, 60 * gap + 6, 260 * gap + 20, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#292524'; ctx.fillRect(0, 0, W, 470);
  ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 4;
  for (let x = 10; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x, 380); ctx.lineTo(x + 6 * Math.sin(t * 2 + x), 520 + 15 * Math.sin(x * 0.05)); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(W / 2, 1570, 760, 230, 0, 0, TAU); kit.shape(ctx, '#f472b6', 7);
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, t } = o;
    // Un buzo entre un banco de peces; desde abajo sube una ballena jorobada con la boca abierta.
    sea(ctx, o, '#38bdf8', '#075985');
    bubbles(ctx, o, { n: 10 });
    const rise = kit.ramp(local, 0, 3.6);
    humpback(ctx, kit, 600, 1560 - 360 * rise, 1150, { open: 0.75 + 0.25 * rise, rot: -Math.PI / 2 + 0.12, t });
    school(ctx, o, 560, 700, 260, 140, 22, { seed: 6, pull: 0.35 * rise, px: 600, py: 900 });
    diver(ctx, kit, 450 + 20 * Math.sin(t * 2), 640 + 50 * rise, 220, { rot: 0.15 * Math.sin(t * 1.5), arms: 0.55, eyes: 'wide', kick: Math.sin(t * 8) });
    void W; void H;
  },

  boca(ctx, o) {
    const { kit, local, cue, t } = o;
    // Dentro de la boca: oscuro, agua y peces. La rendija de luz se cierra.
    mouthInside(ctx, o, 1 - kit.ramp(local, 0, 1.6));
    school(ctx, o, 540, 760, 380, 220, 26, { seed: 9, size: 30 });
    const lamp = 0.5 + 0.5 * Math.sin(t * 1.3);
    ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fef9c3';
    ctx.beginPath(); ctx.moveTo(600, 700); ctx.lineTo(1080, 560 + 80 * lamp); ctx.lineTo(1080, 820 + 80 * lamp); ctx.closePath(); ctx.fill(); ctx.restore();
    diver(ctx, kit, 520, 760 + 8 * Math.sin(t * 3), 280, { arms: 0.45, eyes: 'wide', kick: Math.sin(t * 6) });
    label(ctx, kit, 540, 1040, local < cue(1) ? 'DENTRO DE LA BOCA' : (local < cue(2) ? 'ATRAPA TODO LO DE ENFRENTE' : '…INCLUIDO TÚ'), { size: 44, fill: '#fca5a5' });
  },

  garganta(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Tarjeta: el «aro» de su garganta baja por tu cabeza… y se atora en los hombros.
    kit.gradientBG(ctx, W, H, '#e0f2fe', '#7dd3fc');
    humpback(ctx, kit, 230, 430, 340, { t });
    ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = '#be185d'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(283, 444, 30, 0, TAU); ctx.stroke(); ctx.restore();
    kit.text(ctx, 'SU GARGANTA', 240, 540, { size: 40, fill: '#be185d' });
    const ph = 600, sh = FLOOR - ph * 0.76;
    const stuck = local > cue(1) + 0.5;
    const y = 450 + (sh + 14 - 450) * kit.ramp(local, 0.2, cue(1) + 0.5) + (stuck ? 7 * Math.sin(t * 30) * Math.max(0, 1 - (local - cue(1) - 0.5) * 2) : 0);
    const ringC = stuck ? '#ef4444' : '#f472b6';
    const ring = (a0, a1) => { ctx.lineWidth = 30; ctx.strokeStyle = kit.INK; ctx.beginPath(); ctx.ellipse(540, y, 88, 26, 0, a0, a1); ctx.stroke(); ctx.lineWidth = 20; ctx.strokeStyle = ringC; ctx.beginPath(); ctx.ellipse(540, y, 88, 26, 0, a0, a1); ctx.stroke(); };
    ring(Math.PI, TAU);
    kit.person(ctx, 540, FLOOR, ph, { shirt: '#1f2937', pants: '#1f2937', arms: stuck ? 0.05 : 0 });
    ring(0, Math.PI);
    if (local > cue(1)) {
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(250, sh + 95); ctx.lineTo(400, sh + 40); ctx.stroke();
      label(ctx, kit, 220, sh + 120, 'TUS HOMBROS', { size: 36, fill: '#ffffff' });
    }
    if (stuck) label(ctx, kit, 830, 560, '¡NO CABES!', { size: 50, fill: '#fca5a5' });
  },

  escupe(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En la superficie: la ballena saca la cabeza, abre la boca y te escupe lejos.
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#e0f2fe');
    const sea0 = 760;
    const up = kit.ramp(local, 0, cue(1) - 0.1), spit = local > cue(1);
    humpback(ctx, kit, 470, 1170 - 280 * up, 900, { open: spit ? kit.ramp(local, cue(1) - 0.1, cue(1) + 0.15) : 0, rot: -0.75, t });
    ctx.fillStyle = 'rgba(14,116,144,0.92)'; ctx.fillRect(0, sea0, W, H - sea0);
    ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 6;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, sea0 + k * 70 + 10 * Math.sin(x * 0.03 + t * 3 + k)); ctx.stroke(); }
    if (spit) {
      const u = kit.clamp((local - cue(1)) / 0.9);
      const x = 780 - 540 * u, y = 560 - 220 * Math.sin(u * Math.PI) + 170 * u;
      ctx.fillStyle = '#e0f2fe';
      const r = kit.rng(5); for (let i = 0; i < 14; i++) { const d = 40 + r() * 140 * Math.min(1, (local - cue(1)) * 3); const a = -Math.PI * r(); ctx.globalAlpha = Math.max(0, 1 - (local - cue(1)) * 1.2); ctx.beginPath(); ctx.arc(800 + Math.cos(a) * d, 590 + Math.sin(a) * d, 10, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      diver(ctx, kit, x, y, 180, { rot: -u * 5, arms: 0.8, eyes: 'wide' });
      label(ctx, kit, 300, 430, '¡PTUI!', { size: 60, fill: '#fde047' });
    } else label(ctx, kit, 300, 430, 'NO ERES COMIDA', { size: 44, fill: '#bae6fd' });
  },

  packard(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    if (local >= cue(1) && local < cue(2)) {
      // Recuerdo: medio minuto en la boca, respirando con el tanque (burbujas) mientras corre el cronómetro.
      mouthInside(ctx, o, 0);
      bubbles(ctx, o, { n: 10, x0: 480, x1: 600, y0: 450, y1: 700, speed: 260, a: 0.8 });
      diver(ctx, kit, 540, 780 + 6 * Math.sin(t * 3), 300, { arms: 0.3, eyes: 'open' });
      const sec = Math.min(30, Math.floor(30 * kit.ramp(local, cue(1), cue(2) - 0.1)));
      ctx.beginPath(); ctx.arc(850, 560, 110, 0, TAU); kit.shape(ctx, '#ffffff', 7);
      kit.text(ctx, `0:${String(sec).padStart(2, '0')}`, 850, 565, { size: 64, fill: '#0f172a', stroke: null });
      label(ctx, kit, 300, 560, 'RESPIRA CON SU TANQUE', { size: 36, fill: '#fde047' });
      return;
    }
    // Cabo Cod, Estados Unidos: faro, bote y el buzo a salvo.
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#f0f9ff');
    ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.ellipse(170, 830, 320, 90, 0, Math.PI, TAU); ctx.fill();
    lighthouse(ctx, kit, 170, 800, 300);
    ctx.fillStyle = '#0e7490'; ctx.fillRect(0, 820, W, H - 820);
    ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 5; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 860 + k * 70 + 8 * Math.sin(x * 0.03 + t * 2 + k)); ctx.stroke(); }
    const bob = 6 * Math.sin(t * 2);
    const safe = local >= cue(2);
    diver(ctx, kit, 600, 690 + bob, 240, { arms: safe ? 0.9 : 0.15, eyes: 'open', bruise: safe ? 1 : 0 });
    boat(ctx, kit, 650, 840 + bob, 520);
    label(ctx, kit, 760, 420, '2021 · ESTADOS UNIDOS', { size: 40, fill: '#fde047' });
    if (safe) label(ctx, kit, 650, 1050, '¡SOLO GOLPES!', { size: 54, fill: '#4ade80' });
  },

  cachalote(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En lo profundo: un cachalote se traga un calamar gigante entero.
    kit.gradientBG(ctx, W, H, '#0f172a', '#020617');
    const r = kit.rng(13); ctx.fillStyle = 'rgba(226,232,240,0.5)';
    for (let i = 0; i < 50; i++) { const x = r() * W, y = 380 + ((r() * 800 + t * 30 * (0.5 + r())) % 800); ctx.fillRect(x, y, 3, 3); }
    const gulp = kit.clamp((local - cue(1) - 0.2) / 1.0);
    const open = local > cue(1) - 0.2 ? Math.min(1, (local - cue(1) + 0.2) * 3) * (1 - kit.ramp(local, cue(1) + 1.2, cue(1) + 1.6)) : 0;
    spermWhale(ctx, kit, 300, 760, 760, { open, t });
    squid(ctx, kit, 890 - 320 * gulp, 800 - 10 * gulp, 120 * (1 - 0.6 * gulp), t, 1 - kit.ramp(gulp, 0.75, 1));
    label(ctx, kit, 540, 450, 'ÉSTE SÍ PODRÍA', { size: 52, fill: '#fde047' });
    if (local > cue(2)) label(ctx, kit, 540, 1040, 'ADENTRO NO HAY AIRE', { size: 48, fill: '#fca5a5' });
  },
};
