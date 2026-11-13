// Short 22: ¿y si la Tierra fuera el doble de grande?
// La Tierra crece ×2 → gravedad ×2 (60 kg se sienten como 120) → salto a la mitad y caídas ×2 →
// superficie ×4 y volumen ×8 → cohete: el doble de velocidad → 99.5 % de combustible (Tsiolkovsky)
// → en una supertierra quizá nunca habríamos salido al espacio.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 22); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#1e1b4b'); kit.drawStars(ctx, stars, 0.85, t); };
const earth = (ctx, x, y, R, t, o = {}) => drawGlobe(ctx, x, y, R, { lon0: -90 + t * 12, lat0: 18, ...o });

/** Báscula con pantalla; (x, y) = centro de la base. */
function scale(ctx, kit, x, y, w, text, col = '#22c55e') {
  kit.roundRect(ctx, x - w / 2, y - w * 0.18, w, w * 0.18, 14); kit.shape(ctx, '#e2e8f0', 6);
  kit.roundRect(ctx, x - w * 0.22, y - w * 0.15, w * 0.44, w * 0.11, 8); kit.shape(ctx, '#0f172a', 4);
  kit.text(ctx, text, x, y - w * 0.095, { size: w * 0.075, fill: col, stroke: null });
}

/** Cohete vertical con la base en (x, y), alto h; fuel 0..1 = fracción del tanque pintada de naranja. */
function rocket(ctx, kit, x, y, h, { flame = 0, t = 0, fuel = 0, label = null } = {}) {
  const w = h * 0.2;
  ctx.save(); ctx.translate(x, y);
  if (flame > 0) {
    const f = 1 + 0.15 * Math.sin(t * 30);
    ctx.beginPath(); ctx.moveTo(-w * 0.35, 0); ctx.quadraticCurveTo(0, h * 0.45 * flame * f, w * 0.35, 0); ctx.closePath(); kit.shape(ctx, '#f97316', 4);
    ctx.beginPath(); ctx.moveTo(-w * 0.18, 0); ctx.quadraticCurveTo(0, h * 0.25 * flame * f, w * 0.18, 0); ctx.closePath(); ctx.fillStyle = '#fde047'; ctx.fill();
  }
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * w * 0.5, -h * 0.02); ctx.lineTo(s * w * 0.95, h * 0.04); ctx.lineTo(s * w * 0.5, -h * 0.22); ctx.closePath(); kit.shape(ctx, '#ef4444', 5); }
  kit.roundRect(ctx, -w / 2, -h * 0.82, w, h * 0.82, w * 0.12); kit.shape(ctx, '#f8fafc', 6);
  if (fuel > 0) { ctx.save(); kit.roundRect(ctx, -w / 2 + 6, -h * 0.02 - (h * 0.78) * fuel, w - 12, (h * 0.78) * fuel, w * 0.08); ctx.fillStyle = '#fb923c'; ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.82); ctx.quadraticCurveTo(0, -h * 1.05, w / 2, -h * 0.82); ctx.closePath(); kit.shape(ctx, '#ef4444', 6);
  ctx.beginPath(); ctx.arc(0, -h * 0.68, w * 0.18, 0, TAU); kit.shape(ctx, '#38bdf8', 4);
  if (label) kit.text(ctx, label, 0, -h * 0.4, { size: Math.max(26, w * 0.32), fill: '#0f172a', stroke: '#ffffff', lw: 6 });
  ctx.restore();
}

/** Cubo isométrico de lado s con la esquina de abajo en (x, y). */
function isoCube(ctx, kit, x, y, s, col) {
  const dx = s * 0.87, dy = s * 0.5;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-dx, -dy); ctx.lineTo(-dx, -dy - s); ctx.lineTo(0, -s); ctx.closePath(); kit.shape(ctx, col[0], 4);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dx, -dy); ctx.lineTo(dx, -dy - s); ctx.lineTo(0, -s); ctx.closePath(); kit.shape(ctx, col[1], 4);
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(-dx, -dy - s); ctx.lineTo(0, -2 * dy - s); ctx.lineTo(dx, -dy - s); ctx.closePath(); kit.shape(ctx, col[2], 4);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // La Tierra de hoy (pequeña, a la izquierda) y una que crece hasta el doble.
    const k = o.ease.inOut(kit.ramp(local, 0, Math.max(0.6, cue(1) + 0.3)));
    earth(ctx, 230, 820, 130, t);
    kit.text(ctx, 'HOY', 230, 1000, { size: 48, fill: '#ffffff' });
    const R = 130 + 130 * (0.35 + 0.65 * k);
    earth(ctx, 760, 820 - 30 * k, R, t);
    kit.text(ctx, `×${(R / 130).toFixed(1)}`, 760, 820 - 30 * k + R + 40, { size: 56, fill: kit.YELLOW });
    kit.flash(ctx, W, H, 0.25 * kit.impulse(local, cue(1) + 0.3, 0.3), '#ffffff');
  },

  gravedad(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0c4a6e', '#38bdf8');
    ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 1070, W, H - 1070);
    // Persona sobre una báscula: 60 kg → 120 kg (y se aplasta un poquito).
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.4);
    const kg = Math.round(60 + 60 * q);
    scale(ctx, kit, 380, 1070, 360, `${kg} KG`, q > 0.5 ? '#f87171' : '#4ade80');
    ctx.save(); ctx.translate(380, 1070 - 360 * 0.18); ctx.scale(1 + 0.06 * q, 1 - 0.08 * q);
    kit.person(ctx, 0, 0, 420, { shirt: '#f97316', arms: 0.1 * Math.sin(t * 3) });
    ctx.restore();
    // Flechas de gravedad: 1 → 2.
    for (let i = 0; i < (q > 0.5 ? 2 : 1); i++) {
      const x = 760 + i * 130, y0 = 560, y1 = 900;
      ctx.strokeStyle = '#facc15'; ctx.fillStyle = '#facc15'; ctx.lineWidth = 18; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 36, y1 - 10); ctx.lineTo(x + 36, y1 - 10); ctx.lineTo(x, y1 + 45); ctx.closePath(); ctx.fill();
    }
    kit.text(ctx, q > 0.5 ? 'g × 2' : 'g', 825, 980, { size: 60, fill: '#ffffff' });
    kit.text(ctx, 'GRAVEDAD × 2', W / 2, 230, { size: 100, fill: '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'TE SENTIRÍAS DE 120 KG' : 'SI PESAS 60 KG…', W / 2, 340, { size: 54, fill: kit.YELLOW });
  },

  salto(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e3a8a', '#60a5fa');
    ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 1070, W, H - 1070);
    // Dos personas saltan con la misma fuerza: aquí 50 cm, en la Tierra doble 25 cm.
    const ph = (t * 1.1) % 1, jump = Math.sin(ph * Math.PI);
    const h1 = 50 * 4 * jump, h2 = 25 * 4 * jump;
    kit.person(ctx, 290, 1070 - h1, 300, { shirt: '#22c55e', arms: 0.7 * jump });
    kit.person(ctx, 790, 1070 - h2, 300, { shirt: '#f97316', arms: 0.7 * jump });
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(170, 1070 - 200); ctx.lineTo(410, 1070 - 200); ctx.moveTo(670, 1070 - 100); ctx.lineTo(910, 1070 - 100); ctx.stroke(); ctx.setLineDash([]);
    kit.text(ctx, '50 cm', 290, 1070 - 200 - 380, { size: 44, fill: '#ffffff' });
    kit.text(ctx, '25 cm', 790, 1070 - 100 - 380, { size: 44, fill: kit.YELLOW });
    kit.text(ctx, 'HOY', 290, 1120, { size: 44, fill: '#ffffff' });
    kit.text(ctx, 'TIERRA × 2', 790, 1120, { size: 44, fill: kit.YELLOW });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (q > 0 && ph > 0.9) for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(790 + Math.cos(a) * 140, 1060 + Math.sin(a) * 30, 12, 0, TAU); ctx.fill(); }
    kit.text(ctx, q > 0.5 ? 'CAÍDAS × 2' : 'SALTO: LA MITAD', W / 2, 230, { size: 100, fill: q > 0.5 ? '#fca5a5' : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'EL GOLPE TENDRÍA EL DOBLE DE ENERGÍA' : 'MISMA FUERZA, EL DOBLE DE GRAVEDAD', W / 2, 340, { size: 44, fill: '#e0f2fe', maxW: W * 0.92 });
    void H;
  },

  tamano(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#14532d', '#22c55e');
    // Superficie: un cuadro de lado 1 → 2×2 = 4. Volumen: 2×2×2 = 8 cubos.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.4);
    if (q < 1) {
      ctx.save(); ctx.globalAlpha = 1 - q;
      kit.roundRect(ctx, 150, 640, 200, 200, 10); kit.shape(ctx, '#bbf7d0', 6);
      kit.text(ctx, '1', 250, 740, { size: 70, fill: '#14532d', stroke: null });
      const k = kit.ramp(local, 0.2, 1.0);
      for (let i = 0; i < 4; i++) {
        const a = kit.clamp(k * 4 - i); if (a <= 0) continue;
        const x = 520 + (i % 2) * 200, y = 560 + Math.floor(i / 2) * 200;
        ctx.save(); ctx.globalAlpha = (1 - q) * a; kit.roundRect(ctx, x, y, 196, 196, 10); kit.shape(ctx, '#86efac', 6); kit.text(ctx, `${i + 1}`, x + 98, y + 98, { size: 64, fill: '#14532d', stroke: null }); ctx.restore();
      }
      ctx.restore();
    }
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      const k = kit.ramp(local, cue(1), cue(1) + 1.2), S = 150, col = ['#16a34a', '#15803d', '#4ade80'];
      // De atrás hacia adelante y de abajo hacia arriba, para que cada cubo tape bien al de atrás.
      const order = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
      order.forEach(([gx, gy, gz], i) => {
        if (kit.clamp(k * 8 - i) <= 0) return;
        isoCube(ctx, kit, W / 2 + (gx - gy) * S * 0.87, 900 + (gx + gy) * S * 0.5 - gz * S, S, col);
      });
      ctx.restore();
    }
    kit.text(ctx, q > 0.5 ? '× 8 DE VOLUMEN' : '× 4 DE SUPERFICIE', W / 2, 230, { size: 96, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? '2 × 2 × 2' : '2 × 2', W / 2, 340, { size: 60, fill: '#dcfce7' });
    void H;
  },

  cohete(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // Despegue: velocidad para quedar en órbita 7.9 km/s → 15.8 km/s.
    earth(ctx, W / 2, 1650, 760, t * 0.2);
    const y = 1000 - 170 * kit.ramp(local, 0.2, 3), q = kit.ramp(local, cue(1), cue(1) + 0.6);
    rocket(ctx, kit, W / 2, y, 330, { flame: 1, t });
    const v = 7.9 + 7.9 * q;
    kit.roundRect(ctx, 150, 410, 780, 50, 25); kit.shape(ctx, '#1e293b', 5);
    kit.roundRect(ctx, 156, 416, 768 * (v / 16), 38, 19); ctx.fillStyle = q > 0.5 ? '#f87171' : '#4ade80'; ctx.fill();
    kit.text(ctx, `${v.toFixed(1)} KM/S`, W / 2, 436, { size: 34, fill: '#ffffff' });
    kit.text(ctx, q > 0.5 ? 'EL DOBLE DE VELOCIDAD' : 'PARA LLEGAR A ÓRBITA', W / 2, 230, { size: 86, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? '15.8 KM/S EN VEZ DE 7.9' : 'HOY: 7.9 KM/S', W / 2, 340, { size: 52, fill: '#c7d2fe' });
    void H;
  },

  combustible(ctx, o) {
    const { W, H, kit, local, cue } = o;
    space(ctx, o);
    // Hoy un cohete es ~93 % combustible (1 : 15); en la Tierra doble, 99.5 % (1 : 215).
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.4);
    rocket(ctx, kit, 290, 1060, 330, { fuel: 0.93, label: '93 %' });
    kit.text(ctx, 'HOY', 290, 1110, { size: 44, fill: '#ffffff' });
    const h = 330 + 170 * o.ease.out(q);
    rocket(ctx, kit, 760, 1060, h, { fuel: 0.6 + 0.395 * q, label: q > 0.5 ? '99.5 %' : '…' });
    kit.text(ctx, 'TIERRA × 2', 760, 1110, { size: 44, fill: kit.YELLOW });
    if (q > 0.5) {
      kit.text(ctx, '1 KG DE COHETE', 760, 1060 - h - 110, { size: 38, fill: '#ffffff' });
      kit.text(ctx, '+ 214 KG DE COMBUSTIBLE', 760, 1060 - h - 62, { size: 34, fill: '#fdba74', maxW: 520 });
    }
    kit.text(ctx, q > 0.5 ? '99.5 % COMBUSTIBLE' : 'CRECE EXPONENCIAL', W / 2, 230, { size: 92, fill: q > 0.5 ? '#fdba74' : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, 'LLENO ÷ VACÍO = e^(Δv ÷ v de los gases)', W / 2, 340, { size: 40, fill: '#c7d2fe', maxW: W * 0.92 });
    void H;
  },

  loco(ctx, o) {
    const { W, H, kit, local, t } = o;
    space(ctx, o);
    // Supertierra enorme; el cohete sube, se cansa… y regresa.
    earth(ctx, W / 2, 1500, 700, t * 0.2, { ocean: '#1d4ed8', land: '#16a34a' });
    const u = (local % 3) / 3, y = 900 - 220 * Math.sin(u * Math.PI);
    rocket(ctx, kit, W / 2 + 140, y, 220, { flame: u < 0.5 ? 1 : 0, t });
    if (u > 0.55) kit.text(ctx, '¡NO ALCANZA!', W / 2 - 170, 620, { size: 50, fill: '#fca5a5' });
    kit.text(ctx, '¿NUNCA AL ESPACIO?', W / 2, 230, { size: 88, fill: '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, 'ASÍ SON LAS «SUPERTIERRAS»', W / 2, 340, { size: 50, fill: kit.YELLOW, maxW: W * 0.92 });
    void H;
  },

  outro(ctx, o) {
    const { W, kit, t } = o;
    space(ctx, o);
    earth(ctx, W / 2, 780, 280, t);
    rocket(ctx, kit, W / 2 + 330, 640 - 30 * Math.sin(t * 2), 200, { flame: 1, t });
    kit.text(ctx, '¡TAMAÑO PERFECTO!', W / 2, 260, { size: 92, fill: kit.YELLOW, maxW: W * 0.92 });
  },
};
