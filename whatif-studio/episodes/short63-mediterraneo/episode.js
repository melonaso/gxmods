// Short 63: ¿y si se secara el mar Mediterráneo?  (SERIE EL AGUA · 9)
// Gancho: el mar baja y los barcos quedan en seco → un hoyo de casi 3 km cubierto de sal → peces y delfines atrapados en
// charcos cada vez más salados → se podría caminar de España a África; abajo, calor de horno → ya pasó: hace casi
// 6 millones de años (crisis salina del Messiniense) y se volvió a llenar con una inundación gigante por Gibraltar.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, sea, sunDisc, cloud, fish, saltCube, thermometer, space, HERO } from '../../engine2d/props.js';
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

function boat(ctx, x, y, s, tilt = 0, color = '#2563eb') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-110, -20); ctx.lineTo(110, -20); ctx.lineTo(80, 28); ctx.lineTo(-80, 28); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-100, -14, 200, 9);
  hq.roundRectPath(ctx, -40, -70, 70, 50, 8); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();
}

function whiteHouses(ctx, x0, y, n) {
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 92, h = 70 + (i % 3) * 26;
    hq.roundRectPath(ctx, x, y - h, 84, h, 6); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#1d4ed8'; hq.roundRectPath(ctx, x + 28, y - h + 18, 26, 24, 5); ctx.fill(); ctx.stroke();
    if (i % 2 === 0) { ctx.beginPath(); ctx.arc(x + 42, y - h, 22, Math.PI, TAU); ctx.fillStyle = '#2563eb'; ctx.fill(); ctx.stroke(); }
  }
}

/** Costra de sal con cubitos (franja de y0 hacia abajo). */
function saltFloor(ctx, W, y0, y1, seed = 3, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = hq.vgrad(ctx, 0, y0, y1, [[0, '#f8fafc'], [1, '#cbd5e1']]); ctx.fillRect(0, y0, W, y1 - y0);
  const R = kit.rng(seed); ctx.strokeStyle = 'rgba(100,116,139,0.6)'; ctx.lineWidth = 3;
  for (let i = 0; i < 18; i++) { let x = R() * W, y = y0 + 10 + R() * (y1 - y0 - 20); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 140; y += (R() - 0.5) * 40; ctx.lineTo(x, y); } ctx.stroke(); }
  for (let i = 0; i < 24; i++) saltCube(ctx, R() * W, y0 + 14 + R() * (y1 - y0 - 30), 14 + R() * 10, R() * 2);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Costa mediterránea: el mar baja y los barcos quedan en el fondo inclinado.
    const c1 = cue(1), drop = ease((local - 0.3) / 2.4), lvl = lerp(980, 1600, drop);
    sky(ctx, W, 0, H, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 880, 560, 52, t);
    // Fondo marino que aparece (pendiente de arena).
    ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(380, 1000); ctx.quadraticCurveTo(700, 1160, W, 1700); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#d6b77a'], [1, '#8a6a33']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // Agua (baja).
    ctx.save(); ctx.beginPath(); ctx.rect(0, lvl, W, H - lvl); ctx.clip();
    sea(ctx, W, H, lvl, t, { top: '#0ea5e9', bottom: '#075985' }); ctx.restore();
    // Acantilado con casas blancas.
    ctx.beginPath(); ctx.moveTo(0, 760); ctx.lineTo(360, 760); ctx.lineTo(420, 1000); ctx.lineTo(0, 1000); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 760, 1000, [[0, '#d6d3d1'], [1, '#a8a29e']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    whiteHouses(ctx, 20, 760, 3);
    // Barcos: flotan… y luego quedan varados en la pendiente.
    const bed = (x) => { const u = clamp((x - 380) / 700); return (1 - u) ** 2 * 1000 + 2 * u * (1 - u) * 1160 + u * u * 1700; };
    for (const [x, c, s0] of [[600, '#dc2626', 0.8], [880, '#2563eb', 0.9]]) {
      const yb = bed(x) - 22, onBed = lvl - 8 > yb;
      boat(ctx, x, onBed ? yb : lvl - 8, s0, onBed ? 0.35 : 0.03 * Math.sin(t * 2 + x), c);
    }
    hq.toon(ctx, 300, 768, 230, { ...HERO, t, seed: 1, armL: [0.3, 0.2], armR: [1.2, -0.5], eyes: 'open', mouth: 'o', brows: 1, look: [1, 0.6] });
    if (local > c1) hq.bubble(ctx, 600, 600, 300, 96, 360, 600, '¿Y EL MAR?', { size: 44 });
  },

  fondo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte: un hoyo de casi 3 km; abajo, un desierto blanco de sal; el protagonista diminuto.
    const c1 = cue(1), salt = ease((local - c1 + 0.3) / 1.0);
    sky(ctx, W, 0, H, '#7dd3fc', '#e0f2fe');
    sunDisc(ctx, 900, 520, 46, t);
    ctx.beginPath(); ctx.moveTo(0, 700); ctx.lineTo(150, 700); ctx.quadraticCurveTo(250, 1060, 420, 1100); ctx.lineTo(700, 1100); ctx.quadraticCurveTo(870, 1060, 930, 700); ctx.lineTo(W, 700); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 700, H, [[0, '#c2410c'], [1, '#7c2d12']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.moveTo(320, 1040); ctx.lineTo(800, 1040); ctx.lineTo(750, 1100); ctx.lineTo(390, 1100); ctx.closePath(); ctx.clip(); saltFloor(ctx, W, 1030, 1110, 5, salt); ctx.restore();
    hq.toon(ctx, 560, 1042, 70, { ...HERO, t, seed: 2 });
    // Flecha de profundidad.
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.setLineDash([18, 14]);
    ctx.beginPath(); ctx.moveTo(980, 710); ctx.lineTo(980, 1095); ctx.stroke(); ctx.restore();
    kit.text(ctx, '≈ 3 KM', 870, 880, { size: 56, fill: '#fde68a' });
    hq.tag(ctx, 540, 410, local < c1 ? 'UN HOYO DE CASI 3 KM' : 'UN DESIERTO DE SAL', { size: 46, fill: local < c1 ? '#fdba74' : '#f8fafc' });
  },

  charcos(ctx, o) {
    const { W, H, local, t } = o;
    // Salinas con charcos que se encogen; peces y un delfín atrapados.
    const shrink = ease(local / 3.0);
    sky(ctx, W, 0, 700, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 880, 540, 60, t);
    saltFloor(ctx, W, 700, H, 9);
    for (const [x, y, rx, ry] of [[300, 840, 240, 90], [790, 990, 200, 80]]) {
      const k = lerp(1, 0.55, shrink);
      ctx.beginPath(); ctx.ellipse(x, y, rx * k, ry * k, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - ry, y + ry, [[0, '#5eead4'], [1, '#0f766e']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    }
    fish(ctx, 250 + 20 * Math.sin(t * 2), 860, 0.7, '#facc15', { t, seed: 1 });
    fish(ctx, 830, 990, 0.7, '#fb923c', { t, seed: 2, dir: -1, sick: shrink * 0.6 });
    // Delfín.
    ctx.save(); ctx.translate(360, 820 + 6 * Math.sin(t * 3)); ctx.rotate(-0.2);
    ctx.beginPath(); ctx.moveTo(-120, 0); ctx.quadraticCurveTo(-40, -60, 90, -20); ctx.quadraticCurveTo(140, -10, 150, 0); ctx.quadraticCurveTo(100, 20, -120, 0); ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(10, -80); ctx.lineTo(30, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(110, -12, 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
    hq.tag(ctx, 540, 410, 'ATRAPADOS EN CHARCOS SALADOS', { size: 40, fill: '#bae6fd' });
  },

  caminar(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Mapa caricatura: España arriba, África abajo, el mar seco en medio; camino a pie.
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, W, H);
      saltFloor(ctx, W, 700, 1300, 12);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 640); ctx.quadraticCurveTo(700, 760, 420, 700); ctx.quadraticCurveTo(200, 660, 0, 760); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, 760, [[0, '#86efac'], [1, '#16a34a']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, 1280); ctx.quadraticCurveTo(600, 1200, 300, 1300); ctx.quadraticCurveTo(140, 1340, 0, 1260); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 1260, 1260, H, [[0, '#fbbf24'], [1, '#b45309']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      kit.text(ctx, 'ESPAÑA', 260, 560, { size: 64, fill: '#ffffff' });
      kit.text(ctx, 'ÁFRICA', 760, 1480, { size: 64, fill: '#ffffff' });
      const k = ease((local - 0.2) / Math.max(1.4, c1 - 0.4));
      ctx.save(); ctx.setLineDash([18, 14]); ctx.lineWidth = 9; ctx.strokeStyle = '#ef4444'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(380, 720); ctx.quadraticCurveTo(500, 1000, lerp(380, 620, k), lerp(720, 1260, k)); ctx.stroke(); ctx.restore();
      hq.toon(ctx, lerp(380, 620, k), lerp(740, 1250, k), 150, { ...HERO, t, seed: 3, legs: 0.06 + 0.06 * Math.sin(t * 10) });
      hq.tag(ctx, 540, 410, 'DE ESPAÑA A ÁFRICA, A PIE', { size: 44, fill: '#fde68a' });
    } else {
      // Abajo del hoyo: calor de horno.
      sky(ctx, W, 0, 1000, '#f97316', '#fde68a');
      sunDisc(ctx, 820, 560, 80, t);
      ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { const y = 700 + i * 50; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + 8 * Math.sin(x * 0.03 + t * 4 + i)); ctx.stroke(); } ctx.restore();
      saltFloor(ctx, W, 1000, H, 14);
      hq.toon(ctx, 420, 1260, 400, { ...HERO, t, seed: 4, armL: [0.5, 0.4], armR: [1.4, -1.2], eyes: 'closed', mouth: 'o', brows: -1, blush: 1 });
      for (let i = 0; i < 4; i++) { const u = (t * 1.1 + i / 4) % 1; ctx.save(); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(370 + i * 35, 880 + u * 140, 9, 14, 0, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      thermometer(ctx, 900, 1230, 320, 0.95, '#ef4444');
      hq.tag(ctx, 540, 410, 'CALOR DE HORNO', { size: 50, fill: '#fde047' });
    }
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra vista sobre el Mediterráneo: primero blanco de sal; luego el agua entra por Gibraltar y lo llena.
    const c1 = cue(1), fill = ease((local - c1 - 0.3) / 2.2), lon0 = 12, lat0 = 30;
    space(ctx, W, H, t);
    const BL = [[-1, 37.5, 5, 2.4], [5, 40, 5, 3], [12, 39, 4, 3], [18, 35, 6, 3], [25, 34.5, 6, 2.5], [31, 34, 4, 2.2], [16, 42.5, 2.5, 2.2]];
    drawGlobe(ctx, 540, 880, 400, { lon0, lat0, extra: (c, r) => {
      BL.forEach(([lo, la, rl, ra], i) => { const k = clamp(fill * BL.length * 1.1 - i); geoBlob(c, lo, la, rl, ra, lon0, lat0, r, mixc('#f8fafc', '#2b7bd6', k), 0.1); });
    } });
    if (local > c1) {
      // Chorro gigante en Gibraltar.
      const gx = 540 - 400 * 0.27, gy = 880 - 400 * 0.12;
      ctx.save(); ctx.strokeStyle = '#38bdf8'; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const u = (t * 1.5 + i / 4) % 1; ctx.globalAlpha = 1 - u; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(gx - 120, gy - 10); ctx.quadraticCurveTo(gx - 40, gy - 20, gx + 60 * u + 10, gy - 4); ctx.stroke(); }
      ctx.restore();
      hq.tag(ctx, 330, 760, 'GIBRALTAR', { size: 30, fill: '#bae6fd' });
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'HACE CASI 6 MILLONES DE AÑOS' : 'UNA INUNDACIÓN GIGANTE', { size: 40, fill: local < c1 ? '#f8fafc' : '#bae6fd' });
  },
};
