// Episodio 01: crecer 1 cm por día. Define el escenario (setup) y qué se ve en cada instante (update).
import { ease, lerp } from '../../engine/timeline.js';

const BASE_H = 1.70;   // estatura inicial (m)
const BASE_KG = 70;    // peso inicial (kg)
const heightAt = (day) => BASE_H + 0.01 * day;
// Ley cuadrado-cubo: el volumen (y el peso) crece con el cubo de la escala.
const weightAt = (h) => BASE_KG * Math.pow(h / BASE_H, 3);

const nf = (n, dec) => n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtHeight = (h) => `${nf(h, h < 10 ? 2 : h < 100 ? 1 : 0)} m`;
const fmtWeight = (kg) => (kg < 1000 ? `${nf(kg, 0)} kg` : `${nf(kg / 1000, kg < 10000 ? 2 : 0)} t`);

let hero, crowd = [];

export function setup({ THREE, world, actors }) {
  const { scene, rng } = world;
  const add = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; scene.add(o); return o; };
  // Ángulo respecto al eje +z (donde suele estar la cámara); evita tapar al protagonista.
  const inFront = (x, z) => Math.abs(Math.atan2(x, z)) < 1.0;

  hero = createHeroAt(actors, scene);

  // Casa vecina para comparar tamaños en los primeros minutos.
  add(actors.createHouse('#fde68a', '#b91c1c'), -9, -3, 0.5);
  add(actors.createRoad(900), 0, -16, Math.PI / 2);

  const houseColors = ['#f4e1c1', '#e0f2fe', '#fce7f3', '#dcfce7', '#fef3c7'];
  const roofColors = ['#b45309', '#7c2d12', '#1e3a8a', '#991b1b'];
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, r = 16 + rng() * 45;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inFront(x, z) || Math.abs(z + 16) < 7) continue;
    add(actors.createHouse(houseColors[i % 5], roofColors[i % 4]), x, z, rng() * 6);
  }
  for (let i = 0; i < 120; i++) {
    const a = rng() * Math.PI * 2, r = 10 + rng() * 160;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inFront(x, z) && r < 60) continue;
    if (Math.abs(z + 16) < 6) continue;
    add(actors.createTree(rng, 6 + rng() * 6), x, z);
  }
  // Ciudad: edificios cada vez más lejos y más altos.
  const bColors = ['#cbd5e1', '#e2e8f0', '#94a3b8', '#d6d3d1', '#fecaca', '#bfdbfe'];
  for (let i = 0; i < 70; i++) {
    const a = rng() * Math.PI * 2, r = 80 + rng() * 520;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inFront(x, z) && r < 300) continue;
    const h = 18 + rng() * (r > 250 ? 90 : 30);
    add(actors.createBuilding(h, 12 + rng() * 10, bColors[i % 6]), x, z, rng());
  }
  // Torre de celosía genérica de 330 m (referencia para el final).
  const tower = new THREE.Group();
  const tm = actors.mat('#8a6a46');
  const levels = [[60, 0, 60], [34, 60, 60], [18, 120, 100], [6, 220, 110]];
  for (const [w, y, hh] of levels) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.72, hh, 4, 1, true), tm);
    seg.position.y = y + hh / 2; seg.rotation.y = Math.PI / 4; seg.castShadow = true;
    tower.add(seg);
  }
  add(tower, 230, -330);

  crowd = actors.createCrowd(rng, 70, 0, 0, 0, 1);
  crowd.forEach((p) => scene.add(p));
}

function createHeroAt(actors, scene) {
  const p = actors.createPerson({ shirt: '#22c55e', pants: '#1e3a8a', skin: '#e8b48a', hair: '#2b1a10' });
  scene.add(p);
  return p;
}

export function update({ world, scenes }, { t, scene: s, local, p }) {
  const day = lerp(s.d0, s.d1, ease.inOut(Math.min(1, local / Math.max(s.audio, 0.5))));
  const h = heightAt(day);

  // Protagonista: escala uniforme (1 unidad = 1.70 m a escala 1).
  hero.scale.setScalar(h / BASE_H);
  hero.userData.pose(t, s.pose || 'idle');

  // Multitud: se mantiene a una distancia proporcional al gigante, detrás y a los lados.
  crowd.forEach((c, i) => {
    const a = 1.45 + (i / crowd.length) * (Math.PI * 2 - 2.9) + Math.sin(i * 12.9) * 0.08;
    const r = Math.max(4, h * 1.1) + 2 + (i % 7) * Math.max(0.8, h * 0.08);
    c.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
    c.rotation.y = Math.atan2(-c.position.x, -c.position.z);
    c.userData.pose(t, s.crowd || 'idle', c.userData.phase);
  });

  // Cámara: parámetros de la escena, con transición suave desde la escena anterior.
  const prev = scenes[Math.max(0, s.index - 1)].cam;
  const w = ease.inOut(Math.min(1, local / 1.6));
  const cam = {
    dist: lerp(prev.dist, s.cam.dist, w),
    yaw: lerp(prev.yaw, s.cam.yaw, w) + Math.sin(t * 0.25) * 0.08, // leve vaivén
    lift: lerp(prev.lift, s.cam.lift, w),
  };
  const D = h * cam.dist + 2.5;
  const shake = s.id === 'anio50' ? Math.pow(Math.max(0, Math.sin(t * 3.9)), 16) * h * 0.012 : 0;
  world.camera.position.set(Math.sin(cam.yaw) * D, h * cam.lift * 0.55 + 1.2 + shake, Math.cos(cam.yaw) * D);
  world.camera.lookAt(0, h * cam.lift, 0);
  world.fitToScale({ x: 0, y: h * 0.3, z: 0 }, h * 1.4 + 8);

  // Capa de texto.
  const years = day / 365;
  const chip = day < 365 ? `DÍA ${Math.floor(day)}` : `AÑO ${Math.floor(years)}`;
  const counter = s.counter === 'weight'
    ? { label: 'PESO', value: fmtWeight(weightAt(h)), color: '#fb7185' }
    : { label: 'ALTURA', value: fmtHeight(h) };

  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro'
      ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5))
      : Math.min(1, Math.max(0, (p - 0.55) / 0.08));
    title = { lines: s.titleCard, alpha: a };
  }
  const ov = { counter, chip, title };
  if (title && title.alpha > 0.5) ov.subtitle = null; // la tarjeta ya muestra el texto
  return ov;
}
