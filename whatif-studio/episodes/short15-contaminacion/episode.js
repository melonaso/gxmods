// Short 15 (idea de @dianaisabeltijerinnava2598): ¿y si se acabara toda la contaminación del mundo?
// Smog que se despeja → el Himalaya visible desde la India → 7 millones de vidas → la Vía Láctea →
// el plástico sigue en el mar → sorpresa: un poco más de calor → el CO₂ dura siglos.

let stars, milky;
export function setup(C) {
  const { kit, W, H } = C;
  stars = kit.makeStars(260, W, H, 15);
  // Vía Láctea: muchas estrellitas concentradas en una franja diagonal.
  const r = kit.rng(77);
  milky = Array.from({ length: 1400 }, () => { const u = r(), off = (r() + r() + r() - 1.5) * 170; return { x: u * W + off * 0.5, y: 120 + u * 900 - off, s: 0.6 + r() * 1.8, a: 0.3 + r() * 0.7 }; });
}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const mixC = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return `rgb(${[16, 8, 0].map((s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * k)).join(',')})`; };

/** Ciudad con chimeneas; smoke 0..1 = cuánto humo sale. */
function city(ctx, kit, y, t, smoke, clean) {
  const B = [[100, 150, 380], [260, 140, 520], [420, 160, 330], [600, 150, 600], [780, 170, 440], [960, 140, 360]];
  B.forEach(([x, w, h], i) => kit.building(ctx, x, y, w, h, { color: mixC('#57534e', ['#64748b', '#475569', '#94a3b8', '#334155', '#78716c', '#57534e'][i], clean), lit: () => 0 }));
  // Fábrica con chimeneas.
  for (const cx of [170, 900]) {
    kit.roundRect(ctx, cx - 26, y - 520, 52, 520, 6); kit.shape(ctx, '#7f1d1d', 6);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(cx - 26, y - 470, 52, 22);
    if (smoke > 0) for (let i = 0; i < 9; i++) {
      const a = ((t * 0.35 + i / 9) % 1), px = cx + a * 160 + Math.sin(t + i) * 12, py = y - 540 - a * 420;
      ctx.globalAlpha = smoke * 0.75 * (1 - a); ctx.fillStyle = '#4b5563';
      ctx.beginPath(); ctx.arc(px, py, 30 + a * 70, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Montañas nevadas a lo lejos (el Himalaya). */
function himalaya(ctx, kit, y, W, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const peaks = [[-40, 260], [120, 330], [300, 250], [470, 380], [650, 290], [820, 350], [1000, 270], [1140, 300]];
  ctx.beginPath(); ctx.moveTo(-60, y);
  for (const [x, h] of peaks) { ctx.lineTo(x - 70, y - h * 0.55); ctx.lineTo(x, y - h); }
  ctx.lineTo(W + 60, y); ctx.closePath(); ctx.fillStyle = '#94a3b8'; ctx.fill();
  ctx.fillStyle = '#f8fafc';
  for (const [x, h] of peaks) { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - 34, y - h + 60); ctx.lineTo(x + 30, y - h + 55); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/** Botella de plástico flotando (inclinada). */
function bottle(ctx, kit, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  kit.roundRect(ctx, -22, -70, 44, 120, 16); kit.shape(ctx, 'rgba(147,197,253,0.85)', 5);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(-22, -20, 44, 26);
  kit.roundRect(ctx, -10, -96, 20, 28, 5); kit.shape(ctx, '#2563eb', 4);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Cielo gris de smog que se limpia en la segunda frase.
    const clean = o.ease.inOut(kit.ramp(local, cue(1), cue(1) + 1.2));
    kit.gradientBG(ctx, W, H, mixC('#78716c', '#38bdf8', clean), mixC('#a8a29e', '#e0f2fe', clean));
    if (clean > 0.2) kit.sun(ctx, 860, 520, 80, { t, on: clean });
    ctx.fillStyle = mixC('#57534e', '#65a30d', clean); ctx.fillRect(0, 1060, W, H - 1060);
    city(ctx, kit, 1060, t, 1 - clean, clean);
    // Neblina de smog encima de todo.
    ctx.fillStyle = `rgba(120,113,108,${0.45 * (1 - clean)})`; ctx.fillRect(0, 0, W, 1060);
  },

  aire(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Una calle de la India: al principio, smog; luego aparece el Himalaya al fondo.
    const clear = o.ease.inOut(kit.ramp(local, 0.2, cue(1) + 0.6));
    kit.gradientBG(ctx, W, H, mixC('#a8a29e', '#60a5fa', clear), mixC('#d6d3d1', '#e0f2fe', clear));
    himalaya(ctx, kit, 820, W, clear);
    ctx.fillStyle = `rgba(168,162,158,${0.85 * (1 - clear)})`; ctx.fillRect(0, 0, W, 860);
    ctx.fillStyle = '#a16207'; ctx.fillRect(0, 960, W, H - 960);
    for (let i = 0; i < 5; i++) kit.house(ctx, 110 + i * 215, 980, 170, 150, { wall: ['#fde68a', '#fecaca', '#bbf7d0', '#bfdbfe', '#fed7aa'][i], roofC: '#b45309' });
    for (let i = 0; i < 3; i++) kit.person(ctx, 300 + i * 230, 1080, 170, { shirt: ['#ec4899', '#f59e0b', '#14b8a6'][i], arms: clear > 0.8 ? 1 : 0 });
    const k = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, k > 0.5 ? 'EL HIMALAYA, A +150 km' : 'AIRE LIMPIO', W / 2, 230, { size: 78, fill: k > 0.5 ? '#ffffff' : kit.YELLOW, maxW: W * 0.92 });
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'INDIA · ABRIL 2020', W / 2, 330, { size: 44, fill: '#1e293b', stroke: '#ffffff', lw: 8 }); ctx.restore(); }
    void t;
  },

  vidas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#14532d', '#052e16');
    const n = 7e6 * o.ease.out(kit.ramp(local, 0.1, cue(1)));
    kit.text(ctx, kit.nf(Math.round(n / 1e4) * 1e4), W / 2, 240, { size: 120, fill: kit.YELLOW });
    kit.text(ctx, 'VIDAS AL AÑO', W / 2, 360, { size: 56, fill: '#ffffff' });
    // Pulmones que respiran.
    const b = 1 + 0.06 * Math.sin(t * 2.2);
    ctx.save(); ctx.translate(W / 2, 760); ctx.scale(b, b);
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 120, 30, 110, 210, sx * 0.15, 0, Math.PI * 2); kit.shape(ctx, mixC('#57534e', '#fb7185', kit.ramp(local, 0.1, 1.5)), 8); }
    kit.roundRect(ctx, -18, -260, 36, 200, 14); kit.shape(ctx, '#fda4af', 7);
    ctx.restore();
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q > 0) { ctx.save(); ctx.globalAlpha = q; kit.text(ctx, 'SEGÚN LA OMS', W / 2, 1080, { size: 46, fill: '#bbf7d0' }); ctx.restore(); }
    void H;
  },

  estrellas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // De noche: el resplandor naranja de la ciudad se apaga y aparece la Vía Láctea.
    const dark = o.ease.inOut(kit.ramp(local, 0.2, 1.4));
    kit.gradientBG(ctx, W, H, '#020617', mixC('#c2410c', '#0f172a', dark));
    kit.drawStars(ctx, stars, 0.2 + 0.8 * dark, t);
    ctx.save();
    for (const m of milky) { ctx.globalAlpha = m.a * dark; ctx.fillStyle = '#e0e7ff'; ctx.beginPath(); ctx.arc(m.x, m.y, m.s, 0, Math.PI * 2); ctx.fill(); }
    const g = ctx.createLinearGradient(0, 1020, W, 120); g.addColorStop(0.2, 'rgba(196,181,253,0)'); g.addColorStop(0.5, `rgba(196,181,253,${0.22 * dark})`); g.addColorStop(0.8, 'rgba(196,181,253,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1100);
    ctx.restore();
    // Casas con las luces apagadas y alguien mirando arriba.
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 1060, W, H - 1060);
    for (let i = 0; i < 4; i++) kit.house(ctx, 160 + i * 260, 1060, 200, 170, { wall: '#334155', roofC: '#1e293b', lit: 1 - dark });
    kit.person(ctx, W / 2 + 40, 1120, 150, { shirt: '#3b82f6', arms: 0.2 });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? '1 DE CADA 3 NO LA VE' : 'LA VÍA LÁCTEA', W / 2, 230, { size: 80, fill: q > 0.5 ? '#fde68a' : '#ffffff', maxW: W * 0.92 });
  },

  plastico(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#0c4a6e');
    // Superficie del mar con olas y botellas flotando.
    ctx.fillStyle = '#0369a1'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 560 + 12 * Math.sin(x / 70 + t * 2)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    const r = kit.rng(31);
    for (let i = 0; i < 14; i++) { const x = r() * W, y = 600 + r() * 500, s = 0.6 + r() * 0.6; bottle(ctx, kit, x + 10 * Math.sin(t + i), y + 8 * Math.sin(t * 1.5 + i), s, r() * 6 + 0.2 * Math.sin(t + i)); }
    const yrs = 450 * o.ease.out(kit.ramp(local, cue(1), cue(1) + 1.4));
    if (local < cue(1)) kit.text(ctx, 'SIGUE AHÍ', W / 2, 230, { size: 96, fill: '#ffffff' });
    else { kit.text(ctx, `${Math.round(yrs)} AÑOS`, W / 2, 230, { size: 110, fill: kit.YELLOW }); kit.text(ctx, 'PARA DESHACERSE', W / 2, 340, { size: 48, fill: '#ffffff' }); }
  },

  sorpresa(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e293b', '#0f172a');
    // El Sol, la Tierra y una capa de humo que rebota parte de la luz; al quitarla, sube el termómetro.
    kit.sun(ctx, 170, 600, 100, { t, on: 1 });
    ctx.beginPath(); ctx.arc(W / 2 + 120, 1010, 290, Math.PI, 2 * Math.PI); kit.shape(ctx, '#3b82f6', 8);
    const haze = 1 - kit.ramp(local, cue(1) - 0.2, cue(1) + 0.6);
    if (haze > 0) { ctx.save(); ctx.globalAlpha = haze; ctx.beginPath(); ctx.arc(W / 2 + 120, 1010, 350, Math.PI, 2 * Math.PI); ctx.lineWidth = 50; ctx.strokeStyle = 'rgba(156,163,175,0.8)'; ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < 5; i++) {
      const y0 = 560 + i * 26, x0 = 280, x1 = 520 + i * 45, y1 = 790 + i * 18;
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x0, y0);
      if (haze > 0.5 && i % 2 === 0) { ctx.lineTo(x1 - 70, y1 - 70); ctx.lineTo(x1 - 160, y1 - 330); } else ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // Termómetro.
    const temp = 0.35 + 0.35 * kit.ramp(local, cue(1), cue(1) + 1.0);
    ctx.save(); ctx.translate(930, 520);
    kit.roundRect(ctx, -26, -230, 52, 300, 26); kit.shape(ctx, '#f8fafc', 6);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(-12, 60 - 260 * temp, 24, 260 * temp);
    ctx.beginPath(); ctx.arc(0, 90, 44, 0, Math.PI * 2); kit.shape(ctx, '#ef4444', 6);
    ctx.restore();
    kit.text(ctx, local < cue(1) ? '¿SORPRESA?' : '+ UN POQUITO DE CALOR', W / 2, 200, { size: 74, fill: local < cue(1) ? '#ffffff' : '#fca5a5', maxW: W * 0.94 });
  },

  co2(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e3a8a');
    // Gráfica: la temperatura deja de subir y se queda arriba mucho tiempo.
    const x0 = 120, x1 = W - 100, y0 = 980, y1 = 470;
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y1 - 40); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
    kit.text(ctx, 'TEMPERATURA', x0 + 170, y1 - 70, { size: 34, fill: '#cbd5e1' });
    kit.text(ctx, 'AÑOS →', x1 - 90, y0 + 50, { size: 34, fill: '#cbd5e1' });
    const prog = kit.ramp(local, 0.1, o.s.dur - 0.3), xm = x0 + (x1 - x0) * 0.35;
    ctx.strokeStyle = '#f87171'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i <= 100 * prog; i++) {
      const u = i / 100, x = x0 + (x1 - x0) * u;
      const y = u < 0.35 ? y0 - (y0 - y1) * Math.pow(u / 0.35, 1.6) : y1 + (y0 - y1) * 0.08 * (u - 0.35);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([14, 12]); ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xm, y0); ctx.lineTo(xm, y1 - 30); ctx.stroke(); ctx.setLineDash([]);
    kit.text(ctx, 'HOY', xm, y0 + 50, { size: 36, fill: '#fde68a' });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'TARDA SIGLOS EN BAJAR' : 'EL CO₂ DURA SIGLOS', W / 2, 230, { size: 76, fill: q > 0.5 ? '#fca5a5' : '#ffffff', maxW: W * 0.92 });
    void H;
  },

  outro(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');
    kit.sun(ctx, 860, 520, 80, { t, on: 1 });
    ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 1060, W, H - 1060);
    city(ctx, kit, 1060, t, 0, 1);
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE', W / 2, 250, { size: 56, fill: '#0f172a', stroke: '#ffffff', lw: 10 }); kit.text(ctx, '@dianaisabeltijerinnava2598', W / 2, 330, { size: 52, fill: kit.YELLOW, maxW: W * 0.94 }); ctx.restore(); }
  },
};
