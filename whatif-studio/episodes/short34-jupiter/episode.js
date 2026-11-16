// Short 34: ¿y si cayeras en Júpiter?
// Pregunta al inicio (¿hasta dónde llegarías?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// No hay suelo (gas cada vez más espeso) → gravedad 2.5 veces la de la Tierra → arriba, frío extremo y vientos
// de huracán → abajo, más gas encima: presión que aplasta y calor de horno → 1995: la sonda Galileo aguantó
// casi una hora y bajó ~150 km → sorpresa: según algunos científicos, allá abajo podrían llover diamantes.

let stars;
export function setup(C) { stars = C.kit.makeStars(170, C.W, C.H, 34); }

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

const BANDS = ['#f3e2c7', '#c8865a', '#ead2b0', '#b5653f', '#f1dcc0', '#d49a6a', '#e7c9a0', '#a85a35'];

/** Júpiter con franjas y la Gran Mancha Roja. */
function jupiter(ctx, kit, cx, cy, R, t) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = '#e7c9a0'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const y0 = cy - R + (i / n) * 2 * R, h = (2 * R) / n;
    ctx.fillStyle = BANDS[i % BANDS.length]; ctx.beginPath(); ctx.moveTo(cx - R, y0);
    for (let x = -R; x <= R; x += R / 12) ctx.lineTo(cx + x, y0 + Math.sin(x / R * 6 + i + t * 0.4) * h * 0.18);
    ctx.lineTo(cx + R, y0 + h); ctx.lineTo(cx - R, y0 + h); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#b4472b'; ctx.beginPath(); ctx.ellipse(cx + R * 0.32, cy + R * 0.28, R * 0.2, R * 0.11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#f3e2c7'; ctx.lineWidth = R * 0.02; ctx.stroke();
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = kit.INK; ctx.stroke();
}

/** Astronauta (pies abajo) centrado en (x, y). */
function astro(ctx, kit, x, y, h, { rot = 0, arms = 0.4, scared = true } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  kit.roundRect(ctx, -h * 0.2, -h * 0.4, h * 0.4, h * 0.3, h * 0.05); kit.shape(ctx, '#94a3b8', 4);
  kit.person(ctx, 0, h / 2, h, { shirt: '#f8fafc', pants: '#e2e8f0', arms });
  const hc = -h / 2 + h * 0.12;
  if (scared) { ctx.beginPath(); ctx.ellipse(0, hc + h * 0.06, h * 0.025, h * 0.03, 0, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, hc, h * 0.17, 0, TAU); ctx.fillStyle = 'rgba(186,230,253,0.3)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, hc, h * 0.13, -2.5, -1.7); ctx.stroke();
  ctx.restore();
}

/** Nubes en franjas que suben (porque caes). */
function cloudBands(ctx, o, cols, { speed = 300, side = 0, a = 1 } = {}) {
  const { W, H, t } = o, n = cols.length, h = 260;
  ctx.save(); ctx.globalAlpha = a;
  for (let k = 0; k < 9; k++) {
    const y = H - (((k * h) + t * speed) % (9 * h)) + 100, c = cols[k % n];
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + 30 * Math.sin(x * 0.012 + k * 1.7 + t * side));
    ctx.lineTo(W, y + h + 40); ctx.lineTo(0, y + h + 40); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function thermo(ctx, kit, x, y, lvl, color) {
  kit.roundRect(ctx, x - 30, y, 60, 300, 30); kit.shape(ctx, '#ffffff', 6);
  ctx.fillStyle = color; ctx.fillRect(x - 15, y + 290 - 270 * lvl, 30, 270 * lvl + 10);
  ctx.beginPath(); ctx.arc(x, y + 330, 48, 0, TAU); kit.shape(ctx, color, 6);
}

function diamond(ctx, kit, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(-s * 0.55, -s * 0.75); ctx.lineTo(s * 0.55, -s * 0.75); ctx.lineTo(s, -s * 0.3); ctx.lineTo(0, s); ctx.closePath();
  kit.shape(ctx, '#a5f3fc', Math.max(3, s * 0.12));
  ctx.strokeStyle = '#ecfeff'; ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s, -s * 0.3); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(0, s); ctx.lineTo(s * 0.3, -s * 0.3); ctx.stroke();
  ctx.restore();
}

/** Sonda Galileo colgando de su paracaídas. heat: 0..1 se pone al rojo. */
function probe(ctx, kit, x, y, s, heat = 0, t = 0) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 3;
  for (const dx of [-0.9, -0.3, 0.3, 0.9]) { ctx.beginPath(); ctx.moveTo(dx * s, -s * 1.5); ctx.lineTo(dx * 0.3 * s, -s * 0.35); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-s * 1.1, -s * 1.45); ctx.quadraticCurveTo(0, -s * 2.4 - 6 * Math.sin(t * 5), s * 1.1, -s * 1.45); ctx.closePath(); kit.shape(ctx, '#f97316', 5);
  kit.roundRect(ctx, -s * 0.5, -s * 0.35, s, s * 0.6, s * 0.12); kit.shape(ctx, heat > 0.5 ? '#ef4444' : '#e5e7eb', 5);
  ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.25); ctx.lineTo(0, s * 0.6); ctx.lineTo(s * 0.5, s * 0.25); ctx.closePath(); kit.shape(ctx, heat > 0.5 ? '#b91c1c' : '#9ca3af', 5);
  ctx.fillStyle = '#facc15'; ctx.fillRect(-s * 0.3, -s * 0.2, s * 0.6, s * 0.12);
  if (heat > 0) { const g = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 1.6); g.addColorStop(0, `rgba(254,240,138,${0.8 * heat})`); g.addColorStop(1, 'rgba(239,68,68,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 1.6, 0, TAU); ctx.fill(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, t } = o;
    // En el espacio: Júpiter enorme abajo y un astronauta cayendo hacia él.
    kit.gradientBG(ctx, W, H, '#020617', '#0f172a');
    kit.drawStars(ctx, stars, 1, t);
    const z = 1 + 0.25 * kit.ramp(local, 0, 4);
    jupiter(ctx, kit, 540, 1500, 900 * z, t);
    astro(ctx, kit, 540 + 40 * Math.sin(t), 640 + 120 * kit.ramp(local, 0, 4), 260 * (1 - 0.25 * kit.ramp(local, 0, 4)), { rot: local * 1.6, arms: 0.75 });
  },

  sinsuelo(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Corte de Júpiter: capas cada vez más oscuras y espesas; el «suelo» que esperarías no existe.
    kit.gradientBG(ctx, W, H, '#f3e2c7', '#431407');
    const layers = ['#ead2b0', '#d49a6a', '#b5653f', '#7c2d12', '#451a03'];
    layers.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.85; ctx.fillRect(0, 380 + i * 160, W, 160); });
    ctx.globalAlpha = 1;
    const r = kit.rng(4); ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 70; i++) { const y = 380 + ((r() * 800 - t * 160 * (0.5 + r())) % 800 + 800) % 800; ctx.beginPath(); ctx.arc(r() * W, y, 3 + (y - 380) / 140, 0, TAU); ctx.fill(); }
    // Línea punteada del «suelo» con una X.
    ctx.save(); ctx.setLineDash([24, 16]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(60, 900); ctx.lineTo(W - 60, 900); ctx.stroke(); ctx.restore();
    const sh = kit.ramp(local, 0.4, 1.0);
    if (sh > 0) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(800, 840); ctx.lineTo(800 + 120 * sh, 840 + 120 * sh); ctx.moveTo(920, 840); ctx.lineTo(920 - 120 * sh, 840 + 120 * sh); ctx.stroke(); }
    astro(ctx, kit, 360, 600 + 380 * kit.ramp(local, 0.2, o.s.dur), 220, { rot: 0.3 * Math.sin(t * 2), arms: 0.85 });
    label(ctx, kit, 540, 1040, local < cue(1) ? '¿Y EL SUELO?' : 'SOLO GAS MÁS Y MÁS ESPESO', { size: 44, fill: '#fde68a' });
  },

  gravedad(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Entre las nubes naranjas: pesas como si cargaras a otra persona y media.
    kit.gradientBG(ctx, W, H, '#fdba74', '#c2410c');
    cloudBands(ctx, o, ['#fed7aa', '#fb923c', '#fdba74'], { speed: 120, a: 0.55 });
    // Torre: el astronauta carga a un adulto y, encima, a un niño (otra persona y media).
    const load = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.4), sag = 22 * load;
    const bx = 540, ah = 290, top = 1085 - ah + sag;
    if (load > 0) {
      const drop = (1 - load) * 260;
      kit.person(ctx, bx, top - drop, 220, { shirt: '#2563eb', arms: 0.25 });
      kit.person(ctx, bx, top - 220 - drop * 1.4, 130, { shirt: '#16a34a', arms: 0.9 });
    }
    astro(ctx, kit, bx + (load > 0 ? 4 * Math.sin(t * 20) * load : 0), 1085 - ah / 2 + sag / 2, ah - sag, { arms: load > 0 ? 0.92 : 0.25, scared: true });
    // Flecha de gravedad.
    const ar = 0.6 + 0.4 * kit.ramp(local, 0.1, 0.8);
    ctx.fillStyle = '#7c2d12'; ctx.strokeStyle = kit.INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(870, 560); ctx.lineTo(910, 560); ctx.lineTo(910, 560 + 280 * ar); ctx.lineTo(950, 560 + 280 * ar); ctx.lineTo(890, 640 + 280 * ar); ctx.lineTo(830, 560 + 280 * ar); ctx.lineTo(870, 560 + 280 * ar); ctx.closePath(); ctx.fill(); ctx.stroke();
    label(ctx, kit, 540, 420, local < cue(1) ? 'GRAVEDAD × 2.5' : 'COMO CARGAR A 1½ PERSONAS', { size: 46, fill: '#fde68a' });
    void W; void H;
  },

  viento: function (ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Arriba, en las nubes de hielo: frío extremo y vientos que te arrastran de lado.
    kit.gradientBG(ctx, W, H, '#f1f5f9', '#cbd5e1');
    const gust = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.4);
    ctx.save(); ctx.globalAlpha = 0.9;
    for (let k = 0; k < 7; k++) {
      const y = 400 + k * 120, off = (t * (250 + 900 * gust) * (k % 2 ? 1 : 0.7)) % 400;
      ctx.fillStyle = k % 2 ? '#e2e8f0' : '#f8fafc';
      for (let x = -400 + off; x < W + 400; x += 400) { ctx.beginPath(); ctx.ellipse(x, y, 190, 50, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    const r = kit.rng(8); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = ((r() * W + t * (200 + 1500 * gust) * (0.5 + r())) % (W + 100)) - 50, y = 380 + r() * 760; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (gust > 0) kit.speedLines(ctx, W, 400, 1100, t, { n: 22, speed: 3000, color: 'rgba(100,116,139,0.6)' });
    const ax = 400 + 260 * gust * Math.min(1, Math.max(0, local - cue(1) + 0.2));
    astro(ctx, kit, ax, 760 + 20 * Math.sin(t * 3), 260, { rot: gust * local * 4 + 0.2 * Math.sin(t * 2), arms: 0.7 });
    thermo(ctx, kit, 900, 470, 0.12, '#3b82f6');
    label(ctx, kit, 900, 900, '−110 °C', { size: 44, fill: '#93c5fd' });
    if (local > cue(1)) label(ctx, kit, 480, 430, 'VIENTOS DE 600 KM/H', { size: 46, fill: '#fde047' });
  },

  presion(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Más abajo: todo el gas de arriba empuja. Una lata se aplasta y el termómetro sube al rojo.
    kit.gradientBG(ctx, W, H, '#9a3412', '#450a0a');
    cloudBands(ctx, o, ['#b45309', '#7c2d12', '#92400e'], { speed: 80, a: 0.5 });
    const k = kit.ramp(local, 0.2, cue(1) + 0.8), crush = kit.ramp(local, cue(1) + 0.2, cue(1) + 0.9);
    // Flechas desde todos lados.
    ctx.fillStyle = '#fde68a'; ctx.strokeStyle = kit.INK; ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, d = 300 - 70 * k;
      ctx.save(); ctx.translate(430 + Math.cos(a) * d, 780 + Math.sin(a) * d); ctx.rotate(a + Math.PI);
      ctx.beginPath(); ctx.moveTo(-50, -14); ctx.lineTo(20, -14); ctx.lineTo(20, -32); ctx.lineTo(60, 0); ctx.lineTo(20, 32); ctx.lineTo(20, 14); ctx.lineTo(-50, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // Lata que se arruga.
    const w = 150 * (1 - 0.45 * crush), h = 240 * (1 - 0.25 * crush);
    ctx.save(); ctx.translate(430, 780);
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
    for (let j = 0; j <= 8; j++) ctx.lineTo(w / 2 + (j % 2 ? -1 : 1) * 18 * crush, -h / 2 + (j / 8) * h);
    for (let j = 8; j >= 0; j--) ctx.lineTo(-w / 2 + (j % 2 ? 1 : -1) * 18 * crush, -h / 2 + (j / 8) * h);
    ctx.closePath(); kit.shape(ctx, '#dc2626', 6);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(-w / 2 + 10, -18, w - 20, 36);
    ctx.restore();
    const hot = kit.ramp(local, cue(1), o.s.dur);
    thermo(ctx, kit, 900, 560, 0.2 + 0.8 * hot, hot > 0.4 ? '#ef4444' : '#f97316');
    label(ctx, kit, 540, 410, local < cue(1) ? 'MÁS GAS ENCIMA' : 'APLASTA Y QUEMA', { size: 48, fill: '#fde68a' });
    void W; void H; void t;
  },

  galileo(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // 1995: la sonda Galileo baja en paracaídas entre las nubes; profundidad y tiempo suben… hasta que se destruye.
    const deep = kit.ramp(local, 0.3, o.s.dur - 0.2);
    kit.gradientBG(ctx, W, H, deep > 0.5 ? '#9a3412' : '#ead2b0', deep > 0.5 ? '#450a0a' : '#c8865a');
    cloudBands(ctx, o, deep > 0.5 ? ['#b45309', '#7c2d12'] : ['#f3e2c7', '#d49a6a', '#e7c9a0'], { speed: 260, a: 0.6 });
    const end = cue(2) + 1.6, heat = kit.ramp(local, end - 1.0, end), gone = local > end;
    if (!gone) probe(ctx, kit, 380 + 10 * Math.sin(t * 2), 760 + 8 * Math.sin(t * 3), 90, heat, t);
    else { const u = kit.clamp((local - end) / 0.6); ctx.fillStyle = `rgba(254,240,138,${1 - u})`; ctx.beginPath(); ctx.arc(380, 760, 60 + 220 * u, 0, TAU); ctx.fill(); }
    const km = Math.round(150 * deep), mins = Math.min(58, Math.round(58 * kit.ramp(local, cue(1) - 0.2, end)));
    kit.roundRect(ctx, 660, 560, 330, 150, 24); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, 'PROFUNDIDAD', 825, 600, { size: 30, fill: '#cbd5e1', stroke: null });
    kit.text(ctx, `${km} KM`, 825, 660, { size: 60, fill: '#fde047', stroke: null });
    kit.roundRect(ctx, 660, 740, 330, 150, 24); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, 'TIEMPO', 825, 780, { size: 30, fill: '#cbd5e1', stroke: null });
    kit.text(ctx, `${mins} MIN`, 825, 840, { size: 60, fill: '#fde047', stroke: null });
    label(ctx, kit, 540, 430, '1995 · SONDA GALILEO', { size: 44, fill: '#ffffff' });
    if (gone) label(ctx, kit, 540, 1060, '¡SE DESTRUYÓ!', { size: 52, fill: '#fca5a5' });
  },

  diamantes(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Muy abajo, a oscuras: relámpagos y una lluvia de diamantes.
    kit.gradientBG(ctx, W, H, '#1c1917', '#000000');
    const fl = (t % 1.7) < 0.12 ? 1 - (t % 1.7) / 0.12 : 0;
    if (fl > 0) { ctx.fillStyle = `rgba(224,231,255,${0.35 * fl})`; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = `rgba(255,255,255,${fl})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(760, 380); ctx.lineTo(700, 520); ctx.lineTo(780, 560); ctx.lineTo(690, 760); ctx.stroke(); }
    const on = kit.ramp(local, cue(1) - 0.4, cue(1) + 0.4), r = kit.rng(17);
    for (let i = 0; i < 26; i++) {
      const x = 60 + r() * (W - 120), sp = 160 + r() * 220, y = 380 + ((r() * 800 + t * sp) % 800), s = 22 + r() * 30;
      ctx.save(); ctx.globalAlpha = on; diamond(ctx, kit, x, y, s, t * (r() - 0.5) * 3); ctx.restore();
      if (on > 0 && r() > 0.6) { ctx.fillStyle = `rgba(255,255,255,${on * (0.5 + 0.5 * Math.sin(t * 9 + i))})`; ctx.beginPath(); ctx.arc(x + s * 0.4, y - s * 0.5, 4, 0, TAU); ctx.fill(); }
    }
    if (local > cue(1)) label(ctx, kit, 540, 1060, '¿LLUVIA DE DIAMANTES?', { size: 50, fill: '#a5f3fc' });
    else label(ctx, kit, 540, 1060, 'MUY, MUY ABAJO…', { size: 46, fill: '#cbd5e1' });
  },
};
