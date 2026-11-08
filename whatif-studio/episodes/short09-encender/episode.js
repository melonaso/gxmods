// Short 09 (idea de un suscriptor): ¿y si mandáramos una nave a volver a encender el Sol?
// Cohete → viaje de 150 millones de km → 9 días → todas las bombas → nada para el Sol →
// el núcleo necesita 15 millones de °C → un cerillo contra un millón de Tierras → la gravedad lo enciende.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(260, C.W, C.H, 31); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }, a = 0.9) => { kit.gradientBG(ctx, W, H, '#03040f', '#140b33'); kit.drawStars(ctx, stars, a, t); };

/** Cohete apuntando hacia "ang" (radianes; 0 = arriba). */
function rocket(ctx, kit, x, y, s, ang, t, flame = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  if (flame > 0) {
    const f = 1 + 0.18 * Math.sin(t * 30);
    ctx.beginPath(); ctx.moveTo(-26, 92); ctx.quadraticCurveTo(0, 92 + 110 * f * flame, 26, 92); ctx.closePath(); kit.shape(ctx, '#f97316', 4);
    ctx.beginPath(); ctx.moveTo(-14, 92); ctx.quadraticCurveTo(0, 92 + 60 * f * flame, 14, 92); ctx.closePath(); ctx.fillStyle = '#fde047'; ctx.fill();
  }
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 30, 40); ctx.lineTo(sx * 62, 96); ctx.lineTo(sx * 30, 86); ctx.closePath(); kit.shape(ctx, '#dc2626', 5); }
  ctx.beginPath(); ctx.moveTo(0, -110); ctx.quadraticCurveTo(44, -60, 34, 92); ctx.lineTo(-34, 92); ctx.quadraticCurveTo(-44, -60, 0, -110); ctx.closePath(); kit.shape(ctx, '#f1f5f9', 6);
  ctx.beginPath(); ctx.moveTo(0, -110); ctx.quadraticCurveTo(26, -84, 30, -58); ctx.lineTo(-30, -58); ctx.quadraticCurveTo(-26, -84, 0, -110); ctx.closePath(); kit.shape(ctx, '#dc2626', 5);
  ctx.beginPath(); ctx.arc(0, -8, 18, 0, Math.PI * 2); kit.shape(ctx, '#38bdf8', 5);
  ctx.restore();
}

/** Bomba nuclear (icono): cuerpo redondo, aletas y el símbolo de radiación. */
function bomb(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 10, 30); ctx.lineTo(sx * 30, 52); ctx.lineTo(sx * 6, 46); ctx.closePath(); kit.shape(ctx, '#475569', 3); }
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 40, 0, 0, Math.PI * 2); kit.shape(ctx, '#facc15', 4);
  ctx.fillStyle = kit.INK; ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * (2 * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -4); ctx.arc(0, -4, 15, a - 0.5, a + 0.5); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/** Sol en corte: capas y núcleo que brilla según "heat" (0 apagado … 1 encendido). */
function sunCut(ctx, kit, cx, cy, R, heat, t) {
  const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = mix([40, 28, 30], [234, 88, 12], heat); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.7, 0, Math.PI * 2); ctx.fillStyle = mix([58, 34, 30], [249, 115, 22], heat); ctx.fill();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.32 * (1 + 0.04 * Math.sin(t * 4) * heat));
  g.addColorStop(0, mix([90, 40, 30], [255, 255, 240], heat)); g.addColorStop(1, mix([70, 34, 30], [253, 186, 116], heat));
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // El Sol se apaga durante la primera frase.
    const off = kit.ramp(local, 0.3, 1.5);
    kit.sun(ctx, W / 2, 560, 200, { t, on: 1 - off });
    if (off > 0.9) kit.text(ctx, 'SOL APAGADO', W / 2, 820, { size: 40, weight: 900, fill: '#94a3b8' });
    // El cohete entra desde abajo a la derecha y se detiene apuntando al Sol.
    const L = cue(1), k = o.ease.out(kit.ramp(local, L - 0.2, L + 1.4));
    if (k > 0) rocket(ctx, kit, W + 160 - 330 * k, 1500 - 520 * k, 0.8, -0.62, t);
  },

  viaje(ctx, o) {
    const { W, kit, local, s, t } = o;
    space(ctx, o);
    kit.sun(ctx, 850, 500, 110, { t, on: 0 });
    drawGlobe(ctx, 200, 1000, 90, { lon0: -100 + t * 10, lat0: 15 });
    ctx.save(); ctx.setLineDash([22, 18]); ctx.strokeStyle = 'rgba(148,163,184,0.8)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(260, 930); ctx.quadraticCurveTo(420, 620, 760, 560); ctx.stroke(); ctx.restore();
    const u = kit.clamp(local / (s.dur - 0.3));
    const px = (1 - u) * (1 - u) * 260 + 2 * (1 - u) * u * 420 + u * u * 760, py = (1 - u) * (1 - u) * 930 + 2 * (1 - u) * u * 620 + u * u * 560;
    rocket(ctx, kit, px, py, 0.45, 0.9 - u * 0.4, t);
    const km = Math.round(150e6 * o.ease.out(kit.clamp(local / (s.dur * 0.8))));
    kit.text(ctx, `${kit.nf(km)} km`, W / 2, 270, { size: 92, fill: kit.YELLOW, maxW: W * 0.9 });
  },

  nave(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o, 0.6);
    kit.speedLines(ctx, W, 350, 1150, t, { n: 34, speed: 3200, color: 'rgba(255,255,255,0.55)' });
    rocket(ctx, kit, W / 2, 760, 1.25, Math.PI / 2, t);
    kit.text(ctx, '692,000 km/h', W / 2, 300, { size: 84, fill: '#ffffff' });
    // Calendario: los días pasan hasta 9.
    const d = Math.min(9, Math.floor(9 * kit.ramp(local, cue(1) - 0.2, cue(1) + 1.2)));
    if (local > cue(1) - 0.3) {
      ctx.save(); ctx.translate(W / 2, 470);
      kit.roundRect(ctx, -110, -60, 220, 150, 18); kit.shape(ctx, '#ffffff', 6);
      ctx.fillStyle = '#ef4444'; kit.roundRect(ctx, -110, -60, 220, 46, 18); ctx.fill(); ctx.fillRect(-110, -30, 220, 16);
      kit.text(ctx, 'DÍAS', 0, -37, { size: 28, stroke: null });
      kit.text(ctx, `${d}`, 0, 38, { size: 84, fill: kit.INK, stroke: null });
      ctx.restore();
    }
    void H;
  },

  bombas(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o, 0.6);
    // Bodega del cohete llena de bombas (aparecen de a poco).
    const n = Math.floor(40 * kit.ramp(local, 0.2, 1.8));
    for (let i = 0; i < n; i++) {
      const c = i % 8, r = Math.floor(i / 8);
      bomb(ctx, kit, 150 + c * 112, 470 + r * 125, 0.95 + 0.04 * Math.sin(t * 3 + i));
    }
    kit.text(ctx, '≈ 12,000 BOMBAS', W / 2, 330, { size: 74, fill: kit.YELLOW });
  },

  nada(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    kit.sun(ctx, W / 2, 790, 250, { t, on: 1 });
    // La explosión de todas las bombas: un destello diminuto junto al Sol.
    const e = local - 0.4;
    if (e > 0 && e < 1.4) { const k = e / 1.4; ctx.beginPath(); ctx.arc(170, 1000, 10 + 40 * k, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,240,180,${1 - k})`; ctx.fill(); }
    if (e > 0) kit.text(ctx, '¡pff!', 170, 920, { size: 48, fill: '#fde68a', lw: 8 });
    const k2 = kit.ramp(local, cue(1), cue(1) + 0.25);
    if (k2 > 0) {
      ctx.save(); ctx.globalAlpha = k2; ctx.translate(W / 2, 250);
      ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 8);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-10, -122, 20, 30);
      ctx.strokeStyle = kit.INK; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -62); ctx.stroke();
      ctx.restore();
      kit.text(ctx, '0.000001 s', W / 2, 410, { size: 70, fill: kit.YELLOW });
    }
    void H;
  },

  centro(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o, 0.5);
    sunCut(ctx, kit, W / 2, 760, 380, 0.08, t);
    kit.text(ctx, 'NÚCLEO', W / 2, 760, { size: 46, fill: '#fde68a' });
    const temp = 15e6 * o.ease.out(kit.ramp(local, 0.2, cue(1) - 0.1));
    kit.text(ctx, `${kit.nf(Math.round(temp / 1e5) * 1e5)} °C`, W / 2, 300, { size: 90, fill: '#ffffff', stroke: '#7c2d12', lw: 14, maxW: W * 0.92 });
    // Presión: flechas que aprietan hacia el centro.
    const pk = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (pk > 0) for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, r0 = 470 - 30 * Math.sin(t * 6), r1 = 330;
      ctx.save(); ctx.globalAlpha = pk; ctx.translate(W / 2 + Math.cos(a) * r0, 760 + Math.sin(a) * r0); ctx.rotate(a + Math.PI);
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(r0 - r1 - 40, -14); ctx.lineTo(r0 - r1 - 40, -32); ctx.lineTo(r0 - r1, 0); ctx.lineTo(r0 - r1 - 40, 32); ctx.lineTo(r0 - r1 - 40, 14); ctx.lineTo(0, 14); ctx.closePath();
      kit.shape(ctx, '#93c5fd', 5); ctx.restore();
    }
  },

  cerillo(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o, 0.6);
    // Una "fogata" del tamaño de 1.3 millones de Tierras: el Sol apagado lleno de puntitos-Tierra.
    const R = 330, cx = W / 2 + 120, cy = 700;
    kit.sun(ctx, cx, cy, R, { t, on: 0 });
    const r = kit.rng(4);
    const k = kit.ramp(local, cue(1) - 0.2, cue(1) + 1.0);
    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < 260 * k; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (R - 12); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 5, 0, Math.PI * 2); ctx.fill(); }
    if (k > 0.3) kit.text(ctx, '1,300,000 TIERRAS', cx, cy - R - 60, { size: 54, fill: '#93c5fd' });
    // El cerillo.
    ctx.save(); ctx.translate(150, 930); ctx.rotate(-0.25);
    kit.roundRect(ctx, -8, -170, 16, 170, 6); kit.shape(ctx, '#e7c08a', 4);
    ctx.beginPath(); ctx.ellipse(0, -178, 14, 20, 0, 0, Math.PI * 2); kit.shape(ctx, '#b91c1c', 4);
    const f = 1 + 0.15 * Math.sin(t * 20);
    ctx.beginPath(); ctx.moveTo(-14, -190); ctx.quadraticCurveTo(0, -250 * f, 14, -190); ctx.quadraticCurveTo(0, -200, -14, -190); kit.shape(ctx, '#fb923c', 3);
    ctx.restore();
    kit.text(ctx, 'CERILLO', 170, 980, { size: 36, weight: 900 });
  },

  gravedad(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // La gravedad aprieta el Sol, se calienta... y se vuelve a encender.
    const S = cue(1), heat = o.ease.inOut(kit.ramp(local, S, S + 1.6));
    const squeeze = 1 - 0.08 * kit.ramp(local, 0.2, S + 0.5) + 0.08 * heat;
    if (heat < 0.85) {
      sunCut(ctx, kit, W / 2, 720, 330 * squeeze, heat, t);
      // Flechas de gravedad que aprietan hacia el centro.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2, r0 = 470 - 25 * Math.sin(t * 6), r1 = 350;
        ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r0, 720 + Math.sin(a) * r0); ctx.rotate(a + Math.PI);
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(r0 - r1 - 40, -14); ctx.lineTo(r0 - r1 - 40, -32); ctx.lineTo(r0 - r1, 0); ctx.lineTo(r0 - r1 - 40, 32); ctx.lineTo(r0 - r1 - 40, 14); ctx.lineTo(0, 14); ctx.closePath();
        kit.shape(ctx, '#c4b5fd', 5); ctx.restore();
      }
    } else kit.sun(ctx, W / 2, 720, 300, { t, on: 1 });
    kit.flash(ctx, W, H, 0.7 * kit.impulse(local, S + 1.35, 0.3), '#fff7d6');
    kit.text(ctx, heat < 0.85 ? 'GRAVEDAD' : '¡ENCENDIDO!', W / 2, 300, { size: 96, fill: heat < 0.85 ? '#c4b5fd' : kit.YELLOW });
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    kit.sun(ctx, W / 2, 700, 230, { t, on: 1 });
    const a = t * 0.6;
    drawGlobe(ctx, W / 2 + Math.cos(a) * 400, 700 + Math.sin(a) * 160, 60, { lon0: -t * 50, lat0: 15, night: 0, glow: false });
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE @kgatitoo', W / 2, 330, { size: 60, fill: kit.YELLOW }); ctx.restore(); }
  },
};
