// Short 51: ¿y si el Sol fuera la mitad de grande?  (calidad alta: engine2d/hq.js + props.js)
// Gemelo del Short 46 (Sol doble, el de mejor rendimiento): misma fórmula.
// Gancho: ¿nos congelaríamos? → escena 2 = la consecuencia más visual (la Tierra se congela entera: más de 10 veces
// menos luz) → habría que vivir 4 veces más cerca, más cerca que Mercurio → tan cerca, su fuerza frenaría el giro: mitad
// siempre de día, mitad siempre de noche → lo bueno: viviría más que la edad del universo → sorpresa: 3 de cada 4
// estrellas son así; la más cercana, Próxima Centauri, tiene un planeta parecido a la Tierra.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, sea, space, starBall, orbit, planet, bushyTree } from '../../engine2d/props.js';
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

function snow(ctx, W, y0, y1, t, a, n = 60) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) { const x = (i * 131.7 + 30 * Math.sin(t + i)) % W, y = y0 + ((i * 97.3 + t * 90) % (y1 - y0)); ctx.beginPath(); ctx.arc(x, y, 4 + (i % 3) * 2, 0, TAU); ctx.fill(); }
  ctx.restore();
}

/** Capa de hielo sobre un globo: crece desde los polos (k 0..1). */
function iceCap(ctx, cx, cy, R, k) {
  if (k <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  const h = R * k;
  ctx.fillStyle = 'rgba(241,245,249,0.96)';
  ctx.fillRect(cx - R, cy - R, R * 2, h * 1.02); ctx.fillRect(cx - R, cy + R - h * 1.02, R * 2, h * 1.02);
  ctx.fillStyle = 'rgba(186,230,253,0.5)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(cx - R + (i * 0.27 % 1) * 2 * R, cy - R + h * 0.5, R * 0.12, R * 0.04, 0.3, 0, TAU); ctx.fill(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Playa: el Sol se encoge a la mitad y se pone rojo; el cielo se apaga y empieza a nevar.
    const g = ease((local - 1.0) / 1.2);
    sky(ctx, W, 0, 840, mixc('#38bdf8', '#7c2d12', g), mixc('#e0f2fe', '#fdba74', g));
    starBall(ctx, 540, 610, lerp(120, 58, g), t, { kind: g > 0.5 ? 'red' : 'sun' });
    sea(ctx, W, H, 820, t, { top: mixc('#0ea5e9', '#334155', g), bottom: mixc('#0369a1', '#0f172a', g) });
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, mixc('#fde68a', '#e2e8f0', g)], [1, mixc('#f59e0b', '#94a3b8', g)]]); ctx.fillRect(0, 1000, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(230, 1110); ctx.lineTo(210, 860); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, 900); ctx.quadraticCurveTo(200, 740, 370, 830); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    snow(ctx, W, 380, 1100, t, ease((local - 1.8) / 0.8));
    const cold = local > 1.6, jit = cold ? Math.sin(t * 40) * 3 : 0;
    hq.toon(ctx, 800 + jit, 1100, 340, { t, seed: 6, shirt: '#22c55e', pants: '#0ea5e9', skin: '#e0ac69', hair: '#92400e', armL: cold ? [1.0, -2.0] : [0.5, -0.6], armR: cold ? [1.0, -2.0] : [0.5, -0.6], eyes: cold ? 'wide' : 'happy', mouth: cold ? 'flat' : 'smile', brows: cold ? 1 : 0, look: [-0.6, -0.8] });
  },

  hielo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra con una estrella roja y débil al lado: el hielo cubre el planeta entero.
    const c1 = cue(1), k = ease((local - 0.2) / Math.max(1.6, o.s.dur - 0.6));
    space(ctx, W, H, t);
    starBall(ctx, 150, 560, 60, t, { kind: 'red' });
    drawGlobe(ctx, 600, 800, 300, { lon0: t * 8, lat0: 15 });
    iceCap(ctx, 600, 800, 300, k);
    if (k > 0.6) { ctx.save(); ctx.globalAlpha = (k - 0.6) / 0.4; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + t * 0.3; ctx.save(); ctx.translate(600 + Math.cos(a) * 360, 800 + Math.sin(a) * 360); ctx.rotate(t + i); ctx.fillStyle = '#e0f2fe'; ctx.fillRect(-3, -14, 6, 28); ctx.fillRect(-14, -3, 28, 6); ctx.restore(); } ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? 'MÁS DE 10 VECES MENOS LUZ' : '¡CONGELADA ENTERA!', { size: 42, fill: '#bae6fd' });
  },

  cerca(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Vista desde arriba: la Tierra se acerca a la estrella roja hasta quedar más cerca que Mercurio.
    const c1 = cue(1), sx = 110, sy = 800, S = 560, k = ease((local - 0.3) / Math.max(1.2, c1 + 0.4));
    space(ctx, W, H, t);
    ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 50; ctx.beginPath(); ctx.arc(sx, sy, S * 0.24, -1.1, 1.1); ctx.stroke(); ctx.restore();
    orbit(ctx, sx, sy, S * 0.39, -1.2, 1.2); orbit(ctx, sx, sy, S * 0.72, -1.2, 1.2); orbit(ctx, sx, sy, S, -1.2, 1.2);
    starBall(ctx, sx, sy, 56, t, { kind: 'red' });
    const mx = sx + Math.cos(-0.5) * S * 0.39, my = sy + Math.sin(-0.5) * S * 0.39;
    planet(ctx, mx, my, 16, '#d6d3d1', '#78716c'); hq.tag(ctx, mx, my - 50, 'MERCURIO', { size: 24, fill: '#e2e8f0' });
    const vx = sx + Math.cos(0.45) * S * 0.72, vy = sy + Math.sin(0.45) * S * 0.72; planet(ctx, vx, vy, 22, '#fde68a', '#d97706');
    const er = lerp(S, S * 0.24, k), ex = sx + er, ey = sy;
    drawGlobe(ctx, ex, ey, 38, { lon0: t * 30, lat0: 15, outline: 4 });
    hq.tag(ctx, ex + 20, ey + 70, 'TIERRA', { size: 26, fill: '#86efac' });
    if (k > 0 && k < 1) { ctx.save(); ctx.strokeStyle = '#86efac'; ctx.lineWidth = 6; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(sx + S, sy); ctx.lineTo(ex + 50, sy); ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? '4 VECES MÁS CERCA' : 'MÁS CERCA QUE MERCURIO', { size: 44, fill: '#86efac' });
  },

  noche(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra deja de girar: la mitad que mira a la estrella siempre de día; la otra, siempre de noche.
    const c1 = cue(1), stop = ease((local - 0.3) / 1.4);
    space(ctx, W, H, t);
    hq.glow(ctx, -40, 780, 520, 'rgba(248,113,113,A)', 0.5);
    starBall(ctx, -40, 780, 200, t, { kind: 'red' });
    const cx = 640, cy = 780, R = 280, lon = -60 + 220 * (1 - Math.pow(1 - Math.min(1, local / 1.7), 2));
    drawGlobe(ctx, cx, cy, R, { lon0: lon, lat0: 10 });
    // Lado de noche (a la derecha) con luces de ciudades.
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(2,6,23,0.78)'; ctx.fillRect(cx, cy - R, R, R * 2);
    ctx.fillStyle = '#fde047'; const Rr = kit.rng(4); for (let i = 0; i < 26; i++) { const x = cx + 20 + Rr() * (R - 40), y = cy - R * 0.8 + Rr() * R * 1.6; if (Math.hypot(x - cx, y - cy) < R - 10) { ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = 'rgba(248,113,113,0.18)'; ctx.fillRect(cx - R, cy - R, R, R * 2);
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (local > c1) { const k = ease((local - c1) / 0.4); ctx.save(); ctx.globalAlpha = k; hq.tag(ctx, cx - 140, cy + R + 60, 'SIEMPRE DE DÍA', { size: 30, fill: '#fdba74' }); hq.tag(ctx, cx + 170, cy + R + 60, 'SIEMPRE DE NOCHE', { size: 30, fill: '#a5b4fc' }); ctx.restore(); }
    void stop;
    hq.tag(ctx, 540, 410, local < c1 ? 'FRENARÍA SU GIRO' : 'MITAD DÍA, MITAD NOCHE', { size: 44, fill: '#fde68a' });
  },

  vida(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Barras de vida: la estrella roja dura muchísimo más que el Sol… y más que la edad del universo.
    const c1 = cue(1), g1 = ease((local - 0.2) / 0.8), g2 = ease((local - 0.5) / 2.0), x0 = 180, unit = 26;
    space(ctx, W, H, t);
    starBall(ctx, 105, 640, 38, t, { kind: 'sun', rays: false });
    starBall(ctx, 105, 860, 34, t, { kind: 'red', rays: false });
    hq.tag(ctx, 320, 565, 'NUESTRO SOL', { size: 28, fill: '#fde047' });
    hq.tag(ctx, 320, 785, 'ESTRELLA ROJA', { size: 28, fill: '#fca5a5' });
    const bar = (y, w, fill) => { hq.roundRectPath(ctx, x0, y - 23, Math.max(46, w), 46, 23); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); };
    bar(640, 10 * unit * g1, '#facc15');
    bar(860, (W - x0 + 60) * g2, hq.vgrad(ctx, 0, 837, 883, [[0, '#f87171'], [1, '#b91c1c']]));
    if (g2 > 0.95) { ctx.font = '900 60px Inter, sans-serif'; ctx.fillStyle = '#fca5a5'; ctx.textAlign = 'right'; ctx.fillText('→', W - 20, 830); }
    if (local > c1) {
      const k = ease((local - c1) / 0.5), mx = x0 + 13.8 * unit;
      ctx.save(); ctx.globalAlpha = k;
      ctx.setLineDash([12, 10]); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mx, 560); ctx.lineTo(mx, 920); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(mx, 520); ctx.rotate(t * 0.5); ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 6; for (let a = 0; a < 2; a++) { ctx.beginPath(); for (let u = 0; u < 3.5; u += 0.1) ctx.lineTo(Math.cos(u + a * Math.PI) * u * 9, Math.sin(u + a * Math.PI) * u * 9); ctx.stroke(); } ctx.restore();
      hq.tag(ctx, mx + 150, 520, 'EDAD DEL UNIVERSO', { size: 24, fill: '#c4b5fd' });
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'VIVIRÍA MUCHÍSIMO MÁS' : 'MÁS QUE TODO EL UNIVERSO', { size: 42, fill: '#fca5a5' });
  },

  real(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    space(ctx, W, H, t);
    if (local < c1) {
      // Campo de estrellas: casi 3 de cada 4 se vuelven rojas (son así de chicas).
      const k = ease((local - 0.4) / 1.4), R = kit.rng(8);
      for (let i = 0; i < 40; i++) { const x = 80 + R() * 920, y = 480 + R() * 600, r = 10 + R() * 14, red = i % 4 !== 0; starBall(ctx, x, y, r, t, { kind: red && k > (i % 10) / 10 ? 'red' : (i % 4 === 0 ? 'blue' : 'sun'), rays: false, glowK: 0.6 }); }
      hq.tag(ctx, 540, 410, local < c1 * 0.55 ? 'CASI 3 DE CADA 4 ESTRELLAS' : 'PRÓXIMA CENTAURI', { size: 40, fill: '#fca5a5' });
      return;
    }
    // Próxima Centauri y su planeta parecido a la Tierra.
    const k = pop((local - c1) / 0.6), a = t * 0.6;
    starBall(ctx, 470, 760, 110, t, { kind: 'red' });
    ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 46; ctx.beginPath(); ctx.ellipse(470, 760, 330, 120, 0, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.setLineDash([12, 12]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.beginPath(); ctx.ellipse(470, 760, 330, 120, 0, 0, TAU); ctx.stroke(); ctx.restore();
    const px = 470 + Math.cos(a) * 330, py = 760 + Math.sin(a) * 120;
    ctx.save(); ctx.translate(px, py); ctx.scale(k, k); drawGlobe(ctx, 0, 0, 44, { lon0: 90, lat0: 10, outline: 4, ocean: '#2563eb', land: '#a3a35a' }); ctx.restore();
    hq.tag(ctx, px, py - 80, '¿AGUA?', { size: 28, fill: '#86efac' });
    hq.tag(ctx, 540, 410, 'UN PLANETA PARECIDO A LA TIERRA', { size: 36, fill: '#86efac' });
  },
};
