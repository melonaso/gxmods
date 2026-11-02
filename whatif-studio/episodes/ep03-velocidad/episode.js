// Episodio 03: cada paso 1% más rápido. Velocidad v(n) = 1.4 · 1.01^n (crecimiento exponencial).
// El protagonista queda en z=0 y el paisaje se desplaza hacia atrás (cinta infinita).
import { ease, lerp } from '../../engine/timeline.js';

const V0 = 1.4;          // m/s caminando
const CHUNK = 1600;      // largo del tramo de paisaje que se repite
const NLINES = 140;      // líneas de velocidad

let hero, scenery = [], road, lines = [], cone, heat, stars, skyDay, skyNight;
let trace = null;        // integración acumulada del desplazamiento visual (determinista)

const speedAt = (n) => V0 * Math.pow(1.01, n);
// Velocidad "visual" del paisaje: comprimida (raíz) para que se lea en pantalla sin volverse ruido.
const visualSpeed = (v) => 2.2 * Math.pow(v, 0.62);
const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

export function setup({ THREE, world, actors }) {
  const { scene, rng } = world;
  skyDay = scene.background.clone();
  skyNight = new THREE.Color('#05060f');

  hero = actors.createPerson({ shirt: '#0ea5e9', pants: '#111827', hair: '#7a4a20' });
  scene.add(hero);

  road = actors.createRoad(CHUNK + 40, 10);
  road.position.y = 0.12;
  scene.add(road);

  // Los parches de pasto del mundo también se mueven, para que el suelo transmita velocidad.
  scene.children.filter((o) => o.isMesh && o.geometry.type === 'CircleGeometry')
    .forEach((o) => scenery.push({ obj: o, z0: o.position.z }));

  const hc = ['#f4e1c1', '#e0f2fe', '#fce7f3', '#dcfce7', '#fef3c7'], rc = ['#b45309', '#7c2d12', '#1e3a8a', '#991b1b'];
  let k = 0;
  for (let z = -CHUNK / 2; z < CHUNK / 2; z += 18 + rng() * 16) {
    for (const side of [-1, 1]) {
      const x = side * (13 + rng() * 10);
      let o;
      if (rng() < 0.4) { o = actors.createHouse(hc[k % 5], rc[k % 4]); k++; o.rotation.y = -side * Math.PI / 2; }
      else o = actors.createTree(rng, 6 + rng() * 5);
      o.position.set(x, 0, z); scene.add(o); scenery.push({ obj: o, z0: z });
    }
  }
  // Postes a la orilla: dan una referencia rítmica de velocidad.
  for (let z = -CHUNK / 2; z < CHUNK / 2; z += 25) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6, 0.25), actors.mat('#e5e7eb'));
    p.position.set(7, 3, z); p.castShadow = true; scene.add(p); scenery.push({ obj: p, z0: z });
  }
  const bc = ['#cbd5e1', '#e2e8f0', '#94a3b8', '#d6d3d1', '#fecaca', '#bfdbfe'];
  for (let i = 0; i < 30; i++) {
    const side = i % 2 ? 1 : -1;
    const b = actors.createBuilding(20 + rng() * 50, 12 + rng() * 8, bc[i % 6]);
    const z = -CHUNK / 2 + rng() * CHUNK;
    b.position.set(side * (70 + rng() * 300), 0, z); scene.add(b); scenery.push({ obj: b, z0: z });
  }

  // Líneas de velocidad alrededor del corredor.
  const lm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
  for (let i = 0; i < NLINES; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1), lm);
    const a = rng() * Math.PI * 2, r = 1.2 + rng() * 6;
    l.userData = { x: Math.cos(a) * r, y: 1 + Math.abs(Math.sin(a)) * r * 0.8, z0: rng() * 120 - 60 };
    scene.add(l); lines.push(l);
  }

  // Cono de Mach: la onda de choque que se forma al superar la velocidad del sonido.
  cone = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  cone.rotation.x = -Math.PI / 2; // punta hacia adelante (+z)
  scene.add(cone);

  // Calor: capa incandescente frente al corredor (aire comprimido).
  heat = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  heat.rotation.x = Math.PI / 2; // casquete orientado hacia +z
  scene.add(heat);

  // Estrellas (aparecen al salir de la atmósfera).
  const pts = [];
  for (let i = 0; i < 1500; i++) {
    const u = rng() * 2 - 1, th = rng() * Math.PI * 2, r = 5000;
    pts.push(Math.sqrt(1 - u * u) * Math.cos(th) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(th) * r);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(stars);
}

/** Pasos (continuos) en el instante local de la escena. */
function stepsAt(s, local) {
  const goal = s.reach === 'all' ? s.audio : Math.max(1.5, s.cueTimes[0]?.[1] ?? s.audio);
  return lerp(s.n0, s.n1, ease.inOut(Math.min(1, local / goal)));
}

/** Desplazamiento visual acumulado hasta t (integración numérica, siempre igual para el mismo t). */
function offsetAt(scenes, t) {
  if (!trace) trace = { t: 0, off: 0 };
  if (t < trace.t) trace = { t: 0, off: 0 };
  const dt = 1 / 60;
  let { t: tt, off } = trace;
  let si = 0;
  while (tt < t) {
    const h = Math.min(dt, t - tt);
    while (si < scenes.length - 1 && tt >= scenes[si].start + scenes[si].dur) si++;
    const s = scenes[si];
    off += visualSpeed(speedAt(stepsAt(s, tt - s.start))) * h;
    tt += h;
  }
  trace = { t: tt, off };
  return off;
}

export function update({ world, scenes, THREE }, { t, scene: s, local }) {
  const n = stepsAt(s, local);
  const v = speedAt(n);
  const off = offsetAt(scenes, t);

  // Despegue: altura del corredor (escena de escape y cierre).
  const liftP = s.lift ? ease.in(Math.min(1, local / s.dur)) * s.lift + (s.id === 'outro' ? 0.15 : 0) : 0;
  const alt = s.id === 'outro' ? lerp(15, 2600, ease.in(Math.min(1, local / s.dur))) : liftP * 100;

  hero.position.set(0, alt, 0);
  const runRate = Math.min(9, 1 + Math.log2(1 + v)); // zancada más rápida (con tope legible)
  hero.userData.pose(t * runRate, alt > 1 ? 'cheer' : 'walk');
  hero.rotation.x = alt > 1 ? 0.5 : Math.min(0.2, v / 200);

  // Paisaje en cinta: z = z0 - desplazamiento, envuelto dentro del tramo.
  for (const it of scenery) {
    const z = ((it.z0 - off) % CHUNK + CHUNK * 1.5) % CHUNK - CHUNK / 2;
    it.obj.position.z = z;
  }
  road.position.z = -(off % 6);

  // Líneas de velocidad: visibles desde ~40 km/h, más largas y opacas cuanto más rápido.
  // Sin aire en el espacio: las líneas se desvanecen al ganar altura.
  const lineA = Math.min(0.85, Math.max(0, Math.log10(v / 10)) * 0.5) * Math.max(0, 1 - alt / 600);
  const len = Math.min(40, 0.5 + v / 60);
  lines.forEach((l, i) => {
    const d = l.userData;
    const z = ((d.z0 - off * 1.6) % 120 + 180) % 120 - 60;
    l.position.set(d.x, d.y + alt, z);
    l.scale.z = len;
    l.material.opacity = lineA;
  });

  // Cono de Mach: ángulo μ = asin(1/M); más cerrado cuanto mayor es M.
  const M = v / 343;
  cone.visible = !!s.cone && M >= 0.98;
  if (cone.visible) {
    const mu = Math.asin(1 / Math.max(1, M));
    const L = 9, R = Math.max(0.6, Math.tan(mu) * L);
    cone.scale.set(R, L, R);
    cone.position.set(0, 1 + alt, -L / 2 + 0.6);
    cone.material.opacity = 0.18 + 0.12 * Math.abs(Math.sin(t * 9));
  }
  // Calor: aparece a partir de Mach ~4.
  const hA = s.heat ? Math.min(0.75, Math.max(0, (M - 3.5) / 4)) * Math.max(0, 1 - alt / 600) : 0;
  heat.visible = hA > 0;
  heat.scale.setScalar(1.5);
  heat.position.set(0, 1.0 + alt, 0.6);
  heat.material.opacity = hA * (0.8 + 0.2 * Math.sin(t * 20));

  // Cielo: se oscurece al subir.
  const night = Math.min(1, alt / 1800);
  world.scene.background.copy(skyDay).lerp(skyNight, night);
  world.scene.fog.color.copy(world.scene.background);
  stars.material.opacity = Math.max(0, (night - 0.35) / 0.65);
  stars.position.set(0, alt, 0);

  // Cámara orbital alrededor del corredor, con transición suave entre escenas.
  const prev = scenes[Math.max(0, s.index - 1)].cam;
  const w = ease.inOut(Math.min(1, local / 1.8));
  const cam = {};
  for (const key of ['dist', 'h', 'yaw']) cam[key] = lerp(prev[key], s.cam[key], w);
  const shake = M > 1 ? Math.min(0.15, M * 0.01) : 0;
  world.camera.position.set(
    Math.sin(cam.yaw) * cam.dist + Math.sin(t * 37) * shake,
    alt + cam.h + Math.sin(t * 41) * shake,
    Math.cos(cam.yaw) * cam.dist);
  world.camera.lookAt(0, alt + 1.1, 0);
  world.camera.far = 9000;
  world.camera.updateProjectionMatrix();
  world.fitToScale({ x: 0, y: 0, z: 0 }, 14 + alt * 0.5);
  world.scene.fog.near = 120 + alt * 0.5;
  world.scene.fog.far = 750 + alt * 2.5;

  // Capa de texto.
  const kmh = v * 3.6;
  const counter = {
    label: M >= 1 ? `VELOCIDAD · MACH ${nf(M, 1)}` : 'VELOCIDAD',
    value: kmh < 100 ? `${nf(kmh, 1)} km/h` : `${nf(kmh)} km/h`,
    color: M >= 1 ? '#fb923c' : '#ffd34d',
  };
  const chip = `PASO ${Math.round(n)}`;
  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro'
      ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5))
      : Math.min(1, Math.max(0, (local / s.dur - 0.55) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}
