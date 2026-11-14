// Short 25: ¿y si saltaras desde el espacio?
// Cápsula a 39 km → Baumgartner (2012) → 1,357 km/h, más rápido que el sonido (Mach 1.25) → casi no
// hay aire (≈ 0.3 % del de abajo) → el aire espeso frena: 4 min 20 s de caída libre → desde la
// Estación Espacial (28,000 km/h) te quemarías → Eustace (2014) desde 41 km.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(200, C.W, C.H, 25); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;

/** Estratosfera: cielo negro arriba, curva azul de la Tierra abajo. */
function strato(ctx, o, horizon = 1180) {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, '#020617', '#0b1d4a');
  kit.drawStars(ctx, stars, 0.7, t);
  const R = 2600, cy = horizon + R;
  const g = ctx.createRadialGradient(W / 2, cy, R - 10, W / 2, cy, R + 90);
  g.addColorStop(0, 'rgba(125,211,252,0.9)'); g.addColorStop(1, 'rgba(125,211,252,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, cy, R + 90, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, TAU); ctx.fillStyle = '#1d4ed8'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.ellipse(W * 0.3, horizon + 120, 380, 70, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(248,250,252,0.85)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(120 + i * 180, horizon + 40 + (i % 2) * 30, 90, 18, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

/** Saltador con traje (persona blanca con casco); rot en radianes. */
function jumper(ctx, kit, x, y, h, rot = 0, arms = 0.6) {
  kit.person(ctx, x, y, h, { shirt: '#f1f5f9', pants: '#e2e8f0', skin: '#94a3b8', arms, rot });
}

/** Cápsula con puerta abierta; (x, y) = base. */
function capsule(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.85, -s * 1.2); ctx.quadraticCurveTo(0, -s * 1.6, s * 0.85, -s * 1.2); ctx.lineTo(s, 0); ctx.closePath(); kit.shape(ctx, '#e2e8f0', 6);
  kit.roundRect(ctx, -s * 0.45, -s * 1.15, s * 0.9, s * 1.1, 12); kit.shape(ctx, '#0f172a', 5);
  kit.roundRect(ctx, -s * 1.15, -6, s * 2.3, 22, 8); kit.shape(ctx, '#94a3b8', 5);
  ctx.restore();
}

/** Paracaídas abierto sobre (x, y). */
function chute(ctx, kit, x, y, s, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath(); ctx.moveTo(-s, -s * 0.9); ctx.quadraticCurveTo(0, -s * 1.9, s, -s * 0.9); ctx.quadraticCurveTo(s * 0.5, -s * 1.05, 0, -s * 0.9); ctx.quadraticCurveTo(-s * 0.5, -s * 1.05, -s, -s * 0.9); ctx.closePath();
  kit.shape(ctx, '#f97316', 6);
  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3;
  for (const dx of [-1, -0.5, 0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.92); ctx.lineTo(0, 0); ctx.stroke(); }
  ctx.restore();
}

/** Escala de altura (0–45 km) a la izquierda; marcas = [[km, etiqueta, color]]. */
function altScale(ctx, kit, marks) {
  const y = (km) => 1060 - km * 13;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(110, y(0)); ctx.lineTo(110, y(45)); ctx.stroke();
  for (let km = 0; km <= 45; km += 5) { ctx.beginPath(); ctx.moveTo(100, y(km)); ctx.lineTo(120, y(km)); ctx.stroke(); kit.text(ctx, `${km}`, 70, y(km), { size: 24, fill: '#94a3b8', stroke: null }); }
  for (const [km, label, col, dy = 0] of marks) {
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(120, y(km)); ctx.lineTo(520, y(km)); ctx.stroke(); ctx.setLineDash([]);
    kit.text(ctx, label, 540, y(km) + dy, { size: 34, fill: col, align: 'left' });
  }
  return y;
}

/** Estación espacial (armazón + paneles). */
function iss(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  kit.roundRect(ctx, -s, -s * 0.06, s * 2, s * 0.12, 6); kit.shape(ctx, '#cbd5e1', 4);
  for (const dx of [-0.9, -0.55, 0.55, 0.9]) { ctx.fillStyle = '#1d4ed8'; ctx.fillRect(dx * s - s * 0.12, -s * 0.5, s * 0.24, s * 0.4); ctx.fillRect(dx * s - s * 0.12, s * 0.1, s * 0.24, s * 0.4); ctx.strokeStyle = kit.INK; ctx.lineWidth = 3; ctx.strokeRect(dx * s - s * 0.12, -s * 0.5, s * 0.24, s * 0.4); ctx.strokeRect(dx * s - s * 0.12, s * 0.1, s * 0.24, s * 0.4); }
  kit.roundRect(ctx, -s * 0.25, -s * 0.14, s * 0.5, s * 0.28, 8); kit.shape(ctx, '#f8fafc', 4);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    strato(ctx, o);
    // Cápsula en el borde del espacio; en la segunda frase, el salto.
    const P = Math.max(0.5, cue(1) + 0.2);
    capsule(ctx, kit, 640, 760, 150);
    if (local < P) jumper(ctx, kit, 640, 750, 190, 0, 0.2 + 0.05 * Math.sin(t * 3));
    else { const u = local - P; jumper(ctx, kit, 640 - 40 * u, 750 + 380 * u * u, 190, 0.6 * u, 0.9); }
    kit.text(ctx, '39 KM', 880, 600, { size: 52, fill: kit.YELLOW });
    void W; void H;
  },

  record(ctx, o) {
    const { W, H, kit, local, t } = o;
    strato(ctx, o, 1260);
    const y = altScale(ctx, kit, [[8.8, 'EVEREST 8.8 KM', '#e2e8f0', 22], [11, 'AVIÓN 11 KM', '#93c5fd', -22], [39, 'SALTO 39 KM', kit.YELLOW]]);
    const k = o.ease.out(kit.ramp(local, 0.1, 1.2));
    jumper(ctx, kit, 990, y(39 * k) + 70, 120, 0, 0.2);
    ctx.save(); ctx.translate(990, y(11) - 40); ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 14, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-40, 30); ctx.lineTo(-20, 30); ctx.lineTo(15, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    kit.text(ctx, '39 KM DE ALTURA', W / 2, 230, { size: 96, fill: '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, '3.5 VECES MÁS ALTO QUE UN AVIÓN', W / 2, 340, { size: 46, fill: kit.YELLOW, maxW: W * 0.92 });
    void H; void t;
  },

  sonido(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    strato(ctx, o, 1300);
    // Cae cabeza abajo, con líneas de velocidad hacia arriba y el «cono» de la barrera del sonido.
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 2); ctx.translate(-H / 2, -W / 2);
    kit.speedLines(ctx, H, 100, W - 100, t, { n: 22, speed: 3000, color: 'rgba(255,255,255,0.5)' });
    ctx.restore();
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    jumper(ctx, kit, 540, 640, 240, Math.PI * 0.95, 1);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(380, 520); ctx.quadraticCurveTo(540, 740, 700, 520); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(330, 470); ctx.quadraticCurveTo(540, 800, 750, 470); ctx.stroke(); ctx.restore();
    }
    const v = 1357 * o.ease.out(kit.ramp(local, 0, cue(1)));
    kit.roundRect(ctx, 290, 960, 500, 90, 20); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, `${kit.nf(Math.round(v))} km/h`, W / 2, 1006, { size: 56, fill: q > 0.5 ? '#f87171' : '#4ade80', stroke: null });
    kit.text(ctx, q > 0.5 ? 'MACH 1.25' : `${kit.nf(Math.round(v))} KM/H`, W / 2, 230, { size: 108, fill: q > 0.5 ? kit.YELLOW : '#ffffff' });
    kit.text(ctx, q > 0.5 ? 'MÁS RÁPIDO QUE EL SONIDO' : 'CAYENDO', W / 2, 345, { size: 54, fill: '#ffffff', maxW: W * 0.92 });
  },

  aire(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#0b1d4a', '#1e3a8a');
    // Mismo cubo de aire: abajo ~300 «moléculas», a 39 km apenas 1 (≈ 0.3 %).
    const R = kit.rng(7);
    kit.roundRect(ctx, 100, 560, 400, 400, 18); kit.shape(ctx, 'rgba(255,255,255,0.08)', 6, '#93c5fd');
    for (let i = 0; i < 300; i++) { ctx.beginPath(); ctx.arc(120 + R() * 360, 580 + R() * 360, 6, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); }
    kit.roundRect(ctx, 580, 560, 400, 400, 18); kit.shape(ctx, 'rgba(255,255,255,0.04)', 6, '#facc15');
    ctx.beginPath(); ctx.arc(790, 740, 8, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill();
    kit.text(ctx, 'AQUÍ ABAJO', 300, 1000, { size: 40, fill: '#ffffff' });
    kit.text(ctx, 'A 39 KM', 780, 1000, { size: 40, fill: kit.YELLOW });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'COMO CAER EN EL VACÍO' : 'CASI SIN AIRE', W / 2, 230, { size: q > 0.5 ? 84 : 110, fill: '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, '1 DE CADA 300 PARTÍCULAS DE AIRE', W / 2, 345, { size: 46, fill: '#bae6fd', maxW: W * 0.92 });
    void H;
  },

  frenar(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Del negro al azul: el aire frena la caída y al final se abre el paracaídas.
    const k = kit.ramp(local, 0, cue(1) + 1.4), P = cue(1) + 1.4;
    kit.gradientBG(ctx, W, H, k > 0.6 ? '#38bdf8' : '#1e3a8a', '#bae6fd');
    ctx.fillStyle = '#d97706'; ctx.fillRect(0, 1080 - 40 * k, W, H);
    const open = kit.ramp(local, P, P + 0.4);
    chute(ctx, kit, 540, 640, 230, open);
    jumper(ctx, kit, 540, 820 + 8 * Math.sin(t * 4), 220, (1 - open) * 0.6, 0.9);
    const sec = Math.min(260, 260 * k), mm = Math.floor(sec / 60), ss = Math.floor(sec % 60);
    kit.roundRect(ctx, 340, 960, 400, 90, 20); kit.shape(ctx, '#0f172a', 6);
    kit.text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, W / 2, 1006, { size: 60, fill: '#ffffff', stroke: null });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? '4 MIN 20 S' : 'EL AIRE TE FRENA', W / 2, 230, { size: q > 0.5 ? 110 : 96, fill: q > 0.5 ? kit.YELLOW : '#0f172a', stroke: q > 0.5 ? kit.INK : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'DE CAÍDA LIBRE' : 'EL AIRE SE HACE MÁS ESPESO', W / 2, 345, { size: 52, fill: '#0f172a', stroke: '#ffffff', lw: 8, maxW: W * 0.92 });
  },

  iss(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#020617', '#1e1b4b');
    kit.drawStars(ctx, stars, 0.8, t);
    drawGlobe(ctx, W / 2, 1750, 1000, { lon0: -90 + t * 4, lat0: 20 });
    iss(ctx, kit, 300 + 40 * local, 560, 170);
    const q = kit.ramp(local, cue(1), cue(1) + 0.4);
    if (q > 0) {
      const u = kit.clamp((local - cue(1)) / 2.5), x = 420 + 360 * u, y = 640 + 300 * u;
      const g = ctx.createLinearGradient(x, y, x - 260, y - 200);
      g.addColorStop(0, 'rgba(255,237,160,0.95)'); g.addColorStop(0.4, 'rgba(249,115,22,0.8)'); g.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 30, y - 10); ctx.lineTo(x - 260, y - 230); ctx.lineTo(x - 300, y - 170); ctx.lineTo(x - 10, y + 30); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 34, 0, TAU); ctx.fillStyle = '#fde68a'; ctx.fill();
    }
    kit.text(ctx, q > 0.5 ? '¡TE QUEMARÍAS!' : '28,000 KM/H', W / 2, 230, { size: 106, fill: q > 0.5 ? '#fb923c' : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'COMO UN METEORITO' : 'LA ESTACIÓN ESPACIAL', W / 2, 345, { size: 54, fill: '#c7d2fe', maxW: W * 0.92 });
    void H;
  },

  loco(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    strato(ctx, o, 1260);
    const y = altScale(ctx, kit, [[39, 'BAUMGARTNER 39 KM', '#93c5fd', 22], [41.4, 'EUSTACE 41.4 KM', kit.YELLOW, -22]]);
    const k = o.ease.out(kit.ramp(local, 0.2, cue(1) + 0.6));
    jumper(ctx, kit, 1000, y(41.4 * k) + 70, 110, 0, 0.3);
    kit.text(ctx, '41 KM', W / 2, 230, { size: 120, fill: kit.YELLOW });
    kit.text(ctx, 'ALAN EUSTACE · 2014', W / 2, 345, { size: 52, fill: '#ffffff' });
    void H; void t;
  },

  outro(ctx, o) {
    const { W, H, kit, t } = o;
    kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');
    ctx.fillStyle = '#d97706'; ctx.fillRect(0, 1060, W, H - 1060);
    chute(ctx, kit, 540, 700 + 10 * Math.sin(t * 2), 220, 1);
    jumper(ctx, kit, 540, 880 + 10 * Math.sin(t * 2), 200, 0, 0.9);
    kit.text(ctx, '¡ATERRIZAJE!', W / 2, 260, { size: 100, fill: '#0f172a', stroke: '#ffffff', lw: 12 });
  },
};
