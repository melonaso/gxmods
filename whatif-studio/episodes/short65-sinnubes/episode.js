// Short 65: ¿y si desaparecieran las nubes?  (SERIE EL AGUA · 11)
// Gancho: las nubes desaparecen → días mucho más calientes (las nubes rebotan parte de la luz del Sol) → noches mucho
// más frías (son una cobija que guarda el calor) → sin nubes no hay lluvia ni nieve → una nube normal (cúmulo de 1 km)
// pesa ~500 toneladas (USGS: 1.1 millones de libras) ≈ 100 elefantes; flota porque sus gotitas son diminutas.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, sunDisc, cloud, bushyTree, thermometer, cracks, HERO } from '../../engine2d/props.js';

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

function elephant(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (const lx of [-14, -4, 8, 18]) { ctx.fillRect(lx - 4, 4, 8, 14); ctx.strokeRect(lx - 4, 4, 8, 14); }
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(24, -6, 11, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(32, -2); ctx.quadraticCurveTo(40, 8, 34, 18); ctx.lineWidth = 5; ctx.stroke(); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(18, -6, 6, 9, 0, 0, TAU); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function rays(ctx, x0, y0, targets, t, color = '#fde047') {
  ctx.save(); ctx.lineCap = 'round';
  for (const [x1, y1] of targets) {
    for (const [w, c] of [[16, INK], [8, color]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
    const u = (t * 0.9 + x1 * 0.001) % 1; ctx.beginPath(); ctx.arc(lerp(x0, x1, u), lerp(y0, y1, u), 11, 0, TAU); ctx.fillStyle = '#fef08a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}

function stars(ctx, W, y1, t) {
  const R = kit.rng(5); ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * y1; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); ctx.beginPath(); ctx.arc(x, y, 2 + R() * 3, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Cielo nublado: las nubes se esfuman una tras otra; el protagonista cambia el paraguas por lentes de sol.
    const c1 = cue(1);
    sky(ctx, W, 0, 1150, mixc('#94a3b8', '#38bdf8', ease((local - 0.6) / 1.4)), '#e0f2fe');
    sunDisc(ctx, 860, 560, 60, t, ease((local - 0.8) / 1));
    const CL = [[220, 560, 130], [600, 520, 160], [900, 700, 120], [380, 780, 110], [760, 880, 100]];
    CL.forEach(([x, y, s], i) => { const k = 1 - ease((local - 0.5 - i * 0.18) / 0.35); if (k > 0) cloud(ctx, x, y, s * (0.6 + 0.4 * k), '#e2e8f0', k); });
    ground(ctx, W, H, 1150, '#86efac', '#15803d');
    const sunny = local > c1;
    hq.toon(ctx, 400, 1400, 400, { ...HERO, t, seed: 1, armR: [1.3, -0.6], armL: [0.3, 0.2], eyes: sunny ? 'happy' : 'open', mouth: sunny ? 'smile' : 'o', look: [0.4, -1],
      hold: (c, h) => { if (sunny) return; const [hx, hy] = h.R; c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, hy - 190); c.stroke(); c.beginPath(); c.moveTo(hx - 130, hy - 190); c.quadraticCurveTo(hx, hy - 330, hx + 130, hy - 190); c.closePath(); c.fillStyle = '#7c3aed'; c.fill(); c.lineWidth = 6; c.stroke(); } });
    if (sunny) { // lentes oscuros
      const hy = 1400 - 400 * 0.914; ctx.fillStyle = INK; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(400 + sx * 22, hy, 20, 13, 0, 0, TAU); ctx.fill(); } ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(390, hy); ctx.lineTo(410, hy); ctx.stroke();
      hq.bubble(ctx, 740, 640, 300, 96, 480, 920, '¡PURO SOL!', { size: 44 });
    }
  },

  dia(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Sin nubes que reboten la luz: los rayos pegan directo; calor.
    const c1 = cue(1), hot = ease(local / 2.2);
    sky(ctx, W, 0, 1100, '#0ea5e9', '#fef3c7');
    sunDisc(ctx, 200, 560, 80, t);
    ground(ctx, W, H, 1100, mixc('#86efac', '#d97706', hot), mixc('#15803d', '#92400e', hot));
    cracks(ctx, 0, 1110, W, 1600, 3, hot, 14);
    rays(ctx, 230, 600, [[520, 1100], [720, 1100], [920, 1100]], t);
    if (local > c1) {
      // Donde estaría la nube: contorno punteado con flechas que rebotarían.
      ctx.save(); ctx.setLineDash([14, 12]); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(700, 760, 190, 80, 0, 0, TAU); ctx.stroke(); ctx.restore();
      kit.text(ctx, 'AQUÍ REBOTABA', 700, 760, { size: 34, fill: '#ffffff' });
    }
    thermometer(ctx, 960, 1250, 300, lerp(0.5, 0.95, hot), '#ef4444');
    hq.tag(ctx, 540, 410, local < c1 ? 'DÍAS MÁS CALIENTES' : 'LA NUBE REBOTA LA LUZ', { size: 46, fill: '#fde047' });
  },

  noche(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Noche despejada: el calor del suelo se escapa al espacio; escarcha y frío.
    const c1 = cue(1), cold = ease(local / 2.2);
    sky(ctx, W, 0, 1100, '#020617', '#1e1b4b'); stars(ctx, W, 1000, t);
    ctx.beginPath(); ctx.arc(860, 560, 56, 0, TAU); ctx.fillStyle = '#f1f5f9'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ground(ctx, W, H, 1100, mixc('#166534', '#e2e8f0', cold * 0.8), mixc('#14532d', '#94a3b8', cold * 0.6));
    // Flechas rojas de calor que suben y se van.
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const x = 140 + i * 200, u = (t * 0.6 + i * 0.2) % 1, y = lerp(1080, 500, u); for (const [w, c] of [[16, INK], [9, '#f87171']]) { ctx.beginPath(); ctx.moveTo(x, y + 90); ctx.lineTo(x, y); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x - 18, y + 14); ctx.lineTo(x, y - 12); ctx.lineTo(x + 18, y + 14); ctx.closePath(); ctx.fillStyle = '#f87171'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
    if (local > c1) { ctx.save(); ctx.setLineDash([14, 12]); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(60, 700); ctx.quadraticCurveTo(540, 560, 1020, 700); ctx.stroke(); ctx.restore(); kit.text(ctx, 'LA COBIJA QUE FALTA', 540, 640, { size: 36, fill: '#ffffff' }); }
    hq.toon(ctx, 540, 1380, 380, { ...HERO, t: t * 3, seed: 3, armL: [0.9, 1.6], armR: [0.9, 1.6], eyes: 'closed', mouth: 'flat', brows: -1, lean: 0.03 * Math.sin(t * 30) });
    hq.tag(ctx, 540, 410, local < c1 ? 'NOCHES MÁS FRÍAS' : 'LAS NUBES GUARDAN EL CALOR', { size: 44, fill: '#bae6fd' });
  },

  lluvia(ctx, o) {
    const { W, H, local, t } = o;
    // Campo seco sin una sola nube; las plantas se marchitan.
    const dry = ease(local / 2.4);
    sky(ctx, W, 0, 1050, '#38bdf8', '#fef3c7');
    sunDisc(ctx, 860, 560, 70, t);
    ground(ctx, W, H, 1050, mixc('#65a30d', '#ca8a04', dry), mixc('#3f6212', '#78350f', dry));
    cracks(ctx, 0, 1060, W, 1700, 7, dry, 16);
    for (let i = 0; i < 5; i++) bushyTree(ctx, 110 + i * 215, 1060, 200, { leaf: mixc('#22c55e', '#a16207', dry), seed: i });
    // Una nube «tachada» arriba.
    cloud(ctx, 540, 620, 120, '#e2e8f0', 0.6);
    ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(400, 520); ctx.lineTo(680, 720); ctx.moveTo(680, 520); ctx.lineTo(400, 720); ctx.stroke(); ctx.restore();
    hq.tag(ctx, 540, 410, 'NI LLUVIA NI NIEVE', { size: 50, fill: '#fde68a' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    sky(ctx, W, 0, H, '#38bdf8', '#e0f2fe');
    if (local < c1) {
      // Una nube = 100 elefantes (aparecen en filas).
      cloud(ctx, 540, 640, 230, '#ffffff');
      kit.text(ctx, '≈ 500 TONELADAS', 540, 650, { size: 52, fill: '#0f172a', stroke: '#ffffff' });
      const n = Math.floor(ease((local - 0.3) / Math.max(1.2, c1 - 0.5)) * 100);
      for (let i = 0; i < n; i++) elephant(ctx, 150 + (i % 10) * 86, 860 + Math.floor(i / 10) * 30 + (Math.floor(i / 10) % 2) * 6, 0.9);
      hq.tag(ctx, 540, 410, 'PESA COMO 100 ELEFANTES', { size: 46, fill: '#ffffff' });
    } else {
      // Lupa: gotitas diminutas que el aire sostiene.
      cloud(ctx, 400, 700, 200, '#ffffff');
      const cx = 640, cy = 820, R = 270;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = '#e0f2fe'; ctx.fill(); ctx.clip();
      const Rr = kit.rng(4);
      for (let i = 0; i < 40; i++) { const x = cx - R + Rr() * 2 * R, y = cy - R + ((Rr() * 2 * R + Math.sin(t * 2 + i) * 6)); ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const x = cx - 180 + i * 120, u = (t * 0.8 + i / 4) % 1, y = cy + R - u * 2 * R; ctx.strokeStyle = 'rgba(15,23,42,0.45)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y + 70); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 16, y + 16); ctx.lineTo(x, y); ctx.lineTo(x + 16, y + 16); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 24; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
      ctx.save(); ctx.lineWidth = 30; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy + R * 0.72); ctx.lineTo(cx + R * 1.05, cy + R * 1.05); ctx.stroke(); ctx.lineWidth = 16; ctx.strokeStyle = '#78350f'; ctx.stroke(); ctx.restore();
      hq.tag(ctx, 540, 410, 'GOTITAS DIMINUTAS', { size: 50, fill: '#ffffff' });
    }
  },
};
