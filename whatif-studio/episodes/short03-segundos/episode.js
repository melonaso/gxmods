// Short 03: ¿cuánto es 1 millón de segundos? Reloj → calendario → vida → historia → comparación.
const DAY = 86400, YEAR = 365.25 * DAY;
let stars;

export function setup(C) { stars = C.kit.makeStars(160, C.W, C.H, 21); }

export function draw(ctx, C, { t, scene: s, local }) {
  const { W, H, kit, ease, lerp } = C;
  const { nf } = kit;
  const goal = Math.max(1.2, s.cueTimes[0]?.[1] ?? s.audio);
  const x = ease.inOut(Math.min(1, local / goal));
  // Interpolación logarítmica cuando el rango salta ×1,000 (lineal desde 0).
  const sec = s.s0 <= 0 ? lerp(s.s0, s.s1, x) : Math.exp(lerp(Math.log(s.s0), Math.log(s.s1), x));

  kit.gradientBG(ctx, W, H, '#1e1b4b', '#3b0764');
  kit.drawStars(ctx, stars, 0.55, t);

  const view = s.view || 'clock';
  const fadeIn = Math.min(1, local / 0.5);
  ctx.save(); ctx.globalAlpha = fadeIn;
  if (view === 'clock') drawClock(ctx, kit, sec, W);
  else if (view === 'calendar') drawCalendar(ctx, kit, sec / DAY, W);
  else if (view === 'life') drawLife(ctx, kit, sec / YEAR, W, t);
  else if (view === 'history') drawHistory(ctx, kit, sec / YEAR, W);
  else if (view === 'bars') drawBars(ctx, kit, W, t);
  ctx.restore();

  const human = sec < 3600 ? `${Math.floor(sec / 60)} MIN ${Math.floor(sec % 60)} S` : sec < 60 * DAY ? `${nf(sec / DAY, 1)} DÍAS`
    : sec < 1000 * YEAR ? `${nf(sec / YEAR, 1)} AÑOS` : `${nf(Math.round(sec / YEAR / 100) * 100)} AÑOS`;
  const title = s.titleCard ? { lines: s.titleCard, y: s.titleY, alpha: s.id === 'intro'
    ? Math.min(1, local / 0.4) * (1 - kit.ramp(local, s.dur - 0.5, s.dur))
    : kit.ramp(local / s.dur, 0.45, 0.55) } : null;
  const ov = { counter: { label: 'SEGUNDOS', value: nf(Math.round(sec)) }, chip: `≈ ${human}`, title };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}

function drawClock(ctx, kit, sec, W) {
  const cx = W / 2, cy = 830, R = 300;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 10);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
    ctx.strokeStyle = kit.INK; ctx.lineWidth = big ? 8 : 3;
    ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * (R - (big ? 42 : 24)), cy - Math.cos(a) * (R - (big ? 42 : 24))); ctx.lineTo(cx + Math.sin(a) * (R - 10), cy - Math.cos(a) * (R - 10)); ctx.stroke();
  }
  // Minutos transcurridos: sector amarillo.
  const am = ((sec / 60) / 60) * Math.PI * 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R - 50, -Math.PI / 2, -Math.PI / 2 + am); ctx.closePath();
  ctx.fillStyle = 'rgba(250,204,21,0.45)'; ctx.fill();
  const hand = (a, len, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); ctx.stroke(); };
  hand(am, R - 70, 16, kit.INK);
  // El segundero gira tan rápido que se dibuja como un "borrón" circular (evita el efecto estroboscópico).
  ctx.beginPath(); ctx.arc(cx, cy, R - 30, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(239,68,68,0.25)'; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); kit.shape(ctx, '#ef4444', 4);
  const m = Math.floor(sec / 60), s2 = Math.floor(sec % 60);
  kit.text(ctx, `${m}:${String(s2).padStart(2, '0')}`, cx, cy + 140, { size: 72, fill: kit.INK, stroke: null });
}

function drawCalendar(ctx, kit, days, W) {
  const cols = 7, cell = 128, gx = (W - cols * cell) / 2, gy = 560;
  kit.roundRect(ctx, gx - 20, gy - 90, cols * cell + 40, 2 * cell + 120, 24); kit.shape(ctx, '#f8fafc', 8);
  ctx.fillStyle = '#ef4444'; kit.roundRect(ctx, gx - 20, gy - 90, cols * cell + 40, 70, 24); ctx.fill();
  kit.text(ctx, 'CALENDARIO', W / 2, gy - 55, { size: 40, stroke: null });
  for (let d = 0; d < 14; d++) {
    const x = gx + (d % cols) * cell, y = gy + Math.floor(d / cols) * cell;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.strokeRect(x + 6, y + 6, cell - 12, cell - 12);
    const f = Math.max(0, Math.min(1, days - d));
    if (f > 0) { ctx.fillStyle = '#facc15'; ctx.fillRect(x + 6, y + 6 + (cell - 12) * (1 - f), cell - 12, (cell - 12) * f); }
    kit.text(ctx, `${d + 1}`, x + cell / 2, y + cell / 2, { size: 44, fill: kit.INK, stroke: null });
  }
}

function drawLife(ctx, kit, years, W, t) {
  // Una persona que crece de bebé a adulta; la barra marca los años.
  const age = Math.min(32, years), k = Math.min(1, 0.35 + (age / 25) * 0.65);
  const cx = W / 2, base = 1050, h = 420 * k;
  const leg = h * 0.47, body = h * 0.35, head = h * 0.21, wdt = h * 0.33;
  kit.roundRect(ctx, cx - wdt * 0.42, base - leg, wdt * 0.36, leg, 6); kit.shape(ctx, '#1e3a8a', 5);
  kit.roundRect(ctx, cx + wdt * 0.06, base - leg, wdt * 0.36, leg, 6); kit.shape(ctx, '#1e3a8a', 5);
  kit.roundRect(ctx, cx - wdt / 2, base - leg - body, wdt, body, 8); kit.shape(ctx, '#22c55e', 5);
  kit.roundRect(ctx, cx - head / 2, base - leg - body - head, head, head, 8); kit.shape(ctx, '#e8b48a', 5);
  ctx.fillStyle = kit.INK;
  ctx.fillRect(cx - head * 0.22, base - leg - body - head * 0.55, head * 0.1, head * 0.14);
  ctx.fillRect(cx + head * 0.12, base - leg - body - head * 0.55, head * 0.1, head * 0.14);
  // Barra de edad.
  const bx = 120, bw = W - 240, by = 1110;
  kit.roundRect(ctx, bx, by, bw, 40, 20); kit.shape(ctx, '#312e81', 5);
  kit.roundRect(ctx, bx, by, Math.max(40, (bw * age) / 32), 40, 20); kit.shape(ctx, '#facc15', 5);
  kit.text(ctx, `${kit.nf(age, 1)} años`, W / 2, 540, { size: 60, fill: '#ffffff' });
  void t;
}

function drawHistory(ctx, kit, yearsAgo, W) {
  // Línea del tiempo hacia atrás: de HOY (derecha) a 32,000 años (izquierda).
  const x0 = 110, x1 = W - 110, y = 860, span = 32000;
  const X = (ya) => x1 - ((x1 - x0) * ya) / span;
  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  const marks = [[0, 'HOY'], [4500, 'Pirámides\nde Egipto'], [11700, 'Fin de la\nglaciación'], [31700, 'Pinturas\nrupestres']];
  marks.forEach(([ya, lab], i) => {
    const xx = X(ya), up = i % 2 === 0;
    ctx.beginPath(); ctx.arc(xx, y, 16, 0, Math.PI * 2); kit.shape(ctx, '#f8fafc', 5);
    lab.split('\n').forEach((ln, j) => kit.text(ctx, ln, xx, (up ? y - 120 : y + 90) + j * 44, { size: 36, weight: 800, lw: 8 }));
    kit.text(ctx, ya ? `${kit.nf(ya)} años` : '', xx, up ? y - 40 - 0 : y + 50, { size: 26, weight: 700, lw: 6, fill: '#c4b5fd' });
  });
  // Marcador que viaja hacia el pasado.
  const mx = X(Math.min(span, yearsAgo));
  ctx.beginPath(); ctx.moveTo(mx, y - 36); ctx.lineTo(mx - 22, y - 76); ctx.lineTo(mx + 22, y - 76); ctx.closePath(); kit.shape(ctx, kit.YELLOW, 5);
  ctx.fillStyle = 'rgba(250,204,21,0.35)'; ctx.fillRect(mx, y - 6, x1 - mx, 12);
}

function drawBars(ctx, kit, W, t) {
  const bx = 110, bw = W - 220;
  // Mil millones de segundos = 31.7 años → barra completa. 1 millón = 11.6 días → 0.1% de la barra.
  kit.text(ctx, 'Mil millones de segundos', W / 2, 600, { size: 42, weight: 800, lw: 8 });
  kit.roundRect(ctx, bx, 640, bw, 70, 16); kit.shape(ctx, '#a78bfa', 6);
  kit.text(ctx, '31.7 años', W / 2, 675, { size: 40, fill: '#ffffff' });
  kit.text(ctx, '1 millón de segundos', W / 2, 820, { size: 42, weight: 800, lw: 8 });
  const w1 = Math.max(3, (bw * 11.574) / 11574);
  ctx.fillStyle = kit.YELLOW; ctx.fillRect(bx, 860, w1, 70); ctx.lineWidth = 3; ctx.strokeStyle = kit.INK; ctx.strokeRect(bx, 860, w1, 70);
  const bob = Math.sin(t * 4) * 8;
  kit.text(ctx, '← 11.6 días: ¡menos de 1 píxel!', bx + 40 + bob, 895, { size: 34, weight: 800, lw: 7, align: 'left', fill: kit.YELLOW });
  kit.text(ctx, '×1,000', W / 2, 1080, { size: 120, fill: kit.YELLOW });
}
