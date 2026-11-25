// Short 60: ¿y si la Tierra estuviera acostada?  (SERIE LA TIERRA · 3; eje inclinado 90° en lugar de 23.4°)
// Gancho: el globo se acuesta → en invierno, en México, más de un mes sin Sol (≈ 40 días en la CDMX) → en verano, más de
// un mes sin noche: el Sol da vueltas en el cielo → veranos de horno, inviernos de congelador; los polos con el Sol
// encima durante meses → existe: Urano está acostado; cada polo pasa 42 años de día y 42 de noche.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, ease, lerp, mixc, sky, ground, sunDisc, space, thermometer, puff, HERO } from '../../engine2d/props.js';
import { drawGlobe } from '../../engine2d/earth.js';

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

/** Globo visto de lado, inclinado `tilt` rad (0 = eje vertical), con su eje y la noche a la derecha (Sol a la izquierda). */
function tiltedGlobe(ctx, cx, cy, R, tilt, t, { spin = 30, night = 0.85, onTop = null } = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  ctx.lineCap = 'round';
  for (const [w, c] of [[22, INK], [12, '#e2e8f0']]) { ctx.beginPath(); ctx.moveTo(0, -R * 1.3); ctx.lineTo(0, R * 1.3); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
  drawGlobe(ctx, 0, 0, R, { lon0: -t * spin, lat0: 0 });
  if (onTop) onTop(ctx, R);
  ctx.restore();
  if (night > 0) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const g = ctx.createLinearGradient(cx - R * 0.1, 0, cx + R * 0.3, 0); g.addColorStop(0, 'rgba(5,10,35,0)'); g.addColorStop(1, `rgba(5,10,35,${night})`);
    ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); ctx.restore();
  }
}

function calendar(ctx, x, y, n, top = 'SIN SOL', color = '#1e3a8a') {
  hq.roundRectPath(ctx, x - 130, y - 120, 260, 240, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = color; hq.roundRectPath(ctx, x - 130, y - 120, 260, 70, 22); ctx.fill(); ctx.stroke(); ctx.fillRect(x - 126, y - 80, 252, 28);
  kit.text(ctx, top, x, y - 84, { size: 34, fill: '#ffffff', stroke: null });
  kit.text(ctx, `DÍA ${n}`, x, y + 30, { size: 64, fill: INK, stroke: null });
}

function lights(ctx, x0, x1, y, t) {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 60, x1, y); ctx.stroke();
  const C = ['#f87171', '#fde047', '#4ade80', '#60a5fa'];
  for (let i = 0; i <= 10; i++) { const u = i / 10, x = lerp(x0, x1, u), yy = y + 60 * 4 * u * (1 - u) * 0.5 + 6; const on = Math.sin(t * 5 + i * 1.3) > -0.3; hq.glow(ctx, x, yy, 26, C[i % 4], on ? 0.6 : 0.1); ctx.beginPath(); ctx.arc(x, yy, 10, 0, TAU); ctx.fillStyle = on ? C[i % 4] : '#475569'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}

function stars(ctx, W, y1, t) {
  const R = kit.rng(7); ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * y1; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); ctx.beginPath(); ctx.arc(x, y, 2 + R() * 3, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}

function bed(ctx, x, y, w) {
  hq.roundRectPath(ctx, x - w / 2, y - 60, w, 90, 18); ctx.fillStyle = '#60a5fa'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  hq.roundRectPath(ctx, x - w / 2 - 20, y - 170, 40, 230, 14); ctx.fillStyle = '#92400e'; ctx.fill(); ctx.stroke();
  hq.roundRectPath(ctx, x + w / 2 - 20, y - 120, 40, 180, 14); ctx.fill(); ctx.stroke();
  hq.roundRectPath(ctx, x - w / 2 + 30, y - 100, 130, 50, 20); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
}

function uranus(ctx, cx, cy, R, t, { dark = 0 } = {}) {
  // Anillos casi verticales (el eje está acostado).
  const ring = (front) => { ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.28, R * 1.55, 0.06, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(226,232,240,0.85)'; ctx.stroke(); ctx.restore(); };
  ring(false);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, cy - R, cy + R, [[0, '#a5f3fc'], [1, '#0e7490']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 26; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 70, cy - R); ctx.lineTo(cx + i * 70 + 10, cy + R); ctx.stroke(); }
  if (dark > 0) { const g = ctx.createLinearGradient(cx - R * 0.1, 0, cx + R * 0.3, 0); g.addColorStop(0, 'rgba(5,10,35,0)'); g.addColorStop(1, `rgba(5,10,35,${dark})`); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ring(true);
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // El globo (con su eje) se acuesta; el muñequito de arriba termina de lado.
    const c1 = cue(1), k = ease((local - 0.35) / 1.0), tilt = lerp(-0.41, -Math.PI / 2, k), cx = 600, cy = 900, R = 300;
    space(ctx, W, H, t);
    sunDisc(ctx, 120, 600, 66, t);
    tiltedGlobe(ctx, cx, cy, R, tilt, t, { night: 0.7, onTop: (c, r) => hq.toon(c, 0, -r + 4, 165, { ...HERO, t, seed: 1, armL: [1.3, -0.5], armR: [1.3, -0.5], eyes: 'open', mouth: k > 0.5 ? 'o' : 'smile', brows: k > 0.5 ? 1 : 0 }) });
    if (local > c1) hq.tag(ctx, 600, 1330, 'ACOSTADA: 90°', { size: 46, fill: '#fde68a' });
  },

  invierno(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Pueblo de noche en pleno día: luces de Navidad, linterna y un calendario que cuenta los días sin Sol.
    const c1 = cue(1);
    sky(ctx, W, 0, 1060, '#020617', '#1e1b4b'); stars(ctx, W, 1000, t);
    ctx.beginPath(); ctx.arc(170, 580, 60, 0, TAU); ctx.fillStyle = '#f1f5f9'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const casas = [[150, 230, '#f472b6'], [420, 250, '#fbbf24'], [690, 230, '#60a5fa'], [940, 210, '#a3e635']];
    for (const [x, w, c] of casas) kit.house(ctx, x, 1070, w, w * 0.8, { wall: mixc(c, '#1e293b', 0.45), roofC: '#7f1d1d', lit: 0.9 });
    lights(ctx, 20, 520, 760, t); lights(ctx, 560, 1060, 770, t + 1);
    ground(ctx, W, H, 1060, '#334155', '#0f172a');
    const n = local < c1 ? 1 + Math.floor(ease(local / Math.max(1, c1)) * 12) : Math.min(40, 13 + Math.floor((local - c1) * 30));
    calendar(ctx, 850, 560, n);
    // Linterna.
    hq.toon(ctx, 380, 1150, 340, { ...HERO, t, seed: 2, armR: [1.25, -0.2], armL: [0.3, 0.2], eyes: 'open', mouth: 'flat', brows: -0.5, look: [1, -0.2],
      hold: (c, h) => { const [hx, hy] = h.R; c.save(); c.globalAlpha = 0.35; c.beginPath(); c.moveTo(hx + 20, hy); c.lineTo(hx + 360, hy - 110); c.lineTo(hx + 360, hy + 110); c.closePath(); c.fillStyle = '#fef08a'; c.fill(); c.restore(); hq.roundRectPath(c, hx - 10, hy - 16, 50, 32, 8); c.fillStyle = '#facc15'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); } });
    hq.tag(ctx, 540, 410, local < c1 ? 'EN INVIERNO, SIN SOL' : '¡MÁS DE UN MES!', { size: 48, fill: '#bae6fd' });
  },

  verano(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Medianoche y el Sol arriba: intenta dormir con antifaz; luego el Sol da vueltas sin meterse.
    const c1 = cue(1);
    sky(ctx, W, 0, 1080, '#38bdf8', '#e0f2fe');
    const a = t * 1.6, sx = 540 + Math.cos(a) * 330, sy = 720 + Math.sin(a) * 140;
    if (local > c1) { ctx.save(); ctx.setLineDash([18, 14]); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(180,83,9,0.7)'; ctx.beginPath(); ctx.ellipse(540, 720, 330, 140, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    sunDisc(ctx, local > c1 ? sx : 760, local > c1 ? sy : 640, 70, t);
    ground(ctx, W, H, 1080, '#4ade80', '#15803d');
    bed(ctx, 540, 1130, 520);
    hq.toon(ctx, 760, 1040, 330, { ...HERO, t, seed: 3, lean: -Math.PI / 2, eyes: 'closed', mouth: 'flat', brows: -1, armL: [0.3, 0.2], armR: [0.3, 0.2] });
    // Antifaz.
    ctx.save(); ctx.translate(760 - 330 * 0.914, 1040); hq.roundRectPath(ctx, -14, -46, 30, 92, 12); ctx.fillStyle = '#7c3aed'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    // Reloj: 3:00 a. m.
    hq.roundRectPath(ctx, 760, 480, 280, 110, 18); ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    kit.text(ctx, '3:00 AM', 900, 538, { size: 56, fill: '#f87171', stroke: null });
    hq.tag(ctx, 470, 410, local < c1 ? 'EN VERANO, SIN NOCHE' : 'EL SOL DA VUELTAS', { size: 46, fill: '#fde68a' });
  },

  extremos(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Mitad horno, mitad congelador.
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
      sky(ctx, W, 0, 1080, '#f97316', '#fde68a'); sunDisc(ctx, 120, 600, 80, t);
      ground(ctx, W, H, 1080, '#f59e0b', '#92400e');
      hq.toon(ctx, 280, 1130, 330, { ...HERO, t, seed: 4, eyes: 'closed', mouth: 'o', brows: -1, armL: [0.5, 0.4], armR: [0.5, 0.4], blush: 1 });
      for (let i = 0; i < 4; i++) { const u = (t * 1.2 + i / 4) % 1; ctx.save(); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(220 + i * 40, 800 + u * 120, 9, 14, 0, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      thermometer(ctx, 470, 980, 300, 0.95, '#ef4444');
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
      sky(ctx, W, 0, 1080, '#1e3a8a', '#93c5fd');
      ground(ctx, W, H, 1080, '#f1f5f9', '#cbd5e1');
      for (let i = 0; i < 30; i++) { const x = W / 2 + ((i * 97.1) % (W / 2)), y = 480 + ((i * 131.3 + t * 140) % 600); ctx.beginPath(); ctx.arc(x, y, 5 + (i % 3) * 2, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
      hq.toon(ctx, 800, 1130, 330, { ...HERO, t: t * 3, seed: 5, eyes: 'closed', mouth: 'flat', brows: -1, armL: [0.9, 1.6], armR: [0.9, 1.6], lean: 0.03 * Math.sin(t * 30) });
      thermometer(ctx, 1000, 980, 300, 0.05, '#3b82f6');
      ctx.restore();
      ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      hq.tag(ctx, 540, 410, 'HORNO Y CONGELADOR', { size: 48, fill: '#ffffff' });
    } else {
      // El polo norte apunta al Sol: el hielo se derrite.
      space(ctx, W, H, t);
      sunDisc(ctx, 90, 860, 90, t);
      ctx.save(); ctx.strokeStyle = 'rgba(253,224,71,0.6)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(200, 860 + i * 60); ctx.lineTo(330, 860 + i * 70); ctx.stroke(); } ctx.restore();
      tiltedGlobe(ctx, 650, 860, 290, -Math.PI / 2, t, { night: 0.6 });
      for (let i = 0; i < 4; i++) { const u = (t * 0.9 + i / 4) % 1; ctx.save(); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(380 + 10 * Math.sin(i), 790 + i * 40 + u * 80, 10, 15, 0, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      hq.tag(ctx, 540, 410, 'EL POLO, BAJO EL SOL', { size: 48, fill: '#fde68a' });
      hq.tag(ctx, 540, 500, 'MESES SIN PARAR', { size: 36, fill: '#ffffff' });
    }
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    space(ctx, W, H, t);
    sunDisc(ctx, 70, 860, 60, t);
    uranus(ctx, 600, 860, 270, t, { dark: local > c1 ? 0.85 : 0.5 });
    if (local < c1) {
      hq.tag(ctx, 540, 410, 'URANO ESTÁ ACOSTADO', { size: 48, fill: '#a5f3fc' });
    } else {
      const k = ease((local - c1) / 0.4);
      ctx.save(); ctx.globalAlpha = k;
      hq.tag(ctx, 330, 860, '42 AÑOS DE DÍA', { size: 36, fill: '#fde68a' });
      hq.tag(ctx, 860, 860, '42 AÑOS DE NOCHE', { size: 36, fill: '#c7d2fe' });
      ctx.restore();
      hq.tag(ctx, 540, 410, 'CADA POLO', { size: 50, fill: '#a5f3fc' });
    }
  },
};
