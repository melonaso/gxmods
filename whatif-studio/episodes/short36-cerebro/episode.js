// Short 36: ¿y si pudieras ver lo que tu cerebro te esconde?
// Pregunta al inicio (¿qué te oculta ahora mismo?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// Tu nariz (la borra porque no cambia; cierra un ojo y aparece) → el punto ciego (lo rellena) → al mover los
// ojos apaga la vista (en el espejo no ves tus ojos moverse) → más de media hora al día a ciegas →
// sorpresa: rellena esos huecos con lo que ves después; por eso el primer segundo de un reloj parece más largo.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const SKIN = '#e8b48a';

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.8)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

/** Vista en primera persona (lo que ves) dentro de un marco de 80..1000 × 390..1100: un parque. */
function fpPark(ctx, kit, t) {
  ctx.save(); kit.roundRect(ctx, 60, 390, 960, 710, 40); ctx.clip();
  const g = ctx.createLinearGradient(0, 390, 0, 1100); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#e0f2fe'); ctx.fillStyle = g; ctx.fillRect(60, 390, 960, 710);
  kit.sun(ctx, 860, 480, 50, { t });
  ctx.fillStyle = '#4ade80'; ctx.fillRect(60, 820, 960, 280);
  ctx.fillStyle = '#d6d3d1'; ctx.beginPath(); ctx.moveTo(470, 1100); ctx.lineTo(530, 820); ctx.lineTo(560, 820); ctx.lineTo(680, 1100); ctx.closePath(); ctx.fill();
  for (const [x, h] of [[160, 300], [330, 240], [780, 280], [930, 230]]) kit.tree(ctx, x, 830, h);
  kit.person(ctx, 640, 860, 120, { shirt: '#ef4444' });
  ctx.restore();
}

/** La nariz vista desde adentro: binocular (dos lados tenues) o con un ojo cerrado (un lado claro). */
function fpNose(ctx, a, oneEye = 0) {
  if (a <= 0) return;
  ctx.save(); kit2.roundRect(ctx, 60, 390, 960, 710, 40); ctx.clip();
  const lobe = (cx, alpha) => {
    ctx.globalAlpha = alpha; ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.moveTo(cx - 110, 1100); ctx.quadraticCurveTo(cx - 20, 880, cx + 60, 720); ctx.quadraticCurveTo(cx + 150, 880, cx + 240, 1100); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = '#c2410c'; ctx.beginPath(); ctx.ellipse(cx + 70, 1060, 50, 25, 0, 0, TAU); ctx.fill();
  };
  if (oneEye > 0) { lobe(560, a * (0.35 + 0.6 * oneEye)); }
  else { lobe(330, a * 0.6); lobe(590, a * 0.6); }
  ctx.restore();
}
let kit2;

/** Párpados: viñeta oscura; closeLeft 0..1 tapa la mitad izquierda (un ojo cerrado). */
function lids(ctx, closeLeft = 0) {
  ctx.save(); kit2.roundRect(ctx, 60, 390, 960, 710, 40); ctx.clip();
  const g = ctx.createRadialGradient(540, 745, 250, 540, 745, 620); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = g; ctx.fillRect(60, 390, 960, 710);
  if (closeLeft > 0) { ctx.fillStyle = `rgba(0,0,0,${0.85 * closeLeft})`; ctx.fillRect(60, 390, 300 * closeLeft, 710); }
  ctx.restore();
  ctx.lineWidth = 8; ctx.strokeStyle = '#0b0f1a'; kit2.roundRect(ctx, 60, 390, 960, 710, 40); ctx.stroke();
}

function brain(ctx, kit, cx, cy, R) {
  const blobs = [[-0.45, -0.2, 0.5], [0, -0.38, 0.52], [0.45, -0.2, 0.5], [-0.5, 0.22, 0.45], [0.5, 0.22, 0.45], [0, 0.15, 0.55]];
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R, 0, TAU); }
  ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R - 4, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R - 4, 0, TAU); } ctx.fill();
  ctx.strokeStyle = '#db2777'; ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx - R * 0.5 + i * R * 0.33, cy - R * 0.05, R * 0.18, 0.3, 2.6); ctx.stroke(); }
}

/** Cara grande de frente (para el espejo). gaze: -1 izquierda … 1 derecha. */
function bigFace(ctx, kit, x, y, s, gaze = 0, dim = 0) {
  kit.roundRect(ctx, x - s / 2, y - s / 2, s, s * 1.1, s * 0.22); kit.shape(ctx, SKIN, 7);
  ctx.fillStyle = '#3f2a1d'; kit.roundRect(ctx, x - s / 2, y - s / 2 - 10, s, s * 0.22, s * 0.12); ctx.fill();
  for (const ex of [-0.22, 0.22]) {
    const cx = x + ex * s, cy = y - s * 0.02;
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.12, s * 0.08, 0, 0, TAU); kit.shape(ctx, '#ffffff', 5);
    ctx.beginPath(); ctx.arc(cx + gaze * s * 0.06, cy, s * 0.05, 0, TAU); ctx.fillStyle = '#1e3a8a'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + gaze * s * 0.06, cy, s * 0.025, 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill();
  }
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y + s * 0.05); ctx.lineTo(x - s * 0.06, y + s * 0.22); ctx.lineTo(x + s * 0.04, y + s * 0.24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - s * 0.14, y + s * 0.38); ctx.quadraticCurveTo(x, y + s * 0.44, x + s * 0.14, y + s * 0.38); ctx.stroke();
  if (dim > 0) { ctx.fillStyle = `rgba(2,6,23,${0.9 * dim})`; kit.roundRect(ctx, x - s / 2 - 10, y - s / 2 - 20, s + 20, s * 1.1 + 30, s * 0.22); ctx.fill(); }
}

function stripes(ctx, x, y, w, h, t) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = -10; i < 30; i++) { ctx.fillStyle = i % 2 ? '#fde047' : '#2563eb'; ctx.beginPath(); ctx.moveTo(x + i * 40, y); ctx.lineTo(x + i * 40 + 40, y); ctx.lineTo(x + i * 40 + 40 - h * 0.5, y + h); ctx.lineTo(x + i * 40 - h * 0.5, y + h); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  void t;
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit2 = kit;
    // Lo que ves ahora mismo… con algo que tu cerebro normalmente borra (tu nariz) apareciendo.
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e1b4b');
    fpPark(ctx, kit, t);
    fpNose(ctx, (0.55 + 0.45 * kit.ramp(local, 0, 1.5)) * (0.85 + 0.15 * Math.sin(t * 3)));
    lids(ctx);
    if (local > 1.4) kit.text(ctx, '?', 520, 640, { size: 120, fill: '#fde047' });
  },

  nariz(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit2 = kit;
    if (local < cue(2)) {
      // De perfil: tus ojos miran por encima de tu nariz; el cerebro la borra con una goma.
      kit.gradientBG(ctx, W, H, '#fef3c7', '#fde68a');
      ctx.save(); ctx.translate(380, 760);
      kit.roundRect(ctx, -230, -260, 380, 470, 120); kit.shape(ctx, SKIN, 8);
      ctx.beginPath(); ctx.moveTo(150, -40); ctx.quadraticCurveTo(250, 40, 230, 80); ctx.lineTo(150, 90); ctx.closePath(); kit.shape(ctx, SKIN, 8);
      ctx.fillStyle = '#3f2a1d'; kit.roundRect(ctx, -240, -275, 330, 110, 60); ctx.fill();
      ctx.beginPath(); ctx.ellipse(110, -60, 24, 16, 0, 0, TAU); kit.shape(ctx, '#ffffff', 5); ctx.beginPath(); ctx.arc(122, -60, 9, 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.setLineDash([16, 12]); ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 6;
      for (const dy of [-120, 0, 120]) { ctx.beginPath(); ctx.moveTo(500, 700); ctx.lineTo(1040, 700 + dy * 1.5); ctx.stroke(); }
      ctx.restore();
      const del = local > cue(1);
      if (del) {
        brain(ctx, kit, 830, 480, 80);
        const u = kit.clamp((local - cue(1)) / 1.2);
        ctx.save(); ctx.translate(560 + 40 * Math.sin(t * 14), 820); ctx.rotate(-0.5);
        kit.roundRect(ctx, -50, -30, 100, 60, 10); kit.shape(ctx, '#f472b6', 5); ctx.fillStyle = '#93c5fd'; ctx.fillRect(-50, -30, 34, 60);
        ctx.restore();
        ctx.fillStyle = `rgba(254,243,199,${0.85 * u})`; ctx.beginPath(); ctx.ellipse(590, 805, 70, 70, 0, 0, TAU); ctx.fill();
        label(ctx, kit, 540, 1060, 'NUNCA CAMBIA: LA BORRA', { size: 44, fill: '#fde68a' });
      } else label(ctx, kit, 540, 1060, 'SIEMPRE ESTÁ AHÍ', { size: 46, fill: '#fde68a' });
      return;
    }
    // Primera persona con un ojo cerrado: la nariz aparece clarita.
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e1b4b');
    fpPark(ctx, kit, t);
    const k = kit.ramp(local, cue(2) + 0.1, cue(2) + 0.8);
    fpNose(ctx, 1, k);
    lids(ctx, k);
    if (k >= 1) label(ctx, kit, 640, 470, '¡AHÍ ESTÁ!', { size: 54, fill: '#fde047' });
  },

  punto(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    if (local < cue(1)) {
      // Corte del ojo: por donde sale el nervio no hay sensores (el hueco).
      kit.gradientBG(ctx, W, H, '#ecfeff', '#a5f3fc');
      const cx = 600, cy = 740, R = 280;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); kit.shape(ctx, '#ffffff', 8);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, R - 14, Math.PI * 0.62, Math.PI * 1.38); ctx.stroke();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, R - 14, Math.PI * 0.94, Math.PI * 1.06); ctx.stroke();
      kit.roundRect(ctx, 200, cy - 40, cx - R - 180 + 30, 80, 30); kit.shape(ctx, '#fbbf24', 6);
      ctx.beginPath(); ctx.ellipse(cx + R - 30, cy, 30, 110, 0, 0, TAU); kit.shape(ctx, '#93c5fd', 6);
      ctx.beginPath(); ctx.ellipse(cx + R + 5, cy, 18, 80, 0, 0, TAU); kit.shape(ctx, '#1e3a8a', 5);
      ctx.save(); ctx.strokeStyle = 'rgba(234,179,8,0.8)'; ctx.lineWidth = 6; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 60;
      for (const dy of [-90, 0, 90]) { ctx.beginPath(); ctx.moveTo(1060, cy + dy); ctx.lineTo(cx + R - 30, cy + dy * 0.3); ctx.lineTo(cx - R + 20, cy - dy * 0.9); ctx.stroke(); }
      ctx.restore();
      label(ctx, kit, 330, 600, 'NERVIO', { size: 40, fill: '#fde68a' });
      label(ctx, kit, 330, 900, 'HUECO SIN SENSORES', { size: 40, fill: '#fde047' });
      return;
    }
    // Un dibujo con un hueco… que el cerebro rellena con el patrón de alrededor.
    kit.gradientBG(ctx, W, H, '#1e293b', '#0f172a');
    stripes(ctx, 140, 470, 800, 560, t);
    const fill = kit.ramp(local, cue(1) + 0.4, cue(1) + 1.4);
    ctx.save(); ctx.beginPath(); ctx.arc(540, 750, 110, 0, TAU); ctx.clip();
    ctx.fillStyle = '#0b0f1a'; ctx.fillRect(420, 630, 240, 240);
    ctx.globalAlpha = fill; stripes(ctx, 140, 470, 800, 560, t); ctx.restore();
    ctx.save(); ctx.setLineDash([12, 10]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(540, 750, 112, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = kit.INK; ctx.strokeRect(140, 470, 800, 560);
    label(ctx, kit, 540, 1070, fill >= 1 ? 'RELLENADO' : 'EL HUECO', { size: 48, fill: fill >= 1 ? '#86efac' : '#fca5a5' });
  },

  espejo(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En el baño, frente al espejo: los ojos saltan de lado a lado y en cada salto la vista se apaga.
    kit.gradientBG(ctx, W, H, '#e0f2fe', '#bae6fd');
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let x = 0; x < W; x += 90) for (let y = 380; y < 1100; y += 90) ctx.fillRect(x + 2, y + 2, 86, 86);
    kit.roundRect(ctx, 230, 470, 620, 520, 30); kit.shape(ctx, '#cbd5e1', 10);
    kit.roundRect(ctx, 255, 495, 570, 470, 20); ctx.fillStyle = '#e0f2fe'; ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(300, 580); ctx.lineTo(390, 510); ctx.stroke(); ctx.restore();
    // Mirada que salta cada 0.9 s; durante el salto (0.12 s) la vista está «apagada».
    const ph = t % 0.9, dir = Math.floor(t / 0.9) % 2 ? 1 : -1, moving = ph < 0.12;
    const gaze = moving ? dir * (-1 + 2 * (ph / 0.12)) : dir;
    bigFace(ctx, kit, 540, 720, 300, gaze, moving ? 0.95 : 0);
    // Indicador de vista.
    const on = !moving;
    kit.roundRect(ctx, 400, 380, 280, 76, 38); kit.shape(ctx, on ? '#16a34a' : '#0f172a', 5);
    kit.text(ctx, on ? 'VISTA: ON' : 'VISTA: OFF', 540, 420, { size: 36, fill: '#ffffff', stroke: null });
    if (local > cue(1)) label(ctx, kit, 540, 1040, 'NUNCA LOS VES MOVERSE', { size: 42, fill: '#fde047' });
    void H;
  },

  total(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Un día despierto como barra: cada parpadeo de «vista apagada» es una rayita… y juntas suman más de media hora.
    kit.gradientBG(ctx, W, H, '#fff7ed', '#fed7aa');
    kit.text(ctx, 'TU DÍA', 540, 470, { size: 56, fill: '#7c2d12' });
    kit.roundRect(ctx, 90, 540, 900, 110, 20); kit.shape(ctx, '#ffffff', 7);
    const R = kit.rng(6), gather = kit.ramp(local, cue(1) - 0.6, cue(1) + 0.4);
    for (let i = 0; i < 70; i++) {
      const x0 = 100 + R() * 880, x1 = 150 + (i % 14) * 6, y1 = 830 + Math.floor(i / 14) * 12 * 0;
      const x = x0 + (x1 - x0) * gather, y = 550 + (y1 - 550) * gather;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(x, y, 5, 90 - 30 * gather);
    }
    if (gather > 0.5) {
      kit.roundRect(ctx, 120, 780, 150, 160, 14); ctx.fillStyle = '#0f172a'; ctx.fill();
      label(ctx, kit, 560, 860, '+30 MIN A CIEGAS', { size: 50, fill: '#fca5a5' });
    }
    // Sol que cruza (mañana → noche).
    const u = kit.ramp(local, 0, o.s.dur);
    kit.sun(ctx, 120 + 840 * u, 1000 - 60 * Math.sin(u * Math.PI), 40, { t });
    void W; void H;
  },

  reloj(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En la pared de una oficina: el segundero se «congela» un instante al mirarlo y luego sigue normal.
    kit.gradientBG(ctx, W, H, '#f1f5f9', '#cbd5e1');
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(0, 1000, W, H - 1000);
    const cx = 540, cy = 700, R = 260;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); kit.shape(ctx, '#ffffff', 10);
    ctx.strokeStyle = kit.INK;
    for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, l = i % 5 ? 14 : 34; ctx.lineWidth = i % 5 ? 3 : 7; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20)); ctx.lineTo(cx + Math.cos(a) * (R - 20 - l), cy + Math.sin(a) * (R - 20 - l)); ctx.stroke(); }
    // El primer «tic» después de mirar (cue 1 + 0.9) dura 1.8 s en vez de 1 s.
    const T0 = cue(1) + 0.9;
    let sec;
    if (local < T0) sec = Math.floor(local);
    else if (local < T0 + 1.8) sec = Math.floor(T0) + 1;
    else sec = Math.floor(T0) + 1 + Math.floor(local - T0 - 1.8) + 1;
    const frozen = local >= T0 && local < T0 + 1.8;
    const a = -Math.PI / 2 + (sec / 60) * TAU;
    ctx.strokeStyle = '#334155'; ctx.lineCap = 'round';
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(-Math.PI / 2 + 1.1) * R * 0.45, cy + Math.sin(-Math.PI / 2 + 1.1) * R * 0.45); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(-Math.PI / 2 + 4.2) * R * 0.7, cy + Math.sin(-Math.PI / 2 + 4.2) * R * 0.7); ctx.stroke();
    ctx.strokeStyle = frozen ? '#f97316' : '#ef4444'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill();
    if (frozen) { ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 10); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, R + 20, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (local < cue(1)) label(ctx, kit, 540, 420, 'RELLENA EL HUECO', { size: 46, fill: '#fde047' });
    else if (local >= T0) label(ctx, kit, 540, 420, frozen ? '¿SE CONGELÓ?' : '¡HAZ LA PRUEBA!', { size: 50, fill: frozen ? '#fdba74' : '#86efac' });
    void W;
  },
};
