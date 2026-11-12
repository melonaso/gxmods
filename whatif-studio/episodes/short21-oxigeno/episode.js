// Short 21: ¿y si el aire se quedara sin oxígeno 5 segundos?
// Moléculas de O₂ que desaparecen → el aire es 21 % oxígeno: la presión baja como subir 2 km → oídos y
// fuego apagado → motores apagados → tú aguantarías → mito del concreto → la corteza es 46 % oxígeno.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const O_COL = '#ef4444', N_COL = '#3b82f6';

/** Molécula de dos átomos (O₂ rojo o N₂ azul). */
function mol(ctx, kit, x, y, r, col, rot = 0, label = 'O') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (const dx of [-0.55, 0.55]) { ctx.beginPath(); ctx.arc(dx * r, 0, r, 0, TAU); kit.shape(ctx, col, Math.max(3, r * 0.12)); }
  ctx.rotate(-rot);
  kit.text(ctx, label, 0, 2, { size: r * 0.95, fill: '#ffffff', stroke: null });
  ctx.restore();
}

/** Bocanada de humo gris (age 0..1). */
function smoke(ctx, x, y, r, age) {
  if (age < 0 || age > 1) return;
  ctx.save(); ctx.globalAlpha = 0.7 * (1 - age); ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.1 + age * 3) * r * 0.5, y - age * r * 3 - i * r * 0.5, r * (0.5 + age * 0.6), 0, TAU); ctx.fill(); }
  ctx.restore();
}

/** Llama con la base en (x, y); k = tamaño (1 encendida → 0 apagada). */
function flame(ctx, kit, x, y, s, t, k = 1) {
  if (k <= 0.02) return;
  const f = 1 + 0.12 * Math.sin(t * 17 + x);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k * f);
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * 0.55, -s * 0.45, s * 0.45, 0, 0, 0); ctx.bezierCurveTo(-s * 0.45, 0, -s * 0.55, -s * 0.45, 0, -s); ctx.closePath(); kit.shape(ctx, '#f97316', 5);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.bezierCurveTo(s * 0.3, -s * 0.3, s * 0.25, -s * 0.02, 0, -s * 0.02); ctx.bezierCurveTo(-s * 0.25, -s * 0.02, -s * 0.3, -s * 0.3, 0, -s * 0.6); ctx.closePath(); ctx.fillStyle = '#fde047'; ctx.fill();
  ctx.restore();
}

/** Fogata (troncos + llama). */
function campfire(ctx, kit, x, y, s, t, k) {
  ctx.save(); ctx.translate(x, y);
  for (const a of [-0.35, 0.35]) { ctx.save(); ctx.rotate(a); kit.roundRect(ctx, -s * 0.55, -s * 0.1, s * 1.1, s * 0.2, s * 0.08); kit.shape(ctx, '#92400e', 5); ctx.restore(); }
  ctx.restore();
  flame(ctx, kit, x, y - s * 0.08, s * 0.9, t, k);
}

/** Vela. */
function candle(ctx, kit, x, y, s, t, k) {
  kit.roundRect(ctx, x - s * 0.18, y - s * 0.9, s * 0.36, s * 0.9, 6); kit.shape(ctx, '#fef3c7', 5);
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - s * 0.9); ctx.lineTo(x, y - s * 1.0); ctx.stroke();
  flame(ctx, kit, x, y - s * 0.98, s * 0.45, t, k);
}

/** Hornilla de estufa con su anillo de llamitas. */
function stove(ctx, kit, x, y, s, t, k) {
  kit.roundRect(ctx, x - s * 0.7, y - s * 0.2, s * 1.4, s * 0.2, 6); kit.shape(ctx, '#475569', 5);
  for (let i = 0; i < 7; i++) flame(ctx, kit, x - s * 0.45 + i * s * 0.15, y - s * 0.2, s * 0.32, t + i, k);
}

/** Avión de perfil mirando a la derecha; burn = llama del motor. */
function plane(ctx, kit, x, y, s, rot, t, burn) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.05); ctx.lineTo(-s * 0.45, -s * 0.4); ctx.lineTo(-s * 0.32, -s * 0.4); ctx.lineTo(s * 0.05, -s * 0.05); ctx.closePath(); kit.shape(ctx, '#cbd5e1', 4);
  kit.roundRect(ctx, -s * 0.6, -s * 0.12, s * 1.2, s * 0.24, s * 0.12); kit.shape(ctx, '#f8fafc', 5);
  ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.1); ctx.lineTo(-s * 0.62, -s * 0.38); ctx.lineTo(-s * 0.48, -s * 0.38); ctx.lineTo(-s * 0.36, -s * 0.1); ctx.closePath(); kit.shape(ctx, '#ef4444', 4);
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-s * 0.2 + i * s * 0.12, -s * 0.02, s * 0.03, 0, TAU); ctx.fillStyle = '#0ea5e9'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-s * 0.05, s * 0.06); ctx.lineTo(-s * 0.3, s * 0.42); ctx.lineTo(-s * 0.16, s * 0.42); ctx.lineTo(s * 0.12, s * 0.06); ctx.closePath(); kit.shape(ctx, '#cbd5e1', 4);
  kit.roundRect(ctx, -s * 0.22, s * 0.14, s * 0.26, s * 0.1, s * 0.05); kit.shape(ctx, '#64748b', 4);
  if (burn > 0.02) { ctx.save(); ctx.globalAlpha = burn; ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(-s * 0.22, s * 0.15); ctx.lineTo(-s * (0.38 + 0.05 * Math.sin(t * 30)), s * 0.19); ctx.lineTo(-s * 0.22, s * 0.23); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

/** Pastel (gráfica circular): parts = [[fracción, color, etiqueta]]; skip = índice que sale volando. */
function pie(ctx, kit, cx, cy, R, parts, { skip = -1, away = 0 } = {}) {
  // Dos pasadas: primero las rebanadas y después las etiquetas, para que ninguna rebanada tape un texto.
  for (const pass of [0, 1]) {
    let a0 = -Math.PI / 2;
    parts.forEach(([f, col, label], i) => {
      const a1 = a0 + f * TAU, mid = (a0 + a1) / 2;
      const off = i === skip ? away * 260 : 0;
      ctx.save(); if (i === skip) ctx.globalAlpha = 1 - away;
      ctx.translate(Math.cos(mid) * off, Math.sin(mid) * off);
      if (pass === 0) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); kit.shape(ctx, col, 6); }
      else if (label && f > 0.04) kit.text(ctx, label, cx + Math.cos(mid) * R * 0.58, cy + Math.sin(mid) * R * 0.58, { size: f > 0.2 ? 46 : 38, fill: '#ffffff', maxW: f > 0.2 ? R * 1.1 : null });
      ctx.restore();
      a0 = a1;
    });
  }
}

function sky(ctx, o) {
  const { W, H, kit } = o;
  kit.gradientBG(ctx, W, H, '#0284c7', '#bae6fd');
  ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 1060, W, H - 1060);
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    sky(ctx, o);
    // Barrio con aire «visible»: moléculas de O₂ (rojas) y N₂ (azules). En la segunda frase, el O₂ desaparece.
    const P = Math.max(0.4, cue(1) + 0.25);
    kit.house(ctx, 820, 1062, 300, 230, {});
    kit.tree(ctx, 560, 1062, 260, {});
    kit.person(ctx, 420, 1062, 230, { shirt: '#f97316', arms: local > P ? 0.5 : 0.1 });
    const fk = 1 - kit.ramp(local, P, P + 0.35);
    campfire(ctx, kit, 200, 1050, 120, t, fk);
    if (local > P) for (let i = 0; i < 3; i++) smoke(ctx, 200, 980, 30, ((local - P) * 0.7 + i / 3) % 1);
    const r = kit.rng(21);
    for (let i = 0; i < 34; i++) {
      const isO = i % 5 === 0 || i % 5 === 3, x = 70 + r() * (W - 140), y = 480 + r() * 480, rot = r() * TAU;
      const bx = x + 18 * Math.sin(t * 1.3 + i), by = y + 14 * Math.cos(t * 1.1 + i * 2);
      if (!isO) mol(ctx, kit, bx, by, 24, N_COL, rot + t * 0.4, 'N');
      else if (local < P + (i % 7) * 0.04) mol(ctx, kit, bx, by, 26, O_COL, rot + t * 0.5, 'O');
      else smoke(ctx, bx, by, 18, (local - P - (i % 7) * 0.04) / 0.5);
    }
    kit.flash(ctx, W, H, 0.3 * kit.impulse(local, P, 0.25), '#ffffff');
  },

  aire(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#0c4a6e', '#38bdf8');
    // 78 % nitrógeno, 21 % oxígeno, 1 % otros; al quitar el oxígeno, la presión baja a 79 %.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.5);
    pie(ctx, kit, W / 2, 720, 260, [[0.78, N_COL, 'NITRÓGENO 78 %'], [0.21, O_COL, 'O₂ 21 %'], [0.01, '#94a3b8', '']], { skip: 1, away: q });
    const p = 100 - 21 * q;
    kit.roundRect(ctx, 140, 1020, 800, 60, 30); kit.shape(ctx, '#1e293b', 6);
    kit.roundRect(ctx, 148, 1028, 784 * p / 100, 44, 22); ctx.fillStyle = q > 0.5 ? '#fbbf24' : '#4ade80'; ctx.fill();
    kit.text(ctx, `PRESIÓN: ${Math.round(p)} %`, W / 2, 1050, { size: 36, fill: '#ffffff' });
    if (q < 0.5) {
      kit.text(ctx, '21 % ES OXÍGENO', W / 2, 230, { size: 96, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'EL RESTO, CASI TODO NITRÓGENO', W / 2, 335, { size: 46, fill: '#bae6fd', maxW: W * 0.92 });
    } else {
      kit.text(ctx, '−21 % DE PRESIÓN', W / 2, 230, { size: 96, fill: kit.YELLOW, maxW: W * 0.92 });
      kit.text(ctx, 'COMO SUBIR 2 KM DE GOLPE', W / 2, 335, { size: 52, fill: '#ffffff', maxW: W * 0.92 });
    }
  },

  fuego(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7c2d12', '#fdba74');
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.2);
    if (q < 1) {
      // Oreja con el «¡pop!» de la presión.
      ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(380, 740);
      ctx.beginPath(); ctx.ellipse(0, 0, 150, 240, 0, 0, TAU); kit.shape(ctx, '#e8b48a', 8);
      ctx.beginPath(); ctx.ellipse(12, 0, 80, 150, 0, 0, TAU); ctx.lineWidth = 14; ctx.strokeStyle = '#c98b62'; ctx.stroke();
      ctx.beginPath(); ctx.arc(24, 34, 30, 0, TAU); ctx.fillStyle = '#7c4a2a'; ctx.fill();
      const k = kit.impulse(local, 0.3, 0.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(60, 30, 200 + i * 60 + 40 * (1 - k), -0.6, 0.6); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 1 - q; kit.text(ctx, 'POP', 780, 720, { size: 140 + 30 * kit.impulse(local, 0.3, 0.4), fill: kit.YELLOW }); ctx.restore();
    }
    if (q > 0) {
      const k = 1 - kit.ramp(local, cue(1) + 0.3, cue(1) + 0.7);
      ctx.save(); ctx.globalAlpha = q;
      candle(ctx, kit, 220, 1040, 220, t, k);
      campfire(ctx, kit, 540, 1040, 200, t, k);
      stove(ctx, kit, 860, 1040, 220, t, k);
      if (k < 1) for (const x of [220, 540, 860]) for (let i = 0; i < 3; i++) smoke(ctx, x, x === 220 ? 780 : 900, 34, ((local - cue(1) - 0.3) * 0.6 + i / 3) % 1);
      ctx.restore();
    }
    if (q < 0.5) {
      kit.text(ctx, '¡TE TRONARÍAN', W / 2, 230, { size: 96, fill: '#ffffff' });
      kit.text(ctx, 'LOS OÍDOS!', W / 2, 340, { size: 80, fill: kit.YELLOW });
    } else {
      kit.text(ctx, 'SIN FUEGO', W / 2, 230, { size: 116, fill: '#ffffff' });
      kit.text(ctx, 'EN TODO EL PLANETA', W / 2, 345, { size: 56, fill: '#fde68a' });
    }
    void H;
  },

  motores(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    sky(ctx, o);
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 1000, W, 70);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6; ctx.setLineDash([40, 30]); ctx.beginPath(); ctx.moveTo(0, 1035); ctx.lineTo(W, 1035); ctx.stroke(); ctx.setLineDash([]);
    // Coche que se detiene (sin humo) y avión que planea (sin llama en el motor).
    const off = kit.ramp(local, 0.6, 1.4);
    const cx = 160 + 260 * (local < 1.4 ? local / 1.4 : 1) + 20 * (1 - off) * Math.sin(t * 2);
    kit.car(ctx, cx, 1030, 260, { color: '#ef4444' });
    if (off < 1) for (let i = 0; i < 3; i++) smoke(ctx, cx - 150 - i * 10, 1000, 22 * (1 - off), ((t * 1.5) + i / 3) % 1);
    const pr = 0.12 * off, px = 560 + 30 * local, py = 600 + 120 * off * Math.min(1, Math.max(0, local - 0.6) / 4);
    plane(ctx, kit, px, py, 420, pr, t, 1 - off);
    if (off > 0.5) kit.text(ctx, 'PLANEANDO…', px, py + 170, { size: 40, fill: '#0f172a', stroke: '#ffffff', lw: 8 });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q < 0.5) {
      kit.text(ctx, 'MOTORES APAGADOS', W / 2, 230, { size: 86, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'COCHES Y AVIONES', W / 2, 335, { size: 52, fill: '#0f172a', stroke: '#ffffff', lw: 8 });
    } else {
      kit.text(ctx, 'LA GASOLINA NO QUEMA', W / 2, 230, { size: 80, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'SIN OXÍGENO', W / 2, 335, { size: 60, fill: '#dc2626', stroke: '#ffffff', lw: 8 });
    }
    void H;
  },

  tu(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#312e81', '#818cf8');
    // Persona aguantando la respiración (cachetes inflados) y un reloj de 5 segundos.
    const cheeks = 1 + 0.05 * Math.sin(t * 5);
    kit.person(ctx, 380, 1070, 580, { shirt: '#22c55e' });
    const hx = 380, hy = 1070 - 580 * (0.42 + 0.34 + 0.12);
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + sx * 62 * cheeks, hy + 20, 30 * cheeks, 0, TAU); ctx.fillStyle = 'rgba(239,68,68,0.55)'; ctx.fill(); }
    ctx.fillStyle = kit.INK; ctx.fillRect(hx - 22, hy + 40, 44, 8);
    const sec = Math.max(0, 5 - local * (5 / Math.max(1, cue(1) + 1.2)));
    ctx.beginPath(); ctx.arc(800, 640, 140, 0, TAU); kit.shape(ctx, '#ffffff', 8);
    ctx.beginPath(); ctx.moveTo(800, 640); ctx.arc(800, 640, 124, -Math.PI / 2, -Math.PI / 2 + TAU * (sec / 5)); ctx.closePath(); ctx.fillStyle = '#fca5a5'; ctx.fill();
    kit.text(ctx, `${Math.ceil(sec)} s`, 800, 640, { size: 90, fill: '#0f172a', stroke: '#ffffff', lw: 10 });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      for (let i = 0; i < 6; i++) { const u = (local * 0.6 + i / 6) % 1; mol(ctx, kit, 700 + 200 * Math.sin(i * 1.7), 980 - u * 140, 20, O_COL, i, 'O'); }
      ctx.restore();
    }
    if (q < 0.5) {
      kit.text(ctx, '¿Y TÚ?', W / 2, 230, { size: 120, fill: '#ffffff' });
      kit.text(ctx, 'AGUANTA LA RESPIRACIÓN', W / 2, 345, { size: 52, fill: '#e0e7ff', maxW: W * 0.92 });
    } else {
      kit.text(ctx, '¡NI LO NOTARÍAS!', W / 2, 230, { size: 96, fill: '#4ade80', maxW: W * 0.92 });
      kit.text(ctx, 'OXÍGENO PARA MÁS DE 1 MINUTO', W / 2, 345, { size: 46, fill: '#ffffff', maxW: W * 0.92 });
    }
  },

  mito(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1f2937', '#6b7280');
    // Edificio de concreto + mito tachado; luego, el SiO₄: el oxígeno está pegado al silicio.
    const shakeA = local < 0.9 ? 4 * Math.sin(t * 40) : 0;
    kit.building(ctx, 290 + shakeA, 1070, 330, 560, { color: '#9ca3af', lit: () => 0 });
    const st = kit.ramp(local, 0.9, 1.1);
    if (st > 0) {
      ctx.save(); ctx.translate(290, 760); ctx.rotate(-0.25); ctx.scale(1.4 - 0.4 * st, 1.4 - 0.4 * st); ctx.globalAlpha = st;
      kit.roundRect(ctx, -170, -60, 340, 120, 14); ctx.lineWidth = 12; ctx.strokeStyle = '#dc2626'; ctx.stroke();
      kit.text(ctx, 'MITO', 0, 4, { size: 92, fill: '#dc2626', stroke: '#ffffff', lw: 8 });
      ctx.restore();
    }
    const q = kit.ramp(local, cue(1), cue(1) + 0.4);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q; ctx.translate(790, 720);
      const pts = [[0, -170], [150, 80], [-150, 80], [0, 150]];
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 14;
      for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x * 0.85, y * 0.85); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); kit.shape(ctx, '#94a3b8', 6); kit.text(ctx, 'Si', 0, 2, { size: 54, fill: '#ffffff', stroke: null });
      for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x * 0.85, y * 0.85, 46, 0, TAU); kit.shape(ctx, O_COL, 6); kit.text(ctx, 'O', x * 0.85, y * 0.85 + 2, { size: 46, fill: '#ffffff', stroke: null }); }
      kit.text(ctx, 'PEGADOS', 0, 290, { size: 48, fill: kit.YELLOW });
      ctx.restore();
    }
    if (q < 0.5) {
      kit.text(ctx, '¿SE DESMORONARÍA', W / 2, 230, { size: 84, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, 'EL CONCRETO?', W / 2, 335, { size: 70, fill: '#fca5a5' });
    } else {
      kit.text(ctx, '¡NO!', W / 2, 230, { size: 130, fill: '#4ade80' });
      kit.text(ctx, 'SU OXÍGENO NO VIENE DEL AIRE', W / 2, 345, { size: 46, fill: '#ffffff', maxW: W * 0.92 });
    }
    void H;
  },

  loco(ctx, o) {
    const { W, H, kit, local } = o;
    kit.gradientBG(ctx, W, H, '#44403c', '#a8a29e');
    // La corteza de la Tierra por peso: O 46 %, Si 28 %, Al 8 %, Fe 5 %, otros 13 %.
    const k = o.ease.out(kit.ramp(local, 0.1, 1.0));
    ctx.save(); ctx.translate(W / 2, 740); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.translate(-W / 2, -740);
    pie(ctx, kit, W / 2, 740, 280, [[0.46, O_COL, 'OXÍGENO 46 %'], [0.28, '#64748b', 'SILICIO 28 %'], [0.08, '#38bdf8', 'Al'], [0.05, '#92400e', 'Fe'], [0.13, '#d6d3d1', '']]);
    ctx.restore();
    const n = Math.round(46 * k);
    kit.text(ctx, `${n} %`, W / 2, 230, { size: 130, fill: kit.YELLOW });
    kit.text(ctx, 'DE LA CORTEZA ES OXÍGENO', W / 2, 345, { size: 52, fill: '#ffffff', maxW: W * 0.92 });
    void H;
  },

  outro(ctx, o) {
    const { W, kit, t } = o;
    sky(ctx, o);
    kit.person(ctx, W / 2, 1062, 300, { shirt: '#f97316', arms: 0.8 + 0.1 * Math.sin(t * 3) });
    const r = kit.rng(5);
    for (let i = 0; i < 16; i++) { const x = 80 + r() * (W - 160), y = 480 + r() * 420; mol(ctx, kit, x + 14 * Math.sin(t + i), y, 24, i % 3 ? N_COL : O_COL, r() * TAU + t * 0.4, i % 3 ? 'N' : 'O'); }
    kit.text(ctx, '¡RESPIRA HONDO!', W / 2, 260, { size: 92, fill: kit.YELLOW, maxW: W * 0.92 });
  },
};
