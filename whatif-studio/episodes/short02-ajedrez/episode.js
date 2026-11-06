// Short 02: la leyenda del ajedrez. Casilla k → 2^(k−1) granos; total hasta k → 2^k − 1.
// Un grano de arroz pesa unos 25 mg.

const BX = 240, BY = 455, SQ = 75;        // tablero: 8 × 75 px = 600 px
const GRAIN_G = 0.025;

const compact = (n, nf) => (n < 1e3 ? nf(n) : n < 1e6 ? `${nf(n / 1e3, n < 1e4 ? 1 : 0)} mil` : n < 1e9 ? `${nf(n / 1e6, n < 1e7 ? 1 : 0)} mill.`
  : n < 1e12 ? `${nf(n / 1e9, n < 1e10 ? 1 : 0)} mil mill.` : n < 1e18 ? `${nf(n / 1e12, n < 1e13 ? 1 : 0)} bill.` : `${nf(n / 1e18, 1)} trill.`);

let grainSpots;

export function setup(C) {
  const r = C.kit.rng(5);
  grainSpots = Array.from({ length: 64 }, () => ({ x: 0.15 + r() * 0.7, y: 0.15 + r() * 0.7, a: r() * Math.PI }));
}

/** Centro de la casilla k (1..64): de izquierda a derecha y de abajo hacia arriba. */
function squareXY(k) {
  const i = k - 1, row = Math.floor(i / 8), col = i % 8;
  return { x: BX + col * SQ, y: BY + (7 - row) * SQ };
}

export function draw(ctx, C, { t, scene: s, local }) {
  const { W, H, kit, ease, lerp } = C;
  const { nf } = kit;
  const goal = s.reach === 'all' ? s.audio : Math.max(1.2, s.cueTimes[0]?.[1] ?? s.audio);
  const k = lerp(s.k0, s.k1, ease.inOut(Math.min(1, local / goal)));
  const kFull = Math.floor(k + 1e-6), kCur = Math.min(64, Math.max(1, Math.ceil(k - 1e-6)));

  // Mesa de madera.
  kit.gradientBG(ctx, W, H, '#8b5a34', '#5b3a21');
  ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 46) ctx.fillRect(0, y, W, 3);
  ctx.globalAlpha = 1;

  // A partir de la casilla ~30 el arroz ya no cabe: cubre la mesa (más granos cuanto más avanza).
  const spill = kit.ramp(k, 28, 64);
  if (spill > 0) {
    const r = kit.rng(9), count = Math.floor(3200 * spill);
    for (let q = 0; q < 3200; q++) {
      const x = r() * W, y = r() * H, a = r() * 3, show = q < count;
      if (!show) continue;
      ctx.fillStyle = q % 3 ? '#fbf5e6' : '#e7dcc0';
      ctx.beginPath(); ctx.ellipse(x, y, 8, 3.4, a, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Tablero.
  kit.roundRect(ctx, BX - 18, BY - 18, SQ * 8 + 36, SQ * 8 + 36, 14); kit.shape(ctx, '#3f2a1a', 6);
  for (let q = 1; q <= 64; q++) {
    const { x, y } = squareXY(q);
    const row = Math.floor((q - 1) / 8), col = (q - 1) % 8;
    ctx.fillStyle = (row + col) % 2 === 0 ? '#b58863' : '#f0d9b5';
    ctx.fillRect(x, y, SQ, SQ);
    const filled = q <= kFull ? 1 : q === kCur ? Math.max(0, k - (q - 1)) : 0;
    if (filled <= 0) continue;
    const grains = Math.pow(2, q - 1);
    ctx.save(); ctx.globalAlpha = Math.min(1, filled * 1.5);
    if (q <= 7) {
      // Granos individuales (hasta 64).
      ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.5;
      for (let g = 0; g < grains; g++) {
        const sp = grainSpots[g];
        ctx.beginPath(); ctx.ellipse(x + sp.x * SQ, y + sp.y * SQ, 6, 2.6, sp.a, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else {
      // Montoncito: su tamaño crece con log₂ de los granos (si no, ni cabría).
      const sz = Math.min(0.88, 0.25 + (q - 7) * 0.035) * SQ;
      ctx.beginPath(); ctx.ellipse(x + SQ / 2, y + SQ * 0.6, sz / 2, sz / 3, 0, 0, Math.PI * 2);
      kit.shape(ctx, q > 40 ? '#f7efd9' : '#fbf5e6', 2.5, '#7c6a48');
      kit.text(ctx, compact(grains, nf), x + SQ / 2, y + SQ * 0.25, { size: 17, weight: 800, fill: '#1f2937', stroke: '#fffaf0', lw: 4, maxW: SQ - 8 });
    }
    ctx.restore();
  }
  // Casilla actual resaltada.
  if (k > 0.05) {
    const { x, y } = squareXY(kCur);
    ctx.lineWidth = 7; ctx.strokeStyle = kit.YELLOW; ctx.strokeRect(x + 3, y + 3, SQ - 6, SQ - 6);
  }

  // Comparación de la escena (icono sencillo + rótulo) bajo el tablero.
  drawIcon(ctx, kit, s.icon, W / 2, 1132, t);

  const onSquare = Math.pow(2, kCur - 1);
  const total = Math.pow(2, Math.max(0, k)) - 1;
  const value = k < 0.05 ? '1 grano' : onSquare < 1e6 ? `${nf(onSquare)} ${onSquare === 1 ? 'grano' : 'granos'}` : `${kit.bigES(onSquare)}`;
  const title = s.titleCard ? { lines: s.titleCard, y: s.titleY, alpha: s.id === 'intro'
    ? Math.min(1, local / 0.4) * (1 - kit.ramp(local, s.dur - 0.5, s.dur))
    : kit.ramp(local / s.dur, 0.45, 0.55) } : null;
  const ov = {
    counter: { label: `EN LA CASILLA ${kCur}`, value },
    chip: `TOTAL: ${total < 1e6 ? nf(Math.round(total)) : kit.bigES(total)} · ${kgFmt(total * GRAIN_G / 1000, nf)}`,
    title,
  };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}

const kgFmt = (kg, nf) => (kg < 0.001 ? `${nf(kg * 1000, 2)} g` : kg < 1 ? `${nf(kg * 1000)} g` : kg < 1000 ? `${nf(kg, kg < 10 ? 1 : 0)} kg` : kg < 1e9 ? `${nf(kg / 1000, kg < 1e4 ? 1 : 0)} t` : `${nf(kg / 1e12, 0)} mil mill. t`);

function drawIcon(ctx, kit, icon, cx, cy, t) {
  if (!icon) return;
  const labels = { spoon: 'Una cucharada (~13 g)', sack: 'Un costal (~13 kg)', truck: '2 tráileres (~54 t)', mountain: 'Más arroz del que existe', globe: '+500 años de cosecha mundial' };
  ctx.save();
  if (icon === 'spoon') {
    ctx.beginPath(); ctx.ellipse(cx - 70, cy, 50, 32, -0.2, 0, Math.PI * 2); kit.shape(ctx, '#cbd5e1', 5);
    kit.roundRect(ctx, cx - 25, cy - 9, 150, 18, 9); kit.shape(ctx, '#cbd5e1', 5);
    ctx.beginPath(); ctx.ellipse(cx - 70, cy - 6, 34, 16, -0.2, 0, Math.PI * 2); kit.shape(ctx, '#fffaf0', 3);
  } else if (icon === 'sack') {
    ctx.beginPath(); ctx.moveTo(cx - 60, cy + 50); ctx.quadraticCurveTo(cx - 80, cy - 20, cx - 25, cy - 45); ctx.lineTo(cx + 25, cy - 45);
    ctx.quadraticCurveTo(cx + 80, cy - 20, cx + 60, cy + 50); ctx.closePath(); kit.shape(ctx, '#d6b98c', 5);
    kit.roundRect(ctx, cx - 30, cy - 58, 60, 16, 6); kit.shape(ctx, '#92400e', 4);
    kit.text(ctx, 'ARROZ', cx, cy + 8, { size: 26, fill: '#7c2d12', stroke: null });
  } else if (icon === 'truck') {
    for (const dx of [-150, 40]) {
      kit.roundRect(ctx, cx + dx, cy - 40, 110, 62, 6); kit.shape(ctx, '#f8fafc', 4);
      kit.roundRect(ctx, cx + dx + 110, cy - 22, 36, 44, 6); kit.shape(ctx, '#ef4444', 4);
      for (const wx of [20, 85, 130]) { ctx.beginPath(); ctx.arc(cx + dx + wx, cy + 28, 12, 0, Math.PI * 2); kit.shape(ctx, '#111827', 3); }
    }
  } else if (icon === 'mountain') {
    ctx.beginPath(); ctx.moveTo(cx - 140, cy + 45); ctx.lineTo(cx - 30, cy - 55); ctx.lineTo(cx + 20, cy - 10); ctx.lineTo(cx + 60, cy - 45); ctx.lineTo(cx + 150, cy + 45); ctx.closePath();
    kit.shape(ctx, '#f4ead2', 5);
  } else if (icon === 'globe') {
    ctx.beginPath(); ctx.arc(cx, cy - 5, 55, 0, Math.PI * 2); kit.shape(ctx, '#3b82f6', 5);
    ctx.save(); ctx.clip(); ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.ellipse(cx - 18 + Math.sin(t * 0.5) * 4, cy - 18, 26, 16, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 22, cy + 18, 20, 13, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  kit.text(ctx, labels[icon], cx, cy + 78, { size: 32, weight: 800, lw: 8, maxW: 860 });
}
