// Short 46: ¿y si el Sol fuera el doble de grande?  (calidad alta: engine2d/hq.js)
// Gancho corto: ¿seguiríamos aquí? (se contesta al final del bloque). Sin palabras técnicas.
// No brillaría el doble sino más de 10 veces más (quema su combustible mucho más rápido) → aquí los mares hervirían y
// quedaría un desierto de piedra → para estar a gusto habría que vivir 3 veces más lejos, más allá de Marte →
// lo peor: viviría ~mil millones de años y los animales tardaron casi 4 mil millones en aparecer →
// sorpresa: esa estrella existe, Sirio, la que más brilla de noche; se encuentra siguiendo las Tres Marías.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { drawGlobe } from '../../engine2d/earth.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.06, vig: 0.3 });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const INK = '#0b0f1a';
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
function mixc(c1, c2, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], clamp(k)))).join(',')})`;
}
const STARS = kit.makeStars(130, 1080, 1100, 7);

/** Estrella tipo Sol. hot 0 → amarilla (nuestro Sol); 1 → blanca azulada (el doble). */
function star(ctx, x, y, r, t, hot = 0, rays = true) {
  hq.glow(ctx, x, y, r * (3 + 1.5 * hot), hot > 0.5 ? 'rgba(224,242,254,A)' : 'rgba(253,224,71,A)', 0.5 + 0.2 * hot);
  if (rays) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.2);
    for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); ctx.beginPath(); ctx.moveTo(-r * 0.12, -r * 1.14); ctx.lineTo(0, -r * 1.45); ctx.lineTo(r * 0.12, -r * 1.14); ctx.closePath(); ctx.fillStyle = mixc('#fbbf24', '#e0f2fe', hot); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, mixc('#fef08a', '#ffffff', hot)], [1, mixc('#f59e0b', '#93c5fd', hot)]]); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.14, -0.6, 0, TAU); ctx.fill();
}

function space(ctx, W, H, t) {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#020617'], [1, '#1e1b4b']]); ctx.fillRect(0, 0, W, H);
  kit.drawStars(ctx, STARS, 0.9, t);
}

function bulb(ctx, x, y, s, on) {
  if (on > 0) hq.glow(ctx, x, y - s * 0.2, s * 1.6, 'rgba(253,224,71,A)', 0.6 * on);
  ctx.beginPath(); ctx.arc(x, y - s * 0.25, s * 0.55, 0, TAU); ctx.fillStyle = on > 0 ? mixc('#e5e7eb', '#fde047', on) : '#64748b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  hq.roundRectPath(ctx, x - s * 0.25, y + s * 0.2, s * 0.5, s * 0.35, 4); ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.stroke();
}

function bar(ctx, x, y, w, h, k, fill) {
  hq.roundRectPath(ctx, x, y - h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(148,163,184,0.25)'; ctx.fill();
  if (k > 0.01) { hq.roundRectPath(ctx, x, y - h / 2, Math.max(h, w * k), h, h / 2); ctx.fillStyle = fill; ctx.fill(); }
  hq.roundRectPath(ctx, x, y - h / 2, w, h, h / 2); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}

function palm(ctx, x, y, s, dead) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -90, 50, -170); ctx.stroke();
  ctx.strokeStyle = dead ? '#78350f' : '#a16207'; ctx.lineWidth = 18; ctx.stroke();
  const leaf = dead ? '#a16207' : '#16a34a';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55 + (dead ? 0.25 * Math.sign(i - 2.5) : 0), L = 120, droop = dead ? 70 : 35;
    ctx.beginPath(); ctx.moveTo(50, -170);
    ctx.quadraticCurveTo(50 + Math.cos(a) * L * 0.6, -170 + Math.sin(a) * L * 0.6 - 30, 50 + Math.cos(a) * L, -170 + Math.sin(a) * L + droop);
    ctx.quadraticCurveTo(50 + Math.cos(a) * L * 0.5, -170 + Math.sin(a) * L * 0.5 + 10, 50, -165);
    ctx.fillStyle = leaf; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}

function fish(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(70, -26); ctx.lineTo(70, 26); ctx.closePath(); ctx.fillStyle = '#fb923c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 50, 30, 0, 0, TAU); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-24, -6, 8, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(-26, -6, 4, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Playa: el Sol crece al doble y se vuelve blanco; el cielo se quema de luz. La persona se pone lentes oscuros.
    const g = ease((local - 0.9) / 1.3);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 840, [[0, '#38bdf8'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 840);
    ctx.save(); ctx.globalAlpha = g; ctx.fillStyle = hq.vgrad(ctx, 0, 0, 840, [[0, '#fef9c3'], [1, '#ffffff']]); ctx.fillRect(0, 0, W, 840); ctx.restore();
    star(ctx, 540, 610, 78 + 82 * g, t, g);
    ctx.fillStyle = hq.vgrad(ctx, 0, 820, 1010, [[0, mixc('#0ea5e9', '#7dd3fc', g)], [1, '#0369a1']]); ctx.fillRect(0, 820, W, 190);
    ctx.strokeStyle = 'rgba(224,242,254,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 822 + 7 * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
    if (g > 0) { ctx.save(); ctx.globalAlpha = 0.8 * g; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(540, 850 + i * 26, 160 - i * 18, 6, 0, 0, TAU); ctx.fill(); } ctx.restore(); }
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 820); ctx.lineTo(W, 820); ctx.stroke();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#fde68a'], [1, '#f59e0b']]); ctx.fillRect(0, 1000, W, H);
    ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    // Sombrilla.
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(230, 1110); ctx.lineTo(210, 860); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, 900); ctx.quadraticCurveTo(200, 740, 370, 830); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150, 870); ctx.quadraticCurveTo(220, 790, 280, 840); ctx.lineTo(260, 850); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    const hot = local > 1.6;
    const r = hq.toon(ctx, 800, 1100, 340, { t, seed: 6, shirt: '#22c55e', pants: '#0ea5e9', skin: '#e0ac69', hair: '#92400e', armL: [0.5, -0.6], armR: [0.5, -0.6], eyes: hot ? 'wide' : 'happy', mouth: hot ? 'o' : 'smile', brows: hot ? 1 : 0, look: [-0.6, -0.8] });
    if (hot) {
      const [hx, hy] = r.head, R = 0.12 * 340;
      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      for (const s of [-1, 1]) { hq.roundRectPath(ctx, hx + s * R * 0.36 - R * 0.3, hy + R * 0.08 - R * 0.2, R * 0.6, R * 0.38, R * 0.15); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(hx - R * 0.08, hy + R * 0.04); ctx.lineTo(hx + R * 0.08, hy + R * 0.04); ctx.stroke();
      for (const [dx, dy] of [[R * 1.1, -R * 0.4], [-R * 1.15, -R * 0.1]]) { const yy = hy + dy + ((local * 60) % 30); ctx.beginPath(); ctx.moveTo(hx + dx, yy - 14); ctx.quadraticCurveTo(hx + dx + 9, yy + 2, hx + dx, yy + 8); ctx.quadraticCurveTo(hx + dx - 9, yy + 2, hx + dx, yy - 14); ctx.fillStyle = '#7dd3fc'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
    }
  },

  brillo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Nuestro Sol (1 foco) contra el Sol doble (12 focos)… y su combustible se acaba mucho más rápido.
    const c1 = cue(1);
    space(ctx, W, H, t);
    star(ctx, 290, 620, 66, t, 0);
    star(ctx, 770, 620, 112, t, 1);
    hq.tag(ctx, 290, 735, 'NUESTRO SOL', { size: 28, fill: '#fde047' });
    hq.tag(ctx, 770, 785, 'EL DOBLE', { size: 28, fill: '#bae6fd' });
    if (local < c1) {
      const k = ease((local - 0.3) / Math.max(0.8, c1 - 0.6));
      bulb(ctx, 290, 900, 70, 1);
      for (let i = 0; i < 12; i++) bulb(ctx, 650 + (i % 4) * 80, 880 + Math.floor(i / 4) * 85, 58, clamp((k - i / 12) * 6));
      hq.tag(ctx, 540, 410, 'MÁS DE 10 VECES MÁS LUZ', { size: 42, fill: '#fde047' });
      return;
    }
    const k = ease((local - c1) / 2.2);
    ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e2e8f0';
    ctx.fillText('COMBUSTIBLE', 290, 885); ctx.fillText('COMBUSTIBLE', 770, 885);
    bar(ctx, 170, 940, 240, 44, 1 - 0.1 * k, '#facc15');
    bar(ctx, 650, 940, 240, 44, 1 - 0.88 * k, k > 0.7 ? '#ef4444' : '#38bdf8');
    // Llamas en el Sol doble (quema rápido).
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + t * 1.5, d = 112 + 30 + 14 * Math.sin(t * 9 + i); ctx.save(); ctx.translate(770 + Math.cos(a) * d, 620 + Math.sin(a) * d); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.moveTo(-12, 10); ctx.quadraticCurveTo(-10, -12, 0, -30); ctx.quadraticCurveTo(10, -12, 12, 10); ctx.closePath(); ctx.fillStyle = '#fb923c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 540, 410, 'QUEMA SU COMBUSTIBLE MÁS RÁPIDO', { size: 34, fill: '#fca5a5' });
  },

  mares(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte del mar: el agua hierve (burbujas y vapor)… y se va; queda el fondo de piedra y una palmera seca.
    const c1 = cue(1), dryK = ease((local - c1) / 1.0), lvl = 770 + 40 * clamp(local / Math.max(1, c1)) + 600 * dryK;
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 900, [[0, '#fef9c3'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, 900);
    star(ctx, 860, 520, 92, t, 1, true);
    // Fondo lejano (se ve cuando el mar se va).
    ctx.fillStyle = hq.vgrad(ctx, 0, 800, H, [[0, '#d6a56a'], [0.4, '#a16207'], [1, '#57534e']]); ctx.fillRect(0, 800, W, H);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 800); ctx.lineTo(W, 800); ctx.stroke();
    const bed = (x) => 1030 + 50 * Math.sin(x * 0.008 + 1) + 18 * Math.sin(x * 0.03);
    // Agua (sólo arriba del fondo).
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, bed(x)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = hq.vgrad(ctx, 0, 770, 1100, [[0, '#38bdf8'], [1, '#0c4a6e']]); ctx.fillRect(0, lvl, W, H);
    ctx.strokeStyle = 'rgba(224,242,254,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, lvl + 9 * Math.sin(x * 0.04 + t * 7)); ctx.stroke();
    // Burbujas que suben.
    for (let i = 0; i < 40; i++) { const x = (i * 97.1) % W, u = ((t * 0.9 + i * 0.137) % 1), y = lerp(bed(x) - 10, lvl + 8, u), r = 6 + (i % 4) * 4; if (y > lvl + 4) { ctx.beginPath(); ctx.arc(x + 6 * Math.sin(t * 5 + i), y, r, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); } }
    ctx.restore();
    // Vapor.
    const steam = 1 - dryK;
    if (steam > 0) for (let i = 0; i < 8; i++) {
      const x0 = 80 + i * 130, ph = (t * 0.6 + i * 0.3) % 1;
      ctx.save(); ctx.globalAlpha = steam * 0.7 * (1 - ph); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); for (let k = 0; k <= 10; k++) { const yy = lvl - k * 26 - ph * 120; ctx.lineTo(x0 + 18 * Math.sin(k * 0.9 + t * 3 + i), yy); } ctx.stroke(); ctx.restore();
    }
    // Fondo de piedra con la isla (que queda como columna).
    ctx.beginPath(); ctx.moveTo(0, bed(0)); for (let x = 0; x <= 220; x += 20) ctx.lineTo(x, bed(x)); ctx.lineTo(250, 800); ctx.lineTo(370, 790); for (let x = 400; x <= W; x += 20) ctx.lineTo(x, bed(x)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 790, H, [[0, mixc('#a8a29e', '#b45309', dryK * 0.5)], [1, '#44403c']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (dryK > 0) { ctx.save(); ctx.globalAlpha = dryK; ctx.strokeStyle = 'rgba(41,37,36,0.6)'; ctx.lineWidth = 4; const R = kit.rng(5); for (let i = 0; i < 16; i++) { let x = 420 + R() * 640, y = bed(x) + 20 + R() * 300; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 80; y += (R() - 0.3) * 25; ctx.lineTo(x, y); } ctx.stroke(); } ctx.restore(); }
    palm(ctx, 300, 795, 0.9, dryK > 0.5);
    hq.tag(ctx, 540, 410, local < c1 ? 'LOS MARES HIERVEN' : 'UN DESIERTO DE PIEDRA', { size: 44, fill: local < c1 ? '#bae6fd' : '#fdba74' });
  },

  lejos(ctx, o) {
    const { W, H, local, cue, t, s } = o;
    // Vista desde arriba: la Tierra se aleja del Sol doble hasta pasar la órbita de Marte (3 veces más lejos).
    const c1 = cue(1), sx = 40, sy = 760;
    space(ctx, W, H, t);
    const zone = ease((local - 0.4) / 0.8), k = ease((local - 0.6) / Math.max(1.2, c1 + 0.4));
    ctx.save(); ctx.globalAlpha = 0.28 * zone; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 110; ctx.beginPath(); ctx.arc(sx, sy, 860, -0.62, 0.62); ctx.stroke(); ctx.restore();
    ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(226,232,240,0.55)';
    for (const r of [110, 190, 260, 395]) { ctx.beginPath(); ctx.arc(sx, sy, r, -1.2, 1.2); ctx.stroke(); }
    ctx.setLineDash([]);
    star(ctx, sx, sy, 120, t, 1, true);
    const planet = (r, a, rad, c1c, c2c) => { const x = sx + Math.cos(a) * r, y = sy + Math.sin(a) * r; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - rad, y + rad, [[0, c1c], [1, c2c]]); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); return [x, y]; };
    planet(110, 0.55, 14, '#d6d3d1', '#78716c');
    planet(190, -0.42, 22, '#fde68a', '#d97706');
    const [mx, my] = planet(395, 0.3, 26, '#fb923c', '#b91c1c');
    hq.tag(ctx, mx, my + 62, 'MARTE', { size: 26, fill: '#fdba74' });
    const er = lerp(260, 860, k), ex = sx + er, ey = sy;
    drawGlobe(ctx, ex, ey, 40, { lon0: t * 30, lat0: 15, outline: 4 });
    hq.tag(ctx, Math.min(ex, 960), ey - 74, 'TIERRA', { size: 26, fill: '#86efac' });
    if (k > 0 && k < 1) { ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 6; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(sx + 300, sy); ctx.lineTo(ex - 50, sy); ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? '3 VECES MÁS LEJOS' : 'MÁS ALLÁ DE MARTE', { size: 46, fill: '#86efac' });
    void s;
  },

  corta(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dos barras de vida: la de nuestro Sol es larga; la del Sol doble se acaba muy pronto. Los animales llegaron tarde.
    const c1 = cue(1);
    space(ctx, W, H, t);
    const g1 = ease((local - 0.2) / 1.2), g2 = ease((local - 0.2) / 0.5), x0 = 180, w = 780;
    star(ctx, 105, 640, 38, t, 0, false);
    star(ctx, 105, 860, 50, t, 1, false);
    hq.tag(ctx, 320, 565, 'NUESTRO SOL', { size: 28, fill: '#fde047' });
    hq.tag(ctx, 300, 785, 'SOL DOBLE', { size: 28, fill: '#bae6fd' });
    bar(ctx, x0, 640, w, 46, g1, '#facc15');
    bar(ctx, x0, 860, w, 46, 0.1 * g2, '#e0f2fe');
    // Fin del Sol doble: estallido.
    const b = clamp((local - 0.75) / 0.6);
    if (b > 0 && b < 1) { ctx.save(); ctx.globalAlpha = 1 - b; ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 6; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; ctx.beginPath(); ctx.moveTo(x0 + w * 0.1 + Math.cos(a) * 20 * (1 + b * 3), 860 + Math.sin(a) * 20 * (1 + b * 3)); ctx.lineTo(x0 + w * 0.1 + Math.cos(a) * 40 * (1 + b * 3), 860 + Math.sin(a) * 40 * (1 + b * 3)); ctx.stroke(); } ctx.restore(); }
    if (local > c1) {
      const k = ease((local - c1) / 0.6), mx = x0 + w * 0.4;
      ctx.save(); ctx.globalAlpha = k;
      ctx.setLineDash([12, 10]); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mx, 610); ctx.lineTo(mx, 890); ctx.stroke(); ctx.setLineDash([]);
      fish(ctx, mx, 750, 0.9);
      hq.tag(ctx, mx + 230, 750, 'AQUÍ, LOS ANIMALES', { size: 26, fill: '#fdba74' });
      ctx.lineWidth = 12; ctx.strokeStyle = '#ef4444'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - 26, 834); ctx.lineTo(mx + 26, 886); ctx.moveTo(mx + 26, 834); ctx.lineTo(mx - 26, 886); ctx.stroke();
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'VIVIRÍA 10 VECES MENOS' : 'NO HABRÍA DADO TIEMPO', { size: 42, fill: local < c1 ? '#bae6fd' : '#fca5a5' });
  },

  sirio(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Cielo de noche: Orión con las Tres Marías; su línea lleva a Sirio, que brilla y titila. Alguien la señala.
    const c1 = cue(1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 1000, [[0, '#020617'], [0.7, '#1e1b4b'], [1, '#4c1d95']]); ctx.fillRect(0, 0, W, 1000);
    kit.drawStars(ctx, STARS, 0.8, t);
    const S = { bet: [640, 470], bel: [820, 490], a1: [690, 662], a2: [730, 646], a3: [770, 630], sai: [680, 820], rig: [850, 790] };
    ctx.strokeStyle = 'rgba(191,219,254,0.3)'; ctx.lineWidth = 3;
    for (const [a, b] of [['bet', 'a1'], ['bel', 'a3'], ['a1', 'sai'], ['a3', 'rig'], ['bet', 'bel'], ['a1', 'a2'], ['a2', 'a3']]) { ctx.beginPath(); ctx.moveTo(...S[a]); ctx.lineTo(...S[b]); ctx.stroke(); }
    const dot = (p, r, c, g) => { hq.glow(ctx, p[0], p[1], r * 5, c.replace(')', ',A)').replace('rgb', 'rgba'), g); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); };
    dot(S.bet, 8, 'rgb(251,146,60)', 0.6); dot(S.bel, 6, 'rgb(191,219,254)', 0.4); dot(S.sai, 6, 'rgb(191,219,254)', 0.4); dot(S.rig, 8, 'rgb(147,197,253)', 0.6);
    for (const p of [S.a1, S.a2, S.a3]) dot(p, 8, 'rgb(224,242,254)', 0.7);
    // Sirio.
    const sir = [330, 800], tw = 1 + 0.18 * Math.sin(t * 9) + 0.1 * Math.sin(t * 23), on = ease((local - 0.3) / 0.6);
    hq.glow(ctx, sir[0], sir[1], 120 * tw * on, 'rgba(224,242,254,A)', 0.7);
    ctx.save(); ctx.translate(...sir); ctx.globalAlpha = on; ctx.fillStyle = '#ffffff';
    for (const [w, h] of [[8, 90 * tw], [90 * tw, 8]]) { ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); ctx.restore();
    if (on > 0.5) hq.tag(ctx, sir[0], sir[1] - 110, 'SIRIO', { size: 32, fill: '#bae6fd' });
    hq.tag(ctx, 740, 575, 'LAS TRES MARÍAS', { size: 24, fill: '#e2e8f0' });
    // Línea desde las Tres Marías hasta Sirio.
    if (local > c1) {
      const k = ease((local - c1) / 1.0), x = lerp(S.a3[0], sir[0] + 40, k), y = lerp(S.a3[1], sir[1] - 15, k);
      ctx.save(); ctx.setLineDash([16, 12]); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...S.a3); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
    }
    // Cerros y pueblo.
    ctx.beginPath(); ctx.moveTo(0, 1000); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 975 - 40 * Math.sin(x * 0.006 + 0.5)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 930, H, [[0, '#1e293b'], [1, '#020617']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#fde047'; ctx.fillRect(60 + i * 70, 1010 + (i % 3) * 14, 12, 10); }
    hq.toon(ctx, 850, 1100, 330, { t, seed: 9, shirt: '#6366f1', hair: '#111827', hairStyle: 'curly', skin: '#a0522d', armL: [2.35, 0.15], armR: [0.25, 0.2], eyes: 'wide', mouth: 'smile', look: [-0.8, -0.7] });
    hq.tag(ctx, 540, 410, local < c1 ? 'LA QUE MÁS BRILLA DE NOCHE' : 'BÚSCALA DE NOCHE', { size: 40, fill: '#bae6fd' });
  },
};
