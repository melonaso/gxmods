// Short 41: ¿y si los pulpos vivieran tanto como nosotros?  (calidad alta: engine2d/hq.js)
// Gancho: son tan listos que abren frascos… ¿por qué no dominan el mundo? (se responde casi al final).
// 3 corazones, sangre azul, 2/3 de las neuronas en los brazos → Inky (2016) escapó por un desagüe → viven 1–2 años;
// la mamá deja de comer y muere cuando nacen → cada pulpito nace solo: nadie le enseña → sorpresa: 1977, al quitarles
// una glándula cerca de los ojos, las mamás volvieron a comer y vivieron meses más.
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

function ocean(ctx, W, H, t, top = '#0ea5e9', bottom = '#082f49') {
  ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, top], [1, bottom]]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#e0f2fe';
  for (let i = 0; i < 5; i++) { const x = 40 + i * 240 + 40 * Math.sin(t * 0.4 + i); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 260, H); ctx.lineTo(x + 140, H); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  hq.bokeh(ctx, W, 380, 1100, t, { n: 14, seed: 11, color: 'rgba(224,242,254,A)', r: [5, 14], a: 0.35 });
}

/**
 * Pulpo: manto (cabeza) arriba, ojos con pupila horizontal y 8 brazos que ondulan.
 * (x, y) = centro de los ojos; s = tamaño. pale 0..1 lo decolora (mamá que se apaga). reach: brazos hacia (rx, ry).
 */
function octopus(ctx, x, y, s, t, { color = '#f97316', pale = 0, look = [0, 0], reach = null, glowGland = 0, happy = false } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - 0.55 * pale;
  const base = color, dark = hq.shade(color, -0.35);
  // Brazos (detrás del cuerpo).
  for (let i = 0; i < 8; i++) {
    const sgn = i < 4 ? -1 : 1, k = i % 4, a0 = Math.PI / 2 + sgn * (0.25 + k * 0.32);
    let px = Math.cos(a0) * s * 0.3, py = s * 0.25 + Math.sin(a0) * s * 0.1;
    const pts = [[px, py]];
    for (let j = 1; j <= 7; j++) {
      const u = j / 7, wave = Math.sin(t * 2.5 + i * 0.9 + j * 0.7) * 0.35;
      let ang = a0 + sgn * (0.3 * j * 0.18) + wave * u;
      if (reach && i === 3) { const dx = reach[0] - x - px, dy = reach[1] - y - py; ang = Math.atan2(dy, dx) + wave * 0.3; }
      px += Math.cos(ang) * s * 0.17; py += Math.sin(ang) * s * 0.17; pts.push([px, py]);
    }
    // Primero todo el contorno, luego todo el relleno (así el brazo se ve continuo, sin «cuentas»).
    const wd = (j) => s * 0.13 * (1 - j / pts.length) + s * 0.025;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let j = 0; j < pts.length - 1; j++) { ctx.strokeStyle = INK; ctx.lineWidth = wd(j) + 7; ctx.beginPath(); ctx.moveTo(...pts[j]); ctx.lineTo(...pts[j + 1]); ctx.stroke(); }
    for (let j = 0; j < pts.length - 1; j++) { ctx.strokeStyle = base; ctx.lineWidth = wd(j); ctx.beginPath(); ctx.moveTo(...pts[j]); ctx.lineTo(...pts[j + 1]); ctx.stroke(); }
    for (let j = 1; j < pts.length - 1; j++) { const w = wd(j); ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(pts[j][0] + w * 0.22, pts[j][1] + w * 0.22, w * 0.17, 0, TAU); ctx.fill(); }
  }
  // Manto.
  const mantle = () => { ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.15); ctx.bezierCurveTo(-s * 0.5, -s * 0.45, -s * 0.25, -s * 0.95, s * 0.05, -s * 0.9); ctx.bezierCurveTo(s * 0.4, -s * 0.85, s * 0.52, -s * 0.4, s * 0.36, s * 0.15); ctx.quadraticCurveTo(0, s * 0.32, -s * 0.36, s * 0.15); ctx.closePath(); };
  mantle(); ctx.fillStyle = hq.vgrad(ctx, 0, -s * 0.9, s * 0.3, [[0, hq.shade(base, 0.15)], [1, dark]]); ctx.fill();
  ctx.save(); mantle(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.6, s * 0.14, s * 0.22, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = hq.shade(base, -0.2); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-s * 0.25 + (i * 37 % 50) / 100 * s, -s * 0.6 + (i * 53 % 60) / 100 * s, s * 0.035, 0, TAU); ctx.fill(); }
  ctx.restore();
  mantle(); ctx.lineWidth = Math.max(4, s * 0.025); ctx.strokeStyle = INK; ctx.stroke();
  // Glándula (detrás de los ojos), cuando hace falta mostrarla.
  if (glowGland > 0) { hq.glow(ctx, 0, -s * 0.12, s * 0.25, 'rgba(250,204,21,A)', glowGland); ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.06, 0, TAU); ctx.fillStyle = `rgba(250,204,21,${glowGland})`; ctx.fill(); }
  // Ojos.
  for (const k of [-1, 1]) {
    const ex = k * s * 0.2, ey = 0;
    ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.11, s * 0.12, 0, 0, TAU); ctx.fillStyle = '#fef9c3'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    if (happy) { ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(ex, ey + s * 0.03, s * 0.06, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else { hq.roundRectPath(ctx, ex - s * 0.07 + look[0] * s * 0.03, ey - s * 0.025 + look[1] * s * 0.03, s * 0.14, s * 0.05, s * 0.025); ctx.fillStyle = INK; ctx.fill(); }
  }
  ctx.restore();
}

function jar(ctx, x, y, w, h, lidAng = 0, lidOff = 0) {
  ctx.save(); ctx.translate(x, y);
  hq.roundRectPath(ctx, -w / 2, -h, w, h, w * 0.18); ctx.fillStyle = 'rgba(224,242,254,0.35)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; hq.roundRectPath(ctx, -w * 0.36, -h * 0.85, w * 0.12, h * 0.6, w * 0.06); ctx.fill();
  ctx.save(); ctx.translate(0, -h - lidOff); ctx.rotate(lidAng);
  hq.roundRectPath(ctx, -w * 0.45, -h * 0.13, w * 0.9, h * 0.15, 8); ctx.fillStyle = '#dc2626'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * w * 0.12, -h * 0.12); ctx.lineTo(i * w * 0.12, 0); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}

function heart(ctx, x, y, s, color) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.8, y - s * 0.2, x - s * 0.35, y - s * 0.8, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.8, x + s * 0.8, y - s * 0.2, x, y + s * 0.35); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // En el acuario: el pulpo rodea un frasco y le gira la tapa hasta abrirlo.
    ocean(ctx, W, H, t);
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#d6b77a'], [1, '#8a6d3b']]); ctx.fillRect(0, 1000, W, H);
    const twist = clamp(local / 3.2), open = clamp((local - 3.2) / 0.6);
    jar(ctx, 700, 1010, 230, 270, twist * 2.6 + open * 0.6, open * 140);
    ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.ellipse(700, 960, 40, 26, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    octopus(ctx, 420, 790, 400, t, { reach: [700, 760 - 120 * open], look: [1, 0.3] });
  },

  cuerpo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Rayos X del pulpo: tres corazones, sangre azul y neuronas que corren por los brazos.
    const bg = ctx.createRadialGradient(540, 700, 60, 540, 700, 1000); bg.addColorStop(0, '#0c4a6e'); bg.addColorStop(1, '#020617'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(56,189,248,0.1)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    octopus(ctx, 540, 640, 460, t, { color: '#38bdf8', look: [0, 0.2] });
    const beat = 1 + 0.12 * Math.max(0, Math.sin(t * 7));
    for (const [hx, hy, s] of [[480, 520, 46], [600, 520, 46], [540, 450, 60]]) heart(ctx, hx, hy, s * beat, '#ef4444');
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(540, 470); ctx.quadraticCurveTo(540 + k * 120, 560, 540 + k * 160, 680); ctx.stroke(); }
    const nk = clamp((local - cue(1)) / 0.5);
    if (nk > 0) for (let i = 0; i < 16; i++) { const a = Math.PI / 2 + (i % 8 - 3.5) * 0.35, d = 160 + ((t * 160 + i * 47) % 260); const nx = 540 + Math.cos(a) * d * 1.1, ny = 700 + Math.sin(a) * d * 0.9; hq.glow(ctx, nx, ny, 26, 'rgba(250,204,21,A)', nk); ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(nx, ny, 6, 0, TAU); ctx.fill(); }
    hq.tag(ctx, 540, 405, nk > 0 ? '2 DE CADA 3 NEURONAS: EN LOS BRAZOS' : '3 CORAZONES · SANGRE AZUL', { size: 34, fill: nk > 0 ? '#fde047' : '#fca5a5' });
  },

  inky(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Acuario de noche: Inky sale del tanque, cruza el piso y se mete por el desagüe… hasta el mar.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#1e293b'], [1, '#0f172a']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hq.vgrad(ctx, 0, 940, H, [[0, '#475569'], [1, '#334155']]); ctx.fillRect(0, 940, W, H);
    // Tanque.
    hq.roundRectPath(ctx, 60, 520, 380, 420, 16); ctx.fillStyle = 'rgba(14,165,233,0.45)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(80, 540, 26, 380);
    // Desagüe en el piso.
    ctx.beginPath(); ctx.ellipse(880, 980, 70, 20, 0, 0, TAU); ctx.fillStyle = '#0b0f1a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#94a3b8'; ctx.stroke();
    // Recorrido: arriba del tanque → piso → desagüe.
    const T1 = 1.0, T2 = cue(1) + 2.0;
    let px, py, sc = 1;
    if (local < T1) { const u = local / T1; px = 250; py = 700 - 220 * u; }
    else if (local < T1 + 0.6) { const u = (local - T1) / 0.6; px = 250 + 220 * u; py = 480 + 420 * u * u; }
    else if (local < T2) { const u = clamp((local - T1 - 0.6) / (T2 - T1 - 0.6)); px = 470 + 410 * u; py = 900; }
    else { const u = clamp((local - T2) / 0.5); px = 880; py = 900 + 60 * u; sc = 1 - u; }
    if (local > T1 + 0.6) { ctx.strokeStyle = 'rgba(125,211,252,0.4)'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(470, 960); ctx.lineTo(Math.min(px, 880), 960); ctx.stroke(); }
    if (sc > 0.02) octopus(ctx, px, py, 200 * sc, t, { look: [1, 0.4] });
    if (local > T2) {
      // Recuadro: el tubo baja hasta el mar.
      hq.card(ctx, 600, 430, 420, 300, hq.vgrad(ctx, 0, 430, 730, [[0, '#7dd3fc'], [1, '#0369a1']]), 22);
      ctx.save(); hq.roundRectPath(ctx, 600, 430, 420, 300, 22); ctx.clip();
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 46; ctx.beginPath(); ctx.moveTo(640, 430); ctx.quadraticCurveTo(700, 620, 900, 640); ctx.stroke();
      const u = clamp((local - T2) / 1.0); octopus(ctx, 700 + 260 * u, 520 + 160 * u, 90, t, { happy: true });
      ctx.restore();
      hq.tag(ctx, 810, 760, '¡AL MAR!', { size: 40, fill: '#86efac' });
    }
    hq.tag(ctx, 250, 405, '2016 · NUEVA ZELANDA', { size: 36, fill: '#ffffff' });
  },

  vida(ctx, o) {
    const { W, H, local, cue, t } = o;
    // En su cueva: la mamá cuida racimos de huevos, deja de comer y se va apagando; los huevos nacen.
    ocean(ctx, W, H, t, '#0369a1', '#082f49');
    ctx.beginPath(); ctx.moveTo(0, 380); ctx.quadraticCurveTo(540, 300, W, 380); ctx.lineTo(W, 520); ctx.quadraticCurveTo(540, 440, 0, 520); ctx.closePath(); ctx.fillStyle = '#44403c'; ctx.fill();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#57534e'], [1, '#292524']]); ctx.fillRect(0, 1000, W, H);
    const fade = clamp((local - cue(1)) / (o.s.dur - cue(1)));
    // Racimos de huevos colgando del techo.
    for (let c = 0; c < 6; c++) { const cx = 200 + c * 140, len = 200 + (c % 3) * 40; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 470); ctx.lineTo(cx, 470 + len); ctx.stroke(); for (let e = 0; e < 9; e++) { const ex = cx + Math.sin(e * 1.7 + t) * 10, ey = 490 + e * (len / 9); ctx.beginPath(); ctx.ellipse(ex, ey, 11, 15, 0, 0, TAU); ctx.fillStyle = fade > 0.8 ? 'rgba(255,255,255,0.4)' : '#f8fafc'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); } }
    if (fade > 0.75) for (let i = 0; i < 8; i++) { const u = (t * 0.4 + i / 8) % 1; octopus(ctx, 150 + i * 110 + 30 * Math.sin(t + i), 760 - u * 250, 40, t, { color: '#fdba74' }); }
    octopus(ctx, 540, 900, 300, t, { pale: fade, look: [0, -0.6] });
    // Reloj de arena: 1–2 años.
    hq.tag(ctx, 540, 405, local < cue(1) ? 'VIVEN 1 O 2 AÑOS' : 'DEJA DE COMER PARA CUIDARLOS', { size: 36, fill: local < cue(1) ? '#fde047' : '#fca5a5' });
  },

  solos: function (ctx, o) {
    const { W, H, local, cue, t } = o;
    // Mar abierto: pulpitos solos a la deriva, sin nadie que les enseñe.
    ocean(ctx, W, H, t, '#38bdf8', '#0c4a6e');
    for (let i = 0; i < 9; i++) { const x = 120 + (i * 117) % 860, y = 520 + ((i * 173) % 460) + 20 * Math.sin(t * 1.3 + i); octopus(ctx, x, y, 46 + (i % 3) * 8, t + i, { color: '#fdba74', look: [Math.sin(t + i), 0] }); }
    // Pizarrón vacío: «LECCIONES DE MAMÁ» tachado.
    const k = clamp((local - cue(1)) / 0.4);
    hq.card(ctx, 260, 430, 560, 200, '#14532d', 18);
    ctx.font = '900 38px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ecfccb'; ctx.fillText('LECCIONES DE MAMÁ', 540, 500);
    ctx.font = '900 30px Inter, sans-serif'; ctx.fillStyle = 'rgba(236,252,203,0.5)'; ctx.fillText('(vacío)', 540, 565);
    if (k > 0) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(290, 600 - 140 * 0); ctx.lineTo(290 + 500 * k, 460); ctx.stroke(); }
    if (k > 0) hq.tag(ctx, 540, 1060, 'TODO LO QUE SABÍAN SE PIERDE', { size: 38, fill: '#fde047' });
    void W;
  },

  glandula(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Laboratorio, 1977: la glándula detrás de los ojos se marca, se retira, y la mamá vuelve a comer.
    ocean(ctx, W, H, t, '#0ea5e9', '#0c4a6e');
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#d6b77a'], [1, '#8a6d3b']]); ctx.fillRect(0, 1000, W, H);
    const removed = local > cue(1) - 0.2;
    const gl = removed ? Math.max(0, 1 - (local - cue(1) + 0.2) / 0.4) : 0.6 + 0.4 * Math.sin(t * 5);
    octopus(ctx, 420, 720, 420, t, { glowGland: gl, look: [1, 0.2], happy: local > cue(1) + 0.6, reach: removed ? [820, 900] : null });
    if (!removed) {
      hq.tag(ctx, 660, 600, 'GLÁNDULA ÓPTICA', { size: 32, fill: '#fde047' });
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(420, 670); ctx.lineTo(560, 610); ctx.stroke();
    } else {
      // Cangrejo (comida) y calendario «+ MESES».
      ctx.save(); ctx.translate(840, 960); ctx.beginPath(); ctx.ellipse(0, 0, 60, 38, 0, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(k * 70, -30, 22, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore();
      hq.card(ctx, 700, 450, 300, 180, '#ffffff', 22);
      ctx.fillStyle = '#ef4444'; hq.roundRectPath(ctx, 700, 450, 300, 54, 22); ctx.fill();
      ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText('VIDA', 850, 478);
      ctx.font = '900 54px Inter, sans-serif'; ctx.fillStyle = '#16a34a'; ctx.fillText('+ MESES', 850, 570);
    }
    hq.tag(ctx, 250, 405, '1977 · EXPERIMENTO', { size: 36, fill: '#ffffff' });
    void W;
  },
};
