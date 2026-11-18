// Short 42: ¿y si desaparecieran todos los insectos?  (calidad alta: engine2d/hq.js)
// Gancho corto: ¿podríamos sobrevivir? (se responde casi al final). Sin palabras técnicas.
// Adiós a las frutas (nadie lleva el polen) → los pájaros sin comida para sus crías → el mundo lleno de hojas, animales
// muertos y caca → sí sobreviviríamos con trigo, arroz y maíz (los poliniza el viento), pero comeríamos casi solo eso →
// caso real: en Australia las vacas llenaron los campos de caca hasta que trajeron escarabajos de otros países.
import * as hq from '../../engine2d/hq.js';

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

function meadow(ctx, W, H, t, { sky = ['#7dd3fc', '#e0f2fe'], grass = ['#4ade80', '#15803d'], ground = 980 } = {}) {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, ground, [[0, sky[0]], [1, sky[1]]]); ctx.fillRect(0, 0, W, ground);
  for (const [x, y, s] of [[180, 470, 1], [820, 430, 0.8]]) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x + 20 * Math.sin(t * 0.2), y, 60 * s, 0, TAU); ctx.arc(x + 70 * s + 20 * Math.sin(t * 0.2), y - 20 * s, 70 * s, 0, TAU); ctx.arc(x + 140 * s + 20 * Math.sin(t * 0.2), y, 55 * s, 0, TAU); ctx.fill(); }
  ctx.fillStyle = hq.vgrad(ctx, 0, ground - 60, H, [[0, grass[0]], [1, grass[1]]]);
  ctx.beginPath(); ctx.moveTo(0, ground); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, ground - 20 * Math.sin(x * 0.008)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
}

function flower(ctx, x, y, s, color, t, wilt = 0) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#15803d'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, s * 2); ctx.quadraticCurveTo(s * 0.2 + wilt * s * 0.8, s, wilt * s * 0.9, wilt * s * 0.6); ctx.stroke();
  ctx.translate(wilt * s * 0.9, wilt * s * 0.6); ctx.rotate(wilt * 1.2 + 0.05 * Math.sin(t * 2 + x));
  ctx.fillStyle = wilt > 0.5 ? '#a8a29e' : color;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42, s * 0.36, s * 0.2, a, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, s * 0.24, 0, TAU); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function bee(ctx, x, y, s, t, dir = 1, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(dir, 1);
  const flap = Math.sin(t * 40);
  for (const k of [-1, 1]) { ctx.save(); ctx.rotate(-0.3 + 0.25 * flap * k); ctx.beginPath(); ctx.ellipse(-s * 0.05, -s * 0.45, s * 0.22, s * 0.32, k * 0.3, 0, TAU); ctx.fillStyle = 'rgba(224,242,254,0.85)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.33, 0, 0, TAU); ctx.fillStyle = '#facc15'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = INK; for (const bx of [-0.25, 0, 0.25]) ctx.fillRect(bx * s - s * 0.06, -s, s * 0.12, s * 2); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.33, 0, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.05, s * 0.22, 0, TAU); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.1, s * 0.06, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

function butterfly(ctx, x, y, s, t, color = '#f472b6', a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  const f = 0.35 + 0.65 * Math.abs(Math.sin(t * 8));
  for (const k of [-1, 1]) { ctx.save(); ctx.scale(k * f, 1); ctx.beginPath(); ctx.ellipse(s * 0.45, -s * 0.25, s * 0.45, s * 0.35, -0.4, 0, TAU); ctx.ellipse(s * 0.35, s * 0.3, s * 0.3, s * 0.25, 0.4, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.25, s * 0.1, 0, TAU); ctx.fill(); ctx.restore(); }
  hq.roundRectPath(ctx, -s * 0.07, -s * 0.5, s * 0.14, s * 1.0, s * 0.07); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

function ladybug(ctx, x, y, s, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(s * 0.45, 0, s * 0.25, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, s * 0.5); ctx.stroke();
  ctx.fillStyle = INK; for (const [dx, dy] of [[-0.25, -0.2], [0.22, -0.22], [-0.2, 0.22], [0.25, 0.2]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.09, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function bird(ctx, x, y, s, t, { color = '#3b82f6', open = 0, flap = 0, dir = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.beginPath(); ctx.moveTo(-s * 0.55, 0); ctx.lineTo(-s * 0.9, -s * 0.15); ctx.lineTo(-s * 0.85, s * 0.12); ctx.closePath(); ctx.fillStyle = hq.shade(color, -0.2); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.38, 0, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(s * 0.1, s * 0.12, s * 0.35, s * 0.2, 0, 0, TAU); ctx.fillStyle = '#fde68a'; ctx.fill();
  ctx.save(); ctx.translate(-s * 0.05, -s * 0.05); ctx.rotate(-0.4 - 0.8 * Math.abs(Math.sin(t * 12)) * flap); ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.05, s * 0.4, s * 0.18, 0, 0, TAU); ctx.fillStyle = hq.shade(color, -0.25); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.arc(s * 0.45, -s * 0.28, s * 0.3, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.7, -s * 0.33); ctx.lineTo(s * 1.0, -s * 0.28 - open * s * 0.12); ctx.lineTo(s * 0.72, -s * 0.22); ctx.closePath(); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.stroke();
  if (open > 0) { ctx.beginPath(); ctx.moveTo(s * 0.7, -s * 0.2); ctx.lineTo(s * 0.98, -s * 0.12 + open * s * 0.1); ctx.lineTo(s * 0.72, -s * 0.16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.36, s * 0.06, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

function dung(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  for (const [dy, r] of [[0, 1], [-0.32, 0.75], [-0.58, 0.48]]) { ctx.beginPath(); ctx.ellipse(0, dy * s, s * 0.55 * r, s * 0.22 * r, 0, 0, TAU); ctx.fillStyle = '#78350f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.4, s * 0.12, s * 0.05, -0.3, 0, TAU); ctx.fill();
  ctx.restore();
}

function cow(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  for (const lx of [-0.4, -0.2, 0.25, 0.42]) { hq.roundRectPath(ctx, lx * s - s * 0.06, s * 0.1, s * 0.12, s * 0.45, s * 0.04); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.stroke(); }
  hq.roundRectPath(ctx, -s * 0.6, -s * 0.3, s * 1.15, s * 0.55, s * 0.22); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.stroke();
  ctx.save(); hq.roundRectPath(ctx, -s * 0.6, -s * 0.3, s * 1.15, s * 0.55, s * 0.22); ctx.clip(); ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.ellipse(-s * 0.25, -s * 0.1, s * 0.2, s * 0.15, 0.4, 0, TAU); ctx.ellipse(s * 0.25, s * 0.05, s * 0.18, s * 0.14, -0.3, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(s * 0.62, -s * 0.25 + 4 * Math.sin(t * 2)); hq.roundRectPath(ctx, -s * 0.05, -s * 0.18, s * 0.34, s * 0.32, s * 0.12); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.stroke();
  hq.roundRectPath(ctx, s * 0.12, -s * 0.02, s * 0.2, s * 0.16, s * 0.07); ctx.fillStyle = '#fda4af'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.07, s * 0.03, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -s * 0.16); ctx.lineTo(-s * 0.05, -s * 0.28); ctx.moveTo(s * 0.14, -s * 0.17); ctx.lineTo(s * 0.16, -s * 0.29); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.2); ctx.quadraticCurveTo(-s * 0.8, 0 + 8 * Math.sin(t * 3), -s * 0.75, s * 0.15); ctx.stroke();
  ctx.restore();
}

function dungBeetle(ctx, x, y, s, t, ball = 1) {
  ctx.save(); ctx.translate(x, y);
  const roll = t * 3;
  ctx.save(); ctx.translate(s * 0.75, -s * 0.1); ctx.rotate(roll); ctx.beginPath(); ctx.arc(0, 0, s * 0.5 * ball, 0, TAU); ctx.fillStyle = '#78350f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(0, 0, s * 0.3 * ball, 0, 2); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 4; for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(k * s * 0.15, s * 0.05); ctx.lineTo(k * s * 0.3 + 6 * Math.sin(t * 12 + k), s * 0.35); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.38, s * 0.26, 0, 0, TAU); ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.15, s * 0.15, s * 0.06, -0.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.05, s * 0.15, 0, TAU); ctx.fillStyle = '#334155'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function poof(ctx, x, y, k) {
  if (k <= 0 || k >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 40 * k, y + Math.sin(a) * 40 * k, 14 * (1 - k) + 4, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Un prado lleno de insectos… que van desapareciendo uno por uno.
    meadow(ctx, W, H, t);
    const cols = ['#f472b6', '#facc15', '#a78bfa', '#fb923c', '#f87171', '#60a5fa'];
    for (let i = 0; i < 7; i++) flower(ctx, 90 + i * 150, 830 + (i % 3) * 40, 70, cols[i % 6], t);
    const gone = (i) => clamp((local - 1.0 - i * 0.35) / 0.4);
    const ins = [[250, 560, 'bee'], [560, 480, 'bf'], [850, 600, 'bee'], [400, 730, 'lb'], [720, 740, 'bf2'], [930, 460, 'bee'], [140, 720, 'bf']];
    ins.forEach(([x, y, k], i) => {
      const g = gone(i), a = 1 - g, xx = x + 30 * Math.sin(t * 1.5 + i), yy = y + 20 * Math.sin(t * 2 + i);
      if (k === 'bee') bee(ctx, xx, yy, 110, t + i, Math.cos(t * 1.5 + i) > 0 ? 1 : -1, a);
      else if (k === 'lb') ladybug(ctx, xx, yy, 90, a);
      else butterfly(ctx, xx, yy, 110, t + i, k === 'bf2' ? '#60a5fa' : '#f472b6', a);
      poof(ctx, xx, yy, g);
    });
    void cue;
  },

  frutas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // En el huerto: una abeja lleva polen de flor en flor; sin ella, las flores no dan manzanas.
    meadow(ctx, W, H, t, { ground: 1000 });
    ctx.fillStyle = '#78350f'; ctx.fillRect(500, 760, 70, 260); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeRect(500, 760, 70, 260);
    ctx.beginPath(); ctx.arc(535, 600, 280, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, 320, 880, [[0, '#4ade80'], [1, '#15803d']]); ctx.fill(); ctx.stroke();
    const noBees = local > cue(1) + 0.3, k = clamp((local - cue(1) - 0.3) / 1.0);
    const spots = [[400, 520], [520, 440], [660, 520], [460, 660], [620, 680], [740, 600], [330, 620]];
    spots.forEach(([x, y], i) => {
      if (!noBees || k < 0.5) flower(ctx, x, y, 30, '#fbcfe8', t, noBees ? k : 0);
      const ripe = noBees ? 0 : clamp((local - i * 0.25) / 0.8);
      if (ripe > 0) { ctx.beginPath(); ctx.arc(x + 20, y + 40, 26 * ripe, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    });
    if (!noBees) {
      const u = (t * 0.5) % 1, i0 = Math.floor((t * 0.5) % spots.length), a = spots[i0], b = spots[(i0 + 1) % spots.length];
      const bx = a[0] + (b[0] - a[0]) * u, by = a[1] + (b[1] - a[1]) * u - 60 * Math.sin(u * Math.PI);
      for (let j = 1; j < 6; j++) { ctx.fillStyle = 'rgba(250,204,21,0.8)'; ctx.beginPath(); ctx.arc(bx - (b[0] - a[0]) * 0.03 * j, by + 8 * j, 6, 0, TAU); ctx.fill(); }
      bee(ctx, bx, by, 100, t, b[0] > a[0] ? 1 : -1);
      hq.tag(ctx, 540, 410, 'LLEVAN EL POLEN', { size: 42, fill: '#fde047' });
    } else hq.tag(ctx, 540, 410, 'SIN INSECTOS: SIN FRUTA', { size: 42, fill: '#fca5a5' });
  },

  aves: function (ctx, o) {
    const { W, H, local, cue, t } = o;
    // En un nido: los pollitos piden comida; la mamá llega sin nada.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#bae6fd'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 50; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-40, 920); ctx.quadraticCurveTo(500, 860, 1120, 760); ctx.stroke();
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(150 + i * 170, 860 - i * 18); ctx.rotate(-0.5 + (i % 2)); ctx.beginPath(); ctx.ellipse(0, -60, 40, 80, 0, 0, TAU); ctx.fillStyle = '#16a34a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    // Nido con pollitos.
    ctx.beginPath(); ctx.ellipse(540, 850, 200, 80, 0, 0, Math.PI); ctx.fillStyle = '#a16207'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const sad = local > cue(1);
    for (let i = 0; i < 3; i++) {
      const x = 440 + i * 100, open = sad ? 0.2 : 0.6 + 0.4 * Math.abs(Math.sin(t * 8 + i));
      ctx.save(); ctx.translate(x, 820); ctx.rotate(-Math.PI / 2 + 0.2 * (i - 1));
      bird(ctx, 0, 0, 80, t, { color: '#fde68a', open });
      ctx.restore();
    }
    ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 6; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(360 + i * 28, 850 + 10 * Math.sin(i)); ctx.lineTo(380 + i * 28, 880 + 10 * Math.cos(i)); ctx.stroke(); }
    // Mamá que llega volando.
    const u = clamp(local / 1.6);
    bird(ctx, 1000 - 260 * u, 520 + 80 * u, 140, t, { color: '#3b82f6', flap: 1 - 0.5 * u, dir: -1 });
    if (!sad) { ctx.save(); ctx.translate(1000 - 260 * u - 150, 520 + 80 * u - 40); ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, 15 + 8 * Math.sin(t * 10), -40, 0); ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 540, 410, sad ? 'SIN COMIDA PARA SUS CRÍAS' : 'COMEN INSECTOS', { size: 40, fill: sad ? '#fca5a5' : '#ffffff' });
  },

  basura(ctx, o) {
    const { W, H, local, cue, t } = o;
    // En el bosque: hojas, un tronco caído y caca que se amontonan porque nadie se los come.
    meadow(ctx, W, H, t, { sky: ['#a8a29e', '#e7e5e4'], grass: ['#65a30d', '#3f6212'], ground: 900 });
    const pile = clamp(local / (o.s.dur - 0.3));
    for (let i = 0; i < Math.floor(10 + 60 * pile); i++) { const x = (i * 97) % W, y = 910 + ((i * 53) % 150) - pile * 60; ctx.save(); ctx.translate(x, y); ctx.rotate(i); ctx.beginPath(); ctx.ellipse(0, 0, 30, 14, 0, 0, TAU); ctx.fillStyle = ['#d97706', '#b45309', '#a16207', '#92400e'][i % 4]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    hq.roundRectPath(ctx, 120, 820, 420, 90, 40); ctx.fillStyle = '#78350f'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(540, 865, 26, 44, 0, 0, TAU); ctx.fillStyle = '#a16207'; ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) dung(ctx, 640 + i * 110, 900 - pile * 20, 70 + 40 * pile);
    if (local > cue(1)) { ctx.save(); ctx.translate(860, 610); hq.roundRectPath(ctx, -110, -60, 220, 120, 20); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ladybug(ctx, -40, 0, 50); bee(ctx, 40, 0, 50, t); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-90, -45); ctx.lineTo(90, 45); ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 540, 410, local > cue(1) ? 'NADIE SE LA COME' : 'SE AMONTONA TODO', { size: 42, fill: '#fde68a' });
  },

  comida(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Campo de trigo y maíz movido por el viento (el viento lleva su polen); en el plato, solo granos.
    meadow(ctx, W, H, t, { sky: ['#fde68a', '#fef9c3'], grass: ['#ca8a04', '#a16207'], ground: 1000 });
    for (let i = 0; i < 18; i++) { const x = 40 + i * 58, sw = 14 * Math.sin(t * 2 + i * 0.4); ctx.strokeStyle = '#a16207'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, 1000); ctx.quadraticCurveTo(x + sw * 0.5, 880, x + sw, 760); ctx.stroke(); ctx.fillStyle = '#facc15'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x + sw + (k % 2 ? 8 : -8), 760 - k * 16, 9, 14, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); } }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const x = ((t * 400 + i * 220) % (W + 300)) - 150, y = 520 + i * 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 60, y - 20, x + 140, y); ctx.stroke(); }
    if (local > cue(1)) {
      hq.card(ctx, 290, 560, 500, 260, '#ffffff', 130);
      ctx.beginPath(); ctx.ellipse(540, 690, 200, 90, 0, 0, TAU); ctx.fillStyle = '#f1f5f9'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      for (let i = 0; i < 30; i++) { ctx.fillStyle = '#fefce8'; ctx.beginPath(); ctx.ellipse(470 + (i % 10) * 14, 680 + Math.floor(i / 10) * 14, 8, 5, i, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(640, 690, 50, 28, 0, 0, TAU); ctx.fillStyle = '#fde68a'; ctx.fill(); ctx.stroke();
      hq.roundRectPath(ctx, 400, 650, 60, 80, 20); ctx.fillStyle = '#d97706'; ctx.fill(); ctx.stroke();
      hq.tag(ctx, 540, 410, 'CASI SOLO GRANOS', { size: 44, fill: '#fde047' });
    } else hq.tag(ctx, 540, 410, 'EL VIENTO LLEVA SU POLEN', { size: 40, fill: '#ffffff' });
  },

  australia(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Australia: campo rojo, eucaliptos y vacas; la caca se amontona… hasta que llegan los escarabajos.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 900, [[0, '#fdba74'], [1, '#fef3c7']]); ctx.fillRect(0, 0, W, 900);
    ctx.fillStyle = hq.vgrad(ctx, 0, 880, H, [[0, '#c2410c'], [1, '#7c2d12']]); ctx.fillRect(0, 880, W, H);
    for (const [x, h] of [[120, 300], [930, 260]]) { ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x, 900); ctx.quadraticCurveTo(x + 20, 900 - h / 2, x - 10, 900 - h); ctx.stroke(); ctx.fillStyle = '#4d7c0f'; ctx.beginPath(); ctx.arc(x - 40, 900 - h, 70, 0, TAU); ctx.arc(x + 40, 900 - h + 10, 60, 0, TAU); ctx.fill(); }
    // Canguro de fondo (para que se entienda dónde estamos).
    ctx.save(); ctx.translate(820, 830 - 30 * Math.abs(Math.sin(t * 3))); ctx.fillStyle = '#9a3412'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 55, -0.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(25, -60, 20, 26, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(30, -82); ctx.lineTo(28, -112); ctx.lineTo(40, -84); ctx.fill(); ctx.beginPath(); ctx.moveTo(-30, 30); ctx.quadraticCurveTo(-90, 50, -100, 10); ctx.lineWidth = 14; ctx.strokeStyle = '#9a3412'; ctx.stroke(); ctx.restore();
    cow(ctx, 330, 860, 260, t);
    const fix = clamp((local - cue(1) - 0.3) / 1.6);
    for (let i = 0; i < 6; i++) { const x = 100 + i * 170, y = 960 + (i % 2) * 40; const s = 80 * (1 - fix * (i % 3 === 0 ? 1 : 0.9)); if (s > 5) dung(ctx, x, y, s); }
    if (local > cue(1)) for (let i = 0; i < 3; i++) dungBeetle(ctx, 140 + i * 300 + 60 * Math.sin(t + i), 1030, 95, t + i, 0.6 + 0.4 * fix);
    hq.tag(ctx, 250, 410, 'AUSTRALIA', { size: 42, fill: '#ffffff' });
    if (local > cue(1)) hq.tag(ctx, 690, 410, 'ESCARABAJOS AL RESCATE', { size: 36, fill: '#fde047' });
    void W;
  },
};
