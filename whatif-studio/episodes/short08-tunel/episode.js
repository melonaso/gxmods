// Short 08: ¿Y si cayeras por un túnel que atraviesa la Tierra? Corte de la Tierra con el túnel →
// de México al océano Índico → caída hasta 28,000 km/h → núcleo a 5,000 °C → ingravidez en el centro →
// ida y vuelta para siempre (sin aire) → flotando en el centro (con aire) → el pozo real de 12 km.
import { drawGlobe, project } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(240, C.W, C.H, 23); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#020617', '#172554'); kit.drawStars(ctx, stars, 0.85, t); };
const CX = 540, CY = 800, RS = 400;      // corte de la Tierra (centro y radio en pantalla)
const DEPTH = 0.94;                       // el personaje viaja entre -0.94 R y +0.94 R

/** Corte de la Tierra por la mitad: corteza, manto, núcleo externo e interno; túnel vertical. */
function section(ctx, kit, cx, cy, R, { tunnel = 1, glow = 1 } = {}) {
  ctx.save();
  const halo = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.12);
  halo.addColorStop(0, 'rgba(125,211,252,0.4)'); halo.addColorStop(1, 'rgba(125,211,252,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2); ctx.fill();
  const ring = (r, fill) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  ring(R, '#22c55e');                                   // superficie
  ring(R * 0.975, '#92400e');                           // corteza
  const m = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 0.95);
  m.addColorStop(0, '#f97316'); m.addColorStop(1, '#c2410c');
  ring(R * 0.95, m);                                    // manto
  const oc = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 0.546);
  oc.addColorStop(0, '#fde047'); oc.addColorStop(1, '#fb923c');
  ring(R * 0.546, oc);                                  // núcleo externo (metal líquido)
  const ic = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.19 * (1 + 0.6 * glow));
  ic.addColorStop(0, '#ffffff'); ic.addColorStop(1, '#fef08a');
  ring(R * 0.19, ic);                                   // núcleo interno
  if (tunnel > 0) {
    const w = Math.max(18, R * 0.1), len = 2 * R * tunnel;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(cx - w / 2, cy - R, w, len);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
    ctx.strokeRect(cx - w / 2, cy - R, w, len);
  }
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 7; ctx.strokeStyle = kit.INK; ctx.stroke();
  ctx.restore();
}

/** Personaje cayendo de cabeza (pos: -1 arriba … 0 centro … +1 abajo). Con estela si va rápido. */
function faller(ctx, kit, cx, cy, R, pos, vel = 0, h = 112) {
  const y = cy + pos * R * DEPTH;
  if (Math.abs(vel) > 0.4) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const dx of [-26, 0, 26]) { const L = Math.min(160, Math.abs(vel) * 70); ctx.beginPath(); ctx.moveTo(cx + dx, y - Math.sign(vel) * (h * 0.6)); ctx.lineTo(cx + dx, y - Math.sign(vel) * (h * 0.6 + L)); ctx.stroke(); }
    ctx.restore();
  }
  // Cabeza hacia donde va.
  kit.person(ctx, cx, y + (vel >= 0 ? -h / 2 : h / 2), h, { shirt: '#ef4444', arms: 1, rot: vel >= 0 ? Math.PI : 0 });
}

function pin(ctx, kit, x, y, label, a = 1, color = '#ef4444') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-34, -48, -30, -86, 0, -86); ctx.bezierCurveTo(30, -86, 34, -48, 0, 0); kit.shape(ctx, color, 6);
  ctx.beginPath(); ctx.arc(0, -60, 12, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
  kit.text(ctx, label, 0, -120, { size: 44, weight: 900 });
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { kit, local, cue } = o;
    space(ctx, o);
    const tun = o.ease.inOut(kit.ramp(local, 0.15, cue(1) + 0.6));
    section(ctx, kit, CX, CY, RS, { tunnel: tun });
    // Taladro en la punta del túnel mientras avanza.
    if (tun > 0 && tun < 1) {
      const y = CY - RS + 2 * RS * tun;
      ctx.beginPath(); ctx.moveTo(CX - 26, y - 30); ctx.lineTo(CX + 26, y - 30); ctx.lineTo(CX, y + 22); ctx.closePath(); kit.shape(ctx, '#94a3b8', 5);
    }
    // El personaje en la orilla; salta al túnel.
    const J = cue(2) + 0.1, jt = kit.clamp((local - J) / 0.5);
    const x = CX + 90 - 90 * jt, y = CY - RS - 160 * Math.sin(Math.PI * jt) + 120 * jt * jt;
    if (local < J + 0.5) kit.person(ctx, x, y, 110, { shirt: '#ef4444', arms: local > J ? 1 : 0.1, rot: Math.PI * jt });
    else faller(ctx, kit, CX, CY, RS, -1 + 0.12 * (local - J - 0.5) ** 2, 1);
  },

  mexico(ctx, o) {
    const { W, kit, local, cue } = o;
    space(ctx, o);
    // Gira la Tierra de México (19° N, 99° O) a su punto opuesto (19° S, 81° E).
    const kAt = (tt) => o.ease.inOut(kit.ramp(tt, cue(1) - 0.6, cue(1) + 0.75));
    const k = kAt(local), R = 380, cx = W / 2, cy = 780;
    const lon0 = -99 + 180 * k, lat0 = 19 - 38 * k;
    // Desenfoque de movimiento mientras gira rápido: promedio de 6 instantes dentro del fotograma
    // (así las costas no «saltan» de un fotograma a otro).
    const N = kAt(local + 0.017) - kAt(local - 0.017) > 0.004 ? 6 : 1;
    for (let i = 0; i < N; i++) {
      const kk = N > 1 ? kAt(local + (i / (N - 1) - 0.5) * 0.033) : k;
      ctx.globalAlpha = 1 / (i + 1);
      drawGlobe(ctx, cx, cy, R, { lon0: -99 + 180 * kk, lat0: 19 - 38 * kk });
    }
    ctx.globalAlpha = 1;
    const [mx, my, mv] = project(-99, 19, lon0, lat0, R);
    const [ax, ay, av] = project(81, -19, lon0, lat0, R);
    if (mv) pin(ctx, kit, cx + mx, cy + my, 'MÉXICO', 1 - k * 2);
    if (av) {
      const a = kit.ramp(local, cue(1) + 0.65, cue(1) + 0.85);
      if (a > 0) {
        // Salpicadura: sales en medio del mar.
        ctx.save(); ctx.globalAlpha = a;
        ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 6;
        for (const r of [30, 55]) { ctx.beginPath(); ctx.ellipse(cx + ax, cy + ay, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
        pin(ctx, kit, cx + ax, cy + ay, 'OCÉANO ÍNDICO', a, '#2563eb');
      }
    }
  },

  caida(ctx, o) {
    const { W, kit, local, cue } = o;
    space(ctx, o);
    section(ctx, kit, CX, CY, RS);
    // Movimiento armónico: cae cada vez más rápido y pasa por el centro al decir «el centro».
    const Tc = cue(2) + 0.15, ph = (Math.PI / 2) * local / Tc;
    faller(ctx, kit, CX, CY, RS, -Math.cos(ph), Math.sin(ph) * 2.2);
    const v = 28000 * Math.sin(Math.min(ph, Math.PI / 2));
    kit.text(ctx, `${kit.nf(Math.round(v / 100) * 100)} km/h`, W / 2, 300, { size: 110, fill: kit.YELLOW });
  },

  calor(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // Acercamiento al núcleo (el corte en grande).
    section(ctx, kit, W / 2, 900, 1500, { glow: 0.5 + 0.5 * Math.sin(t * 3) });
    // Ondas de calor.
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const x = 200 + i * 140, ph = (t * 0.7 + i * 0.37) % 1, y = 1000 - ph * 300;
      ctx.globalAlpha = 0.6 * (1 - ph); ctx.beginPath();
      for (let k = 0; k < 8; k++) ctx.lineTo(x + Math.sin(k * 1.3 + t * 4) * 10, y - k * 14);
      ctx.stroke();
    }
    ctx.restore();
    kit.text(ctx, 'NÚCLEO', W / 2, 900, { size: 54, fill: '#7c2d12', stroke: '#fef9c3', lw: 8 });
    const temp = 5000 * o.ease.out(kit.ramp(local, 0.1, cue(1) - 0.2));
    const done = temp >= 4999;
    kit.text(ctx, done ? 'MÁS DE 5,000 °C' : `${kit.nf(Math.round(temp / 50) * 50)} °C`, W / 2, 330, { size: done ? 100 : 120, fill: '#ffffff', stroke: '#7c2d12', lw: 16, maxW: W * 0.9 });
    const sk = kit.ramp(local, cue(1), cue(1) + 0.25);
    if (sk > 0) {
      ctx.save(); ctx.globalAlpha = sk;
      kit.sun(ctx, 860, 560, 75 * (0.7 + 0.3 * sk), { t });
      kit.text(ctx, '≈', 700, 560, { size: 110, fill: '#ffffff', stroke: '#7c2d12', lw: 12 });
      kit.text(ctx, 'SUPERFICIE DEL SOL', 860, 680, { size: 34, weight: 900, stroke: '#7c2d12', lw: 8 });
      ctx.restore();
    }
  },

  centro(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    section(ctx, kit, W / 2, 820, 1500, { glow: 0.6 });
    // Flotando en el centro, con una báscula que también flota.
    const bob = Math.sin(t * 2) * 12, rot = Math.sin(t * 1.3) * 0.25;
    kit.person(ctx, W / 2, 760 + bob, 230, { shirt: '#ef4444', arms: 0.9, rot });
    const kg = Math.round(70 * (1 - kit.ramp(local, 0.2, cue(1) + 0.2)));
    ctx.save(); ctx.translate(W / 2, 900 + bob * 0.6); ctx.rotate(-rot * 0.5);
    kit.roundRect(ctx, -130, -26, 260, 70, 18); kit.shape(ctx, '#e2e8f0', 7);
    kit.roundRect(ctx, -70, -10, 140, 40, 8); kit.shape(ctx, '#0f172a', 4);
    kit.text(ctx, `${kg} kg`, 0, 10, { size: 34, fill: kg === 0 ? '#4ade80' : '#7dd3fc', stroke: null });
    ctx.restore();
    if (kg === 0) kit.text(ctx, '0 kg', W / 2, 330, { size: 120, fill: '#4ade80' });
  },

  vuelta(ctx, o) {
    const { W, kit, local, cue } = o;
    space(ctx, o);
    section(ctx, kit, CX, CY, RS);
    // Del centro al otro lado (llega justo a la superficie) y luego ida y vuelta para siempre.
    const A = cue(1);
    let ph, vel;
    if (local < A) { ph = Math.PI / 2 + (Math.PI / 2) * kit.clamp(local / A); vel = Math.sin(ph) * 2; }
    else { ph = Math.PI + (local - A) * 3.2; vel = Math.sin(ph) * 2.6; }
    faller(ctx, kit, CX, CY, RS, -Math.cos(ph), vel);
    const label = local < A ? `${Math.round(20 + 20 * kit.clamp(local / A))} MIN` : '∞';
    kit.text(ctx, label, W / 2, 240, { size: 120, fill: kit.YELLOW });
    kit.text(ctx, 'OCÉANO ÍNDICO', CX + 255, CY + RS - 100, { size: 34, weight: 900, fill: '#7dd3fc' });
    kit.text(ctx, 'MÉXICO', CX + 200, CY - RS + 20, { size: 34, weight: 900 });
  },

  aire(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    section(ctx, kit, CX, CY, RS);
    // Sin aire: ida y vuelta completa. Con aire: cada vuelta es más corta hasta quedar en el centro.
    const D = cue(1), amp = local < D ? 1 : Math.exp(-1.7 * (local - D));
    const ph = Math.PI + local * 3.2;
    const pos = -Math.cos(ph) * amp + (local > cue(2) ? Math.sin(t * 2) * 0.02 : 0);
    faller(ctx, kit, CX, CY, RS, pos, Math.sin(ph) * 2.6 * amp);
    // Aire: rayitas que se mueven dentro del túnel.
    if (local >= D) {
      ctx.save(); ctx.strokeStyle = 'rgba(203,213,225,0.7)'; ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) { const y = CY - RS + ((i * 57 + t * 90) % (2 * RS)); ctx.beginPath(); ctx.moveTo(CX - 10, y); ctx.lineTo(CX + 10, y + 10); ctx.stroke(); }
      ctx.restore();
    }
    kit.text(ctx, local < D ? 'SIN AIRE' : 'CON AIRE', W / 2, 300, { size: 110, fill: local < D ? '#ffffff' : kit.YELLOW });
  },

  pozo(ctx, o) {
    const { W, H, kit, local, cue } = o;
    // Corte de la corteza: 0 a 35 km de profundidad (18 px por km).
    const top = 480, px = 18, depth = 12 * o.ease.out(kit.ramp(local, 0.1, cue(1) + 0.2));
    kit.gradientBG(ctx, W, top, '#38bdf8', '#bae6fd');
    ctx.fillStyle = '#92400e'; ctx.fillRect(0, top, W, 35 * px);
    for (let i = 1; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(0, top + i * 6 * px, W, 3 * px); }
    ctx.fillStyle = '#ea580c'; ctx.fillRect(0, top + 35 * px, W, H - top - 35 * px);
    ctx.fillStyle = '#16a34a'; ctx.fillRect(0, top - 16, W, 22);
    // Escala de profundidad.
    for (const km of [0, 10, 20, 30]) { ctx.fillStyle = '#fef3c7'; ctx.fillRect(40, top + km * px - 3, 40, 6); kit.text(ctx, `${km} km`, 95, top + km * px, { size: 32, weight: 800, align: 'left', lw: 7 }); }
    // Torre de perforación y el pozo.
    const bx = 640;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(bx - 70, top - 10); ctx.lineTo(bx, top - 220); ctx.lineTo(bx + 70, top - 10);
    for (let k = 1; k < 4; k++) { const y = top - 10 - k * 52, dx = 70 * (1 - k * 0.24); ctx.moveTo(bx - dx, y); ctx.lineTo(bx + dx, y); }
    ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.fillRect(bx - 6, top, 12, depth * px);
    if (depth > 0.5) {
      ctx.beginPath(); ctx.moveTo(bx + 30, top + depth * px); ctx.lineTo(bx + 90, top + depth * px); ctx.lineWidth = 5; ctx.strokeStyle = '#fef3c7'; ctx.stroke();
      kit.text(ctx, `POZO: ${kit.nf(depth, depth >= 11.95 ? 0 : 1)} km`, bx + 105, top + depth * px, { size: 40, align: 'left', fill: kit.YELLOW });
    }
    // Fin de la corteza (≈35 km) y el centro, muchísimo más abajo.
    const ck = kit.ramp(local, cue(2), cue(2) + 0.2);
    if (ck > 0) {
      ctx.save(); ctx.globalAlpha = ck; ctx.setLineDash([22, 14]); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0, top + 35 * px); ctx.lineTo(W, top + 35 * px); ctx.stroke(); ctx.setLineDash([]);
      kit.text(ctx, 'AQUÍ TERMINA LA CORTEZA (~35 km)', W / 2, top + 35 * px - 40, { size: 38, fill: '#ffffff' });
      ctx.restore();
    }
    kit.text(ctx, 'EL CENTRO ESTÁ A 6,371 km ↓', W / 2, 220, { size: 46, fill: '#ffffff' });
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    drawGlobe(ctx, W / 2, 780, 330, { lon0: -99 - t * 30, lat0: 18 });
    const k = kit.ramp(local, 0, 0.25);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, '¿Y SI…?', W / 2, 330, { size: 130 * (0.8 + 0.2 * k), fill: kit.YELLOW }); ctx.restore(); }
    // Flecha que rebota hacia los comentarios.
    const y = 1340 + Math.abs(Math.sin(t * 4)) * 26;
    ctx.beginPath(); ctx.moveTo(W / 2 - 40, y - 40); ctx.lineTo(W / 2 + 40, y - 40); ctx.lineTo(W / 2, y); ctx.closePath(); kit.shape(ctx, kit.YELLOW, 6);
  },
};
