// Short 12: ¿y si todos los humanos saltáramos al mismo tiempo?
// 8,000 millones juntos (45 km por lado) → pesamos 400 mil millones de kg, la Tierra 15 billones de
// veces más → la Tierra se mueve 3,000 veces menos que un átomo → temblor pequeño → todo se cancela.
import { drawGlobe } from '../../engine2d/earth.js';

let stars;
export function setup(C) { stars = C.kit.makeStars(220, C.W, C.H, 52); }

export function draw(ctx, C, { t, scene: s, local }) {
  const cue = (i) => s.cueTimes[Math.min(i, s.cueTimes.length - 1)][0];
  SCENES[s.id](ctx, { ...C, t, local, s, cue });
  return s.chip ? { chip: s.chip } : {};
}

const SHIRTS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#22c55e'];
const space = (ctx, { W, H, kit, t }) => { kit.gradientBG(ctx, W, H, '#050a24', '#1e1b4b'); kit.drawStars(ctx, stars, 0.85, t); };
const sky = (ctx, { W, H, kit }) => kit.gradientBG(ctx, W, H, '#38bdf8', '#e0f2fe');

/** Fila de personas paradas sobre un arco (la superficie de la Tierra), que saltan con jump(i) en px. */
function crowdOnArc(ctx, kit, cx, cy, R, n, span, h, jump, arms = () => 0) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * span;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
    kit.person(ctx, 0, -jump(i), h, { shirt: SHIRTS[i % SHIRTS.length], arms: arms(i) });
    ctx.restore();
  }
}

/** Átomo: núcleo y tres órbitas de electrones. */
function atom(ctx, kit, x, y, r, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.lineWidth = 4;
  for (let k = 0; k < 3; k++) { ctx.save(); ctx.rotate((k * Math.PI) / 3); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.36, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1, rot = (k * Math.PI) / 3; const ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.36; ctx.beginPath(); ctx.arc(ex * Math.cos(rot) - ey * Math.sin(rot), ex * Math.sin(rot) + ey * Math.cos(rot), 9, 0, Math.PI * 2); kit.shape(ctx, '#38bdf8', 3); }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); kit.shape(ctx, '#f97316', 4);
  ctx.restore();
}

const SCENES = {
  hook(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const cx = W / 2, cy = 1660, R = 820;
    drawGlobe(ctx, cx, cy, R, { lon0: -95 + t * 2, lat0: -40, northCap: false });
    const J = cue(1);
    const jump = (i) => 90 * Math.max(0, Math.sin(Math.PI * kit.clamp((local - J - 0.15 - (i % 3) * 0.03) / 0.7)));
    crowdOnArc(ctx, kit, cx, cy, R, 9, 0.95, 150, jump, () => (local > J ? 1 : 0));
    const n = 8e9 * o.ease.out(kit.ramp(local, 0.1, 1.2));
    kit.text(ctx, kit.nf(Math.round(n / 1e6) * 1e6), W / 2, 260, { size: 104, fill: kit.YELLOW, maxW: W * 0.92 });
    kit.text(ctx, 'HUMANOS', W / 2, 370, { size: 52, fill: '#ffffff' });
  },

  juntos(ctx, o) {
    const { W, H, kit, local, cue } = o;
    kit.gradientBG(ctx, W, H, '#14532d', '#052e16');
    const sw = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.3);
    if (sw < 1) {
      // 1 m²: cuatro personas vistas desde arriba.
      ctx.save(); ctx.globalAlpha = 1 - sw;
      // Baldosa de 1 m × 1 m en perspectiva, con cuatro personas paradas encima.
      const cx = W / 2, cy = 900, hw = 330, hd = 150;
      ctx.beginPath(); ctx.moveTo(cx - hw, cy); ctx.lineTo(cx, cy - hd); ctx.lineTo(cx + hw, cy); ctx.lineTo(cx, cy + hd); ctx.closePath(); kit.shape(ctx, '#d6d3d1', 8);
      [[-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5]].sort((a, b) => a[1] - b[1]).forEach(([u, v], i) => {
        kit.person(ctx, cx + u * hw, cy + v * hd, 270, { shirt: SHIRTS[i * 2] });
      });
      kit.text(ctx, '1 m', cx - hw / 2 - 40, cy + hd / 2 + 50, { size: 48, fill: '#ffffff' });
      kit.text(ctx, '1 m', cx + hw / 2 + 40, cy + hd / 2 + 50, { size: 48, fill: '#ffffff' });
      kit.text(ctx, '4 PERSONAS POR m²', W / 2, 270, { size: 76, fill: kit.YELLOW });
      ctx.restore();
    }
    if (sw > 0) {
      // El cuadro de 45 km: una multitud de puntitos.
      ctx.save(); ctx.globalAlpha = sw;
      const s = 640 * (0.6 + 0.4 * o.ease.out(sw)), x0 = W / 2 - s / 2, y0 = 700 - s / 2;
      kit.roundRect(ctx, x0, y0, s, s, 10); kit.shape(ctx, '#78716c', 8);
      const r = kit.rng(9), cols = SHIRTS;
      for (let i = 0; i < 1400; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(x0 + 8 + r() * (s - 16), y0 + 8 + r() * (s - 16), 6, 6); }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x0, y0 + s + 40); ctx.lineTo(x0 + s, y0 + s + 40); ctx.stroke();
      for (const xx of [x0, x0 + s]) { ctx.beginPath(); ctx.moveTo(xx, y0 + s + 22); ctx.lineTo(xx, y0 + s + 58); ctx.stroke(); }
      kit.text(ctx, '45 km', W / 2, y0 + s + 92, { size: 56, fill: '#ffffff' });
      kit.text(ctx, '8,000 MILLONES ÷ 4 = 2,000 km²', W / 2, 250, { size: 60, fill: kit.YELLOW, maxW: W * 0.92 });
      ctx.restore();
    }
  },

  peso(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    space(ctx, o);
    // Balanza: de un lado la humanidad, del otro la Tierra. Se va de golpe hacia la Tierra.
    const tilt = 0.32 * o.ease.out(kit.ramp(local, cue(1) - 0.1, cue(1) + 0.6)) + 0.02 * Math.sin(t * 2) * (1 - kit.ramp(local, cue(1) - 0.1, cue(1)));
    const px = W / 2, py = 560, L = 400;
    ctx.beginPath(); ctx.moveTo(px - 70, 1060); ctx.lineTo(px + 70, 1060); ctx.lineTo(px + 16, py); ctx.lineTo(px - 16, py); ctx.closePath(); kit.shape(ctx, '#94a3b8', 7);
    const ends = [-1, 1].map((sd) => [px + sd * L * Math.cos(tilt), py + sd * L * Math.sin(tilt)]);
    ctx.lineCap = 'round'; ctx.strokeStyle = kit.INK; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(...ends[0]); ctx.lineTo(...ends[1]); ctx.stroke();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 14; ctx.stroke();
    ends.forEach(([x, y], k) => {
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 120, y + 200); ctx.moveTo(x, y); ctx.lineTo(x + 120, y + 200); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y + 205, 150, 30, 0, 0, Math.PI * 2); kit.shape(ctx, '#cbd5e1', 6);
      if (k === 0) { for (let i = 0; i < 5; i++) kit.person(ctx, x - 90 + i * 45, y + 190, 80, { shirt: SHIRTS[i] }); }
      else drawGlobe(ctx, x, y + 85, 120, { lon0: t * 15, lat0: 15, glow: false });
    });
    const cl = (x) => Math.min(W - 200, Math.max(200, x));
    kit.text(ctx, '400,000,000,000 kg', cl(ends[0][0]), ends[0][1] + 290, { size: 38, fill: '#fde68a' });
    kit.text(ctx, '6 × 10²⁴ kg', cl(ends[1][0]), ends[1][1] + 290, { size: 44, fill: '#93c5fd' });
    const k = kit.ramp(local, cue(1), cue(1) + 0.3);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; kit.text(ctx, '× 15 BILLONES', W / 2, 230, { size: 96, fill: kit.YELLOW }); kit.text(ctx, '(15,000,000,000,000)', W / 2, 330, { size: 44, fill: '#e2e8f0' }); ctx.restore(); }
    void H;
  },

  salto(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    const sw = kit.ramp(local, cue(1) - 0.2, cue(1) + 0.3);
    if (sw < 1) {
      ctx.save(); ctx.globalAlpha = 1 - sw;
      const cx = W / 2, cy = 1600, R = 780;
      const up = 120 * Math.max(0, Math.sin(Math.PI * kit.clamp((local - 0.1) / 1.2)));
      drawGlobe(ctx, cx, cy + up * 0.04, R, { lon0: 10, lat0: -40, northCap: false });
      crowdOnArc(ctx, kit, cx, cy, R, 9, 0.95, 150, () => up, () => 1);
      // Flechas: nosotros hacia arriba, la Tierra hacia abajo (casi nada).
      ctx.save(); ctx.translate(W / 2, 560); kit.text(ctx, '↑', 0, 0, { size: 140, fill: kit.YELLOW }); ctx.restore();
      ctx.restore();
    }
    if (sw > 0) {
      ctx.save(); ctx.globalAlpha = sw;
      atom(ctx, kit, W / 2, 720, 300, t);
      kit.text(ctx, 'ÁTOMO', W / 2, 1080, { size: 50, fill: '#93c5fd' });
      kit.text(ctx, '0.00000000000003 m', W / 2, 230, { size: 74, fill: kit.YELLOW, maxW: W * 0.94 });
      kit.text(ctx, 'LO QUE SE MUEVE LA TIERRA', W / 2, 330, { size: 44, fill: '#ffffff' });
      ctx.restore();
    }
  },

  golpe(ctx, o) {
    const { W, H, kit, local, cue, t } = o;
    sky(ctx, o);
    ctx.fillStyle = '#65a30d'; ctx.fillRect(0, 900, W, H - 900);
    ctx.fillStyle = '#4d7c0f'; ctx.fillRect(0, 900, W, 16);
    const land = 0.3;
    // Ondas del golpe en el suelo (anillos que se alejan y se apagan pronto).
    for (let k = 0; k < 4; k++) {
      const a = local - land - k * 0.18; if (a <= 0 || a > 1.6) continue;
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - a / 1.6)})`; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(W / 2, 960, 120 + a * 520, 30 + a * 120, 0, 0, Math.PI * 2); ctx.stroke();
    }
    const shake = 10 * kit.impulse(local, land, 0.5);
    ctx.save(); kit.shake(ctx, shake, t);
    for (let i = 0; i < 9; i++) { const x = 140 + i * 100, drop = Math.max(0, 1 - local / land) * 120; kit.person(ctx, x, 920 - drop, 150, { shirt: SHIRTS[i], arms: local < land ? 1 : 0.2 }); }
    ctx.restore();
    // Sismógrafo: una sacudida corta.
    const gx = 90, gy = 300, gw = W - 180, gh = 200;
    kit.roundRect(ctx, gx, gy, gw, gh, 20); kit.shape(ctx, '#f8fafc', 6);
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 5; ctx.beginPath();
    for (let x = 0; x <= gw - 40; x += 4) {
      const tt = (x / (gw - 40)) * 2.4, amp = 70 * Math.exp(-Math.pow((tt - land - 0.25) / 0.25, 2));
      const y = gy + gh / 2 + amp * Math.sin(tt * 60) * (tt < local ? 1 : 0);
      x ? ctx.lineTo(gx + 20 + x, y) : ctx.moveTo(gx + 20 + x, y);
    }
    ctx.stroke();
    const k = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    kit.text(ctx, k > 0.5 ? 'SOLO LO SIENTEN LOS DE CERCA' : 'TEMBLOR PEQUEÑO', W / 2, 200, { size: 58, fill: '#0f172a', stroke: '#ffffff', lw: 10, maxW: W * 0.92 });
  },

  regreso(ctx, o) {
    const { W, kit, local, cue, t } = o;
    space(ctx, o);
    // La Tierra baja (exagerado) cuando saltamos y vuelve a su lugar al caer.
    const cyc = (local % 1.6) / 1.6, off = 40 * Math.sin(Math.PI * cyc);
    const cx = W / 2, cy = 760 + off;
    ctx.setLineDash([20, 16]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(120, 760); ctx.lineTo(W - 120, 760); ctx.stroke(); ctx.setLineDash([]);
    drawGlobe(ctx, cx, cy, 300, { lon0: t * 12, lat0: 15 });
    kit.text(ctx, '(EXAGERADO)', W / 2, 1110, { size: 34, fill: '#94a3b8' });
    const k = kit.ramp(local, cue(1) - 0.1, cue(1) + 0.3);
    kit.text(ctx, k > 0.5 ? '↓  +  ↑  =  0' : 'VUELVE A SU LUGAR', W / 2, 250, { size: 92, fill: k > 0.5 ? kit.YELLOW : '#ffffff' });
  },

  outro(ctx, o) {
    const { W, kit, t } = o;
    space(ctx, o);
    const cx = W / 2, cy = 1660, R = 820;
    drawGlobe(ctx, cx, cy, R, { lon0: -95 + t * 2, lat0: -40, northCap: false });
    const jump = (i) => 60 * Math.max(0, Math.sin(t * 5 + i * 0.7));
    crowdOnArc(ctx, kit, cx, cy, R, 9, 0.95, 150, jump, () => 1);
    kit.text(ctx, '¿QUÉ HACEMOS AHORA?', W / 2, 300, { size: 74, fill: kit.YELLOW });
  },
};
