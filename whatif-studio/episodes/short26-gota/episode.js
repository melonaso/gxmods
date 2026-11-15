// Short 26 (sin voz, pensado para retención): 1 gota que se duplica cada minuto llena un estadio en 45.
// La pregunta queda abierta arriba todo el video («¿MINUTO DE LA MITAD?») y se contesta al final
// (minuto 44). El último cuadro vuelve al estadio vacío con la gota arriba: empata con el primero (bucle).
// Gota = 0.05 mL → minuto n = 2ⁿ gotas: 10 → 51 mL, 20 → 52 L, 30 → 54 m³, 45 → 1.76 millones de m³.

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
// Estadio en corte: tazón trapezoidal (arriba 900 px de ancho, abajo 620 px, 440 px de alto).
const ST = { top: 600, bot: 1040, xl: 90, xr: 990, bl: 230, br: 850 };
const H = ST.bot - ST.top, Bw = ST.xr - ST.xl, bw = ST.br - ST.bl;
const AREA = bw * H + (Bw - bw) * H / 2;

/** Altura del agua para una fracción f del volumen (el tazón es más ancho arriba). */
function levelFor(f) {
  const a = (Bw - bw) / (2 * H);
  return (-bw + Math.sqrt(bw * bw + 4 * a * Math.max(0, Math.min(1, f)) * AREA)) / (2 * a);
}

function background(ctx, o) {
  const { W, H: HH, kit } = o;
  kit.gradientBG(ctx, W, HH, '#0f172a', '#1e3a8a');
  for (const x of [60, 1020]) {
    const g = ctx.createRadialGradient(x, 540, 10, x, 540, 260);
    g.addColorStop(0, 'rgba(254,249,195,0.55)'); g.addColorStop(1, 'rgba(254,249,195,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 260, 280, 520, 520);
  }
}

/** Estadio con agua hasta la fracción f; wave = movimiento de la superficie. */
function stadium(ctx, o, f, { wave = 0, mid = false } = {}) {
  const { W, H: HH, kit, t } = o;
  // Torres de luz.
  for (const x of [60, 1020]) {
    ctx.fillStyle = '#334155'; ctx.fillRect(x - 8, 540, 16, 520);
    kit.roundRect(ctx, x - 40, 520, 80, 34, 6); kit.shape(ctx, '#fef9c3', 4);
  }
  // Estructura.
  ctx.beginPath(); ctx.moveTo(30, ST.top - 10); ctx.lineTo(ST.xl, ST.top - 10); ctx.lineTo(ST.bl, ST.bot); ctx.lineTo(ST.br, ST.bot); ctx.lineTo(ST.xr, ST.top - 10); ctx.lineTo(W - 30, ST.top - 10); ctx.lineTo(W - 30, ST.bot + 40); ctx.lineTo(30, ST.bot + 40); ctx.closePath();
  kit.shape(ctx, '#475569', 6);
  // Gradas (rayas en las paredes inclinadas).
  ctx.strokeStyle = 'rgba(226,232,240,0.35)'; ctx.lineWidth = 3;
  for (let i = 1; i < 9; i++) {
    const y = ST.top + (H * i) / 9, k = (y - ST.top) / H;
    ctx.beginPath(); ctx.moveTo(ST.xl + (ST.bl - ST.xl) * k - 2, y); ctx.lineTo(ST.xl + (ST.bl - ST.xl) * k - 60, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ST.xr + (ST.br - ST.xr) * k + 2, y); ctx.lineTo(ST.xr + (ST.br - ST.xr) * k + 60, y); ctx.stroke();
  }
  // Interior del tazón y cancha.
  ctx.beginPath(); ctx.moveTo(ST.xl, ST.top); ctx.lineTo(ST.bl, ST.bot); ctx.lineTo(ST.br, ST.bot); ctx.lineTo(ST.xr, ST.top); ctx.closePath();
  ctx.fillStyle = '#1e293b'; ctx.fill();
  ctx.fillStyle = '#16a34a'; ctx.fillRect(ST.bl + 6, ST.bot - 18, bw - 12, 18);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(W / 2 - 2, ST.bot - 18, 4, 18);
  // Agua.
  const h = levelFor(f);
  if (h > 0.5) {
    const y = ST.bot - h, k = h / H, xl = ST.bl - (ST.bl - ST.xl) * k, xr = ST.br + (ST.xr - ST.br) * k;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(ST.xl, ST.top); ctx.lineTo(ST.bl, ST.bot); ctx.lineTo(ST.br, ST.bot); ctx.lineTo(ST.xr, ST.top); ctx.closePath(); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, ST.bot); g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(xl - 20, ST.bot + 5);
    for (let x = xl - 20; x <= xr + 20; x += 20) ctx.lineTo(x, y + wave * 8 * Math.sin(x * 0.03 + t * 5));
    ctx.lineTo(xr + 20, ST.bot + 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(224,242,254,0.9)'; ctx.lineWidth = 5; ctx.beginPath();
    for (let x = xl; x <= xr; x += 20) ctx.lineTo(x, y + wave * 8 * Math.sin(x * 0.03 + t * 5));
    ctx.stroke(); ctx.restore();
  }
  if (mid) {
    const ym = ST.bot - levelFor(0.5);
    ctx.save(); ctx.setLineDash([18, 12]); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(ST.xl - 20, ym); ctx.lineTo(ST.xr + 20, ym); ctx.stroke(); ctx.restore();
    kit.text(ctx, 'MITAD', ST.xr - 40, ym - 30, { size: 40, fill: '#facc15' });
  }
  void HH;
}

/** Pregunta fija arriba durante todo el video; se resuelve en el minuto 44. */
function badge(ctx, o, solved) {
  const { W, kit } = o;
  const text = solved ? 'MINUTO 44 ✓' : '¿MINUTO DE LA MITAD?';
  ctx.font = `900 40px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 60;
  kit.roundRect(ctx, W / 2 - w / 2, 80, w, 64, 32); kit.shape(ctx, solved ? '#16a34a' : '#0f172a', 5, solved ? '#ffffff' : '#facc15');
  kit.text(ctx, text, W / 2, 113, { size: 40, fill: solved ? '#ffffff' : '#facc15', stroke: null });
}

function drop(ctx, kit, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.8);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r, y - r * 0.5, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI); ctx.bezierCurveTo(x - r, y - r * 0.5, x - r * 0.5, y - r * 1.1, x, y - r * 1.8); ctx.closePath();
  kit.shape(ctx, '#38bdf8', 5);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.2, r * 0.18, r * 0.32, 0.3, 0, TAU); ctx.fill();
}

/** Lupa con un objeto dentro, apuntando a la cancha. */
function zoom(ctx, o, k, label, paint) {
  if (k <= 0) return;
  const { kit } = o, cx = 790, cy = 590, r = 150;
  ctx.save(); ctx.globalAlpha = k;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy + r * 0.7); ctx.lineTo(540, ST.bot - 22); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); kit.shape(ctx, '#e0f2fe', 8);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, TAU); ctx.clip(); paint(ctx, kit, cx, cy); ctx.restore();
  kit.text(ctx, label, cx, cy + r + 40, { size: 40, fill: kit.YELLOW });
  ctx.restore();
}

function shot(ctx, kit, cx, cy) {
  ctx.beginPath(); ctx.moveTo(cx - 55, cy - 70); ctx.lineTo(cx + 55, cy - 70); ctx.lineTo(cx + 38, cy + 80); ctx.lineTo(cx - 38, cy + 80); ctx.closePath(); kit.shape(ctx, 'rgba(255,255,255,0.6)', 6);
  ctx.beginPath(); ctx.moveTo(cx - 48, cy - 20); ctx.lineTo(cx + 48, cy - 20); ctx.lineTo(cx + 38, cy + 76); ctx.lineTo(cx - 38, cy + 76); ctx.closePath(); ctx.fillStyle = '#38bdf8'; ctx.fill();
}

function jug(ctx, kit, x, y, s, fill = 1) {
  kit.roundRect(ctx, x - s * 0.4, y - s, s * 0.8, s, s * 0.18); kit.shape(ctx, 'rgba(186,230,253,0.5)', 5);
  ctx.save(); kit.roundRect(ctx, x - s * 0.4 + 5, y - s * fill + 5, s * 0.8 - 10, s * fill - 10, s * 0.14); ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.restore();
  kit.roundRect(ctx, x - s * 0.13, y - s * 1.18, s * 0.26, s * 0.2, 6); kit.shape(ctx, '#2563eb', 4);
}

function pool(ctx, kit, cx, cy) {
  kit.roundRect(ctx, cx - 120, cy - 40, 240, 120, 10); kit.shape(ctx, '#e2e8f0', 6);
  ctx.fillStyle = '#0ea5e9'; ctx.fillRect(cx - 108, cy - 28, 216, 96);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - 90, cy - 5 + i * 28); ctx.quadraticCurveTo(cx, cy - 15 + i * 28, cx + 90, cy - 5 + i * 28); ctx.stroke(); }
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + 80, cy - 70); ctx.lineTo(cx + 80, cy - 20); ctx.moveTo(cx + 105, cy - 70); ctx.lineTo(cx + 105, cy - 20); ctx.stroke();
}

/** Minuto que corre de m0 a m1 al inicio de la escena. */
const minute = (o, m0, m1) => Math.floor(m0 + (m1 - m0) * o.kit.ramp(o.local, 0, 0.6) + 1e-6);
const nf = (o, n) => o.kit.nf(n);
const titles = (o, a, b, colB = '#e0f2fe') => { o.kit.text(o.ctx, a, o.W / 2, 240, { size: 104, fill: '#ffffff', maxW: o.W * 0.92 }); if (b) o.kit.text(o.ctx, b, o.W / 2, 350, { size: 56, fill: colB, maxW: o.W * 0.92 }); };

const SCENES = {
  hook(ctx, o) {
    const { kit, local } = o;
    background(ctx, o); stadium(ctx, o, 0);
    // La pregunta aparece cuando termina el acercamiento inicial (si no, queda cortada arriba).
    ctx.save(); ctx.globalAlpha = kit.ramp(local, 0.45, 0.7); badge(ctx, o, false); ctx.restore();
    // La gota cae al centro de la cancha y salpica.
    const k = kit.ramp(local, 0, 0.55);
    if (local < 0.55) drop(ctx, kit, 540, 470 + (ST.bot - 40 - 470) * k * k, 26);
    else {
      const u = kit.clamp((local - 0.55) / 0.6);
      ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(540, ST.bot - 20, 20 + 90 * u, 6 + 14 * u, 0, 0, TAU); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(540, ST.bot - 22, 8, 0, TAU); ctx.fillStyle = '#38bdf8'; ctx.fill();
      kit.text(ctx, '1 GOTA', 540, ST.bot - 70, { size: 44, fill: '#ffffff' });
    }
  },

  min10(ctx, o) {
    const { kit, local, cue } = o; o.ctx = ctx;
    background(ctx, o); stadium(ctx, o, 0); badge(ctx, o, false);
    const m = minute(o, 1, 10);
    zoom(ctx, o, kit.ramp(local, cue(1) - 0.2, cue(1)), 'UN CABALLITO', shot);
    titles(o, `MINUTO ${m}`, `${nf(o, 2 ** m)} GOTAS`);
  },

  min20(ctx, o) {
    const { kit, local, cue } = o; o.ctx = ctx;
    background(ctx, o); stadium(ctx, o, 0); badge(ctx, o, false);
    const m = minute(o, 11, 20);
    zoom(ctx, o, kit.ramp(local, cue(1) - 0.2, cue(1)), '2.5 GARRAFONES', (c, k, cx, cy) => { jug(c, k, cx - 70, cy + 80, 120); jug(c, k, cx + 30, cy + 80, 120); jug(c, k, cx + 110, cy + 80, 120, 0.5); });
    titles(o, `MINUTO ${m}`, `${nf(o, Math.round((2 ** m) * 0.05 / 1000))} LITROS`);
  },

  min30(ctx, o) {
    const { kit, local, cue } = o; o.ctx = ctx;
    background(ctx, o); stadium(ctx, o, 0); badge(ctx, o, false);
    const m = minute(o, 21, 30);
    zoom(ctx, o, kit.ramp(local, 0.4, 0.8), 'UNA ALBERCA', pool);
    if (local > cue(1)) kit.text(ctx, 'CASI VACÍO', 400, ST.bot - 120, { size: 52, fill: '#fca5a5' });
    titles(o, `MINUTO ${m}`, `${nf(o, Math.round((2 ** m) * 0.05 / 1000))} LITROS`);
  },

  min40(ctx, o) {
    const { kit, local } = o; o.ctx = ctx;
    background(ctx, o);
    const m = minute(o, 31, 40), f = 2 ** (m - 45);
    stadium(ctx, o, f, { wave: 0.5 }); badge(ctx, o, false);
    if (m >= 40) kit.text(ctx, '3 %', 540, ST.bot - 60, { size: 56, fill: '#ffffff' });
    titles(o, `MINUTO ${m}`, m >= 40 ? 'APENAS 3 % LLENO' : `${(f * 100).toFixed(2)} %`, '#fca5a5');
    void local;
  },

  rapido(ctx, o) {
    const { kit, local } = o; o.ctx = ctx;
    background(ctx, o);
    // Tres minutos, tres clics: 6 % → 12 % → 25 %.
    const step = local < 0.6 ? 41 : local < 1.15 ? 42 : 43;
    const prev = 2 ** (step - 1 - 45), next = 2 ** (step - 45), k = kit.ramp(local, [0.05, 0.6, 1.15][step - 41], [0.05, 0.6, 1.15][step - 41] + 0.35);
    stadium(ctx, o, prev + (next - prev) * o.ease.out(k), { wave: 1 }); badge(ctx, o, false);
    kit.shake(ctx, 0, 0);
    const pct = { 41: '6 %', 42: '12 %', 43: '25 %' }[step];
    titles(o, `MINUTO ${step}`, `${pct} LLENO`, kit.YELLOW);
  },

  mitad(ctx, o) {
    const { kit, local, cue, W, H: HH } = o; o.ctx = ctx;
    background(ctx, o);
    const k = o.ease.out(kit.ramp(local, 0, 0.6));
    stadium(ctx, o, 0.25 + 0.25 * k, { wave: 1, mid: true });
    const solved = local > 0.1;
    badge(ctx, o, solved);
    kit.flash(ctx, W, HH, 0.3 * kit.impulse(local, 0.1, 0.3), '#fef08a');
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    titles(o, q > 0.5 ? '¿Y EL MINUTO 45?' : 'MINUTO 44', q > 0.5 ? null : '¡A LA MITAD!', kit.YELLOW);
  },

  lleno(ctx, o) {
    const { kit, local, W, H: HH, t } = o; o.ctx = ctx;
    background(ctx, o);
    const k = o.ease.out(kit.ramp(local, 0, 0.45));
    ctx.save(); kit.shake(ctx, 10 * kit.impulse(local, 0.45, 0.6), t);
    stadium(ctx, o, 0.5 + 0.5 * k, { wave: 1.6 });
    // Se desborda: chorros y gotas por los lados.
    if (local > 0.4) {
      const r = kit.rng(26);
      for (let i = 0; i < 40; i++) {
        const side = i % 2 ? 1 : -1, u = ((local - 0.4) * (0.8 + r() * 0.6) + r() * 0.3) % 1.2;
        const x = (side > 0 ? ST.xr + 20 : ST.xl - 20) + side * u * (120 + r() * 220), y = ST.top - 10 - 140 * u + 320 * u * u;
        drop(ctx, kit, x, y, 9 + r() * 8);
      }
    }
    ctx.restore();
    badge(ctx, o, true);
    kit.flash(ctx, W, HH, 0.45 * kit.impulse(local, 0.45, 0.35), '#ffffff');
    titles(o, '¡LLENO!', 'MINUTO 45', kit.YELLOW);
  },

  loop(ctx, o) {
    const { kit, local, s } = o; o.ctx = ctx;
    background(ctx, o);
    // El agua se va y el estadio vuelve a quedar vacío, con la gota arriba: igual que el primer cuadro.
    const drain = 1 - o.ease.inOut(kit.ramp(local, 0, s.dur * 0.6));
    stadium(ctx, o, drain, { wave: 0.6 });
    badge(ctx, o, drain > 0.05);
    if (drain < 0.02) drop(ctx, kit, 540, 470, 26);
    titles(o, '¿LE ATINASTE?', 'TODO EMPEZÓ CON 1 GOTA', '#bae6fd');
  },
};
