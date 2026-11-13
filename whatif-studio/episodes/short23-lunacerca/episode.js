// Short 23: ¿y si la Luna estuviera a la mitad de distancia?
// La Luna se acerca → el doble de ancha y 4 veces más luz (2 × 2) → mareas ×8 (la fuerza crece al cubo)
// → donde sube 1 m, subiría unos 8 → luna llena cada ~10 días (Kepler) → eclipses más seguidos y
// largos → antes sí estuvo así de cerca y hoy se aleja ~3.8 cm al año.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(240, C.W, C.H, 23); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const night = (ctx, { W, H, kit, t }, a = 0.85) => { kit.gradientBG(ctx, W, H, '#020617', '#1e293b'); kit.drawStars(ctx, stars, a, t); };

/** Luna con cráteres y brillo alrededor. */
function moon(ctx, kit, x, y, r, { glow = 1 } = {}) {
  if (glow > 0) {
    const g = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 2.2);
    g.addColorStop(0, `rgba(226,232,240,${0.35 * glow})`); g.addColorStop(1, 'rgba(226,232,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); kit.shape(ctx, '#e5e7eb', Math.max(3, r * 0.05));
  const R = kit.rng(8);
  for (let i = 0; i < 7; i++) {
    const a = R() * TAU, d = R() * r * 0.65, cr = r * (0.08 + R() * 0.12);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, cr, 0, TAU); ctx.fillStyle = '#cbd5e1'; ctx.fill();
  }
  ctx.fillStyle = 'rgba(148,163,184,0.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.15, r * 0.35, r * 0.25, 0.4, 0, TAU); ctx.fill();
}

/** Paisaje nocturno: mar y siluetas de edificios; light = brillo extra de la luna (0..1). */
function seaCity(ctx, kit, W, H, light, t, moonX, moonR) {
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 1000, W, H - 1000);
  // Reflejo de la luna en el mar.
  for (let i = 0; i < 9; i++) {
    const y = 1015 + i * 16, w = moonR * (1.3 - i * 0.1) * (1 + 0.08 * Math.sin(t * 3 + i));
    ctx.fillStyle = `rgba(226,232,240,${0.5 - i * 0.04})`; ctx.fillRect(moonX - w / 2, y, w, 5);
  }
  const R = kit.rng(6);
  for (let x = -10; x < 360; ) { const w = 50 + R() * 40, h = 60 + R() * 140; ctx.fillStyle = '#020617'; ctx.fillRect(x, 1000 - h, w, h); x += w + 4; }
  if (light > 0) { ctx.save(); ctx.globalAlpha = 0.35 * light; ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    night(ctx, o);
    // La Luna se acerca y crece hasta el doble de ancho sobre el mar.
    const k = o.ease.inOut(kit.ramp(local, 0, Math.max(0.6, cue(1) + 0.4)));
    const r = 80 + 80 * (0.3 + 0.7 * k), x = 700, y = 690 - 30 * k;
    moon(ctx, kit, x, y, r);
    seaCity(ctx, kit, W, H, 0.3 * k, t, x, r);
    kit.text(ctx, `×${(r / 80).toFixed(1)}`, x, y + r + 60, { size: 54, fill: kit.YELLOW });
  },

  tamano(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    night(ctx, o);
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.4);
    moon(ctx, kit, 270, 700, 80, { glow: 0.5 });
    moon(ctx, kit, 740, 680, 160, { glow: 1 + q });
    kit.text(ctx, 'HOY', 270, 830, { size: 46, fill: '#ffffff' });
    kit.text(ctx, 'A LA MITAD', 740, 900, { size: 46, fill: kit.YELLOW });
    // Diámetro: 1 → 2.
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(580, 680); ctx.lineTo(900, 680); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(190, 700); ctx.lineTo(350, 700); ctx.stroke();
    if (q > 0) { ctx.save(); ctx.globalAlpha = 0.14 * q; ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    kit.text(ctx, q > 0.5 ? '× 4 DE LUZ' : '2 VECES MÁS ANCHA', W / 2, 230, { size: 100, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? '2 × 2 = 4 VECES MÁS ÁREA BRILLANTE' : 'EL DOBLE DE ANCHO EN EL CIELO', W / 2, 340, { size: 44, fill: '#e2e8f0', maxW: W * 0.92 });
    void t;
  },

  mareas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    night(ctx, o, 0.6);
    // La Tierra con su «abultamiento» de agua que apunta a la Luna: ×8.
    const k = kit.ramp(local, 0.3, cue(1) + 0.8), b = 18 + 140 * o.ease.out(k);
    const ex = 400, ey = 760, R = 200;
    ctx.beginPath(); ctx.ellipse(ex, ey, R + 12 + b, R + 12 - b * 0.25, 0, 0, TAU); ctx.fillStyle = 'rgba(56,189,248,0.45)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#7dd3fc'; ctx.stroke();
    drawGlobe(ctx, ex, ey, R, { lon0: -60 + t * 10, lat0: 10, glow: false });
    moon(ctx, kit, 900, ey, 70, { glow: 0.6 });
    for (const s of [-1, 1]) {
      const x0 = ex + s * (R + 30), x1 = ex + s * (R + 12 + b);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, ey); ctx.lineTo(x1, ey); ctx.stroke();
    }
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? '2 × 2 × 2 = 8' : 'MAREAS × 8', W / 2, 230, { size: 106, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'LA FUERZA CRECE AL CUBO' : 'LA LUNA JALA EL MAR', W / 2, 345, { size: 52, fill: '#bae6fd', maxW: W * 0.92 });
    void H;
  },

  costa(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0c4a6e', '#38bdf8');
    // Costa de perfil: el agua sube y baja; la amplitud pasa de 1 m a 8 m.
    const q = kit.ramp(local, 1.4, cue(1) + 0.2);
    const amp = 28 + 196 * q, lvl = 900 - amp * (0.5 + 0.5 * Math.sin(t * 1.6));
    ctx.beginPath(); ctx.moveTo(0, 1080); ctx.lineTo(0, 1020); ctx.lineTo(420, 960); ctx.quadraticCurveTo(620, 880, 760, 720); ctx.lineTo(W, 690); ctx.lineTo(W, 1080); ctx.closePath(); kit.shape(ctx, '#fde68a', 6);
    kit.house(ctx, 620, 868, 130, 110, {});
    kit.house(ctx, 900, 692, 150, 130, {});
    kit.tree(ctx, 480, 948, 120, {});
    ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = '#1d4ed8'; ctx.fillRect(0, lvl, W, 1080 - lvl); ctx.restore();
    ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, lvl + 6 * Math.sin(x * 0.03 + t * 4)); ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 1080, W, H - 1080);
    // Regla del nivel.
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(90, 900); ctx.lineTo(90, 900 - amp); ctx.stroke();
    kit.text(ctx, `${Math.round(1 + 7 * q)} m`, 160, 900 - amp - 10, { size: 46, fill: kit.YELLOW, align: 'left' });
    const m = Math.round(1 + 7 * q);
    kit.text(ctx, m <= 1 ? 'HOY: 1 METRO' : `¡${m} METROS!`, W / 2, 230, { size: 104, fill: m > 1 ? '#fca5a5' : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, 'COSTAS INUNDADAS 2 VECES AL DÍA', W / 2, 345, { size: 46, fill: '#e0f2fe', maxW: W * 0.92 });
  },

  mes(ctx, o) {
    const { W, H, kit, local, cue } = o;
    night(ctx, o, 0.5);
    // Calendario de 30 días: hoy 1 luna llena al mes; a la mitad de distancia, una cada ~10 días.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.4);
    const x0 = 120, y0 = 520, cw = 140, ch = 108;
    for (let d = 0; d < 30; d++) {
      const c = d % 6, r = Math.floor(d / 6), x = x0 + c * cw, y = y0 + r * ch;
      kit.roundRect(ctx, x, y, cw - 10, ch - 10, 12); kit.shape(ctx, '#1e293b', 4);
      kit.text(ctx, `${d + 1}`, x + 24, y + 24, { size: 26, fill: '#94a3b8', stroke: null });
      const full = q > 0.5 ? (d === 9 || d === 19 || d === 29) : d === 14;
      if (full) moon(ctx, kit, x + (cw - 10) / 2, y + (ch - 10) / 2 + 6, 32, { glow: 0.6 });
    }
    kit.text(ctx, q > 0.5 ? 'CADA 10 DÍAS' : 'HOY: CADA 29.5 DÍAS', W / 2, 230, { size: 96, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'TRES LUNAS LLENAS AL MES' : 'UNA LUNA LLENA AL MES', W / 2, 340, { size: 52, fill: '#e2e8f0' });
    void H;
  },

  eclipses(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#334155');
    // Sol con su corona tapado de sobra por una Luna el doble de grande.
    const cx = W / 2, cy = 720;
    const g = ctx.createRadialGradient(cx, cy, 120, cx, cy, 330);
    g.addColorStop(0, 'rgba(254,243,199,0.95)'); g.addColorStop(0.4, 'rgba(253,224,71,0.45)'); g.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 330, 0, TAU); ctx.fill();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + t * 0.1; ctx.strokeStyle = 'rgba(254,249,195,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 140, cy + Math.sin(a) * 140); ctx.lineTo(cx + Math.cos(a) * (230 + 40 * Math.sin(i * 3 + t)), cy + Math.sin(a) * (230 + 40 * Math.sin(i * 3 + t))); ctx.stroke(); }
    const k = kit.ramp(local, 0.1, 1.2), mx = cx + 420 * (1 - o.ease.out(k));
    ctx.beginPath(); ctx.arc(cx, cy, 120, 0, TAU); ctx.fillStyle = '#fde047'; ctx.fill();
    ctx.beginPath(); ctx.arc(mx, cy, 200, 0, TAU); kit.shape(ctx, '#0b1120', 6);
    kit.text(ctx, 'LUNA', mx, cy, { size: 46, fill: '#475569', stroke: null });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'MUCHO MÁS LARGOS' : 'ECLIPSES MÁS SEGUIDOS', W / 2, 230, { size: 90, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, 'LA LUNA TAPARÍA AL SOL DE SOBRA', W / 2, 340, { size: 48, fill: '#e2e8f0', maxW: W * 0.92 });
    void H;
  },

  loco(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    night(ctx, o, 0.6);
    // La Tierra y la Luna: antes cerca, hoy se aleja ~3.8 cm al año (lo miden con láser).
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    const k = kit.ramp(local, 0, cue(1) + 1.5), mx = 480 + 420 * o.ease.inOut(k);
    drawGlobe(ctx, 230, 760, 150, { lon0: t * 15, lat0: 15 });
    moon(ctx, kit, mx, 760, 50, { glow: 0.5 });
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(390, 900); ctx.lineTo(mx, 900); ctx.stroke(); ctx.setLineDash([]);
    if (q > 0.5) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(380, 740); ctx.lineTo(mx - 50, 755); ctx.stroke(); ctx.globalAlpha = 1; kit.text(ctx, 'LÁSER', (380 + mx) / 2, 700, { size: 36, fill: '#fca5a5' }); }
    kit.text(ctx, q > 0.5 ? '+3.8 CM AL AÑO' : 'ANTES ESTABA ASÍ DE CERCA', W / 2, 230, { size: q > 0.5 ? 104 : 74, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'Y SE SIGUE ALEJANDO' : 'HACE MILES DE MILLONES DE AÑOS', W / 2, 340, { size: 48, fill: '#e2e8f0', maxW: W * 0.92 });
    void H;
  },

  outro(ctx, o) {
    const { W, H, kit, t } = o;
    night(ctx, o);
    moon(ctx, kit, 720, 640, 90);
    seaCity(ctx, kit, W, H, 0, t, 720, 90);
    kit.text(ctx, '¡BUENAS NOCHES!', W / 2, 260, { size: 96, fill: kit.YELLOW, maxW: W * 0.92 });
  },
};
