// Short 28 (sin voz): ¿y si salieras al espacio sin traje?
// Cada escena: lo que pasa + por qué. No explotarías (la piel aguanta) → saca el aire (si no, dañas
// los pulmones) → la saliva burbujea (sin presión el agua hierve a la temperatura del cuerpo) → no te
// congelas rápido (el vacío aísla, como un termo) → ~15 s y te desmayas por falta de oxígeno →
// caso real: NASA 1966 (Jim LeBlanc), se desmayó a los 14 s y sobrevivió → si te rescatan rápido, vives.

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 28); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;

function space(ctx, o, earth = true) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, '#020617', '#0f172a');
  kit.drawStars(ctx, stars, 0.9, t);
  if (earth) {
    const R = 2400, cy = 1150 + R;
    const g = ctx.createRadialGradient(W / 2, cy, R - 10, W / 2, cy, R + 70);
    g.addColorStop(0, 'rgba(125,211,252,0.85)'); g.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, cy, R + 70, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, TAU); ctx.fillStyle = '#1d4ed8'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.ellipse(300, 1210, 260, 50, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(248,250,252,0.85)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(150 + i * 220, 1185 + (i % 2) * 25, 90, 16, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/** Persona sin traje (playera roja). eyes: 'open' o 'x' (desmayada). */
function person(ctx, kit, x, y, h, { rot = 0, arms = 0.4, eyes = 'open', shirt = '#ef4444', sx = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sx);
  kit.person(ctx, 0, 0, h, { shirt, arms });
  if (eyes === 'x') {
    const leg = h * 0.42, body = h * 0.34, head = h * 0.24, ey = -leg - body - head * 0.6;
    ctx.fillStyle = '#e8b48a'; ctx.fillRect(-head * 0.3, ey - 4, head * 0.6, head * 0.24);
    ctx.strokeStyle = kit.INK; ctx.lineWidth = Math.max(3, h * 0.012);
    for (const ex of [-0.18, 0.2]) { const cx = ex * head, cy = ey + head * 0.08, s = head * 0.08; ctx.beginPath(); ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s); ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s); ctx.stroke(); }
  }
  ctx.restore();
}

/** Módulo de la estación con la escotilla abierta a la derecha (hatchX, hatchY). */
function station(ctx, kit, hx, hy) {
  kit.roundRect(ctx, -120, hy - 170, hx + 120, 340, 60); kit.shape(ctx, '#cbd5e1', 7);
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
  for (let x = 40; x < hx - 40; x += 90) { ctx.beginPath(); ctx.moveTo(x, hy - 165); ctx.lineTo(x, hy + 165); ctx.stroke(); }
  for (const wx of [100, 250]) { ctx.beginPath(); ctx.arc(wx, hy - 60, 30, 0, TAU); kit.shape(ctx, '#38bdf8', 5); }
  ctx.fillStyle = '#1d4ed8'; ctx.fillRect(40, hy - 330, 260, 130); ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 3;
  for (let gx = 40; gx <= 300; gx += 52) { ctx.beginPath(); ctx.moveTo(gx, hy - 330); ctx.lineTo(gx, hy - 200); ctx.stroke(); }
  for (let gy = hy - 330; gy <= hy - 200; gy += 43) { ctx.beginPath(); ctx.moveTo(40, gy); ctx.lineTo(300, gy); ctx.stroke(); }
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 5; ctx.strokeRect(40, hy - 330, 260, 130);
  ctx.beginPath(); ctx.moveTo(170, hy - 200); ctx.lineTo(170, hy - 170); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(hx, hy, 40, 120, 0, 0, TAU); kit.shape(ctx, '#0f172a', 7);
  ctx.save(); ctx.translate(hx + 10, hy - 120); ctx.rotate(-0.9); kit.roundRect(ctx, 0, -20, 140, 40, 16); kit.shape(ctx, '#94a3b8', 6); ctx.restore();
}

function crossOut(ctx, x, y, s, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); ctx.restore();
}

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.75)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

function arrow(ctx, x0, y0, x1, y1, col, lw = 10) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1 + Math.cos(a) * lw * 1.8, y1 + Math.sin(a) * lw * 1.8); ctx.lineTo(x1 + Math.cos(a + 2.4) * lw * 2.2, y1 + Math.sin(a + 2.4) * lw * 2.2); ctx.lineTo(x1 + Math.cos(a - 2.4) * lw * 2.2, y1 + Math.sin(a - 2.4) * lw * 2.2); ctx.closePath(); ctx.fill();
}

const SCENES = {
  hook(ctx, o) {
    const { kit, local, t } = o;
    space(ctx, o);
    // La escotilla abierta y una persona en playera que sale flotando.
    station(ctx, kit, 420, 760);
    const k = kit.ramp(local, 0, 3.5);
    person(ctx, kit, 500 + 230 * k, 980 + 20 * Math.sin(t * 1.5), 380, { rot: 0.15 + 0.25 * k, arms: 0.5 + 0.1 * Math.sin(t * 2) });
  },

  explota(ctx, o) {
    const { kit, local, cue, t } = o;
    space(ctx, o);
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.5), sw = 1 + 0.12 * q;
    person(ctx, kit, 540, 1040, 440, { rot: 0.08 * Math.sin(t), arms: 0.55, sx: sw });
    if (local < cue(1)) {
      label(ctx, kit, 540, 440, '¿BOOM?', { size: 80, fill: '#fca5a5' });
      crossOut(ctx, 540, 440, 90, kit.ramp(local, 0.4, 0.6));
    } else {
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, r0 = 210, r1 = 210 + 70 * q; arrow(ctx, 540 + Math.cos(a) * r0, 820 + Math.sin(a) * r0 * 1.2, 540 + Math.cos(a) * r1, 820 + Math.sin(a) * r1 * 1.2, '#fbbf24', 8); }
      label(ctx, kit, 540, 430, 'LA PIEL AGUANTA', { size: 56, fill: '#4ade80' });
    }
  },

  pulmones(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e293b');
    // Torso en corte con los pulmones. Bien: soltar el aire. Mal: aguantarlo (se sobreinflan).
    const bad = local >= cue(1);
    kit.roundRect(ctx, 290, 560, 500, 560, 80); kit.shape(ctx, 'rgba(239,68,68,0.25)', 6, '#fca5a5');
    kit.roundRect(ctx, 470, 440, 140, 140, 30); kit.shape(ctx, 'rgba(232,180,138,0.35)', 5, '#fca5a5');
    const inflate = bad ? 1 + 0.25 * kit.ramp(local, cue(1), cue(1) + 0.6) : 1 - 0.15 * kit.ramp(local, 0.2, 1.2);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(540 + s * 110, 820); ctx.scale(inflate, inflate);
      ctx.beginPath(); ctx.ellipse(0, 0, 95, 170, s * 0.15, 0, TAU); kit.shape(ctx, bad ? '#f87171' : '#f9a8d4', 6);
      ctx.restore();
    }
    if (!bad) {
      for (let i = 0; i < 3; i++) { const u = (t * 1.2 + i / 3) % 1; ctx.globalAlpha = 1 - u; arrow(ctx, 540 + (i - 1) * 40, 500, 540 + (i - 1) * 60, 500 - 120 - 80 * u, '#7dd3fc', 9); ctx.globalAlpha = 1; }
      label(ctx, kit, 540, 330, '✓ SACA EL AIRE', { size: 56, fill: '#4ade80' });
    } else {
      ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 6;
      for (const [x, y] of [[420, 760], [660, 860], [450, 900]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 20); ctx.lineTo(x + 10, y + 45); ctx.lineTo(x + 40, y + 70); ctx.stroke(); }
      label(ctx, kit, 540, 330, '✕ SI LO AGUANTAS', { size: 56, fill: '#fca5a5' });
    }
    void H;
  },

  saliva(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#020617', '#1e1b4b');
    // Acercamiento a la cara: burbujas en la lengua. Termómetro: el punto donde hierve el agua baja.
    kit.roundRect(ctx, 150, 430, 520, 560, 70); kit.shape(ctx, '#e8b48a', 8);
    ctx.fillStyle = kit.INK; ctx.fillRect(260, 560, 50, 60); ctx.fillRect(510, 560, 50, 60);
    ctx.beginPath(); ctx.ellipse(410, 820, 150, 110, 0, 0, TAU); kit.shape(ctx, '#7f1d1d', 7);
    ctx.beginPath(); ctx.ellipse(410, 870, 110, 55, 0, 0, TAU); ctx.fillStyle = '#f472b6'; ctx.fill();
    for (let i = 0; i < 12; i++) { const u = (t * 0.9 + i / 12) % 1, x = 330 + (i * 37) % 160, y = 860 - u * 140; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(x, y, 8 + 10 * u, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = '#e0f2fe'; ctx.stroke(); ctx.globalAlpha = 1; }
    // Termómetro.
    const tx = 860, top = 470, bot = 1010;
    kit.roundRect(ctx, tx - 30, top, 60, bot - top, 30); kit.shape(ctx, '#f8fafc', 6);
    ctx.beginPath(); ctx.arc(tx, bot + 20, 50, 0, TAU); kit.shape(ctx, '#ef4444', 6);
    const body = 820; ctx.fillStyle = '#ef4444'; ctx.fillRect(tx - 16, body, 32, bot - body + 10);
    kit.text(ctx, 'TU CUERPO', tx - 70, body + 30, { size: 30, fill: '#fca5a5', align: 'right' });
    const q = kit.ramp(local, cue(1), cue(1) + 0.8), boilY = 520 + (body - 520) * o.ease.inOut(q);
    ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - 50, boilY); ctx.lineTo(tx + 50, boilY); ctx.stroke();
    kit.text(ctx, 'EL AGUA HIERVE', tx - 70, boilY - 30, { size: 30, fill: '#7dd3fc', align: 'right' });
    void H;
  },

  frio(ctx, o) {
    const { kit, local, cue, t } = o;
    space(ctx, o, false);
    // El calor se queda: aura naranja alrededor de la persona; a la derecha, un termo con su capa de vacío.
    const g = ctx.createRadialGradient(330, 820, 60, 330, 820, 300); g.addColorStop(0, 'rgba(251,146,60,0.55)'); g.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(330, 820, 300, 0, TAU); ctx.fill();
    person(ctx, kit, 330, 1040, 420, { arms: 0.5, rot: 0.05 * Math.sin(t) });
    label(ctx, kit, 330, 560, 'EL CALOR SE QUEDA', { size: 40, fill: '#fdba74' });
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      kit.roundRect(ctx, 700, 660, 220, 380, 40); kit.shape(ctx, '#94a3b8', 7);
      kit.roundRect(ctx, 728, 690, 164, 324, 28); kit.shape(ctx, '#0f172a', 4);
      kit.roundRect(ctx, 748, 712, 124, 284, 20); kit.shape(ctx, '#7c2d12', 4);
      kit.roundRect(ctx, 740, 620, 140, 50, 12); kit.shape(ctx, '#475569', 5);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5; ctx.beginPath(); for (let j = 0; j <= 8; j++) ctx.lineTo(780 + i * 30 + 8 * Math.sin(j + t * 4), 600 - j * 12); ctx.stroke(); }
      kit.text(ctx, 'VACÍO', 810, 1080, { size: 34, fill: '#cbd5e1' });
      label(ctx, kit, 810, 520, 'COMO UN TERMO', { size: 44, fill: '#fde68a' });
      ctx.restore();
    }
  },

  oxigeno(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#020617');
    // Cerebro que se queda sin oxígeno; cuenta regresiva de 15 s y la vista se apaga.
    const cx = 540, cy = 760, R = 210;
    const blobs = [[-0.45, -0.2, 0.5], [0, -0.38, 0.52], [0.45, -0.2, 0.5], [-0.5, 0.22, 0.45], [0.5, 0.22, 0.45], [0, 0.15, 0.55]];
    ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R, 0, TAU); }
    ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = kit.INK; ctx.stroke();
    ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R - 4, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R - 4, 0, TAU); } ctx.fill();
    const k = kit.ramp(local, cue(1), cue(1) + 1.2);
    for (let i = 0; i < 10; i++) { const a = i * 0.63, u = ((t * 0.6 + i / 10) % 1), d = R * 0.6 + u * 260; ctx.globalAlpha = (1 - u) * (1 - k); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 20, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); kit.text(ctx, 'O₂', cx + Math.cos(a) * d, cy + Math.sin(a) * d + 1, { size: 16, fill: '#ffffff', stroke: null }); ctx.globalAlpha = 1; }
    if (local >= cue(1)) {
      const n = Math.max(0, Math.ceil(15 * (1 - k)));
      ctx.beginPath(); ctx.arc(cx, 470, 80, 0, TAU); kit.shape(ctx, '#0f172a', 6, '#facc15');
      ctx.beginPath(); ctx.moveTo(cx, 470); ctx.arc(cx, 470, 72, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - k)); ctx.closePath(); ctx.fillStyle = 'rgba(250,204,21,0.35)'; ctx.fill();
      kit.text(ctx, `${n} s`, cx, 472, { size: 56, fill: '#facc15', stroke: null });
      const v = ctx.createRadialGradient(cx, cy, 500 * (1 - 0.8 * k), cx, cy, 1100);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${0.95 * k})`);
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      if (k >= 1) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H); }
    }
  },

  historia(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#334155', '#475569');
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 1090, W, H - 1090);
    // Cámara de vacío de la NASA con un técnico en traje dentro; afuera, su compañero en el tablero.
    ctx.beginPath(); ctx.arc(430, 780, 300, 0, TAU); kit.shape(ctx, '#94a3b8', 10);
    ctx.beginPath(); ctx.arc(430, 780, 250, 0, TAU); ctx.fillStyle = '#0f172a'; ctx.fill();
    label(ctx, kit, 430, 420, 'NASA · 1966', { size: 48, fill: '#ffffff' });
    const leak = kit.ramp(local, cue(1), cue(1) + 0.8), saved = kit.ramp(local, cue(2) + 0.4, cue(2) + 1.0);
    const fall = leak * (1 - saved);
    ctx.save(); ctx.beginPath(); ctx.arc(430, 780, 248, 0, TAU); ctx.clip();
    ctx.save(); ctx.translate(430 - 150 * fall, 950); ctx.rotate(1.45 * fall); ctx.translate(-430, -950);
    kit.person(ctx, 430, 950, 320, { shirt: '#f1f5f9', pants: '#e2e8f0', skin: '#cbd5e1', arms: saved > 0.5 ? 0.9 : 0.2 });
    ctx.beginPath(); ctx.arc(430, 950 - 320 * 0.88, 52, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(186,230,253,0.8)'; ctx.stroke();
    ctx.restore(); ctx.restore();
    // Luz de alarma y tablero.
    const alarm = leak > 0 && saved < 0.5;
    ctx.beginPath(); ctx.arc(860, 520, 40, 0, TAU); ctx.fillStyle = alarm ? (Math.sin(t * 14) > 0 ? '#ef4444' : '#7f1d1d') : saved > 0.5 ? '#22c55e' : '#475569'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = kit.INK; ctx.stroke();
    kit.roundRect(ctx, 760, 820, 220, 140, 14); kit.shape(ctx, '#1e293b', 6);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#22c55e', '#facc15', '#ef4444'][i % 3]; ctx.beginPath(); ctx.arc(800 + (i % 3) * 70, 860 + Math.floor(i / 3) * 50, 12, 0, TAU); ctx.fill(); }
    kit.person(ctx, 870, 1090, 300, { shirt: '#2563eb', arms: alarm ? 0.9 : 0.3 });
    if (local >= cue(2)) {
      for (let i = 0; i < 4; i++) { const u = ((t * 1.5) + i / 4) % 1; ctx.globalAlpha = (1 - u) * (1 - saved * 0.7); arrow(ctx, 430 - 330 + u * 80, 620 + i * 80, 430 - 260 + u * 80, 620 + i * 80, '#7dd3fc', 7); ctx.globalAlpha = 1; }
      label(ctx, kit, 860, 690, saved > 0.5 ? '¡SOBREVIVIÓ!' : 'METEN AIRE…', { size: 40, fill: saved > 0.5 ? '#4ade80' : '#7dd3fc' });
    } else if (leak > 0.5) label(ctx, kit, 860, 690, 'SE DESMAYA', { size: 40, fill: '#fca5a5' });
    void H;
  },

  rescate(ctx, o) {
    const { kit, local, s, t } = o;
    space(ctx, o);
    station(ctx, kit, 420, 760);
    // Un brazo lo jala de regreso; al final queda en la escotilla, igual que en el primer cuadro.
    const k = o.ease.inOut(kit.ramp(local, 0, s.dur * 0.8));
    const x = 730 - 230 * k;
    person(ctx, kit, x, 980 + 20 * Math.sin(t * 1.5), 380, { rot: 0.4 - 0.25 * k, arms: 0.5 });
    // Cuerda de seguridad que lo jala; desaparece al final para empatar con el primer cuadro.
    ctx.save(); ctx.globalAlpha = 1 - kit.ramp(local, s.dur * 0.8, s.dur * 0.95); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(400, 760); ctx.quadraticCurveTo((420 + x) / 2, 700 + 60 * (1 - k), x, 860); ctx.stroke(); ctx.restore();
  },
};
