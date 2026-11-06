// Short 06: ¿Y si los humanos desaparecieran? Línea de tiempo: día 2 → año 5 → año 20 → año 300 →
// año 1,000 → lo que queda → nuestras señales de radio en el espacio.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(240, C.W, C.H, 13); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const SHIRTS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function vines(ctx, kit, x, y, h, k, seed) {
  if (k <= 0) return;
  const r = kit.rng(seed);
  ctx.save(); ctx.strokeStyle = '#3f9e4f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const vx = x + (r() - 0.5) * 40, top = y - h * k * (0.6 + r() * 0.4);
    ctx.beginPath(); ctx.moveTo(vx, y);
    for (let yy = y; yy > top; yy -= 20) ctx.lineTo(vx + Math.sin(yy * 0.05 + i) * 14, yy);
    ctx.stroke();
    for (let yy = y - 30; yy > top; yy -= 46) { ctx.beginPath(); ctx.ellipse(vx + Math.sin(yy * 0.05 + i) * 14 + 12, yy, 13, 8, 0.5, 0, Math.PI * 2); ctx.fillStyle = '#4ade80'; ctx.fill(); }
  }
  ctx.restore();
}

function grassTuft(ctx, x, y, h, col = '#4ade80') {
  if (h <= 1) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (const a of [-0.5, -0.2, 0.1, 0.4]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a * h * 0.3, y - h * 0.6, x + a * h, y - h); ctx.stroke(); }
  ctx.restore();
}

function deer(ctx, kit, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const lx of [-40, -25, 25, 40]) { kit.roundRect(ctx, lx - 6, -70, 12, 70, 5); kit.shape(ctx, '#a16207', 4); }
  ctx.beginPath(); ctx.ellipse(0, -85, 60, 28, 0, 0, Math.PI * 2); kit.shape(ctx, '#b45309', 5);
  kit.roundRect(ctx, 40, -150, 22, 70, 10); kit.shape(ctx, '#b45309', 5);
  ctx.beginPath(); ctx.ellipse(62, -150, 28, 16, 0.3, 0, Math.PI * 2); kit.shape(ctx, '#b45309', 5);
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(48, -165); ctx.lineTo(36, -205); ctx.moveTo(40, -190); ctx.lineTo(24, -198); ctx.moveTo(58, -165); ctx.lineTo(66, -205); ctx.moveTo(63, -190); ctx.lineTo(80, -196); ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#e0f2fe');
    const gy = 1080;
    [[120, 170, 520, '#94a3b8'], [300, 160, 640, '#64748b'], [480, 170, 460, '#a8a29e'], [660, 150, 700, '#78716c'], [840, 180, 560, '#94a3b8'], [1010, 160, 480, '#64748b']]
      .forEach(([x, w, h, c]) => kit.building(ctx, x, gy - 80, w, h, { color: c, lit: () => 0 }));
    ctx.fillStyle = '#d6d3d1'; ctx.fillRect(0, gy - 80, W, 80);
    ctx.fillStyle = '#6b7280'; ctx.fillRect(0, gy, W, H - gy);
    const v = cue(1);
    // Multitud: cada persona desaparece en un "puf" (escalonado).
    for (let i = 0; i < 10; i++) {
      const x = 70 + i * 104 + (i % 2) * 20, y = gy - 10 + (i % 3) * 30, h = 210 + (i % 3) * 20;
      const tv = v + i * 0.06;
      const walk = Math.sin(t * 8 + i) * 4;
      if (local < tv) kit.person(ctx, x + Math.sin(t * 1.5 + i) * 10, y + walk * 0.3, h, { shirt: SHIRTS[i], arms: 0.05 + 0.05 * Math.sin(t * 8 + i) });
      else {
        const k = (local - tv) / 0.35;
        if (k < 1) {
          ctx.save(); ctx.globalAlpha = 1 - k;
          for (let j = 0; j < 6; j++) { const a = j * 1.05 + i; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 70 * k, y - h * 0.5 + Math.sin(a) * 70 * k, 30 * (1 - k * 0.5), 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); }
          ctx.restore();
        }
      }
    }
  },

  luces(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#020617', '#1e1b4b');
    const off = kit.ramp(local, 0.5, 2.6);
    kit.drawStars(ctx, stars, 0.25 + 0.75 * off, t);
    const gy = 1100, r = kit.rng(7);
    const blds = [[90, 150, 560], [240, 140, 700], [380, 130, 480], [520, 150, 800], [670, 140, 600], [810, 150, 680], [960, 160, 520]];
    blds.forEach(([x, w, h], bi) => kit.building(ctx, x, gy, w, h, { color: '#1e293b', lit: (j) => {
      // Las ventanas se apagan de izquierda a derecha; algunas parpadean antes.
      const on = r() < 0.75;
      if (!on) return 0;
      const tOff = 0.5 + (bi / blds.length) * 1.6 + (j % 5) * 0.06;
      if (local > tOff) return 0;
      return local > tOff - 0.25 ? (Math.sin(t * 60 + j) > 0 ? 1 : 0.2) : 1;
    } }));
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, gy, W, H - gy);
    // Resplandor de la ciudad que se apaga.
    const g = ctx.createLinearGradient(0, gy - 500, 0, gy);
    g.addColorStop(0, 'rgba(251,191,36,0)'); g.addColorStop(1, `rgba(251,191,36,${0.25 * (1 - off)})`);
    ctx.fillStyle = g; ctx.fillRect(0, gy - 500, W, 500);
  },

  asfalto(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#4b5563', '#374151');
    // Vista desde arriba: carretera con línea amarilla.
    ctx.fillStyle = '#4b5563'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 0, 90, H); ctx.fillRect(W - 90, 0, 90, H);
    ctx.fillStyle = '#facc15'; for (let y = -40; y < H; y += 200) ctx.fillRect(W / 2 - 12, y, 24, 110);
    // Grietas que se ramifican y plantas que salen por ellas.
    const grow = kit.ramp(local, 0.1, cue(1) + 0.6);
    const r = kit.rng(21);
    const cracks = [];
    for (let c = 0; c < 6; c++) {
      let x = 150 + r() * (W - 300), y = 380 + r() * 700, a = r() * Math.PI * 2;
      const pts = [[x, y]];
      for (let k = 0; k < 9; k++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * 45; y += Math.sin(a) * 45; pts.push([x, y]); }
      cracks.push(pts);
    }
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    cracks.forEach((pts, c) => {
      const n = Math.floor(grow * (pts.length - 1) + 1);
      ctx.beginPath(); pts.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      pts.slice(0, n).forEach(([x, y], i) => { if (i % 2 === 1) grassTuft(ctx, x, y, 70 * kit.ramp(local, cue(1) - 0.2 + i * 0.05 + c * 0.04, cue(1) + 0.5 + i * 0.05 + c * 0.04)); });
    });
    // Flor amarilla en la grieta más grande.
    const fk = kit.ramp(local, cue(1) + 0.4, cue(1) + 0.9);
    if (fk > 0) {
      const [fx, fy] = cracks[0][4];
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 120 * fk); ctx.stroke();
      for (let p = 0; p < 6; p++) { const a = (p / 6) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 26 * fk, fy - 120 * fk + Math.sin(a) * 26 * fk, 18 * fk, 11 * fk, a, 0, Math.PI * 2); kit.shape(ctx, '#fde047', 4); }
      ctx.beginPath(); ctx.arc(fx, fy - 120 * fk, 14 * fk, 0, Math.PI * 2); kit.shape(ctx, '#f97316', 4);
    }
  },

  casas(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#93c5fd', '#e0f2fe');
    const gy = 1100;
    ctx.fillStyle = '#4d7c0f'; ctx.fillRect(0, gy, W, H - gy);
    const roof = o.ease.in(kit.ramp(local, 0.5, 0.8)); // se hunde de golpe (con el crujido)
    ctx.save(); kit.shake(ctx, 14 * kit.impulse(local, 0.5, 0.4), t);
    kit.house(ctx, W / 2, gy, 560, 420, { wall: '#d6c3a5', roofC: '#8b5a3c', door: '#57381f', roof });
    // Árbol que crece dentro de la casa: solo se ve lo que sale por encima de las paredes (por el techo roto).
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, gy - 418); ctx.clip();
    kit.tree(ctx, W / 2 + 20, gy - 280, 700, { grow: o.ease.out(kit.ramp(local, 0.8, cue(1) + 0.9)), leaf: '#3fae5a' });
    ctx.restore();
    ctx.restore();
    vines(ctx, kit, W / 2 - 250, gy, 400, kit.ramp(local, 0.3, cue(1) + 0.8), 3);
    vines(ctx, kit, W / 2 + 250, gy, 360, kit.ramp(local, 0.6, cue(1) + 1.0), 4);
    const r = kit.rng(8);
    for (let i = 0; i < 16; i++) grassTuft(ctx, 30 + i * 68 + r() * 20, gy + 6, (60 + r() * 50) * kit.ramp(local, 0.1 + i * 0.03, 0.8 + i * 0.03), '#65a30d');
  },

  puentes(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#fdba74', '#fef3c7');
    const deckY = 820, riverY = 1030, br = cue(1) + 0.3;
    ctx.fillStyle = '#65a30d'; ctx.fillRect(0, deckY + 40, 130, H); ctx.fillRect(W - 130, deckY + 40, 130, H);
    ctx.fillStyle = '#2563eb'; ctx.fillRect(130, riverY, W - 260, H - riverY);
    // Óxido: de gris acero a naranja.
    const rust = kit.ramp(local, 0.1, cue(1));
    const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * rust));
    const [rr, gg, bb] = mix([148, 163, 184], [180, 83, 9]), steel = `rgb(${rr},${gg},${bb})`;
    ctx.save(); kit.shake(ctx, 16 * kit.impulse(local, br, 0.6), t);
    const seg = (x0, x1, y, rot, pivotX) => {
      ctx.save(); ctx.translate(pivotX, y); ctx.rotate(rot); ctx.translate(-pivotX, -y);
      kit.roundRect(ctx, x0, y, x1 - x0, 34, 4); kit.shape(ctx, steel, 6);
      ctx.strokeStyle = steel; ctx.lineWidth = 12;
      const n = Math.round((x1 - x0) / 80), st = (x1 - x0) / n;
      for (let i = 0; i < n; i++) { const x = x0 + i * st; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + st / 2, y - 110); ctx.lineTo(x + st, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x0, y - 110); ctx.lineTo(x1, y - 110); ctx.stroke();
      ctx.strokeStyle = kit.INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y - 110); ctx.lineTo(x1, y - 110); ctx.stroke();
      ctx.restore();
    };
    for (const px of [330, 750]) { kit.roundRect(ctx, px - 30, deckY + 30, 60, riverY - deckY + 40, 6); kit.shape(ctx, '#a8a29e', 6); }
    seg(100, 330, deckY, 0, 330);
    seg(750, 980, deckY, 0, 750);
    // Tramo central: se rompe y cae al río.
    const ft = Math.max(0, local - br);
    const drop = Math.min(riverY - deckY + 60, 0.5 * 2600 * ft * ft), rot = Math.min(0.5, ft * 0.9);
    ctx.save(); ctx.translate(0, drop);
    if (drop < riverY - deckY + 59) seg(330, 750, deckY, rot, 330);
    ctx.restore();
    // Salpicadura.
    const sp = local - (br + 0.55);
    if (sp > 0 && sp < 1) {
      const r = kit.rng(3);
      for (let k = 0; k < 24; k++) { const a = -Math.PI * (0.1 + 0.8 * r()), v = 600 + r() * 700; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * v * sp, riverY + Math.sin(a) * v * sp + 1600 * sp * sp, 9 + r() * 12, 0, Math.PI * 2); ctx.fillStyle = `rgba(219,234,254,${1 - sp})`; ctx.fill(); }
    }
    ctx.restore();
  },

  bosque(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#ecfccb');
    const gy = 1100;
    [[130, 170, 560], [320, 160, 720], [520, 180, 520], [720, 150, 660], [920, 170, 600]].forEach(([x, w, h], i) => {
      kit.building(ctx, x, gy, w, h, { color: '#64748b', win: '#334155', lit: () => 0 });
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#4d7c0f';
      for (let y = gy - h; y < gy; y += 50) { const ww = w * (0.3 + 0.5 * Math.abs(Math.sin(y * 0.02 + i))); ctx.beginPath(); ctx.ellipse(x - w / 2 + ww / 2, y + 20, ww / 2, 26, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      vines(ctx, kit, x + w * 0.3, gy, h, 1, 20 + i);
    });
    ctx.fillStyle = '#3f6212'; ctx.fillRect(0, gy, W, H - gy);
    const r = kit.rng(17);
    for (let i = 0; i < 9; i++) kit.tree(ctx, 40 + i * 125 + r() * 30, gy + 30 + r() * 30, 300 + r() * 160, { leaf: ['#16a34a', '#15803d', '#22c55e'][i % 3], pine: i % 3 === 1 });
    deer(ctx, kit, 300 + local * 30, gy + 60, 1.3);
    // Pájaros.
    ctx.strokeStyle = kit.INK; ctx.lineWidth = 5;
    for (let i = 0; i < 5; i++) { const bx = ((t * 90 + i * 230) % (W + 200)) - 100, by = 420 + (i % 3) * 60, f = Math.sin(t * 10 + i) * 12; ctx.beginPath(); ctx.moveTo(bx - 24, by - f); ctx.quadraticCurveTo(bx - 10, by - 14, bx, by); ctx.quadraticCurveTo(bx + 10, by - 14, bx + 24, by - f); ctx.stroke(); }
  },

  queda(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#fb923c', '#fde68a');
    kit.sun(ctx, 170, 470, 90, { t });
    const hy = 980;
    // Pirámides.
    [[300, 330], [620, 420], [880, 260]].forEach(([x, h]) => {
      ctx.beginPath(); ctx.moveTo(x - h, hy); ctx.lineTo(x, hy - h); ctx.lineTo(x + h, hy); ctx.closePath(); kit.shape(ctx, '#d97706', 7);
      ctx.beginPath(); ctx.moveTo(x, hy - h); ctx.lineTo(x + h, hy); ctx.lineTo(x + h * 0.25, hy); ctx.closePath(); ctx.fillStyle = 'rgba(120,53,15,0.35)'; ctx.fill();
    });
    ctx.fillStyle = '#fcd34d'; ctx.fillRect(0, hy, W, H - hy);
    ctx.beginPath(); ctx.moveTo(0, hy + 40); ctx.quadraticCurveTo(300, hy - 10, 600, hy + 50); ctx.quadraticCurveTo(850, hy + 90, W, hy + 30); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill();
    // Botella de plástico y frasco de vidrio medio enterrados.
    const a1 = kit.ramp(local, cue(1), cue(1) + 0.2), a2 = kit.ramp(local, cue(1) + 0.5, cue(1) + 0.7), a3 = kit.ramp(local, cue(1) + 1.1, cue(1) + 1.3);
    ctx.save(); ctx.translate(250, hy + 120); ctx.rotate(-0.5); ctx.scale(1.45, 1.45);
    kit.roundRect(ctx, -40, -150, 80, 170, 22); kit.shape(ctx, 'rgba(125,211,252,0.85)', 6);
    kit.roundRect(ctx, -18, -190, 36, 46, 8); kit.shape(ctx, '#2563eb', 6);
    kit.roundRect(ctx, -40, -100, 80, 50, 4); kit.shape(ctx, '#ef4444', 4);
    ctx.restore();
    ctx.save(); ctx.translate(820, hy + 130); ctx.rotate(0.3); ctx.scale(1.45, 1.45);
    kit.roundRect(ctx, -55, -130, 110, 140, 24); kit.shape(ctx, 'rgba(187,247,208,0.75)', 6);
    kit.roundRect(ctx, -40, -150, 80, 26, 6); kit.shape(ctx, 'rgba(187,247,208,0.9)', 5);
    ctx.restore();
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(0, hy + 100, W, 200);
    const lab = (txt, x, y, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; kit.text(ctx, txt, x, y, { size: 46 * (0.8 + 0.2 * a), fill: '#ffffff' }); ctx.restore(); };
    lab('PLÁSTICO', 250, hy - 230, a1);
    lab('VIDRIO', 830, hy - 170, a2);
    lab('PIRÁMIDES', 620, hy - 470, a3);
  },

  radio(ctx, o) {
    const { W, H, kit, local, t } = o;
    kit.gradientBG(ctx, W, H, '#020617', '#0f0b2e');
    kit.drawStars(ctx, stars, 0.9, t);
    const cx = W / 2, cy = 760;
    // Ondas de radio que salen de la Tierra y se alejan.
    for (let i = 0; i < 6; i++) {
      // Despacio y gruesas: cada anillo avanza menos que su grosor por fotograma (sin efecto estroboscópico).
      const ph = ((t * 0.22 + i / 6) % 1), rad = 210 + ph * 700;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(125,211,252,${0.55 * (1 - ph)})`; ctx.lineWidth = 22; ctx.stroke();
    }
    drawGlobe(ctx, cx, cy, 200, { lon0: -t * 25, lat0: 14, land: '#3fae5a' });
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'SEÑALES DE RADIO', W / 2, 330, { size: 84 * (0.8 + 0.2 * k), fill: kit.YELLOW }); ctx.restore(); }
  },
};
