// Dibujo de mayor calidad para Shorts 2D: personajes con articulaciones, caras expresivas y sombreado,
// sombras suaves, textura de papel, viñeta, cámara y etiquetas con sombra.
// Todo en coordenadas lógicas (1080×1920); el motor escala el lienzo si el guion trae "scale".
import { INK, FONT, rng } from './kit.js';

const TAU = Math.PI * 2;

/** Aclara (k > 0) u oscurece (k < 0) un color #rrggbb. */
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => (k < 0 ? Math.round(c * (1 + k)) : Math.round(c + (255 - c) * k));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export function vgrad(ctx, x0, y0, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

let paper;
/** Textura de papel fija (no parpadea al comprimir). */
export function paperTexture(ctx, W, H, a = 0.05) {
  if (!paper) {
    paper = document.createElement('canvas'); paper.width = paper.height = 256;
    const c = paper.getContext('2d'), img = c.createImageData(256, 256), R = rng(91);
    for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (R() - 0.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    c.putImageData(img, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(paper, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}

const finishCache = {};
/**
 * Acabado final (textura de papel + viñeta) precalculado UNA vez como una sola capa transparente:
 * cada cuadro solo la pega encima (mucho más rápido que mezclar la textura en cada cuadro).
 */
export function finish(ctx, W, H, { paper = 0.06, vig = 0.3 } = {}) {
  const S = ctx.getTransform().a || 1, key = `${W}x${H}@${S}:${paper}:${vig}`;
  let c = finishCache[key];
  if (!c) {
    const w = Math.round(W * S), h = Math.round(H * S);
    c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data, R = rng(91);
    const cx = w / 2, cy = h * 0.43, r0 = w * 0.35, r1 = h * 0.72;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, dist = Math.hypot(x - cx, y - cy);
      const v = Math.max(0, Math.min(1, (dist - r0) / (r1 - r0))) * vig;   // viñeta: oscurece la orilla
      const n = (R() - 0.5) * 2 * paper;                                     // grano: claro u oscuro
      if (n > 0 && v < 0.02) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(n * 255 * 0.6); }
      else { d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = Math.round(Math.min(1, v + Math.max(0, -n) * 0.6) * 255); }
    }
    g.putImageData(img, 0, 0); finishCache[key] = c;
  }
  ctx.drawImage(c, 0, 0, W, H);
}

export function vignette(ctx, W, H, a = 0.35) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, W * 0.35, W / 2, H * 0.45, H * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/** Acercamiento lento de cámara alrededor de (fx, fy). */
export function camera(ctx, z, fx = 540, fy = 760) { ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy); }

export function groundShadow(ctx, x, y, rx, a = 0.28) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
}

/** Resplandor radial. */
export function glow(ctx, x, y, r, color, a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

/** Puntos de luz desenfocados (profundidad). color con 'A' para el alfa, p. ej. 'rgba(255,255,255,A)'. */
export function bokeh(ctx, W, y0, y1, t, { n = 14, seed = 4, color = 'rgba(255,255,255,A)', r = [20, 70], a = 0.18 } = {}) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = y0 + R() * (y1 - y0) + 20 * Math.sin(t * 0.6 + i), rr = r[0] + R() * (r[1] - r[0]);
    glow(ctx, x + 15 * Math.sin(t * 0.4 + i * 2), y, rr, color, a * (0.5 + 0.5 * R()));
  }
}

/** Etiqueta tipo píldora con sombra suave. */
export function tag(ctx, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.88)', border = null } = {}) {
  ctx.font = `900 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size * 1.1, h = size * 1.55;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.restore();
  if (border) { ctx.lineWidth = 4; ctx.strokeStyle = border; roundRectPath(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.stroke(); }
  ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + size * 0.04);
}

export function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Tarjeta redondeada con sombra (paneles). */
export function card(ctx, x, y, w, h, fill, r = 36) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  roundRectPath(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; roundRectPath(ctx, x, y, w, h, r); ctx.stroke();
}

/** Globo de diálogo con colita hacia (tx, ty). */
export function bubble(ctx, x, y, w, h, tx, ty, text, { size = 40, fill = '#0f172a' } = {}) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff'; roundRectPath(ctx, x - w / 2, y - h / 2, w, h, h * 0.45); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - w * 0.12, y + h * 0.4); ctx.lineTo(tx, ty); ctx.lineTo(x + w * 0.05, y + h * 0.42); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.lineWidth = 5; ctx.strokeStyle = INK; roundRectPath(ctx, x - w / 2, y - h / 2, w, h, h * 0.45); ctx.stroke();
  ctx.font = `900 ${size}px ${FONT}`; ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 2);
}

// ---------------------------------------------------------------------------------------------
// Personaje con articulaciones. (x, y) = punto entre los pies; h = estatura.
// Brazos: [a1, a2] — a1 desde «colgando» hacia afuera (rad), a2 = doblez del codo (negativo = hacia adentro).

function tube(ctx, pts, w, color, ol) {
  const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + ol * 2; path(); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w; path(); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#000'; ctx.lineWidth = w * 0.3;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + w * 0.2, y) : ctx.moveTo(x + w * 0.2, y))); ctx.stroke(); ctx.restore();
}

export const blinkAt = (t, seed = 0) => { const p = (t + seed * 1.37) % 3.4; return p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0; };

export function toon(ctx, x, y, h, o = {}) {
  const {
    skin = '#f1c27d', hair = '#3b2a20', hairStyle = 'short', shirt = '#3b82f6', pants = '#1e293b', shoes = '#111827',
    armL = [0.18, 0.15], armR = [0.18, 0.15], legs = 0.06, lean = 0, tilt = 0, eyes = 'open', mouth = 'smile',
    look = [0, 0], brows = 0, blush = 0, t = 0, seed = 0, breathe = true, iris = '#6b4226', hold = null, scale = 1,
  } = o;
  const L = Math.max(3, h * 0.011);
  const bounce = mouth === 'laugh' ? -Math.abs(Math.sin(t * 16)) * h * 0.012 : 0;
  const br = breathe ? Math.sin(t * 2.2 + seed) * h * 0.004 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(lean);
  groundShadow(ctx, 0, 0, h * 0.2, 0.3);
  const hipY = -0.47 * h + bounce, shY = -0.78 * h + bounce + br, sw = 0.125 * h, hw = 0.09 * h;
  // Piernas
  for (const s of [-1, 1]) {
    const hx = s * 0.05 * h, fx = s * (0.06 + legs) * h;
    tube(ctx, [[hx, hipY + 0.02 * h], [(hx + fx) / 2, hipY * 0.5], [fx, -0.035 * h]], 0.08 * h, pants, L);
    ctx.save(); ctx.translate(fx + s * 0.02 * h, -0.025 * h);
    ctx.beginPath(); ctx.ellipse(0, 0, 0.055 * h, 0.03 * h, 0, 0, TAU); ctx.fillStyle = shoes; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-0.015 * h, -0.012 * h, 0.025 * h, 0.008 * h, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // Pelo largo (detrás)
  const r = 0.12 * h, hcY = shY - 0.02 * h - r * 0.95;
  if (hairStyle === 'long') { roundRectPath(ctx, -r * 1.12, hcY - r * 0.4, r * 2.24, r * 2.1, r * 0.9); ctx.fillStyle = hair; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke(); }
  // Cuello
  roundRectPath(ctx, -0.03 * h, shY - 0.05 * h, 0.06 * h, 0.08 * h, 0.02 * h); ctx.fillStyle = shade(skin, -0.12); ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
  // Torso
  const torso = () => {
    ctx.beginPath();
    ctx.moveTo(-sw + 0.03 * h, shY); ctx.quadraticCurveTo(-sw, shY, -sw, shY + 0.05 * h);
    ctx.lineTo(-hw - 0.01 * h, hipY + 0.03 * h); ctx.quadraticCurveTo(-hw, hipY + 0.07 * h, -hw + 0.04 * h, hipY + 0.07 * h);
    ctx.lineTo(hw - 0.04 * h, hipY + 0.07 * h); ctx.quadraticCurveTo(hw, hipY + 0.07 * h, hw + 0.01 * h, hipY + 0.03 * h);
    ctx.lineTo(sw, shY + 0.05 * h); ctx.quadraticCurveTo(sw, shY, sw - 0.03 * h, shY); ctx.closePath();
  };
  torso(); ctx.fillStyle = shirt; ctx.fill();
  ctx.save(); torso(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(sw * 0.9, (shY + hipY) / 2, sw * 0.55, h * 0.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(-sw * 0.6, shY + 0.06 * h, sw * 0.35, h * 0.08, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(pants, 0.05); ctx.fillRect(-sw * 2, hipY + 0.035 * h, sw * 4, 0.05 * h);
  ctx.restore();
  torso(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
  // Cuello de la camisa
  ctx.beginPath(); ctx.moveTo(-0.045 * h, shY); ctx.quadraticCurveTo(0, shY + 0.05 * h, 0.045 * h, shY); ctx.lineWidth = L; ctx.stroke();
  // Brazos (devuelven la posición de cada mano)
  const hands = {};
  for (const [s, [a1, a2], key] of [[-1, armL, 'L'], [1, armR, 'R']]) {
    const sx = s * (sw - 0.025 * h), sy = shY + 0.035 * h;
    const d1 = [s * Math.sin(a1), Math.cos(a1)], th2 = a1 + a2, d2 = [s * Math.sin(th2), Math.cos(th2)];
    const ex = sx + d1[0] * 0.16 * h, ey = sy + d1[1] * 0.16 * h, hx = ex + d2[0] * 0.15 * h, hy = ey + d2[1] * 0.15 * h;
    tube(ctx, [[sx, sy], [ex, ey], [hx, hy]], 0.052 * h, skin, L);
    tube(ctx, [[sx, sy], [sx + d1[0] * 0.07 * h, sy + d1[1] * 0.07 * h]], 0.068 * h, shirt, L);
    ctx.beginPath(); ctx.arc(hx, hy, 0.036 * h, 0, TAU); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
    hands[key] = [hx, hy];
  }
  if (hold) hold(ctx, hands);
  // Cabeza
  ctx.save(); ctx.translate(0, hcY); ctx.rotate(tilt);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.98, r * 0.08, r * 0.2, r * 0.26, 0, 0, TAU); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke(); }
  const head = () => { ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.06, 0, 0, TAU); };
  head(); ctx.fillStyle = skin; ctx.fill();
  ctx.save(); head(); ctx.clip(); ctx.fillStyle = 'rgba(120,53,15,0.13)'; ctx.beginPath(); ctx.ellipse(r * 0.55, r * 0.3, r * 0.75, r * 1.0, 0, 0, TAU); ctx.fill(); ctx.restore();
  head(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
  // Pelo (arriba)
  ctx.fillStyle = hair; ctx.lineWidth = L; ctx.strokeStyle = INK;
  if (hairStyle === 'curly') {
    ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.moveTo(Math.cos(a) * r * 0.95 + r * 0.28, Math.sin(a) * r * 0.95); ctx.arc(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.28, 0, TAU); } ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-r * 1.02, r * 0.05); ctx.bezierCurveTo(-r * 1.1, -r * 1.1, r * 1.1, -r * 1.25, r * 1.03, r * 0.0);
    ctx.quadraticCurveTo(r * 0.75, -r * 0.45, r * 0.25, -r * 0.42); ctx.quadraticCurveTo(-r * 0.1, -r * 0.2, -r * 0.4, -r * 0.45); ctx.quadraticCurveTo(-r * 0.8, -r * 0.35, -r * 1.02, r * 0.05);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.78, r * 0.35, r * 0.1, -0.2, 0, TAU); ctx.fill();
  }
  // Cara
  const bl = Math.max(eyes === 'bored' ? 0.45 : 0, blinkAt(t, seed));
  for (const s of [-1, 1]) {
    const ex = s * r * 0.36, ey = r * 0.08, rx = r * 0.17, ry = r * 0.21;
    if (eyes === 'happy') { ctx.lineWidth = L * 1.3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(ex, ey + ry * 0.4, rx, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); continue; }
    if (eyes === 'closed') { ctx.lineWidth = L * 1.2; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ex - rx, ey); ctx.quadraticCurveTo(ex, ey + ry * 0.5, ex + rx, ey); ctx.stroke(); continue; }
    const k = eyes === 'wide' ? 1.2 : 1;
    ctx.beginPath(); ctx.ellipse(ex, ey, rx * k, ry * k, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx * k, ry * k, 0, 0, TAU); ctx.clip();
    const ix = ex + look[0] * rx * 0.45, iy = ey + look[1] * ry * 0.4 + (eyes === 'bored' ? ry * 0.25 : 0);
    ctx.beginPath(); ctx.arc(ix, iy, rx * (eyes === 'wide' ? 0.5 : 0.68), 0, TAU); ctx.fillStyle = iris; ctx.fill();
    ctx.beginPath(); ctx.arc(ix, iy, rx * (eyes === 'wide' ? 0.26 : 0.36), 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill();
    ctx.beginPath(); ctx.arc(ix - rx * 0.22, iy - ry * 0.25, rx * 0.17, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    if (bl > 0) { ctx.fillStyle = skin; ctx.fillRect(ex - rx * 1.3, ey - ry * 1.3, rx * 2.6, ry * 2.3 * bl); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ex - rx * 1.1, ey - ry * 1.3 + ry * 2.3 * bl); ctx.lineTo(ex + rx * 1.1, ey - ry * 1.3 + ry * 2.3 * bl); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(ex, ey, rx * k, ry * k, 0, 0, TAU); ctx.lineWidth = L * 0.9; ctx.strokeStyle = INK; ctx.stroke();
  }
  // Cejas
  ctx.lineWidth = L * 1.4; ctx.strokeStyle = shade(hair, -0.2); ctx.lineCap = 'round';
  for (const s of [-1, 1]) { const ex = s * r * 0.36, ey = r * 0.08 - r * 0.36 - brows * r * 0.08; ctx.beginPath(); ctx.moveTo(ex - s * r * 0.16, ey + (eyes === 'bored' ? r * 0.06 : 0)); ctx.quadraticCurveTo(ex, ey - r * 0.06, ex + s * r * 0.17, ey + (brows < 0 ? r * 0.06 : 0)); ctx.stroke(); }
  // Mejillas
  if (blush > 0) for (const s of [-1, 1]) { ctx.fillStyle = `rgba(244,114,182,${0.45 * blush})`; ctx.beginPath(); ctx.ellipse(s * r * 0.58, r * 0.42, r * 0.17, r * 0.1, 0, 0, TAU); ctx.fill(); }
  // Nariz
  ctx.lineWidth = L; ctx.strokeStyle = shade(skin, -0.35); ctx.beginPath(); ctx.moveTo(r * 0.02, r * 0.2); ctx.quadraticCurveTo(r * 0.12, r * 0.36, -r * 0.04, r * 0.4); ctx.stroke();
  // Boca
  const my = r * 0.62;
  ctx.strokeStyle = INK; ctx.lineWidth = L * 1.1;
  if (mouth === 'laugh') {
    const open = r * (0.28 + 0.05 * Math.sin(t * 16));
    ctx.beginPath(); ctx.moveTo(-r * 0.32, my - r * 0.05); ctx.quadraticCurveTo(0, my - r * 0.1, r * 0.32, my - r * 0.05); ctx.quadraticCurveTo(r * 0.25, my + open, 0, my + open); ctx.quadraticCurveTo(-r * 0.25, my + open, -r * 0.32, my - r * 0.05); ctx.closePath();
    ctx.fillStyle = '#7f1d1d'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-r * 0.3, my - r * 0.1, r * 0.6, r * 0.09); ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.ellipse(0, my + open, r * 0.18, r * 0.1, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.stroke();
  } else if (mouth === 'o') { ctx.beginPath(); ctx.ellipse(0, my + r * 0.03, r * 0.08, r * 0.1, 0, 0, TAU); ctx.fillStyle = '#7f1d1d'; ctx.fill(); ctx.stroke(); }
  else if (mouth === 'flat') { ctx.beginPath(); ctx.moveTo(-r * 0.16, my + r * 0.02); ctx.quadraticCurveTo(0, my - r * 0.01, r * 0.16, my + r * 0.04); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-r * 0.22, my - r * 0.02); ctx.quadraticCurveTo(0, my + r * 0.16, r * 0.22, my - r * 0.02); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  // Manos en coordenadas de pantalla (para colocar objetos).
  const c = Math.cos(lean), sn = Math.sin(lean), map = ([hx, hy]) => [x + (hx * c - hy * sn) * scale, y + (hx * sn + hy * c) * scale];
  return { L: map(hands.L), R: map(hands.R), head: map([0, hcY]) };
}
