// Short 14 (idea de @dulce414): ¿y si dejara de temblar en el mundo?
// Ciudad que tiembla y se queda quieta → 500,000 sismos al año → vidas y alerta sísmica → placas que
// se mueven como crecen las uñas → montañas que se borran → Tierra lisa con un mar de 2.6 km → Marte.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 14); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#1e1b4b'); kit.drawStars(ctx, stars, 0.85, t); };
const sky = (ctx, { W, H, kit }, ground = '#65a30d', gy = 1000) => {
  kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');
  ctx.fillStyle = ground; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, gy, W, 14);
};

/** Fila de edificios con la base en y; shake desplaza todo de lado a lado. */
function city(ctx, kit, y, t, shake = 0, lit = 0) {
  const B = [[110, 160, 360], [280, 150, 480], [450, 170, 320], [630, 150, 540], [810, 170, 420], [980, 130, 340]];
  B.forEach(([x, w, h], i) => {
    const dx = shake * Math.sin(t * 38 + i * 1.7) * (h / 500);
    const rot = shake * 0.006 * Math.sin(t * 31 + i);
    ctx.save(); ctx.translate(x + dx, y); ctx.rotate(rot);
    kit.building(ctx, 0, 0, w, h, { color: ['#64748b', '#475569', '#94a3b8', '#334155', '#78716c', '#57534e'][i], lit: (k) => (lit && (k * 7 + i) % 3 === 0 ? 1 : 0) });
    ctx.restore();
  });
}

/** Mano con una uña que crece (vista de lado). */
function finger(ctx, kit, x, y, s, nail) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  kit.roundRect(ctx, -60, -40, 260, 80, 40); kit.shape(ctx, '#e8b48a', 6);
  ctx.beginPath(); ctx.moveTo(120, -38); ctx.lineTo(150 + nail, -34); ctx.quadraticCurveTo(178 + nail, -18, 160 + nail, -6); ctx.lineTo(120, -8); ctx.closePath(); kit.shape(ctx, '#fde2e4', 5);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    sky(ctx, o);
    // La ciudad tiembla desde el primer fotograma y se queda quieta de golpe.
    const stop = cue(1) + 0.2, amp = local < stop ? 14 : 14 * Math.max(0, 1 - (local - stop) / 0.15);
    ctx.save(); kit.shake(ctx, amp * 0.6, t);
    city(ctx, kit, 1000, t, amp / 14);
    ctx.restore();
    // Ondas del sismo en el suelo mientras tiembla.
    if (local < stop) for (let k = 0; k < 3; k++) { const a = ((local * 1.6 + k / 3) % 1); ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - a)})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(W / 2, 1060, 80 + a * 520, 18 + a * 90, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (local > stop) { const k = kit.ramp(local, stop, stop + 0.2); ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'QUIETO.', W / 2, 520, { size: 90, fill: '#ffffff' }); ctx.restore(); }
  },

  cuantos(ctx, o) {
    const { W, kit, local, cue } = o;
    space(ctx, o);
    // Globo con puntitos de sismos que aparecen sin parar.
    const cx = W / 2, cy = 720, R = 330;
    drawGlobe(ctx, cx, cy, R, { lon0: -100 + local * 8, lat0: 10 });
    const r = kit.rng(5), n = Math.floor(160 * kit.ramp(local, 0, 2.2));
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.95, born = r() * 2.2;
      if (i >= n || local < born) continue;
      const age = (local - born) % 1.2, k = Math.min(1, Math.max(0, 1 - age / 1.2));
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 5 + 16 * (1 - k), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(248,113,113,${0.9 * k})`; ctx.lineWidth = 4; ctx.stroke();
    }
    const count = 500000 * o.ease.out(kit.ramp(local, 0, cue(1)));
    kit.text(ctx, kit.nf(Math.round(count / 1000) * 1000), W / 2, 230, { size: 110, fill: kit.YELLOW });
    kit.text(ctx, 'SISMOS AL AÑO', W / 2, 340, { size: 52, fill: '#ffffff' });
  },

  vidas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e3a8a', '#0f172a');
    // Familia a salvo y el letrero de la alerta sísmica que se apaga.
    for (let i = 0; i < 4; i++) kit.person(ctx, 230 + i * 200, 1040, i === 3 ? 160 : 230, { shirt: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i], arms: 0.15 + 0.1 * Math.sin(t * 3 + i) });
    const off = kit.ramp(local, cue(1), cue(1) + 0.3);
    ctx.save(); ctx.translate(W / 2, 440);
    kit.roundRect(ctx, -330, -120, 660, 240, 26); kit.shape(ctx, off > 0.5 ? '#334155' : '#dc2626', 8);
    const blink = off > 0.5 ? 0 : (Math.sin(t * 12) > 0 ? 1 : 0.6);
    ctx.globalAlpha = 0.4 + 0.6 * blink;
    kit.text(ctx, 'ALERTA', 0, -38, { size: 80, fill: '#ffffff' });
    kit.text(ctx, 'SÍSMICA', 0, 52, { size: 80, fill: '#ffffff' });
    ctx.restore();
    if (off > 0) { ctx.save(); ctx.globalAlpha = off; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(W / 2 - 300, 300); ctx.lineTo(W / 2 + 300, 580); ctx.stroke(); kit.text(ctx, '¡ADIÓS!', W / 2, 230, { size: 80, fill: kit.YELLOW }); ctx.restore(); }
  },

  placas(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#7c2d12', '#431407');
    // Dos placas que se empujan sobre el manto (con flechas), y luego la uña que crece al mismo ritmo.
    const sw = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.3);
    if (sw < 1) {
      ctx.save(); ctx.globalAlpha = 1 - sw;
      const g = ctx.createLinearGradient(0, 700, 0, 1100); g.addColorStop(0, '#ea580c'); g.addColorStop(1, '#9a3412');
      ctx.fillStyle = g; ctx.fillRect(0, 700, W, 400);
      const push = 14 * Math.sin(local * 2);
      ctx.beginPath(); ctx.moveTo(0, 520); ctx.lineTo(W / 2 - 10 + push, 540); ctx.lineTo(W / 2 - 40 + push, 720); ctx.lineTo(0, 720); ctx.closePath(); kit.shape(ctx, '#a16207', 7);
      ctx.beginPath(); ctx.moveTo(W, 520); ctx.lineTo(W / 2 + 10 + push, 540); ctx.lineTo(W / 2 + 40 + push, 720); ctx.lineTo(W, 720); ctx.closePath(); kit.shape(ctx, '#78716c', 7);
      ctx.beginPath(); ctx.moveTo(W / 2 - 60 + push, 540); ctx.lineTo(W / 2 + push, 430); ctx.lineTo(W / 2 + 60 + push, 540); ctx.closePath(); kit.shape(ctx, '#57534e', 6);
      kit.text(ctx, '→', 230, 620, { size: 120, fill: '#fde68a' }); kit.text(ctx, '←', W - 230, 620, { size: 120, fill: '#fde68a' });
      kit.text(ctx, 'PLACAS DE LA TIERRA', W / 2, 260, { size: 70, fill: '#ffffff', maxW: W * 0.92 });
      ctx.restore();
    }
    if (sw > 0) {
      ctx.save(); ctx.globalAlpha = sw;
      const nail = 60 * kit.ramp(local, cue(1), o.s.dur);
      finger(ctx, kit, 300, 700, 2.2, nail);
      kit.text(ctx, '2–10 cm AL AÑO', W / 2, 260, { size: 84, fill: kit.YELLOW });
      kit.text(ctx, 'TUS UÑAS: ~3.5 cm AL AÑO', W / 2, 370, { size: 48, fill: '#ffffff' });
      ctx.restore();
    }
  },

  montanas(ctx, o) {
    const { W, kit, local, cue } = o;
    sky(ctx, o, '#4d7c0f', 1020);
    // Las montañas se van gastando: la cima baja con la lluvia y el viento.
    const er = o.ease.inOut(kit.ramp(local, cue(1) - 0.2, o.s.dur));
    for (const [x, w, h, c] of [[250, 520, 560, '#78716c'], [700, 620, 680, '#57534e'], [980, 400, 420, '#a8a29e']]) {
      const hh = h * (1 - 0.82 * er), top = 1020 - hh;
      ctx.beginPath(); ctx.moveTo(x - w / 2, 1020); ctx.quadraticCurveTo(x - w * 0.15, top + hh * 0.2, x, top); ctx.quadraticCurveTo(x + w * 0.15, top + hh * 0.2, x + w / 2, 1020); ctx.closePath(); kit.shape(ctx, c, 7);
      if (er < 0.5) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - w * 0.12, top + hh * 0.18); ctx.quadraticCurveTo(x, top - 10, x + w * 0.12, top + hh * 0.18); ctx.closePath(); ctx.globalAlpha = 1 - er * 2; ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.restore(); }
    }
    // Lluvia.
    if (local > cue(1) - 0.3) {
      const r = kit.rng(8); ctx.strokeStyle = 'rgba(191,219,254,0.7)'; ctx.lineWidth = 4;
      for (let i = 0; i < 60; i++) { const x = r() * W, y = 150 + ((r() * 700 + local * 900) % 820); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 30); ctx.stroke(); }
    }
    kit.text(ctx, er < 0.1 ? 'MONTAÑAS' : 'SE BORRAN…', W / 2, 230, { size: 84, fill: '#ffffff' });
  },

  oceano(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // La Tierra lisa: todo océano. Debajo, la cuenta.
    const k = kit.ramp(local, 0.2, cue(1));
    drawGlobe(ctx, W / 2, 720, 330, { lon0: -60 + t * 8, lat0: 12, polyColor: (i, base) => (k > 0.98 ? null : `rgba(79,191,90,${1 - k})`), northCap: k < 0.98 });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'MAR DE 2.6 km' : 'TIERRA LISA', W / 2, 230, { size: 96, fill: q > 0.5 ? '#7dd3fc' : '#ffffff' });
    if (q > 0) { ctx.save(); ctx.globalAlpha = q; kit.text(ctx, '1,335 M km³ ÷ 510 M km² ≈ 2.6 km', W / 2, 330, { size: 44, fill: '#e0f2fe', maxW: W * 0.94 }); ctx.restore(); }
  },

  marte(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const mx = W / 2, my = 700, mr = 280;
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = '#c2410c'; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#9a3412'; for (const [dx, dy, r] of [[-90, 40, 70], [70, -60, 50], [110, 90, 60], [-30, 150, 40], [-150, -100, 45]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.ellipse(mx, my - mr + 14, 120, 40, 0, 0, Math.PI * 2); ctx.fill();
    const sh = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.4, mr * 0.1, mx, my, mr * 1.05); sh.addColorStop(0, 'rgba(255,255,255,0.15)'); sh.addColorStop(1, 'rgba(0,0,30,0.45)'); ctx.fillStyle = sh; ctx.fillRect(mx - mr, my - mr, 2 * mr, 2 * mr);
    ctx.restore();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = kit.INK; ctx.stroke();
    kit.text(ctx, 'MARTE', W / 2, 230, { size: 96, fill: '#fb923c' });
    const z = kit.ramp(local, cue(1), cue(1) + 0.4);
    if (z > 0) { ctx.save(); ctx.globalAlpha = z; for (let i = 0; i < 3; i++) kit.text(ctx, 'z', mx + mr * 0.7 + i * 50, my - mr * 0.7 - i * 60 - 10 * Math.sin(t * 3 + i), { size: 60 + i * 16, fill: '#e0e7ff' }); ctx.restore(); }
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    sky(ctx, o);
    city(ctx, kit, 1000, t, 0);
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE @dulce414', W / 2, 300, { size: 64, fill: kit.YELLOW }); ctx.restore(); }
  },
};
