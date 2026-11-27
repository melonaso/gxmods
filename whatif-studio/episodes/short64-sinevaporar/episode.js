// Short 64: ¿y si el agua no se evaporara?  (SERIE EL AGUA · 10)
// Gancho: ropa tendida que no se seca → ni la ropa ni los charcos se secarían → dejaría de llover (casi toda la lluvia es
// agua de mar que el Sol evaporó) → con calor no podrías enfriarte (el sudor enfría al evaporarse) → cada segundo el Sol
// evapora del mar más de 5,000 albercas olímpicas (~413,000 km³/año ≈ 13 millones de m³/s ÷ 2,500 m³); prueba: soplar
// la mano mojada.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, sea, sunDisc, cloud, rain, bushyTree, thermometer, drop, cracks, HERO } from '../../engine2d/props.js';

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

/** Tendedero con ropa que gotea. */
function clothesline(ctx, t, y = 700) {
  ctx.lineCap = 'round';
  for (const x of [120, 960]) { ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x, 1110); ctx.stroke(); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 12; ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(120, y - 30); ctx.quadraticCurveTo(540, y + 40, 960, y - 30); ctx.stroke();
  const items = [[250, '#ef4444', 'shirt'], [440, '#3b82f6', 'pants'], [640, '#facc15', 'shirt'], [820, '#22c55e', 'towel']];
  for (const [x, c, kind] of items) {
    const yy = y + 4 + 30 * (1 - ((x - 540) / 420) ** 2);
    ctx.save(); ctx.translate(x, yy);
    ctx.beginPath();
    if (kind === 'shirt') { ctx.moveTo(-70, 0); ctx.lineTo(70, 0); ctx.lineTo(95, 40); ctx.lineTo(60, 55); ctx.lineTo(55, 170); ctx.lineTo(-55, 170); ctx.lineTo(-60, 55); ctx.lineTo(-95, 40); }
    else if (kind === 'pants') { ctx.moveTo(-55, 0); ctx.lineTo(55, 0); ctx.lineTo(60, 210); ctx.lineTo(10, 210); ctx.lineTo(0, 70); ctx.lineTo(-10, 210); ctx.lineTo(-60, 210); }
    else { ctx.rect(-60, 0, 120, 190); }
    ctx.closePath(); ctx.fillStyle = mixc(c, '#1e293b', 0.25); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-8, -14, 16, 26); ctx.strokeRect(-8, -14, 16, 26);
    const bottom = kind === 'pants' ? 210 : kind === 'shirt' ? 170 : 190;
    for (let i = 0; i < 3; i++) { const u = (t * 1.6 + i / 3 + x * 0.001) % 1; drop(ctx, -30 + i * 30, bottom + 10 + u * (1100 - yy - bottom - 20), 10, '#38bdf8'); }
    ctx.restore();
  }
}

function puddle(ctx, x, y, rx, ry) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - ry, y + ry, [[0, '#7dd3fc'], [1, '#0284c7']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.3, ry * 0.2, 0, 0, TAU); ctx.fill();
}

function pool(ctx, x, y, w, h) {
  hq.roundRectPath(ctx, x, y, w, h, 6); ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 4, y + (h * i) / 4); ctx.lineTo(x + w - 4, y + (h * i) / 4); ctx.stroke(); }
}

function hand(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const skin = HERO.skin;
  for (let i = 0; i < 4; i++) { hq.roundRectPath(ctx, -95 + i * 52, -260 + Math.abs(i - 1.5) * 22, 44, 190, 22); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.save(); ctx.translate(-120, -60); ctx.rotate(-0.7); hq.roundRectPath(ctx, -24, -110, 48, 140, 24); ctx.fillStyle = skin; ctx.fill(); ctx.stroke(); ctx.restore();
  hq.roundRectPath(ctx, -110, -110, 220, 200, 50); ctx.fillStyle = skin; ctx.fill(); ctx.stroke();
  hq.roundRectPath(ctx, -80, 80, 160, 200, 20); ctx.fillStyle = HERO.shirt; ctx.fill(); ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Patio con ropa tendida bajo el Sol: gotea y gotea; el protagonista espera.
    const c1 = cue(1);
    sky(ctx, W, 0, 1110, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 900, 540, 70, t);
    ground(ctx, W, H, 1110, '#86efac', '#15803d');
    clothesline(ctx, t, 720);
    puddle(ctx, 540, 1150, 380, 40);
    hq.toon(ctx, 170, 1330, 330, { ...HERO, t, seed: 1, armL: [0.3, 0.2], armR: [1.3, -0.4], eyes: 'open', mouth: 'flat', brows: -0.6, look: [1, -0.5] });
    if (local > c1) hq.bubble(ctx, 520, 560, 380, 96, 260, 980, '¿CUÁNDO SE SECA?', { size: 42 });
  },

  ropa(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Pasan los días y la ropa sigue chorreando.
      const n = 1 + Math.floor(ease(local / Math.max(1, c1)) * 29);
      sky(ctx, W, 0, 1110, '#7dd3fc', '#f0f9ff');
      sunDisc(ctx, lerp(160, 920, (local * 0.9) % 1), 560 - Math.sin(((local * 0.9) % 1) * Math.PI) * 90, 60, t);
      ground(ctx, W, H, 1110, '#86efac', '#15803d');
      clothesline(ctx, t, 720);
      puddle(ctx, 540, 1150, 420, 46);
      hq.roundRectPath(ctx, 780, 470, 230, 150, 18); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.fillRect(783, 473, 224, 40);
      kit.text(ctx, `DÍA ${n}`, 895, 570, { size: 56, fill: INK, stroke: null });
      hq.tag(ctx, 420, 410, 'NUNCA SE SECA', { size: 50, fill: '#bae6fd' });
    } else {
      // Calle llena de charcos que no se van.
      sky(ctx, W, 0, 980, '#94a3b8', '#e2e8f0');
      for (let i = 0; i < 4; i++) kit.house(ctx, 130 + i * 270, 980, 220, 170, { wall: ['#fde68a', '#fecaca', '#bfdbfe', '#bbf7d0'][i], roofC: '#b91c1c' });
      ctx.fillStyle = hq.vgrad(ctx, 0, 980, H, [[0, '#64748b'], [1, '#334155']]); ctx.fillRect(0, 980, W, H - 980);
      for (const [x, y, rx, ry] of [[200, 1050, 170, 30], [620, 1090, 260, 40], [900, 1030, 140, 26]]) puddle(ctx, x, y, rx, ry);
      hq.toon(ctx, 470, 1100, 300, { ...HERO, t, seed: 2, armL: [1.2, -0.8], armR: [1.2, -0.8], legs: 0.16, eyes: 'open', mouth: 'o' });
      hq.tag(ctx, 540, 410, 'CHARCOS PARA SIEMPRE', { size: 46, fill: '#bae6fd' });
    }
  },

  lluvia(ctx, o) {
    const { W, H, local, cue, t } = o;
    // El ciclo del agua roto: del mar ya no sube vapor; la nube se apaga; la tierra se agrieta.
    const c1 = cue(1), dry = ease((local - 0.4) / 2.4);
    sky(ctx, W, 0, 1000, mixc('#7dd3fc', '#fbbf24', dry * 0.6), '#fef3c7');
    sunDisc(ctx, 160, 540, 66, t);
    sea(ctx, 520, H, 1000, t, { top: '#0ea5e9', bottom: '#075985' });
    ctx.beginPath(); ctx.moveTo(480, H); ctx.lineTo(560, 990); ctx.lineTo(W, 990); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = mixc('#65a30d', '#a16207', dry); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    cracks(ctx, 560, 1000, W, 1500, 4, dry, 12);
    bushyTree(ctx, 820, 995, 220, { leaf: mixc('#22c55e', '#a16207', dry), seed: 3 });
    // Vapor que intenta subir… tachado.
    ctx.save(); ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 60; ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const x0 = 120 + i * 130; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const u = k / 8; ctx.lineTo(x0 + 14 * Math.sin(u * 7 + t * 2 + i), lerp(980, 780, u)); } ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(90, 760); ctx.lineTo(450, 990); ctx.moveTo(450, 760); ctx.lineTo(90, 990); ctx.stroke(); ctx.restore();
    // La nube se desvanece; ya no llueve.
    cloud(ctx, 760, 640, 150, '#cbd5e1', 1 - dry);
    if (dry < 0.5) rain(ctx, 300, 700, 990, t, 0.8 * (1 - dry * 2), 20, 620);
    hq.tag(ctx, 540, 410, local < c1 ? 'DEJA DE LLOVER' : 'LA LLUVIA VIENE DEL MAR', { size: 46, fill: '#fde68a' });
  },

  sudor(ctx, o) {
    const { W, H, local, t } = o;
    // Calor: el sudor no se evapora; empapado y rojo.
    const k = ease(local / 2.5);
    sky(ctx, W, 0, 1100, '#f97316', '#fde68a');
    sunDisc(ctx, 840, 560, 80, t);
    ground(ctx, W, H, 1100, '#fbbf24', '#b45309');
    hq.toon(ctx, 460, 1360, 520, { ...HERO, t, seed: 4, shirt: mixc(HERO.shirt, '#166534', k * 0.6), armL: [0.5, 0.4], armR: [0.5, 0.4], eyes: 'closed', mouth: 'o', brows: -1, blush: k });
    for (let i = 0; i < 10; i++) { const u = (t * 0.8 + i / 10) % 1, x = 360 + (i * 37) % 200; drop(ctx, x, 880 + u * 460, 11, '#38bdf8'); }
    puddle(ctx, 460, 1365, 120 + 80 * k, 22);
    thermometer(ctx, 920, 1240, 320, 0.92, '#ef4444');
    kit.text(ctx, '40 °C', 920, 880, { size: 54, fill: '#fecaca' });
    hq.tag(ctx, 540, 410, 'NO PODRÍAS ENFRIARTE', { size: 46, fill: '#fde047' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Columnas de vapor y un contador de albercas olímpicas que aparecen cada segundo.
      sky(ctx, W, 0, 1100, '#7dd3fc', '#f0f9ff');
      sunDisc(ctx, 900, 520, 60, t);
      sea(ctx, W, H, 1100, t, { top: '#0ea5e9', bottom: '#075985' });
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 26; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const x0 = 90 + i * 180; ctx.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10; ctx.lineTo(x0 + 26 * Math.sin(u * 6 + t * 2 + i), lerp(1100, 620, u)); } ctx.stroke(); }
      ctx.restore();
      const n = Math.floor(ease((local - 0.2) / Math.max(1, c1 - 0.4)) * 60);
      for (let i = 0; i < n; i++) pool(ctx, 110 + (i % 10) * 88, 600 + Math.floor(i / 10) * 60, 76, 44);
      kit.text(ctx, '+5,000 ALBERCAS', 540, 515, { size: 58, fill: '#ffffff' });
      hq.tag(ctx, 540, 410, 'CADA SEGUNDO', { size: 46, fill: '#bae6fd' });
    } else {
      // Mano mojada + soplido = frío.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#e0f2fe'], [1, '#7dd3fc']]); ctx.fillRect(0, 0, W, H);
      hand(ctx, 640, 1250, 1.6);
      for (let i = 0; i < 6; i++) drop(ctx, 520 + (i % 3) * 90, 860 + Math.floor(i / 3) * 140, 13, '#38bdf8');
      const k = ease((local - c1 - 0.3) / 0.6);
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const y = 760 + i * 90, off = (t * 300 + i * 60) % 200; ctx.beginPath(); ctx.moveTo(60 + off, y); ctx.quadraticCurveTo(200 + off, y - 30, 330 + off, y); ctx.stroke(); }
      ctx.restore();
      if (k > 0.5) { ctx.save(); ctx.translate(880, 700); ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 10; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.stroke(); } ctx.restore(); }
      hq.tag(ctx, 540, 410, k < 0.5 ? 'PRUÉBALO' : 'ESE FRÍO ES EVAPORACIÓN', { size: 46, fill: '#fde047' });
    }
  },
};
