// Short 24: ¿y si se acabara la electricidad en todo el mundo?
// La ciudad se apaga → en 1 segundo: semáforos, internet, elevadores → 4 horas: el refri → 1-2 días:
// sin agua (bombas) → gasolineras eléctricas → hospitales con diésel unos días → cada persona usa ~420 W
// (30,000 TWh ÷ 8,100 millones ÷ 8,760 h): como 4 focos de 100 W prendidos día y noche.

let stars;
export function setup(C) { stars = C.kit.makeStars(200, C.W, C.H, 24); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const OFF = '#334155';

/** Línea de edificios; on(i) = 0..1 qué tanto está prendido el edificio i. */
function city(ctx, kit, W, y, on) {
  const R = kit.rng(24); let i = 0;
  for (let x = 20; x < W; i++) {
    const w = 110 + R() * 70, h = 220 + R() * 300, k = on(i), ph = R();
    kit.building(ctx, x + w / 2, y, w, h, { color: '#1e293b', lit: (j) => (k > 0 && ((j * 7 + i * 3) % 5 !== 0 || ph > 0.6) ? k : 0) });
    x += w + 10;
  }
}

/** Semáforo; on = 1 encendido en verde. */
function trafficLight(ctx, kit, x, y, s, on) {
  kit.roundRect(ctx, x - 8, y, 16, s * 1.6, 6); kit.shape(ctx, '#475569', 4);
  kit.roundRect(ctx, x - s * 0.32, y - s * 1.05, s * 0.64, s * 1.1, 14); kit.shape(ctx, '#0f172a', 5);
  const cols = ['#ef4444', '#facc15', '#22c55e'];
  cols.forEach((c, i) => {
    const lit = i === 2 && on > 0.5;
    ctx.beginPath(); ctx.arc(x, y - s * 0.86 + i * s * 0.34, s * 0.13, 0, TAU); ctx.fillStyle = lit ? c : OFF; ctx.fill();
    if (lit) { const g = ctx.createRadialGradient(x, y - s * 0.86 + i * s * 0.34, 0, x, y - s * 0.86 + i * s * 0.34, s * 0.4); g.addColorStop(0, 'rgba(34,197,94,0.6)'); g.addColorStop(1, 'rgba(34,197,94,0)'); ctx.fillStyle = g; ctx.fillRect(x - s * 0.4, y - s * 1.3, s * 0.8, s * 0.8); }
  });
}

/** Foco; on 0..1. */
function bulb(ctx, kit, x, y, r, on) {
  if (on > 0) { const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3); g.addColorStop(0, `rgba(253,224,71,${0.6 * on})`); g.addColorStop(1, 'rgba(253,224,71,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.75, Math.PI * 2.25); ctx.lineTo(x + r * 0.45, y + r * 1.15); ctx.lineTo(x - r * 0.45, y + r * 1.15); ctx.closePath();
  kit.shape(ctx, on > 0.5 ? '#fef08a' : '#cbd5e1', 5);
  kit.roundRect(ctx, x - r * 0.45, y + r * 1.15, r * 0.9, r * 0.5, 6); kit.shape(ctx, '#94a3b8', 4);
}

/** Ícono de wifi; on = 1 activo. */
function wifi(ctx, kit, x, y, s, on) {
  ctx.lineCap = 'round'; ctx.lineWidth = s * 0.12; ctx.strokeStyle = on ? '#38bdf8' : '#64748b';
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(x, y, s * 0.3 * i, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(x, y, s * 0.08, 0, TAU); ctx.fillStyle = on ? '#38bdf8' : '#64748b'; ctx.fill();
  if (!on) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = s * 0.1; ctx.beginPath(); ctx.moveTo(x - s * 0.8, y - s * 0.95); ctx.lineTo(x + s * 0.8, y + s * 0.15); ctx.stroke(); }
}

function cross(ctx, x, y, s, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Ciudad de noche llena de luces; en la segunda frase se apaga todo y aparecen las estrellas.
    const P = Math.max(0.5, cue(1) + 0.3);
    kit.gradientBG(ctx, W, H, '#0f172a', '#312e81');
    const k = kit.ramp(local, P, P + 0.6);
    kit.drawStars(ctx, stars, 0.15 + 0.85 * k, t);
    if (k < 1) { ctx.save(); ctx.globalAlpha = 0.5 * (1 - k); const g = ctx.createLinearGradient(0, 600, 0, 1060); g.addColorStop(0, 'rgba(251,191,36,0)'); g.addColorStop(1, 'rgba(251,191,36,0.5)'); ctx.fillStyle = g; ctx.fillRect(0, 600, W, 460); ctx.restore(); }
    city(ctx, kit, W, 1060, (i) => (local < P + (i % 4) * 0.08 ? 1 : 0));
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 1060, W, H - 1060);
    trafficLight(ctx, kit, 90, 880, 150, local < P ? 1 : 0);
    ctx.save(); ctx.globalAlpha = 0.85 * kit.impulse(local, P, 0.4); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  },

  segundo(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e293b');
    // Semáforo, internet y elevador: todo se apaga en el mismo segundo.
    const on = local < 0.4 ? 1 : 0;
    trafficLight(ctx, kit, 190, 900, 170, on);
    wifi(ctx, kit, 540, 860, 200, on);
    // Elevador con alguien atrapado.
    kit.roundRect(ctx, 760, 560, 220, 420, 12); kit.shape(ctx, '#64748b', 6);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(780, 600, 180, 360);
    kit.person(ctx, 870, 955, 260, { shirt: '#f97316', arms: on ? 0 : 0.85 + 0.1 * Math.sin(t * 8) });
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(780, 600, 30, 360); ctx.fillRect(930, 600, 30, 360);
    kit.roundRect(ctx, 830, 520, 80, 36, 8); kit.shape(ctx, '#0f172a', 4);
    kit.text(ctx, on ? '5' : '—', 870, 538, { size: 26, fill: on ? '#f87171' : '#475569', stroke: null });
    if (!on) kit.text(ctx, '!', 870, 640, { size: 80, fill: kit.YELLOW });
    kit.text(ctx, '1 SEGUNDO', W / 2, 230, { size: 110, fill: '#ffffff' });
    kit.text(ctx, 'Y TODO SE APAGA', W / 2, 345, { size: 56, fill: '#fca5a5' });
  },

  refri(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#164e63', '#0e7490');
    // Refri abierto y oscuro; reloj de 0 a 4 horas; la comida se pone verde.
    const k = kit.ramp(local, 0.2, cue(1) + 0.6), hrs = 4 * k, bad = kit.ramp(local, cue(1), cue(1) + 0.8);
    kit.roundRect(ctx, 150, 520, 380, 560, 20); kit.shape(ctx, '#e2e8f0', 6);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(175, 545, 330, 510);
    for (const y of [700, 860]) { ctx.fillStyle = '#94a3b8'; ctx.fillRect(175, y, 330, 8); }
    const food = (x, y, w, h, c) => { kit.roundRect(ctx, x, y, w, h, 8); kit.shape(ctx, c, 4); };
    const mix = (a, b) => (bad > 0.5 ? b : a);
    food(200, 600, 70, 100, mix('#f8fafc', '#bef264')); kit.text(ctx, 'LECHE', 235, 650, { size: 18, fill: '#1e293b', stroke: null });
    food(300, 640, 150, 60, mix('#f87171', '#84cc16'));
    food(210, 790, 120, 70, mix('#fde68a', '#a3e635'));
    food(360, 770, 90, 90, mix('#fb923c', '#65a30d'));
    if (bad > 0.3) { ctx.strokeStyle = 'rgba(132,204,22,0.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const x = 260 + i * 90; ctx.beginPath(); for (let j = 0; j <= 10; j++) ctx.lineTo(x + 12 * Math.sin(j + t * 4 + i), 590 - j * 9); ctx.stroke(); } }
    // Reloj.
    const cx = 790, cy = 760, R = 170;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); kit.shape(ctx, '#ffffff', 8);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R - 12, -Math.PI / 2, -Math.PI / 2 + TAU * (hrs / 12)); ctx.closePath(); ctx.fillStyle = 'rgba(248,113,113,0.5)'; ctx.fill();
    const a = -Math.PI / 2 + TAU * (hrs / 12);
    ctx.strokeStyle = kit.INK; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7); ctx.stroke();
    kit.text(ctx, `${Math.floor(hrs)} H`, cx, cy + R + 50, { size: 50, fill: '#ffffff' });
    kit.text(ctx, `${Math.max(1, Math.ceil(hrs))} HORA${Math.ceil(hrs) > 1 ? 'S' : ''}`, W / 2, 230, { size: 108, fill: bad > 0.5 ? '#bef264' : '#ffffff' });
    kit.text(ctx, bad > 0.5 ? 'LA COMIDA SE ECHA A PERDER' : 'EL REFRI SE VA CALENTANDO', W / 2, 345, { size: 50, fill: '#e0f2fe', maxW: W * 0.92 });
  },

  agua(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#0c4a6e', '#38bdf8');
    // Llave que se seca: el chorro se adelgaza y termina en gotas.
    const k = kit.ramp(local, 0.3, cue(1) + 0.5);
    ctx.fillStyle = '#94a3b8'; kit.roundRect(ctx, 0, 560, 560, 70, 20); kit.shape(ctx, '#94a3b8', 6);
    kit.roundRect(ctx, 480, 560, 90, 190, 20); kit.shape(ctx, '#94a3b8', 6);
    kit.roundRect(ctx, 430, 510, 190, 40, 16); kit.shape(ctx, '#ef4444', 5);
    const w = 60 * (1 - k);
    if (w > 4) { ctx.fillStyle = 'rgba(125,211,252,0.9)'; ctx.fillRect(525 - w / 2, 750, w, 330); }
    else { const u = (t * 1.3) % 1; ctx.beginPath(); ctx.arc(525, 760 + u * 300, 14, 0, TAU); ctx.fillStyle = '#7dd3fc'; ctx.fill(); }
    kit.roundRect(ctx, 330, 1060, 390, 40, 10); kit.shape(ctx, '#e2e8f0', 5);
    // Bomba de agua apagada.
    kit.roundRect(ctx, 760, 820, 240, 170, 16); kit.shape(ctx, '#475569', 6);
    kit.text(ctx, 'BOMBA', 880, 870, { size: 38, fill: '#ffffff', stroke: null });
    kit.text(ctx, k > 0.3 ? 'OFF' : 'ON', 880, 930, { size: 46, fill: k > 0.3 ? '#f87171' : '#4ade80', stroke: null });
    const days = 1 + Math.round(k);
    kit.text(ctx, `${days === 1 ? '1 DÍA' : '2 DÍAS'}`, W / 2, 230, { size: 110, fill: '#ffffff' });
    kit.text(ctx, k > 0.6 ? 'SIN AGUA EN LA LLAVE' : 'EL AGUA SE ACABA', W / 2, 345, { size: 56, fill: '#0f172a', stroke: '#ffffff', lw: 8 });
    void H;
  },

  gasolina(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7c2d12', '#fdba74');
    ctx.fillStyle = '#44403c'; ctx.fillRect(0, 1060, W, H - 1060);
    // Bomba de gasolina sin luz y un coche esperando.
    kit.roundRect(ctx, 150, 560, 280, 500, 20); kit.shape(ctx, '#dc2626', 6);
    kit.roundRect(ctx, 185, 600, 210, 140, 12); kit.shape(ctx, '#0f172a', 5);
    kit.text(ctx, local < 0.5 ? '$ 0.00' : 'SIN LUZ', 290, 670, { size: 38, fill: local < 0.5 ? '#4ade80' : '#475569', stroke: null });
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(430, 800); ctx.quadraticCurveTo(520, 900, 500, 1000); ctx.stroke();
    kit.roundRect(ctx, 470, 980, 70, 40, 8); kit.shape(ctx, '#111827', 4);
    kit.car(ctx, 790, 1055, 320, { color: '#2563eb' });
    kit.roundRect(ctx, 720, 760, 140, 110, 30); kit.shape(ctx, '#ffffff', 5);
    kit.text(ctx, '?', 790, 815, { size: 80, fill: '#0f172a', stroke: null });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'LA BOMBA ES ELÉCTRICA' : 'HAY GASOLINA…', W / 2, 230, { size: q > 0.5 ? 82 : 100, fill: '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'NO PUEDE SACARLA' : 'PERO NO SALE', W / 2, 345, { size: 56, fill: kit.YELLOW });
    void t;
  },

  hospital(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#4338ca');
    ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 1060, W, H - 1060);
    // Hospital con planta de diésel: el tanque se vacía y las ventanas se apagan al final.
    const fuel = 1 - kit.ramp(local, 0.2, cue(1) + 1.0), lit = fuel > 0.05 ? 1 : 0;
    kit.building(ctx, 360, 1060, 480, 460, { color: '#e2e8f0', win: '#fde68a', lit: () => lit });
    kit.roundRect(ctx, 300, 520, 120, 120, 14); kit.shape(ctx, '#ffffff', 5);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(345, 535, 30, 90); ctx.fillRect(315, 565, 90, 30);
    // Planta + tanque.
    kit.roundRect(ctx, 700, 860, 300, 200, 16); kit.shape(ctx, '#475569', 6);
    kit.text(ctx, 'DIÉSEL', 850, 905, { size: 40, fill: '#ffffff', stroke: null });
    kit.roundRect(ctx, 730, 940, 240, 50, 12); kit.shape(ctx, '#0f172a', 4);
    ctx.fillStyle = fuel > 0.25 ? '#facc15' : '#ef4444'; ctx.fillRect(736, 946, 228 * fuel, 38);
    kit.text(ctx, `${Math.round(fuel * 100)} %`, 850, 1020, { size: 30, fill: '#ffffff', stroke: null });
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? '¿Y DESPUÉS?' : 'UNOS DÍAS', W / 2, 230, { size: 110, fill: q > 0.5 ? '#fca5a5' : '#ffffff' });
    kit.text(ctx, q > 0.5 ? 'SE ACABA EL COMBUSTIBLE' : 'CON PLANTAS DE DIÉSEL', W / 2, 345, { size: 54, fill: '#e0e7ff', maxW: W * 0.92 });
    void H;
  },

  loco(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#1e293b');
    // 30,000 TWh al año ÷ 8,100 millones de personas ÷ 8,760 horas ≈ 420 W cada quien = 4 focos de 100 W.
    const q = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    for (let i = 0; i < 4; i++) {
      const on = kit.ramp(local, cue(1) + i * 0.25, cue(1) + i * 0.25 + 0.15);
      bulb(ctx, kit, 210 + i * 220, 760, 70, on);
      kit.text(ctx, '100 W', 210 + i * 220, 900, { size: 38, fill: on > 0.5 ? kit.YELLOW : '#64748b' });
    }
    kit.text(ctx, '30,000 TWh ÷ 8,100 millones ÷ 8,760 h ≈ 420 W', W / 2, 1010, { size: 36, fill: '#c7d2fe', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? '4 FOCOS DE 100 W' : '≈ 420 W POR PERSONA', W / 2, 230, { size: 96, fill: q > 0.5 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 });
    kit.text(ctx, q > 0.5 ? 'PRENDIDOS DÍA Y NOCHE' : 'TODO EL TIEMPO', W / 2, 345, { size: 56, fill: '#e2e8f0' });
    void H;
  },

  outro(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#0f172a', '#312e81');
    kit.drawStars(ctx, stars, 0.3, t);
    city(ctx, kit, W, 1060, (i) => kit.ramp(local, i * 0.12, i * 0.12 + 0.2));
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 1060, W, H - 1060);
    kit.text(ctx, '¡VOLVIÓ LA LUZ!', W / 2, 260, { size: 100, fill: kit.YELLOW, maxW: W * 0.92 });
  },
};
