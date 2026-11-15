// Short 27 (sin voz, entretenido): ¿y si fueras invisible?
// Pocion → la ropa camina sola → la galleta flota → se ve en tu panza → el perro te huele → la lluvia
// te dibuja → lo peor: estarías ciego (la luz te atraviesa los ojos) → vuelve a la poción (bucle).
// Cada escena en un lugar distinto, frases cortas y sin números.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const FLOOR = 1090;

/** Niño: mode 'full' (normal), 'clothes' (solo la ropa) o 'ghost' (contorno punteado, invisible). */
function kid(ctx, kit, x, y, h, { mode = 'full', arms = 0, shirt = '#ef4444', pants = '#1d4ed8', skin = '#e8b48a', alpha = 1, rot = 0, mouth = 'smile', ghostColor = 'rgba(255,255,255,0.7)', solid = false, gw = 5 } = {}) {
  const w = h * 0.34, leg = h * 0.42, body = h * 0.34, head = h * 0.24, L = Math.max(3, h * 0.03);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= alpha;
  const ghost = mode === 'ghost';
  if (ghost && !solid) ctx.setLineDash([14, 10]);
  const part = (fill) => { if (ghost) { ctx.lineWidth = gw; ctx.strokeStyle = ghostColor; ctx.stroke(); } else kit.shape(ctx, fill, L); };
  kit.roundRect(ctx, -w * 0.44, -leg, w * 0.38, leg, h * 0.03); part(pants);
  kit.roundRect(ctx, w * 0.06, -leg, w * 0.38, leg, h * 0.03); part(pants);
  for (const sg of [-1, 1]) {
    ctx.save(); ctx.translate(sg * w * 0.5, -leg - body * 0.92); ctx.rotate(sg * (0.12 + arms * 2.6));
    kit.roundRect(ctx, -w * 0.13, 0, w * 0.26, body * 0.62, h * 0.03); part(shirt);
    if (mode !== 'clothes') { kit.roundRect(ctx, -w * 0.12, body * 0.6, w * 0.24, body * 0.28, h * 0.03); part(skin); }
    ctx.restore();
  }
  kit.roundRect(ctx, -w / 2, -leg - body, w, body, h * 0.04); part(shirt);
  if (mode !== 'clothes') {
    kit.roundRect(ctx, -head / 2, -leg - body - head, head, head, h * 0.05); part(skin);
    if (!ghost) {
      ctx.fillStyle = kit.INK;
      ctx.fillRect(-head * 0.26, -leg - body - head * 0.62, head * 0.12, head * 0.18);
      ctx.fillRect(head * 0.14, -leg - body - head * 0.62, head * 0.12, head * 0.18);
      ctx.beginPath();
      if (mouth === 'o') ctx.arc(0, -leg - body - head * 0.25, head * 0.09, 0, TAU);
      else ctx.arc(0, -leg - body - head * 0.32, head * 0.16, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 4; ctx.strokeStyle = kit.INK; mouth === 'o' ? ctx.fill() : ctx.stroke();
    }
  }
  ctx.restore();
}

/** Poción verde que brilla; (x, y) = centro de la bola del frasco. */
function potion(ctx, kit, x, y, s, t, rot = 0, fill = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 1.4); g.addColorStop(0, `rgba(134,239,172,${0.6 * fill})`); g.addColorStop(1, 'rgba(134,239,172,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 1.4, 0, TAU); ctx.fill();
  kit.roundRect(ctx, -s * 0.18, -s * 0.95, s * 0.36, s * 0.5, 6); kit.shape(ctx, 'rgba(255,255,255,0.7)', 4);
  kit.roundRect(ctx, -s * 0.22, -s * 1.12, s * 0.44, s * 0.2, 6); kit.shape(ctx, '#92400e', 4);
  ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, TAU); kit.shape(ctx, 'rgba(255,255,255,0.7)', 5);
  if (fill > 0) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.clip(); ctx.fillStyle = '#22c55e'; ctx.fillRect(-s, s * 0.5 - s * fill, s * 2, s * 2); ctx.restore(); }
  for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; ctx.beginPath(); ctx.arc(-s * 0.2 + i * s * 0.2, s * 0.3 - u * s * 0.6, s * 0.06, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill(); }
  ctx.restore();
}

function cookie(ctx, kit, x, y, r, bite = 0) {
  ctx.save();
  if (bite > 0) { ctx.beginPath(); ctx.rect(x - r * 2, y - r * 2, r * 4, r * 4); ctx.arc(x + r * 0.9, y - r * 0.5, r * 0.45 * bite, 0, TAU, true); ctx.clip(); }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); kit.shape(ctx, '#d6a35c', Math.max(3, r * 0.08));
  ctx.fillStyle = '#5b3412'; for (const [dx, dy] of [[-0.35, -0.3], [0.3, -0.2], [-0.1, 0.35], [0.4, 0.3], [-0.45, 0.15]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.11, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function bubble(ctx, kit, x, y, text, size = 46) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 50, h = size * 1.6;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); kit.shape(ctx, '#ffffff', 5);
  ctx.beginPath(); ctx.moveTo(x - 10, y + h / 2 - 2); ctx.lineTo(x + 6, y + h / 2 + 26); ctx.lineTo(x + 22, y + h / 2 - 2); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill: '#0f172a', stroke: null });
}

function puff(ctx, x, y, r, age) {
  if (age < 0 || age > 1) return;
  ctx.save(); ctx.globalAlpha = 1 - age; ctx.fillStyle = '#ffffff';
  const s = r * (0.6 + age);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s * 0.5, s * 0.45, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function sparkles(ctx, x, y, r, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 8; i++) {
    const ang = i * 0.8 + t * 1.5, d = r * (0.6 + 0.4 * Math.sin(t * 3 + i)), sx = x + Math.cos(ang) * d, sy = y + Math.sin(ang) * d, s = 10 + 6 * Math.sin(t * 6 + i);
    ctx.beginPath(); for (let k = 0; k < 8; k++) { const aa = (k / 8) * TAU, rr = k % 2 ? s * 0.3 : s; ctx.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function bedroom(ctx, o) {
  const { W, H, kit } = o;
  kit.gradientBG(ctx, W, H, '#a78bfa', '#c4b5fd');
  ctx.fillStyle = '#92400e'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
  kit.roundRect(ctx, 70, 470, 230, 260, 10); kit.shape(ctx, '#1e3a8a', 8);
  ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(230, 540, 34, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(185, 470); ctx.lineTo(185, 730); ctx.moveTo(70, 600); ctx.lineTo(300, 600); ctx.stroke();
  kit.roundRect(ctx, 760, 900, 320, 190, 16); kit.shape(ctx, '#f472b6', 6);
  kit.roundRect(ctx, 780, 870, 110, 60, 20); kit.shape(ctx, '#ffffff', 5);
}

function street(ctx, o) {
  const { W, H, kit } = o;
  kit.gradientBG(ctx, W, H, '#38bdf8', '#bae6fd');
  kit.house(ctx, 180, 860, 280, 230, { wall: '#fde68a' });
  kit.house(ctx, 900, 860, 300, 250, { wall: '#bbf7d0', roofC: '#2563eb' });
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 860, W, 230);
  ctx.fillStyle = '#475569'; ctx.fillRect(0, FLOOR - 10, W, H - FLOOR + 10);
}

function kitchen(ctx, o) {
  const { W, H, kit } = o;
  kit.gradientBG(ctx, W, H, '#fef3c7', '#fde68a');
  ctx.strokeStyle = 'rgba(180,83,9,0.15)'; ctx.lineWidth = 3;
  for (let y = 420; y < 900; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  kit.roundRect(ctx, 0, 880, 640, 210, 0); kit.shape(ctx, '#78350f', 6);
  ctx.fillStyle = '#e7e5e4'; ctx.fillRect(0, 870, 640, 24);
  ctx.fillStyle = '#d6d3d1'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
}

function park(ctx, o) {
  const { W, H, kit } = o;
  kit.gradientBG(ctx, W, H, '#7dd3fc', '#e0f2fe');
  kit.tree(ctx, 900, FLOOR, 420, {});
  ctx.fillStyle = '#4ade80'; ctx.fillRect(0, FLOOR - 20, W, H - FLOOR + 20);
}

/** Perro de perfil mirando a la derecha; (x, y) = patas. */
function dog(ctx, kit, x, y, s, t, wag = 1) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
  const tw = Math.sin(t * 14 * wag) * 0.5;
  ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.55); ctx.quadraticCurveTo(-s * 0.85, -s * (0.9 + 0.2 * tw), -s * (0.75 + 0.15 * tw), -s * 1.05); ctx.stroke();
  for (const lx of [-0.4, -0.2, 0.25, 0.42]) { kit.roundRect(ctx, lx * s - s * 0.06, -s * 0.4, s * 0.12, s * 0.4, s * 0.05); kit.shape(ctx, '#b45309', 4); }
  ctx.beginPath(); ctx.ellipse(0, -s * 0.52, s * 0.62, s * 0.26, 0, 0, TAU); kit.shape(ctx, '#d97706', 5);
  ctx.beginPath(); ctx.arc(s * 0.62, -s * 0.8, s * 0.26, 0, TAU); kit.shape(ctx, '#d97706', 5);
  ctx.beginPath(); ctx.ellipse(s * 0.88, -s * 0.74, s * 0.15, s * 0.1, 0, 0, TAU); kit.shape(ctx, '#f59e0b', 4);
  ctx.beginPath(); ctx.arc(s * 1.0, -s * 0.78, s * 0.05, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.5, -s * 0.92, s * 0.08, s * 0.18, -0.4, 0, TAU); kit.shape(ctx, '#78350f', 4);
  ctx.beginPath(); ctx.arc(s * 0.7, -s * 0.86, s * 0.04, 0, TAU); ctx.fillStyle = kit.INK; ctx.fill();
  ctx.restore();
}

function heart(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.4, -s, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.3, 0, s * 0.35); ctx.fill(); ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    bedroom(ctx, o);
    // Se toma la poción… ¡puf! Solo queda la ropa flotando (y el frasco).
    const P = Math.max(0.4, cue(1) + 0.15), bob = 10 * Math.sin(t * 3);
    if (local < P) {
      const drink = kit.ramp(local, 0.1, P - 0.1);
      kid(ctx, kit, 520, FLOOR, 470, { arms: 0.15 + 0.3 * drink });
      potion(ctx, kit, 640 - 40 * drink, 700 - 120 * drink, 70, t, -1.2 * drink, 1 - 0.8 * drink);
    } else {
      kid(ctx, kit, 520, FLOOR - 20 + bob, 470, { mode: 'clothes', arms: 0.15 });
      potion(ctx, kit, 640, 760 + bob, 70, t, 0.3, 0.2);
      puff(ctx, 520, 760, 240, (local - P) / 0.6);
      sparkles(ctx, 520, 760, 230, t, kit.ramp(local, P, P + 0.3));
    }
    kit.flash(ctx, W, H, 0.6 * kit.impulse(local, P, 0.3), '#bbf7d0');
  },

  calle(ctx, o) {
    const { kit, local, t } = o;
    street(ctx, o);
    // La ropa camina sola por la calle y los vecinos se asustan.
    const x = 160 + 260 * kit.ramp(local, 0, 2.2), step = Math.sin(t * 8) * 8;
    kid(ctx, kit, x, FLOOR - Math.abs(step), 400, { mode: 'clothes', arms: 0.08 + 0.05 * Math.sin(t * 8) });
    const scared = kit.ramp(local, 0.4, 0.6);
    kit.person(ctx, 820, FLOOR, 360, { shirt: '#a855f7', arms: 0.2 + 0.75 * scared });
    kit.person(ctx, 960, FLOOR, 300, { shirt: '#f97316', arms: 0.2 + 0.75 * scared });
    if (scared > 0.5) bubble(ctx, kit, 820, 560, '¡UN FANTASMA!', 44);
  },

  cocina(ctx, o) {
    const { kit, local, cue, t } = o;
    kitchen(ctx, o);
    // El tarro de galletas; una sale volando hacia el niño invisible. La mamá no entiende nada.
    kit.roundRect(ctx, 150, 700, 190, 180, 30); kit.shape(ctx, 'rgba(255,255,255,0.65)', 6);
    kit.roundRect(ctx, 140, 680, 210, 40, 14); kit.shape(ctx, '#ef4444', 5);
    for (const [cx, cy] of [[195, 830], [270, 845], [235, 790]]) cookie(ctx, kit, cx, cy, 34);
    kid(ctx, kit, 520, FLOOR, 440, { mode: 'ghost', arms: 0.35, ghostColor: 'rgba(30,41,59,0.5)' });
    const k = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.6);
    const cx = 245 + (560 - 245) * k, cy = 650 - 120 * Math.sin(k * Math.PI) + (720 - 650) * k;
    cookie(ctx, kit, cx + 6 * Math.sin(t * 6), cy, 46);
    kit.person(ctx, 900, FLOOR, 420, { shirt: '#ec4899', arms: k > 0.3 ? 0.9 : 0.1 });
    if (k > 0.3) bubble(ctx, kit, 900, 520, '¿¡QUÉ!?', 52);
  },

  panza(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0c4a6e', '#082f49');
    // Acercamiento al cuerpo invisible: la galleta masticada baja hasta la panza.
    kid(ctx, kit, 540, 1500, 1100, { mode: 'ghost', arms: 0.1 });
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (local < cue(1)) cookie(ctx, kit, 540, 520 + 40 * Math.sin(t * 2), 70, kit.ramp(local, 0.4, 0.9));
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      ctx.beginPath(); ctx.ellipse(540, 860, 150, 110, 0.2, 0, TAU); ctx.fillStyle = 'rgba(244,114,182,0.25)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(244,114,182,0.7)'; ctx.stroke();
      const r = kit.rng(27);
      for (let i = 0; i < 14; i++) {
        const u = kit.clamp((local - cue(1)) * 0.9 - r() * 0.4), x = 540 + (r() - 0.5) * 180, y = 420 + 440 * u + (r() - 0.5) * 60;
        ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6 + t);
        ctx.fillStyle = r() > 0.5 ? '#d6a35c' : '#5b3412'; ctx.fillRect(-14, -10, 28, 20); ctx.restore();
      }
      ctx.restore();
    }
    void H;
  },

  perro(ctx, o) {
    const { kit, local, cue, t } = o;
    park(ctx, o);
    // El perro sigue el olor (ondas) hasta el niño invisible y le hace fiesta.
    kid(ctx, kit, 720, FLOOR, 430, { mode: 'ghost', arms: 0.1, ghostColor: 'rgba(30,41,59,0.5)' });
    const k = kit.ramp(local, 0, cue(1) + 0.2), dx = 140 + 330 * k;
    const happy = kit.ramp(local, cue(1), cue(1) + 0.3), hop = happy > 0 ? Math.abs(Math.sin(t * 8)) * 40 : 0;
    dog(ctx, kit, dx, FLOOR - hop, 220, t, 1 + happy);
    ctx.strokeStyle = 'rgba(132,204,22,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let j = 0; j <= 12; j++) { const u = j / 12, x = 690 - (690 - (dx + 230)) * u, y = 800 + i * 40 + 14 * Math.sin(u * 12 + t * 6 + i); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    if (happy > 0) for (let i = 0; i < 3; i++) heart(ctx, dx + 120 + i * 50, 760 - ((t * 60 + i * 40) % 120), 26, happy);
  },

  lluvia(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#334155', '#64748b');
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    // La lluvia rebota en el cuerpo invisible y lo dibuja.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.4);
    const r = kit.rng(9);
    ctx.strokeStyle = 'rgba(186,230,253,0.7)'; ctx.lineWidth = 3;
    for (let i = 0; i < 90; i++) { const x = r() * W, sp = 900 + r() * 500, y = ((t * sp + r() * 2000) % 900) + 300; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 34); ctx.stroke(); }
    ctx.save(); ctx.shadowColor = '#7dd3fc'; ctx.shadowBlur = 30 * q;
    ctx.globalAlpha = 0.35 + 0.65 * q;
    kid(ctx, kit, 540, FLOOR, 480, { mode: 'ghost', arms: 0.15 + 0.5 * q, ghostColor: q > 0.5 ? '#bae6fd' : 'rgba(255,255,255,0.7)', solid: q > 0.5, gw: 5 + 4 * q });
    ctx.restore();
    // Salpicaduras sobre la cabeza y los hombros.
    const pts = [[490, 612], [520, 610], [560, 610], [590, 612], [455, 726], [485, 724], [595, 724], [625, 726], [540, 609], [610, 725]];
    for (let i = 0; i < pts.length; i++) { const u = (t * 2 + i * 0.37) % 1, [x, y] = pts[i]; ctx.fillStyle = `rgba(224,242,254,${1 - u})`; ctx.beginPath(); ctx.arc(x - 20 * u, y - 18 * u, 6, 0, TAU); ctx.arc(x + 20 * u, y - 18 * u, 6, 0, TAU); ctx.fill(); }
    if (q > 0.5) sparkles(ctx, 540, 700, 260, t, q);
  },

  ciego(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // 1) El niño invisible en el parque; 2) todo se pone negro; 3) un ojo transparente: la luz lo atraviesa.
    if (local < cue(1)) { park(ctx, o); kid(ctx, kit, 540, FLOOR, 460, { mode: 'ghost', arms: 0.1, ghostColor: 'rgba(30,41,59,0.5)' }); return; }
    kit.gradientBG(ctx, W, H, '#020617', '#020617');
    const d = kit.ramp(local, cue(1), cue(1) + 0.5);
    if (local < cue(2)) {
      ctx.save(); ctx.globalAlpha = 1 - d; park(ctx, o); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); kit.text(ctx, '?', W / 2, 760, { size: 260, fill: '#334155', stroke: null }); ctx.restore();
      return;
    }
    // Ojo transparente con rayos de luz que lo cruzan sin detenerse.
    const cx = W / 2, cy = 760;
    ctx.save(); ctx.setLineDash([14, 10]); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(226,232,240,0.85)';
    ctx.beginPath(); ctx.arc(cx, cy, 200, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx - 175, cy, 30, 90, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx - 120, cy, 22, 70, 0, 0, TAU); ctx.stroke(); ctx.restore();
    kit.text(ctx, 'TU OJO (INVISIBLE)', cx, cy - 250, { size: 44, fill: '#e2e8f0' });
    kit.text(ctx, 'NADA SE QUEDA', cx + 260, cy + 250, { size: 40, fill: '#fca5a5' });
    for (let i = -2; i <= 2; i++) {
      const y = cy + i * 55, off = ((t * 900) % 300);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 8; ctx.setLineDash([60, 40]); ctx.lineDashOffset = -off;
      ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    kit.text(ctx, 'LUZ →', 150, cy - 150, { size: 46, fill: '#facc15' });
  },

  outro(ctx, o) {
    const { kit, t } = o;
    bedroom(ctx, o);
    // Igual que el primer cuadro: el niño con la poción en la mano (el video vuelve a empezar).
    kid(ctx, kit, 520, FLOOR, 470, { arms: 0.15 });
    potion(ctx, kit, 640, 700, 70, t, 0, 1);
    bubble(ctx, kit, 780, 520, '¿Y TÚ?', 56);
  },
};
