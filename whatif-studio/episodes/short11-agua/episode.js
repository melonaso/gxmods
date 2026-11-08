// Short 11 (idea de un suscriptor): ¿y si se acabara toda el agua del mundo?
// El océano se seca → 97% del agua y cañones de 11 km → sin nubes ni lluvia → plantas y comida →
// la mitad del oxígeno viene del mar → 3 días sin beber, 60% agua → la Tierra como Marte.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(240, C.W, C.H, 21); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#1e1b4b'); kit.drawStars(ctx, stars, 0.85, t); };
const mixC = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = [16, 8, 0].map((s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * k)); return `rgb(${c.join(',')})`; };

/** Tierra que se seca: dry 0 (normal) … 1 (sin agua). */
function earth(ctx, cx, cy, R, lon0, dry, glow = true) {
  drawGlobe(ctx, cx, cy, R, {
    lon0, lat0: 12, glow: glow && dry < 0.5,
    ocean: mixC('#2b7bd6', '#9a6a3a', dry), land: mixC('#4fbf5a', '#c9a36a', dry), ice: mixC('#f1f5f9', '#d9c3a0', dry),
  });
}

/** Gota de agua (punta arriba) con el centro de la parte redonda en (x, y). */
function dropPath(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 1.9);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 1.2, x + r, y - r * 0.5, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI); ctx.bezierCurveTo(x - r, y - r * 0.5, x - r * 0.5, y - r * 1.2, x, y - r * 1.9); ctx.closePath();
}

function cloud(ctx, kit, x, y, k, a = 1, col = '#f8fafc') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath(); ctx.arc(-70, 14, 52, 0, Math.PI * 2); ctx.arc(0, -18, 72, 0, Math.PI * 2); ctx.arc(72, 12, 54, 0, Math.PI * 2); ctx.rect(-70, 12, 142, 54);
  ctx.fillStyle = col; ctx.fill();
  ctx.restore();
}

/** Planta en maceta con la base en (x, y); wilt 0 sana … 1 seca. */
function plant(ctx, kit, x, y, h, wilt) {
  ctx.save(); ctx.translate(x, y);
  const leaf = mixC('#22c55e', '#a16207', wilt), stem = mixC('#15803d', '#78350f', wilt);
  // Maceta.
  ctx.beginPath(); ctx.moveTo(-h * 0.2, 0); ctx.lineTo(h * 0.2, 0); ctx.lineTo(h * 0.26, -h * 0.26); ctx.lineTo(-h * 0.26, -h * 0.26); ctx.closePath(); kit.shape(ctx, '#c2410c', 7);
  kit.roundRect(ctx, -h * 0.3, -h * 0.32, h * 0.6, h * 0.08, 8); kit.shape(ctx, '#ea580c', 7);
  // Tallo que se dobla.
  const top = [h * 0.32 * wilt, -h * 0.95 + h * 0.3 * wilt];
  ctx.strokeStyle = kit.INK; ctx.lineWidth = 22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -h * 0.32); ctx.quadraticCurveTo(0, -h * 0.75, top[0], top[1]); ctx.stroke();
  ctx.strokeStyle = stem; ctx.lineWidth = 12; ctx.stroke();
  // Hojas (caen al secarse).
  for (const [u, sd] of [[0.45, -1], [0.62, 1], [0.78, -1]]) {
    const px = top[0] * u * u, py = -h * 0.32 + (top[1] + h * 0.32) * u;
    ctx.save(); ctx.translate(px, py); ctx.rotate(sd * (0.5 + 1.0 * wilt));
    ctx.beginPath(); ctx.ellipse(sd * h * 0.13, 0, h * 0.14, h * 0.055, 0, 0, Math.PI * 2); kit.shape(ctx, leaf, 6); ctx.restore();
  }
  // Flor.
  ctx.save(); ctx.translate(top[0], top[1]); ctx.rotate(wilt * 1.6);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(Math.cos(a) * h * 0.07, Math.sin(a) * h * 0.07, h * 0.06, h * 0.035, a, 0, Math.PI * 2); kit.shape(ctx, mixC('#f472b6', '#78716c', wilt), 5); }
  ctx.beginPath(); ctx.arc(0, 0, h * 0.045, 0, Math.PI * 2); kit.shape(ctx, mixC('#facc15', '#78716c', wilt), 5);
  ctx.restore();
  ctx.restore();
}

/** Iconos de comida: 0 manzana, 1 pan, 2 elote, 3 pierna de pollo. */
function food(ctx, kit, kind, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (kind === 0) {
    ctx.strokeStyle = kit.INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(6, -78); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(26, -70, 22, 10, -0.4, 0, Math.PI * 2); kit.shape(ctx, '#22c55e', 5);
    ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(40, -70, 76, -30, 60, 10); ctx.bezierCurveTo(48, 50, 14, 62, 0, 50); ctx.bezierCurveTo(-14, 62, -48, 50, -60, 10); ctx.bezierCurveTo(-76, -30, -40, -70, 0, -46); ctx.closePath(); kit.shape(ctx, '#ef4444', 6);
  } else if (kind === 1) {
    ctx.beginPath(); ctx.moveTo(-80, 40); ctx.lineTo(-80, -10); ctx.bezierCurveTo(-80, -60, 80, -60, 80, -10); ctx.lineTo(80, 40); ctx.closePath(); kit.shape(ctx, '#d97706', 6);
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (const sx of [-40, 0, 40]) { ctx.beginPath(); ctx.moveTo(sx - 12, -24); ctx.lineTo(sx + 12, -4); ctx.stroke(); }
  } else if (kind === 2) {
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(sd * 60, 20, sd * 40, -40); ctx.quadraticCurveTo(sd * 20, 10, 0, 60); kit.shape(ctx, '#65a30d', 5); }
    ctx.beginPath(); ctx.ellipse(0, -10, 28, 66, 0, 0, Math.PI * 2); kit.shape(ctx, '#facc15', 6);
    ctx.fillStyle = '#eab308'; for (let r = -4; r <= 4; r++) for (const c of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(c * 12, -10 + r * 13, 4, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.save(); ctx.rotate(-0.6);
    ctx.beginPath(); ctx.ellipse(-14, 0, 50, 40, 0, 0, Math.PI * 2); kit.shape(ctx, '#b45309', 6);
    kit.roundRect(ctx, 30, -9, 50, 18, 8); kit.shape(ctx, '#f8fafc', 5);
    for (const dy of [-12, 12]) { ctx.beginPath(); ctx.arc(84, dy, 12, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 5); }
    ctx.restore();
  }
  ctx.restore();
}

/** Silueta humana (para rellenarla de agua). */
function bodyPath(ctx, x, y, h) {
  const u = h / 100;
  ctx.beginPath();
  ctx.arc(x, y - 88 * u, 10 * u, 0, Math.PI * 2);
  const rr = (x0, y0, w, hh, r) => { ctx.moveTo(x0 + r, y0); ctx.arcTo(x0 + w, y0, x0 + w, y0 + hh, r); ctx.arcTo(x0 + w, y0 + hh, x0, y0 + hh, r); ctx.arcTo(x0, y0 + hh, x0, y0, r); ctx.arcTo(x0, y0, x0 + w, y0, r); ctx.closePath(); };
  rr(x - 15 * u, y - 76 * u, 30 * u, 38 * u, 7 * u); // torso
  rr(x - 25 * u, y - 75 * u, 9 * u, 34 * u, 4.5 * u); rr(x + 16 * u, y - 75 * u, 9 * u, 34 * u, 4.5 * u); // brazos
  rr(x - 14 * u, y - 42 * u, 13 * u, 42 * u, 5 * u); rr(x + 1 * u, y - 42 * u, 13 * u, 42 * u, 5 * u); // piernas
}

/** Diatomea (alga microscópica). kind 0: redonda con rayos; 1: alargada. */
function diatom(ctx, kit, x, y, s, kind, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (kind === 0) {
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); kit.shape(ctx, col, 5);
    ctx.strokeStyle = 'rgba(11,15,26,0.45)'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 36, Math.sin(a) * 36); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); kit.shape(ctx, '#fef08a', 3);
  } else {
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 18, 0, 0, Math.PI * 2); kit.shape(ctx, col, 5);
    ctx.strokeStyle = 'rgba(11,15,26,0.45)'; ctx.lineWidth = 3; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 12, -14); ctx.lineTo(i * 12, 14); ctx.stroke(); }
  }
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const dry = o.ease.inOut(kit.ramp(local, cue(1), cue(1) + 1.6));
    earth(ctx, W / 2, 660, 380, -35 + t * 6, dry);
    kit.text(ctx, `AGUA: ${Math.round(100 * (1 - dry))}%`, W / 2, 200, { size: 80, fill: dry > 0.98 ? '#f87171' : '#7dd3fc' });
  },

  oceanos(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    const sw = kit.ramp(local, cue(1) - 0.25, cue(1) + 0.15);
    if (sw < 1) {
      // Gota: 97% del agua está en el mar.
      kit.gradientBG(ctx, W, H, '#0f172a', '#1e3a8a');
      ctx.save(); ctx.globalAlpha = 1 - sw;
      const lvl = 0.97 * o.ease.out(kit.ramp(local, 0.1, 1.2)), cx = W / 2, cy = 760, r = 260, top = cy - r * 1.9, bot = cy + r;
      dropPath(ctx, cx, cy, r); ctx.fillStyle = '#e0f2fe'; ctx.fill();
      ctx.save(); dropPath(ctx, cx, cy, r); ctx.clip();
      const y = bot - (bot - top) * lvl;
      ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + 8 * Math.sin(x / 50 + t * 4)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.restore();
      dropPath(ctx, cx, cy, r); ctx.lineWidth = 9; ctx.strokeStyle = kit.INK; ctx.stroke();
      kit.text(ctx, `${Math.round(lvl * 100)}%`, cx, cy + 40, { size: 130, fill: '#ffffff' });
      kit.text(ctx, 'MAR', cx, cy + 150, { size: 50, fill: '#bfdbfe' });
      ctx.restore();
    }
    if (sw > 0) {
      // Fondo marino seco con una fosa de 11 km.
      ctx.save(); ctx.globalAlpha = sw;
      kit.gradientBG(ctx, W, H, '#fde68a', '#f59e0b');
      const seaY = 470, floorY = 760, trenchY = 1060, tx = 690;
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, seaY - 40); ctx.lineTo(150, seaY - 30); ctx.quadraticCurveTo(260, seaY + 10, 330, floorY - 20);
      ctx.lineTo(560, floorY); ctx.lineTo(620, floorY + 30); ctx.lineTo(tx - 20, trenchY); ctx.lineTo(tx + 20, trenchY); ctx.lineTo(760, floorY + 30); ctx.lineTo(820, floorY);
      ctx.lineTo(W, floorY - 10); ctx.lineTo(W, H); ctx.closePath(); kit.shape(ctx, '#a16207', 8);
      // Grietas del fondo seco.
      ctx.strokeStyle = 'rgba(11,15,26,0.35)'; ctx.lineWidth = 4;
      for (const [a, b] of [[380, 800], [470, 860], [880, 820], [960, 900]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 20, b + 30); ctx.lineTo(a + 5, b + 55); ctx.stroke(); }
      ctx.setLineDash([18, 14]); ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(150, seaY - 30); ctx.lineTo(W - 20, seaY - 30); ctx.stroke(); ctx.setLineDash([]);
      kit.text(ctx, 'ANTES: NIVEL DEL MAR', 640, seaY - 64, { size: 34, fill: '#0369a1', stroke: '#ffffff', lw: 6 });
      const g = o.ease.out(kit.ramp(local, cue(1) + 0.1, cue(1) + 1.3));
      if (g > 0) {
        const x = tx + 160, y1 = seaY - 30 + (trenchY - seaY + 30) * g;
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, seaY - 30); ctx.lineTo(x, y1); ctx.stroke();
        for (const yy of [seaY - 30, y1]) { ctx.beginPath(); ctx.moveTo(x - 26, yy); ctx.lineTo(x + 26, yy); ctx.stroke(); }
        kit.text(ctx, `${g < 1 ? kit.nf(11 * g, 1) : '11'} km`, x + 24, seaY + 110, { size: 60, fill: kit.YELLOW, align: 'left' });
      }
      kit.text(ctx, 'FOSA DE LAS MARIANAS', W / 2, 220, { size: 58, fill: '#ffffff', maxW: W * 0.9 });
      ctx.restore();
    }
  },

  lluvia(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    const clear = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.8);
    kit.gradientBG(ctx, W, H, mixC('#64748b', '#38bdf8', clear), mixC('#94a3b8', '#fde68a', clear));
    // Sol que aparece cuando ya no hay nubes.
    if (clear > 0) kit.sun(ctx, 830, 430, 110 * clear, { t, on: 1 });
    ctx.fillStyle = mixC('#65a30d', '#b45309', clear); ctx.fillRect(0, 1000, W, H - 1000);
    // Lluvia que se detiene.
    const rain = 1 - kit.ramp(local, 0.5, 1.3);
    if (rain > 0) {
      const r = o.kit.rng(3);
      ctx.save(); ctx.strokeStyle = `rgba(191,219,254,${0.8 * rain})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 70; i++) { const x = r() * W, sp = 1400 + r() * 500, y = 420 + ((r() * 600 + t * sp) % 600); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 34); ctx.stroke(); }
      ctx.restore();
    }
    const fade = 1 - clear, grey = mixC('#cbd5e1', '#f8fafc', 1 - rain);
    cloud(ctx, kit, 250 + 10 * Math.sin(t), 360, 1.5, fade, grey);
    cloud(ctx, kit, 760 + 10 * Math.sin(t + 2), 300, 1.2, fade * (clear > 0 ? 1 : 1), grey);
    cloud(ctx, kit, 560, 430, 1.0, fade, grey);
    // Suelo agrietado.
    if (clear > 0.3) {
      ctx.save(); ctx.globalAlpha = kit.ramp(clear, 0.3, 1); ctx.strokeStyle = 'rgba(11,15,26,0.4)'; ctx.lineWidth = 5;
      for (const [a, b] of [[120, 1020], [360, 1040], [600, 1015], [850, 1035]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 40, b + 30); ctx.lineTo(a + 20, b + 70); ctx.moveTo(a + 40, b + 30); ctx.lineTo(a + 90, b + 40); ctx.stroke(); }
      ctx.restore();
    }
    const k = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, '0 NUBES', W / 2, 180, { size: 84, fill: '#ffffff' }); ctx.restore(); }
  },

  plantas(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#7dd3fc', '#fef3c7');
    ctx.fillStyle = '#b45309'; ctx.fillRect(0, 1010, W, H - 1010);
    const wilt = o.ease.inOut(kit.ramp(local, 0.2, cue(1) - 0.1));
    const two = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.4);
    const px = W / 2 - (W / 2 - 250) * o.ease.inOut(two);
    plant(ctx, kit, px, 1010, 560 - 80 * two, wilt);
    const day = Math.max(1, Math.ceil(7 * kit.ramp(local, 0.1, cue(1) - 0.1)));
    if (two < 1) { ctx.save(); ctx.globalAlpha = 1 - two; kit.text(ctx, `DÍA ${day}`, W / 2, 200, { size: 96, fill: '#ffffff' }); ctx.restore(); }
    if (two > 0) {
      ctx.save(); ctx.globalAlpha = two; kit.text(ctx, 'SIN COMIDA', W / 2, 200, { size: 96, fill: '#ef4444' }); ctx.restore();
      for (let i = 0; i < 4; i++) {
        const a0 = cue(1) + 0.1 + i * 0.22, ap = o.ease.out(kit.ramp(local, a0, a0 + 0.3));
        if (ap <= 0) continue;
        const x = 630 + (i % 2) * 260, y = 520 + Math.floor(i / 2) * 290;
        const gone = kit.ramp(local, a0 + 0.9, a0 + 1.2);
        ctx.save(); ctx.globalAlpha = 1 - 0.55 * gone; food(ctx, kit, i, x, y, 1.2 * ap); ctx.restore();
        if (gone > 0) {
          ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 16; ctx.lineCap = 'round';
          const L = 90 * gone; ctx.beginPath(); ctx.moveTo(-L, -L); ctx.lineTo(L, L); ctx.moveTo(L, -L); ctx.lineTo(-L, L); ctx.stroke(); ctx.restore();
        }
      }
    }
  },

  oxigeno(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#083344', '#0e7490');
    const sw = kit.ramp(local, cue(1) - 0.25, cue(1) + 0.2);
    kit.text(ctx, '50%', W / 2, 200, { size: 130, fill: '#a5f3fc' });
    kit.text(ctx, 'DEL OXÍGENO', W / 2, 310, { size: 52, fill: '#ffffff' });
    const cx = W / 2, cy = 720, R = 290;
    if (sw < 1) {
      // Pastel: la mitad viene del mar.
      ctx.save(); ctx.globalAlpha = 1 - sw;
      const k = o.ease.out(kit.ramp(local, 0.1, 1.0));
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); kit.shape(ctx, '#22c55e', 8);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * k); ctx.closePath(); kit.shape(ctx, '#2563eb', 8);
      kit.text(ctx, 'MAR', cx + R * 0.48, cy, { size: 56, fill: '#ffffff' });
      kit.text(ctx, 'TIERRA', cx - R * 0.48, cy, { size: 50, fill: '#ffffff' });
      ctx.restore();
    }
    if (sw > 0) {
      // Lupa con algas microscópicas que sueltan burbujas de oxígeno.
      ctx.save(); ctx.globalAlpha = sw;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = '#ccfbf1'; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      const r = kit.rng(8), cols = ['#a3e635', '#bef264', '#facc15', '#86efac'];
      for (let i = 0; i < 11; i++) {
        const x = cx - R + 50 + r() * (2 * R - 100), y = cy - R + 60 + r() * (2 * R - 120), kind = i % 3 === 0 ? 1 : 0, ph = r() * 6;
        diatom(ctx, kit, x + 8 * Math.sin(t + ph), y + 6 * Math.cos(t * 0.8 + ph), 0.8 + r() * 0.5, kind, ph + t * 0.2, cols[i % 4]);
        // Burbujas O₂ que suben.
        for (let b = 0; b < 2; b++) {
          const u = ((t * 0.5 + ph + b * 0.5) % 1), bx = x + 20 + 10 * Math.sin(u * 9 + ph), by = y - 30 - u * 160;
          ctx.globalAlpha = sw * (1 - u); ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0e7490'; ctx.stroke();
          kit.text(ctx, 'O₂', bx, by + 1, { size: 14, fill: '#0e7490', stroke: null });
          ctx.globalAlpha = sw;
        }
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 22; ctx.strokeStyle = '#1f2937'; ctx.stroke();
      ctx.save(); ctx.translate(cx + R * 0.72, cy + R * 0.72); ctx.rotate(-Math.PI / 4); kit.roundRect(ctx, -26, 10, 52, 190, 18); kit.shape(ctx, '#1f2937', 6); ctx.restore();
      ctx.restore();
    }
  },

  tu(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    kit.gradientBG(ctx, W, H, '#1e293b', '#0f172a');
    const cx = W / 2, feet = 1040, h = 700;
    bodyPath(ctx, cx, feet, h); ctx.fillStyle = '#e2e8f0'; ctx.fill('nonzero');
    // Agua que llena el cuerpo hasta el 60%.
    const fk = o.ease.out(kit.ramp(local, cue(1), cue(1) + 1.2)), lvl = feet - h * 0.98 * 0.6 * fk;
    if (fk > 0) {
      ctx.save(); bodyPath(ctx, cx, feet, h); ctx.clip();
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, lvl + 7 * Math.sin(x / 30 + t * 5)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    bodyPath(ctx, cx, feet, h); ctx.lineWidth = 8; ctx.strokeStyle = kit.INK; ctx.stroke();
    if (cue(1) > local) {
      // Tres días: soles que se encienden uno por uno.
      const d = Math.min(3, Math.floor(3 * kit.ramp(local, 0.2, cue(1) - 0.2)) + 1);
      kit.text(ctx, `DÍA ${d}`, W / 2, 180, { size: 90, fill: '#ffffff' });
      for (let i = 0; i < 3; i++) kit.sun(ctx, W / 2 + (i - 1) * 150, 300, 36, { t, on: i < d ? 1 : 0, rays: 8 });
    } else {
      kit.text(ctx, `${Math.round(60 * fk)}% AGUA`, W / 2, 200, { size: 96, fill: '#93c5fd' });
    }
  },

  marte(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    earth(ctx, 330, 640, 230, 20 + t * 8, 1, false);
    kit.text(ctx, 'TIERRA', 330, 930, { size: 44, fill: '#e7c58f' });
    // Marte (a escala: 0.53 veces el diámetro de la Tierra).
    const mx = 800, my = 640, mr = 122;
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = '#c2410c'; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#9a3412'; for (const [dx, dy, r] of [[-40, 20, 34], [30, -30, 22], [50, 40, 28], [-10, 70, 18]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.ellipse(mx, my - mr + 6, 50, 18, 0, 0, Math.PI * 2); ctx.fill();
    // Océano antiguo en el norte de Marte.
    const w = kit.ramp(local, cue(1), cue(1) + 0.8);
    if (w > 0) { ctx.globalAlpha = w * (0.75 + 0.15 * Math.sin(t * 3)); ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.ellipse(mx - 10, my - 48, 120, 52, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    const sh = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.4, mr * 0.1, mx, my, mr * 1.05);
    sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(1, 'rgba(0,0,30,0.4)'); ctx.fillStyle = sh; ctx.fillRect(mx - mr, my - mr, 2 * mr, 2 * mr);
    ctx.restore();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = kit.INK; ctx.stroke();
    kit.text(ctx, 'MARTE', mx, 930, { size: 44, fill: '#fb923c' });
    kit.text(ctx, '=', 575, 640, { size: 90, fill: '#ffffff' });
    if (w > 0) { ctx.save(); ctx.globalAlpha = w; kit.text(ctx, 'HACE ~3,500 MILLONES DE AÑOS', W / 2, 230, { size: 46, fill: '#93c5fd', maxW: W * 0.92 }); ctx.restore(); }
  },

  outro(ctx, o) {
    const { W, kit, local, t } = o;
    space(ctx, o);
    // El agua vuelve.
    earth(ctx, W / 2, 680, 360, -35 + t * 8, 1 - o.ease.inOut(kit.ramp(local, 0.1, 0.9)));
    const k = kit.ramp(local, 0.1, 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, 'IDEA DE @dalimartinez773', W / 2, 220, { size: 58, fill: kit.YELLOW, maxW: W * 0.9 }); ctx.restore(); }
  },
};
