// Short 04: ¿Y si la Tierra dejara de girar de golpe? Ritmo rápido: escenas de 3–5 s con cortes.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 4); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  const o = { ...C, t, local, s, cue };
  SCENES[s.id](ctx, o);
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }, top = '#070b24', bottom = '#1e1b4b') => { kit.gradientBG(ctx, W, H, top, bottom); kit.drawStars(ctx, stars, 0.85, t); };
const sky = (ctx, { W, H, kit }, top, bottom, ground = '#5cb85c', gy = 1010) => {
  kit.gradientBG(ctx, W, H, top, bottom);
  ctx.fillStyle = ground; ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, gy, W, 14);
};

/** Señal de ALTO (octágono rojo) que aparece con un salto. */
function stopSign(ctx, kit, x, y, r, k) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12); ctx.scale(k, k);
  const oct = (rr) => { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
  oct(r); kit.shape(ctx, '#ffffff', 8);
  oct(r * 0.88); ctx.fillStyle = '#dc2626'; ctx.fill();
  kit.text(ctx, 'ALTO', 0, 4, { size: r * 0.5, stroke: null });
  ctx.restore();
}

/** Objetos que pasan volando hacia la derecha (personas, coches, árboles, vacas). */
function cloud(ctx, kit, x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath(); ctx.arc(-60, 10, 50, 0, Math.PI * 2); ctx.arc(0, -15, 65, 0, Math.PI * 2); ctx.arc(65, 10, 48, 0, Math.PI * 2); ctx.rect(-60, 10, 125, 50);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

function debris(ctx, o, t0, { n = 14, y0 = 420, y1 = 960, speed = 2300, seed = 9, scale = 1 } = {}) {
  const { kit, local } = o, r = kit.rng(seed);
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#10b981'];
  for (let k = 0; k < n; k++) {
    const kind = k % 4, spawn = t0 + k * 0.17 + r() * 0.1, y = y0 + r() * (y1 - y0), sc = (0.7 + r() * 0.5) * scale, col = colors[k % 5], spin = (r() - 0.3) * 9;
    const tau = local - spawn;
    if (tau < 0) continue;
    const x = -220 + tau * speed * (0.8 + r() * 0.4);
    if (x > o.W + 260) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tau * spin);
    if (kind === 0) kit.person(ctx, 0, 60 * sc, 150 * sc, { shirt: col, arms: 1 });
    else if (kind === 1) kit.car(ctx, 0, 40 * sc, 200 * sc, { color: col });
    else if (kind === 2) kit.tree(ctx, 0, 90 * sc, 190 * sc);
    else cow(ctx, kit, 0, 0, 120 * sc);
    ctx.restore();
  }
}

function cow(ctx, kit, x, y, w) {
  ctx.save(); ctx.translate(x, y);
  for (const lx of [-0.32, -0.12, 0.14, 0.32]) { kit.roundRect(ctx, lx * w - w * 0.05, w * 0.1, w * 0.1, w * 0.3, 4); kit.shape(ctx, '#f8fafc', 4); }
  kit.roundRect(ctx, -w / 2, -w * 0.22, w, w * 0.42, w * 0.12); kit.shape(ctx, '#f8fafc', 5);
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.ellipse(-w * 0.12, -w * 0.05, w * 0.14, w * 0.09, 0.3, 0, Math.PI * 2); ctx.fill();
  kit.roundRect(ctx, w * 0.42, -w * 0.36, w * 0.28, w * 0.3, w * 0.08); kit.shape(ctx, '#f8fafc', 5);
  kit.roundRect(ctx, w * 0.56, -w * 0.18, w * 0.16, w * 0.12, w * 0.05); kit.shape(ctx, '#f9a8d4', 4);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const stop = cue(1), spun = Math.min(local, stop), after = Math.max(0, local - stop);
    // Gira rápido hacia el este; al frenar, un pequeño rebote.
    const lon0 = -95 + (stop - spun) * 150 - (local > stop ? 5 * Math.sin(after * 24) * Math.exp(-after * 6) : 0);
    ctx.save();
    kit.shake(ctx, 34 * Math.pow(kit.impulse(local, stop, 0.7), 2), t);
    drawGlobe(ctx, W / 2, 760, 340, { lon0, lat0: 14 });
    // Flechas de giro mientras gira.
    const spinA = local < stop ? 1 : Math.max(0, 1 - after / 0.15);
    if (spinA > 0) {
      ctx.save(); ctx.globalAlpha = spinA; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      for (const [a0, a1] of [[3.6, 4.4], [0.5, 1.3]]) {
        const sh = (local * 3) % 0.6;
        ctx.beginPath(); ctx.arc(W / 2, 760, 400, a0 + sh, a1 + sh); ctx.stroke();
      }
      ctx.restore();
    }
    stopSign(ctx, kit, 830, 470, 120, local < stop ? 0 : 1 + 0.35 * kit.impulse(local, stop, 0.2));
    ctx.restore();
    kit.flash(ctx, o.W, o.H, 0.75 * kit.impulse(local, stop, 0.22));
  },

  vel(ctx, o) {
    const { W, kit, local, cue, t, ease } = o;
    kit.gradientBG(ctx, W, o.H, '#0f172a', '#1e3a8a');
    kit.drawStars(ctx, stars, 0.3, t);
    const cx = W / 2, cy = 800, R = 380, A0 = Math.PI * 0.85, A1 = Math.PI * 2.15, MAX = 2000;
    const ang = (v) => A0 + (A1 - A0) * (v / MAX);
    ctx.beginPath(); ctx.arc(cx, cy, R + 30, 0, Math.PI * 2); kit.shape(ctx, '#111827', 10);
    // Banda de colores: verde → amarillo → rojo.
    [[0, 900, '#22c55e'], [900, 1400, '#facc15'], [1400, 2000, '#ef4444']].forEach(([a, b, c]) => {
      ctx.beginPath(); ctx.arc(cx, cy, R - 20, ang(a), ang(b)); ctx.strokeStyle = c; ctx.lineWidth = 36; ctx.stroke();
    });
    for (let v = 0; v <= MAX; v += 250) {
      const a = ang(v), big = v % 500 === 0;
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = big ? 8 : 4;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - 60), cy + Math.sin(a) * (R - 60)); ctx.lineTo(cx + Math.cos(a) * (R - (big ? 110 : 85)), cy + Math.sin(a) * (R - (big ? 110 : 85))); ctx.stroke();
      if (big) kit.text(ctx, kit.nf(v), cx + Math.cos(a) * (R - 160), cy + Math.sin(a) * (R - 160), { size: 40, weight: 800, stroke: null });
    }
    const x = ease.out(kit.ramp(local, 0.15, cue(1) + 0.25));
    const v = 1670 * x;
    const a = ang(v);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 40, cy - Math.sin(a) * 40); ctx.lineTo(cx + Math.cos(a) * (R - 80), cy + Math.sin(a) * (R - 80)); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 6);
    kit.text(ctx, `${kit.nf(Math.round(1670 * x))} km/h`, cx, cy + 190, { size: 92, fill: kit.YELLOW });
    kit.text(ctx, 'VELOCIDAD DE GIRO EN EL ECUADOR', cx, cy - R - 90, { size: 40, weight: 800, fill: '#ffffff' });
  },

  vuelo(ctx, o) {
    const { W, kit, local, cue, t } = o;
    sky(ctx, o, '#38bdf8', '#e0f2fe', '#5cb85c', 1080);
    kit.sun(ctx, 900, 330, 80, { t });
    cloud(ctx, kit, 260, 380, 1.1); cloud(ctx, kit, 640, 300, 0.8);
    ctx.fillStyle = '#6b7280'; ctx.fillRect(0, 1110, W, 70);
    ctx.fillStyle = '#f8fafc'; for (let x = 20; x < W; x += 140) ctx.fillRect(x, 1140, 70, 10);
    const L = cue(1), tau = Math.max(0, local - L);
    ctx.save();
    kit.shake(ctx, 22 * kit.impulse(local, L, 0.9) + 26 * kit.impulse(local, cue(2), 0.6), t);
    // Las casas resisten (tiemblan); lo demás sale volando hacia el este (a la derecha).
    const wob = local > L ? Math.sin(t * 13) * 0.018 : 0; // balanceo (no vibración)
    ctx.save(); ctx.translate(175, 1080); ctx.rotate(wob); kit.house(ctx, 0, 0, 300, 250); ctx.restore();
    ctx.save(); ctx.translate(915, 1080); ctx.rotate(-wob); kit.house(ctx, 0, 0, 280, 230, { wall: '#bfdbfe', roofC: '#7c3aed' }); ctx.restore();
    const fly = (x0, y0, i, fn) => {
      const acc = 5200 + i * 1100, x = x0 + 0.5 * acc * tau * tau, y = y0 - 420 * tau, rot = tau * (4 + i * 1.5);
      if (x > W + 300) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); fn(); ctx.restore();
    };
    fly(360, 1165, 1, () => kit.car(ctx, 0, 0, 290, { color: '#ef4444' }));
    fly(720, 1080, 2, () => kit.tree(ctx, 0, 0, 340));
    fly(560, 1080, 0, () => kit.person(ctx, 0, 0, 270, { shirt: '#22c55e', arms: local > L ? 1 : 0 }));
    if (local > L) {
      debris(ctx, o, L + 0.35, { n: 14, y0: 420, y1: 1000, scale: 1.4 });
      kit.speedLines(ctx, W, 380, 1000, t, { n: 22, speed: 3000 });
    }
    // Estampido sónico: anillos que se expanden.
    const tb = local - cue(2);
    if (tb > 0 && tb < 0.8) {
      for (const d of [0, 0.12]) {
        const k = tb - d; if (k <= 0) continue;
        ctx.beginPath(); ctx.ellipse(W / 2, 700, 60 + k * 1500, 40 + k * 1000, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - k / 0.7)})`; ctx.lineWidth = 22; ctx.stroke();
      }
    }
    ctx.restore();
    kit.flash(ctx, W, o.H, 0.5 * kit.impulse(local, L, 0.18) + 0.6 * kit.impulse(local, cue(2), 0.18));
  },

  viento(ctx, o) {
    const { W, kit, local, cue, t } = o;
    sky(ctx, o, '#334155', '#94a3b8', '#4d7c0f', 1030);
    ctx.save();
    [[200, 300], [540, 360], [880, 280]].forEach(([x, h], i) => kit.tree(ctx, x, 1030, h, { lean: 0.85 + 0.12 * Math.sin(t * 11 + i * 2), leaf: '#3f9e4f' }));
    // Hojas y tablas que vuelan.
    const r = kit.rng(31);
    for (let k = 0; k < 40; k++) {
      const y = 380 + r() * 620, v = 1800 + r() * 1600, off = r() * 2000, x = ((off + t * v) % (W + 300)) - 150, big = k % 5 === 0;
      ctx.save(); ctx.translate(x, y + Math.sin(t * 6 + k) * 20); ctx.rotate(t * (6 + r() * 6));
      if (big) { kit.roundRect(ctx, -46, -10, 92, 20, 4); kit.shape(ctx, '#a16207', 4); } else { ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2); kit.shape(ctx, '#4ade80', 3); }
      ctx.restore();
    }
    kit.speedLines(ctx, W, 330, 1020, t, { n: 46, speed: 3600, color: 'rgba(255,255,255,0.6)' });
    ctx.restore();
    // Comparación con flechas: el peor huracán contra el viento de la Tierra frenada (×4).
    const k1 = kit.ramp(local, cue(1), cue(1) + 0.15), k2 = kit.ramp(local, cue(1) + 0.35, cue(1) + 0.75);
    const arrow = (y, len, col, label, a) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 3);
      const x0 = 90, x1 = x0 + len * a;
      ctx.beginPath(); ctx.moveTo(x0, y - 26); ctx.lineTo(x1 - 50, y - 26); ctx.lineTo(x1 - 50, y - 52); ctx.lineTo(x1, y); ctx.lineTo(x1 - 50, y + 52); ctx.lineTo(x1 - 50, y + 26); ctx.lineTo(x0, y + 26); ctx.closePath();
      kit.shape(ctx, col, 7);
      kit.text(ctx, label, x0, y - 82, { size: 40, weight: 900, align: 'left' });
      ctx.restore();
    };
    arrow(440, 225, '#e2e8f0', 'PEOR HURACÁN', k1);
    arrow(620, 900, kit.YELLOW, 'TIERRA FRENADA', k2);
    if (k2 > 0.99) kit.text(ctx, '×4', 720, 430, { size: 150, fill: kit.YELLOW });
  },

  tsunami(ctx, o) {
    const { W, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, o.H, '#1e293b', '#64748b');
    const gy = 1040, Tc = cue(1);
    ctx.fillStyle = '#4d7c0f'; ctx.fillRect(420, gy, W - 420, o.H - gy);
    ctx.fillStyle = '#e7c98f'; ctx.fillRect(380, gy, 120, o.H - gy);
    ctx.fillStyle = '#1e40af'; ctx.fillRect(0, gy + 20, 400, o.H - gy);
    // Frente de la ola: llega a la ciudad en Tc y sigue de largo.
    const x = local < Tc ? -260 + (560 + 260) * kit.ramp(local, 0, Tc) : 560 + (local - Tc) * 330;
    const top = gy - 780;
    ctx.save();
    kit.shake(ctx, 28 * kit.impulse(local, Tc, 1.0), t);
    const blds = [[600, 150, 300, '#64748b'], [760, 130, 460, '#475569'], [900, 150, 360, '#94a3b8'], [1040, 130, 520, '#334155']];
    const drawBlds = () => blds.forEach(([bx, w, h, c], i) => {
      const hit = Math.max(0, x + 150 - (bx - w / 2));
      const rot = Math.min(1.3, hit / 380) * (0.9 + i * 0.05);
      ctx.save(); ctx.translate(bx + w / 2 + hit * 0.3, gy); ctx.rotate(rot); ctx.translate(-w / 2, 0);
      kit.building(ctx, 0, 0, w, h, { color: c, lit: (j) => ((j * 7) % 5 === 0 ? 1 : 0) });
      ctx.restore();
    });
    // Ola con cresta enroscada; los edificios que alcanza se van con ella (se dibujan encima).
    const g = ctx.createLinearGradient(0, top, 0, gy + 100);
    g.addColorStop(0, '#60a5fa'); g.addColorStop(1, '#1e3a8a');
    ctx.beginPath();
    ctx.moveTo(-80, o.H + 60); ctx.lineTo(-80, top + 120);
    ctx.quadraticCurveTo(x - 320, top - 30, x - 60, top);
    ctx.quadraticCurveTo(x + 130, top + 10, x + 120, top + 170);
    ctx.quadraticCurveTo(x + 70, top + 120, x + 20, top + 180);
    ctx.quadraticCurveTo(x + 50, top + 560, x + 200, gy + 60);
    ctx.lineTo(x + 200, o.H + 60); ctx.lineTo(-80, o.H + 60); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = kit.INK; ctx.stroke();
    drawBlds();
    // Espuma en la cresta.
    const r = kit.rng(5);
    for (let k = 0; k < 18; k++) {
      const a = k / 17, fx = x - 300 + a * 400 + Math.sin(t * 9 + k) * 10, fy = top + 10 + Math.pow(a - 0.7, 2) * 240 + r() * 30;
      ctx.beginPath(); ctx.arc(fx, fy, 14 + r() * 16, 0, Math.PI * 2); ctx.fillStyle = '#f8fafc'; ctx.fill();
    }
    // Salpicadura al chocar.
    const sp = local - Tc;
    if (sp > 0 && sp < 1.2) {
      for (let k = 0; k < 26; k++) {
        const a = -Math.PI * (0.15 + 0.7 * r()), v = 900 + r() * 900;
        const px = x + 160 + Math.cos(a) * v * sp, py = gy - 300 + Math.sin(a) * v * sp + 1400 * sp * sp;
        ctx.beginPath(); ctx.arc(px, py, 10 + r() * 14, 0, Math.PI * 2); ctx.fillStyle = `rgba(241,245,249,${1 - sp / 1.2})`; ctx.fill();
      }
    }
    ctx.restore();
    kit.flash(ctx, W, o.H, 0.45 * kit.impulse(local, Tc, 0.2));
  },

  polos(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const k = o.ease.inOut(kit.ramp(local, 0.2, cue(1) + 0.9)), TH = 40 * Math.PI / 180;
    const R = 380, cx = W / 2, cy = 720;
    drawGlobe(ctx, cx, cy, R, {
      lon0: -60, lat0: 0, northCap: true,
      // Debajo de los continentes: el fondo del mar que queda seco en el ecuador.
      under: (c, RR) => { const hh = RR * Math.sin(TH * k); c.fillStyle = '#d6b37a'; c.fillRect(-RR, -hh, 2 * RR, 2 * hh); },
      // Encima: los océanos polares, cada vez más hondos.
      extra: (c, RR) => {
        const y0 = RR * Math.sin(TH);
        c.fillStyle = `rgba(29,78,216,${0.92 * k})`;
        c.fillRect(-RR, -RR, 2 * RR, RR - y0); c.fillRect(-RR, y0, 2 * RR, RR - y0);
      },
    });
    // Flechas: el agua se va hacia los polos.
    const fa = kit.ramp(local, 0.3, 0.6) * (1 - kit.ramp(local, cue(1) + 0.6, cue(1) + 1.0));
    if (fa > 0) {
      ctx.save(); ctx.globalAlpha = fa;
      for (const dir of [-1, 1]) for (const dx of [-170, 0, 170]) {
        const ph = ((t * 1.6 + (dx + 200) / 400) % 1), y = cy + dir * (60 + ph * 200);
        ctx.save(); ctx.translate(cx + dx, y); if (dir > 0) ctx.rotate(Math.PI);
        ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(30, 0); ctx.lineTo(11, 0); ctx.lineTo(11, 34); ctx.lineTo(-11, 34); ctx.lineTo(-11, 0); ctx.lineTo(-30, 0); ctx.closePath();
        kit.shape(ctx, '#7dd3fc', 5); ctx.restore();
      }
      ctx.restore();
    }
    const la = kit.ramp(local, cue(1), cue(1) + 0.25);
    if (la > 0) {
      ctx.save(); ctx.globalAlpha = la;
      kit.text(ctx, 'OCÉANO', cx, cy - R * 0.8, { size: 46, weight: 900 });
      kit.text(ctx, 'OCÉANO', cx, cy + R * 0.8, { size: 46, weight: 900 });
      kit.text(ctx, 'TIERRA FIRME', cx, cy, { size: 58, fill: kit.YELLOW });
      ctx.restore();
    }
  },

  dia(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    kit.sun(ctx, -10, 720, 190, { t });
    const cx = 640, cy = 800, R = 290;
    drawGlobe(ctx, cx, cy, R, {
      lon0: -100, lat0: 12, night: 0,
      extra: (c, RR) => {
        const ng = c.createLinearGradient(-RR * 0.1, 0, RR * 0.2, 0);
        ng.addColorStop(0, 'rgba(3,7,30,0)'); ng.addColorStop(1, 'rgba(3,7,30,0.9)');
        c.fillStyle = ng; c.fillRect(-RR, -RR, 2 * RR, 2 * RR);
        const cold = kit.ramp(local, cue(1) + 0.3, cue(1) + 0.9);
        const fg = c.createLinearGradient(RR * 0.1, 0, RR, 0);
        fg.addColorStop(0, 'rgba(186,230,253,0)'); fg.addColorStop(1, `rgba(186,230,253,${0.45 * cold})`);
        c.fillStyle = fg; c.fillRect(0, -RR, RR, 2 * RR);
      },
    });
    const a1 = kit.ramp(local, cue(1), cue(1) + 0.15), a2 = kit.ramp(local, cue(1) + 0.9, cue(1) + 1.05);
    if (a1 > 0) { ctx.save(); ctx.globalAlpha = a1; kit.text(ctx, 'DÍA', 470, 400, { size: 64, fill: '#fdba74' }); kit.text(ctx, 'CALOR EXTREMO', 470, 455, { size: 32, weight: 800 }); ctx.restore(); }
    if (a2 > 0) { ctx.save(); ctx.globalAlpha = a2; kit.text(ctx, 'NOCHE', 850, 400, { size: 64, fill: '#7dd3fc' }); kit.text(ctx, 'FRÍO EXTREMO', 850, 455, { size: 32, weight: 800 }); ctx.restore(); }
    kit.text(ctx, '1 DÍA = 1 AÑO', W / 2, 290, { size: 84, fill: kit.YELLOW });
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    drawGlobe(ctx, W / 2, 740, 330, { lon0: -t * 40, lat0: 14 });
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    for (const [a0, a1] of [[3.6, 4.4], [0.5, 1.3]]) { const sh = (t * 0.8) % (Math.PI * 2); ctx.beginPath(); ctx.arc(W / 2, 740, 390, a0 + sh, a1 + sh); ctx.stroke(); }
    ctx.restore();
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'SIGUE GIRANDO', W / 2, 330, { size: 92 * (0.8 + 0.2 * k), fill: kit.YELLOW }); ctx.restore(); }
  },
};
