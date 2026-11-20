// Short 47: ¿y si desaparecieran todos los árboles?  (calidad alta: engine2d/hq.js + props.js)
// Gancho corto: ¿nos quedaríamos sin aire? (se contesta casi al final: no). Sin palabras técnicas.
// Menos lluvia (los árboles sudan agua; el Amazonas hace hasta la mitad de su lluvia) → los cerros se vienen abajo
// (las raíces sostienen la tierra) → ciudades más calientes (la sombra refresca varios grados) → el aire: no te
// ahogarías (oxígeno para miles de años; la mitad lo hacen algas del mar) → sorpresa: la Isla de Pascua ya lo vivió.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, sky, ground, cloud, sunDisc, rain, sea, cracks, bushyTree, palm, thermometer, drop, puff } from '../../engine2d/props.js';
import { drawGlobe } from '../../engine2d/earth.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.06, vig: 0.3 });
  return s.chip ? { chip: s.chip } : {};
}

function bird(ctx, x, y, s, t) {
  const f = Math.sin(t * 14) * 0.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(-26, -8 - 14 * f); ctx.quadraticCurveTo(-12, -14, 0, 0); ctx.quadraticCurveTo(12, -14, 26, -8 - 14 * f); ctx.stroke();
  ctx.restore();
}

function house(ctx, x, y, s) { kit.house(ctx, x, y, 150 * s, 120 * s, { lw: 5 }); }

function moai(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-38, -120); ctx.quadraticCurveTo(-40, -170, 0, -175); ctx.quadraticCurveTo(40, -170, 38, -120); ctx.lineTo(34, 0); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, -175, 0, [[0, '#a8a29e'], [1, '#57534e']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#44403c'; ctx.fillRect(-32, -138, 64, 14);
  ctx.beginPath(); ctx.moveTo(0, -126); ctx.lineTo(10, -84); ctx.lineTo(-8, -84); ctx.closePath(); ctx.fillStyle = '#78716c'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-16, -66); ctx.lineTo(16, -66); ctx.stroke();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 40, -110, 6, 26, 0, 0, TAU); ctx.fillStyle = '#78716c'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Cerros llenos de árboles… que desaparecen de golpe. Los pájaros se van y el excursionista se asusta.
    const gone = (i) => ease((local - 1.0 - (i % 9) * 0.03) / 0.25), bare = ease((local - 1.0) / 0.6);
    sky(ctx, W, 0, 1000, '#38bdf8', '#e0f2fe');
    sunDisc(ctx, 860, 520, 50, t);
    const back = (x) => 760 - 80 * Math.sin(x * 0.004 + 0.6), front = (x) => 900 - 60 * Math.sin(x * 0.006 + 2);
    const hill = (f, c1, c2) => { ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, f(x)); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 650, H, [[0, c1], [1, c2]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); };
    hill(back, mixc('#4ade80', '#d6b36a', bare), mixc('#15803d', '#92400e', bare));
    let i = 0;
    for (let x = 50; x < W; x += 92, i++) { bushyTree(ctx, x, back(x) + 10, 150, { k: 1 - gone(i), seed: i }); puff(ctx, x, back(x) - 60, clamp((local - 1.0 - (i % 9) * 0.03) / 0.5), 60); }
    hill(front, mixc('#86efac', '#e7c98a', bare), mixc('#16a34a', '#a16207', bare));
    cracks(ctx, 0, 960, W, 1500, 4, bare, 18);
    for (let x = 40; x < W; x += 125, i++) { if (x > 400 && x < 680) continue; bushyTree(ctx, x, front(x) + 12, 220, { k: 1 - gone(i), seed: i + 20, leaf: '#16a34a' }); puff(ctx, x, front(x) - 90, clamp((local - 1.0 - (i % 9) * 0.03) / 0.5), 80); }
    if (local > 1.1) for (let b = 0; b < 6; b++) { const k = local - 1.1; bird(ctx, 300 + b * 90 + k * 260, 640 - b * 20 - k * 220, 0.9, t + b); }
    const shock = local > 1.2;
    hq.toon(ctx, 540, 1090, 380, { t, seed: 3, shirt: '#ef4444', pants: '#365314', hair: '#78350f', armL: [shock ? 1.2 : 0.25, shock ? -0.8 : 0.2], armR: [shock ? 1.2 : 0.25, shock ? -0.8 : 0.2], eyes: shock ? 'wide' : 'happy', mouth: shock ? 'o' : 'smile', brows: shock ? 1 : 0, look: [0, -0.5] });
  },

  lluvia(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Ciclo: los árboles «sudan» vapor → se forma una nube → llueve otra vez sobre la selva.
    const c1 = cue(1), grow = ease((local - 0.3) / 1.6), rainA = ease((local - 1.2) / 0.6);
    sky(ctx, W, 0, 1000, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 900, 520, 46, t);
    ground(ctx, W, H, 1000, '#166534', '#052e16');
    // Vapor que sube de las copas.
    ctx.save(); ctx.lineCap = 'round'; ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 60;
    for (let i = 0; i < 6; i++) { const x0 = 110 + i * 172; ctx.strokeStyle = 'rgba(56,189,248,0.75)'; ctx.lineWidth = 9; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const u = k / 12; ctx.lineTo(lerp(x0, 540 + (x0 - 540) * 0.35, u) + 20 * Math.sin(u * 8 + t * 2 + i), lerp(760, 600, u)); } ctx.stroke(); }
    ctx.restore();
    cloud(ctx, 540, 540, 140 + 90 * grow, mixc('#ffffff', '#94a3b8', rainA * 0.6));
    rain(ctx, 560, 640, 1000, t, rainA, 36, 260);
    for (let i = 0; i < 7; i++) bushyTree(ctx, 70 + i * 160, 1010, 290, { seed: i + 3, leaf: i % 2 ? '#22c55e' : '#16a34a' });
    for (let i = 0; i < 6; i++) drop(ctx, 140 + i * 172, 720 - ((t * 120 + i * 40) % 80), 10, '#7dd3fc');
    hq.tag(ctx, 540, 410, local < c1 ? 'LOS ÁRBOLES SUDAN AGUA' : 'EL AMAZONAS HACE SU LLUVIA', { size: 42, fill: '#bae6fd' });
  },

  lodo(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    // Ladera pelada bajo la lluvia: un alud de lodo baja hacia una casa. Luego, corte: raíces que amarran la tierra.
    sky(ctx, W, 0, 1000, '#64748b', '#cbd5e1');
    cloud(ctx, 260, 470, 170, '#94a3b8'); cloud(ctx, 760, 500, 150, '#94a3b8');
    const slope = (x) => 560 + (x / W) * 440;
    ctx.beginPath(); ctx.moveTo(0, slope(0)); ctx.lineTo(W, slope(W)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 560, H, [[0, '#e7c98a'], [0.5, '#b45309'], [1, '#78350f']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    cracks(ctx, 0, 700, W, 1500, 8, 1, 16);
    house(ctx, 900, slope(900) + 6, 1);
    // Alud: lengua de lodo que avanza ladera abajo.
    const p = ease((local - 0.4) / Math.max(1.2, c1 + 0.6)), tip = lerp(160, 820, p);
    ctx.beginPath(); ctx.moveTo(100, slope(100) - 4);
    for (let x = 100; x <= tip; x += 20) ctx.lineTo(x, slope(x) - 55 - 16 * Math.sin(x * 0.05 + t * 4));
    ctx.quadraticCurveTo(tip + 40, slope(tip) - 10, tip, slope(tip) + 6); ctx.lineTo(100, slope(100) + 6); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 500, 1000, [[0, '#5b3a17'], [1, '#3b2410']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 0; i < 9; i++) { const x = lerp(140, tip - 30, ((i * 0.13 + t * 0.4) % 1)); ctx.beginPath(); ctx.ellipse(x, slope(x) - 40, 20, 14, i, 0, TAU); ctx.fillStyle = '#78716c'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
    // Escarpe arriba.
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(60, slope(60) - 10); ctx.lineTo(90, slope(90) + 14); ctx.lineTo(120, slope(120) - 6); ctx.stroke();
    rain(ctx, W, 380, 1000, t, 0.9, 70);
    if (local > c1) {
      // Tarjeta: corte del suelo con un árbol y sus raíces como red.
      const k = ease((local - c1) / 0.4);
      ctx.save(); ctx.globalAlpha = k;
      hq.card(ctx, 170, 460, 740, 560, '#fef3c7', 36);
      ctx.save(); hq.roundRectPath(ctx, 170, 460, 740, 560, 36); ctx.clip();
      sky(ctx, W, 460, 640, '#bae6fd', '#e0f2fe');
      ctx.fillStyle = hq.vgrad(ctx, 0, 640, 1020, [[0, '#92400e'], [1, '#451a03']]); ctx.fillRect(170, 640, 740, 380);
      ctx.fillStyle = 'rgba(253,230,138,0.35)'; const R = kit.rng(3); for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc(180 + R() * 720, 650 + R() * 360, 3, 0, TAU); ctx.fill(); }
      bushyTree(ctx, 540, 645, 240, { seed: 4 });
      const grow = ease((local - c1 - 0.2) / 1.2);
      ctx.strokeStyle = '#d6a56a'; ctx.lineCap = 'round';
      const root = (x, y, a, len, w, d) => { if (d > 4 || len < 12) return; const L = len * grow, x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; ctx.lineWidth = w + 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = '#d6a56a'; ctx.stroke(); root(x2, y2, a - 0.5, len * 0.7, w * 0.7, d + 1); root(x2, y2, a + 0.45, len * 0.7, w * 0.7, d + 1); };
      root(540, 650, Math.PI / 2, 120, 16, 0); root(540, 650, Math.PI * 0.85, 140, 12, 1); root(540, 650, Math.PI * 0.15, 140, 12, 1);
      ctx.restore(); ctx.restore();
      hq.tag(ctx, 540, 410, 'LAS RAÍCES SOSTIENEN LA TIERRA', { size: 38, fill: '#fde68a' });
    } else hq.tag(ctx, 540, 410, 'LOS CERROS SE VIENEN ABAJO', { size: 40, fill: '#fdba74' });
  },

  calor(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Calle partida en dos: con árbol y sombra (fresca) contra sin árbol (al rayo del Sol).
    const c1 = cue(1), k = ease((local - 0.3) / 1.2);
    sky(ctx, W, 0, 1000, '#7dd3fc', '#fef3c7');
    sunDisc(ctx, 860, 520, 58, t);
    for (let i = 0; i < 6; i++) kit.building(ctx, 90 + i * 180, 1000, 150, 260 + ((i * 37) % 4) * 60, { color: hq.shade('#94a3b8', -0.1 + (i % 3) * 0.1), lw: 5 });
    ground(ctx, W, H, 1000, '#d6d3d1', '#78716c');
    // Lado fresco.
    ctx.fillStyle = 'rgba(15,23,42,0.28)'; ctx.beginPath(); ctx.ellipse(270, 1050, 230, 40, 0, 0, TAU); ctx.fill();
    bushyTree(ctx, 220, 1010, 420, { seed: 7 });
    hq.toon(ctx, 330, 1100, 330, { t, seed: 2, shirt: '#22c55e', skin: '#e0ac69', eyes: 'happy', mouth: 'smile', armL: [0.25, 0.2], armR: [0.25, 0.2] });
    thermometer(ctx, 470, 980, 230, lerp(0.5, 0.35, k), '#3b82f6');
    // Lado al Sol.
    ctx.strokeStyle = 'rgba(249,115,22,0.5)'; ctx.lineWidth = 5; for (let i = 0; i < 5; i++) { const x = 640 + i * 90; ctx.beginPath(); for (let y = 1000; y > 820; y -= 10) ctx.lineTo(x + 10 * Math.sin(y * 0.08 + t * 6 + i), y); ctx.stroke(); }
    const r = hq.toon(ctx, 790, 1100, 330, { t, seed: 5, shirt: '#f97316', skin: '#c68642', eyes: 'bored', mouth: 'o', brows: -1, armL: [0.4, 0.3], armR: [0.4, 0.3] });
    for (const [dx, dy] of [[48, -20], [-52, 0]]) drop(ctx, r.head[0] + dx, r.head[1] + dy + ((local * 50) % 26), 9, '#7dd3fc');
    thermometer(ctx, 960, 980, 230, lerp(0.5, 0.9, k), '#ef4444');
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.moveTo(540, 900); ctx.lineTo(540, 1500); ctx.stroke(); ctx.setLineDash([]);
    hq.tag(ctx, 540, 410, local < c1 ? 'SIN SOMBRA, MÁS CALOR' : 'CON ÁRBOLES: VARIOS GRADOS MENOS', { size: local < c1 ? 44 : 34, fill: local < c1 ? '#fdba74' : '#86efac' });
  },

  aire(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1), half = c1 + Math.max(1.2, (o.s.dur - c1) * 0.45);
    if (local < c1) {
      // Respira tranquilo en un campo sin árboles: el aire no se acaba.
      sky(ctx, W, 0, 1000, '#7dd3fc', '#f0f9ff');
      ground(ctx, W, H, 1000, '#d6b36a', '#92400e');
      cracks(ctx, 0, 1030, W, 1500, 2, 1, 14);
      for (let i = 0; i < 6; i++) { const a = t * 1.5 + i; ctx.strokeStyle = 'rgba(56,189,248,0.6)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * 30, 650 + i * 8, 60 + i * 26, -0.4 + Math.sin(t + i) * 0.2, 0.6 + Math.sin(t + i) * 0.2); ctx.stroke(); }
      const inhale = Math.sin(t * 2) > 0;
      hq.toon(ctx, 540, 1100, 420, { t, seed: 1, shirt: '#0ea5e9', hair: '#111827', hairStyle: 'curly', skin: '#8d5524', eyes: inhale ? 'closed' : 'happy', mouth: inhale ? 'o' : 'smile', armL: [0.6, 0.4], armR: [0.6, 0.4] });
      hq.tag(ctx, 540, 410, 'NO TE AHOGARÍAS', { size: 46, fill: '#86efac' });
      return;
    }
    if (local < half) {
      // La Tierra con su capa de aire: oxígeno guardado para miles de años.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#020617'], [1, '#1e1b4b']]); ctx.fillRect(0, 0, W, H);
      const k = ease((local - c1) / 0.5);
      hq.glow(ctx, 540, 760, 360, 'rgba(56,189,248,A)', 0.55 * k);
      ctx.save(); ctx.globalAlpha = 0.5 * k; ctx.lineWidth = 34; ctx.strokeStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(540, 760, 290, 0, TAU); ctx.stroke(); ctx.restore();
      drawGlobe(ctx, 540, 760, 260, { lon0: -60 + t * 6, lat0: 10 });
      hq.tag(ctx, 540, 410, 'OXÍGENO PARA MILES DE AÑOS', { size: 40, fill: '#bae6fd' });
      return;
    }
    // Algas diminutas del mar que hacen la mitad del oxígeno.
    const k = ease((local - half) / 0.4);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0e7490'], [1, '#082f49']]); ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 380, 1300, t, { n: 14, seed: 5, color: 'rgba(103,232,249,A)', r: [30, 80], a: 0.15 });
    const R = kit.rng(9);
    for (let i = 0; i < 16; i++) {
      const x = 120 + R() * 840, y = 520 + R() * 520 + 12 * Math.sin(t * 1.3 + i), s = (22 + R() * 26) * k, kind = i % 3;
      hq.glow(ctx, x, y, s * 2.4, 'rgba(134,239,172,A)', 0.35);
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.3 + i);
      if (kind === 0) { ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fillStyle = '#4ade80'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = 'rgba(21,128,61,0.7)'; ctx.lineWidth = 3; for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s * 0.8, Math.sin(a) * s * 0.8); ctx.stroke(); } }
      else if (kind === 1) { hq.roundRectPath(ctx, -s * 1.2, -s * 0.45, s * 2.4, s * 0.9, s * 0.45); ctx.fillStyle = '#a3e635'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
      else { ctx.beginPath(); for (let a = 0; a < 3; a++) { const an = (a / 3) * TAU - Math.PI / 2; ctx.lineTo(Math.cos(an) * s, Math.sin(an) * s); } ctx.closePath(); ctx.fillStyle = '#34d399'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
      ctx.restore();
      for (let b = 0; b < 2; b++) { const by = y - s - (((t * 70 + i * 23 + b * 40) % 120)); ctx.beginPath(); ctx.arc(x + 8 * Math.sin(t * 3 + b), by, 6 + b * 2, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); }
    }
    hq.tag(ctx, 540, 410, 'LA MITAD: ALGAS DEL MAR', { size: 44, fill: '#86efac' });
  },

  pascua(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Isla de Pascua: las palmeras van desapareciendo y quedan los moáis sobre puro pasto.
    const c1 = cue(1), lose = (i) => ease((local - 0.8 - i * ((c1 - 1.0) / 9)) / 0.35), past = ease((local - c1 + 0.4) / 0.8);
    sky(ctx, W, 0, 880, '#38bdf8', '#e0f2fe');
    sunDisc(ctx, 880, 520, 46, t);
    sea(ctx, W, H, 880, t, { top: '#0ea5e9', bottom: '#075985' });
    ctx.beginPath(); ctx.moveTo(-40, 990); ctx.quadraticCurveTo(540, 470, 1120, 990); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 720, 1010, [[0, mixc('#15803d', '#a3e635', past)], [1, mixc('#14532d', '#65a30d', past)]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const isl = (x) => { const u = (x + 40) / 1160; return (1 - u) * (1 - u) * 990 + 2 * u * (1 - u) * 470 + u * u * 990; };
    for (let i = 0; i < 10; i++) { const x = 30 + i * 112, k = 1 - lose(i); palm(ctx, x, isl(x) + 6, 0.75, { k }); puff(ctx, x + 20, isl(x) - 60, clamp((local - 0.8 - i * ((c1 - 1.0) / 9)) / 0.5), 60); }
    // Plataforma y moáis.
    hq.roundRectPath(ctx, 300, 790, 480, 34, 8); ctx.fillStyle = '#a8a29e'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 0; i < 5; i++) moai(ctx, 350 + i * 95, 792, 1.05);
    if (local < c1) hq.tag(ctx, 540, 410, local < c1 * 0.45 ? 'ISLA DE PASCUA' : 'SE ACABARON SUS BOSQUES', { size: 44, fill: '#fde68a' });
    else hq.tag(ctx, 540, 410, '¡CASI SOLO PASTO!', { size: 48, fill: '#bef264' });
  },
};
