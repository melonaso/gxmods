// Short 66: ¿y si el mar fuera transparente?  (SERIE EL AGUA · 12)
// Gancho: el mar se vuelve de vidrio → desde la playa el fondo baja hasta ~11 km (fosa de las Marianas) → montañas
// gigantes: un volcán de Hawái mide ~10.2 km desde el fondo (más que el Everest, 8.85 km) → el Titanic a ~3.8 km →
// la cordillera más larga del mundo está bajo el mar: ~65,000 km (NOAA), más de 1.5 vueltas a la Tierra (40,075 km).
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, sunDisc, cloud, fish, space, HERO } from '../../engine2d/props.js';
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

/** Agua de vidrio: muy clara arriba y azul oscura en lo profundo, con brillos. */
function glassWater(ctx, W, y0, y1, t, a = 0.35) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = hq.vgrad(ctx, 0, y0, y1, [[0, '#bae6fd'], [1, '#1e3a8a']]); ctx.fillRect(0, y0, W, y1 - y0); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y0 + 6 * Math.sin(x * 0.02 + t * 2)); ctx.stroke();
}

function seabed(ctx, pts, H, colors = ['#a8a29e', '#44403c']) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], H); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[pts.length - 1][0], H); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, Math.min(...pts.map((p) => p[1])), H, [[0, colors[0]], [1, colors[1]]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}

function boat(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-110, -20); ctx.lineTo(110, -20); ctx.lineTo(80, 28); ctx.lineTo(-80, 28); ctx.closePath(); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

function titanic(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a; ctx.rotate(0.06);
  ctx.beginPath(); ctx.moveTo(-260, -40); ctx.lineTo(240, -40); ctx.lineTo(270, -10); ctx.lineTo(240, 30); ctx.lineTo(-240, 30); ctx.closePath();
  ctx.fillStyle = '#334155'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#78350f'; ctx.fillRect(-250, -40, 480, 14);
  for (const fx of [-130, -40, 50, 140]) { ctx.beginPath(); ctx.moveTo(fx - 18, -40); ctx.lineTo(fx - 12, -110); ctx.lineTo(fx + 12, -110); ctx.lineTo(fx + 18, -40); ctx.closePath(); ctx.fillStyle = fx === 140 ? '#475569' : '#a16207'; ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = 'rgba(148,163,184,0.6)'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-220 + i * 38, -2, 6, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Dorsal oceánica (aprox.): Atlántico → Índico → Pacífico.
const RIDGE = [[-18, 70], [-28, 60], [-32, 50], [-30, 40], [-40, 30], [-45, 20], [-40, 10], [-25, 2], [-14, -8], [-13, -20], [-14, -35], [-15, -48], [0, -54], [20, -53], [35, -48], [55, -38], [62, -28], [68, -15], [65, -2], [58, 10], [48, 13],
  [68, -15], [75, -30], [88, -40], [110, -48], [130, -50], [150, -58], [175, -62], [-150, -62], [-120, -55], [-110, -40], [-105, -20], [-105, 0], [-108, 15], [-110, 23]];

function ridgeLine(c, lon0, lat0, R, k) {
  // Subdivide y dibuja solo lo visible, hasta la fracción k del recorrido.
  const pts = [];
  for (let i = 0; i < RIDGE.length - 1; i++) { const [a0, b0] = RIDGE[i], [a1, b1] = RIDGE[i + 1]; let da = a1 - a0; if (da > 180) da -= 360; if (da < -180) da += 360; for (let j = 0; j < 8; j++) pts.push([a0 + (da * j) / 8, b0 + ((b1 - b0) * j) / 8]); }
  const n = Math.floor(pts.length * k);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [w, col] of [[16, INK], [9, '#facc15']]) {
    c.lineWidth = w; c.strokeStyle = col; c.beginPath(); let pen = false;
    for (let i = 0; i < n; i++) { const [x, y, v] = project(pts[i][0], pts[i][1], lon0, lat0, R); if (v) { pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true; } else pen = false; }
    c.stroke();
  }
  c.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Playa: el agua se vuelve transparente y deja ver el fondo que se hunde en la oscuridad.
    const c1 = cue(1), clear = ease((local - 0.3) / 1.2);
    sky(ctx, W, 0, 900, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 880, 540, 52, t);
    // Fondo marino visible (baja de la orilla hacia lo hondo).
    ctx.fillStyle = hq.vgrad(ctx, 0, 900, H, [[0, '#0c4a6e'], [1, '#020617']]); ctx.fillRect(0, 900, W, H - 900);
    seabed(ctx, [[0, 1180], [260, 1200], [500, 1320], [700, 1600], [900, 1900], [W, 1920]], H, ['#fde68a', '#78350f']);
    for (let i = 0; i < 3; i++) fish(ctx, ((i * 360 + t * 70) % 1300) - 110, 1080 + i * 120, 0.7, ['#facc15', '#fb923c', '#f472b6'][i], { t, seed: i });
    // Agua: opaca al inicio y luego de vidrio.
    ctx.save(); ctx.globalAlpha = 1 - clear * 0.75; ctx.fillStyle = hq.vgrad(ctx, 0, 900, H, [[0, '#0ea5e9'], [1, '#075985']]); ctx.fillRect(0, 900, W, H - 900); ctx.restore();
    glassWater(ctx, W, 900, H, t, 0.15);
    // Arena de la orilla y el protagonista.
    ctx.beginPath(); ctx.moveTo(0, 860); ctx.lineTo(300, 860); ctx.quadraticCurveTo(340, 900, 300, 920); ctx.lineTo(0, 940); ctx.closePath(); ctx.fillStyle = '#fde68a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.toon(ctx, 170, 870, 280, { ...HERO, t, seed: 1, armL: [0.3, 0.2], armR: [0.3, 0.2], eyes: 'open', mouth: local > c1 ? 'o' : 'smile', brows: local > c1 ? 1 : 0, look: [1, 1] });
    if (local > c1) hq.bubble(ctx, 600, 620, 320, 96, 260, 640, '¿Y SI ME CAIGO?', { size: 42 });
  },

  fondo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte: la pendiente baja hasta 11 km; regla de profundidad; el protagonista diminuto en la superficie.
    const c1 = cue(1), k = ease((local - 0.2) / Math.max(1.5, c1 + 1));
    sky(ctx, W, 0, 560, '#7dd3fc', '#f0f9ff');
    ctx.fillStyle = hq.vgrad(ctx, 0, 560, H, [[0, '#7dd3fc'], [0.5, '#1e40af'], [1, '#0b1440']]); ctx.fillRect(0, 560, W, H - 560);
    seabed(ctx, [[0, 590], [140, 600], [260, 760], [420, 900], [560, 1080], [700, 1500], [760, 1780], [820, 1800], [880, 1500], [960, 1300], [W, 1260]], H);
    glassWater(ctx, W, 560, H, t, 0.1);
    hq.toon(ctx, 330, 566, 70, { ...HERO, t, seed: 2, armL: [1.2, -0.5], armR: [1.2, -0.5] });
    // Regla.
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1020, 570); ctx.lineTo(1020, lerp(570, 1790, k)); ctx.stroke();
    for (let i = 0; i <= 11; i++) { const y = 570 + (i / 11) * 1220; if (y > lerp(570, 1790, k)) break; ctx.beginPath(); ctx.moveTo(1000, y); ctx.lineTo(1040, y); ctx.stroke(); }
    ctx.restore();
    if (local > c1 - 0.2) kit.text(ctx, '11 KM', 900, 1700, { size: 60, fill: '#fde68a' });
    hq.tag(ctx, 540, 410, local < c1 ? 'EL FONDO SE HUNDE…' : 'HASTA CASI 11 KM', { size: 48, fill: '#bae6fd' });
  },

  montanas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Everest (en tierra) contra el volcán de Hawái medido desde el fondo del mar. Escala: 1 km = 60 px.
    const c1 = cue(1), sea0 = 900, km = 42, k = ease((local - 0.2) / 1.2);
    sky(ctx, W, 0, sea0, '#7dd3fc', '#f0f9ff');
    ctx.fillStyle = hq.vgrad(ctx, 0, sea0, H, [[0, '#7dd3fc'], [1, '#1e3a8a']]); ctx.fillRect(0, sea0, W, H - sea0);
    // Everest: 8.85 km sobre el nivel del mar.
    const ex = 270, eh = 8.85 * km * k;
    ctx.beginPath(); ctx.moveTo(40, sea0); ctx.lineTo(ex - 40, sea0 - eh * 0.85); ctx.lineTo(ex, sea0 - eh); ctx.lineTo(ex + 50, sea0 - eh * 0.8); ctx.lineTo(500, sea0); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, sea0 - eh, sea0, [[0, '#a8a29e'], [1, '#57534e']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 40, sea0 - eh * 0.85); ctx.lineTo(ex, sea0 - eh); ctx.lineTo(ex + 50, sea0 - eh * 0.8); ctx.lineTo(ex + 20, sea0 - eh * 0.78); ctx.lineTo(ex - 10, sea0 - eh * 0.82); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    // Volcán de Hawái: 10.2 km desde el fondo (6 km bajo el agua + 4.2 km arriba). Escala: 1 km = 50 px.
    const vx = 790, base = sea0 + 6 * km, vh = 10.2 * km * k, vtop = base - vh;
    ctx.beginPath(); ctx.moveTo(530, base); ctx.quadraticCurveTo(vx - 60, vtop + 80, vx - 40, vtop); ctx.lineTo(vx + 40, vtop); ctx.quadraticCurveTo(vx + 60, vtop + 80, 1060, base); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, vtop, base, [[0, '#78716c'], [1, '#292524']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#44403c'; ctx.fillRect(0, base, W, H - base);
    glassWater(ctx, W, sea0, H, t, 0.35);
    if (local > c1 - 0.2) {
      ctx.save(); ctx.setLineDash([14, 10]); ctx.lineWidth = 6; ctx.strokeStyle = '#fde047';
      ctx.beginPath(); ctx.moveTo(ex - 150, sea0); ctx.lineTo(ex - 150, sea0 - eh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vx + 200, base); ctx.lineTo(vx + 200, vtop); ctx.stroke(); ctx.restore();
      kit.text(ctx, '8.8 KM', ex - 150, sea0 - eh - 40, { size: 40, fill: '#ffffff' });
      kit.text(ctx, '10.2 KM', vx + 160, vtop - 40, { size: 40, fill: '#fde047' });
      kit.text(ctx, 'EVEREST', ex, sea0 + 50, { size: 34, fill: '#ffffff' });
      kit.text(ctx, 'VOLCÁN DE HAWÁI', vx, sea0 + 70, { size: 32, fill: '#ffffff' });
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'MONTAÑAS BAJO EL AGUA' : 'MÁS ALTO QUE EL EVEREST', { size: 46, fill: '#fde68a' });
  },

  titanic(ctx, o) {
    const { W, H, local, t } = o;
    // Desde un bote se ve, muy abajo, el Titanic sobre el fondo.
    const k = ease(local / 1.2);
    sky(ctx, W, 0, 760, '#7dd3fc', '#f0f9ff');
    ctx.fillStyle = hq.vgrad(ctx, 0, 760, H, [[0, '#7dd3fc'], [0.6, '#1d4ed8'], [1, '#0b1440']]); ctx.fillRect(0, 760, W, H - 760);
    seabed(ctx, [[0, 1500], [400, 1470], [800, 1510], [W, 1480]], H, ['#57534e', '#1c1917']);
    titanic(ctx, 540, 1440, 1.4, 0.3 + 0.7 * k);
    glassWater(ctx, W, 760, H, t, 0.15);
    boat(ctx, 540, 760, 1.1);
    hq.toon(ctx, 540, 742, 220, { ...HERO, t, seed: 3, armL: [1.2, -0.8], armR: [1.2, -0.8], eyes: 'open', mouth: 'o', brows: 1, look: [0, 1] });
    ctx.save(); ctx.setLineDash([14, 10]); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(900, 790); ctx.lineTo(900, 1430); ctx.stroke(); ctx.restore();
    kit.text(ctx, '≈ 3.8 KM', 900, 1000, { size: 50, fill: '#fde68a' });
    hq.tag(ctx, 540, 410, 'EL TITANIC, A LA VISTA', { size: 48, fill: '#ffffff' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    space(ctx, W, H, t);
    if (local < c1) {
      // La Tierra con la cordillera submarina (dorsal) que se va dibujando.
      const lon0 = -30 + t * 14, k = ease((local - 0.2) / Math.max(1.5, c1 - 0.3));
      drawGlobe(ctx, 540, 880, 400, { lon0, lat0: -10, extra: (c, r) => ridgeLine(c, lon0, -10, r, k) });
      hq.tag(ctx, 540, 410, 'LA CORDILLERA MÁS LARGA', { size: 46, fill: '#fde68a' });
    } else {
      // Comparación: vuelta a la Tierra (40,075 km) vs. cordillera (65,000 km).
      const k = ease((local - c1) / 1.0), x0 = 120, L = 520;
      kit.text(ctx, 'VUELTA A LA TIERRA', x0, 720, { size: 38, fill: '#bae6fd', align: 'left' });
      hq.roundRectPath(ctx, x0, 750, L * k, 60, 14); ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      kit.text(ctx, '40,000 KM', x0 + L * k + 20, 780, { size: 34, fill: '#ffffff', align: 'left' });
      kit.text(ctx, 'CORDILLERA BAJO EL MAR', x0, 900, { size: 38, fill: '#fde68a', align: 'left' });
      hq.roundRectPath(ctx, x0, 930, L * 1.62 * k, 60, 14); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      kit.text(ctx, '65,000 KM', x0 + 20, 1050, { size: 40, fill: '#ffffff', align: 'left' });
      hq.tag(ctx, 540, 410, '¡MÁS DE 1.5 VUELTAS!', { size: 50, fill: '#fde68a' });
    }
  },
};
