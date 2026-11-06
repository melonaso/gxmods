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

// ---------- Efectos para Shorts de ritmo rápido ----------

/** Impulso que vale 1 en t = at y se apaga en dur segundos (0 antes de at). */
export const impulse = (t, at, dur) => (t < at ? 0 : Math.max(0, 1 - (t - at) / dur));

/** Sacudida de cámara determinista (mismo resultado en cada render) de amplitud amp px. */
export function shake(ctx, amp, t) {
  if (amp <= 0) return;
  ctx.translate(amp * (Math.sin(t * 71) * 0.6 + Math.sin(t * 113) * 0.4), amp * (Math.cos(t * 83) * 0.6 + Math.sin(t * 131) * 0.4));
}

/** Destello de color sobre toda la imagen. */
export function flash(ctx, W, H, a, color = '#ffffff') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = color; ctx.fillRect(-50, -50, W + 100, H + 100); ctx.restore();
}

/** Líneas de velocidad horizontales (todo se mueve hacia +x). */
export function speedLines(ctx, W, y0, y1, t, { n = 26, speed = 2600, color = 'rgba(255,255,255,0.55)', seed = 5, len = [120, 380], lw = 6 } = {}) {
  const r = rng(seed);
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = lw;
  for (let i = 0; i < n; i++) {
    const y = y0 + r() * (y1 - y0), L = len[0] + r() * (len[1] - len[0]), off = r() * (W + L), v = speed * (0.7 + r() * 0.6);
    const x = ((off + t * v) % (W + L)) - L;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke();
  }
  ctx.restore();
}

// ---------- Personajes y objetos planos (estilo sticker) ----------

/** Persona con los pies en (x, y) y altura h. arms: ángulo de los brazos (0 abajo, 1 arriba). */
export function person(ctx, x, y, h, { shirt = '#3b82f6', pants = '#1e293b', skin = '#e8b48a', arms = 0, rot = 0, lw = null } = {}) {
  const w = h * 0.34, leg = h * 0.42, body = h * 0.34, head = h * 0.24, L = lw ?? Math.max(2, h * 0.035);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  roundRect(ctx, -w * 0.44, -leg, w * 0.38, leg, h * 0.03); shape(ctx, pants, L);
  roundRect(ctx, w * 0.06, -leg, w * 0.38, leg, h * 0.03); shape(ctx, pants, L);
  for (const sgn of [-1, 1]) {
    ctx.save(); ctx.translate(sgn * w * 0.5, -leg - body * 0.92); ctx.rotate(sgn * (0.12 + arms * 2.6));
    roundRect(ctx, -w * 0.13, 0, w * 0.26, body * 0.9, h * 0.03); shape(ctx, shirt, L); ctx.restore();
  }
  roundRect(ctx, -w / 2, -leg - body, w, body, h * 0.04); shape(ctx, shirt, L);
  roundRect(ctx, -head / 2, -leg - body - head, head, head, h * 0.05); shape(ctx, skin, L);
  ctx.fillStyle = INK;
  ctx.fillRect(-head * 0.24, -leg - body - head * 0.6, head * 0.12, head * 0.16);
  ctx.fillRect(head * 0.12, -leg - body - head * 0.6, head * 0.12, head * 0.16);
  ctx.restore();
}

/** Casa con la base centrada en (x, y). roof: 0 techo entero → 1 techo hundido. */
export function house(ctx, x, y, w, h, { wall = '#f4d6a0', roofC = '#dc5a3c', door = '#7c4a2a', roof = 0, lit = 0, lw = 6 } = {}) {
  ctx.save(); ctx.translate(x, y);
  roundRect(ctx, -w / 2, -h, w, h, 6); shape(ctx, wall, lw);
  roundRect(ctx, -w * 0.1, -h * 0.5, w * 0.2, h * 0.5, 4); shape(ctx, door, lw * 0.7);
  for (const sx of [-0.3, 0.3]) { roundRect(ctx, sx * w - w * 0.1, -h * 0.75, w * 0.2, h * 0.22, 4); shape(ctx, lit ? `rgba(255,214,90,${0.4 + 0.6 * lit})` : '#93c5fd', lw * 0.7); }
  // Techo: triángulo entero; al hundirse (roof > 0) se parte en dos tablas que caen hacia dentro
  // y dejan un hueco en el centro.
  const rh = h * 0.6;
  if (roof <= 0) {
    ctx.beginPath(); ctx.moveTo(-w * 0.6, -h); ctx.lineTo(0, -h - rh); ctx.lineTo(w * 0.6, -h); ctx.closePath(); shape(ctx, roofC, lw);
  } else {
    const th = h * 0.1, cut = 1 - 0.22 * roof;
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.translate(sgn * w * 0.6, -h); ctx.rotate(-sgn * roof * 0.75);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-sgn * w * 0.6 * cut, -rh * cut); ctx.lineTo(-sgn * w * 0.6 * cut, -rh * cut + th); ctx.lineTo(-sgn * th, th * 0.6); ctx.closePath();
      shape(ctx, roofC, lw); ctx.restore();
    }
  }
  ctx.restore();
}

/** Árbol con la base en (x, y). lean: inclinación por viento (-1..1). grow: 0..1. */
export function tree(ctx, x, y, h, { lean = 0, grow = 1, leaf = '#3fae5a', trunk = '#8b5a2b', lw = 6, pine = false } = {}) {
  if (grow <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(grow, grow);
  const tw = h * 0.12, th = h * 0.45, bend = lean * h * 0.35;
  ctx.beginPath(); ctx.moveTo(-tw / 2, 0); ctx.quadraticCurveTo(-tw / 2, -th * 0.6, -tw / 2 + bend * 0.6, -th); ctx.lineTo(tw / 2 + bend * 0.6, -th);
  ctx.quadraticCurveTo(tw / 2, -th * 0.6, tw / 2, 0); ctx.closePath(); shape(ctx, trunk, lw);
  if (pine) {
    ctx.beginPath(); ctx.moveTo(-h * 0.3 + bend * 0.6, -th * 0.75); ctx.lineTo(bend, -h); ctx.lineTo(h * 0.3 + bend * 0.6, -th * 0.75); ctx.closePath(); shape(ctx, leaf, lw);
  } else {
    const r = h * 0.3;
    ctx.beginPath(); ctx.ellipse(bend * 0.85, -th - r * 0.6, r * (1 + Math.abs(lean) * 0.25), r * (1 - Math.abs(lean) * 0.2), lean * 0.4, 0, Math.PI * 2); shape(ctx, leaf, lw);
  }
  ctx.restore();
}

/** Coche visto de lado con la base en (x, y). */
export function car(ctx, x, y, w, { color = '#ef4444', rot = 0, lw = 6 } = {}) {
  const h = w * 0.42;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-w * 0.28, -h * 0.55); ctx.lineTo(-w * 0.16, -h); ctx.lineTo(w * 0.2, -h); ctx.lineTo(w * 0.32, -h * 0.55); ctx.closePath(); shape(ctx, '#bfdbfe', lw);
  roundRect(ctx, -w / 2, -h * 0.62, w, h * 0.42, h * 0.14); shape(ctx, color, lw);
  for (const sx of [-0.3, 0.3]) { ctx.beginPath(); ctx.arc(sx * w, -h * 0.18, h * 0.2, 0, Math.PI * 2); shape(ctx, '#1f2937', lw * 0.8); }
  ctx.restore();
}

/** Edificio con la base en (x, y); ventanas encendidas según lit(i) → 0..1. */
export function building(ctx, x, y, w, h, { color = '#475569', win = '#ffd65a', lit = () => 0, lw = 6, cols = null } = {}) {
  ctx.save(); ctx.translate(x, y);
  roundRect(ctx, -w / 2, -h, w, h, 4); shape(ctx, color, lw);
  const nc = cols ?? Math.max(2, Math.round(w / 46)), cw = w / nc, nr = Math.max(2, Math.floor((h - 30) / 56));
  let i = 0;
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++, i++) {
    const a = lit(i);
    ctx.fillStyle = a > 0 ? win : 'rgba(15,23,42,0.55)';
    ctx.globalAlpha = a > 0 ? 0.35 + 0.65 * a : 1;
    ctx.fillRect(-w / 2 + c * cw + cw * 0.22, -h + 22 + r * 56, cw * 0.56, 30);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Sol con rayos que giran despacio. on: 1 encendido → 0 apagado (disco negro con borde). */
export function sun(ctx, x, y, r, { t = 0, on = 1, rays = 12 } = {}) {
  ctx.save(); ctx.translate(x, y);
  if (on > 0) {
    const g = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 2.2);
    g.addColorStop(0, `rgba(255,200,60,${0.55 * on})`); g.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(t * 0.25); ctx.globalAlpha = on;
    for (let i = 0; i < rays; i++) {
      ctx.rotate((Math.PI * 2) / rays);
      ctx.beginPath(); ctx.moveTo(-r * 0.14, -r * 1.12); ctx.lineTo(0, -r * 1.5); ctx.lineTo(r * 0.14, -r * 1.12); ctx.closePath(); shape(ctx, '#fbbf24', 5);
    }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  const c = (a, b) => Math.round(a + (b - a) * on);
  shape(ctx, `rgb(${c(17, 255)},${c(17, 214)},${c(24, 74)})`, 7, on > 0.5 ? INK : '#334155');
  ctx.restore();
}
