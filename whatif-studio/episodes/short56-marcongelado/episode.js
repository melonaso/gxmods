// Short 56: ¿y si todo el mar se congelara?  (SERIE EL AGUA · 5; gemelo del hielo que no flota)
// Gancho: el mar se congela frente a la playa → ¿podrías cruzarlo caminando? → sí, hasta otro continente, pero tardarías
// meses → el hielo blanco rebota la luz del Sol y todo se enfría más → abajo el agua sigue líquida y la vida resiste junto
// a volcanes del fondo → ya pasó: la Tierra bola de nieve (hace ~650 millones de años); la salvaron los volcanes.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, ease, lerp, mixc, sky, sea, sunDisc, cloud, space, thermometer, puff, HERO } from '../../engine2d/props.js';
import { drawGlobe, project } from '../../engine2d/earth.js';

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

/** Placa de hielo desde x0 hasta x1 (borde de avance con picos), con grietas y brillos. */
function iceSheet(ctx, x0, x1, y, H, seed = 1) {
  if (x1 <= x0) return;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x0, y - 4);
  for (let x = x0; x <= x1; x += 40) ctx.lineTo(x, y - 4 - (x % 80 ? 3 : 0));
  for (let yy = y; yy <= H; yy += 60) ctx.lineTo(x1 + (Math.floor(yy / 60) % 2 ? 22 : -10), yy);
  ctx.lineTo(x0, H); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, y, H, [[0, '#f8fafc'], [0.4, '#e0f2fe'], [1, '#bfdbfe']]); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.clip();
  const R = kit.rng(seed); ctx.strokeStyle = 'rgba(96,165,250,0.6)'; ctx.lineWidth = 4;
  for (let i = 0; i < 14; i++) { let x = x0 + R() * (x1 - x0 + 40), yy = y + 30 + R() * (H - y); ctx.beginPath(); ctx.moveTo(x, yy); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 120; yy += 20 + R() * 40; ctx.lineTo(x, yy); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 10; i++) { const x = x0 + R() * (x1 - x0), yy = y + 40 + R() * (H - y - 80); ctx.beginPath(); ctx.ellipse(x, yy, 50, 8, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function boat(ctx, x, y, s, tilt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-120, -20); ctx.lineTo(120, -20); ctx.lineTo(90, 30); ctx.lineTo(-90, 30); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-110, -14, 220, 10);
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -190); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -180); ctx.lineTo(100, -40); ctx.lineTo(8, -40); ctx.closePath(); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // El mar se congela de izquierda a derecha; el barco se queda atorado; luego el protagonista pisa el hielo.
    const c1 = cue(1), fr = ease((local - 0.3) / 1.3);
    sky(ctx, W, 0, 920, mixc('#7dd3fc', '#cbd5e1', fr), '#f0f9ff');
    sunDisc(ctx, 880, 560, 52, t, 1 - 0.4 * fr);
    sea(ctx, W, H, 920, t, { top: '#38bdf8', bottom: '#075985' });
    iceSheet(ctx, -40, lerp(-40, W + 60, fr), 920, H, 3);
    boat(ctx, 760, 945 + (fr < 0.75 ? 6 * Math.sin(t * 2) : 0), 0.9, fr > 0.75 ? -0.08 : 0.04 * Math.sin(t * 1.5));
    // Orilla de arena abajo.
    ctx.beginPath(); ctx.moveTo(0, 1360); ctx.quadraticCurveTo(500, 1300, W, 1400); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1300, H, [[0, '#fde68a'], [1, '#d97706']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (local < c1) {
      hq.toon(ctx, 260, 1380, 380, { ...HERO, t, seed: 1, armL: [0.3, 0.2], armR: [0.3, 0.2], eyes: 'open', mouth: 'o', brows: 1, look: [1, -0.3] });
    } else {
      const k = ease((local - c1) / 0.8);
      hq.toon(ctx, lerp(260, 420, k), lerp(1380, 1090, k), lerp(380, 330, k), { ...HERO, t, seed: 1, legs: 0.06 + 0.06 * Math.sin(t * 10), armL: [0.9, -0.3], armR: [0.9, -0.3], eyes: 'open', mouth: 'smile', look: [1, 0] });
      if (local > c1 + 0.4) hq.bubble(ctx, 560, 560, 300, 96, 470, 760, '¿Y SI CRUZO?', { size: 44 });
    }
  },

  caminar(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // La Tierra con los mares blancos: un camino punteado de México a Europa.
      space(ctx, W, H, t);
      const R = 400, cx = 540, cy = 860, lon0 = -50, lat0 = 22;
      drawGlobe(ctx, cx, cy, R, { lon0, lat0, ocean: '#e0f2fe', land: '#4fbf5a', ice: '#ffffff' });
      const A = project(-99, 19.4, lon0, lat0, R), B = project(-4, 40.4, lon0, lat0, R), k = ease((local - 0.3) / 1.6);
      const P = (u) => { const x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u) - Math.sin(u * Math.PI) * 120; return [cx + x, cy + y]; };
      ctx.save(); ctx.setLineDash([18, 14]); ctx.lineWidth = 9; ctx.strokeStyle = '#ef4444'; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const [x, y] = P((i / 40) * k); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
      for (const [x, y] of [P(0), P(1)]) { ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
      const [hx, hy] = P(k);
      hq.toon(ctx, hx, hy - 6, 120, { ...HERO, t, seed: 2, legs: 0.06 + 0.06 * Math.sin(t * 12), armL: [0.4, 0.3], armR: [0.4, 0.3] });
      hq.tag(ctx, 540, 410, 'A PIE HASTA EUROPA', { size: 46, fill: '#bae6fd' });
    } else {
      // Caminando sobre hielo sin fin; el calendario avanza.
      sky(ctx, W, 0, 1000, '#94a3b8', '#e2e8f0');
      const sx = lerp(160, 920, ((local - c1) * 0.6) % 1);
      sunDisc(ctx, sx, 640 - Math.sin(((local - c1) * 0.6 % 1) * Math.PI) * 120, 44, t, 0.8);
      iceSheet(ctx, -40, W + 60, 1000, H, 7);
      const off = (t * 120) % 240;
      ctx.fillStyle = 'rgba(148,163,184,0.5)'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(i * 240 - off, 1080, 22, 8, 0, 0, TAU); ctx.fill(); }
      hq.toon(ctx, 470, 1130, 400, { ...HERO, t, seed: 3, legs: 0.05 + 0.07 * Math.sin(t * 9), armL: [0.35 + 0.2 * Math.sin(t * 9), 0.2], armR: [0.35 - 0.2 * Math.sin(t * 9), 0.2], eyes: 'open', mouth: 'flat', brows: -0.5, look: [1, 0],
        hold: (c, h) => { const [bx, by] = h.L; hq.roundRectPath(c, bx - 30, by - 40, 60, 70, 12); c.fillStyle = '#f97316'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); } });
      // Calendario.
      const n = Math.min(6, 1 + Math.floor((local - c1) * 2.4));
      hq.roundRectPath(ctx, 780, 560, 210, 190, 18); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.fillRect(783, 563, 204, 44);
      ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText('MES', 885, 586);
      ctx.font = '900 96px Inter, sans-serif'; ctx.fillStyle = INK; ctx.fillText(String(n), 885, 680);
      hq.tag(ctx, 540, 410, 'MESES CAMINANDO', { size: 46, fill: '#fde68a' });
    }
  },

  frio(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Los rayos del Sol pegan en el hielo y rebotan al cielo; el termómetro baja.
    const c1 = cue(1), cold = ease((local - c1) / 1.4);
    sky(ctx, W, 0, 1000, mixc('#7dd3fc', '#64748b', cold), mixc('#e0f2fe', '#cbd5e1', cold));
    sunDisc(ctx, 170, 540, 70, t);
    iceSheet(ctx, -40, W + 60, 1000, H, 11);
    for (let i = 0; i < 4; i++) {
      const x1 = 380 + i * 150, y1 = 1000, u = ((t * 0.8 + i * 0.25) % 1);
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(230, 600); ctx.lineTo(x1, y1); ctx.lineTo(x1 + 260, 600); ctx.stroke();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8; ctx.stroke();
      // Puntita que viaja por el rayo.
      const [px, py] = u < 0.5 ? [lerp(230, x1, u * 2), lerp(600, y1, u * 2)] : [lerp(x1, x1 + 260, (u - 0.5) * 2), lerp(y1, 600, (u - 0.5) * 2)];
      ctx.beginPath(); ctx.arc(px, py, 13, 0, TAU); ctx.fillStyle = '#fef08a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    thermometer(ctx, 940, 1300, 360, lerp(0.45, 0.06, cold), '#3b82f6');
    if (local > c1) { hq.toon(ctx, 230, 1340, 320, { ...HERO, t: t * 3, seed: 4, armL: [0.9, 1.6], armR: [0.9, 1.6], eyes: 'closed', mouth: 'flat', brows: -1, lean: 0.03 * Math.sin(t * 30) }); }
    hq.tag(ctx, 540, 410, local < c1 ? 'EL HIELO REBOTA LA LUZ' : 'MÁS Y MÁS FRÍO', { size: 46, fill: local < c1 ? '#fde047' : '#bae6fd' });
  },

  vida(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte: hielo grueso arriba, agua líquida abajo y un volcancito del fondo con vida alrededor (arriba de los subtítulos).
    const c1 = cue(1);
    sky(ctx, W, 0, 470, '#cbd5e1', '#f1f5f9');
    ctx.fillStyle = hq.vgrad(ctx, 0, 640, H, [[0, '#1d4ed8'], [1, '#0b1440']]); ctx.fillRect(0, 640, W, H - 640);
    iceSheet(ctx, -40, W + 60, 470, 660, 5);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 660); ctx.lineTo(W, 660); ctx.stroke();
    hq.toon(ctx, 900, 476, 150, { ...HERO, t, seed: 5, armL: [0.3, 0.2], armR: [0.3, 0.2] });
    hq.tag(ctx, 230, 720, 'AGUA LÍQUIDA', { size: 32, fill: '#bae6fd' });
    // Fondo y chimenea volcánica.
    ctx.beginPath(); ctx.moveTo(0, 1150); ctx.quadraticCurveTo(540, 1090, W, 1160); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 1090, H, [[0, '#44403c'], [1, '#1c1917']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(430, 1130); ctx.lineTo(505, 880); ctx.lineTo(575, 880); ctx.lineTo(650, 1130); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 880, 1130, [[0, '#57534e'], [1, '#1c1917']]); ctx.fill(); ctx.stroke();
    hq.glow(ctx, 540, 870, 110, 'rgba(251,146,60,1)', 0.5);
    ctx.fillStyle = '#f97316'; ctx.fillRect(512, 872, 56, 12);
    for (let i = 0; i < 6; i++) { const u = (t * 0.5 + i / 6) % 1; ctx.save(); ctx.globalAlpha = 0.8 * (1 - u); ctx.beginPath(); ctx.arc(540 + 24 * Math.sin(u * 7 + i), 860 - u * 170, 20 + u * 36, 0, TAU); ctx.fillStyle = '#57534e'; ctx.fill(); ctx.restore(); }
    // Vida: camaroncitos y gusanos.
    const life = local < c1 ? 0.35 : ease((local - c1) / 0.8);
    ctx.save(); ctx.globalAlpha = life;
    const R = kit.rng(9);
    for (let i = 0; i < 9; i++) {
      const a = R() * TAU, r = 170 + R() * 170, x = 540 + Math.cos(a + t * 0.4) * r, y = 960 + Math.sin(a + t * 0.4) * r * 0.32;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 14, 0, 0, TAU); ctx.fillStyle = '#fb7185'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-50, -12); ctx.lineTo(-50, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(18, -3, 3.5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
      ctx.restore();
    }
    for (const x of [330, 380, 720, 770, 820]) { ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x, 1130); ctx.quadraticCurveTo(x + 10 * Math.sin(t * 2 + x), 1070, x, 1020); ctx.stroke(); ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 10; ctx.stroke(); ctx.beginPath(); ctx.arc(x, 1014, 15, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
    hq.tag(ctx, 540, 410, local < c1 ? 'ABAJO SIGUE LÍQUIDA' : 'LA VIDA RESISTE', { size: 46, fill: local < c1 ? '#bae6fd' : '#86efac' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra blanca (bola de nieve) con volcanes que echan gas; después el hielo se derrite.
    const c1 = cue(1), melt = ease((local - c1 - 0.4) / 2.0);
    space(ctx, W, H, t);
    const R = 380, cx = 540, cy = 860, lon0 = 20 + t * 6;
    drawGlobe(ctx, cx, cy, R, { lon0, lat0: 15, ocean: mixc('#f1f5f9', '#2b7bd6', melt), land: mixc('#e2e8f0', '#4fbf5a', melt), ice: '#ffffff' });
    // Volcanes en el borde del globo.
    for (const [a, s] of [[-2.2, 1], [-0.9, 0.9], [-1.5, 1.1]]) {
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(-50, 10); ctx.lineTo(-16, -50); ctx.lineTo(16, -50); ctx.lineTo(50, 10); ctx.closePath(); ctx.fillStyle = '#57534e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#f97316'; ctx.fillRect(-14, -54, 28, 10);
      const g = local > c1 ? 1 : 0.4;
      for (let i = 0; i < 5; i++) { const u = (t * 0.6 + i / 5) % 1; ctx.save(); ctx.globalAlpha = g * 0.85 * (1 - u); ctx.beginPath(); ctx.arc(14 * Math.sin(u * 6 + i), -60 - u * 150 * g, 20 + u * 36, 0, TAU); ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(11,15,26,0.5)'; ctx.stroke(); ctx.restore(); }
      ctx.restore();
    }
    if (local < c1) {
      hq.tag(ctx, 540, 410, 'LA TIERRA BOLA DE NIEVE', { size: 44, fill: '#e0f2fe' });
      hq.tag(ctx, 540, 880, 'HACE 650 MILLONES DE AÑOS', { size: 36, fill: '#fde68a' });
    } else {
      hq.tag(ctx, 540, 410, melt < 0.5 ? 'LOS VOLCANES LA CALENTARON' : '¡SE DERRITIÓ!', { size: 44, fill: '#fdba74' });
    }
  },
};
