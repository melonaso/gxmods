// Short 54: ¿y si la lluvia fuera salada?  (gemelo espejo del mar de agua dulce, el récord del canal)
// Gancho: ¿quién sufriría primero? → las plantas: la sal les roba el agua por las raíces y se secan → los campos se
// llenan de sal y casi nada vuelve a crecer → ríos y lagos salados; los peces de agua dulce no aguantan → de la llave
// sale agua salada; quitarle la sal cuesta muchísima energía → sorpresa: la lluvia de hoy era agua de mar hace unos
// 9 días; el Sol la evapora y la sal se queda en el mar.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, ground, sea, sunDisc, cloud, rain, bushyTree, drop, cracks } from '../../engine2d/props.js';

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

function saltCube(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  hq.roundRectPath(ctx, -s / 2, -s / 2, s, s, s * 0.15); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = Math.max(2, s * 0.12); ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

/** Lluvia de gotas grandes con un cubito de sal dentro. */
function saltyRain(ctx, W, y0, y1, t, a = 1, n = 22) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < n; i++) { const x = (i * 197.3) % W, y = y0 + ((i * 131.7 + t * 700) % (y1 - y0)); drop(ctx, x, y, 14, 'rgba(125,211,252,0.95)'); saltCube(ctx, x, y - 4, 9, i); }
  ctx.restore();
}

function flowerPlant(ctx, x, y, h, wilt, seed = 0) {
  const leaf = mixc('#22c55e', '#a16207', wilt), droop = 0.2 + 0.9 * wilt;
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.15 * wilt * (seed % 2 ? 1 : -1));
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(h * 0.25 * wilt, -h * 0.5, h * 0.4 * wilt, -h * (1 - 0.25 * wilt)); ctx.stroke();
  ctx.strokeStyle = mixc('#16a34a', '#92400e', wilt); ctx.lineWidth = 9; ctx.stroke();
  for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1, y0 = -h * (0.2 + i * 0.16); ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(s * h * 0.25, y0 - h * 0.15 * (1 - droop), s * h * 0.4, y0 + h * 0.12 * droop); ctx.quadraticCurveTo(s * h * 0.2, y0 + h * 0.03, 0, y0 + h * 0.05); ctx.closePath(); ctx.fillStyle = leaf; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  // Flor.
  const fx = h * 0.4 * wilt, fy = -h * (1 - 0.25 * wilt), pc = mixc('#f472b6', '#78350f', wilt);
  for (const [fill, pad] of [[INK, 5], [pc, 0]]) { ctx.fillStyle = fill; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * h * 0.09, fy + Math.sin(a) * h * 0.09, h * 0.08 + pad, h * 0.05 + pad, a, 0, TAU); ctx.fill(); } }
  ctx.beginPath(); ctx.arc(fx, fy, h * 0.05, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

function fish(ctx, x, y, s, color, { sick = 0, t = 0, seed = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(sick * Math.PI * 0.9); ctx.scale(s, s);
  const wag = Math.sin(t * 9 + seed) * 8 * (1 - sick);
  ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(88, -26 + wag); ctx.lineTo(88, 26 + wag); ctx.closePath(); ctx.fillStyle = hq.shade(color, -0.15); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 56, 28 * (1 - 0.3 * sick), 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -30, 30, [[0, hq.shade(color, 0.2)], [1, hq.shade(color, -0.2)]]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(15,23,42,0.35)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-10 + i * 14, -6 + (i % 2) * 10, 4, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(-28, -6, 10, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(-30, -4, sick > 0.4 ? 3 : 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Llueve en un jardín; las gotas traen sal. Alguien saca la lengua… ¡salada!
    const salty = local > 1.0;
    sky(ctx, W, 0, 1000, '#64748b', '#cbd5e1');
    cloud(ctx, 240, 460, 170, '#94a3b8'); cloud(ctx, 760, 480, 190, '#94a3b8');
    ground(ctx, W, H, 1000, '#4ade80', '#15803d');
    for (let i = 0; i < 6; i++) flowerPlant(ctx, 90 + i * 70, 1010, 150, 0, i);
    if (!salty) rain(ctx, W, 380, 1000, t, 0.9, 60); else saltyRain(ctx, W, 380, 1000, t, ease((local - 1.0) / 0.4));
    const r = hq.toon(ctx, 760, 1100, 380, { t, seed: 4, shirt: '#f43f5e', skin: '#e0ac69', hair: '#1f2937', armL: [0.3, 0.2], armR: [0.3, 0.2], eyes: local > 1.6 ? 'closed' : 'happy', mouth: local > 1.6 ? 'flat' : 'o', brows: local > 1.6 ? -1 : 0, look: [0, -1] });
    if (local > 1.6) hq.bubble(ctx, 560, 640, 270, 96, 690, 760, '¡SALADA!', { size: 44, fill: '#b91c1c' });
  },

  plantas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte de la tierra: la sal saca el agua de las raíces (gotitas que salen) y la planta se marchita.
    const c1 = cue(1), wilt = ease((local - c1 + 0.3) / 1.4);
    sky(ctx, W, 0, 760, '#94a3b8', '#e2e8f0');
    saltyRain(ctx, W, 380, 760, t, 0.6, 14);
    ctx.fillStyle = hq.vgrad(ctx, 0, 760, H, [[0, '#92400e'], [1, '#451a03']]); ctx.fillRect(0, 760, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 760); ctx.lineTo(W, 760); ctx.stroke();
    const R = kit.rng(6); for (let i = 0; i < 40; i++) saltCube(ctx, 60 + R() * 960, 790 + R() * 280, 12, R() * 2);
    // Raíces.
    ctx.lineCap = 'round';
    const root = (x, y, a, len, w, d) => { if (d > 3) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; ctx.lineWidth = w + 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = '#e7c98a'; ctx.stroke(); root(x2, y2, a - 0.5, len * 0.7, w * 0.7, d + 1); root(x2, y2, a + 0.5, len * 0.7, w * 0.7, d + 1); };
    root(540, 765, Math.PI / 2, 110, 14, 0);
    // Gotas de agua que SALEN de la raíz hacia la tierra salada.
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI + 0.2, u = (t * 0.8 + i / 6) % 1; drop(ctx, 540 + Math.cos(a) * (40 + u * 160), 900 + Math.sin(a) * (20 + u * 80), 9, 'rgba(56,189,248,0.9)'); }
    ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(540 + s * 60, 880); ctx.lineTo(540 + s * 150, 900); ctx.moveTo(540 + s * 130, 885); ctx.lineTo(540 + s * 150, 900); ctx.lineTo(540 + s * 128, 915); ctx.stroke(); } ctx.restore();
    flowerPlant(ctx, 540, 765, 330, wilt, 1);
    hq.tag(ctx, 540, 410, local < c1 ? 'LA SAL LES ROBA EL AGUA' : 'SE SECAN', { size: 44, fill: local < c1 ? '#bae6fd' : '#fca5a5' });
  },

  campos(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Un campo de cultivo: la tierra se cubre de costra blanca de sal y las plantas mueren.
    const c1 = cue(1), crust = ease((local - 0.2) / Math.max(1.4, c1 + 0.6)), dead = ease((local - c1) / 1.0);
    sky(ctx, W, 0, 780, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 880, 520, 48, t);
    ctx.fillStyle = hq.vgrad(ctx, 0, 760, H, [[0, '#a16207'], [1, '#451a03']]); ctx.fillRect(0, 760, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 760); ctx.lineTo(W, 760); ctx.stroke();
    // Costra de sal (manchas blancas que crecen).
    const R = kit.rng(12); ctx.fillStyle = 'rgba(248,250,252,0.92)';
    for (let i = 0; i < 30; i++) { const x = R() * W, y = 780 + R() * 700, r = (30 + R() * 70) * crust; if (r > 1) { ctx.beginPath(); ctx.ellipse(x, y, r * 1.6, r * 0.5, 0, 0, TAU); ctx.fill(); } }
    cracks(ctx, 0, 800, W, 1500, 3, crust, 18);
    for (const [y, h, n] of [[820, 110, 9], [920, 160, 7], [1040, 220, 5]]) for (let i = 0; i < n; i++) flowerPlant(ctx, (i + 0.5) * (W / n), y, h, dead, i);
    hq.tag(ctx, 540, 410, local < c1 ? 'TIERRA LLENA DE SAL' : 'CASI NADA VUELVE A CRECER', { size: 40, fill: '#fde68a' });
  },

  rios(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Un río con peces: el agua se vuelve salada (brillos blancos) y los peces de agua dulce quedan panza arriba.
    const c1 = cue(1), salt = ease((local - 0.3) / Math.max(1.2, c1)), sick = ease((local - c1 - 0.2) / 1.2);
    sky(ctx, W, 0, 700, '#7dd3fc', '#f0f9ff');
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 640, W, 80); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 640); ctx.lineTo(W, 640); ctx.stroke();
    for (let i = 0; i < 6; i++) bushyTree(ctx, 60 + i * 190, 650, 180, { seed: i });
    sea(ctx, W, H, 720, t, { top: mixc('#38bdf8', '#94a3b8', salt * 0.6), bottom: mixc('#0369a1', '#334155', salt * 0.6), amp: 5 });
    if (salt > 0) { const R = kit.rng(4); for (let i = 0; i < 40; i++) saltCube(ctx, R() * W, 760 + ((R() * 700 + t * 30) % 700), 10, t + i); }
    const F = [[260, 860, '#22c55e'], [700, 940, '#a3e635'], [420, 1040, '#84cc16']];
    F.forEach(([x0, y0, c], i) => { const x = sick > 0 ? x0 : ((x0 + t * 80 + 1300) % 1300) - 110, y = lerp(y0, 760, sick * 0.8); fish(ctx, x, y, 1.0, c, { sick, t, seed: i }); });
    hq.tag(ctx, 540, 410, local < c1 ? 'RÍOS Y LAGOS SALADOS' : 'LOS PECES NO AGUANTARÍAN', { size: 40, fill: '#bae6fd' });
  },

  llave(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // De la llave sale agua con sal; alguien prueba y hace cara.
      ctx.fillStyle = '#e0f2fe'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(14,116,144,0.18)'; ctx.lineWidth = 4; for (let y = 0; y < 1000; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1000); ctx.stroke(); }
      ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#94a3b8'], [1, '#475569']]); ctx.fillRect(0, 1000, W, H);
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
      hq.roundRectPath(ctx, 690, 520, 50, 90, 10); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      ctx.lineCap = 'round'; const pipe = () => { ctx.beginPath(); ctx.moveTo(690, 565); ctx.lineTo(470, 565); ctx.quadraticCurveTo(430, 565, 430, 605); ctx.lineTo(430, 625); };
      ctx.strokeStyle = INK; ctx.lineWidth = 46; pipe(); ctx.stroke(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 34; pipe(); ctx.stroke();
      // Chorro con cubitos de sal.
      ctx.fillStyle = 'rgba(56,189,248,0.7)'; ctx.fillRect(418, 630, 24, 150);
      for (let i = 0; i < 6; i++) saltCube(ctx, 430 + 4 * Math.sin(t * 9 + i), 640 + ((t * 300 + i * 25) % 140), 12, t * 3 + i);
      hq.toon(ctx, 260, 1060, 430, { t, seed: 5, shirt: '#8b5cf6', hair: '#7c2d12', hairStyle: 'long', armR: [1.4, -0.4], armL: [0.2, 0.15], eyes: local > 0.8 ? 'closed' : 'open', mouth: local > 0.8 ? 'flat' : 'smile', brows: local > 0.8 ? -1 : 0, look: [0.7, -0.6],
        hold: (c, h) => { const [hx, hy] = h.R; c.beginPath(); c.moveTo(hx - 34, hy - 75); c.lineTo(hx + 34, hy - 75); c.lineTo(hx + 26, hy + 25); c.lineTo(hx - 26, hy + 25); c.closePath(); c.fillStyle = 'rgba(224,242,254,0.55)'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(56,189,248,0.7)'; c.fillRect(hx - 28, hy - 30, 56, 52); } });
      hq.tag(ctx, 540, 410, 'AGUA SALADA EN LA LLAVE', { size: 42, fill: '#fca5a5' });
      return;
    }
    // Planta para quitar la sal: tanques, tubos y un rayo de energía que no para.
    const k = ease((local - c1) / 0.5);
    sky(ctx, W, 0, 1000, '#94a3b8', '#e2e8f0');
    ground(ctx, W, H, 1000, '#9ca3af', '#4b5563');
    sea(ctx, 260, H, 940, t, { top: '#0ea5e9', bottom: '#075985', amp: 4 });
    for (let i = 0; i < 3; i++) { hq.roundRectPath(ctx, 320 + i * 170, 700, 140, 300, 20); ctx.fillStyle = hq.vgrad(ctx, 0, 700, 1000, [[0, '#e2e8f0'], [1, '#94a3b8']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(200, 960); ctx.lineTo(880, 960); ctx.stroke(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 14; ctx.stroke();
    // Torre eléctrica y rayos.
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(920, 1000); ctx.lineTo(960, 560); ctx.lineTo(1000, 1000); ctx.moveTo(930, 700); ctx.lineTo(990, 700); ctx.moveTo(900, 600); ctx.lineTo(1020, 600); ctx.stroke();
    ctx.save(); ctx.globalAlpha = k; for (let i = 0; i < 3; i++) { const x = 420 + i * 170, y = 660 + 10 * Math.sin(t * 10 + i); ctx.beginPath(); ctx.moveTo(x - 10, y - 60); ctx.lineTo(x + 20, y - 20); ctx.lineTo(x, y - 20); ctx.lineTo(x + 25, y + 20); ctx.lineTo(x - 15, y - 30); ctx.lineTo(x + 5, y - 30); ctx.closePath(); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); } ctx.restore();
    hq.tag(ctx, 540, 410, 'CUESTA MUCHÍSIMA ENERGÍA', { size: 42, fill: '#fde047' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Ciclo: el mar se evapora con el Sol (la sal se queda abajo), la nube viaja y llueve agua dulce sobre la tierra.
    const c1 = cue(1);
    sky(ctx, W, 0, 900, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 160, 520, 60, t);
    sea(ctx, W, H, 900, t, { top: '#0ea5e9', bottom: '#075985' });
    ctx.beginPath(); ctx.moveTo(300, H); ctx.lineTo(580, 905); ctx.quadraticCurveTo(800, 860, W, 880); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 860, H, [[0, '#4ade80'], [1, '#166534']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    bushyTree(ctx, 740, 885, 200, { seed: 2 }); bushyTree(ctx, 940, 880, 230, { seed: 5 });
    // Vapor que sube del mar (sin sal).
    ctx.save(); ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 60; ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const x0 = 120 + i * 110; ctx.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10; ctx.lineTo(x0 + 18 * Math.sin(u * 8 + t * 2 + i), lerp(890, 620, u)); } ctx.stroke(); }
    ctx.restore();
    // Sal que se queda en el mar.
    if (local > c1) { const R = kit.rng(5); for (let i = 0; i < 22; i++) saltCube(ctx, 40 + R() * 470, 930 + R() * 120, 14, R() * 2); hq.tag(ctx, 280, 1060, 'LA SAL SE QUEDA', { size: 28, fill: '#ffffff' }); }
    // Nube que viaja del mar a la tierra y llueve.
    const cx = lerp(330, 820, ease((local - 0.3) / Math.max(1.5, o.s.dur - 0.8)));
    cloud(ctx, cx, 600, 150, '#e2e8f0');
    if (cx > 650) rain(ctx, 300, 680, 880, t, 0.9, 20, cx - 150);
    // Calendario de 9 días.
    hq.roundRectPath(ctx, 820, 460, 150, 150, 16); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.fillRect(820, 460, 150, 36);
    ctx.font = '900 64px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(String(Math.min(9, 1 + Math.floor(local * 2.2))), 895, 560);
    hq.tag(ctx, 540, 410, local < c1 ? 'ERA AGUA DE MAR' : 'EL SOL LE QUITA LA SAL', { size: 44, fill: '#bae6fd' });
  },
};
