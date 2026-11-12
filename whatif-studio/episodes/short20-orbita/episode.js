// Short 20: ¿y si la Tierra dejara de dar vueltas alrededor del Sol?
// La órbita se detiene → hoy vamos a 30 km/s → caída de 65 días (T ÷ 4√2) → día 14: solo 3 % más
// cerca → día 41: órbita de Venus (×1.9 de luz) → día 57: Mercurio (×6.7) → última semana → choque →
// frenarla costaría ~80 días de toda la energía del Sol.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(240, C.W, C.H, 20); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const TF = 365.25 / (4 * Math.SQRT2); // 64.6 días de caída
const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#1e1b4b'); kit.drawStars(ctx, stars, 0.85, t); };
const mixC = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = [16, 8, 0].map((s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * k)); return `rgb(${c.join(',')})`; };

/** Distancia al Sol (en UA) tras `day` días de caída libre desde 1 UA (cicloide: t ∝ η + sen η). */
function fallR(day) {
  const target = Math.PI * Math.min(1, Math.max(0, day / TF));
  let lo = 0, hi = Math.PI;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (m + Math.sin(m) < target) lo = m; else hi = m; }
  return (1 + Math.cos((lo + hi) / 2)) / 2;
}

/** Tierra; heat 0..1 la vuelve rojiza (más luz del Sol). */
function earth(ctx, x, y, R, t, heat = 0) {
  drawGlobe(ctx, x, y, R, { lon0: -90 + t * 25, lat0: 15, glow: heat < 0.3, outline: 4, ocean: mixC('#2b7bd6', '#9a3412', heat), land: mixC('#4fbf5a', '#78350f', heat), ice: mixC('#f1f5f9', '#fdba74', heat) });
}

// ---------- Vista de la órbita (Sol al centro) ----------
const OC = { x: 540, y: 820, rx: 400, ry: 170 };
const orbitPos = (a) => [OC.x + Math.cos(a) * OC.rx, OC.y + Math.sin(a) * OC.ry];

function orbitView(ctx, o, a, { arrow = 1, drift = 0, cross = 0 } = {}) {
  const { kit, t } = o;
  ctx.save(); ctx.setLineDash([16, 14]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(OC.x, OC.y, OC.rx, OC.ry, 0, 0, TAU); ctx.stroke(); ctx.restore();
  let [x, y] = orbitPos(a);
  x += (OC.x - x) * drift; y += (OC.y - y) * drift;
  const behind = Math.sin(a) < 0 && drift < 0.5;
  if (behind) earth(ctx, x, y, 46, t);
  kit.sun(ctx, OC.x, OC.y, 100, { t });
  if (!behind) earth(ctx, x, y, 52, t);
  if (arrow > 0) {
    const dx = -Math.sin(a) * OC.rx, dy = Math.cos(a) * OC.ry, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const x0 = x + ux * 64, y0 = y + uy * 64, x1 = x + ux * 230, y1 = y + uy * 230;
    ctx.save(); ctx.globalAlpha = arrow; ctx.strokeStyle = '#facc15'; ctx.fillStyle = '#facc15'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 + ux * 30, y1 + uy * 30); ctx.lineTo(x1 - uy * 22, y1 + ux * 22); ctx.lineTo(x1 + uy * 22, y1 - ux * 22); ctx.closePath(); ctx.fill();
    if (cross > 0) {
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      ctx.globalAlpha = cross; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(mx - 50, my - 50); ctx.lineTo(mx + 50, my + 50); ctx.moveTo(mx + 50, my - 50); ctx.lineTo(mx - 50, my + 50); ctx.stroke();
    }
    ctx.restore();
    return [x1, y1];
  }
  return [x, y];
}

// ---------- Vista de la caída (Sol a la izquierda) ----------
const SX = 170, SY = 760, AU = 780;

function fallMap(ctx, o, day, { hl = null } = {}) {
  const { kit, t, W } = o;
  const r = fallR(day), x = SX + r * AU;
  const arcs = [[1, 'TIERRA', '#60a5fa'], [0.723, 'VENUS', '#fbbf24'], [0.387, 'MERCURIO', '#a8a29e']];
  for (const [ra, name, col] of arcs) {
    const R = ra * AU, ang = Math.min(1.3, Math.asin(Math.min(1, 300 / R)));
    ctx.save(); ctx.setLineDash([12, 12]); ctx.lineWidth = hl === name ? 6 : 3; ctx.strokeStyle = hl === name ? col : 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(SX, SY, R, -ang, ang); ctx.stroke(); ctx.restore();
    if (name !== 'TIERRA') {
      const pa = -ang * 0.8, px = SX + Math.cos(pa) * R, py = SY + Math.sin(pa) * R;
      ctx.beginPath(); ctx.arc(px, py, name === 'VENUS' ? 20 : 13, 0, TAU); kit.shape(ctx, col, 4);
      kit.text(ctx, name, px, py - 44, { size: 34, fill: hl === name ? col : '#e2e8f0' });
    }
  }
  // Camino de la caída.
  ctx.save(); ctx.setLineDash([6, 14]); ctx.strokeStyle = 'rgba(253,186,116,0.6)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(SX + 130, SY); ctx.lineTo(SX + AU, SY); ctx.stroke(); ctx.restore();
  const heat = Math.min(1, (1 / (r * r) - 1) / 6);
  kit.sun(ctx, SX, SY, 110 + 20 * heat, { t });
  if (r > 0.17) {
    earth(ctx, x, SY, 50, t, heat);
    kit.text(ctx, `×${(1 / (r * r)).toFixed(1)} DE LUZ`, x, SY + 95, { size: 40, fill: heat > 0.4 ? '#fdba74' : '#ffffff' });
  }
  void W;
  return r;
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue } = o;
    space(ctx, o);
    // La Tierra gira alrededor del Sol… y en la segunda frase se detiene y empieza a caer.
    const P = Math.max(0.5, cue(1) + 0.2);
    const a = 0.9 + 1.4 * Math.min(local, P);
    const cross = kit.ramp(local, P, P + 0.25), arrow = 1 - kit.ramp(local, P + 0.6, P + 1.0);
    const drift = 0.12 * kit.ramp(local, P + 0.6, P + 3);
    orbitView(ctx, o, a, { arrow, cross, drift });
    kit.flash(ctx, W, H, 0.3 * kit.impulse(local, P, 0.25), '#ffffff');
  },

  velocidad(ctx, o) {
    const { W, kit, local, cue } = o;
    space(ctx, o);
    const a = 2.2 + 0.9 * local;
    const [ax, ay] = orbitView(ctx, o, a);
    kit.text(ctx, '30 km/s', ax, ay - 50, { size: 44, fill: kit.YELLOW });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q < 0.5) {
      kit.text(ctx, '30 KM POR SEGUNDO', W / 2, 230, { size: 88, fill: '#ffffff', maxW: W * 0.92 });
      kit.text(ctx, '≈ 107,000 KM/H', W / 2, 335, { size: 56, fill: kit.YELLOW });
    } else {
      kit.text(ctx, 'LO QUE NOS SALVA', W / 2, 230, { size: 96, fill: '#4ade80', maxW: W * 0.92 });
      kit.text(ctx, 'SIN ELLA, CAERÍAMOS AL SOL', W / 2, 335, { size: 50, fill: '#ffffff', maxW: W * 0.92 });
    }
    kit.text(ctx, '2π × 150 millones de km ÷ 1 año ≈ 30 km/s', W / 2, 440, { size: 36, fill: '#c7d2fe', maxW: W * 0.92 });
  },

  caida(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    fallMap(ctx, o, 0);
    // Flecha que apunta al Sol.
    const pulse = 1 + 0.1 * Math.sin(t * 6);
    ctx.save(); ctx.translate(SX + AU - 110, SY - 120); ctx.scale(pulse, pulse); ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(-80, 0); ctx.lineTo(-20, -36); ctx.lineTo(-20, -14); ctx.lineTo(70, -14); ctx.lineTo(70, 14); ctx.lineTo(-20, 14); ctx.lineTo(-20, 36); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = kit.INK; ctx.stroke(); ctx.restore();
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q < 0.5) {
      kit.text(ctx, 'CAERÍAMOS', W / 2, 230, { size: 104, fill: '#ffffff' });
      kit.text(ctx, 'DIRECTO HACIA EL SOL', W / 2, 335, { size: 52, fill: '#fdba74' });
    } else {
      const n = Math.round(65 * o.ease.out(kit.ramp(local, cue(1), cue(1) + 0.8)));
      kit.text(ctx, `${n} DÍAS`, W / 2, 230, { size: 130, fill: kit.YELLOW });
      kit.text(ctx, 'HASTA CHOCAR CON EL SOL', W / 2, 345, { size: 50, fill: '#ffffff', maxW: W * 0.92 });
    }
  },

  semanas(ctx, o) {
    const { W, kit, local, cue } = o;
    space(ctx, o);
    const day = 14 * kit.clamp(local / (cue(1) + 1.0));
    const r = fallR(day);
    fallMap(ctx, o, day);
    kit.text(ctx, `DÍA ${Math.floor(day)}`, W / 2, 230, { size: 110, fill: '#ffffff' });
    kit.text(ctx, `${Math.round((1 - r) * 100)} % MÁS CERCA`, W / 2, 345, { size: 56, fill: '#93c5fd' });
  },

  venus(ctx, o) {
    const { W, kit, local } = o;
    space(ctx, o);
    const day = 14 + (41.2 - 14) * o.ease.inOut(kit.ramp(local, 0, 1.0));
    fallMap(ctx, o, day, { hl: 'VENUS' });
    kit.text(ctx, `DÍA ${Math.floor(day)}`, W / 2, 230, { size: 110, fill: '#fbbf24' });
    kit.text(ctx, 'CRUZAMOS LA ÓRBITA DE VENUS', W / 2, 345, { size: 48, fill: '#ffffff', maxW: W * 0.92 });
  },

  mercurio(ctx, o) {
    const { W, kit, local } = o;
    space(ctx, o);
    const day = 41.2 + (57 - 41.2) * o.ease.inOut(kit.ramp(local, 0, 1.0));
    fallMap(ctx, o, day, { hl: 'MERCURIO' });
    kit.text(ctx, `DÍA ${Math.floor(day)}`, W / 2, 230, { size: 110, fill: '#fdba74' });
    kit.text(ctx, 'EL SOL SE VE 2.6 VECES MÁS GRANDE', W / 2, 345, { size: 44, fill: '#ffffff', maxW: W * 0.92 });
  },

  final(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // Última semana: la caída se acelera y la Tierra choca con el Sol.
    const P = cue(1) + 1.0, k = kit.clamp(local / P), day = 57 + (TF - 57) * k * k;
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); kit.speedLines(ctx, W, 600, 920, t, { n: 16, speed: 1800 + 2600 * k, color: `rgba(253,186,116,${0.5 * k})` }); ctx.restore();
    fallMap(ctx, o, Math.min(day, TF - 0.01));
    if (local >= P) {
      const u = kit.clamp((local - P) / 1.2);
      const g = ctx.createRadialGradient(SX, SY, 0, SX, SY, 200 + 1200 * u);
      g.addColorStop(0, 'rgba(255,251,235,1)'); g.addColorStop(0.5, 'rgba(253,186,116,0.9)'); g.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    kit.flash(ctx, W, H, 0.8 * kit.impulse(local, P, 0.4), '#ffffff');
    const n = Math.floor(Math.max(0, TF - day)), left = n >= 2 ? `FALTAN ${n} DÍAS` : n === 1 ? 'FALTA 1 DÍA' : 'FALTAN HORAS';
    kit.text(ctx, local < P ? left : '¡DÍA 65!', W / 2, 230, { size: 100, fill: local < P ? '#fca5a5' : kit.YELLOW, maxW: W * 0.92 });
    kit.text(ctx, local < P ? 'TODO SE ACELERA' : 'CHOCAMOS CON EL SOL', W / 2, 345, { size: 52, fill: '#ffffff', maxW: W * 0.92 });
  },

  frenar(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // El Sol «paga» la frenada: casi 3 meses (80 días) de toda su energía.
    kit.sun(ctx, 230, 600, 110, { t });
    earth(ctx, 820, 600, 120, t);
    const k = kit.ramp(local, 0.3, cue(1) + 1.2);
    for (let i = 0; i < 6; i++) {
      const u = (local * 0.8 + i / 6) % 1, x = 360 + u * 330;
      ctx.save(); ctx.globalAlpha = Math.min(1, u * 5, (1 - u) * 5); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x, 600 + 20 * Math.sin(u * 8 + i), 12, 0, TAU); ctx.fill(); ctx.restore();
    }
    // Tres meses: se llenan hasta 80 días (2.6 meses).
    for (let m = 0; m < 3; m++) {
      const x = 150 + m * 270, fill = kit.clamp((k * 80) / 30 - m);
      kit.roundRect(ctx, x, 880, 240, 150, 18); kit.shape(ctx, '#1e293b', 6);
      if (fill > 0) { ctx.save(); kit.roundRect(ctx, x + 8, 888, 224 * fill, 134, 12); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.restore(); }
      kit.text(ctx, `MES ${m + 1}`, x + 120, 955, { size: 44, fill: '#ffffff' });
    }
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q < 0.5) {
      kit.text(ctx, 'PARA FRENARLA…', W / 2, 230, { size: 100, fill: '#ffffff' });
      kit.text(ctx, 'HARÍA FALTA MUCHÍSIMA ENERGÍA', W / 2, 335, { size: 46, fill: '#c7d2fe', maxW: W * 0.92 });
    } else {
      kit.text(ctx, `${Math.round(80 * k)} DÍAS DE SOL`, W / 2, 230, { size: 100, fill: kit.YELLOW, maxW: W * 0.92 });
      kit.text(ctx, 'TODA SU ENERGÍA, SIN DESPERDICIAR NADA', W / 2, 335, { size: 42, fill: '#ffffff', maxW: W * 0.92 });
    }
  },

  outro(ctx, o) {
    const { W, kit, local } = o;
    space(ctx, o);
    orbitView(ctx, o, 1.2 + 1.3 * local, { arrow: 1 });
    kit.text(ctx, '¡SIGUE GIRANDO!', W / 2, 260, { size: 96, fill: kit.YELLOW, maxW: W * 0.92 });
  },
};
