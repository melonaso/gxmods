// Short 37: ¿y si pudieras hacerte cosquillas a ti mismo?
// Pregunta al inicio (¿por qué no puedes?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// El cerebro predice lo que vas a sentir y le baja el volumen → las cosquillas necesitan sorpresa →
// una teoría: alarma de zonas débiles (te ríes aunque no quieras) → 1999, Londres: un robot que copiaba tu
// mano con un retraso pequeño sí daba cosquillas → sorpresa: las ratas también se ríen (ultrasonido).

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const FLOOR = 1090;
const SKIN = '#e8b48a';

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.8)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

/** Pluma: cañón curvo con barbas, punta en (x, y). */
function feather(ctx, kit, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.35, -s * 0.3, s * 1.0, -s * 0.1); ctx.quadraticCurveTo(s * 0.5, s * 0.25, 0, 0); ctx.closePath(); kit.shape(ctx, '#f0abfc', 4);
  ctx.strokeStyle = '#a21caf'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.06); ctx.quadraticCurveTo(s * 0.45, -s * 0.05, s * 1.0, -s * 0.1); ctx.stroke();
  ctx.lineWidth = 2; for (let i = 1; i < 7; i++) { const u = i / 7; ctx.beginPath(); ctx.moveTo(s * u, -s * 0.03 * u); ctx.lineTo(s * u - s * 0.08, -s * 0.18); ctx.moveTo(s * u, -s * 0.03 * u); ctx.lineTo(s * u - s * 0.08, s * 0.1); ctx.stroke(); }
  ctx.restore();
}

/** Cara cuadrada: mood 'meh' (aburrido) | 'laugh' (carcajada) | 'wide'. */
function face(ctx, kit, x, y, s, mood = 'meh', t = 0) {
  kit.roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.2); kit.shape(ctx, SKIN, 6);
  ctx.fillStyle = '#3f2a1d'; kit.roundRect(ctx, x - s / 2, y - s / 2 - 6, s, s * 0.2, s * 0.1); ctx.fill();
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const ex of [-0.22, 0.22]) {
    const cx = x + ex * s, cy = y - s * 0.06;
    if (mood === 'laugh') { ctx.beginPath(); ctx.arc(cx, cy + s * 0.03, s * 0.07, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else if (mood === 'meh') { ctx.beginPath(); ctx.moveTo(cx - s * 0.08, cy); ctx.lineTo(cx + s * 0.08, cy); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy + s * 0.02, s * 0.035, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0, TAU); kit.shape(ctx, '#ffffff', 4); ctx.beginPath(); ctx.arc(cx, cy, s * 0.035, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill(); }
  }
  if (mood === 'laugh') {
    ctx.beginPath(); ctx.moveTo(x - s * 0.22, y + s * 0.14); ctx.quadraticCurveTo(x, y + s * (0.5 + 0.04 * Math.sin(t * 20)), x + s * 0.22, y + s * 0.14); ctx.closePath(); kit.shape(ctx, '#7f1d1d', 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - s * 0.16, y + s * 0.15, s * 0.32, s * 0.06);
  } else { ctx.beginPath(); ctx.moveTo(x - s * 0.14, y + s * 0.24); ctx.lineTo(x + s * 0.14, y + s * 0.24); ctx.stroke(); }
}

function jaja(ctx, kit, x, y, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i / 3) % 1; ctx.globalAlpha = a * (1 - u); kit.text(ctx, 'JA', x + (i - 1) * 70 + 10 * Math.sin(t * 10 + i), y - u * 120, { size: 44 + i * 6, fill: '#fde047' }); }
  ctx.restore();
}

function brain(ctx, kit, cx, cy, R) {
  const blobs = [[-0.45, -0.2, 0.5], [0, -0.38, 0.52], [0.45, -0.2, 0.5], [-0.5, 0.22, 0.45], [0.5, 0.22, 0.45], [0, 0.15, 0.55]];
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R, 0, TAU); }
  ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R - 4, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R - 4, 0, TAU); } ctx.fill();
  ctx.strokeStyle = '#db2777'; ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx - R * 0.5 + i * R * 0.33, cy - R * 0.05, R * 0.18, 0.3, 2.6); ctx.stroke(); }
}

/** Rata de lado mirando a la derecha. */
function rat(ctx, kit, x, y, s, t, belly = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25 * belly);
  ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.05); ctx.quadraticCurveTo(-s * 1.0, s * 0.1 + 20 * Math.sin(t * 4), -s * 1.25, -s * 0.15); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.35, 0, 0, TAU); kit.shape(ctx, '#9ca3af', 6);
  ctx.beginPath(); ctx.ellipse(s * 0.05, s * 0.12, s * 0.4, s * 0.18, 0, 0, TAU); ctx.fillStyle = '#e5e7eb'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.25); ctx.quadraticCurveTo(s * 0.95, -s * 0.05, s * 0.9, s * 0.05); ctx.quadraticCurveTo(s * 0.6, s * 0.2, s * 0.35, s * 0.15); ctx.closePath(); kit.shape(ctx, '#9ca3af', 6);
  ctx.beginPath(); ctx.arc(s * 0.4, -s * 0.3, s * 0.13, 0, TAU); kit.shape(ctx, '#f9a8d4', 5);
  ctx.beginPath(); ctx.arc(s * 0.9, s * 0.03, s * 0.05, 0, TAU); ctx.fillStyle = '#ec4899'; ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.62, -s * 0.06, s * 0.04, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
  for (const fx of [-0.3, 0.25]) { ctx.beginPath(); ctx.ellipse(fx * s, s * 0.33, s * 0.08, s * 0.05, 0, 0, TAU); kit.shape(ctx, '#f9a8d4', 4); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, t } = o;
    // En la sala: alguien se pasa una pluma por la panza… y nada. Cara de aburrido.
    kit.gradientBG(ctx, W, H, '#fde68a', '#fcd34d');
    ctx.fillStyle = 'rgba(217,119,6,0.15)'; for (let x = 0; x < W; x += 80) ctx.fillRect(x, 380, 36, FLOOR - 380);
    ctx.fillStyle = '#a16207'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    kit.person(ctx, 540, FLOOR, 560, { shirt: '#2563eb', arms: 0.12 });
    face(ctx, kit, 540, FLOOR - 560 + 70, 150, 'meh', t);
    const wig = Math.sin(t * 9);
    const fx = 520 + 40 * wig, fy = 780 + 20 * Math.cos(t * 9);
    feather(ctx, kit, fx, fy, 200, -0.4 + 0.2 * wig);
    ctx.beginPath(); ctx.arc(fx, fy, 26, 0, TAU); kit.shape(ctx, SKIN, 5);
    kit.text(ctx, '…', 720, 470, { size: 90, fill: '#78350f' });
    void local;
  },

  prediccion(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Dentro de tu cabeza: el cerebro ve venir tu mano y baja la perilla del volumen.
    kit.gradientBG(ctx, W, H, '#ede9fe', '#c4b5fd');
    brain(ctx, kit, 540, 640, 190);
    kit.roundRect(ctx, 650, 380, 360, 120, 30); kit.shape(ctx, '#ffffff', 6);
    ctx.beginPath(); ctx.moveTo(700, 498); ctx.lineTo(660, 560); ctx.lineTo(760, 498); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
    kit.text(ctx, 'YA SÉ LO QUE VIENE', 830, 442, { size: 34, fill: '#4c1d95', stroke: null });
    // Perilla de volumen.
    const down = kit.ramp(local, cue(1), cue(1) + 0.6), ang = -2.2 + 3.4 * (1 - down) * 0.8;
    const kx = 540, ky = 960;
    ctx.beginPath(); ctx.arc(kx, ky, 90, 0, TAU); kit.shape(ctx, '#1f2937', 7);
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(ang) * 70, ky + Math.sin(ang) * 70); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = -2.6 + i * 0.75, on = i / 7 <= (1 - down) * 0.9 + 0.1; ctx.fillStyle = on ? '#22c55e' : '#94a3b8'; ctx.beginPath(); ctx.arc(kx + Math.cos(a) * 125, ky + Math.sin(a) * 125, 12, 0, TAU); ctx.fill(); }
    kit.text(ctx, 'VOLUMEN', kx + 250, ky + 10, { size: 40, fill: '#4c1d95' });
    kit.text(ctx, 'TU MANO', 150, 900, { size: 34, fill: '#4c1d95' });
    // Mano que se acerca (la tuya).
    const hx = 150 + 60 * Math.sin(t * 2);
    kit.roundRect(ctx, hx - 60, 760, 120, 90, 40); kit.shape(ctx, SKIN, 6);
    ctx.save(); ctx.setLineDash([12, 10]); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx + 60, 790); ctx.quadraticCurveTo(300, 680, 380, 660); ctx.stroke(); ctx.restore();
    void H;
  },

  sorpresa(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En el sillón, dos casos: si otro te toca por sorpresa, carcajada; si tú sabes cuándo, nada.
    kit.gradientBG(ctx, W, H, '#dcfce7', '#86efac');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(536, 380, 8, 720);
    kit.text(ctx, 'OTRO', 270, 440, { size: 46, fill: '#166534' });
    kit.text(ctx, 'TÚ', 810, 440, { size: 46, fill: '#166534' });
    // Izquierda: alguien más con la pluma.
    kit.person(ctx, 230, FLOOR - 40, 420, { shirt: '#ef4444', arms: 0.05 });
    face(ctx, kit, 230, FLOOR - 40 - 420 + 55, 115, 'laugh', t);
    feather(ctx, kit, 300 + 20 * Math.sin(t * 12), 800, 150, -2.6 + 0.2 * Math.sin(t * 12));
    kit.person(ctx, 440, FLOOR - 40, 300, { shirt: '#16a34a', arms: 0.3 });
    jaja(ctx, kit, 230, 560, t);
    // Derecha: tú mismo.
    kit.person(ctx, 810, FLOOR - 40, 420, { shirt: '#2563eb', arms: 0.12 });
    face(ctx, kit, 810, FLOOR - 40 - 420 + 55, 115, 'meh', t);
    feather(ctx, kit, 790 + 25 * Math.sin(t * 9), 800, 150, -0.5);
    if (local > cue(1)) label(ctx, kit, 540, 1060, 'SIN SORPRESA, NO HAY COSQUILLAS', { size: 38, fill: '#fde047' });
    void H;
  },

  alarma(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Silueta del cuerpo con las zonas débiles parpadeando como alarma.
    kit.gradientBG(ctx, W, H, '#1f2937', '#111827');
    ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; for (let y = 380; y < 1100; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.restore();
    const wr = local > cue(1) ? 0.08 * Math.sin(t * 22) : 0;
    ctx.save(); ctx.translate(540, FLOOR); ctx.rotate(wr); ctx.translate(-540, -FLOOR);
    kit.person(ctx, 540, FLOOR, 620, { shirt: '#64748b', pants: '#475569', arms: 0.35 });
    if (local > cue(1)) face(ctx, kit, 540, FLOOR - 620 + 75, 150, 'laugh', t);
    ctx.restore();
    const blink = 0.5 + 0.5 * Math.sin(t * 10), on = kit.ramp(local, 0.4, 1.0);
    const zones = [[540, FLOOR - 435, 'CUELLO'], [470, FLOOR - 330, 'COSTILLAS'], [610, FLOOR - 330, ''], [410, FLOOR - 390, 'AXILAS'], [520, FLOOR - 10, 'PIES']];
    for (const [x, y, name] of zones) {
      ctx.fillStyle = `rgba(239,68,68,${on * (0.35 + 0.5 * blink)})`; ctx.beginPath(); ctx.arc(x, y, 38, 0, TAU); ctx.fill();
      if (name && on > 0.5) { const lx = x < 540 ? 210 : 880; ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, y); ctx.stroke(); label(ctx, kit, lx, y, name, { size: 32, fill: '#fca5a5' }); }
    }
    if (local > cue(1)) jaja(ctx, kit, 760, 560, t);
    label(ctx, kit, 540, 420, 'ALARMA: ZONAS DÉBILES', { size: 44, fill: '#fca5a5' });
    void H;
  },

  robot(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Laboratorio, Londres 1999: mueves una palanca y un brazo robot copia tu movimiento con retraso.
    kit.gradientBG(ctx, W, H, '#f8fafc', '#e2e8f0');
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, FLOOR - 30, W, H - FLOOR + 30);
    const late = local > cue(1), works = local > cue(2);
    const mv = Math.sin(t * 4), mvLate = Math.sin((t - (late ? 0.2 : 0)) * 4);
    // Persona sentada a la izquierda con palanca.
    kit.person(ctx, 280, FLOOR - 30, 420, { shirt: '#f97316', arms: 0.18 });
    face(ctx, kit, 280, FLOOR - 30 - 420 + 55, 115, works ? 'laugh' : 'meh', t);
    kit.roundRect(ctx, 360, 930, 120, 40, 10); kit.shape(ctx, '#334155', 5);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(420, 930); ctx.lineTo(420 + 40 * mv, 870); ctx.stroke(); ctx.beginPath(); ctx.arc(420 + 40 * mv, 865, 16, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill();
    // Brazo robot a la derecha que llega a la panza con la pluma.
    const bx = 860, by = FLOOR - 30;
    kit.roundRect(ctx, bx - 70, by - 60, 140, 60, 12); kit.shape(ctx, '#64748b', 6);
    const j1 = [bx, by - 60], a1 = -Math.PI / 2 - 0.35, l1 = 260, j2 = [j1[0] + Math.cos(a1) * l1, j1[1] + Math.sin(a1) * l1];
    const a2 = Math.PI + 0.25 + 0.25 * mvLate, l2 = 300, tip = [j2[0] + Math.cos(a2) * l2, j2[1] + Math.sin(a2) * l2];
    ctx.strokeStyle = '#475569'; ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(...j1); ctx.lineTo(...j2); ctx.lineTo(...tip); ctx.stroke();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(...j1); ctx.lineTo(...j2); ctx.lineTo(...tip); ctx.stroke();
    for (const p of [j1, j2]) { ctx.beginPath(); ctx.arc(p[0], p[1], 24, 0, TAU); kit.shape(ctx, '#f59e0b', 5); }
    feather(ctx, kit, tip[0] - 10, tip[1], 150, Math.PI - 0.2 + 0.2 * mvLate);
    label(ctx, kit, 540, 420, '1999 · LONDRES', { size: 44, fill: '#ffffff' });
    if (late) {
      kit.roundRect(ctx, 630, 470, 330, 110, 24); kit.shape(ctx, '#0f172a', 6);
      kit.text(ctx, 'RETRASO', 795, 500, { size: 28, fill: '#cbd5e1', stroke: null });
      kit.text(ctx, '0.2 s', 795, 548, { size: 50, fill: '#fde047', stroke: null });
    }
    if (works) { jaja(ctx, kit, 280, 560, t); label(ctx, kit, 540, 1060, '¡SÍ DA COSQUILLAS!', { size: 50, fill: '#86efac' }); }
    void W; void H;
  },

  ratas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En una jaula de laboratorio: una mano le hace cosquillas a una rata; se «ríe» en ultrasonido.
    kit.gradientBG(ctx, W, H, '#fef9c3', '#fde68a');
    ctx.fillStyle = '#d6d3d1'; ctx.fillRect(0, 1000, W, H - 1000);
    ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 6; for (let x = 60; x < W; x += 70) { ctx.beginPath(); ctx.moveTo(x, 420); ctx.lineTo(x, 1000); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(30, 420); ctx.lineTo(W - 30, 420); ctx.stroke();
    const tick = Math.sin(t * 14);
    rat(ctx, kit, 480, 900, 300, t, 0.3 + 0.1 * tick);
    // Mano con dedos que hacen cosquillas.
    ctx.save(); ctx.translate(560 + 15 * tick, 760);
    kit.roundRect(ctx, -10, -60, 160, 90, 40); kit.shape(ctx, SKIN, 6);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(10 + i * 34, 25); ctx.rotate(0.3 * Math.sin(t * 14 + i)); kit.roundRect(ctx, -12, 0, 24, 60, 12); kit.shape(ctx, SKIN, 5); ctx.restore(); }
    ctx.restore();
    // Ondas de ultrasonido (risa) que salen de la rata.
    const on = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.3);
    for (let i = 0; i < 4; i++) { const u = (t * 1.2 + i / 4) % 1; ctx.strokeStyle = `rgba(124,58,237,${on * (1 - u)})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(760, 880, 40 + u * 220, -0.7, 0.7); ctx.stroke(); }
    if (on > 0) {
      ctx.save(); ctx.globalAlpha = on;
      ctx.beginPath(); ctx.ellipse(880, 540, 50, 70, 0, 0, TAU); kit.shape(ctx, SKIN, 6);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(820, 470); ctx.lineTo(940, 610); ctx.stroke();
      ctx.restore();
      label(ctx, kit, 540, 1060, 'RISA ULTRASÓNICA', { size: 50, fill: '#c4b5fd' });
    } else label(ctx, kit, 540, 1060, '¿COSQUILLAS?', { size: 50, fill: '#fde68a' });
    void W; void H;
  },
};
