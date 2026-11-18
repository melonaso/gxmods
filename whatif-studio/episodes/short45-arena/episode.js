// Short 45: ¿y si se acabara la arena del mundo?  (calidad alta: engine2d/hq.js)
// Gancho corto: ¿te afectaría? (se contesta escena por escena). Sin palabras técnicas.
// Adiós a construir (el concreto es casi todo arena y piedras) → sin vidrio (es arena derretida) →
// los chips del celular salen de la misma piedra de la arena → es lo que más usa el mundo después del agua →
// ¿y los desiertos? no sirven: el viento redondea los granos como canicas → sorpresa: Dubái compró arena a Australia
// para construir el edificio más alto del mundo.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';

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

const TAU = Math.PI * 2;
const INK = '#0b0f1a';
const SAND = '#fcd34d';
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const pop = (x) => { x = clamp(x); return x < 0.7 ? (x / 0.7) * 1.12 : 1.12 - 0.12 * ((x - 0.7) / 0.3); };

function sunDisc(ctx, x, y, r, t) {
  hq.glow(ctx, x, y, r * 3, 'rgba(253,224,71,A)', 0.55);
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.2);
  for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-r * 0.13, -r * 1.16); ctx.lineTo(0, -r * 1.5); ctx.lineTo(r * 0.13, -r * 1.16); ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = hq.vgrad(ctx, 0, y - r, y + r, [[0, '#fef08a'], [1, '#f59e0b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}

function cloud(ctx, x, y, s, fill = '#ffffff') {
  const blobs = [[-0.55, 0.12, 0.36], [-0.2, -0.16, 0.5], [0.28, -0.06, 0.44], [0.62, 0.14, 0.3], [0.04, 0.2, 0.4]];
  ctx.fillStyle = INK; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, r * s + 6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = fill; for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, r * s, 0, TAU); ctx.fill(); }
}

function face(ctx, x, y, s, { mouth = 'smile', look = [0, 0] } = {}) {
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(x + sx * s * 0.32, y, s * 0.16, s * 0.2, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + sx * s * 0.32 + look[0] * s * 0.06, y + look[1] * s * 0.06, s * 0.09, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(x + sx * s * 0.32 + look[0] * s * 0.06 - s * 0.03, y + look[1] * s * 0.06 - s * 0.04, s * 0.03, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  if (mouth === 'o') { ctx.beginPath(); ctx.ellipse(x, y + s * 0.38, s * 0.1, s * 0.13, 0, 0, TAU); ctx.fillStyle = '#7f1d1d'; ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(x - s * 0.22, y + s * 0.3); ctx.quadraticCurveTo(x, y + s * 0.52, x + s * 0.22, y + s * 0.3); ctx.stroke(); }
}

function hardHat(ctx, head, r = 44) {
  const [hx, hy] = head;
  ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.45, r * 1.35, r * 0.28, 0, 0, TAU); ctx.fillStyle = '#eab308'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.55, r * 1.05, r * 0.95, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ca8a04'; ctx.fillRect(hx - r * 0.12, hy - r * 1.45, r * 0.24, r * 0.9);
}

function castle(ctx, x, y, s, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  const block = (bx, w, h) => {
    ctx.beginPath(); ctx.moveTo(bx - w / 2, 0); ctx.lineTo(bx - w / 2, -h);
    const n = 3, cw = w / (n * 2 - 1);
    for (let i = 0; i < n * 2 - 1; i++) { const x0 = bx - w / 2 + i * cw; if (i % 2 === 0) { ctx.lineTo(x0, -h - 26); ctx.lineTo(x0 + cw, -h - 26); ctx.lineTo(x0 + cw, -h); } else ctx.lineTo(x0 + cw, -h); }
    ctx.lineTo(bx + w / 2, 0); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, -h - 26, 0, [[0, '#fde68a'], [1, '#f59e0b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  };
  block(0, 420, 130);
  block(-160, 90, 210); block(160, 90, 210); block(0, 130, 270);
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-34, -60); ctx.arc(0, -60, 34, Math.PI, TAU); ctx.lineTo(34, 0); ctx.closePath(); ctx.fillStyle = '#92400e'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  for (const wx of [-160, 160]) { hq.roundRectPath(ctx, wx - 14, -170, 28, 40, 12); ctx.fillStyle = '#92400e'; ctx.fill(); ctx.stroke(); }
  // Bandera.
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -296); ctx.lineTo(0, -380); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -380); ctx.quadraticCurveTo(40, -370, 80, -362); ctx.lineTo(0, -340); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function crab(ctx, x, y, s, scared, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const jit = scared ? Math.sin(t * 30) * 3 : 0;
  ctx.translate(jit, 0);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx * 30, -20 + i * 8); ctx.lineTo(sx * (62 + i * 6), -4 + i * 6); ctx.lineTo(sx * (70 + i * 6), 6); ctx.stroke(); }
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx * 40, -40); ctx.lineTo(sx * 70, scared ? -100 : -70); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sx * 78, scared ? -112 : -82, 22, 16, sx * 0.5, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx * 15, -44); ctx.lineTo(sx * 20, -80); ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.arc(sx * 20, -86, scared ? 13 : 10, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx * 20, -86, 4, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(0, -28, 50, 30, 0, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-14, -42, 20, 7, -0.2, 0, TAU); ctx.fill();
  ctx.restore();
}

function quartz(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const [dx, h, w, rot, c] of [[-60, 170, 52, -0.35, '#fbcfe8'], [60, 150, 48, 0.4, '#e0e7ff'], [0, 230, 62, 0.02, '#f8fafc']]) {
    ctx.save(); ctx.translate(dx, 0); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h); ctx.lineTo(0, -h - w * 0.8); ctx.lineTo(w / 2, -h); ctx.lineTo(w / 2, 0); ctx.closePath();
    ctx.fillStyle = c; ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h - w * 0.8); ctx.moveTo(-w / 2, -h); ctx.lineTo(w / 2, -h); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-w * 0.35, -h * 0.85, w * 0.12, h * 0.6);
    ctx.restore();
  }
  ctx.restore();
}

function waterDrop(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.bezierCurveTo(x + s * 0.2, y - s * 0.6, x + s * 0.75, y - s * 0.05, x + s * 0.7, y + s * 0.35);
  ctx.bezierCurveTo(x + s * 0.65, y + s * 0.8, x - s * 0.65, y + s * 0.8, x - s * 0.7, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.75, y - s * 0.05, x - s * 0.2, y - s * 0.6, x, y - s); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, y - s, y + s, [[0, '#7dd3fc'], [1, '#0284c7']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - s * 0.35, y + s * 0.05, s * 0.1, s * 0.22, 0.3, 0, TAU); ctx.fill();
}

function sandPile(ctx, x, y, w, h, R) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.bezierCurveTo(x - w * 0.3, y - h * 0.2, x - w * 0.18, y - h, x, y - h); ctx.bezierCurveTo(x + w * 0.18, y - h, x + w * 0.3, y - h * 0.2, x + w / 2, y); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, y - h, y, [[0, '#fde68a'], [1, '#f59e0b']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  if (R) { ctx.fillStyle = 'rgba(146,64,14,0.45)'; for (let i = 0; i < 40; i++) { const u = R() - 0.5, v = R(); ctx.beginPath(); ctx.arc(x + u * w * 0.8 * (1 - v * 0.6), y - v * h * 0.85, 2.5, 0, TAU); ctx.fill(); } }
}

function kangaroo(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineWidth = 5; ctx.strokeStyle = INK; const fur = '#b45309';
  ctx.beginPath(); ctx.moveTo(30, -10); ctx.quadraticCurveTo(90, -5, 110, 20); ctx.lineWidth = 16; ctx.stroke(); ctx.strokeStyle = fur; ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(0, -40, 42, 55, -0.2, 0, TAU); ctx.fillStyle = fur; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-8, -30, 22, 34, -0.2, 0, TAU); ctx.fillStyle = '#fcd34d'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-20, -112, 26, 22, -0.3, 0, TAU); ctx.fillStyle = fur; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-48, -104, 16, 10, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
  for (const ex of [-12, 6]) { ctx.beginPath(); ctx.ellipse(ex, -150, 7, 22, 0.15, 0, TAU); ctx.fillStyle = fur; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(-28, -116, 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(-62, -106, 4, 0, TAU); ctx.fill();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Playa con castillo de arena: la arena se va por un hoyo (como en un reloj de arena) y quedan las rocas.
    const drain = ease((local - 0.8) / 2.3);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 800, [[0, '#38bdf8'], [1, '#e0f2fe']]); ctx.fillRect(0, 0, W, 800);
    sunDisc(ctx, 880, 520, 48, t);
    cloud(ctx, 190, 540, 110);
    ctx.fillStyle = hq.vgrad(ctx, 0, 780, 1020, [[0, '#0ea5e9'], [1, '#0369a1']]); ctx.fillRect(0, 780, W, 260);
    ctx.strokeStyle = 'rgba(224,242,254,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 782 + 7 * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 780); ctx.lineTo(W, 780); ctx.stroke();
    const rockTop = (x) => 990 + 22 * Math.sin(x * 0.021) + 12 * Math.sin(x * 0.07);
    ctx.beginPath(); ctx.moveTo(0, rockTop(0)); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, rockTop(x)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 960, H, [[0, '#94a3b8'], [1, '#334155']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = 'rgba(15,23,42,0.35)'; ctx.lineWidth = 4; for (let i = 0; i < 9; i++) { const x = 60 + i * 120; ctx.beginPath(); ctx.moveTo(x, rockTop(x) + 30); ctx.lineTo(x + 40, rockTop(x) + 90); ctx.stroke(); }
    // Arena (baja hacia un hoyo en el centro).
    const top = (x) => 880 + drain * 1100 + 220 * Math.sin(Math.PI * drain) * Math.exp(-(((x - 540) / 190) ** 2));
    ctx.beginPath(); ctx.moveTo(0, top(0)); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, top(x)); ctx.lineTo(W, H + 400); ctx.lineTo(0, H + 400); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 880, H, [[0, '#fde68a'], [0.5, '#fbbf24'], [1, '#d97706']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    const Rs = kit.rng(5); ctx.fillStyle = 'rgba(146,64,14,0.35)';
    for (let i = 0; i < 80; i++) { const x = Rs() * W, y = Rs() * 600; if (880 + y > top(x) + 6) { ctx.beginPath(); ctx.arc(x, 880 + y, 3, 0, TAU); ctx.fill(); } }
    // Castillo que se hunde y se deshace.
    castle(ctx, 540, top(540), 1.0, 1 - ease(drain * 2.2));
    // Granos que caen girando hacia el hoyo.
    if (drain > 0 && drain < 1) for (let i = 0; i < 46; i++) { const a = i * 2.4 + t * 5, d = ((i * 37 + t * 260) % 260) * (1 - drain * 0.3); ctx.fillStyle = i % 2 ? '#f59e0b' : '#fde68a'; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * d, top(540) - 20 + Math.sin(a) * d * 0.25, 6, 0, TAU); ctx.fill(); }
    // Cubeta y cangrejo: bajan con la arena hasta quedar sobre la roca.
    const by = Math.min(top(200), rockTop(200));
    ctx.save(); ctx.translate(200, by);
    ctx.beginPath(); ctx.moveTo(-55, -110); ctx.lineTo(55, -110); ctx.lineTo(42, 0); ctx.lineTo(-42, 0); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -110, 55, Math.PI, TAU); ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#fde047'; ctx.fillRect(-48, -78, 96, 16);
    ctx.restore();
    crab(ctx, 860, Math.min(top(860), rockTop(860)), 0.9, drain > 0.15, t);
  },

  obra(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Obra detenida: grúa, edificio a medias, camión revolvedor vacío y un albañil confundido.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, 1000, [[0, '#7dd3fc'], [1, '#f0f9ff']]); ctx.fillRect(0, 0, W, 1000);
      ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#a16207'], [1, '#451a03']]); ctx.fillRect(0, 1000, W, H);
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
      // Grúa.
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (const x of [150, 200]) { ctx.beginPath(); ctx.moveTo(x, 1000); ctx.lineTo(x, 480); ctx.stroke(); }
      for (let y = 1000; y > 500; y -= 60) { ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(200, y - 60); ctx.stroke(); }
      ctx.fillStyle = '#facc15'; ctx.fillRect(110, 462, 820, 26); ctx.strokeRect(110, 462, 820, 26);
      for (let x = 230; x < 920; x += 50) { ctx.beginPath(); ctx.moveTo(x, 462); ctx.lineTo(x + 25, 488); ctx.lineWidth = 4; ctx.stroke(); }
      hq.roundRectPath(ctx, 140, 490, 80, 60, 8); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      const sw = 0.12 * Math.sin(t * 1.6);
      ctx.save(); ctx.translate(720, 488); ctx.rotate(sw);
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 170); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-50, 170); ctx.lineTo(50, 170); ctx.lineTo(38, 240); ctx.lineTo(-38, 240); ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      ctx.restore();
      // Edificio a medias.
      ctx.fillStyle = '#cbd5e1'; ctx.lineWidth = 6;
      for (const y of [1000, 880, 760, 640]) { ctx.fillRect(420, y - 22, 440, 22); ctx.strokeRect(420, y - 22, 440, 22); }
      for (const x of [430, 570, 710, 850]) for (const [y0, y1] of [[978, 880], [858, 760], [738, 640]]) { ctx.fillRect(x - 10, y1, 20, y0 - y1); ctx.strokeRect(x - 10, y1, 20, y0 - y1); }
      ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 4; for (const x of [430, 570, 710, 850]) for (const dx of [-6, 6]) { ctx.beginPath(); ctx.moveTo(x + dx, 618); ctx.lineTo(x + dx, 560); ctx.stroke(); }
      // Camión revolvedor.
      ctx.save(); ctx.translate(850, 1090);
      hq.roundRectPath(ctx, -200, -70, 330, 50, 10); ctx.fillStyle = '#475569'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      hq.roundRectPath(ctx, 130, -150, 100, 130, 16); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(150, -132, 60, 46); ctx.strokeRect(150, -132, 60, 46);
      ctx.save(); ctx.translate(-40, -140); ctx.rotate(-0.15);
      ctx.beginPath(); ctx.ellipse(0, 0, 150, 78, 0, 0, TAU); ctx.fillStyle = '#e2e8f0'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 150, 78, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 16;
      for (let i = -3; i < 4; i++) { const x = i * 60 + ((t * 60) % 60); ctx.beginPath(); ctx.moveTo(x - 40, -80); ctx.lineTo(x + 40, 80); ctx.stroke(); }
      ctx.restore(); ctx.restore();
      for (const wx of [-140, 0, 180]) { ctx.beginPath(); ctx.arc(wx, -18, 32, 0, TAU); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.arc(wx, -18, 11, 0, TAU); ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.stroke(); }
      ctx.restore();
      const puzzled = local > c1 * 0.35;
      const r = hq.toon(ctx, 300, 1090, 370, {
        t, seed: 4, shirt: '#f97316', pants: '#1e3a8a', skin: '#c68642', armR: [0.5, -0.5], armL: [0.3, 0.2],
        eyes: puzzled ? 'wide' : 'open', mouth: puzzled ? 'o' : 'smile', brows: puzzled ? 1 : 0, look: [1, 0],
        hold: (c, h) => { const [hx, hy] = h.R; c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 12; c.beginPath(); c.moveTo(hx - 10, hy - 90); c.lineTo(hx + 30, hy + 120); c.stroke(); c.strokeStyle = '#a16207'; c.lineWidth = 6; c.stroke(); c.beginPath(); c.moveTo(hx + 14, hy + 118); c.lineTo(hx + 50, hy + 112); c.lineTo(hx + 58, hy + 170); c.lineTo(hx + 26, hy + 176); c.closePath(); c.fillStyle = '#94a3b8'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); },
      });
      hardHat(ctx, r.head, 44);
      hq.tag(ctx, 540, 410, 'ADIÓS A CONSTRUIR', { size: 46, fill: '#fde047' });
      return;
    }
    // Bloque de concreto por dentro: piedras y arena… y se deshace.
    const k = local - c1, crumble = ease((k - 1.2) / 1.1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#e2e8f0'], [1, '#94a3b8']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#64748b'; ctx.fillRect(0, 1010, W, H); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1010); ctx.lineTo(W, 1010); ctx.stroke();
    const x0 = 330, y0 = 580, S = 400, dx = 90, dy = -70, A = 1 - crumble;
    ctx.save(); ctx.globalAlpha = A;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + dx, y0 + dy); ctx.lineTo(x0 + S + dx, y0 + dy); ctx.lineTo(x0 + S, y0); ctx.closePath(); ctx.fillStyle = '#d1d5db'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + S, y0); ctx.lineTo(x0 + S + dx, y0 + dy); ctx.lineTo(x0 + S + dx, y0 + S + dy); ctx.lineTo(x0 + S, y0 + S); ctx.closePath(); ctx.fillStyle = '#6b7280'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(x0, y0, S, S); ctx.strokeRect(x0, y0, S, S);
    ctx.restore();
    // Piedras y granos (caen al deshacerse).
    const R = kit.rng(12), fall = (y, i) => y + crumble ** 2 * (1000 - y - (i % 7) * 6);
    for (let i = 0; i < 26; i++) {
      const px = x0 + 30 + R() * (S - 60), py = y0 + 30 + R() * (S - 60), rx = 16 + R() * 18, ry = rx * (0.6 + R() * 0.3), rot = R() * 3;
      ctx.beginPath(); ctx.ellipse(px + (px - 530) * crumble * 0.4, fall(py, i), rx, ry, rot, 0, TAU); ctx.fillStyle = ['#78716c', '#a8a29e', '#57534e'][i % 3]; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    }
    for (let i = 0; i < 220; i++) { const px = x0 + 8 + R() * (S - 16), py = y0 + 8 + R() * (S - 16); ctx.fillStyle = i % 3 ? '#f59e0b' : '#fde68a'; ctx.beginPath(); ctx.arc(px + (px - 530) * crumble * 0.6, fall(py, i), 4, 0, TAU); ctx.fill(); }
    if (crumble < 0.3) {
      ctx.save(); ctx.globalAlpha = 1 - crumble / 0.3;
      hq.tag(ctx, 200, 1060, 'ARENA', { size: 34, fill: '#fde68a' }); hq.tag(ctx, 860, 1060, 'PIEDRAS', { size: 34, fill: '#e7e5e4' });
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, 'CASI TODO ARENA Y PIEDRAS', { size: 42, fill: '#fde047' });
  },

  vidrio(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Ventana, vaso y celular desaparecen uno tras otro.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, 900, [[0, '#fef3c7'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, 900);
      ctx.fillStyle = hq.vgrad(ctx, 0, 900, H, [[0, '#b45309'], [1, '#78350f']]); ctx.fillRect(0, 900, W, H);
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 900); ctx.lineTo(W, 900); ctx.stroke();
      const gone = (at) => clamp((local - at) / 0.18);
      const puff = (x, y, at) => { const k = clamp((local - at) / 0.4); if (k <= 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 90 * k, y + Math.sin(a) * 90 * k, 22 * (1 - k * 0.5), 0, TAU); ctx.fill(); } ctx.restore(); };
      const dashed = (fn) => { ctx.save(); ctx.setLineDash([14, 12]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(15,23,42,0.45)'; fn(); ctx.stroke(); ctx.restore(); };
      // Ventana.
      const g1 = gone(0.35);
      if (g1 < 1) {
        ctx.save(); ctx.globalAlpha = 1 - g1;
        hq.roundRectPath(ctx, 360, 470, 360, 300, 14); ctx.fillStyle = hq.vgrad(ctx, 0, 470, 770, [[0, '#7dd3fc'], [1, '#e0f2fe']]); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#7c2d12'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(540, 470); ctx.lineTo(540, 770); ctx.moveTo(360, 620); ctx.lineTo(720, 620); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(390, 590); ctx.lineTo(450, 500); ctx.moveTo(570, 740); ctx.lineTo(630, 650); ctx.stroke();
        ctx.restore();
      } else dashed(() => hq.roundRectPath(ctx, 360, 470, 360, 300, 14));
      puff(540, 620, 0.35);
      // Vaso.
      const g2 = gone(0.8);
      const cup = () => { ctx.beginPath(); ctx.moveTo(300, 740); ctx.lineTo(420, 740); ctx.lineTo(405, 900); ctx.lineTo(315, 900); ctx.closePath(); };
      if (g2 < 1) { ctx.save(); ctx.globalAlpha = 1 - g2; cup(); ctx.fillStyle = 'rgba(186,230,253,0.7)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(56,189,248,0.7)'; ctx.fillRect(318, 820, 86, 74); ctx.restore(); } else dashed(cup);
      puff(360, 820, 0.8);
      // Celular en su soporte.
      const g3 = gone(1.25);
      const phone = () => hq.roundRectPath(ctx, 640, 690, 130, 210, 20);
      if (g3 < 1) { ctx.save(); ctx.globalAlpha = 1 - g3; phone(); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); hq.roundRectPath(ctx, 652, 704, 106, 182, 12); ctx.fillStyle = hq.vgrad(ctx, 0, 704, 886, [[0, '#818cf8'], [1, '#22d3ee']]); ctx.fill(); ctx.restore(); } else dashed(phone);
      puff(705, 795, 1.25);
      if (local > 1.4) hq.tag(ctx, 540, 410, 'SIN VIDRIO', { size: 48, fill: '#fca5a5' });
      return;
    }
    // Horno: arena → olla al rojo vivo → vidrio.
    const k = ease((local - c1) / 1.6);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#1c1917'], [1, '#431407']]); ctx.fillRect(0, 0, W, H);
    hq.glow(ctx, 540, 860, 420, 'rgba(249,115,22,A)', 0.55);
    ctx.fillStyle = '#292524'; ctx.fillRect(0, 980, W, H); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 980); ctx.lineTo(W, 980); ctx.stroke();
    sandPile(ctx, 190, 980, 230, 130 * (1 - 0.6 * clamp(k * 2)), kit.rng(3));
    // Granos que vuelan a la olla.
    if (k < 0.55) for (let i = 0; i < 12; i++) { const u = ((local * 1.4 + i / 12) % 1), x = 230 + u * 270, y = 880 - Math.sin(u * Math.PI) * 140; ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
    // Fuego y olla.
    for (let i = 0; i < 5; i++) { const x = 470 + i * 35, h = 60 + 20 * Math.sin(t * 9 + i * 2); ctx.beginPath(); ctx.moveTo(x - 20, 980); ctx.quadraticCurveTo(x - 18, 980 - h * 0.6, x, 980 - h); ctx.quadraticCurveTo(x + 18, 980 - h * 0.6, x + 20, 980); ctx.closePath(); ctx.fillStyle = i % 2 ? '#f97316' : '#facc15'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(440, 760); ctx.lineTo(640, 760); ctx.lineTo(610, 920); ctx.lineTo(470, 920); ctx.closePath(); ctx.fillStyle = '#57534e'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(540, 770, 92, 20, 0, 0, TAU); ctx.fillStyle = `rgb(${Math.round(250)},${Math.round(204 - 110 * k)},${Math.round(21 + 20 * k)})`; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    hq.glow(ctx, 540, 770, 120, 'rgba(253,186,116,A)', 0.4 + 0.5 * k);
    // Vidrio que aparece.
    const g = ease((k - 0.5) / 0.5);
    if (g > 0) {
      ctx.save(); ctx.translate(860, 820); ctx.scale(g, g);
      hq.roundRectPath(ctx, -110, -150, 220, 300, 18); ctx.fillStyle = 'rgba(186,230,253,0.55)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#e0f2fe'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-70, 40); ctx.lineTo(10, -100); ctx.moveTo(-10, 110); ctx.lineTo(60, -10); ctx.stroke();
      ctx.restore();
      hq.glow(ctx, 860, 820, 200, 'rgba(186,230,253,A)', 0.25 * g);
    }
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (const [a, b] of [[315, 420], [660, 730]]) { ctx.beginPath(); ctx.moveTo(a, 700); ctx.lineTo(b, 700); ctx.moveTo(b - 18, 686); ctx.lineTo(b, 700); ctx.lineTo(b - 18, 714); ctx.stroke(); }
    hq.tag(ctx, 540, 410, 'EL VIDRIO ES ARENA DERRETIDA', { size: 38, fill: '#fde68a' });
  },

  chip(ctx, o) {
    const { W, H, local, t } = o;
    // Se abre un celular: el chip brilla… y sale de la misma piedra que forma la arena.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#0f172a'], [1, '#1e3a8a']]); ctx.fillRect(0, 0, W, H);
    hq.bokeh(ctx, W, 400, 1300, t, { n: 16, seed: 6, color: 'rgba(96,165,250,A)', r: [20, 60], a: 0.18 });
    const open = ease((local - 0.3) / 0.9), glowK = ease((local - 1.0) / 0.6), link = ease((local - 1.7) / 0.7);
    const px = 190, py = 470, pw = 340, ph = 600;
    // Placa.
    hq.roundRectPath(ctx, px, py, pw, ph, 44); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, px + 22, py + 22, pw - 44, ph - 44, 30); ctx.fillStyle = '#166534'; ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) { const y = py + 70 + i * 55; ctx.beginPath(); ctx.moveTo(px + 40, y); ctx.lineTo(px + 120, y); ctx.lineTo(px + 150, y + 25); ctx.lineTo(px + 300, y + 25); ctx.stroke(); }
    const cx = px + pw / 2, cy = py + ph / 2;
    hq.glow(ctx, cx, cy, 200, 'rgba(96,165,250,A)', 0.7 * glowK);
    ctx.fillStyle = '#9ca3af'; for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { ctx.fillRect(cx - 50 + i * 20, cy + s * 68 - 8, 8, 16); ctx.fillRect(cx + s * 68 - 8, cy - 50 + i * 20, 16, 8); }
    hq.roundRectPath(ctx, cx - 62, cy - 62, 124, 124, 12); ctx.fillStyle = '#111827'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.roundRectPath(ctx, cx - 40, cy - 40, 80, 80, 8); ctx.fillStyle = `rgba(147,197,253,${0.25 + 0.6 * glowK})`; ctx.fill();
    // Tapa que se desliza.
    if (open < 1) { ctx.save(); ctx.globalAlpha = 1 - open; ctx.translate(-260 * open, 0); hq.roundRectPath(ctx, px, py, pw, ph, 44); ctx.fillStyle = hq.vgrad(ctx, 0, py, py + ph, [[0, '#a78bfa'], [1, '#6d28d9']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); hq.roundRectPath(ctx, px + 30, py + 30, 110, 150, 30); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.stroke(); ctx.restore(); }
    // Piedra de cuarzo y arena.
    if (link > 0) {
      ctx.save(); ctx.globalAlpha = link;
      sandPile(ctx, 820, 1000, 320, 90, kit.rng(8));
      quartz(ctx, 820, 930, 0.95 * (0.7 + 0.3 * link));
      ctx.setLineDash([16, 12]); ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + 80, cy); ctx.quadraticCurveTo(650, cy - 120, 720, 700); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, link > 0.3 ? 'LA MISMA PIEDRA DE LA ARENA' : 'EL CEREBRO DE TU CELULAR', { size: 38, fill: '#93c5fd' });
  },

  podio(ctx, o) {
    const { W, H, local, t } = o;
    // Podio: 1.º el agua, 2.º la arena.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#312e81'], [1, '#1e1b4b']]); ctx.fillRect(0, 0, W, H);
    hq.glow(ctx, 400, 700, 380, 'rgba(253,224,71,A)', 0.25); hq.glow(ctx, 680, 800, 320, 'rgba(226,232,240,A)', 0.2);
    const Rc = kit.rng(14);
    for (let i = 0; i < 40; i++) { const x = Rc() * W, y = ((Rc() * 900 + t * (120 + Rc() * 80)) % 900) + 380, c = ['#f472b6', '#facc15', '#34d399', '#60a5fa'][i % 4]; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + i); ctx.fillStyle = c; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); }
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 1060, W, H);
    const block = (x, top, w, fill, num) => { ctx.fillStyle = hq.vgrad(ctx, 0, top, 1060, [[0, fill], [1, hq.shade(fill, -0.3)]]); ctx.fillRect(x, top, w, 1060 - top); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeRect(x, top, w, 1060 - top); ctx.font = '900 110px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(15,23,42,0.6)'; ctx.fillText(num, x + w / 2, top + 100); };
    block(250, 790, 290, '#facc15', '1'); block(540, 890, 290, '#cbd5e1', '2');
    const a = pop((local - 0.15) / 0.5), b = pop((local - 0.6) / 0.5);
    if (a > 0) { ctx.save(); ctx.translate(395, 790); ctx.scale(a, a); waterDrop(ctx, 0, -150, 130); face(ctx, 0, -120, 80, {}); ctx.restore(); }
    if (b > 0) {
      ctx.save(); ctx.translate(685, 890); ctx.scale(b, b);
      sandPile(ctx, 0, 0, 280, 160, kit.rng(2)); face(ctx, 0, -70, 70, {});
      ctx.lineWidth = 6; ctx.strokeStyle = '#2563eb'; ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(0, -10); ctx.lineTo(40, -40); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 2, 20, 0, TAU); ctx.fillStyle = '#e2e8f0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    hq.tag(ctx, 540, 410, 'LO MÁS USADO DESPUÉS DEL AGUA', { size: 38, fill: '#fde047' });
  },

  desierto(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dunas: el albañil llena una cubeta… no sirve. Lupa: granos redondos como canicas que ruedan y no se agarran.
    const c1 = cue(1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 900, [[0, '#fb923c'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, 900);
    sunDisc(ctx, 860, 520, 56, t);
    const dune = (y0, amp, ph, c1c, c2c) => { ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, y0); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y0 - amp * Math.sin(x * 0.006 + ph)); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, y0 - amp, H, [[0, c1c], [1, c2c]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); };
    dune(820, 80, 0.5, '#fdba74', '#ea580c'); dune(920, 70, 2.2, '#fcd34d', '#f59e0b'); dune(1040, 50, 4.0, '#fde68a', '#fbbf24');
    if (local < c1) {
      const no = local > c1 * 0.5;
      const r = hq.toon(ctx, 400, 1100, 380, {
        t, seed: 4, shirt: '#f97316', pants: '#1e3a8a', skin: '#c68642', armR: [1.1, -0.9], armL: [0.3, 0.2], eyes: no ? 'wide' : 'happy', mouth: no ? 'o' : 'smile', brows: no ? 1 : 0, look: [1, 0.2],
        hold: (c, h) => { const [hx, hy] = h.R; c.beginPath(); c.moveTo(hx - 50, hy - 20); c.lineTo(hx + 50, hy - 20); c.lineTo(hx + 40, hy + 80); c.lineTo(hx - 40, hy + 80); c.closePath(); c.fillStyle = '#3b82f6'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(hx, hy - 22, 50, 16, 0, Math.PI, TAU); c.fillStyle = SAND; c.fill(); c.stroke(); },
      });
      hardHat(ctx, r.head, 46);
      if (no) { const k = pop((local - c1 * 0.5) / 0.4); ctx.save(); ctx.translate(760, 760); ctx.scale(k, k); ctx.rotate(-0.15); ctx.lineWidth = 12; ctx.strokeStyle = '#dc2626'; hq.roundRectPath(ctx, -170, -60, 340, 120, 18); ctx.stroke(); ctx.font = '900 70px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#dc2626'; ctx.fillText('NO SIRVE', 0, 4); ctx.restore(); }
      hq.tag(ctx, 540, 410, '¿Y LA ARENA DEL DESIERTO?', { size: 40, fill: '#fde68a' });
      return;
    }
    // Lupa con granos redondos.
    const k = ease((local - c1) / 0.5), cx = 520, cy = 730, R = 250 * k;
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(cx + R * 0.72, cy + R * 0.72); ctx.lineTo(cx + R * 1.25, cy + R * 1.25); ctx.stroke(); ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 26; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    const Rg = kit.rng(31);
    for (let i = 0; i < 30; i++) {
      const gx = cx - 230 + (i % 6) * 92 + (Math.floor(i / 6) % 2) * 46, gy0 = cy - 200 + Math.floor(i / 6) * 92, r = 38 + Rg() * 8;
      const roll = ease((local - c1 - 1.0 - Rg() * 0.5) / 1.2), gx2 = gx + roll * (Rg() - 0.3) * 260, gy = gy0 + roll * roll * 300;
      const col = ['#f59e0b', '#fbbf24', '#ea580c', '#fcd34d'][i % 4];
      ctx.beginPath(); ctx.arc(gx2, gy, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(gx2, gy, r, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(gx2 + r * 0.6, gy + r * 0.4, r * 0.9, Math.PI, Math.PI * 1.5); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(gx2 - r * 0.35, gy - r * 0.4, r * 0.22, r * 0.12, -0.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#d6d3d1'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx - R * 0.45, cy - R * 0.5, R * 0.3, R * 0.12, -0.7, 0, TAU); ctx.fill();
    hq.tag(ctx, 540, 410, 'GRANOS REDONDOS: NO SE AGARRAN', { size: 36, fill: '#fde68a' });
  },

  dubai(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Dubái en el desierto, con el edificio más alto del mundo; llega un barco con arena… de Australia (y un canguro).
    const c1 = cue(1);
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, 900, [[0, '#7dd3fc'], [1, '#fef3c7']]); ctx.fillRect(0, 0, W, 900);
    sunDisc(ctx, 900, 540, 46, t);
    ctx.beginPath(); ctx.moveTo(0, 900); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 840 - 50 * Math.sin(x * 0.005 + 1)); ctx.lineTo(W, 900); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 780, 900, [[0, '#fdba74'], [1, '#f59e0b']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    const R = (i) => Math.sin(i * 61.3) * 0.5 + 0.5;
    for (let i = 0; i < 7; i++) kit.building(ctx, 400 + i * 105, 905, 90, 140 + R(i) * 220, { color: hq.shade('#94a3b8', -0.15 + R(i + 2) * 0.35), lw: 5 });
    // El edificio más alto del mundo.
    const hl = ease((local - c1) / 0.5);
    if (hl > 0) hq.glow(ctx, 230, 680, 300, 'rgba(253,224,71,A)', 0.45 * hl);
    const segs = [[200, 90], [170, 80], [140, 75], [110, 70], [80, 60], [52, 50]];
    let y = 905;
    for (const [w, h] of segs) { ctx.beginPath(); ctx.moveTo(230 - w / 2, y); ctx.lineTo(230 - w / 2 + 6, y - h); ctx.lineTo(230 + w / 2 - 6, y - h); ctx.lineTo(230 + w / 2, y); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, y - h, y, [[0, '#e2e8f0'], [1, '#94a3b8']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = 'rgba(30,58,138,0.35)'; ctx.lineWidth = 3; for (let x = -w / 2 + 16; x < w / 2 - 10; x += 16) { ctx.beginPath(); ctx.moveTo(230 + x, y - 4); ctx.lineTo(230 + x, y - h + 4); ctx.stroke(); } y -= h; }
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(230, y); ctx.lineTo(230, 470); ctx.stroke();
    if (hl > 0) for (let i = 0; i < 6; i++) { const a = t * 2 + i, sx = 230 + Math.cos(a) * 120, sy = 620 + Math.sin(a * 1.3) * 200; ctx.save(); ctx.translate(sx, sy); ctx.rotate(t); ctx.fillStyle = '#fde047'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? 6 : 18; ctx.lineTo(Math.cos((k / 8) * TAU) * rr * hl, Math.sin((k / 8) * TAU) * rr * hl); } ctx.closePath(); ctx.fill(); ctx.restore(); }
    // Mar.
    ctx.fillStyle = hq.vgrad(ctx, 0, 905, H, [[0, '#2dd4bf'], [1, '#0f766e']]); ctx.fillRect(0, 905, W, H);
    ctx.strokeStyle = 'rgba(240,253,250,0.85)'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 907 + 6 * Math.sin(x * 0.03 + t * 3)); ctx.stroke();
    // Barco con arena (llega desde la derecha).
    const sx = 1450 - 720 * ease(local / Math.max(1, c1 * 0.85)), bob = 4 * Math.sin(t * 2);
    ctx.save(); ctx.translate(sx, 1010 + bob); ctx.scale(1.25, 1.25);
    sandPile(ctx, -40, -40, 300, 120, kit.rng(17));
    kangaroo(ctx, -50, -150, 0.75);
    ctx.beginPath(); ctx.moveTo(-230, -40); ctx.lineTo(230, -40); ctx.lineTo(195, 40); ctx.lineTo(-200, 40); ctx.closePath(); ctx.fillStyle = '#1e3a8a'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#dc2626'; ctx.fillRect(-210, 18, 418, 16);
    hq.roundRectPath(ctx, 130, -130, 90, 92, 8); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#93c5fd'; for (const wx of [145, 180]) ctx.fillRect(wx, -112, 22, 18);
    ctx.restore();
    if (local > c1 * 0.5) hq.tag(ctx, sx - 60, 650, 'ARENA DE AUSTRALIA', { size: 30, fill: '#fde68a' });
    hq.tag(ctx, 540, 410, local < c1 ? 'DUBÁI, EN PLENO DESIERTO' : '¡EL EDIFICIO MÁS ALTO DEL MUNDO!', { size: local < c1 ? 42 : 36, fill: '#fde047' });
  },
};
