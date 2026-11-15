// Short 29: ¿y si te cayera un rayo?
// Pregunta al inicio (¿sobrevivirías?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// Rayo → 5 veces más caliente que el Sol → la corriente corre por fuera de la piel → el sudor se vuelve
// vapor y vuela los zapatos → marcas de helecho que se borran → puede detener el corazón (RCP) →
// 9 de cada 10 sobreviven → Roy Sullivan sobrevivió a 7 rayos.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const FLOOR = 1090;

/** Rayo en zigzag de (x0, y0) a (x1, y1) con ramitas. */
function bolt(ctx, kit, x0, y0, x1, y1, seed = 1, w = 14, a = 1) {
  if (a <= 0) return;
  const R = kit.rng(seed), n = 9, pts = [[x0, y0]];
  for (let i = 1; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + (R() - 0.5) * 120, y0 + (y1 - y0) * u]); }
  pts.push([x1, y1]);
  ctx.save(); ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [lw, col] of [[w * 3, 'rgba(196,181,253,0.45)'], [w, '#fef9c3'], [w * 0.4, '#ffffff']]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  }
  ctx.strokeStyle = '#fef9c3'; ctx.lineWidth = w * 0.4;
  for (let i = 2; i < n - 1; i += 3) { const [bx, by] = pts[i]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (R() - 0.5) * 160, by + 60 + R() * 60); ctx.stroke(); }
  ctx.restore();
}

function storm(ctx, o, lit = 0) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, '#0f172a', '#334155');
  ctx.fillStyle = '#475569';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(80 + i * 160, 400 + (i % 2) * 30, 110, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.ellipse(W / 2, FLOOR + 60, 800, 120, 0, 0, TAU); ctx.fill(); ctx.fillRect(0, FLOOR + 40, W, H);
  ctx.strokeStyle = 'rgba(186,230,253,0.45)'; ctx.lineWidth = 3;
  const r = kit.rng(4);
  for (let i = 0; i < 70; i++) { const x = r() * W, y = ((t * (900 + r() * 400) + r() * 1600) % 800) + 450; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 30); ctx.stroke(); }
  if (lit > 0) { ctx.save(); ctx.globalAlpha = lit; ctx.fillStyle = '#e0e7ff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.8)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

function shoe(ctx, kit, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 0.5, -s * 0.45); ctx.lineTo(-s * 0.1, -s * 0.45); ctx.quadraticCurveTo(s * 0.1, -s * 0.2, s * 0.5, -s * 0.15); ctx.lineTo(s * 0.55, 0); ctx.closePath();
  kit.shape(ctx, '#7c2d12', 5); ctx.fillStyle = '#f8fafc'; ctx.fillRect(-s * 0.5, -s * 0.08, s * 1.05, s * 0.08);
  ctx.restore();
}

function steam(ctx, x, y, r, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < 4; i++) { const u = (t * 0.8 + i / 4) % 1; ctx.globalAlpha = a * (1 - u) * 0.8; ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(x + Math.sin(i * 2 + t) * r * 0.4, y - u * r * 2.5, r * (0.4 + u * 0.6), 0, TAU); ctx.fill(); }
  ctx.restore();
}

/** Helecho rojo (figura de Lichtenberg) que crece con k y se desvanece con a. */
function fern(ctx, x, y, len, ang, depth, k, a) {
  if (depth <= 0 || len < 6 || k <= 0) return;
  const L = len * Math.min(1, k * 1.6), x1 = x + Math.cos(ang) * L, y1 = y + Math.sin(ang) * L;
  ctx.strokeStyle = `rgba(220,38,38,${0.85 * a})`; ctx.lineWidth = Math.max(1.5, depth * 1.6);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.stroke();
  fern(ctx, x1, y1, len * 0.72, ang - 0.45, depth - 1, k - 0.12, a);
  fern(ctx, x1, y1, len * 0.72, ang + 0.4, depth - 1, k - 0.12, a);
}

function heartShape(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.4, y - s, x, y - s * 0.45); ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.3, x, y + s * 0.35); ctx.closePath();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, t } = o;
    // Tormenta: un rayo cae sobre la persona en el cerro (desde el primer medio segundo).
    const P = 0.5, f = kit.impulse(local, P, 0.35);
    storm(ctx, o, 0.6 * f);
    kit.person(ctx, 540, FLOOR, 380, { shirt: '#2563eb', arms: local > P ? 0.9 : 0.15 });
    if (local > P - 0.05 && local < P + 0.45) bolt(ctx, kit, 600, 420, 545, FLOOR - 380, 3, 14, 1 - kit.ramp(local, P + 0.2, P + 0.45));
    if (local > P) { ctx.save(); ctx.globalAlpha = 0.5 * (1 - kit.ramp(local, P, P + 1.2)); const g = ctx.createRadialGradient(540, 900, 20, 540, 900, 300); g.addColorStop(0, '#fef08a'); g.addColorStop(1, 'rgba(254,240,138,0)'); ctx.fillStyle = g; ctx.fillRect(240, 600, 600, 600); ctx.restore(); }
    void W; void H; void t;
  },

  calor(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#431407', '#1c1917');
    // Barra del Sol contra la del rayo (5 veces más alta).
    const k = o.ease.out(kit.ramp(local, 0.2, 1.4)), base = 1060;
    kit.sun(ctx, 300, 780, 70, { t });
    kit.roundRect(ctx, 230, base - 120, 140, 120, 14); kit.shape(ctx, '#f59e0b', 6);
    label(ctx, kit, 300, base + 50, 'SOL', { size: 44 });
    const hR = 600 * k;
    kit.roundRect(ctx, 650, base - hR, 160, hR, 14); kit.shape(ctx, '#fef08a', 6);
    bolt(ctx, kit, 760, base - hR - 220, 720, base - hR - 20, 5, 10, k);
    label(ctx, kit, 730, base + 50, 'RAYO', { size: 44, fill: '#fef08a' });
    if (k > 0.9) kit.text(ctx, '×5', 730, base - hR / 2, { size: 90, fill: '#0f172a', stroke: null });
  },

  piel(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#312e81');
    // La corriente rodea el cuerpo por fuera (sobre la piel mojada) en vez de atravesarlo.
    ctx.save(); ctx.globalAlpha = 0.55; kit.person(ctx, 540, 1120, 620, { shirt: '#64748b', pants: '#334155', skin: '#a8a29e' }); ctx.restore();
    const r = kit.rng(6);
    for (let i = 0; i < 16; i++) { const x = 400 + r() * 280, y = 520 + r() * 520; ctx.fillStyle = 'rgba(125,211,252,0.85)'; ctx.beginPath(); ctx.arc(x, y + 8 * Math.sin(t * 3 + i), 7, 0, TAU); ctx.fill(); }
    const k = kit.ramp(local, 0.2, 1.0);
    ctx.save(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 20; ctx.setLineDash([40, 18]); ctx.lineDashOffset = -t * 300;
    ctx.globalAlpha = k;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(540, 480); ctx.lineTo(540 + s * 85, 500); ctx.lineTo(540 + s * 115, 600); ctx.lineTo(540 + s * 150, 780); ctx.lineTo(540 + s * 110, 900); ctx.lineTo(540 + s * 100, 1120); ctx.stroke();
    }
    ctx.restore();
    if (k > 0.5) { label(ctx, kit, 260, 700, 'POR FUERA', { size: 42, fill: '#fde047' }); label(ctx, kit, 540, 820, 'ADENTRO, POCA', { size: 34, fill: '#cbd5e1' }); }
    void W; void H;
  },

  zapatos(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    storm(ctx, o);
    // Vapor que sale del cuerpo; en la segunda frase los zapatos salen volando.
    const P = cue(1) + 0.15;
    kit.person(ctx, 540, FLOOR, 420, { shirt: '#2563eb', arms: 0.4 });
    steam(ctx, 430, 900, 45, t, 0.9); steam(ctx, 650, 890, 45, t + 0.3, 0.9); steam(ctx, 540, 1060, 50, t + 0.6, 0.8);
    if (local < P) { shoe(ctx, kit, 500, FLOOR, 110, 0); shoe(ctx, kit, 585, FLOOR, 110, 0); }
    else {
      const u = kit.clamp((local - P) / 1.2);
      shoe(ctx, kit, 500 - 330 * u, FLOOR - 520 * u + 600 * u * u, 110, -u * 7);
      shoe(ctx, kit, 585 + 330 * u, FLOOR - 560 * u + 620 * u * u, 110, u * 8);
      label(ctx, kit, 540, 560, '¡PUM!', { size: 70, fill: '#fde047' });
    }
    void W; void H;
  },

  marcas(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#7c2d12', '#c2410c');
    // Brazo de cerca: crece el «helecho» rojo y luego se borra.
    kit.roundRect(ctx, -40, 640, W + 80, 300, 150); kit.shape(ctx, '#e8b48a', 8);
    const grow = kit.ramp(local, 0.2, 1.6), fade = 1 - 0.85 * kit.ramp(local, cue(1) + 0.6, cue(1) + 1.8);
    ctx.save(); kit.roundRect(ctx, -40, 640, W + 80, 300, 150); ctx.clip();
    for (const [x, y, ang] of [[120, 760, -0.35], [120, 820, 0.35], [470, 740, -0.3], [470, 840, 0.3], [800, 770, -0.25], [800, 830, 0.3]]) fern(ctx, x, y, 90, ang, 6, grow, fade);
    ctx.restore();
    if (local > cue(1)) label(ctx, kit, 540, 1000, fade < 0.6 ? 'SE BORRA EN DÍAS' : 'VASITOS DE SANGRE', { size: 44, fill: '#fde68a' });
  },

  corazon(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1f2937', '#111827');
    // El corazón se detiene (línea plana); con la RCP vuelve a latir.
    const stop = local > 0.4 && local < cue(1) + 0.6, beat = stop ? 1 : 1 + 0.08 * Math.max(0, Math.sin(t * 9));
    ctx.save(); ctx.translate(540, 720); ctx.scale(beat * 1.6, beat * 1.6); heartShape(ctx, 0, 0, 200); kit.shape(ctx, stop ? '#6b7280' : '#ef4444', 8); ctx.restore();
    ctx.strokeStyle = stop ? '#9ca3af' : '#4ade80'; ctx.lineWidth = 7; ctx.beginPath();
    for (let x = 60; x <= 1020; x += 6) { const ph = ((x / 300 + t * 1.5) % 1); const y = stop ? 1000 : 1000 - (ph > 0.45 && ph < 0.5 ? 120 : ph > 0.5 && ph < 0.55 ? -60 : 0); x === 60 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    if (local >= cue(1)) {
      const push = Math.abs(Math.sin(t * 7)) * 30;
      for (const dx of [-55, 55]) { kit.roundRect(ctx, 540 + dx - 85, 560 + push, 170, 120, 40); kit.shape(ctx, '#e8b48a', 7); }
      label(ctx, kit, 540, 440, 'RCP', { size: 64, fill: '#4ade80' });
    } else if (stop) label(ctx, kit, 540, 440, 'SE DETIENE', { size: 56, fill: '#fca5a5' });
    void W; void H;
  },

  respuesta(ctx, o) {
    const { W, H, kit, local } = o;
    kit.gradientBG(ctx, W, H, '#064e3b', '#065f46');
    // 10 personas: 9 se ponen verdes con palomita.
    for (let i = 0; i < 10; i++) {
      const c = i % 5, r = Math.floor(i / 5), x = 160 + c * 190, y = 820 + r * 300;
      const ok = i < 9 && local > 0.5 + i * 0.08;
      kit.person(ctx, x, y, 240, { shirt: ok ? '#22c55e' : '#6b7280', pants: '#1f2937', arms: ok ? 0.8 : 0 });
      if (ok) kit.text(ctx, '✓', x, y - 280, { size: 60, fill: '#bbf7d0' });
    }
    label(ctx, kit, 540, 430, '9 DE CADA 10 SOBREVIVEN', { size: 52, fill: '#bbf7d0' });
    void W; void H;
  },

  sullivan(ctx, o) {
    const { kit, local, cue, t } = o;
    // El guardabosques bajo la tormenta; van cayendo rayos y se cuentan hasta 7.
    const strikes = Math.min(7, Math.floor(kit.ramp(local, 0.2, cue(1) + 0.4) * 7 + 1e-6));
    const ph = (local * 3.2) % 1, flash = strikes < 7 ? Math.max(0, 1 - ph * 3) * 0.4 : kit.impulse(local, cue(1) + 0.3, 0.4) * 0.6;
    storm(ctx, o, flash);
    kit.person(ctx, 540, FLOOR, 400, { shirt: '#166534', pants: '#78350f', arms: 0.25 + 0.6 * kit.ramp(local, cue(1) + 0.3, cue(1) + 0.6) });
    kit.roundRect(ctx, 540 - 90, FLOOR - 400 - 18, 180, 26, 10); kit.shape(ctx, '#92400e', 4);
    kit.roundRect(ctx, 540 - 50, FLOOR - 400 - 60, 100, 50, 14); kit.shape(ctx, '#92400e', 4);
    if (strikes < 7 && ph < 0.25) bolt(ctx, kit, 560, 420, 545, FLOOR - 430, 10 + strikes, 12, 1);
    for (let i = 0; i < 7; i++) { const on = i < strikes; ctx.save(); ctx.globalAlpha = on ? 1 : 0.25; bolt(ctx, kit, 130 + i * 136, 440, 120 + i * 136, 510, 20 + i, 6, 1); ctx.restore(); }
    label(ctx, kit, 540, 570, `ROY SULLIVAN: ${strikes} ${strikes === 1 ? 'RAYO' : 'RAYOS'}`, { size: 46, fill: '#fde047' });
    void t;
  },
};
