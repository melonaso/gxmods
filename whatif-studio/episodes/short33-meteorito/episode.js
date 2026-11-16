// Short 33: ¿y si te cayera un meteorito?
// Pregunta al inicio (¿sobrevivirías?) y respuesta casi al final. Cada escena: lo que pasa + por qué.
// Entra más de 10 veces más rápido que una bala → el aire de enfrente se aprieta y se calienta (brilla) →
// casi todo se quema → el aire lo frena (cae como un auto de carreras) → llega frío por dentro →
// 1954: Ann Hodges dormía en su sillón; la piedra atravesó el techo, rebotó en el radio y le dejó un moretón →
// sorpresa: la dueña de la casa la demandó para quedarse con la piedra.

let stars;
export function setup(C) { stars = C.kit.makeStars(160, C.W, C.H, 21); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const TAU = Math.PI * 2;
const FLOOR = 1090;

function label(ctx, kit, x, y, text, { size = 44, fill = '#ffffff', bg = 'rgba(15,23,42,0.8)' } = {}) {
  ctx.font = `900 ${size}px ${kit.FONT}`;
  const w = ctx.measureText(text).width + 40, h = size * 1.5;
  kit.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  kit.text(ctx, text, x, y + 2, { size, fill, stroke: null });
}

/** Piedra irregular con cráteres, centrada en (x, y), radio r. */
function rock(ctx, kit, x, y, r, { seed = 3, color = '#57534e', rot = 0, frost = 0, hot = 0 } = {}) {
  const R = kit.rng(seed), n = 11;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (0.78 + R() * 0.3); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); kit.shape(ctx, color, Math.max(3, r * 0.08));
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * r, (R() - 0.5) * r, r * (0.12 + R() * 0.12), 0, TAU); ctx.fill(); }
  if (hot > 0) { ctx.fillStyle = `rgba(249,115,22,${0.7 * hot})`; ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4); }
  if (frost > 0) {
    ctx.fillStyle = `rgba(191,219,254,${0.55 * frost})`; ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    ctx.fillStyle = `rgba(255,255,255,${0.95 * frost})`;
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * r * 1.8, (R() - 0.5) * r * 1.8, 2 + R() * r * 0.06, 0, TAU); ctx.fill(); }
  }
  ctx.restore(); ctx.restore();
}

/** Bola de fuego: piedra con resplandor y estela en dirección contraria a su movimiento (ang). */
function fireball(ctx, kit, x, y, r, ang, { glow = 1, trail = 1, seed = 3, t = 0 } = {}) {
  const dx = -Math.cos(ang), dy = -Math.sin(ang);
  if (trail > 0) {
    ctx.save(); ctx.globalAlpha = 0.9 * trail; ctx.lineCap = 'round';
    for (const [w, c, len] of [[r * 2.2, 'rgba(249,115,22,0.35)', 7], [r * 1.4, 'rgba(250,204,21,0.6)', 5], [r * 0.7, 'rgba(255,255,255,0.8)', 3]]) {
      const g = ctx.createLinearGradient(x, y, x + dx * r * len * 2, y + dy * r * len * 2);
      g.addColorStop(0, c); g.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * r * len * 2, y + dy * r * len * 2); ctx.stroke();
    }
    ctx.restore();
  }
  if (glow > 0) {
    const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.4);
    g.addColorStop(0, `rgba(255,251,235,${0.95 * glow})`); g.addColorStop(0.4, `rgba(250,204,21,${0.7 * glow})`); g.addColorStop(1, 'rgba(249,115,22,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
  }
  rock(ctx, kit, x, y, r, { seed, rot: t * 2, hot: glow });
}

function nightSky(ctx, o, top = '#0b1026', bottom = '#312e81') {
  const { W, H, kit, t } = o;
  kit.gradientBG(ctx, W, H, top, bottom);
  kit.drawStars(ctx, stars, 0.9, t);
}

/** Mujer acostada en el sillón (cabeza a la izquierda). awake: ojos abiertos. bruise: 0..1. */
function sleeper(ctx, kit, x, y, h, { awake = false, bruise = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
  kit.person(ctx, 0, 0, h, { shirt: '#db2777', pants: '#9d174d', arms: 0.02 });
  const hd = h * 0.24, top = -h;
  ctx.fillStyle = '#7c2d12'; kit.roundRect(ctx, -hd * 0.62, top - hd * 0.12, hd * 1.24, hd * 0.42, hd * 0.18); ctx.fill();
  if (!awake) {
    ctx.fillStyle = '#e8b48a'; ctx.fillRect(-hd * 0.32, top + hd * 0.36, hd * 0.64, hd * 0.3);
    ctx.strokeStyle = kit.INK; ctx.lineWidth = 4;
    for (const ex of [-0.18, 0.18]) { ctx.beginPath(); ctx.moveTo(ex * hd - hd * 0.08, top + hd * 0.5); ctx.lineTo(ex * hd + hd * 0.08, top + hd * 0.5); ctx.stroke(); }
  }
  if (bruise > 0) { ctx.fillStyle = `rgba(109,40,217,${0.9 * bruise})`; ctx.beginPath(); ctx.ellipse(h * 0.07, -h * 0.44, h * 0.07, h * 0.05, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function zzz(ctx, kit, x, y, t) {
  for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - u; kit.text(ctx, 'Z', x + i * 36 + u * 30, y - u * 110, { size: 38 + i * 12, fill: '#e0e7ff' }); ctx.restore(); }
}

/** Radio de mueble (consola de madera) con la base en (x, y). */
function radio(ctx, kit, x, y, w, shake = 0) {
  ctx.save(); ctx.translate(x + shake, y);
  kit.roundRect(ctx, -w / 2, -w * 0.85, w, w * 0.85, 14); kit.shape(ctx, '#92400e', 6);
  kit.roundRect(ctx, -w * 0.4, -w * 0.72, w * 0.8, w * 0.35, 10); kit.shape(ctx, '#fde68a', 5);
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.4 + i * w * 0.133, -w * 0.72); ctx.lineTo(-w * 0.4 + i * w * 0.133, -w * 0.37); ctx.stroke(); }
  for (const dx of [-0.2, 0.2]) { ctx.beginPath(); ctx.arc(dx * w, -w * 0.22, w * 0.07, 0, TAU); kit.shape(ctx, '#451a03', 4); }
  ctx.restore();
}

function couch(ctx, kit, x0, x1, y) {
  kit.roundRect(ctx, x0, y - 230, x1 - x0, 130, 30); kit.shape(ctx, '#15803d', 6);
  kit.roundRect(ctx, x0, y - 120, x1 - x0, 110, 20); kit.shape(ctx, '#16a34a', 6);
  for (const x of [x0 - 30, x1 - 30]) { kit.roundRect(ctx, x, y - 170, 60, 160, 24); kit.shape(ctx, '#15803d', 6); }
  ctx.fillStyle = '#3f2a1d'; ctx.fillRect(x0 + 20, y - 10, 24, 10); ctx.fillRect(x1 - 44, y - 10, 24, 10);
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, t } = o;
    // De noche, en el patio: una bola de fuego cruza el cielo directo hacia ti.
    nightSky(ctx, o);
    ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.ellipse(W / 2, FLOOR + 80, 820, 160, 0, 0, TAU); ctx.fill(); ctx.fillRect(0, FLOOR + 60, W, 900);
    kit.house(ctx, 820, FLOOR + 10, 300, 260, { lit: 1 });
    const u = kit.ramp(local, 0, 3.8), ang = Math.atan2(470, -520);
    fireball(ctx, kit, 980 - 520 * u, 420 + 470 * u, 40 + 30 * u, ang, { t, glow: 1 });
    kit.person(ctx, 330, FLOOR + 20, 300, { shirt: '#2563eb', arms: 0.6 + 0.1 * Math.sin(t * 6) });
    kit.text(ctx, '!', 400, FLOOR - 330, { size: 90, fill: '#fde047' });
  },

  entra(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // Desde el espacio: la piedra llega a la atmósfera; el aire de enfrente se aprieta y brilla.
    kit.gradientBG(ctx, W, H, '#000000', '#0b1026');
    kit.drawStars(ctx, stars, 1, t);
    ctx.save(); ctx.beginPath(); ctx.arc(540, 2650, 1750, 0, TAU); ctx.fillStyle = '#1d4ed8'; ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.6)'; ctx.lineWidth = 60; ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.ellipse(380, 1010, 260, 70, -0.1, 0, TAU); ctx.fill();
    const u = kit.ramp(local, 0, o.s.dur), ang = 0.62;
    const x = 130 + 520 * u, y = 580 + 330 * u;
    const heat = kit.ramp(local, cue(1) - 0.4, cue(1) + 0.8);
    kit.speedLines(ctx, W, 380, 1100, t, { n: 16, speed: 3000, color: 'rgba(255,255,255,0.35)' });
    // Aire apretado delante de la piedra (arco brillante).
    if (heat > 0) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${i ? '250,204,21' : '255,255,255'},${heat * (0.9 - i * 0.25)})`; ctx.lineWidth = 16 - i * 4; ctx.beginPath(); ctx.arc(-30 - i * 22, 0, 120 + i * 24, -0.9, 0.9); ctx.stroke(); }
      ctx.restore();
    }
    fireball(ctx, kit, x, y, 70, ang, { t, glow: heat, trail: 0.2 + 0.8 * heat });
    label(ctx, kit, 600, 420, local < cue(1) ? 'MÁS RÁPIDO QUE UNA BALA' : 'AIRE APRETADO: ¡CALOR!', { size: 46, fill: local < cue(1) ? '#e0e7ff' : '#fde047' });
  },

  quema(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En lo alto del cielo: la bola de fuego se va gastando; se desprenden pedazos encendidos.
    kit.gradientBG(ctx, W, H, '#1e1b4b', '#7c3aed');
    kit.drawStars(ctx, stars, 0.5, t);
    const u = kit.ramp(local, 0, o.s.dur - 0.3), r = 150 - 115 * u, ang = Math.PI / 2 + 0.35;
    const x = 600 - 60 * u, y = 640 + 60 * u;
    const R = kit.rng(8);
    for (let i = 0; i < 26; i++) {
      const ph = (t * 1.6 + R()) % 1, a = -Math.PI / 2 - 0.35 + (R() - 0.5) * 1.2, d = r + ph * 420;
      ctx.globalAlpha = 1 - ph; ctx.fillStyle = R() > 0.5 ? '#fde047' : '#f97316';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 6 + R() * 10 * (1 - ph), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    fireball(ctx, kit, x, y, r, ang, { t, glow: 1, trail: 1 });
    if (local > cue(1)) label(ctx, kit, 540, 1040, 'SOLO LLEGA UN PEDACITO', { size: 46, fill: '#fde047' });
    else label(ctx, kit, 540, 420, 'SE QUEMA Y SE GASTA', { size: 46, fill: '#fdba74' });
  },

  frena(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // De día, entre nubes: ya no brilla; el aire lo frena. Abajo, un auto de carreras va a la misma velocidad.
    kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');
    const R = kit.rng(5);
    for (let i = 0; i < 6; i++) { const x = R() * W, y = 1200 - ((R() * 900 + t * 380) % 900); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, 60, 0, TAU); ctx.arc(x + 60, y - 20, 70, 0, TAU); ctx.arc(x + 120, y, 55, 0, TAU); ctx.fill(); }
    const cool = kit.ramp(local, 0, 1.0);
    ctx.strokeStyle = 'rgba(100,116,139,0.45)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(540, 650); ctx.lineTo(540, 380); ctx.stroke();
    fireball(ctx, kit, 540, 680 + 8 * Math.sin(t * 9), 46, Math.PI / 2, { t, glow: 1 - cool, trail: 0 });
    // Flechitas del aire que empuja hacia arriba.
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8;
    for (const dx of [-90, 0, 90]) { const yy = 820 + 12 * Math.sin(t * 6 + dx); ctx.beginPath(); ctx.moveTo(540 + dx, yy + 60); ctx.lineTo(540 + dx, yy); ctx.lineTo(540 + dx - 16, yy + 18); ctx.moveTo(540 + dx, yy); ctx.lineTo(540 + dx + 16, yy + 18); ctx.stroke(); }
    if (local > cue(1)) {
      const cx = ((local - cue(1)) * 700) % (W + 400) - 200;
      ctx.fillStyle = '#64748b'; ctx.fillRect(0, 1010, W, 60);
      kit.speedLines(ctx, W, 960, 1010, t, { n: 8, speed: 2400, color: 'rgba(15,23,42,0.4)' });
      kit.car(ctx, cx, 1010, 260, { color: '#ef4444' });
      label(ctx, kit, 540, 450, 'COMO UN AUTO DE CARRERAS', { size: 44, fill: '#fde047' });
    } else label(ctx, kit, 540, 450, 'EL AIRE LO FRENA', { size: 46, fill: '#bbf7d0' });
  },

  frio(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En el pasto, ya en el suelo: la costra se enfría en segundos y por dentro está helado.
    kit.gradientBG(ctx, W, H, '#bae6fd', '#f0f9ff');
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 900, W, H - 900);
    ctx.fillStyle = '#365314'; ctx.beginPath(); ctx.ellipse(560, 960, 220, 50, 0, 0, TAU); ctx.fill();
    const cold = kit.ramp(local, 0.4, cue(1) + 0.3);
    if (cold < 1) { ctx.save(); ctx.globalAlpha = 1 - cold; ctx.strokeStyle = 'rgba(148,163,184,0.7)'; ctx.lineWidth = 10; for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; ctx.beginPath(); ctx.moveTo(520 + i * 40, 880 - u * 200); ctx.quadraticCurveTo(500 + i * 40, 840 - u * 200, 530 + i * 40, 800 - u * 200); ctx.stroke(); } ctx.restore(); }
    rock(ctx, kit, 560, 900, 90, { seed: 7, hot: (1 - cold) * 0.8, frost: cold });
    kit.person(ctx, 250, FLOOR, 360, { shirt: '#f97316', arms: 0.35 });
    // Termómetro.
    const lvl = 0.75 - 0.6 * cold;
    kit.roundRect(ctx, 850, 470, 60, 330, 30); kit.shape(ctx, '#ffffff', 6);
    ctx.fillStyle = cold > 0.5 ? '#3b82f6' : '#ef4444'; ctx.fillRect(865, 800 - 300 * lvl, 30, 300 * lvl + 10);
    ctx.beginPath(); ctx.arc(880, 830, 50, 0, TAU); kit.shape(ctx, cold > 0.5 ? '#3b82f6' : '#ef4444', 6);
    if (local > cue(1)) label(ctx, kit, 560, 1040, 'POR DENTRO: HELADO', { size: 46, fill: '#bfdbfe' });
    else label(ctx, kit, 560, 430, 'SE ENFRÍA EN SEGUNDOS', { size: 44, fill: '#fde68a' });
  },

  hodges(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // 1954, sala de una casa en Alabama: la piedra rompe el techo, rebota en el radio y le pega en la cadera.
    const T1 = cue(1) + 0.8, T2 = Math.min(cue(1) + 1.9, cue(2) - 0.4), T3 = cue(2);
    kit.gradientBG(ctx, W, H, '#fef3c7', '#fde68a');
    ctx.fillStyle = 'rgba(217,119,6,0.18)'; for (let x = 0; x < W; x += 70) ctx.fillRect(x, 470, 30, FLOOR - 470);
    ctx.fillStyle = '#e7e5e4'; ctx.fillRect(0, 380, W, 90); ctx.strokeStyle = kit.INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 470); ctx.lineTo(W, 470); ctx.stroke();
    ctx.fillStyle = '#a16207'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    const hx = 760;
    if (local > T1) {
      ctx.fillStyle = '#1e1b4b'; ctx.beginPath();
      const R = kit.rng(3); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = 55 + R() * 25; i ? ctx.lineTo(hx + Math.cos(a) * rr, 425 + Math.sin(a) * rr * 0.6) : ctx.moveTo(hx + Math.cos(a) * rr, 425 + Math.sin(a) * rr * 0.6); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d6d3d1'; const d = kit.clamp((local - T1) / 0.8);
      for (let i = 0; i < 8; i++) { ctx.globalAlpha = 1 - d; ctx.fillRect(hx - 60 + R() * 120, 470 + d * (300 + R() * 300), 14, 10); }
      ctx.globalAlpha = 1;
    }
    couch(ctx, kit, 140, 640, FLOOR);
    const hitR = local > T2 ? 1 - kit.clamp((local - T2) / 0.4) : 0;
    radio(ctx, kit, 880, FLOOR, 230, 8 * hitR * Math.sin(t * 60));
    const woke = local > T3;
    sleeper(ctx, kit, 600, 905, 420, { awake: woke, bruise: woke ? kit.clamp((local - T3) * 3) : 0 });
    if (!woke) zzz(ctx, kit, 220, 760, t);
    // Trayectoria de la piedra: techo → radio → cadera → piso.
    let rx = null, ry = null;
    if (local > T1 && local <= T2) { const u = (local - T1) / (T2 - T1); rx = hx + (870 - hx) * u; ry = 440 + (FLOOR - 200 - 440) * u * u; }
    else if (local > T2 && local <= T3) { const u = (local - T2) / (T3 - T2); rx = 870 + (440 - 870) * u; ry = FLOOR - 200 - 160 * Math.sin(u * Math.PI) + (870 - (FLOOR - 200)) * u; }
    else if (local > T3) { const u = kit.clamp((local - T3) / 0.5); rx = 440 + 60 * u; ry = 870 + (FLOOR - 30 - 870) * u * u; }
    if (rx !== null) rock(ctx, kit, rx, ry, 34, { seed: 11, rot: local * 4 });
    label(ctx, kit, 260, 540, '1954 · ALABAMA', { size: 40, fill: '#ffffff' });
    if (woke) { kit.text(ctx, '¡AY!', 300, 700, { size: 70, fill: '#ef4444' }); label(ctx, kit, 600, 1040, 'SOLO UN MORETÓN', { size: 48, fill: '#c4b5fd' }); }
  },

  demanda(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    // En el juzgado: la inquilina y la dueña de la casa jalan la piedra cada una para su lado.
    kit.gradientBG(ctx, W, H, '#78350f', '#451a03');
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = 0; x < W; x += 120) ctx.fillRect(x, 380, 8, 700);
    kit.roundRect(ctx, 290, 520, 500, 220, 16); kit.shape(ctx, '#92400e', 6);
    kit.person(ctx, 540, 600, 220, { shirt: '#0f172a', pants: '#0f172a' });
    kit.roundRect(ctx, 290, 600, 500, 160, 12); kit.shape(ctx, '#b45309', 6);
    // Mazo del juez.
    const bang = kit.impulse(local, 0.3, 0.35);
    ctx.save(); ctx.translate(680, 590); ctx.rotate(-0.9 + 0.9 * (bang > 0 ? 1 - bang : 1) * (local < 0.3 ? 0 : 1));
    kit.roundRect(ctx, -6, -90, 12, 90, 4); kit.shape(ctx, '#78350f', 4); kit.roundRect(ctx, -30, -110, 60, 32, 8); kit.shape(ctx, '#78350f', 4);
    ctx.restore();
    const pull = 40 * Math.sin(t * 3.2);
    kit.person(ctx, 250 + pull * 0.4, FLOOR, 360, { shirt: '#db2777', pants: '#9d174d', arms: 0.32 });
    kit.person(ctx, 830 + pull * 0.4, FLOOR, 360, { shirt: '#7c3aed', pants: '#4c1d95', arms: 0.32 });
    rock(ctx, kit, 540 + pull, 880, 60, { seed: 11, rot: pull * 0.01 });
    ctx.strokeStyle = '#e8b48a'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(330 + pull * 0.4, 860); ctx.lineTo(480 + pull, 880); ctx.moveTo(750 + pull * 0.4, 860); ctx.lineTo(600 + pull, 880); ctx.stroke();
    label(ctx, kit, 250, 1050, 'INQUILINA', { size: 38, fill: '#f9a8d4' });
    label(ctx, kit, 830, 1050, 'DUEÑA', { size: 38, fill: '#c4b5fd' });
    if (local > cue(1)) kit.text(ctx, '¡ES MÍA!', 830, 640, { size: 64, fill: '#fde047' });
    void H;
  },
};
