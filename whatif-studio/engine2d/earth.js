// Globo terráqueo 2D: continentes simplificados (longitud, latitud en grados) en proyección
// ortográfica (la Tierra vista desde lejos, como una esfera). Sirve para cualquier Short.
import { INK } from './kit.js';

export const LAND = [
  // Norteamérica
  [[-165, 66], [-157, 71], [-140, 70], [-125, 70], [-110, 68], [-95, 70], [-85, 68], [-80, 63], [-75, 61], [-65, 60], [-61, 55], [-56, 51], [-60, 47], [-66, 44], [-70, 42], [-74, 40], [-76, 35], [-81, 31], [-80, 26], [-81, 25], [-83, 29], [-89, 30], [-95, 29], [-97, 26], [-97, 21], [-95, 18.5], [-91, 19], [-90, 21], [-87, 21], [-88, 16], [-84, 12], [-82, 9], [-79, 9], [-77, 8], [-80, 7.5], [-84, 9], [-86, 12], [-92, 14], [-96, 16], [-105, 20], [-110, 23], [-114, 28], [-117, 32], [-121, 35], [-124, 40], [-124, 46], [-125, 49], [-130, 54], [-136, 58], [-145, 60], [-152, 59], [-158, 57], [-162, 55], [-158, 59], [-162, 60], [-165, 63]],
  // Groenlandia
  [[-55, 60], [-43, 60], [-38, 65], [-22, 70], [-20, 76], [-18, 81], [-30, 83], [-55, 82], [-65, 79], [-70, 77], [-58, 75], [-55, 70], [-52, 66]],
  // Sudamérica
  [[-77, 8], [-72, 12], [-64, 11], [-60, 8.5], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -15], [-40, -22], [-48, -26], [-53, -34], [-58, -38], [-62, -39], [-65, -42], [-66, -47], [-68, -50], [-69, -55], [-74, -52], [-74, -46], [-73, -40], [-72, -30], [-71, -20], [-76, -14], [-81, -6], [-80, -2], [-80, 1], [-78, 4]],
  // África
  [[-17, 21], [-16, 28], [-10, 30], [-6, 35.5], [10, 37], [11, 33], [20, 31], [25, 32], [32, 31], [34, 28], [39, 20], [43, 12], [51, 12], [48, 6], [41, -2], [40, -10], [40, -16], [35, -22], [33, -27], [28, -33], [20, -35], [18, -32], [15, -27], [12, -17], [13, -11], [9, -1], [9, 4], [5, 6], [-3, 5], [-8, 4.5], [-13, 8], [-17, 15]],
  // Eurasia
  [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [8, 54], [9, 57], [5, 58], [6, 62], [14, 67], [25, 71], [40, 68], [45, 68], [60, 69], [70, 73], [80, 73], [100, 77], [110, 74], [130, 71], [140, 72], [160, 70], [175, 67], [180, 65], [178, 62], [165, 60], [163, 56], [156, 51], [156, 57], [150, 59], [142, 59], [136, 54], [141, 52], [140, 48], [135, 43], [130, 42], [129, 35], [126, 35], [126, 38], [122, 40], [118, 38], [122, 30], [120, 25], [115, 22], [108, 21], [106, 18], [109, 12], [105, 9], [100, 13], [100, 8], [103, 1], [98, 8], [98, 16], [94, 17], [92, 22], [88, 22], [80, 15], [77, 8], [73, 17], [73, 21], [67, 25], [57, 25], [56, 27], [50, 30], [48, 29], [51, 24], [56, 26], [59, 22], [52, 16], [43, 13], [39, 21], [35, 28], [34, 31], [36, 36], [30, 36], [27, 37], [26, 40], [23, 40], [22, 37], [20, 40], [19, 42], [13, 45], [15, 42], [18, 40], [16, 38], [12, 42], [9, 44], [3, 43], [-2, 37], [-6, 36]],
  // Gran Bretaña e Irlanda
  [[-5, 50], [1, 51], [2, 53], [-2, 56], [-2, 58.5], [-5, 58.5], [-6, 56], [-3, 54], [-5, 52]],
  [[-10, 52], [-6, 52], [-6, 55], [-8, 55], [-10, 54]],
  // Islandia, Cuba, Madagascar, Japón
  [[-24, 64], [-14, 64.5], [-14, 66], [-22, 66.5]],
  [[-85, 22], [-74, 20], [-77, 20], [-82, 22.5]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[130, 31], [131, 34], [135, 34], [140, 35], [141, 38], [142, 41], [140, 41], [139, 38], [136, 36], [132, 35]],
  [[140, 42], [143, 42], [145, 43.5], [142, 45.5]],
  // Indonesia y Nueva Guinea
  [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [96, 2]],
  [[109, 2], [113, 4], [117, 7], [119, 5], [118, 1], [116, -4], [111, -3], [109, -1]],
  [[105, -6], [114, -7], [114, -8.5], [106, -7]],
  [[131, -1], [138, -2], [147, -6], [150, -10], [143, -9], [138, -8], [134, -4]],
  // Australia y Nueva Zelanda
  [[114, -22], [114, -26], [115, -34], [118, -35], [124, -33], [131, -31], [135, -34], [138, -35], [140, -38], [146, -39], [150, -37], [153, -31], [153, -25], [149, -20], [146, -18], [145, -14], [142, -11], [141, -17], [136, -15], [137, -12], [132, -11], [129, -15], [125, -14], [122, -18], [117, -20]],
  [[172, -34], [178, -38], [175, -42], [168, -46], [172, -41]],
  // Antártida
  [...Array.from({ length: 19 }, (_, i) => [-180 + i * 20, -70 + 4 * Math.sin(i * 1.7)]), [180, -90], [-180, -90]],
];

// Bordes subdivididos (máx. 3°) para que la curva de la esfera se vea suave.
const DENSE = LAND.map((poly) => {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 3));
    for (let k = 0; k < steps; k++) out.push([a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps]);
  }
  return out;
});

const D = Math.PI / 180;

/** Proyección ortográfica: devuelve [x, y, visible] respecto al centro (y hacia abajo). */
export function project(lon, lat, lon0, lat0, R) {
  const l = (lon - lon0) * D, p = lat * D, p0 = lat0 * D;
  const x = R * Math.cos(p) * Math.sin(l);
  const y = R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  const c = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return [x, -y, c > 0];
}

/**
 * Dibuja la Tierra. opts: lon0 (giro, grados), lat0 (inclinación), ocean, land, ice (casquetes),
 * night: 0..1 (sombra del lado nocturno, con el Sol a la izquierda), outline, landClip(ctx, R)
 * (función opcional que recorta los continentes), extra(ctx, R) (dibujo adicional dentro del disco).
 */
export function drawGlobe(ctx, cx, cy, R, opts = {}) {
  const { lon0 = 0, lat0 = 12, ocean = '#2b7bd6', land = '#4fbf5a', ice = '#f1f5f9', night = 0, outline = 6, glow = true } = opts;
  ctx.save();
  ctx.translate(cx, cy);
  if (glow) {
    const g = ctx.createRadialGradient(0, 0, R * 0.95, 0, 0, R * 1.18);
    g.addColorStop(0, 'rgba(125,211,252,0.45)'); g.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = ocean; ctx.fill();
  ctx.save();
  ctx.clip();
  if (opts.under) opts.under(ctx, R);
  ctx.save();
  if (opts.landClip) opts.landClip(ctx, R);
  DENSE.forEach((poly, idx) => {
    const pts = poly.map(([lo, la]) => project(lo, la, lon0, lat0, R));
    if (!pts.some((p) => p[2])) return;
    ctx.beginPath();
    pts.forEach(([x, y, vis], i) => {
      // Los puntos del otro lado se aplastan contra el borde del disco (recorte aproximado).
      if (!vis) { const k = R / Math.max(1e-6, Math.hypot(x, y)); x *= k; y *= k; }
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath();
    const base = idx === 1 || idx === LAND.length - 1 ? ice : land;
    const col = opts.polyColor ? opts.polyColor(idx, base) : base; // permite ocultar o teñir cada continente/isla
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fill();
  });
  ctx.restore();
  // Casquete polar norte.
  if (opts.northCap !== false) {
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) { const [x, y, v] = project(i * 5, 78, lon0, lat0, R); const k = v ? 1 : R / Math.max(1e-6, Math.hypot(x, y)); i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k); }
    ctx.closePath(); ctx.fillStyle = ice; ctx.fill();
  }
  if (opts.extra) opts.extra(ctx, R);
  // Volumen: luz arriba a la izquierda y sombra suave en el borde.
  const sh = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
  sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,30,0.35)');
  ctx.fillStyle = sh; ctx.fillRect(-R, -R, 2 * R, 2 * R);
  if (night > 0) {
    // Lado nocturno a la derecha (el Sol queda a la izquierda).
    const ng = ctx.createLinearGradient(-R * 0.15, 0, R * 0.25, 0);
    ng.addColorStop(0, 'rgba(5,10,35,0)'); ng.addColorStop(1, `rgba(5,10,35,${0.82 * night})`);
    ctx.fillStyle = ng; ctx.fillRect(-R, -R, 2 * R, 2 * R);
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  if (outline) { ctx.lineWidth = outline; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}
