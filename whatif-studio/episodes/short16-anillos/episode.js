// Short 16 (idea de @clashero_1439): ¿y si la Tierra tuviera anillos como Saturno?
// La Tierra con anillos → anchos pero delgadísimos → un arco en el cielo de México → una línea en el
// ecuador → su sombra en invierno → satélites que los esquivan → hace 466 millones de años, quizá sí.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(260, C.W, C.H, 16); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#03061a', '#1e1b4b'); kit.drawStars(ctx, stars, 0.9, t); };

/** Anillos alrededor de (cx, cy): r0..r1 de radio, inclinados (tilt = alto/ancho). front: solo la mitad de enfrente. */
function rings(ctx, cx, cy, r0, r1, tilt, t, front, alpha = 1) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath();
  if (front) ctx.rect(-r1 - 10, 0, 2 * r1 + 20, r1); else ctx.rect(-r1 - 10, -r1, 2 * r1 + 20, r1);
  ctx.clip();
  const bands = [[0, 0.18, 'rgba(203,213,225,0.35)'], [0.2, 0.55, 'rgba(226,232,240,0.85)'], [0.58, 0.62, 'rgba(15,23,42,0.6)'], [0.64, 0.95, 'rgba(203,213,225,0.75)'], [0.96, 1, 'rgba(148,163,184,0.5)']];
  ctx.globalAlpha = alpha;
  for (const [a, b, c] of bands) {
    const ra = r0 + (r1 - r0) * a, rb = r0 + (r1 - r0) * b, rm = (ra + rb) / 2;
    ctx.lineWidth = (rb - ra) * 1.0; ctx.strokeStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 0, rm, rm * tilt, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Brillitos de hielo que giran.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 40; i++) {
    const a = t * 0.3 + i * 0.37, rr = r0 + (r1 - r0) * ((i * 0.618) % 1);
    const y = Math.sin(a) * rr * tilt; if ((y > 0) !== front) continue;
    ctx.fillRect(Math.cos(a) * rr - 2, y - 1, 4, 2);
  }
  ctx.restore();
}

/** La Tierra con anillos. */
function ringedEarth(ctx, kit, cx, cy, R, t, { tilt = 0.28, k = 1 } = {}) {
  if (k > 0) rings(ctx, cx, cy, R * 1.3, R * 1.3 + R * 1.05 * k, tilt, t, false);
  drawGlobe(ctx, cx, cy, R, { lon0: -95 + t * 6, lat0: 18 });
  if (k > 0) rings(ctx, cx, cy, R * 1.3, R * 1.3 + R * 1.05 * k, tilt, t, true);
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // Los anillos aparecen y se abren alrededor de la Tierra desde el primer fotograma.
    const k = 0.35 + 0.65 * o.ease.out(kit.ramp(local, 0, 1.2));
    ringedEarth(ctx, kit, W / 2, 760, 230, t, { k, tilt: 0.3 });
    void cue;
  },

  tamano(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const sw = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.3);
    if (sw < 1) {
      ctx.save(); ctx.globalAlpha = 1 - sw;
      ringedEarth(ctx, kit, W / 2, 720, 200, t, { tilt: 0.3 });
      // Medida del ancho.
      const x0 = W / 2 + 200 * 1.3, x1 = W / 2 + 200 * 2.35;
      ctx.strokeStyle = kit.YELLOW; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, 1040); ctx.lineTo(x1, 1040); ctx.stroke();
      for (const x of [x0, x1]) { ctx.beginPath(); ctx.moveTo(x, 1020); ctx.lineTo(x, 1060); ctx.stroke(); }
      kit.text(ctx, 'MILES DE km', W / 2, 250, { size: 92, fill: kit.YELLOW });
      kit.text(ctx, 'DE HIELO Y ROCA', W / 2, 350, { size: 48, fill: '#ffffff' });
      ctx.restore();
    }
    if (sw > 0) {
      // De canto: una hoja delgadísima, comparada con una casa de 2 pisos.
      ctx.save(); ctx.globalAlpha = sw;
      // El anillo de canto (10 m de grueso) y, a la misma escala, una casa de 2 pisos (~8 m).
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-20, 700, W + 40, 120);
      ctx.strokeStyle = kit.INK; ctx.lineWidth = 6; ctx.strokeRect(-20, 700, W + 40, 120);
      for (let i = 0; i < 16; i++) { const x = (i * 83 + t * 40) % (W + 60) - 30; ctx.beginPath(); ctx.arc(x, 715 + (i % 5) * 22, 8 + (i % 3) * 4, 0, Math.PI * 2); kit.shape(ctx, i % 2 ? '#cbd5e1' : '#94a3b8', 3); }
      kit.house(ctx, W / 2 - 120, 820, 110, 60, { wall: '#fde68a', roofC: '#dc2626' });
      ctx.strokeStyle = kit.YELLOW; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(W - 150, 700); ctx.lineTo(W - 150, 820); ctx.stroke();
      for (const y of [700, 820]) { ctx.beginPath(); ctx.moveTo(W - 175, y); ctx.lineTo(W - 125, y); ctx.stroke(); }
      kit.text(ctx, '~10 m', W - 150, 640, { size: 64, fill: kit.YELLOW });
      kit.text(ctx, 'CASA DE 2 PISOS', W / 2 - 120, 880, { size: 34, fill: '#ffffff' });
      kit.text(ctx, 'DE GRUESO', W / 2, 250, { size: 92, fill: '#ffffff' });
      kit.text(ctx, '(DE CANTO)', W / 2, 350, { size: 44, fill: '#cbd5e1' });
      ctx.restore();
    }
  },

  cielo(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // De día y luego de noche: el arco de los anillos cruzando el cielo.
    const night = o.ease.inOut(kit.ramp(local, cue(1) - 0.2, cue(1) + 0.8));
    const mix = (a, b) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return `rgb(${[16, 8, 0].map((s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * night)).join(',')})`; };
    kit.gradientBG(ctx, W, H, mix('#2563eb', '#020617'), mix('#bae6fd', '#1e1b4b'));
    if (night > 0) kit.drawStars(ctx, stars, night, t);
    // Arco: elipse grande que sale del horizonte por los dos lados.
    ctx.save();
    for (const [rr, w, c] of [[900, 60, 'rgba(255,255,255,0.75)'], [980, 40, 'rgba(226,232,240,0.6)'], [1040, 28, 'rgba(203,213,225,0.5)']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(W / 2, 1100, rr * 0.75, rr * 0.8, 0, Math.PI, 2 * Math.PI); ctx.stroke();
    }
    ctx.restore();
    // Ciudad (silueta) y nopal.
    ctx.fillStyle = mix('#65a30d', '#0f172a'); ctx.fillRect(0, 1060, W, H - 1060);
    for (let i = 0; i < 4; i++) kit.house(ctx, 170 + i * 250, 1060, 190, 150, { wall: mix('#fde68a', '#334155'), roofC: mix('#b45309', '#1e293b'), lit: night });
    kit.text(ctx, night > 0.5 ? 'DE NOCHE' : 'DESDE MÉXICO', W / 2, 230, { size: 86, fill: '#ffffff' });
  },

  ecuador(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En el ecuador: mirando hacia arriba, una línea delgadita que cruza todo el cielo.
    kit.gradientBG(ctx, W, H, '#1d4ed8', '#7dd3fc');
    const k = o.ease.inOut(kit.ramp(local, cue(1) - 0.3, cue(1) + 0.5)), w = 140 * (1 - k) + 6 * k;
    ctx.save(); ctx.translate(W / 2, 640); ctx.rotate(-0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(-W, -w / 2, 2 * W, w);
    ctx.restore();
    // Palmeras y una persona que mira hacia arriba.
    for (const [x, s] of [[150, 1], [930, 0.85]]) {
      ctx.save(); ctx.translate(x, 1120); ctx.scale(s, s);
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(30, -220, 10, -420); ctx.stroke();
      ctx.fillStyle = '#16a34a';
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + 0.05 * Math.sin(t * 2 + i); ctx.save(); ctx.translate(10, -420); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(110, 0, 120, 26, 0, 0, Math.PI * 2); kit.shape(ctx, '#16a34a', 5); ctx.restore(); }
      ctx.restore();
    }
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(0, 1120, W, H - 1120);
    kit.person(ctx, W / 2, 1180, 220, { shirt: '#ef4444', arms: 0.1 });
    kit.text(ctx, 'EN EL ECUADOR', W / 2, 230, { size: 86, fill: '#ffffff' });
  },

  sombra(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // El Sol a la izquierda; la sombra de los anillos cae sobre un hemisferio.
    kit.sun(ctx, 60, 760, 120, { t, on: 1 });
    const cx = W / 2 + 120, cy = 760, R = 240;
    rings(ctx, cx, cy, R * 1.3, R * 2.35, 0.32, t, false);
    drawGlobe(ctx, cx, cy, R, { lon0: -95 + t * 6, lat0: 18, night: 0.6 });
    const k = kit.ramp(local, 0.3, 1.2);
    if (k > 0) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.globalAlpha = 0.55 * k; ctx.fillStyle = '#020617';
      ctx.beginPath(); ctx.ellipse(cx - 30, cy + R * 0.42, R * 1.1, R * 0.22, -0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    rings(ctx, cx, cy, R * 1.3, R * 2.35, 0.32, t, true);
    const q = kit.ramp(local, cue(1), cue(1) + 0.3);
    kit.text(ctx, q > 0.5 ? 'INVIERNOS MÁS FRÍOS' : 'SOMBRA DE LOS ANILLOS', W / 2, 230, { size: 76, fill: q > 0.5 ? '#93c5fd' : '#ffffff', maxW: W * 0.92 });
  },

  satelites(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    ringedEarth(ctx, kit, W / 2, 900, 200, t, { tilt: 0.25 });
    // Satélite que cruza y una piedrita que le pega.
    const k = kit.ramp(local, 0, o.s.dur), sx = 120 + 800 * k, sy = 420 + 60 * Math.sin(k * 3);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.2);
    for (const d of [-1, 1]) { ctx.fillStyle = '#1d4ed8'; ctx.fillRect(d * 40 - (d < 0 ? 70 : 0), -16, 70, 32); ctx.strokeStyle = kit.INK; ctx.lineWidth = 4; ctx.strokeRect(d * 40 - (d < 0 ? 70 : 0), -16, 70, 32); }
    kit.roundRect(ctx, -34, -28, 68, 56, 8); kit.shape(ctx, '#e2e8f0', 5);
    ctx.restore();
    const hit = cue(1) + 0.3;
    if (local < hit) { const u = kit.clamp((local - (hit - 0.6)) / 0.6); if (u > 0) { ctx.beginPath(); ctx.arc(lerp(W, sx, u), lerp(980, sy, u), 10, 0, Math.PI * 2); kit.shape(ctx, '#94a3b8', 3); } }
    kit.flash(ctx, W, 1920, 0.8 * kit.impulse(local, hit, 0.25), '#fff7d6');
    if (local > hit) { const a = Math.min(1, (local - hit) / 0.4); for (let i = 0; i < 10; i++) { const ang = i * 0.63; ctx.fillStyle = `rgba(251,191,36,${1 - a})`; ctx.beginPath(); ctx.arc(sx + Math.cos(ang) * 120 * a, sy + Math.sin(ang) * 120 * a, 6, 0, Math.PI * 2); ctx.fill(); } }
    kit.text(ctx, local > hit ? '¡COMO UNA BALA!' : '~7 km POR SEGUNDO', W / 2, 230, { size: 80, fill: local > hit ? '#fca5a5' : kit.YELLOW });
  },

  pasado(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // La Tierra antigua (continentes juntos, en tonos cafés) con un anillo de rocas.
    kit.gradientBG(ctx, W, H, '#1c1917', '#44403c');
    kit.drawStars(ctx, stars, 0.5, t);
    const k = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.6);
    const cx = W / 2, cy = 760, R = 250;
    rings(ctx, cx, cy, R * 1.25, R * 1.9, 0.26, t, false, k);
    // Hace 466 millones de años los continentes estaban en otro lugar: un gran continente al sur.
    drawGlobe(ctx, cx, cy, R, { lon0: 20 + t * 5, lat0: -10, ocean: '#1e40af', polyColor: () => null, northCap: false, extra: (c, r) => {
      c.beginPath(); const pts = [[-0.7, 0.2], [-0.35, -0.05], [0.05, 0.05], [0.4, 0.15], [0.6, 0.45], [0.3, 0.75], [-0.2, 0.85], [-0.6, 0.6]];
      pts.forEach(([x, y], i) => { const X = (x + 0.05 * Math.sin(t * 0.5)) * r, Y = y * r; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); c.fillStyle = '#a16207'; c.fill();
      c.beginPath(); c.ellipse(0.45 * r, -0.45 * r, 0.18 * r, 0.12 * r, 0.4, 0, Math.PI * 2); c.fill(); } });
    rings(ctx, cx, cy, R * 1.25, R * 1.9, 0.26, t, true, k);
    const n = 466 * o.ease.out(kit.ramp(local, 0.1, cue(1)));
    kit.text(ctx, `HACE ${Math.round(n)} MILLONES`, W / 2, 230, { size: 74, fill: kit.YELLOW, maxW: W * 0.92 });
    kit.text(ctx, 'DE AÑOS', W / 2, 330, { size: 56, fill: '#ffffff' });
    if (k > 0.5) kit.text(ctx, '¿ANILLOS?', W / 2, 990, { size: 64, fill: '#fde68a' });
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    ringedEarth(ctx, kit, W / 2, 780, 240, t, { tilt: 0.3 });
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE @clashero_1439', W / 2, 260, { size: 64, fill: kit.YELLOW, maxW: W * 0.92 }); ctx.restore(); }
  },
};

const lerp = (a, b, k) => a + (b - a) * k;
