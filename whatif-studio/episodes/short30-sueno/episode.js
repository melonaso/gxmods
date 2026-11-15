// Short 30: ¿y si dejaras de dormir?
// 24 h: manejas como borracho (reflejos lentos) → 48 h: microsueños → día 3: alucinaciones → por qué:
// dormido, el cerebro se limpia y guarda lo aprendido → récord: 11 días (1964, un estudiante de 17
// años) → durmió 14 horas y despertó bien → los delfines duermen con medio cerebro.

let stars;
export function setup(C) { stars = C.kit.makeStars(160, C.W, C.H, 30); }

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

/** Cara grande (para la cama y los acercamientos): eyes 'open' | 'wide' | 'closed' | 'half'. */
function face(ctx, kit, x, y, s, eyes = 'open', mouth = 'flat') {
  kit.roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.2); kit.shape(ctx, '#e8b48a', 6);
  for (const ex of [-0.22, 0.22]) {
    const cx = x + ex * s, cy = y - s * 0.08;
    if (eyes === 'closed') { ctx.strokeStyle = kit.INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else {
      const r = eyes === 'wide' ? s * 0.12 : s * 0.09;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); kit.shape(ctx, '#ffffff', 4);
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
      if (eyes === 'half') { ctx.fillStyle = '#e8b48a'; ctx.fillRect(cx - r - 3, cy - r - 3, r * 2 + 6, r + 3); ctx.strokeStyle = kit.INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke(); }
      if (eyes === 'wide') { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - r * 0.9, cy + (k - 1) * r * 0.4); ctx.lineTo(cx - r * 0.5, cy + (k - 1) * r * 0.3); ctx.stroke(); } }
    }
  }
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 6; ctx.beginPath();
  if (mouth === 'smile') ctx.arc(x, y + s * 0.15, s * 0.15, 0.2, Math.PI - 0.2); else { ctx.moveTo(x - s * 0.12, y + s * 0.25); ctx.lineTo(x + s * 0.12, y + s * 0.25); }
  ctx.stroke();
}

function zzz(ctx, kit, x, y, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; ctx.globalAlpha = a * (1 - u); kit.text(ctx, 'Z', x + i * 40 + u * 30, y - u * 120, { size: 40 + i * 14, fill: '#e0e7ff' }); }
  ctx.restore();
}

function clock(ctx, kit, x, y, r, hours) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); kit.shape(ctx, '#ffffff', 6);
  const a = -Math.PI / 2 + (hours % 12) / 12 * TAU, m = -Math.PI / 2 + (hours % 1) * TAU;
  ctx.strokeStyle = kit.INK; ctx.lineCap = 'round';
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(m) * r * 0.8, y + Math.sin(m) * r * 0.8); ctx.stroke();
}

/** Recámara de noche con cama; eyes del que está acostado. */
function bedroom(ctx, o, { eyes = 'wide', sun = 0, sleeping = false } = {}) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, sun > 0 ? '#fde68a' : '#1e1b4b', sun > 0 ? '#fef3c7' : '#312e81');
  kit.roundRect(ctx, 680, 430, 280, 260, 12); kit.shape(ctx, sun > 0 ? '#7dd3fc' : '#0f172a', 8);
  if (sun > 0) kit.sun(ctx, 820, 600, 50, { t }); else { ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(860, 510, 34, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
  kit.roundRect(ctx, 80, 860, 640, 230, 20); kit.shape(ctx, '#2563eb', 7);
  kit.roundRect(ctx, 60, 760, 60, 330, 14); kit.shape(ctx, '#78350f', 6);
  kit.roundRect(ctx, 120, 800, 200, 90, 30); kit.shape(ctx, '#f8fafc', 6);
  face(ctx, kit, 230, 780, 150, eyes, sleeping ? 'smile' : 'flat');
  kit.roundRect(ctx, 300, 830, 420, 120, 30); kit.shape(ctx, '#93c5fd', 6);
}

const SCENES = {
  hook(ctx, o) {
    const { kit, t } = o;
    // De noche, en la cama, con los ojos bien abiertos. El reloj avanza.
    bedroom(ctx, o, { eyes: 'wide' });
    clock(ctx, kit, 860, 820, 90, 3 + t * 0.5);
  },

  h24(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');
    // Carretera vista desde arriba: el coche zigzaguea porque reacciona tarde.
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 450, W, 650);
    ctx.fillStyle = '#334155'; ctx.fillRect(330, 450, 420, 650);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 10; ctx.setLineDash([60, 40]); ctx.lineDashOffset = -t * 600;
    ctx.beginPath(); ctx.moveTo(540, 450); ctx.lineTo(540, 1100); ctx.stroke(); ctx.setLineDash([]);
    const x = 540 + 150 * Math.sin(t * 2.2) * kit.ramp(local, 0.3, 1.0);
    ctx.save(); ctx.translate(x, 860); ctx.rotate(0.35 * Math.cos(t * 2.2) * kit.ramp(local, 0.3, 1.0));
    kit.roundRect(ctx, -60, -110, 120, 220, 30); kit.shape(ctx, '#ef4444', 6);
    kit.roundRect(ctx, -45, -70, 90, 60, 12); kit.shape(ctx, '#bae6fd', 4);
    ctx.restore();
    label(ctx, kit, 200, 520, '24 H', { size: 54, fill: '#fde047' });
    if (local > cue(1)) label(ctx, kit, 540, 1040, 'REFLEJOS LENTOS', { size: 44, fill: '#fca5a5' });
    else label(ctx, kit, 540, 1040, 'COMO BORRACHO', { size: 44, fill: '#fca5a5' });
  },

  h48(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#e2e8f0', '#cbd5e1');
    // En el escritorio: la cabeza cae un instante (microsueño) y se levanta de golpe.
    ctx.fillStyle = '#92400e'; ctx.fillRect(140, 900, 800, 40); ctx.fillRect(180, 940, 30, 150); ctx.fillRect(870, 940, 30, 150);
    kit.roundRect(ctx, 600, 760, 260, 150, 10); kit.shape(ctx, '#0f172a', 6);
    const nod = local > cue(1) - 0.1 && local < cue(1) + 0.9;
    const drop = nod ? Math.sin(kit.clamp((local - cue(1) + 0.1) / 1.0) * Math.PI) : 0;
    ctx.save(); ctx.translate(380, 700 + 120 * drop); ctx.rotate(0.5 * drop);
    face(ctx, kit, 0, 0, 230, drop > 0.3 ? 'closed' : 'half', 'flat');
    ctx.restore();
    kit.roundRect(ctx, 290, 830, 180, 80, 20); kit.shape(ctx, '#64748b', 5);
    if (drop > 0.3) zzz(ctx, kit, 410, 590, t);
    label(ctx, kit, 200, 520, '48 H', { size: 54, fill: '#1d4ed8', bg: 'rgba(255,255,255,0.9)' });
    if (local > cue(1)) label(ctx, kit, 720, 560, drop > 0.3 ? 'CEREBRO: OFF' : 'MICROSUEÑO', { size: 44, fill: drop > 0.3 ? '#fca5a5' : '#1d4ed8', bg: 'rgba(255,255,255,0.9)' });
    void W; void H;
  },

  dia3(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#0f172a');
    // Un pasillo oscuro: sombras con ojos y una pared que «se derrite». No están ahí de verdad.
    ctx.fillStyle = '#312e81'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    const w = kit.ramp(local, 0.3, 1.2);
    ctx.save(); ctx.globalAlpha = 0.85 * w;
    for (let i = 0; i < 3; i++) {
      const x = 680 + i * 120 + 20 * Math.sin(t * 2 + i), y = 700 + 60 * Math.sin(t * 1.5 + i * 2);
      ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.ellipse(x, y, 70, 160 + 20 * Math.sin(t * 3 + i), 0, 0, TAU); ctx.fill();
      for (const ex of [-18, 18]) { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x + ex, y - 70, 9, 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 8;
    for (let k = 0; k < 6; k++) { ctx.beginPath(); for (let x = 0; x <= 520; x += 20) ctx.lineTo(x, 470 + k * 90 + 25 * Math.sin(x * 0.02 + t * 3 + k)); ctx.stroke(); }
    ctx.restore();
    kit.person(ctx, 330, FLOOR, 400, { shirt: '#f97316', arms: 0.85 });
    label(ctx, kit, 200, 400, 'DÍA 3', { size: 54, fill: '#fde047' });
    label(ctx, kit, 790, 990, 'NO ESTÁN AHÍ', { size: 42, fill: '#c4b5fd' });
  },

  porque(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Cerebro: dormido, el líquido azul se lleva la «basura»; despierto, se acumula.
    const awake = local >= cue(1);
    kit.gradientBG(ctx, W, H, awake ? '#7f1d1d' : '#0c4a6e', '#0f172a');
    const cx = 540, cy = 760, R = 230;
    const blobs = [[-0.45, -0.2, 0.5], [0, -0.38, 0.52], [0.45, -0.2, 0.5], [-0.5, 0.22, 0.45], [0.5, 0.22, 0.45], [0, 0.15, 0.55]];
    ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R, 0, TAU); }
    ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = kit.INK; ctx.stroke();
    ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(cx + bx * R + br * R - 4, cy + by * R); ctx.arc(cx + bx * R, cy + by * R, br * R - 4, 0, TAU); } ctx.fill();
    const r = kit.rng(30);
    for (let i = 0; i < 26; i++) {
      const x0 = cx + (r() - 0.5) * 360, y0 = cy + (r() - 0.5) * 300;
      if (!awake) { const u = (t * 0.5 + r()) % 1; ctx.globalAlpha = 1 - u; ctx.fillStyle = '#64748b'; ctx.fillRect(x0 + u * 300, y0 + u * 200, 16, 16); ctx.globalAlpha = 1; }
      else { const k = kit.clamp((local - cue(1)) * 2 - i * 0.05); if (k > 0) { ctx.fillStyle = '#7f1d1d'; ctx.fillRect(x0, y0, 18, 18); } }
    }
    if (!awake) {
      ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = 10;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 300; x <= 780; x += 20) ctx.lineTo(x, cy - 120 + k * 120 + 20 * Math.sin(x * 0.03 + t * 4)); ctx.stroke(); }
      label(ctx, kit, 540, 470, 'DORMIDO: SE LIMPIA', { size: 46, fill: '#7dd3fc' });
    } else label(ctx, kit, 540, 470, 'DESPIERTO: SE SATURA', { size: 46, fill: '#fca5a5' });
  },

  record(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#fef3c7', '#fde68a');
    // Calendario que pasa los días hasta llegar a 11.
    const d = Math.max(1, Math.min(11, Math.floor(1 + 10 * kit.ramp(local, 0.2, cue(1) + 0.4))));
    kit.roundRect(ctx, 520, 520, 420, 460, 30); kit.shape(ctx, '#ffffff', 8);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(524, 524, 412, 110);
    kit.text(ctx, 'DÍAS DESPIERTO', 730, 580, { size: 40, fill: '#ffffff', stroke: null });
    kit.text(ctx, `${d}`, 730, 800, { size: 240, fill: '#0f172a', stroke: null });
    kit.person(ctx, 290, FLOOR, 420, { shirt: '#16a34a', arms: d >= 11 ? 0.9 : 0.15 });
    label(ctx, kit, 290, 520, '1964 · 17 AÑOS', { size: 40, fill: '#0f172a', bg: 'rgba(255,255,255,0.9)' });
    if (d >= 11) label(ctx, kit, 730, 1040, '¡RÉCORD!', { size: 50, fill: '#16a34a', bg: 'rgba(255,255,255,0.9)' });
    void W; void H;
  },

  durmio(ctx, o) {
    const { kit, local, cue, t } = o;
    // Duerme 14 horas (el reloj gira) y despierta de buenas con el sol.
    const woke = local > cue(1);
    bedroom(ctx, o, { eyes: woke ? 'open' : 'closed', sun: woke ? 1 : 0, sleeping: true });
    clock(ctx, kit, 860, 820, 90, 22 + 14 * kit.ramp(local, 0, cue(1)));
    if (!woke) zzz(ctx, kit, 300, 700, t); else label(ctx, kit, 400, 600, '¡COMO NUEVO!', { size: 50, fill: '#16a34a', bg: 'rgba(255,255,255,0.9)' });
    label(ctx, kit, 200, 400, '14 HORAS', { size: 50, fill: '#fde047' });
  },

  delfines(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#0369a1', '#082f49');
    // Bajo el agua: un delfín nada mientras la mitad de su cerebro duerme (se alternan).
    for (let i = 0; i < 8; i++) { const u = (t * 0.3 + i / 8) % 1; ctx.fillStyle = 'rgba(186,230,253,0.4)'; ctx.beginPath(); ctx.arc(100 + i * 120, 1100 - u * 700, 10, 0, TAU); ctx.fill(); }
    const x = 540 + 80 * Math.sin(t), y = 880 + 30 * Math.sin(t * 2);
    ctx.save(); ctx.translate(x, y);
    // Delfín: frente redonda («melón»), pico corto, panza clara, aleta curva y sonrisa.
    const body = '#7c9cbf';
    ctx.beginPath(); ctx.moveTo(-255, 0); ctx.lineTo(-335, -55 + 20 * Math.sin(t * 5)); ctx.quadraticCurveTo(-300, 0, -335, 55 + 20 * Math.sin(t * 5)); ctx.closePath(); kit.shape(ctx, body, 6);
    ctx.beginPath(); ctx.moveTo(-40, -82); ctx.quadraticCurveTo(-10, -150, -70, -175); ctx.quadraticCurveTo(10, -150, 50, -78); ctx.closePath(); kit.shape(ctx, body, 6);
    ctx.beginPath(); ctx.moveTo(-260, 0);
    ctx.bezierCurveTo(-150, -95, 60, -110, 160, -70);
    ctx.bezierCurveTo(220, -95, 250, -45, 235, -22);
    ctx.lineTo(320, -12); ctx.quadraticCurveTo(330, 4, 315, 10); ctx.lineTo(225, 14);
    ctx.bezierCurveTo(120, 75, -120, 70, -260, 0); ctx.closePath(); kit.shape(ctx, body, 7);
    ctx.save(); ctx.clip(); ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.ellipse(20, 55, 230, 45, 0.05, 0, TAU); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(30, 35); ctx.quadraticCurveTo(-10, 90, -60, 95); ctx.quadraticCurveTo(-20, 60, -10, 35); ctx.closePath(); kit.shape(ctx, body, 5);
    ctx.strokeStyle = kit.INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(235, 0); ctx.quadraticCurveTo(275, 8, 310, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(175, -35, 10, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
    ctx.restore();
    // Medio cerebro despierto, medio dormido.
    const left = Math.sin(t * 1.2) > 0, cx = 540, cy = 520, R = 120;
    for (const s of [-1, 1]) {
      const on = (s < 0) === left;
      ctx.beginPath(); ctx.ellipse(cx + s * R * 0.5, cy, R * 0.5, R * 0.75, 0, 0, TAU); kit.shape(ctx, on ? '#f9a8d4' : '#475569', 6);
      if (!on) zzz(ctx, kit, cx + s * R * 0.5 - 20, cy - 40, t, 0.9);
    }
    kit.text(ctx, left ? 'DESPIERTO · DORMIDO' : 'DORMIDO · DESPIERTO', cx, cy + R + 40, { size: 34, fill: '#e0f2fe' });
    void W; void H; void local;
  },
};
