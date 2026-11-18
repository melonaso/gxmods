// Short 43: ¿y si se derritiera todo el hielo del planeta?  (calidad alta: engine2d/hq.js)
// Gancho corto: ¿tu ciudad quedaría bajo el agua? (se responde casi al final). Sin palabras técnicas.
// Sorpresa del vaso: el hielo que flota no sube el agua; el que sube el mar está sobre tierra (Antártida, Groenlandia)
// → el mar subiría ~70 m (más de 20 pisos) → adiós Venecia, Ámsterdam, Florida y casi todas las playas →
// la Ciudad de México se salva (más de 2 km de altura); Buenos Aires, Guayaquil o Cancún no →
// sorpresa: bajo el hielo de la Antártida hay cientos de lagos escondidos; uno lleva millones de años sin luz.
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

function waves(ctx, W, y, t, color = 'rgba(224,242,254,0.85)') {
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.beginPath();
  for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y + 8 * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
}

function sea(ctx, W, H, y, t) {
  ctx.fillStyle = hq.vgrad(ctx, 0, y, H, [[0, 'rgba(14,165,233,0.92)'], [1, 'rgba(8,47,73,0.95)']]);
  ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y + 8 * Math.sin(x * 0.03 + t * 3)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  waves(ctx, W, y, t);
}

function iceCube(ctx, x, y, s, rot, melt = 0) {
  const k = 1 - 0.6 * melt;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  hq.roundRectPath(ctx, -s / 2, -s / 2, s, s, s * 0.18); ctx.fillStyle = 'rgba(224,242,254,0.92)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; hq.roundRectPath(ctx, -s * 0.32, -s * 0.32, s * 0.25, s * 0.12, 6); ctx.fill();
  ctx.restore();
}

function building(ctx, x, base, w, floors, color, t) {
  const fh = 26, h = floors * fh;
  hq.roundRectPath(ctx, x, base - h, w, h, 6); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (let f = 0; f < floors; f++) for (let c = 0; c < Math.floor(w / 30); c++) { ctx.fillStyle = (f * 7 + c * 3) % 5 ? '#fde68a' : '#334155'; ctx.fillRect(x + 10 + c * 30, base - h + 8 + f * fh, 16, 14); }
  void t;
}

function city(ctx, base, t, { tint = '#64748b' } = {}) {
  const R = (i) => Math.sin(i * 91.3) * 0.5 + 0.5;
  for (let i = 0; i < 9; i++) building(ctx, 20 + i * 118, base, 100, 4 + Math.floor(R(i) * 12), hq.shade(tint, -0.1 + R(i + 3) * 0.3), t);
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Un glaciar enorme que se resquebraja y se derrumba en el mar.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 900, [[0, '#7dd3fc'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 900);
    const crack = clamp((local - 0.3) / 2.5), fall = clamp((local - 2.6) / 1.2);
    // Glaciar (bloques).
    ctx.save();
    for (const [x, w, h, d] of [[0, 380, 430, 0], [370, 260, 390, 1], [620, 470, 450, 0]]) {
      const dy = d ? fall * 260 : 0, rot = d ? fall * 0.25 : 0;
      ctx.save(); ctx.translate(x + w / 2, 900 + dy); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 + 20, -h); ctx.lineTo(w / 2 - 30, -h + 40); ctx.lineTo(w / 2, 0); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, -h, 0, [[0, '#ffffff'], [1, '#93c5fd']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = 'rgba(59,130,246,0.5)'; ctx.lineWidth = 4; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 10, -k * h / 5); ctx.lineTo(w / 2 - 10, -k * h / 5 + 10); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
    if (crack > 0) { ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(500, 520); for (let k = 1; k <= 8; k++) ctx.lineTo(500 + (k % 2 ? 26 : -20), 520 + k * 47 * crack); ctx.stroke(); }
    sea(ctx, W, H, 900, t);
    if (fall > 0) for (let i = 0; i < 12; i++) { const a = -Math.PI * (i / 11), d = 60 + 160 * fall; ctx.fillStyle = `rgba(224,242,254,${1 - fall})`; ctx.beginPath(); ctx.arc(500 + Math.cos(a) * d, 900 + Math.sin(a) * d * 0.7, 14, 0, TAU); ctx.fill(); }
  },

  vaso(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Prueba del vaso: el hielo que flota se derrite y la marca del agua NO sube. Luego, el hielo sobre tierra.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#f0f9ff'], [1, '#bae6fd']]); ctx.fillRect(0, 0, W, H);
    if (local < cue(1)) {
      ctx.fillStyle = hq.vgrad(ctx, 0, 980, H, [[0, '#a16207'], [1, '#78350f']]); ctx.fillRect(0, 980, W, H);
      const melt = clamp((local - 0.5) / Math.max(1, cue(1) - 0.8)), lvl = 720;
      const gx = 540, top = 480, bot = 980, wTop = 360, wBot = 280;
      ctx.save(); ctx.beginPath(); ctx.moveTo(gx - wTop / 2, top); ctx.lineTo(gx + wTop / 2, top); ctx.lineTo(gx + wBot / 2, bot); ctx.lineTo(gx - wBot / 2, bot); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(56,189,248,0.55)'; ctx.fillRect(0, lvl, W, 400); waves(ctx, W, lvl, t * 0.4, 'rgba(255,255,255,0.7)');
      for (const [x, y, r] of [[480, lvl - 10, 0.3], [580, lvl + 5, -0.4], [530, lvl + 40, 0.1]]) iceCube(ctx, x, y, 100, r, melt);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(gx - wTop / 2, top); ctx.lineTo(gx - wBot / 2, bot); ctx.lineTo(gx + wBot / 2, bot); ctx.lineTo(gx + wTop / 2, top); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6; ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.moveTo(gx - wTop / 2 - 30, lvl); ctx.lineTo(gx + wTop / 2 + 30, lvl); ctx.stroke(); ctx.setLineDash([]);
      hq.tag(ctx, 540, 410, melt > 0.8 ? 'EL AGUA NO SUBIÓ' : 'HIELO QUE FLOTA', { size: 44, fill: melt > 0.8 ? '#86efac' : '#ffffff' });
      return;
    }
    // El globo con el hielo sobre tierra (Groenlandia arriba, Antártida abajo).
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#020617'], [1, '#0f172a']]); ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 1100, t, { n: 24, seed: 3, color: 'rgba(255,255,255,A)', r: [2, 5], a: 0.9 });
    drawGlobe(ctx, 540, 740, 330, { lon0: -40 + t * 5, lat0: 25 });
    ctx.save(); ctx.beginPath(); ctx.arc(540, 740, 330, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(540, 1060, 300, 90, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(470, 470, 90, 60, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
    hq.glow(ctx, 540, 1040, 200, 'rgba(255,255,255,A)', 0.5); hq.glow(ctx, 470, 470, 120, 'rgba(255,255,255,A)', 0.5);
    hq.tag(ctx, 470, 400, 'GROENLANDIA', { size: 34, fill: '#bae6fd' });
    hq.tag(ctx, 830, 1010, 'ANTÁRTIDA', { size: 36, fill: '#bae6fd' });
  },

  subida(ctx, o) {
    const { W, H, local, t } = o;
    // Un edificio de 22 pisos junto al mar; el agua sube hasta su azotea.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#7dd3fc'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, H);
    const base = 1090, floors = 22, fh = 26;
    building(ctx, 400, base, 280, floors, '#94a3b8', t);
    const top = base - floors * fh;
    const u = clamp((local - 0.3) / (o.s.dur - 0.8)), lvl = base - (base - top) * u;
    sea(ctx, W, H, lvl, t);
    // Regla con metros.
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(800, base); ctx.lineTo(800, top); ctx.stroke();
    for (let m = 0; m <= 70; m += 10) { const y = base - (base - top) * (m / 70); ctx.beginPath(); ctx.moveTo(790, y); ctx.lineTo(830, y); ctx.stroke(); ctx.font = '900 28px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(`${m} m`, 840, y); }
    hq.tag(ctx, 540, 405, u > 0.95 ? '¡MÁS DE 20 PISOS!' : '+70 METROS', { size: 46, fill: '#fde047' });
  },

  ciudades(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Ciudades costeras y playas que el mar se traga (Venecia con su góndola, una playa con sombrilla).
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#fdba74'], [1, '#fef3c7']]); ctx.fillRect(0, 0, W, H);
    const u = clamp((local - 0.2) / (o.s.dur - 0.6));
    if (local < cue(1)) {
      city(ctx, 1000, t, { tint: '#fca5a5' });
      // Campanario (Venecia).
      hq.roundRectPath(ctx, 860, 560, 90, 440, 10); ctx.fillStyle = '#b91c1c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(850, 560); ctx.lineTo(905, 470); ctx.lineTo(960, 560); ctx.closePath(); ctx.fillStyle = '#16a34a'; ctx.fill(); ctx.stroke();
      sea(ctx, W, H, 1000 - 380 * u, t);
      ctx.save(); ctx.translate(300 + 40 * Math.sin(t), 1000 - 380 * u); ctx.beginPath(); ctx.moveTo(-100, 0); ctx.quadraticCurveTo(0, 30, 100, 0); ctx.lineTo(120, -30); ctx.lineTo(-120, -30); ctx.closePath(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
      hq.tag(ctx, 540, 410, 'VENECIA · ÁMSTERDAM · FLORIDA', { size: 34, fill: '#ffffff' });
    } else {
      // Playa con sombrilla que desaparece.
      ctx.fillStyle = '#fde68a'; ctx.fillRect(0, 900, W, H);
      ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(600, 960); ctx.lineTo(560, 720); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(380, 760); ctx.quadraticCurveTo(560, 600, 740, 680); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      const k = clamp((local - cue(1)) / 1.2);
      sea(ctx, W, H, 900 - 300 * k, t);
      hq.tag(ctx, 540, 410, 'ADIÓS PLAYAS', { size: 46, fill: '#ffffff' });
    }
  },

  altas(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte de la Tierra: la Ciudad de México arriba de una meseta alta; Buenos Aires, Guayaquil y Cancún al nivel del mar.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#bae6fd'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, H);
    const seaY = 900 - 90 * clamp((local - cue(1)) / 0.8);
    ctx.beginPath(); ctx.moveTo(0, 940); ctx.lineTo(260, 930); ctx.lineTo(420, 560); ctx.lineTo(760, 540); ctx.lineTo(880, 930); ctx.lineTo(W, 940); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 540, H, [[0, '#a3e635'], [0.4, '#65a30d'], [1, '#713f12']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 0; i < 5; i++) building(ctx, 460 + i * 56, 555, 46, 3 + (i % 3) * 2, '#cbd5e1', t);
    hq.tag(ctx, 590, 410, 'CDMX · MÁS DE 2 KM DE ALTURA', { size: 32, fill: '#86efac' });
    for (const [x, name] of [[80, 'BUENOS AIRES'], [960, 'CANCÚN']]) { for (let i = 0; i < 3; i++) building(ctx, x - 60 + i * 44, 930, 38, 2 + i, '#94a3b8', t); }
    sea(ctx, W, H, seaY, t);
    if (local > cue(1)) { hq.tag(ctx, 200, 760, 'BUENOS AIRES', { size: 28, fill: '#fca5a5' }); hq.tag(ctx, 900, 760, 'GUAYAQUIL · CANCÚN', { size: 26, fill: '#fca5a5' }); }
    void W;
  },

  lagos(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Corte de la Antártida: kilómetros de hielo y, abajo, lagos escondidos en la oscuridad.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 470, [[0, '#7dd3fc'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 470);
    ctx.fillStyle = hq.vgrad(ctx, 0, 460, 980, [[0, '#ffffff'], [0.5, '#bfdbfe'], [1, '#1e3a8a']]); ctx.fillRect(0, 460, W, 520);
    ctx.strokeStyle = 'rgba(59,130,246,0.35)'; ctx.lineWidth = 3; for (let y = 520; y < 980; y += 50) { ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + 6 * Math.sin(x * 0.02 + y)); ctx.stroke(); }
    ctx.fillStyle = hq.vgrad(ctx, 0, 960, H, [[0, '#57534e'], [1, '#1c1917']]); ctx.fillRect(0, 960, W, H);
    // Pingüino arriba (para ubicar el lugar).
    ctx.save(); ctx.translate(200, 460); ctx.beginPath(); ctx.ellipse(0, -50, 30, 50, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.ellipse(6, -44, 18, 38, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.moveTo(22, -86); ctx.lineTo(44, -80); ctx.lineTo(22, -74); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.restore();
    const on = clamp((local - 0.6) / 0.8);
    for (const [x, w] of [[230, 160], [560, 260], [880, 140]]) {
      ctx.save(); ctx.globalAlpha = on;
      ctx.beginPath(); ctx.ellipse(x, 965, w / 2, 34, 0, Math.PI, TAU); ctx.fillStyle = '#0ea5e9'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      hq.glow(ctx, x, 950, w * 0.6, 'rgba(56,189,248,A)', 0.4);
      ctx.restore();
    }
    hq.tag(ctx, 640, 410, 'CIENTOS DE LAGOS ESCONDIDOS', { size: 34, fill: '#ffffff' });
    if (local > cue(1)) { hq.card(ctx, 360, 1000, 400, 90, 'rgba(15,23,42,0.9)', 26); ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fde047'; ctx.fillText('MILLONES DE AÑOS SIN LUZ', 560, 1045); }
    void t;
  },
};
