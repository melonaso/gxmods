// Short 53: ¿y si el hielo no flotara?  (gemelo del mar de agua dulce, el récord del canal)
// Gancho: ¿solo cambiaría tu vaso? → no: los lagos se congelarían desde el fondo, sólidos como una piedra → hoy los peces
// pasan el invierno bajo una tapa de hielo; sin ella no tendrían dónde vivir → en verano solo se derrite la capa de
// arriba; el fondo queda helado para siempre → en los mares fríos, el fondo se llenaría de hielo → sorpresa: el agua es
// casi la única que hace esto; prueba en casa: el aceite congelado se hunde en aceite.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, sea, sunDisc, cloud, space } from '../../engine2d/props.js';

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

function iceCube(ctx, x, y, s, rot, tint = 'rgba(224,242,254,0.95)') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  hq.roundRectPath(ctx, -s / 2, -s / 2, s, s, s * 0.18); ctx.fillStyle = tint; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; hq.roundRectPath(ctx, -s * 0.32, -s * 0.32, s * 0.25, s * 0.12, 6); ctx.fill();
  ctx.restore();
}

function snow(ctx, W, y0, y1, t, a = 1, n = 50) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) { const x = (i * 131.7 + 30 * Math.sin(t + i)) % W, y = y0 + ((i * 97.3 + t * 80) % (y1 - y0)); ctx.beginPath(); ctx.arc(x, y, 4 + (i % 3) * 2, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function fish(ctx, x, y, s, color, { frozen = 0, t = 0, seed = 0, dir = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const wag = Math.sin(t * 9 + seed) * 8 * (1 - frozen);
  ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(88, -26 + wag); ctx.lineTo(88, 26 + wag); ctx.closePath(); ctx.fillStyle = hq.shade(color, -0.15); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 56, 30, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -30, 30, [[0, hq.shade(color, 0.2)], [1, hq.shade(color, -0.2)]]); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-28, -6, 10, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(-30, -6 + (frozen > 0.5 ? 2 : 0), frozen > 0.5 ? 3 : 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.lineWidth = 4; ctx.beginPath(); if (frozen > 0.5) { ctx.moveTo(-50, 12); ctx.lineTo(-38, 12); } else { ctx.moveTo(-52, 8); ctx.quadraticCurveTo(-44, 16, -36, 10); } ctx.stroke();
  ctx.restore();
}

/** Corte de un lago: cuenco de tierra; agua; hielo que crece desde el fondo (fondoK) o tapa arriba (tapa). */
function lake(ctx, W, H, t, { fondoK = 0, tapa = 0, top = 640, bottom = 1060, liquidTop = 0 } = {}) {
  const bowl = () => { ctx.beginPath(); ctx.moveTo(60, top); ctx.bezierCurveTo(160, bottom + 40, 920, bottom + 40, 1020, top); ctx.closePath(); };
  // Tierra alrededor.
  ctx.fillStyle = hq.vgrad(ctx, 0, top, H, [[0, '#a16207'], [1, '#451a03']]); ctx.fillRect(0, top, W, H - top);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.stroke();
  ctx.save(); bowl(); ctx.clip();
  ctx.fillStyle = hq.vgrad(ctx, 0, top, bottom, [[0, '#38bdf8'], [1, '#0c4a6e']]); ctx.fillRect(0, top, W, bottom - top + 60);
  // Hielo desde el fondo.
  if (fondoK > 0) { const y = lerp(bottom + 40, top, fondoK); ctx.fillStyle = hq.vgrad(ctx, 0, y, bottom + 40, [[0, '#e0f2fe'], [1, '#93c5fd']]); ctx.fillRect(0, y, W, bottom + 60 - y); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; for (let k = 0; k < 6; k++) { const yy = y + 20 + k * 40; if (yy > bottom + 30) break; ctx.beginPath(); ctx.moveTo(80, yy); ctx.lineTo(1000, yy + 6); ctx.stroke(); } ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(59,130,246,0.6)'; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(1020, y); ctx.stroke(); }
  // Capa de agua líquida arriba (verano).
  if (liquidTop > 0) { ctx.fillStyle = 'rgba(56,189,248,0.95)'; ctx.fillRect(0, top, W, liquidTop); }
  ctx.restore();
  // Tapa de hielo arriba (como hoy).
  if (tapa > 0) { hq.roundRectPath(ctx, 70, top - 6, 940, 46 * tapa, 10); ctx.fillStyle = 'rgba(241,245,249,0.97)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  bowl(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Un vaso con refresco: echan hielos… y se van al fondo.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#fef3c7'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#b45309'], [1, '#78350f']]); ctx.fillRect(0, 1000, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    const gx = 470, top = 440, bot = 1000, wT = 380, wB = 300, lvl = 520;
    ctx.save(); ctx.beginPath(); ctx.moveTo(gx - wT / 2, top); ctx.lineTo(gx + wT / 2, top); ctx.lineTo(gx + wB / 2, bot); ctx.lineTo(gx - wB / 2, bot); ctx.closePath(); ctx.clip();
    ctx.fillStyle = 'rgba(234,88,12,0.75)'; ctx.fillRect(0, lvl, W, 600);
    for (let i = 0; i < 10; i++) { const y = bot - ((t * 120 + i * 47) % (bot - lvl)); ctx.beginPath(); ctx.arc(gx - 110 + (i * 37) % 220, y, 5, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.stroke(); }
    const cubes = [[420, 0.5, 0.3], [520, 0.75, -0.4], [470, 1.0, 0.2]];
    cubes.forEach(([x, at, r], i) => { const u = clamp((local - at) / 0.9), y = u < 0.25 ? lerp(330, lvl, u / 0.25) : lerp(lvl, bot - 60 - (i === 2 ? 90 : 0), ease((u - 0.25) / 0.75)); if (local > at - 0.4) iceCube(ctx, x, y, 96, r + u * 0.6); });
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(gx - wT / 2, top); ctx.lineTo(gx - wB / 2, bot); ctx.lineTo(gx + wB / 2, bot); ctx.lineTo(gx + wT / 2, top); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
    const shock = local > 1.6;
    hq.toon(ctx, 860, 1100, 360, { t, seed: 2, shirt: '#0ea5e9', skin: '#e0ac69', hair: '#1f2937', armL: [0.3, 0.2], armR: [0.3, 0.2], eyes: shock ? 'wide' : 'happy', mouth: shock ? 'o' : 'smile', brows: shock ? 1 : 0, look: [-1, 0.4] });
    if (local > 1.0) { const u = clamp((local - 1.0) / 1.0); ctx.save(); ctx.globalAlpha = u; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(650, 880); ctx.lineTo(650, 940); ctx.moveTo(630, 920); ctx.lineTo(650, 945); ctx.lineTo(670, 920); ctx.stroke(); ctx.restore(); }
  },

  lago(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte de un lago en invierno: el hielo que se forma arriba se hunde y lo va llenando desde el fondo.
    const c1 = cue(1), k = ease((local - 0.2) / Math.max(1.6, o.s.dur - 0.5));
    sky(ctx, W, 0, 640, '#94a3b8', '#e2e8f0');
    cloud(ctx, 260, 470, 140, '#cbd5e1'); cloud(ctx, 800, 500, 120, '#cbd5e1');
    snow(ctx, W, 380, 640, t, 0.9);
    lake(ctx, W, H, t, { fondoK: k * 0.98 });
    // Placas de hielo que se forman y se hunden.
    if (k < 0.95) for (let i = 0; i < 5; i++) { const u = (t * 0.5 + i / 5) % 1, x = 220 + i * 160, y = lerp(650, lerp(1080, 650, k), u); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(u * 6 + i) * 0.4); hq.roundRectPath(ctx, -40, -10, 80, 20, 6); ctx.fillStyle = 'rgba(241,245,249,0.95)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    // Pez que se queda atrapado.
    const fy = 760, frozen = k > 0.8 ? 1 : 0, fx = frozen ? 520 : 420 + 140 * Math.sin(t * 1.4);
    fish(ctx, fx, fy, 0.9, '#f97316', { frozen, t, dir: Math.cos(t * 1.4) > 0 || frozen ? 1 : -1 });
    if (frozen) { ctx.fillStyle = 'rgba(224,242,254,0.5)'; ctx.fillRect(430, 720, 180, 80); }
    hq.tag(ctx, 540, 410, local < c1 ? 'SE CONGELA DESDE EL FONDO' : '¡SÓLIDO COMO PIEDRA!', { size: 40, fill: '#bae6fd' });
  },

  peces(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Arriba, hoy: tapa de hielo y peces nadando debajo. Abajo, sin tapa: todo hielo y peces atrapados.
    const c1 = cue(1), k2 = ease((local - c1) / 0.5);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#cbd5e1'], [1, '#64748b']]); ctx.fillRect(0, 0, W, H);
    const panel = (y0, h, today, a) => {
      ctx.save(); ctx.globalAlpha = a;
      hq.card(ctx, 70, y0, 940, h, '#0ea5e9', 30);
      ctx.save(); hq.roundRectPath(ctx, 70, y0, 940, h, 30); ctx.clip();
      ctx.fillStyle = hq.vgrad(ctx, 0, y0, y0 + h, [[0, '#38bdf8'], [1, '#0c4a6e']]); ctx.fillRect(70, y0, 940, h);
      if (today) { ctx.fillStyle = 'rgba(241,245,249,0.97)'; ctx.fillRect(70, y0, 940, 50); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(70, y0 + 50); ctx.lineTo(1010, y0 + 50); ctx.stroke(); for (let i = 0; i < 3; i++) fish(ctx, 250 + i * 260 + 40 * Math.sin(t + i), y0 + 120 + (i % 2) * 50, 0.8, ['#f97316', '#facc15', '#22c55e'][i], { t, seed: i, dir: i % 2 ? -1 : 1 }); }
      else { ctx.fillStyle = hq.vgrad(ctx, 0, y0, y0 + h, [[0, '#f0f9ff'], [1, '#93c5fd']]); ctx.fillRect(70, y0, 940, h); for (let i = 0; i < 3; i++) fish(ctx, 250 + i * 260, y0 + 120 + (i % 2) * 50, 0.8, ['#f97316', '#facc15', '#22c55e'][i], { frozen: 1, t, seed: i }); ctx.fillStyle = 'rgba(224,242,254,0.45)'; ctx.fillRect(70, y0, 940, h); }
      ctx.restore(); ctx.restore();
      hq.tag(ctx, 210, y0 + 30, today ? 'HOY' : 'SIN TAPA', { size: 30, fill: today ? '#86efac' : '#fca5a5' });
    };
    panel(470, 270, true, 1);
    if (local > c1) panel(780, 270, false, k2);
    hq.tag(ctx, 540, 410, local < c1 ? 'UNA TAPA QUE LOS PROTEGE' : 'NO TENDRÍAN DÓNDE VIVIR', { size: 40, fill: local < c1 ? '#86efac' : '#fca5a5' });
  },

  verano(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Verano: el Sol solo derrite una capa fina arriba; el fondo sigue helado.
    const c1 = cue(1), melt = ease((local - 0.3) / 1.2);
    sky(ctx, W, 0, 640, '#38bdf8', '#e0f2fe');
    sunDisc(ctx, 860, 500, 60, t);
    lake(ctx, W, H, t, { fondoK: 0.98, liquidTop: 70 * melt });
    // Pato en la capa de agua.
    if (melt > 0.5) { ctx.save(); ctx.translate(540 + 60 * Math.sin(t), 650); ctx.beginPath(); ctx.ellipse(0, 0, 50, 24, 0, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(-40, -26, 20, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-58, -26); ctx.lineTo(-78, -20); ctx.lineTo(-58, -16); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.beginPath(); ctx.arc(-44, -30, 3.5, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.restore(); }
    if (local > c1) { hq.tag(ctx, 540, 900, 'HIELO PARA SIEMPRE', { size: 34, fill: '#bae6fd' }); }
    hq.tag(ctx, 540, 410, local < c1 ? 'SOLO SE DERRITE ARRIBA' : 'EL FONDO NO SE DERRITE', { size: 42, fill: '#fde68a' });
  },

  mar(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Mar frío: invierno tras invierno, capas de hielo se acumulan en el fondo.
    const c1 = cue(1), k = ease((local - 0.2) / Math.max(1.6, o.s.dur - 0.4));
    sky(ctx, W, 0, 620, '#bae6fd', '#f0f9ff');
    sea(ctx, W, H, 600, t, { top: '#0ea5e9', bottom: '#082f49', amp: 4 });
    // Fondo marino.
    ctx.beginPath(); ctx.moveTo(0, 1080); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 1060 + 20 * Math.sin(x * 0.01)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = '#57534e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // Capas de hielo (una por invierno).
    const layers = Math.floor(k * 7);
    for (let i = 0; i < layers; i++) { const y = 1050 - i * 52; hq.roundRectPath(ctx, -20, y - 46, W + 40, 50, 10); ctx.fillStyle = i % 2 ? '#e0f2fe' : '#bfdbfe'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    // Placas que bajan.
    for (let i = 0; i < 4; i++) { const u = (t * 0.45 + i / 4) % 1, y = lerp(620, 1040 - layers * 52, u); ctx.save(); ctx.translate(180 + i * 240, y); ctx.rotate(Math.sin(u * 5 + i) * 0.3); hq.roundRectPath(ctx, -60, -12, 120, 24, 8); ctx.fillStyle = 'rgba(241,245,249,0.95)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    // Pingüino arriba en un témpano.
    hq.roundRectPath(ctx, 640, 588, 260, 30, 10); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.translate(760, 590); ctx.beginPath(); ctx.ellipse(0, -50, 30, 50, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.ellipse(6, -44, 18, 38, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.moveTo(22, -86); ctx.lineTo(44, -80); ctx.lineTo(22, -74); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.restore();
    hq.tag(ctx, 540, 410, local < c1 ? 'EN LOS MARES FRÍOS, IGUAL' : 'EL FONDO, LLENO DE HIELO', { size: 40, fill: '#bae6fd' });
  },

  prueba(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dos vasos: en el agua, el hielo flota; en el aceite, el aceite congelado se hunde.
    const c1 = cue(1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#fef3c7'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#b45309'], [1, '#78350f']]); ctx.fillRect(0, 1000, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    const glass = (gx, liquid, chunk, sinkK, label, lf) => {
      const top = 520, bot = 1000, wT = 300, wB = 240, lvl = 600;
      ctx.save(); ctx.beginPath(); ctx.moveTo(gx - wT / 2, top); ctx.lineTo(gx + wT / 2, top); ctx.lineTo(gx + wB / 2, bot); ctx.lineTo(gx - wB / 2, bot); ctx.closePath(); ctx.clip();
      ctx.fillStyle = liquid; ctx.fillRect(0, lvl, W, 500);
      const y = lerp(lvl + 10, bot - 55, sinkK); iceCube(ctx, gx, y, 86, 0.2 + 0.3 * sinkK, chunk);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(gx - wT / 2, top); ctx.lineTo(gx - wB / 2, bot); ctx.lineTo(gx + wB / 2, bot); ctx.lineTo(gx + wT / 2, top); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      hq.tag(ctx, gx, 1060, label, { size: 32, fill: lf });
    };
    glass(300, 'rgba(56,189,248,0.6)', 'rgba(224,242,254,0.95)', 0, 'AGUA: FLOTA', '#bae6fd');
    if (local > c1) { const k = pop((local - c1) / 0.4); ctx.save(); ctx.globalAlpha = clamp(k); glass(780, 'rgba(250,204,21,0.75)', 'rgba(254,249,195,0.95)', ease((local - c1 - 0.5) / 1.2), 'ACEITE: SE HUNDE', '#fde047'); ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? 'EL AGUA ES CASI LA ÚNICA' : '¡HAZ LA PRUEBA!', { size: 44, fill: '#fde047' });
  },
};
