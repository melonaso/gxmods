// Short 52: ¿y si el Sol fuera mil veces más grande?  (calidad alta: engine2d/hq.js + props.js)
// Segundo gemelo del Short 46 (Sol doble). Gancho: ¿cabría en el cielo? → no: nos tragaría, su borde llegaría casi hasta
// Júpiter → lo raro: sería más frío, por eso rojo → pero brillaría cien mil veces más: hasta Plutón sería un horno →
// viviría unos diez millones de años, un parpadeo → sorpresa: existe, Betelgeuse (junto a las Tres Marías), y cuando
// explote se verá de día.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, clamp, ease, lerp, mixc, pop, sky, sea, space, starBall, orbit, planet, thermometer, drop, puff } from '../../engine2d/props.js';
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

function pluto(ctx, x, y, r, hot) {
  planet(ctx, x, y, r, mixc('#e7e5e4', '#fb923c', hot), mixc('#a8a29e', '#b91c1c', hot));
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.fillStyle = mixc('#fff7ed', '#fde047', hot); ctx.beginPath(); const hx = x + r * 0.15, hy = y + r * 0.1, s = r * 0.42;
  ctx.moveTo(hx, hy + s * 0.9); ctx.bezierCurveTo(hx - s * 1.4, hy - s * 0.2, hx - s * 0.6, hy - s * 1.2, hx, hy - s * 0.4); ctx.bezierCurveTo(hx + s * 0.6, hy - s * 1.2, hx + s * 1.4, hy - s * 0.2, hx, hy + s * 0.9); ctx.fill();
  ctx.restore();
}

function eye(ctx, x, y, s, open) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-120, 0); ctx.quadraticCurveTo(0, -110 * open, 120, 0); ctx.quadraticCurveTo(0, 110 * open, -120, 0); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  if (open > 0.15) { ctx.save(); ctx.clip(); ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.fillStyle = '#7c3aed'; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.arc(-12, -14, 9, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore(); }
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-120, 0); ctx.quadraticCurveTo(0, -110 * open, 120, 0); ctx.stroke();
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, t } = o;
    // Playa: el Sol crece sin parar hasta tapar el cielo de rojo.
    const g = ease((local - 0.9) / 2.0);
    sky(ctx, W, 0, 840, mixc('#38bdf8', '#7f1d1d', g), mixc('#e0f2fe', '#f97316', g));
    starBall(ctx, 540, 620, lerp(70, 760, g), t, { kind: g > 0.35 ? 'giant' : 'sun', rays: g < 0.35 });
    sea(ctx, W, H, 820, t, { top: mixc('#0ea5e9', '#f97316', g * 0.7), bottom: mixc('#0369a1', '#7c2d12', g) });
    ctx.fillStyle = hq.vgrad(ctx, 0, 1000, H, [[0, '#fde68a'], [1, '#f59e0b']]); ctx.fillRect(0, 1000, W, H);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W, 1000); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(230, 1110); ctx.lineTo(210, 860); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, 900); ctx.quadraticCurveTo(200, 740, 370, 830); ctx.closePath(); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    const shock = local > 1.4;
    hq.toon(ctx, 800, 1100, 340, { t, seed: 6, shirt: '#22c55e', pants: '#0ea5e9', skin: '#e0ac69', hair: '#92400e', armL: shock ? [2.4, 0.3] : [0.5, -0.6], armR: shock ? [2.4, 0.3] : [0.5, -0.6], eyes: shock ? 'wide' : 'happy', mouth: shock ? 'o' : 'smile', brows: shock ? 1 : 0, look: [-0.6, -0.8] });
  },

  tragar(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Vista desde arriba: la estrella gigante crece y se traga Mercurio, Venus, la Tierra y Marte; Júpiter se salva.
    const c1 = cue(1), sx = 80, sy = 800, S = 172, grow = ease((local - 0.2) / Math.max(1.6, o.s.dur - 0.5)), R = lerp(40, 4.65 * S, grow);
    space(ctx, W, H, t);
    const P = [[0.39, -0.6, 12, '#d6d3d1', '#78716c', ''], [0.72, 0.5, 18, '#fde68a', '#d97706', ''], [1.0, -0.25, 22, null, null, 'TIERRA'], [1.52, 0.35, 18, '#fb923c', '#b91c1c', 'MARTE'], [5.2, -0.12, 54, '#fde68a', '#b45309', 'JÚPITER']];
    for (const [d] of P) orbit(ctx, sx, sy, d * S, -1.0, 1.0);
    starBall(ctx, sx, sy, R, t, { kind: 'giant', rays: false });
    for (const [d, a, r, c0, c1c, name] of P) {
      const x = sx + Math.cos(a) * d * S, y = sy + Math.sin(a) * d * S, gone = R > d * S;
      if (gone) { puff(ctx, x, y, clamp((R - d * S) / 60), 50, '#fde68a'); continue; }
      if (!c0) drawGlobe(ctx, x, y, r, { lon0: t * 30, lat0: 15, outline: 4 }); else planet(ctx, x, y, r, c0, c1c);
      if (name === 'JÚPITER') { ctx.strokeStyle = 'rgba(146,64,14,0.5)'; ctx.lineWidth = 5; for (const dy of [-16, 0, 16]) { ctx.beginPath(); ctx.moveTo(x - r * 0.9, y + dy); ctx.lineTo(x + r * 0.9, y + dy); ctx.stroke(); } }
      if (name) hq.tag(ctx, x, y + r + 34, name, { size: 24, fill: name === 'TIERRA' ? '#86efac' : '#fdba74' });
    }
    hq.tag(ctx, 540, 410, local < c1 ? 'NOS TRAGARÍA' : 'CASI HASTA JÚPITER', { size: 46, fill: '#fca5a5' });
  },

  rojo(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Termómetros: la superficie del Sol (más caliente, amarillo) contra la de la gigante (más fría, roja).
    const c1 = cue(1), k = ease((local - 0.3) / 1.0);
    space(ctx, W, H, t);
    starBall(ctx, 300, 700, 120, t, { kind: 'sun' });
    starBall(ctx, 880, 760, 330, t, { kind: 'giant', rays: false });
    thermometer(ctx, 300, 1040, 200, lerp(0.5, 0.9, k), '#f59e0b');
    thermometer(ctx, 700, 1040, 200, lerp(0.5, 0.55, k), '#ef4444');
    hq.tag(ctx, 300, 540, 'NUESTRO SOL', { size: 28, fill: '#fde047' });
    hq.tag(ctx, 760, 480, 'LA GIGANTE', { size: 28, fill: '#fca5a5' });
    hq.tag(ctx, 540, 410, local < c1 ? 'MÁS FRÍA QUE EL SOL' : 'POR ESO SE VE ROJA', { size: 44, fill: '#fca5a5' });
  },

  horno(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Plutón, el más lejano y helado… se vuelve un horno con la luz de la gigante.
    const c1 = cue(1), hot = ease((local - c1 + 0.2) / 1.2);
    space(ctx, W, H, t);
    hq.glow(ctx, -200, 760, 900, 'rgba(248,113,113,A)', 0.5 + 0.2 * hot);
    starBall(ctx, -260, 760, 420, t, { kind: 'giant', rays: false });
    // Rayos de luz.
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { const y = 520 + i * 80, x = 200 + ((t * 300 + i * 70) % 400); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y); ctx.stroke(); } ctx.restore();
    pluto(ctx, 760, 760, 150, hot);
    if (hot > 0.2) for (let i = 0; i < 6; i++) { const u = (t * 0.7 + i / 6) % 1; ctx.save(); ctx.globalAlpha = (1 - u) * hot; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 8; k++) ctx.lineTo(660 + i * 40 + 10 * Math.sin(k + t * 4), 600 - u * 160 - k * 16); ctx.stroke(); ctx.restore(); }
    hq.tag(ctx, 760, 960, 'PLUTÓN', { size: 30, fill: hot > 0.5 ? '#fdba74' : '#e2e8f0' });
    hq.tag(ctx, 540, 410, local < c1 ? 'CIEN MIL VECES MÁS LUZ' : '¡HASTA PLUTÓN, UN HORNO!', { size: 42, fill: '#fde68a' });
  },

  corta(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Barras de vida: la del Sol larga; la de la gigante, un puntito. Luego, un ojo que parpadea.
    const c1 = cue(1), g = ease((local - 0.2) / 0.9), x0 = 180;
    space(ctx, W, H, t);
    starBall(ctx, 105, 640, 38, t, { kind: 'sun', rays: false });
    starBall(ctx, 105, 860, 46, t, { kind: 'giant', rays: false });
    hq.tag(ctx, 320, 565, 'NUESTRO SOL', { size: 28, fill: '#fde047' });
    hq.tag(ctx, 320, 785, 'LA GIGANTE', { size: 28, fill: '#fca5a5' });
    const bar = (y, w, fill) => { hq.roundRectPath(ctx, x0, y - 23, w, 46, 23); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); };
    bar(640, Math.max(46, 820 * g), '#facc15');
    bar(860, 46, '#ef4444');
    if (local > c1) { const k = pop((local - c1) / 0.5), bl = Math.abs(Math.sin((local - c1) * 3)); ctx.save(); ctx.globalAlpha = clamp(k); eye(ctx, 640, 860, 0.9 * k, 0.15 + 0.85 * bl); ctx.restore(); }
    hq.tag(ctx, 540, 410, local < c1 ? 'UNOS 10 MILLONES DE AÑOS' : 'UN PARPADEO', { size: 44, fill: '#fca5a5' });
  },

  real(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Orión de noche: Betelgeuse, la roja junto a las Tres Marías… explota y se ve de día.
    const c1 = cue(1), boom = clamp((local - c1 - 0.3) / 0.5), day = ease((local - c1 - 0.6) / 1.0);
    sky(ctx, W, 0, 1000, mixc('#020617', '#38bdf8', day), mixc('#4c1d95', '#e0f2fe', day));
    if (day < 1) { const st = kit.makeStars(110, W, 1000, 7); kit.drawStars(ctx, st, 0.8 * (1 - day), t); }
    const S = { bet: [640, 470], bel: [820, 490], a1: [690, 662], a2: [730, 646], a3: [770, 630], sai: [680, 820], rig: [850, 790] };
    ctx.save(); ctx.globalAlpha = 1 - day;
    ctx.strokeStyle = 'rgba(191,219,254,0.3)'; ctx.lineWidth = 3;
    for (const [a, b] of [['bet', 'a1'], ['bel', 'a3'], ['a1', 'sai'], ['a3', 'rig'], ['bet', 'bel'], ['a1', 'a2'], ['a2', 'a3']]) { ctx.beginPath(); ctx.moveTo(...S[a]); ctx.lineTo(...S[b]); ctx.stroke(); }
    for (const k of ['bel', 'sai', 'rig', 'a1', 'a2', 'a3']) { hq.glow(ctx, S[k][0], S[k][1], 36, 'rgba(224,242,254,A)', 0.6); ctx.beginPath(); ctx.arc(S[k][0], S[k][1], 7, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    hq.tag(ctx, 740, 575, 'LAS TRES MARÍAS', { size: 24, fill: '#e2e8f0' });
    ctx.restore();
    // Betelgeuse: roja y titilante; luego explota.
    const [bx, by] = S.bet, tw = 1 + 0.15 * Math.sin(t * 8);
    if (boom <= 0) { hq.glow(ctx, bx, by, 90 * tw, 'rgba(248,113,113,A)', 0.8); ctx.beginPath(); ctx.arc(bx, by, 16, 0, TAU); ctx.fillStyle = '#fb923c'; ctx.fill(); if (local > 0.5) hq.tag(ctx, bx - 40, by - 80, 'BETELGEUSE', { size: 30, fill: '#fca5a5' }); }
    else {
      const r = 30 + 120 * boom;
      hq.glow(ctx, bx, by, r * 4, 'rgba(255,255,255,A)', 0.9);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(t * 0.3); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.ellipse(0, 0, 10, r * 1.6, 0, 0, TAU); ctx.fill(); } ctx.restore();
      ctx.beginPath(); ctx.arc(bx, by, r * 0.4, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(0, 1000); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 975 - 40 * Math.sin(x * 0.006 + 0.5)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 930, H, [[0, mixc('#1e293b', '#4d7c0f', day)], [1, mixc('#020617', '#1a2e05', day)]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hq.toon(ctx, 850, 1100, 330, { t, seed: 9, shirt: '#6366f1', hair: '#111827', hairStyle: 'curly', skin: '#a0522d', armL: [2.35, 0.15], armR: boom > 0 ? [2.6, 0.2] : [0.25, 0.2], eyes: 'wide', mouth: boom > 0 ? 'o' : 'smile', look: [-0.7, -0.8] });
    hq.tag(ctx, 540, 410, local < c1 ? 'EXISTE: BETELGEUSE' : '¡SE VERÁ DE DÍA!', { size: 44, fill: '#fde047' });
  },
};
