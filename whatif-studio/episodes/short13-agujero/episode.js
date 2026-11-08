// Short 13: ¿y si cayeras en un agujero negro?
// El más cercano (1,560 años luz) → la gravedad te estira (espaguetificación) → desde lejos tu reloj
// se frena → el horizonte de sucesos → en uno gigante cruzas sin sentir nada… al principio.

let stars;
export function setup(C) { stars = C.kit.makeStars(300, C.W, C.H, 13); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#02030a', '#140b2e'); kit.drawStars(ctx, stars, 0.9, t); };

/** Agujero negro: disco de acreción (detrás y delante), anillo de luz y la sombra negra. */
function blackHole(ctx, x, y, r, t, tilt = 0.28) {
  const disk = (front) => {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    if (front) ctx.rect(-r * 3, 0, r * 6, r * 3); else ctx.rect(-r * 3, -r * 3, r * 6, r * 3);
    ctx.clip();
    for (let k = 0; k < 7; k++) {
      const rr = r * (1.25 + k * 0.22), a = 0.95 - k * 0.12;
      ctx.lineWidth = r * 0.2; ctx.strokeStyle = `rgba(${255},${170 - k * 14},${60 - k * 6},${a})`;
      ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * tilt, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Grumos brillantes que giran.
    for (let i = 0; i < 18; i++) {
      const a = t * (1.5 - (i % 3) * 0.3) + i * 0.7, rr = r * (1.3 + (i % 5) * 0.25);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * tilt;
      if ((py > 0) !== front) continue;
      ctx.fillStyle = 'rgba(255,240,200,0.85)'; ctx.beginPath(); ctx.ellipse(px, py, r * 0.08, r * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
  // Resplandor.
  const g = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 3.2);
  g.addColorStop(0, 'rgba(255,150,60,0.35)'); g.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
  disk(false);
  // Anillo de fotones y sombra.
  ctx.beginPath(); ctx.arc(x, y, r * 1.06, 0, Math.PI * 2); ctx.lineWidth = r * 0.09; ctx.strokeStyle = '#fde68a'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#000000'; ctx.fill();
  disk(true);
}

/** Astronauta con los pies en (x, y), altura h; stretch > 1 lo estira hacia abajo (hacia el agujero). */
function astronaut(ctx, kit, x, y, h, { rot = 0, stretch = 1, red = 0, wave = 0, t = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / Math.sqrt(stretch), stretch);
  const u = h / 100, suit = red > 0 ? `rgb(${255},${Math.round(255 - 140 * red)},${Math.round(255 - 180 * red)})` : '#f8fafc';
  const L = 3 / Math.sqrt(stretch);
  const wig = (k) => wave * Math.sin(t * 6 + k) * 6 * u;
  kit.roundRect(ctx, -18 * u + wig(0), -38 * u, 15 * u, 38 * u, 6 * u); kit.shape(ctx, suit, L);
  kit.roundRect(ctx, 3 * u + wig(1), -38 * u, 15 * u, 38 * u, 6 * u); kit.shape(ctx, suit, L);
  kit.roundRect(ctx, -30 * u + wig(2), -72 * u, 12 * u, 32 * u, 6 * u); kit.shape(ctx, suit, L);
  kit.roundRect(ctx, 18 * u + wig(3), -72 * u, 12 * u, 32 * u, 6 * u); kit.shape(ctx, suit, L);
  kit.roundRect(ctx, -20 * u, -76 * u, 40 * u, 42 * u, 10 * u); kit.shape(ctx, suit, L);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(-8 * u, -66 * u, 16 * u, 8 * u);
  ctx.beginPath(); ctx.arc(0, -90 * u, 17 * u, 0, Math.PI * 2); kit.shape(ctx, suit, L);
  ctx.beginPath(); ctx.ellipse(0, -90 * u, 11 * u, 8 * u, 0, 0, Math.PI * 2); kit.shape(ctx, '#1e3a8a', L * 0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-4 * u, -93 * u, 3 * u, 2 * u, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Reloj de manecillas; ang en vueltas. */
function clock(ctx, kit, x, y, r, ang, label, col) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 7);
  ctx.fillStyle = kit.INK; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.lineCap = 'round';
  const a = ang * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = kit.INK; ctx.fill();
  kit.text(ctx, label, x, y + r + 50, { size: 40, fill: col });
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    blackHole(ctx, W / 2, 680, 170, t);
    // El astronauta cae en espiral hacia el agujero.
    const k = kit.ramp(local, cue(1) - 0.3, cue(1) + 2.2), a = 2.2 - 3.4 * k, d = 520 - 330 * o.ease.in(k);
    astronaut(ctx, kit, W / 2 + Math.cos(a) * d, 680 + Math.sin(a) * d * 0.5 + 40, 110, { rot: a + Math.PI / 2, t });
  },

  lejos(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // La Tierra (punto azul) y el agujero negro, muy lejos.
    ctx.beginPath(); ctx.arc(170, 860, 34, 0, Math.PI * 2); kit.shape(ctx, '#3b82f6', 5);
    kit.text(ctx, 'TIERRA', 170, 940, { size: 36, fill: '#93c5fd' });
    blackHole(ctx, 880, 560, 70, t);
    ctx.save(); ctx.setLineDash([22, 18]); ctx.strokeStyle = 'rgba(203,213,225,0.8)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(210, 840); ctx.lineTo(820, 590); ctx.stroke(); ctx.restore();
    // Nave: avanza casi nada.
    const p = 0.04 * kit.ramp(local, 0.2, o.s.dur);
    ctx.save(); ctx.translate(210 + 610 * p, 840 - 250 * p); ctx.rotate(1.18);
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(12, -10, 10, 22); ctx.lineTo(-10, 22); ctx.quadraticCurveTo(-12, -10, 0, -30); ctx.closePath(); kit.shape(ctx, '#f1f5f9', 4);
    ctx.restore();
    kit.text(ctx, '1,560 AÑOS LUZ', W / 2, 230, { size: 92, fill: kit.YELLOW });
    const k = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = k;
      const yrs = 2e6 * o.ease.out(kit.ramp(local, cue(1), cue(1) + 1.2));
      kit.text(ctx, `${kit.nf(Math.round(yrs / 1000) * 1000)} AÑOS`, W / 2, 340, { size: 70, fill: '#ffffff' });
      kit.text(ctx, '(a 692,000 km/h, la nave más rápida)', W / 2, 420, { size: 36, fill: '#cbd5e1' });
      ctx.restore();
    }
  },

  estirar(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    blackHole(ctx, W / 2, 960, 110, t);
    const st = 1 + 1.6 * o.ease.inOut(kit.ramp(local, cue(1) - 0.2, cue(1) + 1.0));
    const fy = 680;
    astronaut(ctx, kit, W / 2, fy, 150, { stretch: st, t });
    // Flechas: la de los pies (más cerca) es más larga que la de la cabeza.
    const arrow = (x, y, len, col) => { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.lineTo(12, len - 30); ctx.lineTo(30, len - 30); ctx.lineTo(0, len); ctx.lineTo(-30, len - 30); ctx.lineTo(-12, len - 30); ctx.closePath(); kit.shape(ctx, col, 5); ctx.restore(); };
    const a = kit.ramp(local, 0.2, 0.6);
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a;
      arrow(W / 2 + 180, fy - 150 * st, 90, '#93c5fd'); kit.text(ctx, 'CABEZA', W / 2 + 300, fy - 150 * st + 40, { size: 34, fill: '#93c5fd' });
      arrow(W / 2 + 180, fy - 20, 170, '#fb923c'); kit.text(ctx, 'PIES', W / 2 + 290, fy + 60, { size: 34, fill: '#fb923c' });
      ctx.restore();
    }
  },

  nombre(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // El astronauta convertido en fideo que ondula y cae.
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#fde68a', '#fcd34d', '#fbbf24'][i]; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
      for (let y = 380; y <= 1020; y += 10) { const x = W / 2 - 40 + i * 40 + 30 * Math.sin(y / 60 + t * 4 + i); y === 380 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(W / 2, 360, 34, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 6);
    ctx.beginPath(); ctx.ellipse(W / 2, 360, 22, 15, 0, 0, Math.PI * 2); kit.shape(ctx, '#1e3a8a', 4);
    const k = o.ease.out(kit.ramp(local, cue(1) - 0.05, cue(1) + 0.35));
    if (k > 0) {
      ctx.save(); ctx.translate(W / 2, 210); ctx.scale(1 + 0.25 * (1 - k), k);
      kit.text(ctx, 'ESPAGUETIFICACIÓN', 0, 0, { size: 84, fill: kit.YELLOW, maxW: W * 0.94 });
      ctx.restore();
    }
  },

  tiempo(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    blackHole(ctx, W / 2, 900, 180, t, 0.22);
    // Tu reloj va normal; el que ve el de lejos se frena casi hasta pararse.
    const slow = local < 0.3 ? local : 0.3 + Math.log(1 + (local - 0.3) * 2) * 0.12;
    clock(ctx, kit, 280, 420, 120, local * 0.5, 'TÚ', '#86efac');
    clock(ctx, kit, 800, 420, 120, slow * 0.5, 'DESDE LEJOS', '#fca5a5');
    // El astronauta se queda "pegado" al borde y se va poniendo rojo y tenue.
    const k = kit.ramp(local, 0.2, o.s.dur), y = 700 - 40 * (1 - Math.exp(-3 * k));
    ctx.save(); ctx.globalAlpha = 1 - 0.6 * kit.ramp(local, cue(1), o.s.dur);
    astronaut(ctx, kit, W / 2, y, 90, { red: k, t });
    ctx.restore();
  },

  horizonte(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const cx = W / 2, cy = 760, r = 260;
    blackHole(ctx, cx, cy, r, t, 0.2);
    // Rayos de luz que intentan salir y se curvan de regreso.
    const k = kit.ramp(local, 0.2, 1.2);
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(253,230,138,0.95)'; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a0 = -Math.PI / 2 + (i - 2.5) * 0.35, len = 0.9 * k;
      ctx.beginPath();
      for (let u = 0; u <= len; u += 0.02) {
        const rr = r * (0.75 + 0.45 * Math.sin(Math.PI * u)), a = a0 + (i < 3 ? -1 : 1) * u * 1.2;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        u ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([16, 12]); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r * 1.0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    kit.text(ctx, 'HORIZONTE DE SUCESOS', W / 2, 230, { size: 70, fill: '#fca5a5', maxW: W * 0.92 });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q > 0) { ctx.save(); ctx.globalAlpha = q; kit.text(ctx, '?', cx, cy + 10, { size: 160, fill: '#ffffff' }); ctx.restore(); }
  },

  gigante(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // Uno gigante: el borde casi plano llena la pantalla; el astronauta lo cruza tranquilo.
    const cy = 2350, r = 1500;
    const g = ctx.createRadialGradient(W / 2, cy, r * 0.98, W / 2, cy, r * 1.25);
    g.addColorStop(0, 'rgba(255,170,70,0.75)'); g.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, cy, r * 1.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = '#fde68a'; ctx.stroke();
    kit.text(ctx, 'SAGITARIO A*', W / 2, 230, { size: 80, fill: '#fdba74' });
    kit.text(ctx, '4 MILLONES DE SOLES', W / 2, 320, { size: 48, fill: '#ffffff' });
    const k = kit.ramp(local, 0.2, o.s.dur - 0.2);
    const y = 600 + 520 * k;
    const st = 1 + 1.4 * o.ease.in(kit.ramp(local, cue(1) + 1.0, o.s.dur));
    astronaut(ctx, kit, W / 2, y, 120, { wave: 1 - kit.ramp(local, cue(1) + 0.8, cue(1) + 1.2), stretch: st, t });
    if (local < cue(1) + 0.8) kit.text(ctx, 'TODO BIEN…', W / 2 + 190, y - 120, { size: 40, fill: '#bbf7d0' });
  },

  outro(ctx, o) {
    const { W, kit, t } = o;
    space(ctx, o);
    blackHole(ctx, W / 2, 680, 190, t);
    kit.text(ctx, '¿TE ACERCARÍAS?', W / 2, 260, { size: 80, fill: kit.YELLOW });
  },
};
