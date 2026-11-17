// Short 39: ¿y si se cortaran los cables del fondo del mar?  (calidad alta: engine2d/hq.js)
// Gancho: ¿te quedarías sin internet? «Ya le pasó a un país entero» (se resuelve con Tonga, casi al final).
// Casi todo el internet entre continentes va por cables submarinos → son como una manguera, con fibras de vidrio que
// llevan luz → se rompen 100+ veces al año (anclas y redes) → no lo notas porque hay cientos y los datos se desvían →
// Tonga 2022: un volcán cortó su único cable, más de un mes casi incomunicado → sorpresa: tiburones y forro
// parecido al de los chalecos antibalas.
import * as hq from '../../engine2d/hq.js';
import { drawGlobe } from '../../engine2d/earth.js';

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

const TAU = Math.PI * 2;
const INK = '#0b0f1a';
const clamp = (x) => Math.max(0, Math.min(1, x));

/** Fondo marino: degradado, rayos de luz, partículas y arena con rocas y algas. */
function seabed(ctx, W, H, t, floorY = 1000) {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0ea5e9'], [0.45, '#0369a1'], [1, '#082f49']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#e0f2fe';
  for (let i = 0; i < 5; i++) { const x = 40 + i * 240 + 40 * Math.sin(t * 0.4 + i); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 260, floorY); ctx.lineTo(x + 140, floorY); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  hq.bokeh(ctx, W, 380, floorY, t, { n: 16, seed: 8, color: 'rgba(224,242,254,A)', r: [6, 18], a: 0.35 });
  ctx.fillStyle = hq.vgrad(ctx, 0, floorY - 30, H, [[0, '#d6b77a'], [1, '#8a6d3b']]);
  ctx.beginPath(); ctx.moveTo(0, floorY); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, floorY - 18 * Math.sin(x * 0.01)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  for (const [x, h, c] of [[70, 170, '#16a34a'], [130, 120, '#15803d'], [960, 190, '#16a34a'], [1010, 130, '#22c55e']]) {
    ctx.strokeStyle = c; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, floorY);
    for (let k = 1; k <= 6; k++) ctx.lineTo(x + 18 * Math.sin(t * 1.5 + k * 0.7 + x), floorY - (h * k) / 6); ctx.stroke();
  }
  for (const [x, r] of [[250, 50], [820, 70], [880, 40]]) { ctx.beginPath(); ctx.ellipse(x, floorY + 10, r, r * 0.6, 0, Math.PI, TAU); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
}

/** Cable submarino tendido de (x0,y0) a (x1,y1) con pulsos de luz. broken: separación del corte (px). */
function cable(ctx, x0, y0, x1, y1, t, { w = 34, broken = 0, cutAt = 0.5, armor = 0 } = {}) {
  const seg = (a, b) => {
    const ax = x0 + (x1 - x0) * a, ay = y0 + (y1 - y0) * a, bx = x0 + (x1 - x0) * b, by = y0 + (y1 - y0) * b;
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 12; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = armor > 0 ? '#facc15' : '#1f2937'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = w * 0.22; ctx.beginPath(); ctx.moveTo(ax, ay - w * 0.22); ctx.lineTo(bx, by - w * 0.22); ctx.stroke();
    if (!broken) for (let i = 0; i < 6; i++) { const u = a + ((t * 0.35 + i / 6) % 1) * (b - a); hq.glow(ctx, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, w * 0.9, 'rgba(125,211,252,A)', 0.9); }
  };
  if (!broken) seg(0, 1);
  else { const g = broken / Math.hypot(x1 - x0, y1 - y0); seg(0, cutAt - g); seg(cutAt + g, 1); }
}

function anchor(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  const draw = (lw, c) => {
    ctx.lineWidth = lw; ctx.strokeStyle = c;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(0, s * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.55); ctx.lineTo(s * 0.35, -s * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.55, 0.25, Math.PI - 0.25); ctx.stroke();
  };
  draw(s * 0.2, INK); draw(s * 0.12, '#64748b');
  ctx.lineWidth = s * 0.08; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, -s * 1.02, s * 0.13, 0, TAU); ctx.stroke();
  for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg * s * 0.52, s * 0.25); ctx.lineTo(sg * s * 0.7, s * 0.05); ctx.lineTo(sg * s * 0.45, s * 0.15); ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}

function chain(ctx, x0, y0, x1, y1) {
  const n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 34));
  for (let i = 0; i < n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y1 - y0, x1 - x0) + (i % 2 ? Math.PI / 2 : 0)); ctx.beginPath(); ctx.ellipse(0, 0, 18, 10, 0, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#94a3b8'; ctx.stroke(); ctx.restore(); }
}

function ship(ctx, x, y, w, t) {
  ctx.save(); ctx.translate(x, y + 6 * Math.sin(t * 1.5)); ctx.rotate(0.02 * Math.sin(t));
  ctx.beginPath(); ctx.moveTo(-w / 2, -w * 0.08); ctx.lineTo(w / 2 + w * 0.1, -w * 0.08); ctx.lineTo(w * 0.42, w * 0.12); ctx.lineTo(-w * 0.45, w * 0.12); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, -w * 0.08, w * 0.12, [[0, '#ef4444'], [1, '#991b1b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  hq.roundRectPath(ctx, -w * 0.3, -w * 0.28, w * 0.32, w * 0.2, 8); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7dd3fc'; for (let i = 0; i < 3; i++) ctx.fillRect(-w * 0.27 + i * w * 0.1, -w * 0.24, w * 0.06, w * 0.06);
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(w * 0.25, -w * 0.08); ctx.lineTo(w * 0.25, -w * 0.4); ctx.lineTo(w * 0.45, -w * 0.25); ctx.stroke();
  ctx.restore();
}

/** Tiburón de lado (mira a la derecha). bite 0..1 abre la boca. */
function shark(ctx, x, y, s, t, bite = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.04 * Math.sin(t * 3));
  const tail = 0.25 * Math.sin(t * 5);
  ctx.save(); ctx.translate(-s * 0.55, 0); ctx.rotate(tail);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.35, -s * 0.32); ctx.lineTo(-s * 0.22, 0); ctx.lineTo(-s * 0.32, s * 0.24); ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.18); ctx.lineTo(s * 0.08, -s * 0.48); ctx.lineTo(s * 0.2, -s * 0.16); ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  const body = () => { ctx.beginPath(); ctx.moveTo(-s * 0.6, 0); ctx.bezierCurveTo(-s * 0.3, -s * 0.25, s * 0.35, -s * 0.24, s * 0.62, -s * 0.02); ctx.quadraticCurveTo(s * 0.5, s * 0.12 + bite * s * 0.1, s * 0.3, s * 0.14); ctx.bezierCurveTo(0, s * 0.22, -s * 0.35, s * 0.15, -s * 0.6, 0); ctx.closePath(); };
  body(); ctx.fillStyle = hq.vgrad(ctx, 0, -s * 0.25, s * 0.2, [[0, '#94a3b8'], [0.55, '#64748b'], [0.6, '#f1f5f9'], [1, '#e2e8f0']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // Boca con dientes.
  ctx.save(); ctx.translate(s * 0.42, s * 0.06);
  ctx.beginPath(); ctx.moveTo(-s * 0.12, 0); ctx.quadraticCurveTo(0, s * (0.03 + 0.12 * bite), s * 0.16, -s * 0.02); ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { const tx = -s * 0.1 + i * s * 0.05; ctx.beginPath(); ctx.moveTo(tx, -s * 0.005); ctx.lineTo(tx + s * 0.018, s * 0.035); ctx.lineTo(tx + s * 0.036, -s * 0.005); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * (0.18 - i * 0.05), -s * 0.06); ctx.lineTo(s * (0.16 - i * 0.05), s * 0.06); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(s * 0.4, -s * 0.07, s * 0.03, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.05, s * 0.12); ctx.lineTo(-s * 0.1, s * 0.32); ctx.lineTo(s * 0.12, s * 0.15); ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // En el fondo del mar: el cable de internet brilla… y un ancla baja directo hacia él.
    seabed(ctx, W, H, t);
    cable(ctx, -50, 900, 1130, 820, t);
    const u = clamp(local / 3.6), ay = 540 + 230 * u;
    chain(ctx, 700, 0, 690, ay - 70);
    anchor(ctx, 690, ay, 120, 0.15 * Math.sin(t * 1.5));
    for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + i / 6) % 1; ctx.strokeStyle = `rgba(224,242,254,${0.7 * (1 - ph)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(690 + 30 * Math.sin(i), ay - 80 - ph * 300, 8 + 6 * ph, 0, TAU); ctx.stroke(); }
  },

  satelite(ctx, o) {
    const { W, H, local, cue, t } = o;
    if (local < cue(1)) {
      // En el espacio: un satélite… tachado.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#020617'], [1, '#1e1b4b']]); ctx.fillRect(0, 0, W, H);
      hq.bokeh(ctx, W, 380, 1100, t, { n: 30, seed: 2, color: 'rgba(255,255,255,A)', r: [2, 5], a: 0.9 });
      drawGlobe(ctx, 540, 1450, 620, { lon0: -60 + t * 4, lat0: 10 });
      ctx.save(); ctx.translate(540, 650); ctx.rotate(0.2 + 0.05 * Math.sin(t));
      hq.roundRectPath(ctx, -70, -55, 140, 110, 14); ctx.fillStyle = hq.vgrad(ctx, 0, -55, 55, [[0, '#fde68a'], [1, '#d97706']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      for (const sg of [-1, 1]) { hq.roundRectPath(ctx, sg > 0 ? 85 : -265, -45, 180, 90, 8); ctx.fillStyle = '#1d4ed8'; ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 3; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo((sg > 0 ? 85 : -265) + k * 45, -45); ctx.lineTo((sg > 0 ? 85 : -265) + k * 45, 45); ctx.stroke(); } ctx.lineWidth = 6; ctx.strokeStyle = INK; }
      ctx.restore();
      const x = clamp((local - 0.5) / 0.4);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(300, 450); ctx.lineTo(300 + 480 * x, 450 + 400 * x); ctx.stroke();
      if (x > 0.5) { ctx.beginPath(); ctx.moveTo(780, 450); ctx.lineTo(780 - 480 * (x - 0.5) * 2, 450 + 400 * (x - 0.5) * 2); ctx.stroke(); }
      hq.tag(ctx, 540, 1000, 'NO VA POR SATÉLITE', { size: 44, fill: '#fca5a5' });
      return;
    }
    // La Tierra con los cables brillando bajo los océanos.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#020617'], [1, '#0f172a']]); ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 1100, t, { n: 30, seed: 3, color: 'rgba(255,255,255,A)', r: [2, 5], a: 0.9 });
    const cx = 540, cy = 760, R = 330;
    drawGlobe(ctx, cx, cy, R, { lon0: -40 + t * 6, lat0: 15 });
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const arcs = [[-0.8, -0.3, 0.6, -0.2], [-0.9, 0.1, 0.5, 0.35], [-0.6, -0.6, 0.7, -0.55], [-0.3, 0.5, 0.9, 0.2], [-0.95, -0.05, 0.1, 0.6]];
    const grow = clamp((local - cue(1)) / 0.8);
    for (const [a, b, c, d] of arcs) {
      const x0 = cx + a * R, y0 = cy + b * R, x1 = cx + c * R, y1 = cy + d * R, mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + 60;
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(125,211,252,0.9)'; ctx.setLineDash([2000]); ctx.lineDashOffset = 2000 * (1 - grow);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
    hq.glow(ctx, cx, cy, R * 1.15, 'rgba(56,189,248,A)', 0.2);
    hq.tag(ctx, 540, 1060, 'VA POR CABLES BAJO EL MAR', { size: 42, fill: '#7dd3fc' });
  },

  manguera(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte del cable junto a una manguera de jardín… y por dentro, hilos de vidrio con luz.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#f0f9ff'], [1, '#bae6fd']]); ctx.fillRect(0, 0, W, H);
    if (local < cue(1)) {
      const cx = 360, cy = 720, R = 200;
      for (const [r, c] of [[1, '#111827'], [0.82, '#94a3b8'], [0.62, '#b45309'], [0.45, '#e2e8f0']]) { ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
      for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.72, R * 0.07, 0, TAU); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const x = cx + Math.cos(a) * R * 0.22, y = cy + Math.sin(a) * R * 0.22; hq.glow(ctx, x, y, 22, 'rgba(56,189,248,A)', 0.6 + 0.4 * Math.sin(t * 6 + i)); ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fillStyle = '#e0f2fe'; ctx.fill(); }
      // Manguera.
      ctx.save(); ctx.translate(800, 720);
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.fillStyle = '#16a34a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 105, 0, TAU); ctx.fillStyle = '#052e16'; ctx.fill(); ctx.stroke();
      ctx.restore();
      hq.tag(ctx, 360, 990, 'CABLE', { size: 40, fill: '#ffffff' });
      hq.tag(ctx, 800, 990, 'MANGUERA', { size: 40, fill: '#86efac' });
      hq.tag(ctx, 540, 430, 'CASI DEL MISMO GROSOR', { size: 42, fill: '#fde047' });
      return;
    }
    // Una fibra de vidrio por dentro: pulsos de luz que viajan (tus datos).
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0f172a'], [1, '#020617']]); ctx.fillRect(0, 0, W, H);
    for (const y of [620, 760, 900]) {
      ctx.lineCap = 'round'; ctx.lineWidth = 70; ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.beginPath(); ctx.moveTo(-50, y); ctx.lineTo(W + 50, y); ctx.stroke();
      ctx.lineWidth = 20; ctx.strokeStyle = 'rgba(186,230,253,0.35)'; ctx.beginPath(); ctx.moveTo(-50, y); ctx.lineTo(W + 50, y); ctx.stroke();
      for (let i = 0; i < 5; i++) { const x = ((t * 700 + i * 260 + y) % (W + 200)) - 100; hq.glow(ctx, x, y, 60, 'rgba(56,189,248,A)', 0.9); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, 26, 8, 0, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = '#e2e8f0'; ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center';
    for (const [x, b] of [[200, '1'], [380, '0'], [560, '1'], [740, '1'], [920, '0']]) ctx.fillText(b, (x + t * 200) % W, 690);
    hq.tag(ctx, 540, 430, 'HILOS DE VIDRIO + LUZ', { size: 44, fill: '#7dd3fc' });
  },

  rotos(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Superficie y fondo: un barco arrastra el ancla y rompe el cable.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 560, [[0, '#7dd3fc'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 560);
    ctx.fillStyle = hq.vgrad(ctx, 0, 540, H, [[0, '#0ea5e9'], [1, '#082f49']]); ctx.fillRect(0, 540, W, H);
    const sx = 260 + 380 * clamp(local / o.s.dur);
    ship(ctx, sx, 520, 300, t);
    ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 545 + 8 * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
    ctx.fillStyle = hq.vgrad(ctx, 0, 980, H, [[0, '#d6b77a'], [1, '#8a6d3b']]); ctx.fillRect(0, 990, W, H);
    const cutT = cue(1) + 0.6, cut = local > cutT;
    const ax = sx - 40, ay = 960;
    chain(ctx, sx - 60, 560, ax, ay - 70);
    anchor(ctx, ax, ay, 90, 1.2);
    cable(ctx, -50, 990, 1130, 990, t, { broken: cut ? 30 + 30 * clamp((local - cutT) / 0.4) : 0, cutAt: (ax + 20) / 1180 });
    if (cut) { const k = clamp((local - cutT) / 0.6); for (let i = 0; i < 10; i++) { const a = -Math.PI * (i / 9); ctx.strokeStyle = `rgba(253,224,71,${1 - k})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax + 20, 990); ctx.lineTo(ax + 20 + Math.cos(a) * (30 + 80 * k), 990 + Math.sin(a) * (30 + 80 * k)); ctx.stroke(); } }
    // Contador de roturas.
    const n = Math.min(100, Math.round(100 * clamp(local / (cue(1) - 0.2))));
    hq.card(ctx, 680, 610, 330, 150, 'rgba(15,23,42,0.88)', 24);
    ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#cbd5e1'; ctx.fillText('ROTURAS AL AÑO', 845, 650);
    ctx.font = '900 68px Inter, sans-serif'; ctx.fillStyle = '#fde047'; ctx.fillText(`+${n}`, 845, 715);
    if (local > cue(1)) hq.tag(ctx, 540, 420, 'ANCLAS Y REDES DE PESCA', { size: 42, fill: '#fca5a5' });
  },

  desvio(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Mapa de la red: si se corta un cable, el paquete de datos toma otro camino.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0f172a'], [1, '#1e293b']]); ctx.fillRect(0, 0, W, H);
    const N = { A: [150, 760], B: [930, 700], C: [540, 480], D: [520, 1000], E: [330, 620], F: [760, 880] };
    const links = [['A', 'E'], ['E', 'C'], ['C', 'B'], ['A', 'D'], ['D', 'F'], ['F', 'B'], ['E', 'F'], ['A', 'F']];
    const cutK = local > cue(1) ? 1 : 0;
    for (const [a, b] of links) {
      const isCut = cutK && a === 'A' && b === 'F';
      ctx.lineWidth = 10; ctx.strokeStyle = isCut ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.55)'; if (isCut) ctx.setLineDash([16, 14]);
      ctx.beginPath(); ctx.moveTo(...N[a]); ctx.lineTo(...N[b]); ctx.stroke(); ctx.setLineDash([]);
      if (isCut) { const mx = (N[a][0] + N[b][0]) / 2, my = (N[a][1] + N[b][1]) / 2; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - 30, my - 30); ctx.lineTo(mx + 30, my + 30); ctx.moveTo(mx + 30, my - 30); ctx.lineTo(mx - 30, my + 30); ctx.stroke(); }
    }
    for (const [k, [x, y]] of Object.entries(N)) { hq.glow(ctx, x, y, 50, 'rgba(56,189,248,A)', 0.5); ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fillStyle = '#e0f2fe'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); void k; }
    // Paquete: A→F→B (antes) o A→E→C→B (después del corte).
    const path = cutK ? [N.A, N.E, N.C, N.B] : [N.A, N.F, N.B];
    const segs = path.length - 1, u = (t * 0.5) % 1, si = Math.min(segs - 1, Math.floor(u * segs)), lu = u * segs - si;
    const px = path[si][0] + (path[si + 1][0] - path[si][0]) * lu, py = path[si][1] + (path[si + 1][1] - path[si][1]) * lu;
    hq.glow(ctx, px, py, 50, 'rgba(250,204,21,A)', 1); ctx.beginPath(); ctx.arc(px, py, 16, 0, TAU); ctx.fillStyle = '#fef9c3'; ctx.fill();
    hq.tag(ctx, 150, 860, 'TÚ', { size: 34, fill: '#fde047' });
    hq.tag(ctx, 930, 800, 'VIDEO', { size: 34, fill: '#fde047' });
    hq.tag(ctx, 540, 405, cutK ? '¡OTRO CAMINO!' : 'CIENTOS DE CABLES', { size: 46, fill: cutK ? '#86efac' : '#7dd3fc' });
  },

  tonga(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Tonga, 2022: una isla con su único cable; un volcán submarino estalla y lo corta.
    const boomT = cue(0) + 2.6, boom = clamp((local - boomT) / 0.8), after = local > boomT;
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 640, [[0, after ? '#57534e' : '#fdba74'], [1, after ? '#a8a29e' : '#fef3c7']]); ctx.fillRect(0, 0, W, 640);
    ctx.fillStyle = hq.vgrad(ctx, 0, 620, H, [[0, '#0ea5e9'], [1, '#082f49']]); ctx.fillRect(0, 620, W, H);
    // Isla con palmeras y casitas.
    ctx.beginPath(); ctx.ellipse(270, 640, 240, 60, 0, Math.PI, TAU); ctx.fillStyle = '#fcd34d'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (const [x, h] of [[180, 150], [330, 120]]) { ctx.strokeStyle = '#78350f'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x, 600); ctx.quadraticCurveTo(x + 20, 600 - h / 2, x + 10, 600 - h); ctx.stroke(); ctx.fillStyle = '#16a34a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x + 10, 600 - h); ctx.rotate(-2.6 + k * 0.55 + 0.05 * Math.sin(t * 2 + k)); ctx.beginPath(); ctx.ellipse(45, 0, 50, 12, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); } }
    for (const x of [240, 400]) { hq.roundRectPath(ctx, x, 560, 60, 50, 6); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = after ? '#334155' : '#fde047'; ctx.fillRect(x + 20, 575, 20, 18); }
    // Volcán submarino (detrás del cable) y columna de ceniza.
    ctx.beginPath(); ctx.moveTo(560, 1130); ctx.quadraticCurveTo(700, 1000, 760, 900); ctx.lineTo(880, 900); ctx.quadraticCurveTo(940, 1000, 1100, 1130); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 900, 1130, [[0, '#57534e'], [1, '#292524']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (after) { hq.glow(ctx, 820, 900, 120, 'rgba(249,115,22,A)', 0.9); ctx.strokeStyle = 'rgba(253,186,116,0.8)'; ctx.lineWidth = 10; for (let i = 0; i < 3; i++) { const u2 = (t * 0.8 + i / 3) % 1; ctx.beginPath(); ctx.moveTo(800 + i * 20, 890); ctx.lineTo(790 + i * 25, 890 - u2 * 250); ctx.stroke(); } }
    // Cable que sale de la isla hacia el mar abierto.
    cable(ctx, 300, 690, 1130, 1010, t, { w: 26, broken: after ? 40 * boom + 10 : 0, cutAt: 0.62 });
    if (after) {
      hq.glow(ctx, 820, 700, 300 * boom + 60, 'rgba(249,115,22,A)', 0.8 * (1 - boom * 0.5));
      for (let i = 0; i < 8; i++) { const r = 60 + i * 30 * boom; ctx.fillStyle = `rgba(87,83,78,${0.85 - i * 0.07})`; ctx.beginPath(); ctx.arc(820 + 40 * Math.sin(i * 2 + t), 640 - i * 55 * boom, r * 0.6, 0, TAU); ctx.fill(); }
    }
    hq.tag(ctx, 280, 410, '2022 · TONGA', { size: 42, fill: '#ffffff' });
    if (local > cue(1)) {
      hq.card(ctx, 70, 820, 380, 170, 'rgba(15,23,42,0.9)', 26);
      ctx.font = '900 34px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fca5a5'; ctx.fillText('SIN INTERNET', 260, 865);
      ctx.font = '900 64px Inter, sans-serif'; ctx.fillStyle = '#fde047'; ctx.fillText('+1 MES', 260, 935);
    }
  },

  tiburon(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Fondo marino: un tiburón muerde el cable… y luego el cable aparece forrado.
    seabed(ctx, W, H, t, 1040);
    const armored = local > cue(1);
    cable(ctx, -50, 900, 1130, 900, t, { w: armored ? 48 : 36, armor: armored ? 1 : 0 });
    if (armored) { ctx.strokeStyle = 'rgba(146,64,14,0.6)'; ctx.lineWidth = 3; for (let x = -40; x < W; x += 26) { ctx.beginPath(); ctx.moveTo(x, 878); ctx.lineTo(x + 18, 922); ctx.stroke(); } }
    const approach = clamp(local / 1.2), bite = local > 0.8 ? 0.5 + 0.5 * Math.sin(t * 10) : 0;
    shark(ctx, 120 + 380 * approach, 820, 520, t, bite);
    if (local > 0.9 && local < cue(1)) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; ctx.beginPath(); ctx.moveTo(760 + Math.cos(a) * 50, 880 + Math.sin(a) * 50); ctx.lineTo(760 + Math.cos(a) * 90, 880 + Math.sin(a) * 90); ctx.stroke(); } }
    if (armored) { hq.tag(ctx, 540, 420, 'COMO UN CHALECO ANTIBALAS', { size: 42, fill: '#fde047' }); ctx.font = '900 70px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeText('¡CLANK!', 780, 640); ctx.fillStyle = '#fde047'; ctx.fillText('¡CLANK!', 780, 640); }
    else hq.tag(ctx, 540, 420, '¡MORDIDA!', { size: 50, fill: '#fca5a5' });
  },
};
