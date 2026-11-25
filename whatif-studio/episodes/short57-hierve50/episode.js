// Short 57: ¿y si el agua hirviera a 50 grados?  (SERIE EL AGUA · 6)
// Gancho: la olla hierve a 50 °C → ¿podrías cocinar? → no pasa de 50: el huevo jamás se cuece → hervir el agua ya no
// mata a muchos microbios → en los desiertos los charcos hierven solos → lo curioso: el agua no siempre hierve a 100;
// en la Ciudad de México a ~92 y en el Everest a ~70 (ahí un huevo tarda muchísimo).
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, ease, lerp, mixc, sky, sunDisc, cloud, thermometer, pot, egg, HERO } from '../../engine2d/props.js';

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

function kitchen(ctx, W, H, top = 1120) {
  ctx.fillStyle = '#fef3c7'; ctx.fillRect(0, 0, W, top);
  ctx.strokeStyle = 'rgba(180,83,9,0.15)'; ctx.lineWidth = 4;
  for (let y = 0; y < top; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, top); ctx.stroke(); }
  ctx.fillStyle = hq.vgrad(ctx, 0, top, H, [[0, '#a16207'], [1, '#713f12']]); ctx.fillRect(0, top, W, H - top);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.stroke();
}

/** Termómetro con número grande al lado. */
function bigThermo(ctx, x, y, h, k, label, color = '#ef4444') {
  thermometer(ctx, x, y, h, k, color);
  kit.text(ctx, label, x, y - h - 50, { size: 64, fill: '#fecaca' });
}

function microbe(ctx, x, y, r, color, t, { shades = false, seed = 0 } = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) { const a = (i / 30) * TAU, rr = r * (1 + 0.08 * Math.sin(a * 6 + t * 4 + seed)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, -r, r, [[0, hq.shade(color, 0.25)], [1, hq.shade(color, -0.2)]]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3 + 4 * Math.sin(t * 6 + i)); ctx.stroke(); }
  if (shades) { ctx.fillStyle = INK; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * r * 0.3, -r * 0.18, r * 0.24, r * 0.15, 0, 0, TAU); ctx.fill(); } ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.2); ctx.lineTo(r * 0.1, -r * 0.2); ctx.stroke(); }
  else { ctx.fillStyle = '#ffffff'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * r * 0.3, -r * 0.15, r * 0.17, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(sx * r * 0.3, -r * 0.12, r * 0.08, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.fillStyle = '#ffffff'; } }
  ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, r * 0.12, r * 0.35, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
}

function bubbles(ctx, x0, x1, y, t, n = 8, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) { const u = (t * 2 + i * 0.37) % 1, bx = lerp(x0, x1, (i * 0.618) % 1), r = (6 + (i % 3) * 5) * Math.sin(u * Math.PI); if (r > 1) { ctx.beginPath(); ctx.arc(bx, y - r * 0.4, r, 0, TAU); ctx.fill(); ctx.stroke(); } }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Cocina: la olla hierve y el termómetro marca solo 50 °C; el protagonista llega con un huevo.
    const c1 = cue(1);
    kitchen(ctx, W, H);
    pot(ctx, 640, 1120, 400, t, { boil: 1 });
    bigThermo(ctx, 900, 980, 340, 0.42, '50 °C');
    hq.toon(ctx, 240, 1400, 470, { ...HERO, t, seed: 1, armR: [1.3, -0.6], armL: [0.2, 0.15], eyes: 'open', mouth: local < c1 ? 'smile' : 'o', brows: local < c1 ? 0 : 1, look: [1, -0.3],
      hold: (c, h) => { const [hx, hy] = h.R; egg(c, hx + 6, hy - 40, 80, 0.2); } });
    if (local > c1 + 0.2) hq.bubble(ctx, 330, 600, 320, 96, 260, 800, '¿Y EL HUEVO?', { size: 44 });
  },

  huevo(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    kitchen(ctx, W, H);
    if (local < c1) {
      // Hierve con todo y el termómetro no se mueve de 50.
      pot(ctx, 420, 1120, 480, t, { boil: 1.3, flame: 1.3 });
      bigThermo(ctx, 840, 1000, 420, 0.42 + 0.01 * Math.sin(t * 20), '50 °C');
      ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 8; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(760, 1000 - 30 - (420 - 60) * 0.42); ctx.lineTo(1040, 1000 - 30 - (420 - 60) * 0.42); ctx.stroke(); ctx.restore();
      hq.tag(ctx, 540, 410, 'NO PASA DE 50 °C', { size: 50, fill: '#fca5a5' });
    } else {
      // Lo rompe después de hervirlo… y sale crudo: la clara transparente escurre al tazón.
      const k = ease((local - c1) / 0.5);
      hq.toon(ctx, 230, 1460, 470, { ...HERO, t, seed: 2, armL: [0.9, -0.9], armR: [0.3, 0.2], eyes: k > 0.6 ? 'closed' : 'open', mouth: 'flat', brows: -1, look: [1, 0.3] });
      // Tazón.
      ctx.beginPath(); ctx.moveTo(430, 960); ctx.quadraticCurveTo(440, 1120, 640, 1120); ctx.quadraticCurveTo(840, 1120, 850, 960); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 960, 1120, [[0, '#f8fafc'], [1, '#94a3b8']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(640, 962, 205, 34, 0, 0, TAU); ctx.fillStyle = '#e2e8f0'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(640, 966, 150 * k + 20, 22 * k + 4, 0, 0, TAU); ctx.fillStyle = 'rgba(254,240,138,0.7)'; ctx.fill();
      // Cascarón roto en dos.
      const gap = 30 + 60 * k;
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(640 + sd * gap, 660); ctx.rotate(sd * 0.35 * k);
        ctx.beginPath(); ctx.ellipse(0, 0, 80, 105, 0, sd < 0 ? Math.PI / 2 : -Math.PI / 2, sd < 0 ? Math.PI * 1.5 : Math.PI / 2);
        for (let i = 0; i <= 6; i++) ctx.lineTo(sd * (i % 2 ? 14 : -4), sd < 0 ? -105 + i * 35 : 105 - i * 35);
        ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, -105, 105, [[0, '#fff7ed'], [1, '#fdba74']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
        ctx.restore();
      }
      // Chorro de clara cruda y la yema que cae.
      ctx.beginPath(); ctx.moveTo(612, 700); ctx.quadraticCurveTo(600 + 10 * Math.sin(t * 5), 840, 622, 960); ctx.lineTo(658, 960); ctx.quadraticCurveTo(680 + 10 * Math.sin(t * 5 + 1), 840, 668, 700); ctx.closePath();
      ctx.fillStyle = 'rgba(254,249,195,0.75)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(11,15,26,0.55)'; ctx.stroke();
      const yy = lerp(720, 945, ease((local - c1 - 0.2) / 0.7));
      ctx.beginPath(); ctx.arc(640, yy, 34, 0, TAU); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(628, yy - 10, 8, 0, TAU); ctx.fill();
      hq.tag(ctx, 540, 410, 'SIGUE CRUDO', { size: 54, fill: '#fde047' });
    }
  },

  microbios(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    kitchen(ctx, W, H);
    if (local < c1) {
      // Con lupa: los microbios en el agua hirviendo, felices como en jacuzzi.
      pot(ctx, 300, 1120, 300, t, { boil: 1 });
      ctx.save(); ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(380, 960); ctx.lineTo(470, 870); ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = '#78350f'; ctx.stroke(); ctx.restore();
      const cx = 640, cy = 750, R = 270;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, cy - R, cy + R, [[0, '#7dd3fc'], [1, '#0284c7']]); ctx.fill();
      ctx.save(); ctx.clip();
      bubbles(ctx, cx - R, cx + R, cy + R * 0.6, t, 14);
      bubbles(ctx, cx - R, cx + R, cy - R * 0.1, t * 1.3, 10);
      microbe(ctx, cx - 110, cy - 40 + 8 * Math.sin(t * 3), 70, '#4ade80', t, { shades: true });
      microbe(ctx, cx + 100, cy + 70 + 8 * Math.sin(t * 3 + 1), 60, '#a78bfa', t, { seed: 2 });
      microbe(ctx, cx + 60, cy - 130 + 8 * Math.sin(t * 3 + 2), 44, '#f472b6', t, { seed: 4 });
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
      hq.tag(ctx, 540, 410, 'LOS MICROBIOS AGUANTAN', { size: 46, fill: '#86efac' });
    } else {
      // Duda antes de tomarse el vaso.
      hq.toon(ctx, 540, 1460, 640, { ...HERO, t, seed: 3, armR: [1.4, -0.5], armL: [0.2, 0.15], eyes: 'open', mouth: 'flat', brows: -1, look: [0.6, -0.4],
        hold: (c, h) => { const [hx, hy] = h.R; c.beginPath(); c.moveTo(hx - 40, hy - 100); c.lineTo(hx + 40, hy - 100); c.lineTo(hx + 30, hy + 20); c.lineTo(hx - 30, hy + 20); c.closePath(); c.fillStyle = 'rgba(224,242,254,0.6)'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(56,189,248,0.7)'; c.fillRect(hx - 34, hy - 50, 68, 66); microbe(c, hx, hy - 16, 18, '#4ade80', t); } });
      hq.bubble(ctx, 330, 560, 340, 96, 460, 760, '¿ME LA TOMO?', { size: 44 });
      hq.tag(ctx, 540, 410, 'TOMARLA: UN RIESGO', { size: 46, fill: '#fca5a5' });
    }
  },

  desierto(ctx, o) {
    const { W, H, local, t } = o;
    // Desierto: un charco hierve solo bajo el Sol.
    sky(ctx, W, 0, 980, '#f59e0b', '#fde68a');
    sunDisc(ctx, 300, 600, 90, t);
    ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { const y = 700 + i * 50; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + 8 * Math.sin(x * 0.03 + t * 4 + i)); ctx.stroke(); } ctx.restore();
    for (const [x, w, h, c] of [[-80, 600, 200, '#f59e0b'], [420, 760, 160, '#d97706']]) { ctx.beginPath(); ctx.moveTo(x, 1000); ctx.quadraticCurveTo(x + w / 2, 1000 - h * 2, x + w, 1000); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.fillStyle = hq.vgrad(ctx, 0, 980, H, [[0, '#fbbf24'], [1, '#b45309']]); ctx.fillRect(0, 980, W, H - 980); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 980); ctx.lineTo(W, 980); ctx.stroke();
    // Cactus.
    ctx.lineCap = 'round';
    for (const [x, y, s] of [[110, 1000, 0.9], [800, 990, 0.62]]) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const arm = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -260); ctx.moveTo(0, -120); ctx.lineTo(-60, -120); ctx.lineTo(-60, -190); ctx.moveTo(0, -150); ctx.lineTo(55, -150); ctx.lineTo(55, -220); ctx.stroke(); }; ctx.strokeStyle = INK; ctx.lineWidth = 58; arm(); ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 44; arm(); ctx.restore(); }
    // Charco hirviendo.
    ctx.beginPath(); ctx.ellipse(540, 1060, 260, 60, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, 1000, 1120, [[0, '#7dd3fc'], [1, '#0284c7']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    bubbles(ctx, 330, 750, 1060, t, 12, ease(local / 0.6));
    ctx.save(); ctx.globalAlpha = 0.6 * ease(local / 0.8); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const sx = 400 + i * 90; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const u = k / 8; ctx.lineTo(sx + 18 * Math.sin(u * 6 + t * 3 + i), 1030 - u * 260); } ctx.stroke(); }
    ctx.restore();
    bigThermo(ctx, 935, 900, 240, 0.85, '55 °C');
    hq.tag(ctx, 540, 410, 'CHARCOS HIRVIENDO', { size: 50, fill: '#fde047' });
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Perfil: playa (100 °C) → Ciudad de México (92 °C) → cima del Everest (70 °C). Cada olla aparece con su frase.
    const c1 = cue(1), c2 = cue(2);
    sky(ctx, W, 0, 1300, '#7dd3fc', '#f0f9ff');
    cloud(ctx, 300, 600, 110, '#ffffff'); cloud(ctx, 620, 520, 90, '#ffffff');
    // Mar y tierra.
    ctx.fillStyle = hq.vgrad(ctx, 0, 1090, H, [[0, '#38bdf8'], [1, '#075985']]); ctx.fillRect(0, 1090, 260, H - 1090);
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 1110); ctx.lineTo(240, 1090); ctx.quadraticCurveTo(300, 1080, 330, 1000); ctx.lineTo(380, 840); ctx.lineTo(620, 840); ctx.lineTo(700, 720); ctx.lineTo(860, 560); ctx.lineTo(960, 720); ctx.lineTo(W, 820); ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 560, H, [[0, '#a8a29e'], [0.4, '#65a30d'], [1, '#365314']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(860, 560); ctx.lineTo(800, 620); ctx.lineTo(830, 630); ctx.lineTo(860, 610); ctx.lineTo(890, 635); ctx.lineTo(925, 625); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    // Ciudad en la meseta.
    for (let i = 0; i < 5; i++) { const x = 400 + i * 44, h = 40 + (i % 3) * 26; ctx.fillStyle = ['#94a3b8', '#64748b', '#cbd5e1'][i % 3]; ctx.fillRect(x, 840 - h, 38, h); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x, 840 - h, 38, h); }
    // Ollas con su temperatura.
    const show = (k, x, y, label, col) => { if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; pot(ctx, x, y, 130, t, { boil: 1, flame: 0.8 }); hq.tag(ctx, x, y - 160, label, { size: 40, fill: col }); ctx.restore(); };
    show(ease(local / 0.4), 140, 1090, '100 °C', '#fca5a5');
    show(ease((local - c1) / 0.4), 560, 840, 'CDMX: 92 °C', '#fde68a');
    show(ease((local - c2) / 0.4), 860, 560, 'EVEREST: 70 °C', '#bae6fd');
    if (local > c2 + 0.6) {
      egg(ctx, 700, 540, 70, -0.2);
      // Reloj que gira: el huevo tarda muchísimo.
      ctx.beginPath(); ctx.arc(1000, 520, 46, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1000, 520); ctx.lineTo(1000 + 30 * Math.cos(t * 6), 520 + 30 * Math.sin(t * 6)); ctx.moveTo(1000, 520); ctx.lineTo(1000 + 20 * Math.cos(t * 0.5), 520 + 20 * Math.sin(t * 0.5)); ctx.stroke();
    }
    if (local < c2) hq.tag(ctx, 540, 410, local < c1 ? 'NO SIEMPRE HIERVE A 100' : 'MÁS ALTO, HIERVE ANTES', { size: 44, fill: '#ffffff' });
  },
};
