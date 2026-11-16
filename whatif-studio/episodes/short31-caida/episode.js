// Short 31: ¿y si cayeras de un avión sin paracaídas?
// Pregunta al inicio (¿hay forma de sobrevivir?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// 10 km: −50 °C y casi sin oxígeno → te desmayas → abajo el aire es más espeso → despiertas → el aire te frena
// (no pasas de ~200 km/h) → ~3 minutos de caída → nieve, árboles o pendiente te frenan poco a poco →
// 1972: una azafata cayó 10 km dentro de un pedazo del avión y sobrevivió → sigue siendo récord mundial.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.8)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

/** Nube esponjosa centrada en (x, y). */
function cloud(ctx, x, y, s, a = 1, color = '#ffffff') {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath();
  for (const [dx, dy, r] of [[-0.55, 0.1, 0.38], [-0.15, -0.15, 0.5], [0.3, -0.05, 0.42], [0.65, 0.15, 0.3], [0.05, 0.2, 0.4]]) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  ctx.fill(); ctx.restore();
}

/** Nubes que suben (porque tú caes). speed en px/s. */
function risingClouds(ctx, o, { speed = 500, a = 0.9, n = 6, seed = 3, color = '#ffffff', y0 = 350, y1 = 1250 } = {}) {
  const { W, kit, t } = o, r = kit.rng(seed), span = y1 - y0 + 400;
  for (let i = 0; i < n; i++) {
    const x = r() * W, s = 110 + r() * 120, off = r() * span;
    const y = y1 + 200 - ((off + t * speed * (0.7 + r() * 0.6)) % span);
    cloud(ctx, x, y, s, a, color);
  }
}

/** Avión de pasajeros de lado, centrado en (x, y); mira a la derecha. */
function plane(ctx, kit, x, y, s, { broken = 0 } = {}) {
  ctx.save(); ctx.translate(x, y);
  // Ala de atrás y cola.
  ctx.beginPath(); ctx.moveTo(-0.05 * s, -0.04 * s); ctx.lineTo(-0.3 * s, -0.32 * s); ctx.lineTo(-0.18 * s, -0.32 * s); ctx.lineTo(0.12 * s, -0.04 * s); ctx.closePath(); kit.shape(ctx, '#94a3b8', 5);
  ctx.beginPath(); ctx.moveTo(-0.42 * s, -0.04 * s); ctx.lineTo(-0.56 * s, -0.3 * s); ctx.lineTo(-0.46 * s, -0.3 * s); ctx.lineTo(-0.3 * s, -0.06 * s); ctx.closePath(); kit.shape(ctx, '#ef4444', 5);
  // Fuselaje (si broken > 0 se separa la cola).
  const gap = broken * 0.12 * s;
  kit.roundRect(ctx, -0.5 * s - gap, -0.08 * s, 0.36 * s, 0.16 * s, 0.06 * s); kit.shape(ctx, '#f8fafc', 6);
  ctx.beginPath(); ctx.moveTo(-0.14 * s + gap, -0.08 * s); ctx.lineTo(0.42 * s + gap, -0.08 * s); ctx.quadraticCurveTo(0.58 * s + gap, -0.06 * s, 0.6 * s + gap, 0.02 * s);
  ctx.quadraticCurveTo(0.56 * s + gap, 0.08 * s, 0.42 * s + gap, 0.08 * s); ctx.lineTo(-0.14 * s + gap, 0.08 * s); ctx.closePath(); kit.shape(ctx, '#f8fafc', 6);
  ctx.fillStyle = '#38bdf8'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-0.06 * s + gap + i * 0.075 * s, -0.02 * s, 0.018 * s, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(0.5 * s + gap, -0.05 * s); ctx.lineTo(0.56 * s + gap, -0.02 * s); ctx.lineTo(0.5 * s + gap, -0.02 * s); ctx.closePath(); ctx.fillStyle = '#0f172a'; ctx.fill();
  // Ala de enfrente.
  ctx.beginPath(); ctx.moveTo(0.0 * s + gap, 0.02 * s); ctx.lineTo(-0.2 * s + gap, 0.3 * s); ctx.lineTo(-0.08 * s + gap, 0.3 * s); ctx.lineTo(0.18 * s + gap, 0.03 * s); ctx.closePath(); kit.shape(ctx, '#cbd5e1', 5);
  ctx.restore();
}

/**
 * Persona cayendo boca abajo con brazos y piernas abiertos (vista de frente), centrada en (x, y).
 * eyes: 'open' | 'x' | 'wide' | 'closed'. frost: 0..1 escarcha azul.
 */
function faller(ctx, kit, x, y, h, { rot = 0, eyes = 'open', frost = 0, shirt = '#f97316', flap = 0 } = {}) {
  const L = Math.max(3, h * 0.03), w = h * 0.3;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const limb = (px, py, ang, len, col) => { ctx.save(); ctx.translate(px, py); ctx.rotate(ang); kit.roundRect(ctx, -w * 0.13, 0, w * 0.26, len, h * 0.03); kit.shape(ctx, col, L); ctx.restore(); };
  // Piernas abiertas hacia abajo, brazos hacia arriba (como paracaidista); flap = aleteo del viento.
  limb(-w * 0.25, h * 0.12, 0.45 + flap * 0.08, h * 0.42, '#1e293b');
  limb(w * 0.25, h * 0.12, -0.45 - flap * 0.08, h * 0.42, '#1e293b');
  limb(-w * 0.45, -h * 0.12, 2.3 - flap * 0.1, h * 0.34, shirt);
  limb(w * 0.45, -h * 0.12, -2.3 + flap * 0.1, h * 0.34, shirt);
  kit.roundRect(ctx, -w / 2, -h * 0.18, w, h * 0.34, h * 0.04); kit.shape(ctx, shirt, L);
  const hs = h * 0.24, hy = -h * 0.18 - hs * 0.95;
  kit.roundRect(ctx, -hs / 2, hy, hs, hs, hs * 0.2); kit.shape(ctx, frost > 0.5 ? '#bfdbfe' : '#e8b48a', L);
  // Pelo alborotado por el viento (hacia arriba).
  ctx.fillStyle = '#3f2a1d'; ctx.fillRect(-hs / 2, hy - hs * 0.12, hs, hs * 0.2);
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-hs / 2 + i * hs / 3.5, hy - hs * 0.1); ctx.lineTo(-hs / 2 + i * hs / 3.5 + hs * 0.08, hy - hs * 0.35 - flap * hs * 0.08); ctx.lineTo(-hs / 2 + i * hs / 3.5 + hs * 0.22, hy - hs * 0.1); ctx.fill(); }
  const ey = hy + hs * 0.42;
  ctx.strokeStyle = kit.INK; ctx.fillStyle = kit.INK; ctx.lineCap = 'round';
  for (const ex of [-0.22, 0.22]) {
    const cx = ex * hs;
    if (eyes === 'x') { ctx.lineWidth = L * 1.2; const r = hs * 0.08; ctx.beginPath(); ctx.moveTo(cx - r, ey - r); ctx.lineTo(cx + r, ey + r); ctx.moveTo(cx + r, ey - r); ctx.lineTo(cx - r, ey + r); ctx.stroke(); }
    else if (eyes === 'closed') { ctx.lineWidth = L * 1.2; ctx.beginPath(); ctx.moveTo(cx - hs * 0.08, ey); ctx.lineTo(cx + hs * 0.08, ey); ctx.stroke(); }
    else { const r = eyes === 'wide' ? hs * 0.1 : hs * 0.07; ctx.beginPath(); ctx.arc(cx, ey, r, 0, TAU); kit.shape(ctx, '#ffffff', L * 0.8); ctx.beginPath(); ctx.arc(cx, ey, r * 0.45, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill(); }
  }
  // Boca: abierta (grito) si está despierto, plana si está desmayado.
  ctx.lineWidth = L;
  if (eyes === 'wide' || eyes === 'open') { ctx.beginPath(); ctx.ellipse(0, hy + hs * 0.75, hs * 0.1, hs * 0.08 + (eyes === 'wide' ? hs * 0.04 : 0), 0, 0, TAU); ctx.fillStyle = '#7f1d1d'; ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-hs * 0.1, hy + hs * 0.75); ctx.lineTo(hs * 0.1, hy + hs * 0.75); ctx.stroke(); }
  // Escarcha: puntos blancos sobre el cuerpo.
  if (frost > 0) {
    const r = kit.rng(9); ctx.fillStyle = `rgba(224,242,254,${0.9 * frost})`;
    for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * w * 1.6, -h * 0.5 + r() * h, 3 + r() * 5, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

/** Líneas de viento verticales que suben (porque caes). */
function windUp(ctx, o, { n = 22, speed = 1800, color = 'rgba(255,255,255,0.6)', x0 = 0, x1 = null, y0 = 380, y1 = 1200, lw = 5 } = {}) {
  const { W, kit, t } = o, r = kit.rng(12), X1 = x1 ?? W, span = y1 - y0 + 300;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (X1 - x0), L = 80 + r() * 200, off = r() * span, v = speed * (0.7 + r() * 0.6);
    const y = y1 + 150 - ((off + t * v) % span);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + L); ctx.stroke();
  }
  ctx.restore();
}

/** Flecha gruesa de (x, y0) a (x, y1). */
function arrow(ctx, kit, x, y0, y1, color, w = 46) {
  const d = Math.sign(y1 - y0), head = w * 1.3;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y0); ctx.lineTo(x + w / 2, y0); ctx.lineTo(x + w / 2, y1 - d * head); ctx.lineTo(x + w, y1 - d * head);
  ctx.lineTo(x, y1); ctx.lineTo(x - w, y1 - d * head); ctx.lineTo(x - w / 2, y1 - d * head); ctx.closePath();
  kit.shape(ctx, color, 6);
}

/** Montaña nevada con pinos: base en y, cima en (px, py). */
function snowyMountain(ctx, kit, W, H, base, px, py) {
  ctx.beginPath(); ctx.moveTo(-50, base); ctx.lineTo(px, py); ctx.lineTo(W + 50, base + 120); ctx.lineTo(W + 50, H); ctx.lineTo(-50, H); ctx.closePath(); kit.shape(ctx, '#f1f5f9', 7);
  ctx.beginPath(); ctx.moveTo(px - 70, py + 70); ctx.lineTo(px, py); ctx.lineTo(px + 90, py + 60); ctx.lineTo(px + 40, py + 90); ctx.lineTo(px, py + 60); ctx.lineTo(px - 30, py + 95); ctx.closePath(); ctx.fillStyle = '#cbd5e1'; ctx.fill();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, t } = o;
    // Cielo azul: el avión sigue de largo y alguien cae dando vueltas debajo.
    kit.gradientBG(ctx, W, H, '#0ea5e9', '#bae6fd');
    risingClouds(ctx, o, { speed: 420, a: 0.85, seed: 5, y0: 420 });
    plane(ctx, kit, 300 + local * 90, 560 - local * 10, 480);
    const fy = 660 + Math.min(1, local / 1.2) * 260;
    faller(ctx, kit, 480 + local * 25, fy, 300, { rot: local * 2.4, eyes: 'wide', flap: Math.sin(t * 18) });
    windUp(ctx, o, { n: 10, x0: 320, x1: 700, y0: fy + 120, y1: 1250, speed: 1500 });
  },

  frio(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Muy arriba: cielo casi negro, escarcha, termómetro a −50 °C y oxígeno casi vacío. Luego se desmaya.
    kit.gradientBG(ctx, W, H, '#0b1026', '#1e3a8a');
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; const r = kit.rng(7); for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(r() * W, 380 + r() * 500, 2 + r() * 2, 0, TAU); ctx.fill(); }
    risingClouds(ctx, o, { speed: 300, a: 0.25, seed: 8, y0: 900 });
    const out = local > cue(1) + 0.3;
    faller(ctx, kit, 330, 820 + 10 * Math.sin(t * 3), 330, { rot: out ? 0.5 : 0.1 * Math.sin(t * 2), eyes: out ? 'x' : 'wide', frost: kit.ramp(local, 0.3, 1.5), flap: Math.sin(t * 16) });
    // Termómetro.
    const fill = 1 - 0.85 * kit.ramp(local, 0.2, 1.2);
    kit.roundRect(ctx, 760, 500, 70, 360, 35); kit.shape(ctx, '#f8fafc', 6);
    ctx.beginPath(); ctx.arc(795, 880, 55, 0, TAU); kit.shape(ctx, '#3b82f6', 6);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(780, 840 - 320 * fill, 30, 320 * fill + 10);
    label(ctx, kit, 795, 985, '−50 °C', { size: 48, fill: '#93c5fd' });
    // Barra de oxígeno.
    const o2 = 1 - 0.85 * kit.ramp(local, 0.6, cue(1));
    kit.roundRect(ctx, 120, 540, 380, 60, 30); kit.shape(ctx, '#1e293b', 6);
    kit.roundRect(ctx, 128, 548, Math.max(30, 364 * o2), 44, 22); ctx.fillStyle = o2 < 0.3 ? '#ef4444' : '#22c55e'; ctx.fill();
    kit.text(ctx, 'OXÍGENO', 310, 500, { size: 40, fill: '#e2e8f0' });
    label(ctx, kit, 540, 410, '10 KM DE ALTURA', { size: 46, fill: '#fde047' });
    if (out) label(ctx, kit, 540, 1065, 'SE DESMAYA', { size: 46, fill: '#fca5a5' });
  },

  despiertas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Más abajo: el cielo se aclara y el aire se llena de puntitos (más aire = más oxígeno). Abre los ojos.
    const k = kit.ramp(local, 0, cue(1));
    kit.gradientBG(ctx, W, H, '#1e3a8a', '#60a5fa');
    ctx.save(); ctx.globalAlpha = k; kit.gradientBG(ctx, W, H, '#2563eb', '#93c5fd'); ctx.restore();
    const r = kit.rng(21), n = Math.floor(30 + 140 * k);
    ctx.fillStyle = 'rgba(219,234,254,0.75)';
    for (let i = 0; i < n; i++) { const x = r() * W, y = 380 + ((r() * 900 - t * 600 * (0.5 + r())) % 900 + 900) % 900; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
    const awake = local > cue(1);
    faller(ctx, kit, 420, 800 + 10 * Math.sin(t * 3), 360, { rot: awake ? 0 : 0.5 * (1 - k), eyes: awake ? 'wide' : 'x', frost: 1 - k, flap: Math.sin(t * 16) });
    // Altímetro que baja.
    const km = Math.max(4, Math.round(10 - 6 * kit.ramp(local, 0.1, cue(1) + 0.4)));
    kit.roundRect(ctx, 720, 470, 240, 160, 24); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, `${km} KM`, 840, 555, { size: 64, fill: '#fde047', stroke: null });
    kit.text(ctx, 'ALTURA', 840, 430, { size: 34, fill: '#e0f2fe' });
    label(ctx, kit, 540, 1065, 'AIRE MÁS ESPESO', { size: 44, fill: '#bfdbfe' });
    if (awake) kit.text(ctx, '¡!', 560, 560, { size: 110, fill: '#fde047', stroke: kit.INK });
  },

  velocidad(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // El peso jala hacia abajo; el aire empuja hacia arriba. Cuando se igualan, ya no aceleras.
    kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');
    risingClouds(ctx, o, { speed: 900, a: 0.8, seed: 11, y0: 380 });
    windUp(ctx, o, { n: 26, speed: 2200, color: 'rgba(255,255,255,0.7)' });
    const cx = 400, cy = 780;
    faller(ctx, kit, cx, cy + 6 * Math.sin(t * 9), 340, { eyes: 'wide', flap: Math.sin(t * 20) });
    const up = 270 * kit.ramp(local, 0.3, cue(1) + 0.6);
    arrow(ctx, kit, cx + 260, cy - 20, cy + 250, '#ef4444');
    arrow(ctx, kit, cx - 260, cy + 20, cy + 20 - Math.max(40, up), '#22c55e');
    kit.text(ctx, 'PESO', cx + 260, cy + 300, { size: 36, fill: '#ef4444' });
    kit.text(ctx, 'AIRE', cx - 260, cy + 70, { size: 36, fill: '#16a34a' });
    // Velocímetro que se queda en 200.
    const v = Math.round(200 * kit.ramp(local, 0.1, cue(1) + 0.2));
    const gx = 830, gy = 640, R = 130;
    ctx.beginPath(); ctx.arc(gx, gy, R, Math.PI, TAU); ctx.lineTo(gx + R, gy + 20); ctx.lineTo(gx - R, gy + 20); ctx.closePath(); kit.shape(ctx, '#0f172a', 6);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(gx, gy, R - 22, Math.PI + 0.8 * Math.PI, TAU - 0.02); ctx.stroke();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4;
    for (let i = 0; i <= 5; i++) { const b = Math.PI + (i / 5) * Math.PI; ctx.beginPath(); ctx.moveTo(gx + Math.cos(b) * (R - 10), gy + Math.sin(b) * (R - 10)); ctx.lineTo(gx + Math.cos(b) * (R - 30), gy + Math.sin(b) * (R - 30)); ctx.stroke(); }
    const a = Math.PI + (v / 250) * Math.PI;
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * R * 0.78, gy + Math.sin(a) * R * 0.78); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx, gy, 14, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill();
    label(ctx, kit, gx, gy + 80, `${v} KM/H`, { size: 44, fill: '#fde047' });
    if (local > cue(1)) label(ctx, kit, 540, 430, 'YA NO ACELERAS', { size: 50, fill: '#fde047' });
  },

  tiempo(ctx, o) {
    const { W, H, kit, local, t } = o;
    // Cronómetro: tres minutos de caída mientras el suelo (campos y un río) se acerca.
    const k = kit.ramp(local, 0.1, Math.max(1, o.s.dur - 0.3));
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#e0f2fe');
    // Suelo visto desde arriba (campos y un río) que se agranda: te acercas. La bruma se va.
    ctx.save(); ctx.translate(540, 760); const z = 0.35 + 1.6 * k * k; ctx.scale(z, z);
    ctx.fillStyle = '#86efac'; ctx.fillRect(-4000, -6000, 8000, 12000);
    const cols = ['#4ade80', '#bef264', '#22c55e', '#a3e635', '#65a30d'], rr = kit.rng(77);
    for (let i = -18; i < 18; i++) for (let j = -26; j < 26; j++) { ctx.fillStyle = cols[Math.floor(rr() * 5)]; ctx.fillRect(i * 220 + 10, j * 170 + 10, 200, 150); }
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 60; ctx.beginPath(); ctx.moveTo(-4000, 300); ctx.bezierCurveTo(-1200, -400, 600, 900, 4000, 100); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = `rgba(186,230,253,${0.75 * (1 - k)})`; ctx.fillRect(0, 0, W, H);
    risingClouds(ctx, o, { speed: 700, a: 0.85, seed: 14, y0: 380, y1: 1000 });
    faller(ctx, kit, 300, 640 + 6 * Math.sin(t * 9), 260, { eyes: 'open', flap: Math.sin(t * 20) });
    // Cronómetro.
    const secs = Math.floor(180 * k), mm = Math.floor(secs / 60), ss = secs % 60;
    ctx.beginPath(); ctx.arc(780, 600, 150, 0, TAU); kit.shape(ctx, '#ffffff', 8);
    kit.roundRect(ctx, 750, 420, 60, 40, 8); kit.shape(ctx, '#64748b', 6);
    ctx.beginPath(); ctx.moveTo(780, 600); ctx.arc(780, 600, 130, -Math.PI / 2, -Math.PI / 2 + TAU * (secs / 180)); ctx.closePath(); ctx.fillStyle = 'rgba(249,115,22,0.35)'; ctx.fill();
    kit.text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 780, 605, { size: 80, fill: '#0f172a', stroke: null });
    void W;
  },

  opcion(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Pendiente nevada con pinos: al caer en diagonal, la nieve y las ramas frenan de a poco.
    kit.gradientBG(ctx, W, H, '#93c5fd', '#e0f2fe');
    ctx.beginPath(); ctx.moveTo(-50, 520); ctx.lineTo(W + 50, 1150); ctx.lineTo(W + 50, H); ctx.lineTo(-50, H); ctx.closePath(); kit.shape(ctx, '#f8fafc', 7);
    for (const [x, h] of [[120, 200], [300, 230], [880, 200], [1000, 180]]) kit.tree(ctx, x, 520 + (x + 50) * (630 / 1180) + 10, h, { pine: true, leaf: '#166534' });
    // Recorrido: entra arriba y se desliza por la pendiente, cada vez más lento (con nieve que salta).
    const u = kit.ramp(local, 0.2, o.s.dur - 0.2), e = 1 - Math.pow(1 - u, 2.2);
    const drop = kit.ramp(local, 0, 0.45), x = 360 + 420 * e, ys = 520 + (x + 50) * (630 / 1180) - 40;
    const y = 300 + (ys - 300) * drop, land = local > 0.45;
    if (land) {
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 26; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(370, 520 + 420 * (630 / 1180) - 20); ctx.lineTo(x, y + 30); ctx.stroke();
      const r = kit.rng(31), sp = 1 - e;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 14; i++) { const a = r() * Math.PI, d = (t * 300 + r() * 120) % 120; ctx.globalAlpha = sp; ctx.beginPath(); ctx.arc(x - 60 - Math.cos(a) * d, y + 10 - Math.sin(a) * d, 8, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    faller(ctx, kit, x, y, 220, { rot: -1.0, eyes: e > 0.9 ? 'closed' : 'wide', flap: (1 - e) * Math.sin(t * 20) });
    label(ctx, kit, 540, 420, 'NIEVE · ÁRBOLES · PENDIENTE', { size: 42, fill: '#1e3a8a', bg: 'rgba(255,255,255,0.9)' });
    if (local > cue(1)) label(ctx, kit, 640, 600, 'FRENAR POCO A POCO', { size: 42, fill: '#16a34a', bg: 'rgba(255,255,255,0.9)' });
  },

  vesna(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // 1972: el avión se rompe en el aire; un pedazo del fuselaje cae sobre una montaña nevada.
    const k = kit.ramp(local, 0.2, cue(1) + 2.8);
    kit.gradientBG(ctx, W, H, '#334155', '#94a3b8');
    snowyMountain(ctx, kit, W, H, 1030, 760, 760);
    for (const [x, h] of [[120, 170], [260, 210], [940, 150]]) kit.tree(ctx, x, 1040 + (x < 760 ? (760 - x) * -0.0 : 0), h, { pine: true, leaf: '#14532d' });
    // Cola y alas que se alejan (arriba) y el pedazo con la azafata que baja.
    const br = kit.ramp(local, 0, 0.8);
    ctx.save(); ctx.globalAlpha = 1 - kit.ramp(local, 1.2, 2.4);
    plane(ctx, kit, 600 + local * 60, 470 - local * 20, 420, { broken: br * 2 });
    ctx.restore();
    const px = 380 + 200 * k, py = 520 + 470 * k;
    const landed = local > cue(1) + 2.8;
    ctx.save(); ctx.translate(px, py); ctx.rotate(landed ? 0.35 : 0.4 + 0.4 * Math.sin(t * 2) * (1 - k));
    ctx.beginPath(); ctx.moveTo(-120, -50); ctx.lineTo(110, -50); ctx.lineTo(80, -10); ctx.lineTo(120, 20); ctx.lineTo(95, 50); ctx.lineTo(-120, 50); ctx.closePath(); kit.shape(ctx, '#f8fafc', 6);
    ctx.fillStyle = '#38bdf8'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-80 + i * 55, -5, 14, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (!landed) windUp(ctx, o, { n: 10, x0: px - 150, x1: px + 150, y0: py + 80, y1: py + 400, speed: 1600 });
    else {
      // Nieve que salta al chocar y un árbol doblado (lo frenó).
      const s = kit.clamp((local - cue(1) - 2.8) / 0.6);
      ctx.fillStyle = '#ffffff'; const r = kit.rng(40);
      for (let i = 0; i < 18; i++) { const a = Math.PI + r() * Math.PI, d = 40 + s * 160 * r(); ctx.globalAlpha = 1 - s; ctx.beginPath(); ctx.arc(px + Math.cos(a) * d, py + 40 + Math.sin(a) * d * 0.6, 10, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      // El letrero sale justo cuando la voz dice «y sobrevivió» (después de la pausa del «…»).
      if (local > cue(1) + 2.95) label(ctx, kit, 540, 640, '¡SOBREVIVIÓ!', { size: 64, fill: '#4ade80' });
    }
    label(ctx, kit, 200, 400, '1972', { size: 54, fill: '#fde047' });
    void H;
  },

  record(ctx, o) {
    const { W, H, kit, local, t } = o;
    // Certificado de récord: la caída más alta sin paracaídas.
    kit.gradientBG(ctx, W, H, '#fef3c7', '#fde68a');
    const r = kit.rng(50);
    for (let i = 0; i < 30; i++) { const x = r() * W, y = 380 + ((r() * 900 + t * 200 * (0.5 + r())) % 900); ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + i); ctx.fillStyle = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i % 4]; ctx.fillRect(-10, -5, 20, 10); ctx.restore(); }
    const k = kit.ramp(local, 0, 0.5), sc = 0.8 + 0.2 * k;
    ctx.save(); ctx.translate(540, 780); ctx.scale(sc, sc); ctx.rotate(-0.03);
    kit.roundRect(ctx, -380, -300, 760, 600, 24); kit.shape(ctx, '#fffbeb', 8);
    kit.roundRect(ctx, -350, -270, 700, 540, 16); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 6; ctx.stroke();
    kit.text(ctx, 'RÉCORD MUNDIAL', 0, -180, { size: 66, fill: '#b45309', stroke: null });
    kit.text(ctx, '10,160 M', 0, -40, { size: 120, fill: '#0f172a', stroke: null });
    kit.text(ctx, 'SIN PARACAÍDAS', 0, 70, { size: 54, fill: '#0f172a', stroke: null });
    ctx.beginPath(); ctx.arc(230, 190, 70, 0, TAU); kit.shape(ctx, '#f59e0b', 6);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(230 + Math.cos(a) * 70, 190 + Math.sin(a) * 70); ctx.lineTo(230 + Math.cos(a + 0.26) * 88, 190 + Math.sin(a + 0.26) * 88); ctx.lineTo(230 + Math.cos(a + 0.52) * 70, 190 + Math.sin(a + 0.52) * 70); ctx.fillStyle = '#f59e0b'; ctx.fill(); }
    kit.text(ctx, '★', 230, 192, { size: 70, fill: '#fffbeb', stroke: null });
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-300, 210); ctx.quadraticCurveTo(-240, 160, -190, 210); ctx.quadraticCurveTo(-140, 250, -80, 200); ctx.stroke();
    ctx.restore();
    void H;
  },
};
