// Short 10 (idea de un suscriptor): ¿y si las islas no existieran?
// Las islas se hunden en el globo → adiós Japón, Reino Unido… → 700 millones de personas →
// 17,000 islas de Indonesia → Groenlandia contra México → Madagascar → Mauna Kea → Australia se queda.
import { drawGlobe, LAND, project } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(240, C.W, C.H, 12); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const D = Math.PI / 180;
const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#172554'); kit.drawStars(ctx, stars, 0.85, t); };
const sea = (ctx, { W, H, kit, t }) => {
  kit.gradientBG(ctx, W, H, '#38bdf8', '#0c4a6e');
  // Olitas que se mueven despacio.
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  const r = C_rng(7);
  for (let i = 0; i < 26; i++) {
    const x = ((r() * W + t * 30) % (W + 120)) - 60, y = 120 + r() * (H - 240);
    ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.quadraticCurveTo(x - 15, y - 10, x, y); ctx.quadraticCurveTo(x + 15, y + 10, x + 30, y); ctx.stroke();
  }
  ctx.restore();
};
// Generador con semilla local (igual al del kit) para no depender del orden de llamadas.
function C_rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Índices de LAND que son islas (Groenlandia, Gran Bretaña, Irlanda, Islandia, Cuba, Madagascar,
// Japón ×2, Sumatra, Borneo, Java, Nueva Guinea, Nueva Zelanda).
const ISL = [1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17];
// Islas que el globo base no trae (contornos simplificados, longitud/latitud).
const EXTRA = [
  [[120, 18.5], [122, 18.5], [122.2, 17], [121.5, 15.5], [124, 13], [123, 13.5], [121.5, 14], [120.6, 14.2], [120, 16], [120.3, 17.5]], // Luzón
  [[124.3, 12.5], [125.7, 12.3], [125.3, 10.3], [124.5, 10.2]], // Sámar y Leyte
  [[122, 11.8], [123.2, 11], [123.3, 9.2], [122.5, 9.6], [122, 10.5]], // Panay y Negros
  [[122, 7], [123.5, 8], [125.5, 9.5], [126.5, 7], [126, 6], [125, 5.6], [124, 6.4]], // Mindanao
  [[121.5, 25.3], [122, 25], [121.2, 22.5], [120.8, 21.9], [120.1, 23], [120.6, 24.5]], // Taiwán
  [[79.8, 9.8], [80.3, 9.8], [81.8, 7.5], [81.4, 6.2], [80.2, 6], [79.8, 7.5]], // Sri Lanka
  [[119, -5.5], [120.5, -5.5], [120.5, -3], [121.5, -4.5], [123, -4.5], [122, -3], [121, -1.5], [123, -0.8], [125, 1.5], [124, 0.5], [121, 0.5], [120, 0.8], [119.5, -1], [119, -3.5]], // Sulawesi
  [[-155.9, 20.2], [-155.1, 19.9], [-154.8, 19.5], [-155.6, 18.9], [-156, 19.6]], // Hawái
];
const MADAGASCAR = [[49.3, -12], [50.2, -15.5], [50.4, -15.9], [49.8, -17], [49.4, -18.5], [48.5, -20.5], [47.6, -23.5], [47, -25], [45.2, -25.5], [44, -24.8], [43.6, -23.5], [43.3, -22], [44.3, -20], [44.4, -19], [44, -17.5], [44.5, -16.2], [46, -15.8], [47.2, -14.7], [48, -13.6], [48.8, -12.5]];
const MEXICO = [[-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-104.7, 30], [-103.3, 29], [-102.4, 29.8], [-101.4, 29.8], [-99.5, 27.5], [-97.2, 25.9], [-97.7, 24], [-97.4, 22], [-96.2, 19.4], [-94.8, 18.5], [-92.5, 18.6], [-91, 19], [-90.4, 20.5], [-90.3, 21.1], [-87, 21.5], [-86.8, 20.6], [-87.5, 19], [-88.3, 18.5], [-89.1, 17.9], [-91, 17.3], [-91.4, 16], [-92.2, 14.5], [-93.9, 15.9], [-95.2, 16.2], [-96.5, 15.7], [-98.5, 16.3], [-100.5, 17.2], [-102.2, 17.9], [-103.6, 18.6], [-104.9, 19.4], [-105.6, 20.4], [-105.3, 21.5], [-106.4, 23.2], [-107.5, 24.5], [-109, 25.6], [-110.9, 27.9], [-112.2, 29], [-113.5, 31.3], [-114.8, 31.8], [-114.8, 31], [-113.5, 28.9], [-112.3, 27.3], [-111.3, 26], [-110.3, 24.2], [-109.9, 22.9], [-110.2, 23.4], [-112, 24.6], [-113.6, 26.7], [-114.1, 28], [-115.9, 29.9], [-116.6, 31.9]];

// Contornos más finos para las tarjetas y la comparación de tamaños.
const GB = [[-5.7, 50.05], [-3.5, 50.3], [-1, 50.7], [1.4, 51.2], [1.7, 52.6], [0.3, 53.4], [-0.2, 54.1], [-1.5, 55], [-2, 55.9], [-3, 56], [-1.8, 57.5], [-3.4, 57.7], [-4, 58.6], [-5, 58.6], [-5.7, 57.5], [-5.5, 56.4], [-6.2, 56.3], [-5.6, 55.3], [-4.9, 54.8], [-3.4, 54.9], [-3, 53.8], [-3.1, 53.3], [-4.6, 53.3], [-4.1, 52.4], [-5.1, 51.9], [-4.2, 51.6], [-3, 51.5], [-4.5, 51]];
const JAPAN = [
  [[130.9, 34], [132.5, 35.4], [135.5, 35.6], [136.8, 37.3], [138.5, 37.9], [140, 39.8], [139.9, 41.1], [141.4, 41.4], [141.9, 39.5], [141, 38.3], [140.9, 36.9], [140, 35], [138.8, 34.6], [137, 34.6], [135.2, 33.8], [133, 34.4]],
  [[129.7, 33.3], [131, 33.9], [131.9, 33], [131.3, 31.4], [130.2, 31.2], [129.8, 32.6]],
  [[132.5, 33], [133.5, 34.2], [134.7, 34.2], [134.2, 33.3], [133, 32.8]],
  [[140, 41.5], [141.2, 41.8], [143.3, 42], [145.5, 43.3], [144.5, 44], [141.9, 45.5], [141.6, 43.4], [140.3, 43.3], [140.4, 42.3]],
];
const CUBA = [[-84.9, 21.9], [-83, 22.9], [-81, 23.2], [-79.5, 22.7], [-77.6, 21.8], [-75.7, 21.1], [-74.1, 20.2], [-75.6, 19.9], [-77.7, 19.9], [-77.2, 20.6], [-78.5, 21.5], [-80.5, 22], [-82, 22.4], [-83.4, 22.2]];
const NZ = [
  [[172.7, -34.4], [174.5, -35.8], [175.9, -37.3], [178.5, -37.7], [177.9, -39.1], [176.9, -39.6], [175.2, -41.6], [174.6, -41.3], [175.1, -40], [173.8, -39.2], [174.6, -38.1], [174.3, -36.6]],
  [[172.7, -40.5], [174.3, -41.3], [173.5, -42.7], [172.7, -43.8], [171.2, -44.5], [170.6, -45.9], [169, -46.6], [166.5, -46], [166.9, -45.2], [168.4, -44], [170.6, -43], [171.5, -41.8]],
];
const GREENLAND = [[-73, 78.2], [-66, 80.9], [-60, 82.2], [-45, 82.8], [-32, 83.6], [-21, 82.5], [-17, 80], [-19.5, 77.5], [-18.5, 75], [-22, 72.5], [-22, 70.5], [-24.5, 69.5], [-32, 68.2], [-35.5, 66], [-38.5, 65.5], [-41, 63], [-43, 60], [-45, 60.2], [-48, 61.5], [-50, 63.5], [-51.5, 65], [-53.5, 66.5], [-53, 68.5], [-51, 69.5], [-54.5, 70.5], [-55, 72.5], [-57, 74.5], [-61, 76], [-67.5, 76.2], [-71, 77]];

const ALL_ISL = [...ISL.map((i) => LAND[i]), ...EXTRA];
const centroid = (poly) => poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
/** Color con transparencia a, mezclado hacia el amarillo según hot (0..1). */
const rgba = (hex, a, hot = 0) => { const c = rgb(hex), y = [250, 204, 21]; return `rgba(${c.map((v, i) => Math.round(v + (y[i] - v) * hot)).join(',')},${a})`; };

/**
 * Globo con islas que se desvanecen. vis(i) → 1 visible … 0 hundida, para i en el orden de ALL_ISL.
 * hi(idx, base) permite teñir un continente.
 */
function islandGlobe(ctx, o, cx, cy, R, lon0, lat0, vis, hi = null, hot = () => 0) {
  drawGlobe(ctx, cx, cy, R, {
    lon0, lat0,
    polyColor: (idx, base) => {
      const k = ISL.indexOf(idx);
      if (k < 0) return hi ? hi(idx, base) : base;
      const a = vis(k);
      return a <= 0.01 ? null : rgba(base, a, hot(k));
    },
    extra: (c) => EXTRA.forEach((poly, j) => {
      const a = vis(ISL.length + j);
      if (a <= 0.01) return;
      const pts = poly.map(([lo, la]) => project(lo, la, lon0, lat0, R));
      if (!pts.every((p) => p[2])) return;
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      c.fillStyle = rgba('#4fbf5a', a, hot(ISL.length + j)); c.fill();
    }),
  });
}

/** Anillos de "¡plop!" donde se hunde cada isla visible. */
function ripples(ctx, cx, cy, R, lon0, lat0, prog) {
  ctx.save(); ctx.lineWidth = 5;
  ALL_ISL.forEach((poly, i) => {
    const k = prog(i);
    if (k <= 0 || k >= 1) return;
    const [lo, la] = centroid(poly), [x, y, v] = project(lo, la, lon0, lat0, R);
    if (!v) return;
    for (const d of [0, 0.25]) {
      const kk = (k - d) / (1 - d); if (kk <= 0) continue;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - kk)})`;
      ctx.beginPath(); ctx.arc(cx + x, cy + y, 8 + 70 * kk, 0, Math.PI * 2); ctx.stroke();
    }
  });
  ctx.restore();
}

/** Silueta plana de una isla (proyección local de áreas iguales) centrada en (cx, cy). */
function silhouette(ctx, kit, polys, cx, cy, box, fill, lw = 5) {
  const latc = polys.flat().reduce((a, p) => a + p[1], 0) / polys.flat().length;
  const P = polys.map((poly) => poly.map(([lo, la]) => [lo * Math.cos(latc * D), -la]));
  const xs = P.flat().map((p) => p[0]), ys = P.flat().map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sc = box / Math.max(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  for (const poly of P) {
    ctx.beginPath(); poly.forEach(([x, y], i) => { const X = cx + (x - mx) * sc, Y = cy + (y - my) * sc; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.closePath(); kit.shape(ctx, fill, lw);
  }
}

/** Contorno en km (proyección sinusoidal centrada en el propio meridiano), escalado al área real. */
function equalArea(poly, areaKm2) {
  const lonc = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const pts = poly.map(([lo, la]) => [(lo - lonc) * Math.cos(la * D) * 111.19, -la * 111.19]);
  let A = 0; for (let i = 0; i < pts.length; i++) { const [a, b] = [pts[i], pts[(i + 1) % pts.length]]; A += a[0] * b[1] - b[0] * a[1]; }
  const k = Math.sqrt(areaKm2 / Math.abs(A / 2));
  const c = centroid(pts);
  return pts.map(([x, y]) => [(x - c[0]) * k, (y - c[1]) * k]);
}
const GREENLAND_KM = equalArea(GREENLAND, 2166086);
const MEXICO_KM = equalArea(MEXICO, 1964375);

/** Lémur de cola anillada sentado, con la base en (x, y). */
function lemur(ctx, kit, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // Cola: curva hacia arriba con anillos blancos y negros.
  const sway = Math.sin(t * 2) * 18;
  const tail = (u) => [60 + 120 * u + sway * u * u, -30 - 380 * u + 60 * u * u * u];
  ctx.lineCap = 'round';
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 46; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const [a, b] = tail(i / 24); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); } ctx.stroke();
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = i % 2 ? '#111827' : '#f8fafc'; ctx.lineWidth = 34; ctx.beginPath();
    for (let j = 0; j <= 4; j++) { const [a, b] = tail((i + j / 4) / 12); j ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
    ctx.stroke();
  }
  // Cuerpo, patas y cabeza.
  ctx.beginPath(); ctx.ellipse(0, -120, 78, 120, 0, 0, Math.PI * 2); kit.shape(ctx, '#9ca3af', 7);
  ctx.beginPath(); ctx.ellipse(0, -100, 44, 80, 0, 0, Math.PI * 2); ctx.fillStyle = '#e5e7eb'; ctx.fill();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 46, -14, 40, 20, 0, 0, Math.PI * 2); kit.shape(ctx, '#9ca3af', 6); }
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 30, -300); ctx.lineTo(sx * 72, -350); ctx.lineTo(sx * 64, -290); ctx.closePath(); kit.shape(ctx, '#9ca3af', 6); }
  ctx.beginPath(); ctx.ellipse(0, -265, 70, 60, 0, 0, Math.PI * 2); kit.shape(ctx, '#9ca3af', 7);
  ctx.beginPath(); ctx.ellipse(0, -248, 50, 44, 0, 0, Math.PI * 2); ctx.fillStyle = '#f8fafc'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-22, -226); ctx.lineTo(0, -196); ctx.lineTo(22, -226); ctx.closePath(); kit.shape(ctx, '#111827', 4);
  const blink = (t % 3.1) < 0.12 ? 0.15 : 1;
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(sx * 26, -262, 22, 22, 0, 0, Math.PI * 2); ctx.fillStyle = '#111827'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx * 26, -262, 15, 15 * blink, 0, 0, Math.PI * 2); ctx.fillStyle = '#f59e0b'; ctx.fill();
    ctx.beginPath(); ctx.arc(sx * 26, -262, 6 * blink, 0, Math.PI * 2); ctx.fillStyle = '#111827'; ctx.fill();
  }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const lon0 = 112 + local * 7, lat0 = 8, R = 380, cx = W / 2, cy = 640;
    const T = cue(1) + 0.1;
    const prog = (i) => kit.clamp((local - (T + (i % 9) * 0.09)) / 0.7);
    // Antes de hundirse, las islas parpadean en amarillo.
    const hot = (i) => (prog(i) > 0 ? 1 : kit.ramp(local, T - 0.9, T - 0.5) * (0.6 + 0.4 * Math.sin(t * 14)));
    islandGlobe(ctx, o, cx, cy, R, lon0, lat0, (i) => 1 - prog(i), null, hot);
    ripples(ctx, cx, cy, R, lon0, lat0, prog);
  },

  adios(ctx, o) {
    const { W, kit, local, cue } = o;
    sea(ctx, o);
    const cards = [
      ['JAPÓN', JAPAN], ['REINO UNIDO', [GB]], ['INDONESIA', [LAND[12], LAND[13], LAND[14], EXTRA[6]]],
      ['FILIPINAS', EXTRA.slice(0, 4)], ['CUBA', [CUBA]], ['NUEVA ZELANDA', NZ],
    ];
    cards.forEach(([name, polys], i) => {
      const row = Math.floor(i / 3), col = i % 3;
      const a0 = (row ? cue(1) : 0.1) + col * 0.3;
      const ap = o.ease.out(kit.ramp(local, a0, a0 + 0.35));
      if (ap <= 0) return;
      const cx = 190 + col * 350, cy = 430 + row * 400;
      const sink = kit.ramp(local, a0 + 0.9, a0 + 1.6);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(ap, ap);
      kit.roundRect(ctx, -145, -130, 290, 260, 26); kit.shape(ctx, '#0284c7', 7);
      ctx.save(); kit.roundRect(ctx, -145, -130, 290, 260, 26); ctx.clip();
      ctx.globalAlpha = 1 - sink;
      ctx.translate(0, sink * 40); ctx.scale(1 - 0.5 * sink, 1 - 0.5 * sink);
      silhouette(ctx, kit, polys, 0, 0, 200, '#4fbf5a', 4);
      ctx.restore();
      if (sink > 0 && sink < 1) for (const d of [0, 0.3]) { const kk = (sink - d) / (1 - d); if (kk <= 0) continue; ctx.strokeStyle = `rgba(255,255,255,${1 - kk})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 20, 30 + 100 * kk, 12 + 40 * kk, 0, 0, Math.PI * 2); ctx.stroke(); }
      kit.text(ctx, name, 0, 170, { size: 38, fill: sink > 0.5 ? '#cbd5e1' : '#ffffff', maxW: 320 });
      if (sink > 0.5) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 8; ctx.lineCap = 'round'; const w = Math.min(160, ctx.measureText(name).width / 2 + 10) * kit.ramp(sink, 0.5, 1); ctx.beginPath(); ctx.moveTo(-w, 170); ctx.lineTo(w, 170); ctx.stroke(); }
      ctx.restore();
    });
  },

  gente(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e3a8a', '#0f172a');
    const n = 700e6 * o.ease.out(kit.ramp(local, 0.15, cue(1) - 0.1));
    kit.text(ctx, `+${kit.nf(Math.round(n / 1e6) * 1e6)}`, W / 2, 270, { size: 100, fill: kit.YELLOW, maxW: W * 0.9 });
    kit.text(ctx, 'PERSONAS', W / 2, 370, { size: 48, fill: '#ffffff' });
    const h1 = kit.ramp(local, cue(1), cue(1) + 0.3);
    const shirts = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#22c55e', '#6366f1'];
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 5), col = i % 5, me = i === 7;
      const ap = o.ease.out(kit.ramp(local, 0.1 + i * 0.07, 0.4 + i * 0.07));
      if (ap <= 0) continue;
      const x = 160 + col * 190, y = 720 + row * 300;
      const grey = !me && h1 > 0.5, jump = me ? 30 * h1 * Math.abs(Math.sin(t * 6)) : 0;
      ctx.save(); ctx.globalAlpha = grey ? 0.4 : 1;
      kit.person(ctx, x, y - jump, 230 * ap, { shirt: grey ? '#64748b' : me && h1 > 0 ? kit.YELLOW : shirts[i], arms: me ? h1 : 0 });
      ctx.restore();
    }
  },

  indonesia(ctx, o) {
    const { W, kit, local, s } = o;
    sea(ctx, o);
    const k = o.ease.out(kit.ramp(local, 0.1, s.dur - 0.6));
    const r = C_rng(17), N = 230;
    for (let i = 0; i < N; i++) {
      const x = 50 + r() * (W - 100), y = 470 + r() * 580, rad = 7 + Math.pow(r(), 3) * 40, rot = r() * 6, seed = r();
      const ap = kit.clamp((k * N - i) / 6);
      if (ap <= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(ap, ap);
      ctx.beginPath();
      for (let j = 0; j < 9; j++) { const a = (j / 9) * Math.PI * 2, rr = rad * (0.7 + 0.3 * Math.sin(seed * 40 + j * 2.3)); j ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.75) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.75); }
      ctx.closePath(); kit.shape(ctx, '#4fbf5a', rad > 20 ? 4 : 3, '#fde68a');
      ctx.restore();
    }
    kit.text(ctx, `${kit.nf(Math.round(17000 * k))}${k >= 1 ? '+' : ''}`, W / 2, 270, { size: 110, fill: kit.YELLOW });
    kit.text(ctx, 'ISLAS', W / 2, 380, { size: 52, fill: '#ffffff' });
  },

  groenlandia(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e3a8a');
    const px = 640 / 2670; // 2,670 km de norte a sur ≈ 640 px
    const cx = W / 2, cy = 680;
    const poly = (pts, ox, oy) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x * px, oy + y * px) : ctx.moveTo(ox + x * px, oy + y * px))); ctx.closePath(); };
    const g = o.ease.out(kit.ramp(local, 0.1, 0.5));
    ctx.save(); ctx.translate(cx, cy); ctx.scale(g, g); poly(GREENLAND_KM, 0, 0); kit.shape(ctx, '#f1f5f9', 7); ctx.restore();
    kit.text(ctx, 'GROENLANDIA', W / 2, 200, { size: 64, fill: '#f1f5f9' });
    kit.text(ctx, '2,166,000 km²', W / 2, 270, { size: 46, fill: '#cbd5e1' });
    const m = o.ease.out(kit.ramp(local, cue(1) - 0.1, cue(1) + 0.6));
    if (m > 0) {
      ctx.save(); ctx.globalAlpha = 0.85; poly(MEXICO_KM, cx + (1 - m) * 700, cy + 40); kit.shape(ctx, '#22c55e', 6); ctx.restore();
      ctx.save(); ctx.globalAlpha = m;
      kit.text(ctx, 'MÉXICO', W / 2 - 230, 360, { size: 50, fill: '#4ade80' });
      kit.text(ctx, '1,964,000 km²', W / 2 + 150, 360, { size: 40, fill: '#bbf7d0' });
      ctx.restore();
    }
  },

  animales(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#166534', '#052e16');
    const ap = o.ease.out(kit.ramp(local, 0.05, 0.45));
    ctx.save(); ctx.translate(280, 690); ctx.scale(ap, ap); silhouette(ctx, kit, [MADAGASCAR], 0, 0, 560, '#84cc16', 6); ctx.restore();
    kit.text(ctx, 'MADAGASCAR', 280, 1010, { size: 40, fill: '#ecfccb' });
    const lm = o.ease.out(kit.ramp(local, 0.4, 0.9));
    if (lm > 0) lemur(ctx, kit, 770, 1000 + (1 - lm) * 500, 1.15, t);
    // 9 de cada 10.
    const k = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.9);
    if (k > 0) {
      kit.text(ctx, '9 DE CADA 10', W / 2, 200, { size: 74, fill: kit.YELLOW });
      for (let i = 0; i < 10; i++) {
        const on = i < 9 && k * 10 > i, x = W / 2 + (i - 4.5) * 92, y = 310;
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = kit.clamp(k * 10 - i + 1);
        // Huella: almohadilla y cuatro dedos.
        ctx.fillStyle = on ? kit.YELLOW : '#64748b';
        ctx.beginPath(); ctx.ellipse(0, 10, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
        for (const [dx, dy] of [[-22, -12], [-8, -24], [8, -24], [22, -12]]) { ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
  },

  hawai(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    const base = 1060, pxm = 700 / 10210, seaY = base - 6003 * pxm, peakY = base - 10210 * pxm;
    // Cielo, mar (en corte) y fondo marino.
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#e0f2fe');
    ctx.fillStyle = '#5b3a1f'; ctx.fillRect(0, base, W, H - base);
    const mx = 560;
    const mountain = () => { ctx.beginPath(); ctx.moveTo(mx - 520, base); ctx.quadraticCurveTo(mx - 260, base - 80, mx - 60, peakY + 20); ctx.quadraticCurveTo(mx, peakY - 6, mx + 60, peakY + 20); ctx.quadraticCurveTo(mx + 260, base - 80, mx + 520, base); ctx.closePath(); };
    mountain(); kit.shape(ctx, '#78350f', 7);
    // Nieve en la cima.
    ctx.save(); mountain(); ctx.clip(); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, peakY - 10, W, 34); ctx.restore();
    // El agua tapa la parte de abajo; luego se vuelve transparente para mostrarla.
    const reveal = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.6);
    ctx.fillStyle = `rgba(3,105,161,${0.95 - 0.5 * reveal})`; ctx.fillRect(0, seaY, W, base - seaY);
    ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 6; ctx.beginPath();
    for (let x = 0; x <= W; x += 20) { const y = seaY + 5 * Math.sin(x / 40 + t * 3); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    kit.text(ctx, 'NIVEL DEL MAR', 170, seaY - 30, { size: 30, fill: '#0c4a6e', stroke: '#ffffff', lw: 6 });
    kit.text(ctx, 'MAUNA KEA (HAWÁI)', mx, peakY - 50, { size: 42, fill: '#ffffff' });
    // Regla desde el fondo del mar.
    const hk = o.ease.out(kit.ramp(local, cue(1), cue(1) + 1.4)), hm = 10210 * hk;
    if (hk > 0) {
      const x = 960, yTop = base - hm * pxm;
      ctx.strokeStyle = kit.YELLOW; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, yTop); ctx.stroke();
      for (const y of [base, yTop]) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); ctx.stroke(); }
      ctx.setLineDash([14, 12]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(mx + 60, yTop); ctx.lineTo(x - 30, yTop); ctx.stroke(); ctx.setLineDash([]);
      kit.text(ctx, `${kit.nf(Math.round(hm / 10) * 10)} m`, W / 2, 200, { size: 100, fill: kit.YELLOW });
    }
    // Comparación: altura del Everest (8,849 m).
    const ev = kit.ramp(local, cue(1) + 1.5, cue(1) + 1.9);
    if (ev > 0) {
      const y = base - 8849 * pxm;
      ctx.save(); ctx.globalAlpha = ev; ctx.setLineDash([18, 12]); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); ctx.setLineDash([]);
      kit.text(ctx, 'EVEREST: 8,849 m', 200, y - 32, { size: 34, fill: '#fecaca' });
      ctx.restore();
    }
  },

  australia(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const glow = 0.5 + 0.5 * Math.sin(t * 6), hk = kit.ramp(local, 0.2, 0.6);
    const hi = (idx, base) => (idx === 16 ? (hk > 0 ? `rgb(${Math.round(79 + (250 - 79) * hk * glow)},${Math.round(191 + (204 - 191) * hk * glow)},${Math.round(90 - 70 * hk * glow)})` : base) : base);
    islandGlobe(ctx, o, W / 2, 660, 390, 134 + local * 3, -20, () => 0, hi);
    kit.text(ctx, 'AUSTRALIA', W / 2, 200, { size: 72, fill: kit.YELLOW });
    // Sello de "CONTINENTE".
    const st = kit.ramp(local, cue(1), cue(1) + 0.25);
    if (st > 0) {
      ctx.save(); ctx.translate(W / 2, 950); ctx.rotate(-0.12); const sc = 1 + 0.9 * (1 - o.ease.out(st)); ctx.scale(sc, sc); ctx.globalAlpha = st;
      kit.roundRect(ctx, -330, -75, 660, 150, 20); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = '#dc2626'; ctx.stroke();
      kit.text(ctx, '✔ CONTINENTE', 0, 4, { size: 76, fill: '#dc2626', stroke: null });
      ctx.restore();
    }
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    // Las islas vuelven a aparecer.
    const back = (i) => kit.clamp((local - 0.2 - (i % 9) * 0.08) / 0.4);
    islandGlobe(ctx, o, W / 2, 680, 360, 120 + t * 8, 10, back);
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE @maesthela1977', W / 2, 220, { size: 60, fill: kit.YELLOW, maxW: W * 0.9 }); ctx.restore(); }
  },
};
