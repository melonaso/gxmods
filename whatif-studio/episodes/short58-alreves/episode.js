// Short 58: ¿y si la Tierra girara al revés?  (SERIE LA TIERRA · 1)
// Gancho: el globo frena y gira al revés → el Sol sale por el oeste y se mete por el este → vientos y corrientes dan la
// vuelta; las lluvias cambian de lugar → el Sahara se llena de plantas; el sureste de EE. UU., Brasil y Argentina se
// vuelven desiertos → Europa con inviernos helados (viento de Rusia) → lo calculó una supercomputadora (Instituto Max
// Planck, 2018); en Venus ya pasa: el Sol sale por el oeste.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, ease, lerp, mixc, sky, ground, sunDisc, cloud, space, rain, bushyTree, HERO } from '../../engine2d/props.js';
import { drawGlobe, geoBlob, geoArrow } from '../../engine2d/earth.js';

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

/** Flecha curva debajo del globo que indica el sentido del giro (dir = +1 normal, −1 al revés). */
function spinArrow(ctx, cx, cy, R, dir, color = '#fde047') {
  const a0 = Math.PI * 0.2, a1 = Math.PI * 0.8, rr = R * 1.12;
  ctx.save(); ctx.lineCap = 'round';
  for (const [w, c] of [[24, INK], [14, color]]) { ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.32, 0, a0, a1); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
  // Punta: con dir = +1 la superficie de enfrente va hacia la derecha (de oeste a este).
  const a = dir > 0 ? a0 : a1, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.32, ang = dir > 0 ? -0.35 : Math.PI + 0.35, s = 34;
  ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * s, y + Math.sin(ang) * s); ctx.lineTo(x + Math.cos(ang + 2.3) * s, y + Math.sin(ang + 2.3) * s); ctx.lineTo(x + Math.cos(ang - 2.3) * s, y + Math.sin(ang - 2.3) * s); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

/** Letrero de punto cardinal. */
function sign(ctx, x, y, txt, color) {
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 150); ctx.stroke(); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 8; ctx.stroke();
  hq.roundRectPath(ctx, x - 110, y - 230, 220, 80, 14); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.font = '900 46px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(txt, x, y - 188);
  ctx.restore();
}

function house(ctx, x, y, w, snow = 0) {
  kit.house(ctx, x, y, w, w * 0.8, { wall: '#fde68a', roofC: '#b91c1c' });
  if (snow > 0) { ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - w * 0.8 + 4); ctx.quadraticCurveTo(x, y - w * 1.45 - 20 * snow, x + w * 0.62, y - w * 0.8 + 4); ctx.lineTo(x + w * 0.5, y - w * 0.85); ctx.lineTo(x, y - w * 1.3); ctx.lineTo(x - w * 0.5, y - w * 0.85); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
}

function snowfall(ctx, W, y0, y1, t, wind = 1, n = 70) {
  ctx.save(); ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) { const x = ((i * 131.7 - t * 320 * wind) % (W + 200) + W + 200) % (W + 200) - 100, y = y0 + ((i * 97.3 + t * 160) % (y1 - y0)); ctx.beginPath(); ctx.arc(x, y, 4 + (i % 3) * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // El globo gira normal; en el segundo 1 frena y empieza a girar al revés.
    const c1 = cue(1), flip = 0.9, cx = 540, cy = 900, R = 330;
    space(ctx, W, H, t);
    const lon0 = local < flip ? 40 - local * 60 : 40 - flip * 60 + (local - flip) * 70;
    drawGlobe(ctx, cx, cy, R, { lon0, lat0: 18 });
    const dir = local < flip ? 1 : -1;
    spinArrow(ctx, cx, cy + 40, R, dir, dir > 0 ? '#86efac' : '#f87171');
    if (local > flip && local < flip + 0.5) { kit.flash(ctx, W, H, 0.35 * (1 - (local - flip) / 0.5)); }
    hq.toon(ctx, cx, cy - R + 6, 130, { ...HERO, t, seed: 1, lean: dir > 0 ? 0 : 0.12 * Math.sin(t * 12), armL: [1.2, -0.6], armR: [1.2, -0.6], eyes: 'open', mouth: local > flip ? 'o' : 'smile', brows: local > flip ? 1 : 0 });
    if (local > c1) hq.tag(ctx, 540, 1330, 'AL REVÉS', { size: 50, fill: '#fca5a5' });
  },

  sol(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Amanece… por el OESTE (a la izquierda).
      const k = ease(local / Math.max(1.2, c1));
      sky(ctx, W, 0, 1000, mixc('#1e1b4b', '#7dd3fc', k), mixc('#7c2d12', '#fde68a', k));
      sunDisc(ctx, 220, lerp(1040, 640, k), 80, t);
      ground(ctx, W, H, 1000, '#4ade80', '#15803d');
      sign(ctx, 200, 1180, 'OESTE', '#fde047'); sign(ctx, 880, 1180, 'ESTE', '#e2e8f0');
      hq.toon(ctx, 560, 1150, 400, { ...HERO, t, seed: 2, armL: [1.3, -0.5], armR: [0.3, 0.2], eyes: 'open', mouth: 'o', brows: 1, look: [-1, -0.6] });
      hq.tag(ctx, 540, 410, 'SALE POR EL OESTE', { size: 48, fill: '#fde047' });
    } else {
      // Atardece… por el ESTE (a la derecha).
      const k = ease((local - c1) / 1.6);
      sky(ctx, W, 0, 1000, mixc('#fb923c', '#312e81', k), mixc('#fde68a', '#7c2d12', k));
      sunDisc(ctx, 860, lerp(640, 1040, k), 80, t);
      ground(ctx, W, H, 1000, '#4ade80', '#15803d');
      sign(ctx, 200, 1180, 'OESTE', '#e2e8f0'); sign(ctx, 880, 1180, 'ESTE', '#fb923c');
      hq.toon(ctx, 480, 1150, 400, { ...HERO, t, seed: 2, armL: [0.3, 0.2], armR: [1.3, -0.5], eyes: 'open', mouth: 'o', brows: 1, look: [1, -0.4] });
      hq.tag(ctx, 540, 410, 'SE METE POR EL ESTE', { size: 48, fill: '#fdba74' });
    }
  },

  vientos(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Globo con los vientos: primero normales; luego dan la vuelta. Después las nubes de lluvia se mudan.
    const c1 = cue(1), rev = ease((local - 0.5) / 0.4), cx = 540, cy = 860, R = 400, lon0 = -20 - t * 4;
    space(ctx, W, H, t);
    drawGlobe(ctx, cx, cy, R, { lon0, lat0: 10, extra: (c, r) => {
      const d = rev > 0.5 ? -1 : 1, col = rev > 0.5 ? '#fca5a5' : '#ffffff';
      // Vientos alisios (cerca del ecuador) van hacia el oeste; los del oeste (latitudes medias), hacia el este.
      for (const lat of [14, -14]) geoArrow(c, lat, lon0 + 40 * d, lon0 - 40 * d, lon0, 10, r, { color: col });
      for (const lat of [46, -44]) geoArrow(c, lat, lon0 - 40 * d, lon0 + 40 * d, lon0, 10, r, { color: col });
    } });
    if (local > c1) {
      const k = ease((local - c1) / 1.4);
      for (const [x0, y0, x1, y1] of [[380, 720, 700, 800], [720, 980, 420, 1000]]) { const x = lerp(x0, x1, k), y = lerp(y0, y1, k); cloud(ctx, x, y, 80, '#94a3b8'); rain(ctx, 160, y + 30, y + 150, t, 0.9, 10, x - 80); }
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'LOS VIENTOS DAN LA VUELTA' : 'LA LLUVIA SE MUDA', { size: 44, fill: local < c1 ? '#ffffff' : '#bae6fd' });
  },

  sahara(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // El Sahara reverdece: la arena se vuelve pasto y crecen árboles.
      const g = ease((local - 0.6) / 1.8);
      sky(ctx, W, 0, 1000, mixc('#fbbf24', '#7dd3fc', g), mixc('#fef3c7', '#f0f9ff', g));
      sunDisc(ctx, 860, 560, 60, t);
      if (g > 0.3) { cloud(ctx, 300, 600, 110, '#e2e8f0', ease((g - 0.3) / 0.4)); rain(ctx, 220, 660, 1000, t, 0.7 * g, 22, 190); }
      for (const [x, w, h] of [[-100, 700, 170], [400, 800, 140]]) { ctx.beginPath(); ctx.moveTo(x, 1010); ctx.quadraticCurveTo(x + w / 2, 1010 - h * 2, x + w, 1010); ctx.closePath(); ctx.fillStyle = mixc('#f59e0b', '#22c55e', g); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
      ground(ctx, W, H, 1000, mixc('#fbbf24', '#4ade80', g), mixc('#b45309', '#15803d', g));
      for (let i = 0; i < 5; i++) bushyTree(ctx, 120 + i * 210, 1010 + (i % 2) * 30, 230, { k: ease((g - i * 0.1) / 0.5), seed: i });
      hq.toon(ctx, 540, 1070, 300, { ...HERO, t, seed: 3, armL: [1.2, -0.6], armR: [1.2, -0.6], eyes: g > 0.5 ? 'happy' : 'open', mouth: g > 0.5 ? 'smile' : 'o', look: [0, -0.5] });
      hq.tag(ctx, 540, 410, 'EL SAHARA, VERDE', { size: 50, fill: '#86efac' });
    } else {
      // Globo de América: nuevas zonas de desierto.
      const k = ease((local - c1) / 1.2), cx = 540, cy = 860, R = 420, lon0 = -70 - (local - c1) * 3;
      space(ctx, W, H, t);
      drawGlobe(ctx, cx, cy, R, { lon0, lat0: 5, extra: (c, r) => {
        c.globalAlpha = k;
        geoBlob(c, -86, 33, 9, 5, lon0, 5, r, '#f59e0b');
        geoBlob(c, -50, -12, 12, 10, lon0, 5, r, '#f59e0b');
        geoBlob(c, -63, -33, 5, 7, lon0, 5, r, '#f59e0b');
        c.globalAlpha = 1;
      } });
      hq.tag(ctx, 540, 410, 'NUEVOS DESIERTOS', { size: 50, fill: '#fde68a' });
    }
  },

  europa(ctx, o) {
    const { W, H, local, t } = o;
    // Pueblo de Europa bajo una nevada: el viento helado llega desde Rusia (a la derecha).
    const snow = ease(local / 1.2);
    sky(ctx, W, 0, 1040, '#64748b', '#cbd5e1');
    ground(ctx, W, H, 1040, '#f1f5f9', '#cbd5e1');
    for (const [x, w] of [[180, 220], [480, 260], [800, 200]]) house(ctx, x, 1060, w, snow);
    snowfall(ctx, W, 480, 1100, t, 1.4);
    // Flechas de viento desde la derecha.
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const y = 620 + i * 110, off = ((t * 400 + i * 160) % 500); for (const [w, c] of [[18, INK], [10, '#bae6fd']]) { ctx.beginPath(); ctx.moveTo(W + 60 - off, y); ctx.lineTo(W - 240 - off, y); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); } }
    ctx.restore();
    hq.tag(ctx, 900, 520, 'RUSIA →', { size: 34, fill: '#bae6fd' });
    hq.toon(ctx, 540, 1150, 330, { ...HERO, t: t * 3, seed: 4, armL: [0.9, 1.6], armR: [0.9, 1.6], eyes: 'closed', mouth: 'flat', brows: -1, lean: 0.03 * Math.sin(t * 30) });
    hq.tag(ctx, 540, 410, 'INVIERNOS HELADOS', { size: 50, fill: '#bae6fd' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Supercomputadora: gabinetes con luces y una pantalla con la Tierra al revés.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0f172a'], [1, '#1e293b']]); ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 210; hq.roundRectPath(ctx, x, 880, 170, 420, 14); ctx.fillStyle = hq.vgrad(ctx, 0, 880, 1300, [[0, '#334155'], [1, '#1e293b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
        for (let j = 0; j < 9; j++) { const on = Math.sin(t * 7 + i * 3 + j * 1.7) > 0; ctx.fillStyle = on ? (j % 3 ? '#22c55e' : '#38bdf8') : '#0b1220'; ctx.beginPath(); ctx.arc(x + 30 + (j % 3) * 55, 920 + Math.floor(j / 3) * 40, 9, 0, TAU); ctx.fill(); }
      }
      hq.roundRectPath(ctx, 230, 480, 620, 380, 24); ctx.fillStyle = '#020617'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#94a3b8'; ctx.stroke();
      drawGlobe(ctx, 540, 670, 150, { lon0: 20 + t * 40, lat0: 15, glow: false });
      spinArrow(ctx, 540, 690, 150, -1, '#f87171');
      hq.tag(ctx, 540, 410, 'UNA SUPERCOMPUTADORA', { size: 46, fill: '#86efac' });
    } else {
      // Venus: el Sol sale por el oeste.
      space(ctx, W, H, t);
      const k = ease((local - c1) / 1.0);
      sunDisc(ctx, lerp(200, 230, k), lerp(860, 600, k), 70, t);
      const cx = 600, cy = 900, R = 320;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, cy - R, cy + R, [[0, '#fde68a'], [1, '#d97706']]); ctx.fill(); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 22; for (let i = 0; i < 6; i++) { ctx.beginPath(); const y = cy - R + 70 + i * 100; for (let x = cx - R; x <= cx + R; x += 20) ctx.lineTo(x, y + 18 * Math.sin(x * 0.02 - t * 1.5 + i)); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      spinArrow(ctx, cx, cy + 30, R, -1, '#f87171');
      kit.text(ctx, 'VENUS', cx, cy, { size: 80, fill: '#ffffff' });
      hq.tag(ctx, 540, 410, 'EN VENUS, EL SOL SALE POR EL OESTE', { size: 36, fill: '#fde68a' });
    }
  },
};
