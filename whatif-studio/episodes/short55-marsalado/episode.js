// Short 55: ¿y si el mar fuera diez veces más salado?  (SERIE EL AGUA · 4; gemelo del mar de agua dulce, el récord)
// Gancho: un salero gigante sala el mar → ¿podrías hundirte? → no: flotas como corcho; bucear, casi imposible → casi
// todos los peces y corales mueren (la sal les saca el agua) → playas con costras de sal; el agua arde en ojos y
// raspones → existe: el mar Muerto, sin peces; prueba en casa: el huevo flota en agua con mucha sal.
import * as hq from '../../engine2d/hq.js';
import * as kit from '../../engine2d/kit.js';
import { TAU, INK, ease, lerp, mixc, sky, sea, sunDisc, cloud, fish, saltCube, egg, HERO } from '../../engine2d/props.js';

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

const SALTY = { top: '#5eead4', bottom: '#0f766e' };

/** Brillos de sal flotando en el agua. */
function glints(ctx, W, y0, y1, t, a = 1, n = 36, seed = 3) {
  if (a <= 0) return;
  const R = kit.rng(seed); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) { const x = R() * W, y = y0 + R() * (y1 - y0), k = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7); ctx.beginPath(); ctx.moveTo(x, y - 9 * k); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 9 * k); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/** Capa de agua translúcida encima de lo que está sumergido. */
function waterOver(ctx, W, H, y, t, color = 'rgba(15,118,110,0.72)') {
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + 6 * Math.sin(x * 0.02 + t * 2.4));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath();
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + 6 * Math.sin(x * 0.02 + t * 2.4));
  ctx.stroke();
}

function shaker(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  hq.roundRectPath(ctx, -70, -40, 140, 210, 34); ctx.fillStyle = 'rgba(226,232,240,0.9)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  hq.roundRectPath(ctx, -60, 40, 120, 120, 26); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-70, -40); ctx.quadraticCurveTo(-70, -110, 0, -110); ctx.quadraticCurveTo(70, -110, 70, -40); ctx.closePath();
  ctx.fillStyle = hq.vgrad(ctx, 0, -110, -40, [[0, '#e2e8f0'], [1, '#94a3b8']]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; for (const [hx, hy] of [[-22, -78], [0, -90], [22, -78], [-10, -60], [12, -60]]) { ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill(); }
  ctx.font = '900 64px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText('SAL', 0, 102);
  ctx.restore();
}

function cork(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  hq.roundRectPath(ctx, -s * 0.5, -s * 0.32, s, s * 0.64, s * 0.14); ctx.fillStyle = hq.vgrad(ctx, 0, -s * 0.32, s * 0.32, [[0, '#d6a46a'], [1, '#a16207']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(120,53,15,0.5)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-s * 0.3 + i * s * 0.12, -s * 0.1 + (i % 2) * s * 0.18, 4, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function coral(ctx, x, y, h, color, dead) {
  const c = mixc(color, '#f1f5f9', dead);
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  const br = (bx, by, a, len, w, d) => { if (d > 3) return; const x2 = bx + Math.cos(a) * len, y2 = by + Math.sin(a) * len; ctx.lineWidth = w + 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); br(x2, y2, a - 0.45, len * 0.72, w * 0.75, d + 1); br(x2, y2, a + 0.45, len * 0.72, w * 0.75, d + 1); };
  br(0, 0, -Math.PI / 2, h * 0.38, h * 0.12, 0);
  ctx.restore();
}

function glass(ctx, x, y, w, h, water = 0.75, tint = 'rgba(56,189,248,0.55)') {
  const top = y - h;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w * 0.42, y); ctx.lineTo(x + w * 0.42, y); ctx.lineTo(x + w / 2, top); ctx.closePath();
  ctx.fillStyle = 'rgba(241,245,249,0.55)'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = tint; ctx.fillRect(x - w, y - h * water, w * 2, h * water); ctx.restore();
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - w * 0.38, top + 16, 12, h * 0.7);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, H, local, cue, t } = o;
    // Un salero gigante sala el mar: el agua se pone turquesa y lechosa; luego el protagonista se mete.
    const c1 = cue(1), salt = ease((local - 0.25) / 1.0);
    sky(ctx, W, 0, 900, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 170, 560, 56, t);
    sea(ctx, W, H, 900, t, { top: mixc('#38bdf8', SALTY.top, salt), bottom: mixc('#0369a1', SALTY.bottom, salt) });
    glints(ctx, W, 930, 1500, t, salt);
    // Arena en primer plano.
    ctx.beginPath(); ctx.moveTo(0, 1330); ctx.quadraticCurveTo(420, 1250, W, 1380); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = hq.vgrad(ctx, 0, 1250, H, [[0, '#fde68a'], [1, '#d97706']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (local < c1) {
      const shake = Math.sin(t * 22) * 0.12;
      shaker(ctx, 760, 640, 1.05, Math.PI * 0.82 + shake);
      for (let i = 0; i < 16; i++) { const u = (t * 1.6 + i / 16) % 1; saltCube(ctx, 700 + 30 * Math.sin(i * 2.3) + u * 40, lerp(720, 900, u), 12, i + t * 4); }
      hq.toon(ctx, 260, 1330, 360, { ...HERO, t, seed: 1, armL: [0.3, 0.2], armR: [0.3, 0.2], eyes: 'open', mouth: 'o', brows: 1, look: [1, -0.4] });
    } else {
      // Se mete al mar… y se queda flotando muy arriba.
      const k = ease((local - c1) / 0.6), bob = 10 * Math.sin(t * 3);
      hq.toon(ctx, 540, lerp(1330, 1060, k) + bob, 360, { ...HERO, t, seed: 1, armL: [1.2, -0.6], armR: [1.2, -0.6], eyes: 'open', mouth: 'o', brows: 1, look: [0, -0.4] });
      waterOver(ctx, W, H, 1000, t);
      glints(ctx, W, 1010, 1240, t, 0.8, 16, 9);
      if (local > c1 + 0.5) hq.bubble(ctx, 650, 560, 330, 96, 600, 720, '¿ME HUNDO?', { size: 44 });
    }
  },

  flotar(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1), y0 = 880;
    sky(ctx, W, 0, y0, '#7dd3fc', '#f0f9ff');
    sunDisc(ctx, 900, 560, 52, t);
    sea(ctx, W, H, y0, t, SALTY);
    glints(ctx, W, y0 + 30, H, t, 0.9);
    if (local < c1) {
      // Acostado sobre el agua, leyendo el periódico, junto a un corcho: los dos flotan igual.
      const bob = 8 * Math.sin(t * 2.6);
      hq.toon(ctx, 760, y0 - 62 + bob, 380, { ...HERO, t, seed: 2, lean: -Math.PI / 2, armL: [1.5, 0.3], armR: [1.5, 0.3], eyes: 'happy', mouth: 'smile', look: [0, -1] });
      ctx.save(); ctx.translate(520, y0 - 215 + bob); ctx.rotate(-0.1);
      hq.roundRectPath(ctx, -110, -70, 220, 140, 8); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.font = '900 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NOTICIAS', 0, -32);
      ctx.fillStyle = '#94a3b8'; for (let i = 0; i < 4; i++) ctx.fillRect(-90, -8 + i * 18, i % 2 ? 120 : 180, 8);
      ctx.restore();
      waterOver(ctx, W, H, y0, t);
      cork(ctx, 210, y0 - 8 + 8 * Math.sin(t * 2.6 + 1), 120, 0.15);
      hq.tag(ctx, 540, 410, 'FLOTAS COMO CORCHO', { size: 46, fill: '#99f6e4' });
    } else {
      // Intenta bucear de cabeza… y se queda con las piernas pataleando afuera.
      const k = ease((local - c1) / 0.5), bob = 26 * Math.abs(Math.sin(t * 3.2));
      hq.toon(ctx, 540, lerp(y0 - 420, y0 - 210, k) - bob, 380, { ...HERO, t, seed: 3, lean: Math.PI, legs: 0.08 + 0.07 * Math.sin(t * 14), armL: [2.6, 0.2], armR: [2.6, 0.2], eyes: 'closed', mouth: 'o' });
      waterOver(ctx, W, H, y0, t);
      ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      for (const sx of [-1, 1]) { const x = 540 + sx * 220; ctx.beginPath(); ctx.moveTo(x, y0 + 200); ctx.lineTo(x, y0 + 40); ctx.moveTo(x - 30, y0 + 80); ctx.lineTo(x, y0 + 40); ctx.lineTo(x + 30, y0 + 80); ctx.stroke(); }
      ctx.restore();
      hq.tag(ctx, 540, 410, 'BUCEAR: CASI IMPOSIBLE', { size: 44, fill: '#fde68a' });
    }
  },

  peces(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    // Bajo el agua: el arrecife se pone blanco y los peces quedan panza arriba.
    ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#5eead4'], [0.5, '#0f766e'], [1, '#134e4a']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(100 + i * 230, 0); ctx.lineTo(160 + i * 230, 0); ctx.lineTo(20 + i * 230, 1300); ctx.lineTo(-60 + i * 230, 1300); ctx.closePath(); ctx.fill(); } ctx.restore();
    glints(ctx, W, 480, 1300, t, 0.8, 30, 5);
    // Fondo de arena.
    ctx.beginPath(); ctx.moveTo(0, 1180); ctx.quadraticCurveTo(540, 1110, W, 1180); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 1110, H, [[0, '#d6b77a'], [1, '#8a6a33']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (local < c1) {
      const dead = ease((local - 0.4) / 1.6);
      const C = [[120, '#f472b6'], [300, '#fb923c'], [470, '#a78bfa'], [640, '#f472b6'], [820, '#facc15'], [980, '#fb923c']];
      C.forEach(([x, c], i) => coral(ctx, x, 1170, 300 + (i % 3) * 60, c, dead));
      const F = [[260, 700, '#facc15'], [720, 640, '#38bdf8'], [480, 860, '#f97316'], [860, 900, '#a3e635']];
      F.forEach(([x0, y0, c], i) => { const x = x0 + 30 * Math.sin(t + i) * (1 - dead), y = lerp(y0, 520, dead * 0.8); fish(ctx, x, y, 1.0, c, { sick: dead, t, seed: i, dir: i % 2 ? -1 : 1 }); });
      hq.tag(ctx, 540, 410, 'PECES Y CORALES MUEREN', { size: 44, fill: '#fca5a5' });
    } else {
      // Un pez grande: el agua se le sale del cuerpo y se arruga.
      const k = ease((local - c1) / 1.4);
      for (let i = 0; i < 4; i++) coral(ctx, 120 + i * 280, 1170, 260, '#f472b6', 1);
      ctx.save(); ctx.translate(540, 820); ctx.scale(1, 1 - 0.25 * k);
      fish(ctx, 0, 0, 2.6, '#38bdf8', { t, seed: 1, sick: 0 });
      ctx.restore();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, u = (t * 0.7 + i / 10) % 1, r = 170 + u * 230;
        ctx.save(); ctx.globalAlpha = 1 - u;
        ctx.beginPath(); ctx.arc(540 + Math.cos(a) * r, 820 + Math.sin(a) * r * 0.7, 14, 0, TAU); ctx.fillStyle = '#bae6fd'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.restore();
      }
      R_salt(ctx, t);
      hq.tag(ctx, 540, 410, 'LA SAL LES SACA EL AGUA', { size: 44, fill: '#bae6fd' });
    }
  },

  playas(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // Playa con costra blanca de sal y rocas con cristales.
      const crust = ease((local - 0.2) / 1.4);
      sky(ctx, W, 0, 860, '#7dd3fc', '#f0f9ff');
      sunDisc(ctx, 880, 560, 52, t);
      sea(ctx, W, H, 860, t, SALTY);
      ctx.beginPath(); ctx.moveTo(0, 1010); ctx.quadraticCurveTo(540, 940, W, 1030); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = hq.vgrad(ctx, 0, 940, H, [[0, mixc('#fde68a', '#f8fafc', crust * 0.8)], [1, mixc('#d97706', '#cbd5e1', crust * 0.7)]]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      const R = kit.rng(8); ctx.fillStyle = 'rgba(255,255,255,0.95)';
      for (let i = 0; i < 26; i++) { const x = R() * W, y = 1030 + R() * 600, r = (24 + R() * 60) * crust; if (r > 1) { ctx.beginPath(); ctx.ellipse(x, y, r * 1.7, r * 0.45, 0, 0, TAU); ctx.fill(); } }
      for (const [x, y, s] of [[200, 1120, 150], [820, 1160, 190]]) {
        ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.6, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, y - s * 0.6, y, [[0, '#94a3b8'], [1, '#475569']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
        for (let i = 0; i < 7; i++) saltCube(ctx, x - s * 0.7 + i * s * 0.23, y - s * 0.3 - (i % 3) * 18, 26 * crust + 1, i * 0.7);
      }
      hq.tag(ctx, 540, 410, 'PLAYAS CON COSTRAS DE SAL', { size: 42, fill: '#f8fafc' });
    } else {
      // Primer plano: le arden los ojos.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#99f6e4'], [1, '#0f766e']]); ctx.fillRect(0, 0, W, H);
      glints(ctx, W, 500, H, t, 0.9);
      const sting = ease((local - c1) / 0.4);
      hq.toon(ctx, 540, 1880, 900, { ...HERO, t, seed: 4, eyes: sting > 0.3 ? 'closed' : 'open', mouth: sting > 0.3 ? 'o' : 'smile', brows: -1 * sting, armL: [2.2, -1.2], armR: [2.2, -1.2], blush: sting });
      ctx.save(); ctx.globalAlpha = 0.5 * sting; ctx.fillStyle = '#ef4444'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(540 + sx * 38, 1880 - 0.78 * 900 - 0.02 * 900 - 0.12 * 900 * 0.95 + 4, 30, 0, TAU); ctx.fill(); } ctx.restore();
      if (local > c1 + 0.5) hq.bubble(ctx, 190, 520, 280, 110, 400, 700, '¡ARDE!', { size: 60, fill: '#b91c1c' });
      hq.tag(ctx, 540, 410, 'ARDE EN OJOS Y RASPONES', { size: 42, fill: '#fca5a5' });
    }
  },

  final(ctx, o) {
    const { W, H, local, cue, t } = o;
    const c1 = cue(1);
    if (local < c1) {
      // El mar Muerto: desierto, cerros, columnas de sal y alguien flotando.
      sky(ctx, W, 0, 900, '#fbbf24', '#fef3c7');
      sunDisc(ctx, 860, 540, 60, t);
      for (const [x, w, h, c] of [[-60, 520, 360, '#c2410c'], [380, 560, 300, '#ea580c'], [780, 480, 380, '#c2410c']]) { ctx.beginPath(); ctx.moveTo(x, 900); ctx.quadraticCurveTo(x + w * 0.3, 900 - h, x + w * 0.55, 900 - h * 0.85); ctx.quadraticCurveTo(x + w * 0.8, 900 - h * 0.7, x + w, 900); ctx.closePath(); ctx.fillStyle = hq.vgrad(ctx, 0, 900 - h, 900, [[0, c], [1, '#7c2d12']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
      sea(ctx, W, H, 900, t, { top: '#67e8f9', bottom: '#0e7490', amp: 3 });
      glints(ctx, W, 930, H, t, 0.9);
      for (const [x, y, w, h] of [[150, 1000, 90, 120], [880, 1060, 110, 90], [700, 960, 70, 70]]) { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.3, y - h, x, y - h * 1.1); ctx.quadraticCurveTo(x + w * 0.3, y - h, x + w / 2, y); ctx.closePath(); ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
      const bob = 6 * Math.sin(t * 2.4);
      hq.toon(ctx, 620, 1090 + bob, 260, { ...HERO, t, seed: 5, lean: -Math.PI / 2, armL: [2.4, -0.2], armR: [2.4, -0.2], eyes: 'happy', mouth: 'smile' });
      waterOver(ctx, W, H, 1080, t, 'rgba(14,116,144,0.6)');
      hq.tag(ctx, 540, 410, 'EL MAR MUERTO', { size: 50, fill: '#fde68a' });
      hq.tag(ctx, 540, 500, 'NINGÚN PEZ VIVE AHÍ', { size: 36, fill: '#ffffff' });
    } else {
      // La prueba: dos vasos; en el de la derecha cae sal y el huevo sube.
      ctx.fillStyle = hq.vgrad(ctx, 0, 0, H, [[0, '#fef9c3'], [1, '#fde68a']]); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = hq.vgrad(ctx, 0, 1080, H, [[0, '#a16207'], [1, '#713f12']]); ctx.fillRect(0, 1080, W, H); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 1080); ctx.lineTo(W, 1080); ctx.stroke();
      const k = ease((local - c1 - 0.6) / 1.4);
      glass(ctx, 300, 1080, 280, 420, 0.8);
      egg(ctx, 300, 1080 - 70, 110, 0.3);
      glass(ctx, 780, 1080, 280, 420, 0.8, 'rgba(94,234,212,0.6)');
      egg(ctx, 780, lerp(1080 - 70, 1080 - 336 + 20, k), 110, lerp(0.3, -0.2, k));
      // Cuchara con sal.
      const sp = ease((local - c1 - 0.1) / 0.5) * (1 - ease((local - c1 - 2.2) / 0.5));
      if (sp > 0) {
        ctx.save(); ctx.globalAlpha = sp; ctx.translate(840, 560); ctx.rotate(0.6);
        ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(160, -120); ctx.stroke(); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 12; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-20, 14, 46, 28, 0.6, 0, TAU); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 10; i++) { const u = (t * 1.5 + i / 10) % 1; saltCube(ctx, 800 + 18 * Math.sin(i * 3), lerp(600, 760, u), 10, i + t * 3); }
      }
      kit.text(ctx, 'AGUA', 300, 1410, { size: 46 });
      kit.text(ctx, 'AGUA + MUCHA SAL', 780, 1410, { size: 40, fill: '#99f6e4' });
      hq.tag(ctx, 540, 410, k < 0.5 ? 'PRUÉBALO EN CASA' : '¡EL HUEVO FLOTA!', { size: 48, fill: '#fde047' });
    }
  },
};

/** Cubitos de sal que rodean al pez (la sal «jala» el agua hacia afuera). */
function R_salt(ctx, t) {
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + 0.2, r = 380 + 16 * Math.sin(t * 2 + i); saltCube(ctx, 540 + Math.cos(a) * r, 820 + Math.sin(a) * r * 0.75, 22, t + i); }
}
