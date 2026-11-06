// Short 01: doblar una hoja 42 veces. Grosor T(n) = 0.1 mm × 2ⁿ.
// Vista vertical: la pila crece desde el suelo; la escala de la vista (V, metros que caben en
// pantalla) se fija por escena al tamaño final de esa escena, así la pila crece dentro de la imagen.

const T0 = 1e-4;                 // 0.1 mm en metros
const GROUND = 1250;             // y del suelo (px)
const STAGE = 800;               // px de altura disponible sobre el suelo
const thick = (n) => T0 * Math.pow(2, n);

// Referencias reales: altura (m), cómo se dibujan y su etiqueta.
const REFS = [
  { h: 0.10, kind: 'book', label: 'Libro grueso (10 cm)' },
  { h: 1.7, kind: 'person', label: 'Persona (1.7 m)' },
  { h: 13, kind: 'building', label: 'Edificio de 4 pisos (13 m)' },
  { h: 828, kind: 'burj', label: 'Burj Khalifa (828 m)' },
  { h: 8849, kind: 'everest', label: 'Everest (8,849 m)' },
  { h: 11000, kind: 'plane', label: 'Avión (11 km)' },
  { h: 400000, kind: 'iss', label: 'Estación Espacial (400 km)' },
  { h: 384400000, kind: 'moon', label: 'Luna (384,400 km)' },
];

let stars;

export function setup(C) {
  stars = C.kit.makeStars(220, C.W, GROUND, 11);
}

const fmtLen = (m, nf) => (m < 0.01 ? `${nf(m * 1000, 1)} mm` : m < 1 ? `${nf(m * 100, 1)} cm` : m < 1000 ? `${nf(m, m < 10 ? 2 : 0)} m` : `${nf(m / 1000, m < 1e5 ? 1 : 0)} km`);

export function draw(ctx, C, { t, scene: s, local }) {
  const { W, kit, ease, lerp, scenes } = C;
  const { nf } = kit;
  const goal = s.reach === 'all' || s.id === 'regla' ? s.audio : Math.max(1.2, s.cueTimes[0]?.[1] ?? s.audio);
  const n = lerp(s.n0, s.n1, ease.inOut(Math.min(1, local / goal)));
  const T = thick(n);

  // Escala de la vista: el tamaño final de la escena ocupa ~72% del escenario; transición suave (log).
  const viewFor = (sc) => Math.max(thick(Math.max(sc.n1, 0.6)) / 0.72, 0.0004);
  const prev = scenes[Math.max(0, s.index - 1)];
  const w = ease.inOut(Math.min(1, local / 0.9));
  const V = Math.exp(lerp(Math.log(viewFor(prev)), Math.log(viewFor(s)), w));
  const px = (m) => (m / V) * STAGE;

  // Cielo: de día a espacio según la altura que abarca la vista.
  const space = kit.ramp(Math.log10(V), Math.log10(3000), Math.log10(150000));
  const mix = (a, b, k) => {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
  };
  kit.gradientBG(ctx, W, C.H, mix('5fb3e6', '050816', space), mix('bfe6fb', '101a3a', space));
  kit.drawStars(ctx, stars, kit.ramp(space, 0.4, 1), t);

  // Suelo.
  ctx.fillStyle = mix('7fb04a', '3b5f2a', space); ctx.fillRect(0, GROUND, W, C.H - GROUND);
  ctx.fillStyle = mix('6a9a3c', '2f4d22', space); ctx.fillRect(0, GROUND, W, 10);

  // Regla con marcas "redondas" (1, 2, 5 × 10ᵏ).
  const step = (() => { const raw = V / 4, p = Math.pow(10, Math.floor(Math.log10(raw))); return [1, 2, 5, 10].map((k) => k * p).find((v) => v >= raw); })();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(110, GROUND); ctx.lineTo(110, GROUND - STAGE - 40); ctx.stroke();
  for (let v = step; v <= V * 1.05; v += step) {
    const y = GROUND - px(v);
    ctx.beginPath(); ctx.moveTo(96, y); ctx.lineTo(124, y); ctx.stroke();
    kit.text(ctx, fmtLen(v, nf), 134, y, { size: 28, weight: 800, align: 'left', lw: 6 });
  }
  ctx.restore();

  // Referencias: visibles cuando su tamaño es comparable al de la vista.
  for (const r of REFS) {
    const k = kit.ramp(r.h / V, 0.025, 0.08) * (1 - kit.ramp(r.h / V, 1.15, 1.6));
    if (k <= 0) continue;
    ctx.save(); ctx.globalAlpha = k;
    drawRef(ctx, kit, r, px(r.h), t);
    ctx.restore();
  }

  // Pila de papel.
  const sx = 300, sw = 170, h = Math.max(3, px(T));
  const top = GROUND - h;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetX = 8;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, top, sw, h);
  ctx.restore();
  const layers = Math.pow(2, Math.floor(n));
  if (h / layers >= 5) { // se distinguen las hojas
    ctx.strokeStyle = 'rgba(100,116,139,0.55)'; ctx.lineWidth = 2;
    for (let i = 1; i < layers; i++) { const y = GROUND - (h * i) / layers; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw, y); ctx.stroke(); }
  } else {
    const g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
    g.addColorStop(0, '#f1f5f9'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = g; ctx.fillRect(sx, top, sw, h);
  }
  ctx.lineWidth = 5; ctx.strokeStyle = kit.INK; ctx.strokeRect(sx, top, sw, h);

  // "×2" en cada doblez.
  const frac = n - Math.floor(n);
  if (s.n1 > s.n0 && n > 0.5 && frac < 0.35 && n < s.n1 - 0.02) {
    ctx.save(); ctx.globalAlpha = 1 - frac / 0.35;
    kit.text(ctx, '×2', sx - 70, Math.max(520, top + 10), { size: 60, fill: kit.YELLOW });
    ctx.restore();
  }

  const title = s.titleCard ? { lines: s.titleCard, y: s.titleY, alpha: s.id === 'intro'
    ? Math.min(1, local / 0.4) * (1 - kit.ramp(local, s.dur - 0.5, s.dur))
    : kit.ramp(local / s.dur, 0.45, 0.55) } : null;
  const ov = { counter: { label: 'GROSOR', value: fmtLen(T, nf) }, chip: `DOBLEZ ${Math.floor(n + 1e-6)}`, title };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}

/** Dibuja una referencia con su base en el suelo (o a su altitud, si vuela). */
function drawRef(ctx, kit, r, hpx, t) {
  const x = 640, base = GROUND;
  const label = (y) => kit.text(ctx, r.label, 760, Math.max(500, y - 30), { size: 30, weight: 800, lw: 7, maxW: 560 });
  if (r.kind === 'book') {
    const h = Math.max(4, hpx);
    kit.roundRect(ctx, x, base - h, 240, h, 6); kit.shape(ctx, '#2563eb', 5);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(x + 228, base - h + 4, 8, Math.max(0, h - 8));
    label(base - h);
  } else if (r.kind === 'person') {
    const h = hpx, s = h / 1.7;
    const leg = 0.8 * s, body = 0.6 * s, head = 0.36 * s, wdt = 0.56 * s;
    kit.roundRect(ctx, x + 80 - wdt * 0.42, base - leg, wdt * 0.36, leg, 2); kit.shape(ctx, '#1e3a8a', 3);
    kit.roundRect(ctx, x + 80 + wdt * 0.06, base - leg, wdt * 0.36, leg, 2); kit.shape(ctx, '#1e3a8a', 3);
    kit.roundRect(ctx, x + 80 - wdt / 2, base - leg - body, wdt, body, 3); kit.shape(ctx, '#22c55e', 3);
    kit.roundRect(ctx, x + 80 - head / 2, base - leg - body - head, head, head, 3); kit.shape(ctx, '#e8b48a', 3);
    label(base - h);
  } else if (r.kind === 'building') {
    const h = hpx, wdt = Math.max(40, h * 0.7);
    kit.roundRect(ctx, x, base - h, wdt, h, 4); kit.shape(ctx, '#cbd5e1', 4);
    ctx.fillStyle = '#7dd3fc';
    for (let f = 0; f < 4; f++) for (let c = 0; c < 3; c++) ctx.fillRect(x + wdt * (0.12 + c * 0.3), base - h + h * (0.08 + f * 0.24), wdt * 0.18, h * 0.12);
    label(base - h);
  } else if (r.kind === 'burj') {
    const h = hpx, b = Math.max(30, h * 0.16);
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + b * 0.32, base - h * 0.55); ctx.lineTo(x + b * 0.44, base - h); ctx.lineTo(x + b * 0.56, base - h * 0.55); ctx.lineTo(x + b, base); ctx.closePath();
    kit.shape(ctx, '#94a3b8', 4);
    label(base - h);
  } else if (r.kind === 'everest') {
    const h = hpx, b = h * 2.4;
    ctx.beginPath(); ctx.moveTo(x - b * 0.25, base); ctx.lineTo(x + b * 0.2, base - h); ctx.lineTo(x + b * 0.75, base); ctx.closePath();
    kit.shape(ctx, '#78716c', 4);
    ctx.beginPath(); ctx.moveTo(x + b * 0.2, base - h); ctx.lineTo(x + b * 0.2 - b * 0.07, base - h * 0.8); ctx.lineTo(x + b * 0.2 + b * 0.09, base - h * 0.8); ctx.closePath();
    kit.shape(ctx, '#f8fafc', 3);
    label(base - h);
  } else if (r.kind === 'plane') {
    const y = base - hpx, px0 = x + 130 + Math.sin(t * 0.8) * 10;
    kit.roundRect(ctx, px0 - 60, y - 10, 120, 20, 10); kit.shape(ctx, '#f8fafc', 4);
    ctx.beginPath(); ctx.moveTo(px0 - 10, y); ctx.lineTo(px0 - 40, y + 34); ctx.lineTo(px0 + 10, y); ctx.closePath(); kit.shape(ctx, '#e2e8f0', 3);
    ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(300, y); ctx.lineTo(px0 - 70, y); ctx.stroke(); ctx.setLineDash([]);
    label(y);
  } else if (r.kind === 'iss') {
    const y = base - hpx, c = x + 140;
    ctx.fillStyle = '#facc15'; ctx.fillRect(c - 90, y - 14, 60, 28); ctx.fillRect(c + 30, y - 14, 60, 28);
    kit.roundRect(ctx, c - 30, y - 18, 60, 36, 8); kit.shape(ctx, '#e5e7eb', 4);
    label(y);
  } else if (r.kind === 'moon') {
    const y = base - hpx, c = x + 140;
    ctx.beginPath(); ctx.arc(c, y, 70, 0, Math.PI * 2); kit.shape(ctx, '#d1d5db', 5);
    ctx.fillStyle = '#9ca3af';
    [[-22, -14, 14], [20, 10, 18], [6, -30, 9], [-26, 26, 10]].forEach(([dx, dy, rr]) => { ctx.beginPath(); ctx.arc(c + dx, y + dy, rr, 0, Math.PI * 2); ctx.fill(); });
    ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(300, y); ctx.lineTo(c - 80, y); ctx.stroke(); ctx.setLineDash([]);
    kit.text(ctx, r.label, c, y + 110, { size: 30, weight: 800, lw: 7 });
  }
}
