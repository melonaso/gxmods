// Short 61: ¿y si el mar tuviera el doble de agua?  (SERIE EL AGUA · 7; gemelo del mar 10× salado, récord de arranque)
// Cuenta: el mar tiene ~1,335 millones de km³; el doble añade otro tanto. Repartido sobre toda la Tierra (510 millones de
// km²) sube ~2.6 km → casi todo queda bajo el agua; en México asoman los volcanes (Orizaba 5,636 m, Popocatépetl
// 5,393 m); la CDMX (2,240 m) queda bajo el agua. Final real: con la Tierra lisa, el agua de hoy la cubriría a ~2.7 km.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, sea, sunDisc, cloud, tower, fish, space, HERO } from '../../engine2d/props.js';
import { drawGlobe, geoBlob } from '../../engine2d/earth.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.06, vig: 0.3 });
  return {};
}

/** Agua translúcida desde y hacia abajo, con línea de olas. */
function water(ctx, W, H, y, t, a = 0.78) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + 8 * Math.sin(x * 0.018 + t * 2.2)); ctx.lineTo(W, H); ctx.closePath();
  ctx.globalAlpha = a; ctx.fillStyle = hq.vgrad(ctx, 0, y, H, [[0, '#38bdf8'], [1, '#0c4a6e']]); ctx.fill();
  ctx.globalAlpha = 1; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + 8 * Math.sin(x * 0.018 + t * 2.2)); ctx.stroke();
  ctx.restore();
}

function whale(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const sw = Math.sin(t * 2) * 10;
  ctx.beginPath(); ctx.moveTo(210, -10); ctx.quadraticCurveTo(260, -50 + sw, 300, -70 + sw); ctx.quadraticCurveTo(280, -10, 300, 40 + sw); ctx.quadraticCurveTo(255, 20 + sw, 210, 10); ctx.closePath();
  ctx.fillStyle = '#1e3a8a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-220, 0); ctx.quadraticCurveTo(-210, -90, -60, -95); ctx.quadraticCurveTo(140, -95, 220, -5); ctx.quadraticCurveTo(140, 70, -60, 70); ctx.quadraticCurveTo(-200, 65, -220, 0); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, -95, 70, [[0, '#2563eb'], [1, '#1e3a8a']]); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#bfdbfe'; ctx.beginPath(); ctx.ellipse(-60, 70, 170, 50, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(30,58,138,0.5)'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-200 + i * 40, 30); ctx.lineTo(-170 + i * 40, 70); ctx.stroke(); } ctx.restore();
  ctx.beginPath(); ctx.moveTo(-40, 30); ctx.quadraticCurveTo(-10, 90, 40, 95); ctx.quadraticCurveTo(10, 50, 10, 30); ctx.closePath(); ctx.fillStyle = '#1e40af'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(-150, -20, 9, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

function mountainIsland(ctx, x, y, w, h, label, { flat = false, t = 0 } = {}) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - w / 2, y);
  if (flat) { ctx.lineTo(x - w * 0.3, y - h); ctx.lineTo(x + w * 0.3, y - h); }
  else { ctx.lineTo(x - w * 0.12, y - h * 0.8); ctx.lineTo(x, y - h); ctx.lineTo(x + w * 0.15, y - h * 0.75); }
  ctx.lineTo(x + w / 2, y); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, y - h, y, [[0, '#a8a29e'], [1, '#57534e']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // Nieve.
  ctx.beginPath();
  if (flat) { ctx.moveTo(x - w * 0.3, y - h); ctx.lineTo(x + w * 0.3, y - h); ctx.lineTo(x + w * 0.24, y - h * 0.82); ctx.lineTo(x - w * 0.24, y - h * 0.82); }
  else { ctx.moveTo(x - w * 0.12, y - h * 0.8); ctx.lineTo(x, y - h); ctx.lineTo(x + w * 0.15, y - h * 0.75); ctx.lineTo(x + w * 0.05, y - h * 0.7); ctx.lineTo(x - w * 0.04, y - h * 0.76); }
  ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
  if (label) hq.tag(ctx, x, y - h - 50, label, { size: 30, fill: '#ffffff' });
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Ciudad junto al mar: el agua sube rápido hasta los techos; el protagonista en la azotea.
    const c1 = cue(1), lvl = lerp(1330, 1040, ease((local - 0.3) / 2.6));
    sky(ctx, W, 0, 1300, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 880, 560, 52, t);
    cloud(ctx, 260, 600, 110, '#ffffff');
    ground(ctx, W, H, 1300, '#a3e635', '#4d7c0f');
    kit.house(ctx, 170, 1300, 220, 176, { wall: '#fde68a', roofC: '#dc2626' });
    kit.house(ctx, 430, 1300, 240, 190, { wall: '#bfdbfe', roofC: '#7c3aed' });
    tower(ctx, 760, 1300, 200, 13, '#94a3b8', 28);
    tower(ctx, 980, 1300, 150, 9, '#64748b', 28);
    hq.toon(ctx, 760, 1300 - 13 * 28, 230, { ...HERO, t, seed: 1, armL: [1.3, -0.6], armR: [1.3, -0.6], eyes: 'open', mouth: 'o', brows: 1, look: [0, 1] });
    water(ctx, W, H, lvl, t);
    if (local > c1 + 0.3) hq.bubble(ctx, 560, 600, 300, 96, 700, 760, '¿Y MI CASA?', { size: 44 });
  },

  globo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra: el mar sube y se traga los continentes; quedan las montañas más altas.
    const c1 = cue(1), up = ease((local - 0.2) / Math.max(1.2, c1)), sink = ease((local - c1) / 1.4), lon0 = -75 + t * 6;
    space(ctx, W, H, t);
    drawGlobe(ctx, 500, 860, 380, { lon0, lat0: 15,
      polyColor: (idx, base) => (idx === 1 || idx === 18 ? base : mixc(base, '#2b7bd6', sink)),
      northCap: true,
      extra: (c, r) => { if (sink > 0.3) { c.globalAlpha = ease((sink - 0.3) / 0.5); geoBlob(c, -69, -18, 3, 12, lon0, 15, r, '#a8a29e'); geoBlob(c, -107, 39, 4, 7, lon0, 15, r, '#a8a29e'); geoBlob(c, -98, 19, 1.4, 1, lon0, 15, r, '#f8fafc'); c.globalAlpha = 1; } } });
    // Regla del nivel del mar.
    const x = 960, y0 = 1180, hh = 600;
    hq.roundRectPath(ctx, x - 30, y0 - hh, 60, hh, 18); ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    const top = y0 - hh * up; if (y0 - top - 8 > 24) { hq.roundRectPath(ctx, x - 20, top, 40, y0 - top - 8, 12); ctx.fillStyle = '#38bdf8'; ctx.fill(); }
    kit.text(ctx, `+${(2.5 * up).toFixed(1)} KM`, x - 10, y0 - hh - 50, { size: 46, fill: '#bae6fd', align: 'right' });
    hq.tag(ctx, 540, 410, local < c1 ? 'EL MAR SUBE' : 'CASI TODO, BAJO EL AGUA', { size: 46, fill: '#bae6fd' });
  },

  mexico(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte: nivel nuevo del mar; solo asoman los volcanes; abajo, la ciudad hundida.
    const c1 = cue(1), sea0 = 900;
    sky(ctx, W, 0, sea0, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 960, 560, 46, t);
    ctx.fillStyle = hq.vgrad(ctx, 0, sea0, H, [[0, '#38bdf8'], [1, '#082f49']]); ctx.fillRect(0, sea0, W, H - sea0);
    // Suelo de México (bajo el agua) y la ciudad.
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 1420); ctx.quadraticCurveTo(540, 1360, W, 1430); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = '#365314'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 0; i < 6; i++) tower(ctx, 130 + i * 150, 1400, 110, 4 + (i * 3) % 6, mixc('#64748b', '#0c4a6e', 0.4), 30);
    hq.tag(ctx, 540, 1500, 'CIUDAD DE MÉXICO', { size: 32, fill: '#bae6fd' });
    for (let i = 0; i < 3; i++) fish(ctx, ((i * 330 + t * 90) % 1300) - 110, 1200 + i * 45, 0.6, ['#facc15', '#fb923c', '#a3e635'][i], { t, seed: i, dir: -1 });
    // Volcanes que asoman.
    const k = ease(local / 0.6);
    mountainIsland(ctx, 330, sea0 + 380, 460, 380 + 260 * k, null);
    mountainIsland(ctx, 760, sea0 + 380, 420, 380 + 220 * k, null);
    // Agua por encima de las faldas.
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#0ea5e9'; ctx.fillRect(0, sea0, W, 380); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, sea0 + 6 * Math.sin(x * 0.02 + t * 2)); ctx.stroke();
    if (local > c1) { hq.tag(ctx, 330, sea0 - 260 * k - 55, 'PICO DE ORIZABA', { size: 30 }); hq.tag(ctx, 760, sea0 - 220 * k - 55, 'POPOCATÉPETL', { size: 30 }); }
    hq.tag(ctx, 540, 410, local < c1 ? 'SOLO ASOMAN LOS VOLCANES' : 'SERÍAN ISLAS', { size: 46, fill: '#fde68a' });
  },

  ballenas(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Bajo el agua: una ballena pasa sobre los rascacielos.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#38bdf8'], [0.6, '#0369a1'], [1, '#082f49']]); ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(80 + i * 230, 0); ctx.lineTo(150 + i * 230, 0); ctx.lineTo(40 + i * 230, 1400); ctx.lineTo(-40 + i * 230, 1400); ctx.closePath(); ctx.fill(); } ctx.restore();
      for (let i = 0; i < 7; i++) tower(ctx, 80 + i * 150, 1500, 120, 6 + (i * 5) % 9, mixc('#475569', '#0c4a6e', 0.5), 34);
      ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, 1500, W, H - 1500);
      whale(ctx, lerp(1250, -200, (local / Math.max(2, c1)) * 0.9), 880, 1.3, t);
      for (let i = 0; i < 12; i++) { const u = (t * 0.4 + i / 12) % 1; ctx.beginPath(); ctx.arc(100 + i * 85, 1400 - u * 900, 6 + (i % 3) * 3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill(); }
      hq.tag(ctx, 540, 410, 'BALLENAS SOBRE LA CIUDAD', { size: 46, fill: '#bae6fd' });
    } else {
      // Mar por todas partes: tres islas de montaña.
      sky(ctx, W, 0, 940, '#7dd3fc', '#f0f9ff');
      sunDisc(ctx, 880, 560, 50, t);
      sea(ctx, W, H, 940, t, { top: '#0ea5e9', bottom: '#075985' });
      const k = ease((local - c1) / 0.6);
      mountainIsland(ctx, 190, 950, 300, 260 * k, k > 0.8 ? 'ANDES' : null);
      mountainIsland(ctx, 540, 950, 340, 330 * k, k > 0.8 ? 'HIMALAYA' : null);
      mountainIsland(ctx, 880, 950, 320, 200 * k, k > 0.8 ? 'TÍBET' : null, { flat: true });
      hq.tag(ctx, 540, 410, 'LA ÚNICA TIERRA FIRME', { size: 46, fill: '#fde68a' });
    }
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra «lisa»: los continentes se aplanan y una capa de agua la cubre entera.
    const c1 = cue(1), flat = ease((local - 0.3) / 1.6), cover = ease((local - c1) / 1.2), lon0 = 20 + t * 8;
    space(ctx, W, H, t);
    const cx = 540, cy = 860, R = 360;
    if (cover > 0) { ctx.beginPath(); ctx.arc(cx, cy, R + 34 * cover, 0, TAU); ctx.fillStyle = 'rgba(56,189,248,0.85)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    drawGlobe(ctx, cx, cy, R, { lon0, lat0: 15, ocean: mixc('#2b7bd6', '#a8a29e', flat * (1 - cover)), polyColor: (idx, base) => mixc(base, '#a8a29e', flat), northCap: flat < 0.5 });
    if (cover > 0) { ctx.save(); ctx.globalAlpha = 0.75 * cover; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = '#2b7bd6'; ctx.fill(); ctx.restore(); }
    if (cover > 0.5) {
      ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + R * 0.7, cy - R * 0.7); ctx.lineTo(cx + R * 0.95, cy - R * 0.95); ctx.stroke(); ctx.restore();
      hq.tag(ctx, 840, 480, '≈ 2.7 KM DE AGUA', { size: 38, fill: '#bae6fd' });
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'SI LA TIERRA FUERA LISA…' : 'EL AGUA LA CUBRIRÍA', { size: 46, fill: '#ffffff' });
  },
};
