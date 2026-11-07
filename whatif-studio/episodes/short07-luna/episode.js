// Short 07: ¿Y si la Luna desapareciera? Noche con Luna → noches oscuras → mareas pequeñas →
// corales sin calendario → no más eclipses → la Tierra se tambalea → gracias, Luna.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(260, C.W, C.H, 17); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const night = (ctx, { W, H, kit, t }, a = 0.9) => { kit.gradientBG(ctx, W, H, '#020617', '#1e1b4b'); kit.drawStars(ctx, stars, a, t); };

/** Luna llena con cráteres y halo. k: tamaño (0 = desaparecida). */
function moon(ctx, kit, x, y, r, k = 1, glow = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (glow > 0) {
    const g = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 2.2);
    g.addColorStop(0, `rgba(226,232,240,${0.35 * glow})`); g.addColorStop(1, 'rgba(226,232,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); kit.shape(ctx, '#f1f5f9', 7);
  ctx.fillStyle = 'rgba(148,163,184,0.55)';
  for (const [cx, cy, cr] of [[-0.35, -0.25, 0.2], [0.3, 0.2, 0.16], [-0.1, 0.42, 0.11], [0.38, -0.38, 0.09], [-0.45, 0.2, 0.08]]) {
    ctx.beginPath(); ctx.arc(cx * r, cy * r, cr * r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Estallido de destellos donde algo desaparece. */
function sparkle(ctx, x, y, age, r0 = 120) {
  if (age < 0 || age > 0.5) return;
  const k = age / 0.5;
  ctx.save(); ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14 * (1 - k);
  ctx.beginPath(); ctx.arc(x, y, r0 * (0.3 + 1.6 * k), 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fde68a';
  for (let i = 0; i < 10; i++) {
    const a = i * 0.628, d = r0 * (0.4 + 1.8 * k);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 12 * (1 - k), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function hills(ctx, W, H, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, y + 40);
  ctx.quadraticCurveTo(W * 0.25, y - 60, W * 0.5, y + 10); ctx.quadraticCurveTo(W * 0.75, y + 70, W, y - 20);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}

function coral(ctx, kit, x, y, h, color, seed) {
  const r = kit.rng(seed);
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  const tips = [];
  const branch = (bx, by, len, ang, w, depth) => {
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    if (depth <= 0) { tips.push([ex, ey]); return; }
    branch(ex, ey, len * 0.72, ang - 0.35 - r() * 0.3, w * 0.7, depth - 1);
    branch(ex, ey, len * 0.72, ang + 0.35 + r() * 0.3, w * 0.7, depth - 1);
  };
  branch(x, y, h * 0.4, -Math.PI / 2, 26, 3);
  ctx.fillStyle = color;
  for (const [tx, ty] of tips) { ctx.beginPath(); ctx.arc(tx, ty, 10, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  return tips;
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    night(ctx, o);
    const V = cue(1) + 0.35, mx = W / 2, my = 560;
    const k = local < V ? 1 : Math.max(0, 1 - (local - V) / 0.14);
    moon(ctx, kit, mx, my, 170, k * (1 + 0.015 * Math.sin(t * 3)), k);
    sparkle(ctx, mx, my, local - V, 170);
    // Colinas en el horizonte y mar con el reflejo de la Luna.
    const sea = 1080;
    hills(ctx, W, H, sea - 30, '#020617');
    ctx.fillStyle = '#0b1a3a'; ctx.fillRect(0, sea, W, H - sea);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = 0.8 * k; ctx.fillStyle = '#e2e8f0';
      for (let i = 0; i < 9; i++) {
        const y = sea + 30 + i * 46, w = 220 - i * 16 + Math.sin(t * 2 + i) * 18;
        kit.roundRect(ctx, mx - w / 2, y, w, 9, 4); ctx.fill();
      }
      ctx.restore();
    }
    kit.flash(ctx, W, H, 0.55 * kit.impulse(local, V, 0.18));
  },

  noches(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Paisaje iluminado por la Luna → la Luna se va → casi negro (solo estrellas y una linterna).
    kit.gradientBG(ctx, W, H, '#1e3a8a', '#3b82f6');
    const off = cue(1) + 0.1, k = kit.ramp(local, off, off + 0.5);
    moon(ctx, kit, 820, 430, 95, local < off ? 1 : Math.max(0, 1 - (local - off) / 0.12));
    hills(ctx, W, H, 1080, '#166534');
    kit.house(ctx, 300, 1080, 260, 210, { wall: '#cbd5e1', roofC: '#475569', lit: 1 });
    kit.tree(ctx, 560, 1080, 300, { leaf: '#15803d' });
    kit.person(ctx, 780, 1110, 190, { shirt: '#f59e0b' });
    // Oscuridad (≈100 veces menos luz).
    ctx.fillStyle = `rgba(1,2,10,${0.93 * k})`; ctx.fillRect(0, 0, W, H);
    kit.drawStars(ctx, stars, 0.3 + 0.7 * k, t);
    if (k > 0.5) {
      // Linterna: el único punto de luz.
      ctx.save(); ctx.globalAlpha = kit.ramp(local, off + 0.45, off + 0.65);
      const g = ctx.createLinearGradient(800, 960, 600, 1120);
      g.addColorStop(0, 'rgba(253,230,138,0.85)'); g.addColorStop(1, 'rgba(253,230,138,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(805, 965); ctx.lineTo(520, 1110); ctx.lineTo(650, 1160); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(805, 965, 10, 0, Math.PI * 2); ctx.fillStyle = '#fde68a'; ctx.fill();
      ctx.restore();
    }
    kit.text(ctx, k < 0.5 ? 'CON LUNA' : 'SIN LUNA', W / 2, 330, { size: 70, fill: k < 0.5 ? '#ffffff' : kit.YELLOW });
  },

  mareas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#e0f2fe');
    // Arriba: la Luna ya no está (contorno punteado) y el Sol queda solo.
    ctx.save(); ctx.setLineDash([14, 12]); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(300, 420, 70, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    kit.text(ctx, 'LUNA', 300, 545, { size: 34, weight: 800, fill: '#64748b', stroke: null });
    const sk = kit.ramp(local, cue(2), cue(2) + 0.2);
    kit.sun(ctx, 780, 420, 70 * (1 + 0.12 * sk * Math.max(0, Math.sin((local - cue(2)) * 6))), { t });
    kit.text(ctx, 'SOL', 780, 565, { size: 34, weight: 800, fill: '#b45309', stroke: null });
    // Marea: sube y baja; al quitar la Luna, mucho menos.
    const A = 110 - 75 * kit.ramp(local, cue(1) - 0.2, cue(1) + 0.6);
    const L = 980 + A * Math.sin(t * 2.6);
    ctx.fillStyle = '#2563eb'; ctx.fillRect(0, L, W, H - L);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = 0; x < W; x += 90) ctx.fillRect(x + ((t * 40) % 90), L, 50, 6);
    // Arena (rampa) por encima del agua.
    ctx.beginPath(); ctx.moveTo(380, H); ctx.lineTo(W, 760); ctx.lineTo(W, H); ctx.closePath(); kit.shape(ctx, '#fcd34d', 6);
    kit.tree(ctx, 960, 968, 260, { leaf: '#16a34a', lean: 0.15 }); // sobre la rampa de arena
    // Marcas de marea alta y baja (con Luna).
    ctx.save(); ctx.setLineDash([18, 12]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
    for (const y of [870, 1090]) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(560, y); ctx.stroke(); }
    ctx.restore();
    kit.text(ctx, 'MAREA ALTA', 60, 840, { size: 32, weight: 900, align: 'left', lw: 7 });
    kit.text(ctx, 'MAREA BAJA', 60, 1060, { size: 32, weight: 900, align: 'left', lw: 7 });
  },

  corales(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Arriba: noche con Luna llena; abajo: arrecife bajo el agua.
    kit.gradientBG(ctx, W, 360, '#020617', '#1e1b4b');
    moon(ctx, kit, 760, 230, 80, 1, 1 + 0.6 * kit.ramp(local, cue(1), cue(1) + 0.2) * (0.5 + 0.5 * Math.sin(t * 5)));
    const g = ctx.createLinearGradient(0, 330, 0, H);
    g.addColorStop(0, '#0e7490'); g.addColorStop(1, '#082f49');
    ctx.fillStyle = g; ctx.fillRect(0, 330, W, H - 330);
    // Rayos de luz de Luna.
    ctx.save(); ctx.globalAlpha = 0.12;
    for (let i = 0; i < 4; i++) { const x = 560 + i * 120 + Math.sin(t * 0.6 + i) * 30; ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + 60, 330); ctx.lineTo(x - 180, 1100); ctx.lineTo(x - 300, 1100); ctx.closePath(); ctx.fillStyle = '#e0f2fe'; ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#c2a36b'; ctx.beginPath(); ctx.moveTo(0, 1110); ctx.quadraticCurveTo(W / 2, 1060, W, 1110); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    const tips = [];
    [[150, '#f472b6'], [360, '#fb923c'], [560, '#f472b6'], [760, '#a78bfa'], [950, '#fb923c']].forEach(([x, c], i) => tips.push(...coral(ctx, kit, x, 1110, 320 + (i % 2) * 80, c, 40 + i)));
    // Desove: miles de huevitos suben a la vez (lo marca la Luna llena).
    const sp = local - cue(2);
    if (sp > 0) {
      const r = kit.rng(9);
      tips.forEach(([x, y], i) => {
        for (let j = 0; j < 2; j++) {
          const d = r() * 0.6, a = sp - d; if (a <= 0) continue;
          ctx.beginPath(); ctx.arc(x + Math.sin(a * 3 + i) * 14, y - a * (160 + r() * 80), 7, 0, Math.PI * 2);
          ctx.fillStyle = ['#fda4af', '#fed7aa', '#ffffff'][(i + j) % 3]; ctx.fill();
        }
      });
    }
    // Calendario con la Luna llena marcada.
    const ck = kit.ramp(local, cue(2) - 0.1, cue(2) + 0.15);
    if (ck > 0) {
      ctx.save(); ctx.globalAlpha = ck; ctx.translate(230, 520); ctx.rotate(-0.08); ctx.scale(0.8 + 0.2 * ck, 0.8 + 0.2 * ck);
      kit.roundRect(ctx, -130, -110, 260, 230, 18); kit.shape(ctx, '#ffffff', 7);
      ctx.fillStyle = '#ef4444'; kit.roundRect(ctx, -130, -110, 260, 54, 18); ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 5; c2++) ctx.fillRect(-105 + c2 * 44, -36 + r2 * 46, 30, 30);
      ctx.beginPath(); ctx.arc(-105 + 3 * 44 + 15, -36 + 46 + 15, 24, 0, Math.PI * 2); kit.shape(ctx, '#fde68a', 5);
      ctx.restore();
    }
  },

  eclipses(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    const cx = W / 2, cy = 760, R = 210;
    const mxp = -260 + (cx + 260) * o.ease.out(kit.ramp(local, 0, cue(1) - 0.2));
    const total = 1 - Math.min(1, Math.abs(mxp - cx) / (R * 2));
    const gone = local >= cue(1);
    const dim = gone ? 0 : total;
    kit.gradientBG(ctx, W, H, '#0b1026', '#1e293b');
    kit.drawStars(ctx, stars, 0.3 + 0.6 * dim, t);
    kit.sun(ctx, cx, cy, R, { t });
    if (!gone) {
      // Corona durante el eclipse.
      if (total > 0.9) {
        const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.8);
        g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(mxp, cy, R + 4, 0, Math.PI * 2); kit.shape(ctx, '#111827', 6);
    } else {
      sparkle(ctx, cx, cy, local - cue(1), R);
      // Sello: NUNCA MÁS.
      const sk = kit.ramp(local, cue(1) + 0.1, cue(1) + 0.25);
      if (sk > 0) {
        ctx.save(); ctx.translate(cx, cy + 20); ctx.rotate(-0.22); ctx.scale(1.5 - 0.5 * sk, 1.5 - 0.5 * sk); ctx.globalAlpha = sk;
        kit.roundRect(ctx, -300, -80, 600, 160, 20); ctx.lineWidth = 16; ctx.strokeStyle = '#dc2626'; ctx.stroke();
        kit.text(ctx, 'NUNCA MÁS', 0, 6, { size: 104, fill: '#dc2626', stroke: '#ffffff', lw: 10 });
        ctx.restore();
      }
    }
    kit.flash(ctx, W, H, 0.5 * kit.impulse(local, cue(1), 0.18));
  },

  eje(ctx, o) {
    const { W, kit, local, cue, t } = o;
    night(ctx, o, 0.8);
    const cx = W / 2, cy = 780, R = 220, tilt = 0.41;
    const a = t * 1.4, mx = cx + Math.cos(a) * 400, my = cy + Math.sin(a) * 110, front = Math.sin(a) > 0;
    ctx.save(); ctx.setLineDash([16, 14]); ctx.strokeStyle = 'rgba(148,163,184,0.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, 400, 110, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    if (!front) moon(ctx, kit, mx, my, 48, 1, 0.5);
    earthTilted(ctx, kit, cx, cy, R, tilt, t);
    if (front) moon(ctx, kit, mx, my, 48, 1, 0.5);
    const k = kit.ramp(local, cue(1), cue(1) + 0.2);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'INCLINACIÓN ESTABLE', W / 2, 330, { size: 70, fill: '#4ade80' }); ctx.restore(); }
    kit.text(ctx, '23°', cx + 120, cy - R - 70, { size: 46, fill: kit.YELLOW });
  },

  caos(ctx, o) {
    const { W, kit, local, cue, t } = o;
    night(ctx, o, 0.8);
    const cx = W / 2, cy = 780, R = 220;
    // Sin la Luna, la inclinación se tambalea (aquí, millones de años en segundos).
    const wob = kit.ramp(local, 0.1, 1.2);
    const tilt = 0.41 + wob * (0.55 * Math.sin(local * 2.4) + 0.2 * Math.sin(local * 5.1 + 1));
    ctx.save(); ctx.setLineDash([16, 14]); ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, 400, 110, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    earthTilted(ctx, kit, cx, cy, R, tilt, t);
    // Estaciones revueltas: sol, copo de nieve y hoja girando alrededor.
    const k = kit.ramp(local, cue(2), cue(2) + 0.25);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = k;
      [['sun', 0], ['snow', 2.1], ['leaf', 4.2]].forEach(([kind, ph], i) => {
        const a = ph + local * (2.2 + i * 0.7), x = cx + Math.cos(a) * 330, y = cy + Math.sin(a) * 300;
        if (kind === 'sun') kit.sun(ctx, x, y, 42, { t });
        else if (kind === 'snow') snowflake(ctx, kit, x, y, 52, local * 2);
        else { ctx.save(); ctx.translate(x, y); ctx.rotate(local * 3); ctx.beginPath(); ctx.ellipse(0, 0, 50, 26, 0, 0, Math.PI * 2); kit.shape(ctx, '#f97316', 6); ctx.restore(); }
      });
      ctx.restore();
    }
  },

  outro(ctx, o) {
    const { W, H, kit, local, t } = o;
    night(ctx, o);
    const k = kit.ramp(local, 0, 0.3);
    moon(ctx, kit, W / 2, 620, 170, o.ease.out(k) * (1 + 0.1 * Math.max(0, 1 - local / 0.4)), 1);
    hills(ctx, W, H, 1080, '#0f172a');
    // Alguien saluda a la Luna desde la colina.
    kit.person(ctx, W / 2 + 40, 1100, 170, { shirt: '#f59e0b', arms: 0.55 + 0.12 * Math.sin(t * 7) });
    const tk = kit.ramp(local, 0.2, 0.45);
    if (tk > 0) { ctx.save(); ctx.globalAlpha = tk; kit.text(ctx, 'GRACIAS, LUNA', W / 2, 330, { size: 92 * (0.8 + 0.2 * tk), fill: kit.YELLOW }); ctx.restore(); }
  },
};

/** Tierra inclinada con su eje. tilt en radianes (respecto a la vertical). */
function earthTilted(ctx, kit, cx, cy, R, tilt, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -R - 80); ctx.lineTo(0, -R + 10); ctx.moveTo(0, R - 10); ctx.lineTo(0, R + 80); ctx.stroke();
  drawGlobe(ctx, 0, 0, R, { lon0: -t * 40, lat0: 8 });
  ctx.restore();
  // Vertical de referencia.
  ctx.save(); ctx.setLineDash([10, 12]); ctx.strokeStyle = 'rgba(248,250,252,0.35)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy - R - 100); ctx.lineTo(cx, cy - R - 10); ctx.stroke(); ctx.restore();
  void kit;
}

function snowflake(ctx, kit, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.moveTo(0, -r * 0.6); ctx.lineTo(-r * 0.25, -r * 0.82); ctx.moveTo(0, -r * 0.6); ctx.lineTo(r * 0.25, -r * 0.82); ctx.stroke();
  }
  ctx.restore();
  void kit;
}
