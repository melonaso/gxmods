// Short 49: ¿y si se enfriara el centro de la Tierra?  (calidad alta: engine2d/hq.js + props.js)
// Gancho corto: ¿lo notarías? (se contesta casi al final: tú no). Sin palabras técnicas («imán gigante», no «campo
// magnético»; «el centro de la Tierra», no «núcleo»).
// Las brújulas se vuelven locas (el centro es metal derretido que se mueve: un imán gigante) → tortugas, aves y salmones
// se perderían → ese imán es un escudo contra el viento del Sol; sin él, el aire se escaparía poco a poco →
// tú no lo notarías: tardaría millones de años → sorpresa: Marte ya lo vivió; su aire es 100 veces más delgado.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, cloud, sunDisc, sea, space, palm } from '../../engine2d/props.js';
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

/** Tierra con un corte (cuarto superior derecho) que muestra las capas. cold 0..1 enfría el centro. */
function cutaway(ctx, cx, cy, R, t, cold = 0) {
  drawGlobe(ctx, cx, cy, R, { lon0: -30 + t * 4, lat0: 15 });
  const a0 = -Math.PI / 2, a1 = 0;
  const wedge = (r, fill) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  wedge(R, '#92400e');
  wedge(R * 0.94, (() => { const g = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 0.94); g.addColorStop(0, '#f97316'); g.addColorStop(1, '#b91c1c'); return g; })());
  const hot1 = mixc('#fde047', '#64748b', cold), hot2 = mixc('#f59e0b', '#334155', cold);
  wedge(R * 0.55, (() => { const g = ctx.createRadialGradient(cx, cy, R * 0.28, cx, cy, R * 0.55); g.addColorStop(0, hot1); g.addColorStop(1, hot2); return g; })());
  // Remolinos del metal derretido (se detienen al enfriarse).
  if (cold < 0.95) { ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * 0.55, a0, a1); ctx.closePath(); ctx.clip(); ctx.globalAlpha = 1 - cold; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const r = R * (0.33 + i * 0.045), st = t * 1.6 * (1 - cold) + i; ctx.beginPath(); ctx.arc(cx, cy, r, a0 + st % 1.4, a0 + (st % 1.4) + 0.5); ctx.stroke(); } ctx.restore(); }
  wedge(R * 0.28, mixc('#fef9c3', '#94a3b8', cold));
  if (cold < 1) hq.glow(ctx, cx + R * 0.15, cy - R * 0.15, R * 0.6, 'rgba(253,186,116,A)', 0.5 * (1 - cold));
  if (cold > 0) { ctx.save(); ctx.globalAlpha = cold; ctx.fillStyle = '#e0f2fe'; for (let i = 0; i < 10; i++) { const a = a0 + ((i * 0.37) % 1) * (a1 - a0), r = R * (0.08 + ((i * 0.53) % 1) * 0.42); ctx.save(); ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.rotate(i); ctx.fillRect(-2, -9, 4, 18); ctx.fillRect(-9, -2, 18, 4); ctx.restore(); } ctx.restore(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  for (const r of [R * 0.94, R * 0.55, R * 0.28]) { ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke(); }
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
}

function fieldLines(ctx, cx, cy, R, t, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 6; ctx.setLineDash([18, 14]); ctx.lineDashOffset = -t * 50;
  for (const L of [1.5, 2.1, 2.9]) for (const side of [-1, 1]) {
    ctx.beginPath();
    for (let th = 0.32; th <= Math.PI - 0.32; th += 0.04) { const r = R * L * Math.sin(th) ** 2; if (r < R * 0.98) continue; ctx.lineTo(cx + side * r * Math.sin(th), cy - r * Math.cos(th)); }
    ctx.stroke();
  }
  ctx.restore();
}

function mars(ctx, cx, cy, R, wet = 0, halo = 0.1) {
  hq.glow(ctx, cx, cy, R * (1.05 + halo * 0.6), wet > 0.3 ? 'rgba(125,211,252,A)' : 'rgba(253,186,116,A)', 0.4 + 0.4 * halo);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, cy - R, cy + R, [[0, '#fb923c'], [1, '#9a3412']]); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = 'rgba(124,45,18,0.55)'; for (const [dx, dy, rx, ry] of [[-0.3, 0.1, 0.35, 0.18], [0.35, -0.2, 0.25, 0.12], [0.1, 0.45, 0.4, 0.14]]) { ctx.beginPath(); ctx.ellipse(cx + dx * R, cy + dy * R, rx * R, ry * R, 0.3, 0, TAU); ctx.fill(); }
  if (wet > 0) { ctx.globalAlpha = wet; ctx.fillStyle = '#2563eb'; for (const [dx, dy, rx, ry] of [[-0.35, 0.3, 0.45, 0.25], [0.4, 0.05, 0.3, 0.2]]) { ctx.beginPath(); ctx.ellipse(cx + dx * R, cy + dy * R, rx * R, ry * R, 0.2, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.95, R * 0.35, R * 0.14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(cx + R * 0.45, cy + R * 0.2, R * 0.9, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}

function turtle(ctx, x, y, s, t, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const f = Math.sin(t * 5) * 0.4;
  for (const [fx, fy, a] of [[-40, -40, -0.6 - f], [-40, 40, 0.6 + f], [45, -35, -0.4 + f], [45, 35, 0.4 - f]]) { ctx.save(); ctx.translate(fx, fy); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, Math.sign(fy) * 26, 16, 34, 0, 0, TAU); ctx.fillStyle = '#86efac'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.ellipse(-86, 0, 26, 20, 0, 0, TAU); ctx.fillStyle = '#86efac'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.arc(-96, -6, 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 70, 52, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -52, 52, [[0, '#16a34a'], [1, '#14532d']]); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = 'rgba(253,230,138,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.moveTo(-20, -40); ctx.lineTo(-20, 40); ctx.moveTo(20, -40); ctx.lineTo(20, 40); ctx.stroke();
  ctx.restore();
}

function qmark(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y + 6 * Math.sin(t * 4 + x)); ctx.font = `900 ${s}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeText('?', 0, 0); ctx.fillStyle = '#fde047'; ctx.fillText('?', 0, 0); ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Tierra cortada: el centro brilla al rojo vivo… y se enfría (se apaga y se escarcha).
    const cold = ease((local - 1.0) / 1.3);
    space(ctx, W, H, t);
    cutaway(ctx, 540, 790, 280, t, cold);
    hq.tag(ctx, 540, 430, cold > 0.3 ? 'EL CENTRO, FRÍO' : 'EL CENTRO: METAL DERRETIDO', { size: 34, fill: cold > 0.3 ? '#bae6fd' : '#fdba74' });
  },

  iman(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Brújula enorme con la aguja dando vueltas sin parar.
      sky(ctx, W, 0, 1000, '#7dd3fc', '#f0f9ff'); ground(ctx, W, H, 1000, '#65a30d', '#3f6212');
      const cx = 540, cy = 720, R = 230;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(cx, cy, R + 26, 0, TAU); ctx.fillStyle = '#b45309'; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R + 26, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = '#fef3c7'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.font = '900 54px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
      for (const [l, a] of [['N', -Math.PI / 2], ['E', 0], ['S', Math.PI / 2], ['O', Math.PI]]) ctx.fillText(l, cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.lineWidth = i % 4 ? 3 : 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
      const ang = t * 7 + Math.sin(t * 13) * 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, -R * 0.62); ctx.lineTo(24, 0); ctx.lineTo(-24, 0); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, R * 0.62); ctx.lineTo(24, 0); ctx.lineTo(-24, 0); ctx.closePath(); ctx.fillStyle = '#e5e7eb'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(15,23,42,0.4)'; ctx.lineWidth = 5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, R + 50 + i * 22, -0.6 + i, 0.2 + i); ctx.stroke(); }
      hq.tag(ctx, 540, 410, 'LAS BRÚJULAS SE VUELVEN LOCAS', { size: 38, fill: '#fde047' });
      return;
    }
    // La Tierra cortada con el metal derretido moviéndose y las líneas del imán alrededor.
    space(ctx, W, H, t);
    fieldLines(ctx, 540, 760, 200, t, ease((local - c1) / 0.6));
    cutaway(ctx, 540, 760, 200, t, 0);
    hq.tag(ctx, 540, 410, 'UN IMÁN GIGANTE', { size: 48, fill: '#93c5fd' });
  },

  animales(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Aves dando vueltas en el cielo y una tortuga marina girando perdida bajo el agua.
    const c1 = cue(1);
    sky(ctx, W, 0, 820, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 880, 520, 46, t);
    for (let b = 0; b < 4; b++) { const a = t * 1.8 + b * 1.6, x = 380 + Math.cos(a) * (160 + b * 30), y = 600 + Math.sin(a * 1.3) * 90; ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = INK; const f = Math.sin(t * 14 + b) * 0.5; ctx.beginPath(); ctx.moveTo(-34, -10 - 18 * f); ctx.quadraticCurveTo(-16, -18, 0, 0); ctx.quadraticCurveTo(16, -18, 34, -10 - 18 * f); ctx.stroke(); ctx.restore(); }
    qmark(ctx, 640, 560, 70, t);
    sea(ctx, W, H, 820, t, { top: '#0ea5e9', bottom: '#082f49' });
    turtle(ctx, 540 + Math.cos(t * 1.4) * 180, 1000 + Math.sin(t * 1.4) * 70, 1.05, t, t * 1.4 + Math.PI);
    qmark(ctx, 800, 900, 80, t + 1);
    // Salmón que va y viene.
    const sx = 220 + 90 * Math.sin(t * 2.2), dir = Math.cos(t * 2.2) > 0 ? -1 : 1;
    ctx.save(); ctx.translate(sx, 920); ctx.scale(dir, 1);
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(80, -24); ctx.lineTo(80, 24); ctx.closePath(); ctx.fillStyle = '#f472b6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 54, 22, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -22, 22, [[0, '#94a3b8'], [1, '#fb7185']]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-30, -4, 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
    qmark(ctx, 230, 840, 56, t + 2);
    hq.tag(ctx, 540, 410, local < c1 ? 'SE PERDERÍAN' : 'USAN EL IMÁN PARA ORIENTARSE', { size: local < c1 ? 48 : 36, fill: '#fde047' });
  },

  escudo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // El viento del Sol (puntitos) choca con el escudo y se desvía… sin escudo, arranca el aire de la Tierra.
    const c1 = cue(1), sh = 1 - ease((local - c1) / 0.6), strip = ease((local - c1 - 0.3) / 1.6);
    space(ctx, W, H, t);
    hq.glow(ctx, -60, 760, 520, 'rgba(253,224,71,A)', 0.6);
    ctx.beginPath(); ctx.arc(-60, 760, 230, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, 530, 990, [[0, '#fef08a'], [1, '#f59e0b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const ex = 720, ey = 760, ER = 110;
    // Escudo (burbuja aplastada hacia el Sol).
    if (sh > 0) { ctx.save(); ctx.globalAlpha = sh; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 8; ctx.setLineDash([20, 14]); ctx.lineDashOffset = -t * 40; for (const k of [1, 1.35]) { ctx.beginPath(); ctx.moveTo(W + 40, ey - 300 * k); ctx.quadraticCurveTo(ex - 240 * k, ey - 280 * k, ex - 230 * k, ey); ctx.quadraticCurveTo(ex - 240 * k, ey + 280 * k, W + 40, ey + 300 * k); ctx.stroke(); } ctx.restore(); hq.glow(ctx, ex - 200, ey, 260, 'rgba(96,165,250,A)', 0.18 * sh); }
    // Partículas del viento solar.
    for (let i = 0; i < 46; i++) {
      const y0 = 480 + ((i * 61) % 560), x = 180 + ((t * 320 + i * 97) % 1000), dy = y0 - ey;
      const push = sh * Math.sign(dy || 1) * 300 * Math.exp(-(((x - (ex - 140)) / 220) ** 2)) * clamp(1 - Math.abs(dy) / 330), y = y0 + push;
      if (sh < 0.5 && Math.hypot(x - ex, y - ey) < ER + 10) continue;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.strokeStyle = 'rgba(250,204,21,0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x - 6, y); ctx.stroke();
    }
    // Capa de aire y su «cola» que se escapa.
    if (strip > 0) for (let i = 0; i < 7; i++) { const a = (i / 7 - 0.5) * 1.6, len = 380 * strip; ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * (ER + 14), ey + Math.sin(a) * (ER + 14)); ctx.quadraticCurveTo(ex + 200, ey + Math.sin(a) * 160, ex + 160 + len, ey + Math.sin(a) * 220 + 20 * Math.sin(t * 3 + i)); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.55 * (1 - 0.6 * strip); ctx.lineWidth = 26; ctx.strokeStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(ex, ey, ER + 16, 0, TAU); ctx.stroke(); ctx.restore();
    drawGlobe(ctx, ex, ey, ER, { lon0: t * 10, lat0: 15, outline: 5 });
    hq.tag(ctx, 540, 410, local < c1 ? 'UN ESCUDO CONTRA EL VIENTO DEL SOL' : 'EL AIRE SE ESCAPA', { size: local < c1 ? 34 : 46, fill: local < c1 ? '#93c5fd' : '#fca5a5' });
  },

  tiempo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Alguien duerme en su hamaca; un reloj de arena gigante casi no se mueve; pasan las hojas del calendario.
    const c1 = cue(1);
    sky(ctx, W, 0, 1000, '#fdba74', '#fef3c7');
    sunDisc(ctx, 640, 500, 48, t);
    ground(ctx, W, H, 1000, '#fde68a', '#d97706');
    palm(ctx, 120, 1010, 1.4); palm(ctx, 560, 1010, 1.4);
    // Hamaca (debajo) y la persona dormida encima.
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150, 790); ctx.lineTo(200, 830); ctx.moveTo(600, 790); ctx.lineTo(560, 830); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(195, 828); ctx.quadraticCurveTo(380, 1000, 565, 828); ctx.quadraticCurveTo(380, 930, 195, 828); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(230, 860); ctx.quadraticCurveTo(380, 960, 530, 860); ctx.stroke();
    hq.toon(ctx, 545, 880, 300, { t, seed: 2, shirt: '#22c55e', skin: '#e0ac69', hair: '#7c2d12', lean: -1.45, eyes: 'closed', mouth: 'smile', armL: [0.15, 0.1], armR: [0.15, 0.1], breathe: true });
    ctx.font = '900 46px Inter, sans-serif'; ctx.fillStyle = '#1e3a8a'; ctx.textAlign = 'center'; for (let i = 0; i < 3; i++) { const u = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - u; ctx.fillText('z', 230 + u * 60 + i * 10, 760 - u * 160); } ctx.globalAlpha = 1;
    // Reloj de arena.
    const hx = 850, hy = 760;
    ctx.beginPath(); ctx.moveTo(hx - 110, hy - 220); ctx.lineTo(hx + 110, hy - 220); ctx.lineTo(hx + 14, hy); ctx.lineTo(hx + 110, hy + 220); ctx.lineTo(hx - 110, hy + 220); ctx.lineTo(hx - 14, hy); ctx.closePath(); ctx.fillStyle = 'rgba(224,242,254,0.7)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(hx - 80, hy - 180); ctx.lineTo(hx + 80, hy - 180); ctx.lineTo(hx + 10, hy - 6); ctx.lineTo(hx - 10, hy - 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 100, hy + 214); ctx.lineTo(hx + 100, hy + 214); ctx.lineTo(hx, hy + 190); ctx.closePath(); ctx.fill();
    if (Math.sin(t * 3) > 0) { ctx.fillRect(hx - 2, hy, 4, 190); }
    for (const yy of [hy - 236, hy + 236]) { hq.roundRectPath(ctx, hx - 130, yy - 14, 260, 28, 10); ctx.fillStyle = '#92400e'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); }
    if (local > c1) for (let i = 0; i < 6; i++) { const u = ((local - c1) * 0.9 + i / 6) % 1, x = lerp(1100, -100, u), y = 520 + 60 * Math.sin(u * 6 + i); ctx.save(); ctx.translate(x, y); ctx.rotate(u * 6 + i); hq.roundRectPath(ctx, -40, -50, 80, 100, 8); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.fillRect(-40, -50, 80, 22); ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? 'TÚ NO LO NOTARÍAS' : 'TARDARÍA MILLONES DE AÑOS', { size: 42, fill: '#fde68a' });
  },

  marte(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    space(ctx, W, H, t);
    if (local < c1) {
      // Marte de antes (con agua y aire) se vuelve el Marte de hoy (rojo y seco).
      const k = ease((local - 0.6) / Math.max(1, c1 - 0.8));
      mars(ctx, 540, 760, 260, 1 - k, 1 - k);
      hq.tag(ctx, 540, 410, k < 0.4 ? 'MARTE, HACE MUCHO' : 'MARTE, HOY', { size: 46, fill: '#fdba74' });
      return;
    }
    // Comparación: el aire de la Tierra (capa gruesa) contra el de Marte (casi nada).
    const k = ease((local - c1) / 0.6);
    ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.lineWidth = 46; ctx.strokeStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(300, 760, 170 + 23, 0, TAU); ctx.stroke(); ctx.restore();
    drawGlobe(ctx, 300, 760, 170, { lon0: t * 8, lat0: 15 });
    ctx.save(); ctx.globalAlpha = 0.7 * k; ctx.lineWidth = 3; ctx.strokeStyle = '#fdba74'; ctx.beginPath(); ctx.arc(800, 760, 132, 0, TAU); ctx.stroke(); ctx.restore();
    mars(ctx, 800, 760, 130, 0, 0);
    hq.tag(ctx, 300, 1010, 'TIERRA', { size: 32, fill: '#86efac' }); hq.tag(ctx, 800, 1010, 'MARTE', { size: 32, fill: '#fdba74' });
    hq.tag(ctx, 540, 410, 'SU AIRE: 100 VECES MÁS DELGADO', { size: 38, fill: '#fca5a5' });
  },
};
