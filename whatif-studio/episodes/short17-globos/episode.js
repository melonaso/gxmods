// Short 17: ¿y si todos los globos del mundo explotaran al mismo tiempo?
// Fiesta que revienta → un globo llega a casi 160 dB → los decibeles no se suman (10 globos: +10 dB;
// un millón: +60 dB) → 1,800 globos meteorológicos al día → el helio se va al espacio → los
// globos aerostáticos no explotan: están abiertos por abajo.

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 17); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const COLS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15'];

/** Globo con el nudo en (x, y + r * 1.2); r = radio. */
function balloon(ctx, kit, x, y, r, col, t, { string = true, sway = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.06 * Math.sin(t * 1.7 + sway));
  if (string) { ctx.strokeStyle = 'rgba(15,23,42,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, r * 1.2); ctx.bezierCurveTo(r * 0.4, r * 1.8, -r * 0.4, r * 2.3, r * 0.1, r * 3.1); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.18, 0, 0, Math.PI * 2); kit.shape(ctx, col, Math.max(3, r * 0.07));
  ctx.beginPath(); ctx.moveTo(-r * 0.14, r * 1.24); ctx.lineTo(r * 0.14, r * 1.24); ctx.lineTo(0, r * 1.12); ctx.closePath(); kit.shape(ctx, col, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.45, r * 0.18, r * 0.32, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Estallido: estrella amarilla con «POP» y pedacitos que salen volando (age 0..1). */
function pop(ctx, kit, x, y, r, col, age, word = true) {
  if (age < 0 || age > 1) return;
  ctx.save(); ctx.translate(x, y);
  const s = r * (0.8 + 0.7 * age);
  ctx.globalAlpha = 1 - age;
  ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? s * 0.55 : s; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); kit.shape(ctx, '#fde047', 4);
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, d = r * (0.6 + 1.6 * age); ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d + age * age * r); ctx.rotate(a + age * 5); ctx.fillStyle = col; ctx.fillRect(-r * 0.18, -r * 0.08, r * 0.36, r * 0.16); ctx.restore(); }
  if (word) kit.text(ctx, 'POP', 0, 4, { size: Math.max(20, r * 0.55), fill: '#dc2626', lw: 5 });
  ctx.restore();
}

/** Barra de decibeles (vertical) con marcas; value en dB. */
function meter(ctx, kit, x, y0, y1, value, marks) {
  const map = (db) => y0 - (y0 - y1) * Math.min(1, db / 200);
  kit.roundRect(ctx, x - 40, y1 - 10, 80, y0 - y1 + 20, 20); kit.shape(ctx, '#1e293b', 6);
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#22c55e'); g.addColorStop(0.5, '#facc15'); g.addColorStop(1, '#ef4444');
  ctx.fillStyle = g; ctx.fillRect(x - 26, map(value), 52, y0 - map(value));
  for (const [db, label, dy = 0] of marks) { const yy = map(db); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 44, yy); ctx.lineTo(x + 70, yy); ctx.stroke(); kit.text(ctx, label, x + 80, yy + dy, { size: 32, fill: '#e2e8f0', align: 'left' }); }
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7c3aed', '#f472b6');
    // Fiesta llena de globos desde el primer fotograma; en la segunda frase revientan todos.
    const r0 = kit.rng(3), P = Math.max(0, cue(1) + 0.25);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, 1120, W, H - 1120);
    for (let i = 0; i < 26; i++) {
      const x = 80 + r0() * (W - 160), y = 540 + r0() * 520, r = 48 + r0() * 34, col = COLS[i % COLS.length], d = r0() * 0.25;
      const bob = 12 * Math.sin(t * 1.8 + i);
      if (local < P + d) balloon(ctx, kit, x, y + bob, r, col, t, { sway: i });
      else pop(ctx, kit, x, y + bob, r, col, (local - P - d) / 0.6);
    }
    kit.flash(ctx, W, H, 0.5 * kit.impulse(local, P, 0.25), '#ffffff');
  },

  ruido(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e3a8a');
    // Oreja gigante y un globo que revienta junto a ella; el medidor salta a ~160 dB.
    ctx.save(); ctx.translate(300, 720);
    ctx.beginPath(); ctx.ellipse(0, 0, 130, 210, 0, 0, Math.PI * 2); kit.shape(ctx, '#e8b48a', 8);
    ctx.beginPath(); ctx.ellipse(10, 0, 70, 130, 0, 0, Math.PI * 2); ctx.lineWidth = 12; ctx.strokeStyle = '#c98b62'; ctx.stroke();
    ctx.beginPath(); ctx.arc(20, 30, 26, 0, Math.PI * 2); ctx.fillStyle = '#7c4a2a'; ctx.fill();
    ctx.restore();
    const P = 0.9;
    if (local < P) balloon(ctx, kit, 520, 640, 70, '#ef4444', t);
    else pop(ctx, kit, 520, 640, 70, '#ef4444', (local - P) / 0.7);
    kit.shake(ctx, 0, t);
    const v = local < P ? 30 : 158 * o.ease.out(kit.ramp(local, P, P + 0.4));
    meter(ctx, kit, 680, 1040, 380, v, [[60, 'PLÁTICA: 60'], [110, 'CONCIERTO: 110'], [158, 'GLOBO: ~160']]);
    const k = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, k > 0.5 ? '¡COMO UN DISPARO!' : 'JUNTO A TU OÍDO', W / 2, 230, { size: 80, fill: k > 0.5 ? '#fca5a5' : '#ffffff', maxW: W * 0.92 });
    void H;
  },

  suma(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#312e81');
    // 1 globo contra 10 globos: el medidor apenas sube 10 dB.
    const ten = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.4);
    const n = ten > 0 ? 10 : 1;
    for (let i = 0; i < n; i++) {
      const c = i % 5, r = Math.floor(i / 5), x = n === 1 ? 320 : 130 + c * 105, y = n === 1 ? 700 : 580 + r * 230;
      ctx.save(); ctx.globalAlpha = n === 1 ? 1 : ten;
      balloon(ctx, kit, x, y, n === 1 ? 90 : 45, COLS[i % COLS.length], t, { sway: i }); ctx.restore();
    }
    meter(ctx, kit, 760, 1040, 380, 150 + 10 * ten, [[150, '1 GLOBO', 22], [160, '10 GLOBOS', -22]]);
    kit.text(ctx, ten > 0.5 ? '×10 GLOBOS = +10 dB' : 'NO SE SUMAN', W / 2, 230, { size: 84, fill: ten > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    if (ten > 0.5) kit.text(ctx, '(NO 10 VECES MÁS FUERTE)', W / 2, 330, { size: 42, fill: '#c7d2fe' });
    void H;
  },

  millon(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#0f172a');
    // Escalera: cada ×10 globos suma +10 dB. De 1 a 1,000,000 son 6 escalones: +60 dB.
    const steps = ['1', '10', '100', '1,000', '10,000', '100,000', '1,000,000'];
    const k = kit.ramp(local, 0.1, cue(1) + 0.4);
    steps.forEach((label, i) => {
      const a = kit.clamp(k * 7 - i); if (a <= 0) return;
      const x = 120 + i * 130, y = 1000 - i * 95;
      ctx.save(); ctx.globalAlpha = a;
      kit.roundRect(ctx, x - 55, y, 130, 1040 - y, 10); kit.shape(ctx, COLS[i], 5);
      kit.text(ctx, label, x + 10, y - 40, { size: i === 6 ? 34 : 38, fill: '#ffffff', maxW: 200 });
      if (i > 0) kit.text(ctx, '+10', x + 10, y + 40, { size: 32, fill: '#0f172a', stroke: null });
      ctx.restore();
    });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? '+60 dB' : '1 MILLÓN DE GLOBOS', W / 2, 230, { size: q > 0.5 ? 120 : 80, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    if (q > 0.5) kit.text(ctx, '6 ESCALONES DE ×10', W / 2, 340, { size: 46, fill: '#c7d2fe' });
    void H;
  },

  clima(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0284c7', '#bae6fd');
    // Globo meteorológico que sube con su cajita de sensores… y revienta.
    const P = cue(1) + 0.1, y = 1000 - 520 * kit.ramp(local, 0, P);
    if (local < P) {
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2, y + 150); ctx.lineTo(W / 2, y + 290); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, y, 150, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 6);
      kit.roundRect(ctx, W / 2 - 40, y + 290, 80, 60, 8); kit.shape(ctx, '#f97316', 5);
    } else {
      pop(ctx, kit, W / 2, y, 150, '#f8fafc', (local - P) / 0.7, true);
      // Pronóstico con signo de interrogación.
      const k = kit.ramp(local, P + 0.4, P + 0.8);
      ctx.save(); ctx.globalAlpha = k; ctx.translate(W / 2, 780);
      kit.roundRect(ctx, -260, -170, 520, 340, 30); kit.shape(ctx, '#ffffff', 7);
      kit.sun(ctx, -110, -30, 60, { t, on: 1 }); kit.text(ctx, '?', 110, -20, { size: 170, fill: '#ef4444' });
      kit.text(ctx, 'PRONÓSTICO', 0, 120, { size: 44, fill: '#0f172a', stroke: null });
      ctx.restore();
    }
    const n = 1800 * o.ease.out(kit.ramp(local, 0.1, cue(1)));
    kit.text(ctx, `${kit.nf(Math.round(n))} AL DÍA`, W / 2, 230, { size: 96, fill: '#ffffff' });
    kit.text(ctx, 'GLOBOS METEOROLÓGICOS', W / 2, 330, { size: 46, fill: '#0f172a', stroke: '#ffffff', lw: 8 });
    void H;
  },

  helio(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#020617', '#1e3a8a');
    kit.drawStars(ctx, stars, 0.8, t);
    // La Tierra abajo con su atmósfera; átomos de helio que suben y se escapan.
    const cy = 1750, R = 900;
    ctx.beginPath(); ctx.arc(W / 2, cy, R + 70, 0, Math.PI * 2); ctx.fillStyle = 'rgba(96,165,250,0.35)'; ctx.fill();
    ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, Math.PI * 2); kit.shape(ctx, '#2563eb', 7);
    const r = kit.rng(9);
    for (let i = 0; i < 18; i++) {
      const x = 120 + r() * (W - 240), ph = r(), sp = 0.25 + r() * 0.2, u = ((local * sp + ph) % 1);
      const y = 930 - u * 760;
      ctx.beginPath(); ctx.arc(x + 20 * Math.sin(t + i), y, 24, 0, Math.PI * 2); kit.shape(ctx, '#fde68a', 4);
      kit.text(ctx, 'He', x + 20 * Math.sin(t + i), y + 1, { size: 22, fill: '#0f172a', stroke: null });
    }
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'Y NO SE FABRICA' : 'SE ESCAPA AL ESPACIO', W / 2, 230, { size: 80, fill: q > 0.5 ? '#fca5a5' : '#ffffff', maxW: W * 0.92 });
    void H;
  },

  aerostaticos(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#38bdf8', '#fef3c7');
    // Globo aerostático con la boca abierta abajo y el quemador encendido.
    const cx = W / 2, cy = 640 + 14 * Math.sin(t * 1.2);
    const stripes = ['#ef4444', '#facc15', '#3b82f6', '#22c55e', '#f97316', '#a855f7'];
    ctx.save(); ctx.translate(cx, cy);
    ctx.beginPath(); ctx.moveTo(-90, 260); ctx.bezierCurveTo(-330, 80, -300, -330, 0, -330); ctx.bezierCurveTo(300, -330, 330, 80, 90, 260); ctx.closePath(); ctx.save(); ctx.clip();
    stripes.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-330 + i * 110, -340, 110, 620); });
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-90, 260); ctx.bezierCurveTo(-330, 80, -300, -330, 0, -330); ctx.bezierCurveTo(300, -330, 330, 80, 90, 260); ctx.lineWidth = 8; ctx.strokeStyle = kit.INK; ctx.stroke();
    // Boca abierta y llama.
    ctx.beginPath(); ctx.ellipse(0, 262, 92, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#1f2937'; ctx.fill();
    const f = 1 + 0.2 * Math.sin(t * 20);
    ctx.beginPath(); ctx.moveTo(-26, 330); ctx.quadraticCurveTo(0, 330 - 120 * f, 26, 330); ctx.closePath(); kit.shape(ctx, '#f97316', 4);
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 5; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 88, 262); ctx.lineTo(sx * 55, 380); ctx.stroke(); }
    kit.roundRect(ctx, -70, 380, 140, 90, 12); kit.shape(ctx, '#a16207', 6);
    ctx.restore();
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q > 0) { ctx.save(); ctx.globalAlpha = q; kit.text(ctx, '← ABIERTO', cx + 250, cy + 262, { size: 50, fill: '#0f172a', stroke: '#ffffff', lw: 10 }); ctx.restore(); }
    kit.text(ctx, q > 0.5 ? 'NO PUEDE EXPLOTAR' : '¿Y ESTOS?', W / 2, 230, { size: 84, fill: q > 0.5 ? '#16a34a' : '#ffffff', stroke: '#0f172a' });
    void H;
  },

  outro(ctx, o) {
    const { W, H, kit, t } = o;
    kit.gradientBG(ctx, W, H, '#7c3aed', '#f472b6');
    const r = kit.rng(5);
    for (let i = 0; i < 12; i++) { const x = 100 + r() * (W - 200), y = 500 + r() * 500 - ((t * 60 + i * 80) % 400); balloon(ctx, kit, x, y, 50 + r() * 20, COLS[i % COLS.length], t, { sway: i }); }
    kit.text(ctx, '¡POP!', W / 2, 300, { size: 120, fill: kit.YELLOW });
  },
};
