// Short 59: ¿y si el día durara 12 horas?  (SERIE LA TIERRA · 2; la Tierra gira el doble de rápido)
// Gancho: el globo acelera y el reloj vuela → el mar se va al ecuador (los países de en medio bajo el agua) y en los polos
// aparece tierra seca → 6 h de sol y 6 de noche: dos atardeceres cada 24 h → el año tendría 730 días (tu cumpleaños
// igual de lento) → lo curioso: antes giraba más rápido; con los dinosaurios el día duraba media hora menos (almeja
// fósil, 372 días al año); la Luna nos va frenando.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, ease, lerp, mixc, sky, ground, sunDisc, cloud, space, tower, HERO } from '../../engine2d/props.js';
import { drawGlobe } from '../../engine2d/earth.js';

export function setup() {}

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  ctx.save();
  hq.camera(ctx, 1 + 0.05 * Math.min(1, local / s.dur), 540, 760);
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  ctx.restore();
  hq.finish(ctx, C.W, C.H, { paper: 0.06, vig: 0.3 });
  return {};
}

function clock(ctx, x, y, r, a, { label = null, color = '#ffffff' } = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = Math.max(5, r * 0.08); ctx.strokeStyle = INK; ctx.stroke();
  for (let i = 0; i < 12; i++) { const b = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(b) * r * 0.78, Math.sin(b) * r * 0.78); ctx.lineTo(Math.cos(b) * r * 0.9, Math.sin(b) * r * 0.9); ctx.lineWidth = Math.max(3, r * 0.04); ctx.stroke(); }
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(5, r * 0.07); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a / 12 - Math.PI / 2) * r * 0.5, Math.sin(a / 12 - Math.PI / 2) * r * 0.5); ctx.stroke();
  ctx.lineWidth = Math.max(4, r * 0.05); ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - Math.PI / 2) * r * 0.75, Math.sin(a - Math.PI / 2) * r * 0.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.07, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  if (label) kit.text(ctx, label, 0, r * 0.38, { size: r * 0.26, fill: '#ef4444', stroke: null });
  ctx.restore();
}

function speedArcs(ctx, cx, cy, R, t) {
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 8;
  for (let i = 0; i < 4; i++) { const a = -t * 6 + i * (TAU / 4), r = R * (1.12 + 0.04 * (i % 2)); ctx.beginPath(); ctx.arc(cx, cy, r, a, a + 0.7); ctx.stroke(); }
  ctx.restore();
}

function moon(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, '#f1f5f9'], [1, '#94a3b8']]); ctx.fill(); ctx.lineWidth = Math.max(4, r * 0.08); ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(100,116,139,0.5)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.25, 0.1, 0.15], [-0.05, 0.35, 0.12]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); ctx.fill(); }
}

function cake(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  hq.roundRectPath(ctx, -120, -110, 240, 110, 16); ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-120, -90); for (let i = 0; i <= 8; i++) ctx.quadraticCurveTo(-120 + i * 30 - 15, -60, -120 + i * 30, -90); ctx.lineTo(120, -110); ctx.lineTo(-120, -110); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#60a5fa'; ctx.fillRect(-8, -170, 16, 60); ctx.strokeRect(-8, -170, 16, 60);
  ctx.beginPath(); ctx.moveTo(0, -205 - 6 * Math.sin(t * 12)); ctx.quadraticCurveTo(14, -180, 0, -172); ctx.quadraticCurveTo(-14, -180, 0, -205 - 6 * Math.sin(t * 12)); ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}

function dino(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const col = '#65a30d', dk = '#3f6212';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // Cola y cuello.
  for (const [w, c] of [[44, INK], [32, col]]) { ctx.beginPath(); ctx.moveTo(-120, -110); ctx.quadraticCurveTo(-260, -90, -330, -40); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
  const nx = 170 + 10 * Math.sin(t * 1.5), ny = -330;
  for (const [w, c] of [[54, INK], [40, col]]) { ctx.beginPath(); ctx.moveTo(100, -140); ctx.quadraticCurveTo(170, -220, nx, ny); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(nx + 24, ny - 6, 50, 30, 0.1, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(nx + 38, ny - 16, 6, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  // Patas y cuerpo.
  for (const lx of [-90, -40, 50, 100]) { hq.roundRectPath(ctx, lx - 22, -80, 44, 80, 14); ctx.fillStyle = lx === -40 || lx === 100 ? dk : col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -120, 160, 80, 0, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, -200, -40, [[0, '#84cc16'], [1, dk]]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(63,98,18,0.6)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-80 + i * 40, -150 + (i % 2) * 20, 12, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function clam(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 60); for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI, r = 200 + 12 * (i % 2); ctx.lineTo(Math.cos(a) * r, 60 + Math.sin(a) * r * 0.9); } ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, -130, 60, [[0, '#e7e5e4'], [1, '#a8a29e']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(68,64,60,0.55)'; ctx.lineWidth = 3;
  for (let k = 1; k < 26; k++) { ctx.beginPath(); ctx.ellipse(0, 60, k * 8, k * 7.2, 0, Math.PI, TAU); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // La Tierra acelera y el reloj vuela.
    const c1 = cue(1), fast = ease((local - 0.6) / 0.6), cx = 540, cy = 900, R = 300;
    space(ctx, W, H, t);
    const spin = local * 25 + fast * (local - 0.6) * 160;
    drawGlobe(ctx, cx, cy, R, { lon0: 20 - spin, lat0: 15 });
    if (fast > 0.2) speedArcs(ctx, cx, cy, R, t);
    clock(ctx, 880, 590, 100, local * (1 + 10 * fast) * 2, { label: '12 H' });
    if (local > c1) hq.toon(ctx, 130, 1110, 300, { ...HERO, t, seed: 1, lean: 0.12 * Math.sin(t * 6), armL: [1.2, -0.7], armR: [1.2, -0.7], eyes: 'closed', mouth: 'o', brows: 1 });
  },

  mar(ctx, o) {
    const { W, H, local, cue, t } = o;
    // El agua se amontona en el ecuador (se sale del contorno) y los polos se secan.
    const c1 = cue(1), k = ease((local - 0.3) / 1.4), dry = ease((local - c1) / 1.0), cx = 540, cy = 850, R = 360, lon0 = -60 - t * 6;
    space(ctx, W, H, t);
    // Bulto de agua detrás del globo (asoma a los lados, en el ecuador).
    ctx.beginPath(); ctx.ellipse(cx, cy, R * (1 + 0.14 * k), R * 0.36, 0, 0, TAU); ctx.fillStyle = '#2b7bd6'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    drawGlobe(ctx, cx, cy, R, { lon0, lat0: 0, glow: false,
      under: (c, r) => { if (dry > 0) { c.fillStyle = mixc('#2b7bd6', '#d6b77a', dry); c.fillRect(-r, -r, 2 * r, r * 0.55); c.fillRect(-r, r * 0.45, 2 * r, r * 0.55); } },
      extra: (c, r) => {
        // Franja de agua que cubre la tierra del ecuador.
        c.fillStyle = `rgba(43,123,214,${0.85 * k})`; c.fillRect(-r, -r * 0.3, 2 * r, r * 0.6);
        c.strokeStyle = `rgba(255,255,255,${0.7 * k})`; c.lineWidth = 5; for (const yy of [-r * 0.3, r * 0.3]) { c.beginPath(); for (let x = -r; x <= r; x += 20) c.lineTo(x, yy + 6 * Math.sin(x * 0.05 + t * 4)); c.stroke(); }
      } });
    // Flechas de los polos al ecuador.
    if (local < c1) {
      ctx.save(); ctx.lineCap = 'round';
      for (const sy of [-1, 1]) for (const sx of [-1, 0, 1]) {
        const x = cx + sx * 170, y0 = cy + sy * (R - 50 - 40 * (sx === 0)), y1 = cy + sy * (R * 0.36), yy = lerp(y0, y1, 0.35 + 0.65 * ease(((t * 0.9) % 1) * 1.4));
        for (const [w, c] of [[22, INK], [12, '#ffffff']]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, yy); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x, yy + sy * 34); ctx.lineTo(x - 26, yy - sy * 4); ctx.lineTo(x + 26, yy - sy * 4); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      }
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'EL MAR SE VA AL ECUADOR' : 'TIERRA SECA EN LOS POLOS', { size: 44, fill: local < c1 ? '#bae6fd' : '#fde68a' });
  },

  dia(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Ciudad: el día pasa volando (6 h de luz, 6 de noche). Contador de atardeceres.
    const c1 = cue(1), u = (local / 2.4) % 1, day = u < 0.5, p = day ? u / 0.5 : (u - 0.5) / 0.5;
    const light = day ? Math.sin(p * Math.PI) : 0;
    sky(ctx, W, 0, 1050, mixc('#0f172a', '#38bdf8', light), mixc('#1e1b4b', day && (p < 0.15 || p > 0.85) ? '#fb923c' : '#e0f2fe', light));
    if (day) sunDisc(ctx, lerp(80, 1000, p), 1000 - Math.sin(p * Math.PI) * 460, 64, t);
    else { moon(ctx, lerp(80, 1000, p), 1000 - Math.sin(p * Math.PI) * 420, 50); }
    const blds = [[60, 140, 9, '#64748b'], [210, 130, 13, '#475569'], [350, 150, 7, '#94a3b8'], [610, 140, 15, '#475569'], [760, 130, 10, '#64748b'], [900, 150, 12, '#94a3b8']];
    for (const [x, w, f, c] of blds) tower(ctx, x + w / 2, 1060, w, f, mixc('#1e293b', c, 0.3 + 0.7 * light), 30);
    ground(ctx, W, H, 1060, '#475569', '#1e293b');
    hq.toon(ctx, 540, 1160, 330, { ...HERO, t, seed: 2, eyes: light < 0.2 ? 'closed' : 'open', mouth: 'o', look: [lerp(-1, 1, p) * (day ? 1 : 0), -0.8], armL: [0.3, 0.2], armR: [0.3, 0.2] });
    if (local > c1) { hq.roundRectPath(ctx, 720, 490, 320, 170, 22); ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#fb923c'; ctx.stroke(); kit.text(ctx, '2 ATARDECERES', 880, 550, { size: 34, fill: '#fdba74', stroke: null }); kit.text(ctx, 'CADA 24 H', 880, 610, { size: 34, fill: '#ffffff', stroke: null }); }
    hq.tag(ctx, 540, 410, local < c1 ? '6 H DE SOL, 6 DE NOCHE' : 'DOS ATARDECERES AL DÍA', { size: 44, fill: '#fde68a' });
  },

  anio(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#e0e7ff'], [1, '#a5b4fc']]); ctx.fillRect(0, 0, W, H);
    if (local < c1) {
      // Calendario que cuenta hasta 730.
      const n = Math.round(lerp(1, 730, ease((local - 0.2) / Math.max(1.2, c1 - 0.4))));
      for (let i = 2; i >= 0; i--) { hq.roundRectPath(ctx, 250 + i * 14, 540 + i * 14, 580, 560, 30); ctx.fillStyle = i ? '#e2e8f0' : '#ffffff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); }
      ctx.fillStyle = '#ef4444'; hq.roundRectPath(ctx, 250, 540, 580, 120, 30); ctx.fill(); ctx.lineWidth = 7; ctx.stroke(); ctx.fillRect(254, 620, 572, 40);
      kit.text(ctx, 'DÍA', 540, 600, { size: 60, fill: '#ffffff', stroke: null });
      kit.text(ctx, String(n), 540, 860, { size: 220, fill: INK, stroke: null });
      kit.text(ctx, 'DE 730', 540, 1020, { size: 56, fill: '#64748b', stroke: null });
      hq.tag(ctx, 540, 410, 'UN AÑO: 730 DÍAS', { size: 50, fill: '#c7d2fe' });
    } else {
      // Pastel listo… y él esperando, aburrido.
      ctx.fillStyle = hq.vgrad(ctx, 0, 1080, H, [[0, '#a16207'], [1, '#713f12']]); ctx.fillRect(0, 1080, W, H - 1080); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1080); ctx.lineTo(W, 1080); ctx.stroke();
      cake(ctx, 760, 1080, 1.4, t);
      hq.toon(ctx, 280, 1320, 520, { ...HERO, t, seed: 3, armL: [0.6, 1.4], armR: [0.6, 1.4], eyes: 'closed', mouth: 'flat', brows: -0.5, look: [1, 0], lean: -0.04 });
      clock(ctx, 820, 600, 110, t * 3);
      hq.tag(ctx, 540, 410, 'TU CUMPLEAÑOS, IGUAL DE LENTO', { size: 40, fill: '#fde68a' });
    }
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1), c2 = cue(2);
    if (local < c1) {
      // Antes giraba más rápido: un dinosaurio y un reloj de 23 h 30 min.
      sky(ctx, W, 0, 1080, '#fdba74', '#fef3c7');
      sunDisc(ctx, 180, 600, 60, t);
      ground(ctx, W, H, 1080, '#84cc16', '#3f6212');
      dino(ctx, 560, 1100, 1.25, t);
      clock(ctx, 880, 590, 100, t * 2);
      hq.tag(ctx, 540, 410, 'ANTES GIRABA MÁS RÁPIDO', { size: 44, fill: '#fde68a' });
    } else if (local < c2) {
      // La almeja fósil: un anillo por día → 372 días al año → días de 23 h y media.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#f5f5f4'], [1, '#d6d3d1']]); ctx.fillRect(0, 0, W, H);
      clam(ctx, 540, 960, 1.9);
      ctx.save(); ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(800, 800); ctx.lineTo(920, 680); ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = '#78350f'; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(700, 900, 140, 0, TAU); ctx.fillStyle = 'rgba(224,242,254,0.35)'; ctx.fill(); ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();
      hq.tag(ctx, 540, 410, 'DÍAS DE 23 H Y MEDIA', { size: 48, fill: '#fde68a' });
      hq.tag(ctx, 540, 520, '372 DÍAS AL AÑO', { size: 38, fill: '#ffffff' });
    } else {
      // La Luna frena a la Tierra poquito a poco.
      space(ctx, W, H, t);
      drawGlobe(ctx, 380, 880, 230, { lon0: -t * 20, lat0: 15 });
      moon(ctx, 880, 700, 80);
      ctx.save(); ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 40; ctx.strokeStyle = 'rgba(226,232,240,0.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(800, 730); ctx.lineTo(600, 820); ctx.stroke(); ctx.restore();
      // Señal de «freno».
      ctx.save(); ctx.translate(380, 560); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; ctx.lineTo(Math.cos(a) * 80, Math.sin(a) * 80); } ctx.closePath(); ctx.fillStyle = '#dc2626'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      kit.text(ctx, 'ALTO', 0, 4, { size: 44, fill: '#ffffff', stroke: null }); ctx.restore();
      hq.tag(ctx, 540, 410, 'LA LUNA NOS FRENA', { size: 50, fill: '#e2e8f0' });
    }
  },
};
