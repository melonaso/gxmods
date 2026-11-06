// Herramientas de dibujo 2D con el estilo del canal: formas planas, bordes oscuros y texto grueso.
export const FONT = 'Inter, "DejaVu Sans", sans-serif';
export const INK = '#0b0f1a';
export const YELLOW = '#ffd34d';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Rampa 0→1 entre a y b (suavizada). */
export const ramp = (x, a, b) => { const v = clamp((x - a) / (b - a)); return v * v * (3 - 2 * v); };

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Relleno con borde oscuro (estilo "sticker"). */
export function shape(ctx, fill, lw = 6, stroke = INK) {
  ctx.fillStyle = fill; ctx.fill();
  if (lw > 0) { ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.stroke(); }
}

export function text(ctx, str, x, y, { size = 48, weight = 900, fill = '#ffffff', stroke = INK, lw = null, align = 'center', base = 'middle', maxW = null } = {}) {
  let fs = size;
  ctx.font = `${weight} ${fs}px ${FONT}`;
  if (maxW) { const w = ctx.measureText(str).width; if (w > maxW) { fs = Math.floor((fs * maxW) / w); ctx.font = `${weight} ${fs}px ${FONT}`; } }
  ctx.textAlign = align; ctx.textBaseline = base; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = lw ?? fs * 0.16; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
}

export function gradientBG(ctx, W, H, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/** Generador pseudoaleatorio con semilla (mismo resultado en cada fotograma). */
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Estrellas fijas (lista precalculada). */
export function makeStars(n, W, H, seed = 3) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, s: 0.8 + r() * 2.2, tw: r() * 6 }));
}
export function drawStars(ctx, stars, alpha, t = 0) {
  if (alpha <= 0) return;
  ctx.save();
  for (const st of stars) {
    ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(t * 1.5 + st.tw));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Números en español con separador de miles. */
export const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Número grande en palabras de la escala larga del español (millón, billón = 10¹², trillón = 10¹⁸). */
export function bigES(n, d = 1) {
  const units = [[1e18, 'trillones', 'trillón'], [1e15, 'mil billones', 'mil billones'], [1e12, 'billones', 'billón'], [1e9, 'mil millones', 'mil millones'], [1e6, 'millones', 'millón']];
  for (const [v, pl, sg] of units) if (n >= v) { const k = n / v; return `${nf(k, k < 100 ? d : 0)} ${k < 1.05 && k >= 0.95 && sg !== pl ? sg : pl}`; }
  return nf(Math.round(n));
}
