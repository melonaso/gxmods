// Short 18: ¿y si se acabara todo el dulce del mundo? (idea de @miriamrayas4781)
// Dulces que desaparecen → 180 millones de toneladas de azúcar al año = 22 kg por persona → 15
// cucharaditas al día (lo ideal: 6) → un refresco de 600 ml = 16 cucharaditas → azúcar escondida →
// tu sangre lleva solo 1 cucharadita y el cerebro gasta 120 g al día → el hígado la fabrica → caries.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const COLS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15'];
const TAU = Math.PI * 2;

// ---------- Dulces ----------

/** Caramelo envuelto, centrado en (x, y); r = radio del centro. */
function candy(ctx, kit, x, y, r, col, rot = 0) {
  const lw = Math.max(3, r * 0.08);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * r * 0.8, 0); ctx.lineTo(sx * r * 1.6, -r * 0.55); ctx.lineTo(sx * r * 1.6, r * 0.55); ctx.closePath(); kit.shape(ctx, col, lw); }
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.72, 0, 0, TAU); kit.shape(ctx, col, lw);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 0.3); ctx.lineTo(r * 0.05, r * 0.4); ctx.stroke();
  ctx.restore();
}

/** Paleta con espiral; (x, y) = centro del dulce, el palito baja. */
function lollipop(ctx, kit, x, y, r, col, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  kit.roundRect(ctx, -r * 0.09, r * 0.6, r * 0.18, r * 1.7, r * 0.05); kit.shape(ctx, '#f8fafc', 3);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); kit.shape(ctx, col, Math.max(3, r * 0.08));
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.13; ctx.lineCap = 'round'; ctx.beginPath();
  for (let a = 0; a <= Math.PI * 5; a += 0.2) { const rr = (r * 0.8 * a) / (Math.PI * 5); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.stroke(); ctx.restore();
}

/** Dona con betún y chispas. */
function donut(ctx, kit, x, y, r, icing, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.moveTo(r * 0.36, 0); ctx.arc(0, 0, r * 0.36, 0, TAU, true); kit.shape(ctx, '#d97706', Math.max(3, r * 0.07));
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU, rr = r * (0.84 + 0.07 * Math.sin(i * 2.7)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.moveTo(r * 0.46, 0); ctx.arc(0, 0, r * 0.46, 0, TAU);
  ctx.fillStyle = icing; ctx.fill('evenodd');
  for (let i = 0; i < 10; i++) { const a = i * 0.63, d = r * (0.58 + 0.16 * ((i * 7) % 3) / 2); ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(a * 3); ctx.fillStyle = COLS[i % COLS.length]; ctx.fillRect(-r * 0.08, -r * 0.025, r * 0.16, r * 0.05); ctx.restore(); }
  ctx.restore();
}

/** Barra de chocolate medio desenvuelta. */
function choco(ctx, kit, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  kit.roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.1); kit.shape(ctx, '#7c2d12', Math.max(3, r * 0.06));
  ctx.strokeStyle = '#431407'; ctx.lineWidth = Math.max(2, r * 0.04);
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-r + (i * r * 2) / 4, -r * 0.55); ctx.lineTo(-r + (i * r * 2) / 4, r * 0.55); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
  kit.roundRect(ctx, r * 0.1, -r * 0.6, r * 0.95, r * 1.2, r * 0.08); kit.shape(ctx, '#2563eb', Math.max(3, r * 0.06));
  ctx.restore();
}

/** Uno de los cuatro dulces, según k. */
function sweet(ctx, kit, k, x, y, r, col, rot) {
  if (k === 0) candy(ctx, kit, x, y, r, col, rot);
  else if (k === 1) lollipop(ctx, kit, x, y, r, col, rot);
  else if (k === 2) donut(ctx, kit, x, y, r * 1.1, col, rot);
  else choco(ctx, kit, x, y, r * 0.95, rot);
}

/** Nube de «¡PUF!» al desaparecer (age 0..1). */
function puff(ctx, kit, x, y, r, age) {
  if (age < 0 || age > 1) return;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - age;
  const s = r * (0.7 + 0.8 * age);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.4, s * 0.45, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}

// ---------- Azúcar y cocina ----------

/** Cubo de azúcar. */
function cube(ctx, kit, x, y, s) {
  kit.roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.14); kit.shape(ctx, '#ffffff', Math.max(3, s * 0.06));
  ctx.fillStyle = '#cbd5e1';
  for (const [dx, dy] of [[-0.2, -0.15], [0.18, 0.05], [-0.05, 0.22], [0.22, -0.25]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, s * 0.045, 0, TAU); ctx.fill(); }
}

/** Cucharita vertical (mango hacia arriba); (x, y) = centro de la cuchara; sugar = montoncito. */
function spoon(ctx, kit, x, y, s, { sugar = true, col = '#cbd5e1' } = {}) {
  ctx.save(); ctx.translate(x, y);
  kit.roundRect(ctx, -s * 0.07, -s * 1.3, s * 0.14, s * 1.1, s * 0.07); kit.shape(ctx, col, Math.max(3, s * 0.035));
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.4, 0, 0, TAU); kit.shape(ctx, col, Math.max(3, s * 0.04));
  if (sugar) { ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.24, s * 0.3, 0, 0, TAU); kit.shape(ctx, '#ffffff', Math.max(2, s * 0.025)); }
  ctx.restore();
}

/** Costal de azúcar; (x, y) = base. */
function sack(ctx, kit, x, y, h, label) {
  const w = h * 0.78;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-w * 0.42, 0);
  ctx.bezierCurveTo(-w * 0.62, -h * 0.4, -w * 0.5, -h * 0.82, -w * 0.18, -h * 0.86);
  ctx.lineTo(w * 0.18, -h * 0.86);
  ctx.bezierCurveTo(w * 0.5, -h * 0.82, w * 0.62, -h * 0.4, w * 0.42, 0); ctx.closePath();
  kit.shape(ctx, '#e7cfa4', 7);
  ctx.beginPath(); ctx.moveTo(-w * 0.18, -h * 0.86); ctx.lineTo(-w * 0.26, -h); ctx.lineTo(w * 0.26, -h); ctx.lineTo(w * 0.18, -h * 0.86); ctx.closePath(); kit.shape(ctx, '#e7cfa4', 6);
  kit.roundRect(ctx, -w * 0.22, -h * 0.9, w * 0.44, h * 0.06, 6); kit.shape(ctx, '#b45309', 5);
  kit.text(ctx, 'AZÚCAR', 0, -h * 0.58, { size: h * 0.11, fill: '#7c2d12', stroke: null });
  kit.text(ctx, label, 0, -h * 0.32, { size: h * 0.2, fill: '#dc2626', stroke: '#ffffff', lw: 8 });
  ctx.restore();
}

/** Botella de refresco de cola; (x, y) = base. */
function bottle(ctx, kit, x, y, h) {
  const w = h * 0.34;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * 0.55);
  ctx.quadraticCurveTo(-w / 2, -h * 0.72, -w * 0.17, -h * 0.82); ctx.lineTo(-w * 0.17, -h * 0.95);
  ctx.lineTo(w * 0.17, -h * 0.95); ctx.lineTo(w * 0.17, -h * 0.82);
  ctx.quadraticCurveTo(w / 2, -h * 0.72, w / 2, -h * 0.55); ctx.lineTo(w / 2, 0); ctx.closePath();
  kit.shape(ctx, '#3f1d0b', 7);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(-w / 2 + 4, -h * 0.42, w - 8, h * 0.16);
  kit.text(ctx, 'COLA', 0, -h * 0.34, { size: h * 0.075, fill: '#ffffff', stroke: null });
  kit.roundRect(ctx, -w * 0.22, -h * 1.02, w * 0.44, h * 0.08, 5); kit.shape(ctx, '#dc2626', 5);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-w * 0.36, -h * 0.54, w * 0.09, h * 0.48);
  kit.text(ctx, '600 ml', 0, -h * 0.12, { size: h * 0.06, fill: '#fde68a', stroke: null });
  ctx.restore();
}

/** Comida con azúcar escondida: 0 cátsup, 1 pan, 2 cereal, 3 manzana. (x, y) = centro. */
function food(ctx, kit, k, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  if (k === 0) {
    kit.roundRect(ctx, -s * 0.24, -s * 0.38, s * 0.48, s * 0.82, s * 0.12); kit.shape(ctx, '#dc2626', 6);
    kit.roundRect(ctx, -s * 0.12, -s * 0.56, s * 0.24, s * 0.2, 6); kit.shape(ctx, '#f8fafc', 5);
    kit.roundRect(ctx, -s * 0.2, -s * 0.05, s * 0.4, s * 0.24, 8); kit.shape(ctx, '#ffffff', 4);
    kit.text(ctx, 'CÁTSUP', 0, s * 0.07, { size: s * 0.09, fill: '#dc2626', stroke: null });
  } else if (k === 1) {
    ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.3); ctx.lineTo(-s * 0.42, -s * 0.05); ctx.bezierCurveTo(-s * 0.42, -s * 0.38, s * 0.42, -s * 0.38, s * 0.42, -s * 0.05); ctx.lineTo(s * 0.42, s * 0.3); ctx.closePath();
    kit.shape(ctx, '#d6a35c', 6);
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const dx of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo((dx - 0.06) * s, -s * 0.18); ctx.lineTo((dx + 0.06) * s, -s * 0.02); ctx.stroke(); }
  } else if (k === 2) {
    kit.roundRect(ctx, -s * 0.3, -s * 0.44, s * 0.6, s * 0.86, 8); kit.shape(ctx, '#f97316', 6);
    kit.text(ctx, 'CEREAL', 0, -s * 0.26, { size: s * 0.11, fill: '#ffffff', stroke: kit.INK, lw: 5 });
    ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.18, 0, Math.PI); ctx.closePath(); kit.shape(ctx, '#ffffff', 4);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-s * 0.12 + i * s * 0.06, s * 0.08 - (i % 2) * s * 0.04, s * 0.035, 0, TAU); ctx.fillStyle = '#facc15'; ctx.fill(); }
  } else {
    ctx.beginPath(); ctx.moveTo(0, -s * 0.22);
    ctx.bezierCurveTo(s * 0.32, -s * 0.42, s * 0.5, -s * 0.05, s * 0.36, s * 0.2);
    ctx.bezierCurveTo(s * 0.24, s * 0.42, s * 0.06, s * 0.38, 0, s * 0.32);
    ctx.bezierCurveTo(-s * 0.06, s * 0.38, -s * 0.24, s * 0.42, -s * 0.36, s * 0.2);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.05, -s * 0.32, -s * 0.42, 0, -s * 0.22); ctx.closePath();
    kit.shape(ctx, '#ef4444', 6);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.lineTo(s * 0.04, -s * 0.36); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s * 0.13, -s * 0.33, s * 0.1, s * 0.05, -0.5, 0, TAU); kit.shape(ctx, '#22c55e', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-s * 0.18, -s * 0.06, s * 0.05, s * 0.1, 0.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------- Cuerpo ----------

/** Gota de sangre (punta arriba); (x, y) = centro de la parte redonda. */
function drop(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, -s * 1.25);
  ctx.bezierCurveTo(s * 0.25, -s * 0.8, s * 0.7, -s * 0.4, s * 0.7, 0);
  ctx.arc(0, 0, s * 0.7, 0, Math.PI, false);
  ctx.bezierCurveTo(-s * 0.7, -s * 0.4, -s * 0.25, -s * 0.8, 0, -s * 1.25); ctx.closePath();
  kit.shape(ctx, '#dc2626', 7);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.1, s * 0.1, s * 0.22, 0.3, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Cerebro (nube rosa con pliegues); glow 0..1. */
function brain(ctx, kit, x, y, R, glow = 0) {
  ctx.save(); ctx.translate(x, y);
  if (glow > 0) { const g = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.7); g.addColorStop(0, `rgba(253,224,71,${0.55 * glow})`); g.addColorStop(1, 'rgba(253,224,71,0)'); ctx.fillStyle = g; ctx.fillRect(-R * 2, -R * 2, R * 4, R * 4); }
  const blobs = [[-0.45, -0.2, 0.5], [0, -0.38, 0.52], [0.45, -0.2, 0.5], [-0.5, 0.22, 0.45], [0.5, 0.22, 0.45], [0, 0.15, 0.55]];
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(bx * R + br * R, by * R); ctx.arc(bx * R, by * R, br * R, 0, TAU); }
  ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = kit.INK;
  // Contorno exterior: se traza cada círculo y luego se rellena encima el interior (tapa las líneas de adentro).
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(bx * R + br * R, by * R); ctx.arc(bx * R, by * R, br * R, 0, TAU); } ctx.stroke();
  ctx.beginPath(); for (const [bx, by, br] of blobs) { ctx.moveTo(bx * R + br * R - 4, by * R); ctx.arc(bx * R, by * R, br * R - 4, 0, TAU); } ctx.fill();
  ctx.strokeStyle = '#db2777'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -R * 0.8); ctx.lineTo(0, R * 0.6); ctx.stroke();
  for (const [ax, ay] of [[-0.5, -0.3], [0.45, -0.25], [-0.45, 0.3], [0.5, 0.3]]) { ctx.beginPath(); ctx.arc(ax * R, ay * R, R * 0.2, 0.3, 2.6); ctx.stroke(); }
  ctx.restore();
}

/** Molécula de glucosa (hexágono). */
function hex(ctx, kit, x, y, r) {
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath();
  kit.shape(ctx, '#fde047', 4);
}

/** Hígado; (x, y) = centro. */
function liver(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-s, -s * 0.15);
  ctx.bezierCurveTo(-s * 0.95, -s * 0.7, s * 0.55, -s * 0.78, s * 1.0, -s * 0.38);
  ctx.bezierCurveTo(s * 0.92, 0, s * 0.2, s * 0.5, -s * 0.3, s * 0.48);
  ctx.bezierCurveTo(-s * 0.8, s * 0.46, -s * 1.05, s * 0.2, -s, -s * 0.15); ctx.closePath();
  kit.shape(ctx, '#9f1239', 8);
  ctx.strokeStyle = '#4c0519'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.58); ctx.quadraticCurveTo(0, -s * 0.1, -s * 0.15, s * 0.45); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(s * 0.35, -s * 0.38, s * 0.25, s * 0.08, -0.2, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Muela; (x, y) = centro. */
function tooth(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.35);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.75, -s * 0.15, -s * 0.7, 0, -s * 0.55);
  ctx.bezierCurveTo(s * 0.15, -s * 0.7, s * 0.55, -s * 0.75, s * 0.5, -s * 0.35);
  ctx.bezierCurveTo(s * 0.48, s * 0.05, s * 0.38, s * 0.2, s * 0.32, s * 0.6);
  ctx.bezierCurveTo(s * 0.28, s * 0.8, s * 0.12, s * 0.8, s * 0.08, s * 0.55);
  ctx.lineTo(s * 0.03, s * 0.3); ctx.lineTo(-s * 0.03, s * 0.3); ctx.lineTo(-s * 0.08, s * 0.55);
  ctx.bezierCurveTo(-s * 0.12, s * 0.8, -s * 0.28, s * 0.8, -s * 0.32, s * 0.6);
  ctx.bezierCurveTo(-s * 0.38, s * 0.2, -s * 0.48, s * 0.05, -s * 0.5, -s * 0.35); ctx.closePath();
  kit.shape(ctx, '#f8fafc', 8);
  ctx.fillStyle = 'rgba(148,163,184,0.35)'; ctx.beginPath(); ctx.ellipse(s * 0.25, -s * 0.15, s * 0.08, s * 0.25, 0.1, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Bacteria verde con ojos y boca; sc = escala. */
function germ(ctx, kit, x, y, r, t, i, sc = 1) {
  if (sc <= 0.02) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(0.15 * Math.sin(t * 3 + i));
  ctx.beginPath();
  for (let k = 0; k <= 20; k++) { const a = (k / 20) * TAU, rr = r * (1 + 0.1 * Math.sin(a * 5 + t * 4 + i)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); kit.shape(ctx, '#4ade80', 5);
  for (const ex of [-0.32, 0.32]) { ctx.beginPath(); ctx.arc(ex * r, -r * 0.2, r * 0.2, 0, TAU); kit.shape(ctx, '#ffffff', 3); ctx.beginPath(); ctx.arc(ex * r + r * 0.05, -r * 0.18, r * 0.09, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.3, 0.1, Math.PI - 0.1); ctx.lineWidth = 5; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.restore();
}

function sparkle(ctx, x, y, r, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = (i / 8) * TAU, rr = i % 2 ? r * 0.3 : r; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath();
  ctx.fillStyle = '#facc15'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#0b0f1a'; ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#db2777', '#fbcfe8');
    // Montaña de dulces desde el primer fotograma; en la segunda frase desaparecen con un «¡puf!».
    const r0 = kit.rng(11), P = Math.max(0, cue(1) + 0.25);
    for (let i = 0; i < 24; i++) {
      const x = 110 + r0() * (W - 220), y = 560 + r0() * 480, r = 46 + r0() * 22, col = COLS[i % COLS.length], d = r0() * 0.3, rot = (r0() - 0.5) * 1.2;
      const bob = 10 * Math.sin(t * 2 + i);
      if (local < P + d) sweet(ctx, kit, i % 4, x, y + bob, r, col, rot + 0.08 * Math.sin(t * 1.5 + i));
      else puff(ctx, kit, x, y + bob, r * 1.3, (local - P - d) / 0.55);
    }
    kit.flash(ctx, W, H, 0.45 * kit.impulse(local, P, 0.25), '#ffffff');
  },

  azucar(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0369a1', '#7dd3fc');
    // Pirámide de cubos de azúcar que crece; en la segunda frase, una persona junto a su costal de 22 kg.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    const rows = [11, 10, 9, 8, 7, 6, 5, 4], S = 74, grow = kit.ramp(local, 0, cue(1) - 0.2);
    let n = 0; const total = rows.reduce((a, b) => a + b, 0);
    ctx.save(); ctx.globalAlpha = 1 - 0.75 * q;
    rows.forEach((cnt, ri) => {
      for (let c = 0; c < cnt; c++, n++) {
        if (n / total > grow) continue;
        cube(ctx, kit, W / 2 + (c - (cnt - 1) / 2) * S, 1060 - ri * (S - 4) - S / 2, S - 6);
      }
    });
    ctx.restore();
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      kit.person(ctx, 360, 1065, 430, { shirt: '#f97316', arms: 0.4 * Math.sin(t * 3) });
      sack(ctx, kit, 690, 1065, 330, '22 KG');
      ctx.restore();
    }
    const tons = 180e6 * o.ease.out(kit.ramp(local, 0.1, cue(1) - 0.2));
    if (q < 0.5) {
      kit.text(ctx, `${kit.nf(Math.round(tons / 1e6))} MILLONES`, W / 2, 230, { size: 92, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'DE TONELADAS AL AÑO', W / 2, 335, { size: 50, fill: '#fde68a' });
    } else {
      kit.text(ctx, '22 KG', W / 2, 230, { size: 130, fill: kit.YELLOW });
      kit.text(ctx, 'POR PERSONA, CADA AÑO', W / 2, 345, { size: 50, fill: '#ffffff' });
    }
    void H;
  },

  dia(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#7c2d12', '#f59e0b');
    // 15 cucharaditas que aparecen una a una; luego solo 6 se quedan en verde.
    const k = kit.ramp(local, 0.1, cue(1) - 0.2), q = kit.ramp(local, cue(1), cue(1) + 0.4);
    for (let i = 0; i < 15; i++) {
      const a = kit.clamp(k * 15 - i); if (a <= 0) continue;
      const c = i % 5, r = Math.floor(i / 5), x = 150 + c * 195, y = 640 + r * 225;
      const ok = i < 6;
      ctx.save(); ctx.globalAlpha = a * (ok ? 1 : 1 - 0.6 * q);
      ctx.translate(x, y); ctx.scale(0.6 + 0.4 * a, 0.6 + 0.4 * a);
      spoon(ctx, kit, 0, 0, 95, { col: ok && q > 0.5 ? '#86efac' : '#cbd5e1' });
      ctx.restore();
      if (!ok && q > 0) {
        ctx.save(); ctx.globalAlpha = q; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 45, y - 100); ctx.lineTo(x + 45, y + 35); ctx.moveTo(x + 45, y - 100); ctx.lineTo(x - 45, y + 35); ctx.stroke(); ctx.restore();
      }
    }
    const shown = Math.min(15, Math.ceil(k * 15 - 0.001));
    if (q < 0.5) {
      kit.text(ctx, `${shown} CUCHARADITAS`, W / 2, 230, { size: 88, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'AL DÍA (≈ 60 g)', W / 2, 335, { size: 52, fill: '#fde68a' });
    } else {
      kit.text(ctx, 'LO IDEAL: 6', W / 2, 230, { size: 110, fill: '#4ade80' });
      kit.text(ctx, 'SEGÚN LA OMS (≈ 25 g)', W / 2, 345, { size: 50, fill: '#ffffff' });
    }
    void H;
  },

  refresco(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#991b1b', '#fca5a5');
    // La botella a la izquierda; a la derecha caen los 16 cubos (4 g cada uno) que trae dentro.
    bottle(ctx, kit, 270, 1070, 600 + 6 * Math.sin(t * 2));
    const k = kit.ramp(local, 0.3, cue(1) + 0.8), S = 86;
    for (let i = 0; i < 16; i++) {
      const a = kit.clamp(k * 16 - i); if (a <= 0) continue;
      const c = i % 4, r = Math.floor(i / 4), x = 560 + c * (S + 6) + S / 2, y = 1070 - S / 2 - r * (S + 6);
      cube(ctx, kit, x, y - 380 * (1 - o.ease.out(a)), S);
    }
    const g = Math.round(63 * Math.min(1, k * 16 / 16));
    kit.text(ctx, `${g} g DE AZÚCAR`, W / 2, 230, { size: 92, fill: '#ffffff', maxW: W * 0.92 });
    const q = kit.ramp(local, cue(1) + 0.5, cue(1) + 0.8);
    kit.text(ctx, q > 0.5 ? '= 16 CUCHARADITAS' : 'EN UN REFRESCO DE 600 ml', W / 2, 340, { size: 50, fill: q > 0.5 ? kit.YELLOW : '#fecaca', maxW: W * 0.92 });
    void H;
  },

  escondido(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#14532d', '#86efac');
    // Cuatro comidas que se encienden al nombrarlas; de cada una salen cubitos de azúcar que se van.
    const pos = [[290, 640], [790, 640], [290, 960], [790, 960]];
    for (let i = 0; i < 4; i++) {
      const at = cue(1) + i * 0.5, a = 0.3 + 0.7 * kit.ramp(local, at, at + 0.25), pulse = 1 + 0.12 * kit.impulse(local, at, 0.35);
      const [x, y] = pos[i];
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(pulse, pulse);
      food(ctx, kit, i, 0, 0, 300);
      ctx.restore();
      if (local > at) {
        for (let j = 0; j < 3; j++) {
          const u = ((local - at) * 0.8 + j / 3) % 1;
          ctx.save(); ctx.globalAlpha = (1 - u) * a; cube(ctx, kit, x + 110 * Math.sin(j * 2.1 + i), y - 120 - u * 170, 34); ctx.restore();
        }
      }
    }
    const fruit = kit.ramp(local, cue(1) + 1.5, cue(1) + 1.8);
    kit.text(ctx, fruit > 0.5 ? '¡HASTA LA FRUTA!' : 'ESCONDIDO EN…', W / 2, 230, { size: 92, fill: fruit > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    void H; void t;
  },

  cuerpo(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#4c0519', '#be123c');
    // Toda la sangre (≈ 5 litros) lleva ≈ 4 g de glucosa: una cucharadita. Luego, el cerebro: 120 g al día.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (q < 1) {
      ctx.save(); ctx.globalAlpha = 1 - q;
      drop(ctx, kit, 290, 760, 190 + 6 * Math.sin(t * 3));
      kit.text(ctx, '5 LITROS', 290, 1010, { size: 54, fill: '#ffffff' });
      kit.text(ctx, '=', W / 2, 700, { size: 120, fill: '#ffffff' });
      spoon(ctx, kit, 790, 800, 230);
      kit.text(ctx, '≈ 4 g', 790, 1010, { size: 54, fill: kit.YELLOW });
      ctx.restore();
    }
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      brain(ctx, kit, W / 2, 760, 230, 0.6 + 0.4 * Math.sin(t * 4));
      const r = kit.rng(4);
      for (let i = 0; i < 10; i++) {
        const a0 = r() * TAU, u = ((local - cue(1)) * 0.7 + r()) % 1, d = 470 - u * 260;
        if (u >= 0) { ctx.save(); ctx.globalAlpha = q * (1 - u * 0.8); hex(ctx, kit, W / 2 + Math.cos(a0) * d, 760 + Math.sin(a0) * d * 0.7, 26); ctx.restore(); }
      }
      ctx.restore();
    }
    if (q < 0.5) {
      kit.text(ctx, 'TODA TU SANGRE:', W / 2, 230, { size: 80, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, '1 CUCHARADITA DE AZÚCAR', W / 2, 335, { size: 54, fill: '#fde68a', maxW: W * 0.92 });
    } else {
      const g = 120 * o.ease.out(kit.ramp(local, cue(1), cue(1) + 1.4));
      kit.text(ctx, `${Math.round(g)} g AL DÍA`, W / 2, 230, { size: 104, fill: kit.YELLOW });
      kit.text(ctx, 'LO QUE GASTA TU CEREBRO', W / 2, 340, { size: 52, fill: '#ffffff', maxW: W * 0.92 });
    }
    void H;
  },

  higado(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#6d28d9');
    // El hígado fabrica glucosa y la manda al cerebro sin parar.
    liver(ctx, kit, 330, 930, 230 * (1 + 0.02 * Math.sin(t * 4)));
    kit.text(ctx, 'HÍGADO', 330, 1080, { size: 50, fill: '#fecdd3' });
    brain(ctx, kit, 800, 580, 140, 0.5 + 0.3 * Math.sin(t * 4));
    for (let i = 0; i < 9; i++) {
      const u = (local * 0.55 + i / 9) % 1;
      const x = 420 + (720 - 420) * u, y = 840 + (680 - 840) * u - Math.sin(u * Math.PI) * 170;
      ctx.save(); ctx.globalAlpha = Math.min(1, u * 5, (1 - u) * 5); hex(ctx, kit, x, y, 24); ctx.restore();
    }
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q < 0.5) {
      kit.text(ctx, 'TU HÍGADO', W / 2, 230, { size: 100, fill: '#ffffff' });
      kit.text(ctx, 'FABRICA GLUCOSA', W / 2, 340, { size: 60, fill: '#fde68a' });
    } else {
      kit.text(ctx, '¡ESTARÍAS BIEN!', W / 2, 230, { size: 100, fill: '#4ade80', maxW: W * 0.92 });
      kit.text(ctx, 'AUNQUE NO COMAS DULCE', W / 2, 340, { size: 54, fill: '#ffffff', maxW: W * 0.92 });
    }
    void H;
  },

  caries(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0e7490', '#a5f3fc');
    // Muela rodeada de bacterias comiendo azúcar; sin azúcar, se encogen y la muela brilla.
    const P = cue(1) + 0.3, gone = kit.ramp(local, P, P + 0.6);
    tooth(ctx, kit, W / 2, 760, 470);
    const spots = [[230, 560], [850, 560], [190, 860], [890, 860], [330, 1040], [750, 1040]];
    spots.forEach(([x, y], i) => {
      const bob = 8 * Math.sin(t * 4 + i);
      if (local < P) cube(ctx, kit, x + (x < W / 2 ? 70 : -70), y + 30 + bob, 46);
      else puff(ctx, kit, x + (x < W / 2 ? 70 : -70), y + 30 + bob, 50, (local - P) / 0.5);
      germ(ctx, kit, x, y + bob, 58, t, i, 1 - gone);
    });
    if (gone > 0) [[250, 520], [830, 520], [540, 450], [190, 720], [890, 720]].forEach(([x, y], i) => sparkle(ctx, x, y, 34 + 10 * Math.sin(t * 6 + i), gone));
    if (local < P) {
      kit.text(ctx, 'AZÚCAR + BACTERIAS', W / 2, 230, { size: 84, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, '= ÁCIDO QUE PICA LOS DIENTES', W / 2, 335, { size: 46, fill: '#0f172a', stroke: '#ffffff', lw: 8, maxW: W * 0.92 });
    } else {
      kit.text(ctx, 'MENOS CARIES', W / 2, 240, { size: 110, fill: '#16a34a', stroke: '#ffffff', lw: 12 });
    }
    void H;
  },

  outro(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#db2777', '#fbcfe8');
    const r = kit.rng(7);
    for (let i = 0; i < 14; i++) {
      const x = 90 + r() * (W - 180), y = 480 + r() * 560, rr = 40 + r() * 18;
      sweet(ctx, kit, i % 4, x, y + 12 * Math.sin(t * 2 + i), rr, COLS[i % COLS.length], (r() - 0.5) + 0.1 * Math.sin(t + i));
    }
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE @miriamrayas4781', W / 2, 260, { size: 64, fill: kit.YELLOW, maxW: W * 0.92 }); ctx.restore(); }
    void H;
  },
};
