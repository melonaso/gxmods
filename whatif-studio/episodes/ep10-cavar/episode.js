// Episodio 10: cada día cavas 1 metro hacia abajo. Profundidad del día n: n metros.
// Patio con un hoyo real (el suelo tiene un hueco de 1 m × 1 m), corte del terreno por capas (un plano
// en z = 0 que pasa por el centro del hoyo), cerro de tierra que crece (cono con taludes de 35°),
// Torre Eiffel, mina más profunda, pozo de Kola, Everest, corteza y la Tierra cortada hasta el centro.
import { ease, lerp } from '../../engine/timeline.js';
import * as MD from '../../engine/models.js';
import * as TX from '../../engine/textures.js';
import { dressWorld } from '../../engine/town.js';
import { bake, solidOverlaps } from '../../engine/bake.js';
import { earthTexture } from '../../engine/planet.js';

const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const TAN = Math.tan((35 * Math.PI) / 180);          // talud natural de la tierra suelta (35°)
/** Cerro cónico con V m³: V = π r² h / 3 y r = h / tan 35°  →  h = (3 V tan² 35° / π)^(1/3). */
const pileH = (V) => Math.cbrt((3 * V * TAN * TAN) / Math.PI);
const fmtD = (m) => (m < 10 ? `${nf(m, 2)} m` : m < 1000 ? `${nf(m, 0)} m` : m < 100000 ? `${nf(m / 1000, 2)} km` : `${nf(m / 1000, 0)} km`);

const HOUSE = { x: -11, z: 9 }, CAR = { x: -4.6, z: 1.6 }, APT = { x: -40, z: 30 }, EIFFEL = { x: -200, z: 70 }, EVEREST = { x: -17000, z: 10500 };
const PLANET = new Float32Array([0, 2.0e6, 0]), RP = 637.1;   // la Tierra a escala 1:10,000, lejos de todo
const CROSS = ['semana', 'agua', 'mes', 'anio', 'mina', 'kola', 'corteza'];

let T, dress, face, faceU, holeBox, holeMat, water, pile, pileCap, ghost, tripod, rope, bucket, ladder, hose, pump;
let digger, shovel, clods = [], eiffel, everest, planet, pathLine, planetStars, apt, house, labelsAt = {};
const CUT = [];

export function setup(C) {
  const { THREE, world } = C;
  T = THREE;
  const { scene, renderer } = world;
  renderer.localClippingEnabled = true;
  CUT.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)); // conserva z ≥ 0 (lo que está detrás del corte)
  dress = dressWorld(world, { top: '#4f9ee3', horizon: '#d3ecfa', ground: 'grass' });
  world.sun.intensity = 2.6;

  // ---------------- Suelo con un hueco de 1 m × 1 m en el origen (y 400 km de ancho) ---------------
  {
    const G = 200000, V = THREE.Vector2;
    const sh = new THREE.Shape([new V(-G, -G), new V(G, -G), new V(G, G), new V(-G, G)]);
    sh.holes.push(new THREE.Path([new V(-0.5, -0.5), new V(-0.5, 0.5), new V(0.5, 0.5), new V(0.5, -0.5)]));
    const geo = new THREE.ShapeGeometry(sh);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 10000) / 20000, (p.getY(i) + 10000) / 20000); // igual que el plano original
    world.ground.geometry.dispose(); world.ground.geometry = geo;
  }

  const before = new Set(scene.children);
  // ---------------- El barrio (estático: se hornea) ------------------------------------------------
  house = MD.createHouseHQ({ w: 9, d: 8, floors: 2, wall: 'siding', wallColor: '#dbeafe', roofColor: '#7f1d1d', door: '#1e3a8a', seed: 21 });
  house.position.set(HOUSE.x, 0, HOUSE.z); house.rotation.y = Math.PI; scene.add(house);
  const car = MD.createCar({ color: '#dc2626' }); car.position.set(CAR.x, 0.02, CAR.z); scene.add(car);
  const pad = new THREE.Mesh(MD.boxUV(6.2, 0.05, 3.2, 1), new THREE.MeshStandardMaterial({ ...TX.concrete(), roughness: 0.95 })); pad.position.set(CAR.x, 0.02, CAR.z); pad.receiveShadow = true; scene.add(pad);
  apt = MD.createApartment({ floors: 10, w: 18, d: 16, color: '#fde68a', seed: 5 }); apt.position.set(APT.x, 0, APT.z); scene.add(apt);
  const h2 = MD.createHouseHQ({ w: 9, d: 8, floors: 1, wall: 'brick', wallColor: '#b5563b', roofColor: '#374151', seed: 22 }); h2.position.set(-25, 0, 10); h2.rotation.y = Math.PI; scene.add(h2);
  const h3 = MD.createHouseHQ({ w: 9.5, d: 8, floors: 2, wall: 'siding', wallColor: '#fef3c7', roofColor: '#1e3a8a', seed: 23 }); h3.position.set(18, 0, 44); h3.rotation.y = Math.PI; scene.add(h3);
  const h4 = MD.createHouseHQ({ w: 9, d: 8, floors: 1, wall: 'siding', wallColor: '#dcfce7', roofColor: '#9a3412', seed: 24 }); h4.position.set(-2, 0, 46); h4.rotation.y = Math.PI; scene.add(h4);
  const rng = MD.mulberry(1010);
  for (const [x, z, h] of [[-19, 18, 7], [-3, 21, 8], [-27, 19, 9], [8, 30, 7.5], [62, 30, 9], [75, 8, 8], [-58, 8, 9], [-62, 40, 10], [40, 60, 9], [-20, 62, 8]]) {
    const t = MD.createTreeHQ({ h, seed: (rng() * 1e6) | 0 }); t.position.set(x, 0, z); scene.add(t);
  }
  for (const [x, z] of [[-8.6, 3.6], [-14.5, 3.6], [-19.6, 3.6]]) { const b = MD.createBush({ size: 1, seed: (rng() * 1e6) | 0 }); b.position.set(x, 0, z); scene.add(b); }
  const staticRoots = scene.children.filter((o) => !before.has(o));
  world.userData.preOverlaps = solidOverlaps(staticRoots);
  bake(scene, staticRoots);

  const dirt = TX.dirt();
  const dirtMat = (rep = [1, 1], o = {}) => {
    const m = dirt.map.clone(), n = dirt.normalMap.clone(); m.repeat.set(...rep); n.repeat.set(...rep); m.needsUpdate = n.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.97, ...o });
  };

  // ---------------- El hoyo: paredes y fondo (cara interior de una caja) --------------------------
  holeMat = dirtMat([1, 1], { side: THREE.BackSide });
  holeBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), holeMat); holeBox.receiveShadow = true; scene.add(holeBox);
  water = new THREE.Mesh(new THREE.BoxGeometry(0.99, 1, 0.99), new THREE.MeshStandardMaterial({ color: '#2b6c8f', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }));
  water.visible = false; scene.add(water);

  // ---------------- Cerro de tierra (cono) + su corte + cono fantasma del doble de alto ----------
  pile = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 72, 8, true), dirtMat([6, 2]));
  pile.castShadow = pile.receiveShadow = true; scene.add(pile);
  {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 0, 1, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 4, 0, 2, 1.4], 2)); g.computeVertexNormals();
    pileCap = new THREE.Mesh(g, dirtMat([1, 1], { side: THREE.DoubleSide })); scene.add(pileCap);
  }
  ghost = new THREE.Group();
  ghost.add(new THREE.Mesh(new THREE.ConeGeometry(1, 1, 72, 1, true), new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })));
  ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ConeGeometry(1, 1, 24, 1, true)), new THREE.LineBasicMaterial({ color: '#facc15' })));
  ghost.visible = false; scene.add(ghost);

  // ---------------- Herramientas: trípode con polea, cuerda, cubeta, escalera, bomba ------------
  const wood = new THREE.MeshStandardMaterial({ ...TX.wood('#9a6b3c'), roughness: 0.85 });
  const metal = MD.M('#94a3b8', { metalness: 0.6, roughness: 0.35 });
  tripod = new THREE.Group(); scene.add(tripod);
  const apex = new THREE.Vector3(0, 2.5, 0.15);
  for (const f of [[-1.2, 0.35], [1.2, 0.35], [0, 1.5]]) {
    const foot = new THREE.Vector3(f[0], 0, f[1]), len = foot.distanceTo(apex);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, len, 8), wood); leg.castShadow = true;
    leg.position.copy(foot).add(apex).multiplyScalar(0.5); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), apex.clone().sub(foot).normalize()); tripod.add(leg);
  }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), metal); wheel.position.copy(apex).add(new THREE.Vector3(0, -0.1, 0)); tripod.add(wheel);
  rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), MD.M('#d6b98c')); scene.add(rope);
  bucket = new THREE.Group(); scene.add(bucket);
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.32, 18, 1, true), MD.M('#64748b', { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide })); b.castShadow = true; bucket.add(b);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18), MD.M('#475569')); bot.rotation.x = -Math.PI / 2; bot.position.y = -0.16; bucket.add(bot);
    const fill = new THREE.Mesh(new THREE.CircleGeometry(0.19, 18), dirtMat()); fill.rotation.x = -Math.PI / 2; fill.position.y = 0.12; bucket.add(fill);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 6, 20, Math.PI), metal); handle.position.y = 0.16; bucket.add(handle); }
  ladder = new THREE.Group(); scene.add(ladder);
  { const rail = new THREE.CylinderGeometry(0.025, 0.025, 1, 6);
    for (const sx of [-0.2, 0.2]) { const r = new THREE.Mesh(rail, metal); r.position.x = sx; r.userData.rail = true; ladder.add(r); }
    ladder.userData.rungs = [];
    for (let i = 0; i < 160; i++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 6), metal); g.rotation.z = Math.PI / 2; ladder.add(g); ladder.userData.rungs.push(g); } }
  ladder.position.set(0.22, 0, 0.42);
  pump = new THREE.Group(); scene.add(pump);
  { const body = new THREE.Mesh(MD.boxUV(0.7, 0.5, 0.45, 1), MD.M('#15803d', { roughness: 0.5 })); body.position.y = 0.25; body.castShadow = true; pump.add(body);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 14), MD.M('#334155', { metalness: 0.4 })); motor.rotation.z = Math.PI / 2; motor.position.set(0.1, 0.62, 0); pump.add(motor); }
  pump.position.set(-1.7, 0, 1.2);
  hose = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8), MD.M('#111827', { roughness: 0.6 })); scene.add(hose);

  // ---------------- Quien cava: casco amarillo y pala en la mano derecha ------------------------
  digger = MD.createCharacter({ seed: 77, shirt: '#ea580c', pants: '#1e3a8a', hairStyle: 'cap', capColor: '#facc15', skin: '#d8a27a' });
  scene.add(digger);
  shovel = new THREE.Group();
  { const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 8), MD.M('#a16207', { roughness: 0.7 })); handle.position.y = -0.45; shovel.add(handle);
    const blade = new THREE.Mesh(MD.boxUV(0.22, 0.28, 0.02, 1), MD.M('#9ca3af', { metalness: 0.7, roughness: 0.35 })); blade.position.y = -1.05; shovel.add(blade);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), MD.M('#111827')); grip.rotation.z = Math.PI / 2; grip.position.y = 0.05; shovel.add(grip); }
  shovel.position.set(0, -0.25, 0.02); digger.userData.hands[1].add(shovel);
  for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 + (i % 3) * 0.02, 0), MD.M('#6b4528', { roughness: 1 })); c.castShadow = true; c.visible = false; scene.add(c); clods.push(c); }

  // ---------------- El corte del terreno: plano con capas calculadas en el sombreador -----------
  faceU = { uD: { value: 1 }, uHalf: { value: 0.5 }, uSlot: { value: 1 } };
  const fm = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false, toneMapped: false });
  fm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, faceU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos; uniform float uD; uniform float uHalf; uniform float uSlot;
float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y); }
// Ruido que se apaga cuando su detalle es más chico que un píxel (así no "hormiguea").
float nz(vec2 p, float fr){ float w = (fwidth(p.x) + fwidth(p.y)) * fr; return (vn(p * fr) - 0.5) * (1.0 - smoothstep(0.3, 0.9, w)); }
vec3 strata(vec2 p){
  float d = -p.y, x = p.x; vec3 c;
  float b2 = 1.4 + 0.15 * sin(x * 0.9) + 0.08 * sin(x * 2.3);
  float b3 = 6.0 + 0.5 * sin(x * 0.31 + 1.0);
  float b4 = 9.0 + 0.4 * sin(x * 0.23 + 2.0);
  float b5 = 15.0 + 1.0 * sin(x * 0.11);
  float b6 = 60.0 + 6.0 * sin(x * 0.03);
  float moho = 35000.0 + 900.0 * sin(x * 0.00025);
  if (d < 0.22) c = vec3(0.27, 0.45, 0.12) + nz(p, 20.0) * 0.08;
  else if (d < b2) c = vec3(0.29, 0.19, 0.11) + nz(p, 14.0) * 0.12 + nz(p, 3.0) * 0.06;
  else if (d < b3) c = vec3(0.50, 0.34, 0.20) + nz(p, 10.0) * 0.09 + nz(p, 2.0) * 0.06;
  else if (d < b4) c = vec3(0.62, 0.36, 0.21) + nz(p, 6.0) * 0.07 + 0.03 * sin(d * 9.0);
  else if (d < b5) { c = vec3(0.56, 0.51, 0.42) + nz(p, 5.0) * 0.16 + nz(p, 1.5) * 0.06; if (d > 10.0) c = mix(c, vec3(0.30, 0.45, 0.58), 0.4); }
  else if (d < b6) c = vec3(0.50, 0.46, 0.42) + nz(p, 1.2) * 0.12 + nz(p, 0.25) * 0.06;
  else if (d < moho) {
    c = vec3(0.45, 0.44, 0.46) + nz(p, 0.25) * 0.08 + nz(p, 0.01) * 0.06 + nz(p, 0.0006) * 0.08 + 0.025 * sin(d * 0.004 + 6.0 * vn(p * 0.0004));
    c = mix(c, vec3(0.58, 0.33, 0.19), 0.8 * clamp(d / 35000.0, 0.0, 1.0));
  } else { float m = clamp((d - moho) / 15000.0, 0.0, 1.0); c = mix(vec3(0.86, 0.33, 0.08), vec3(0.98, 0.56, 0.13), m) + 0.06 * sin(x * 0.0004 + 3.0 * sin(d * 0.0003 + x * 0.0001)); }
  return c;
}`).replace('#include <color_fragment>', `#include <color_fragment>
  { vec2 p = vWPos.xy; float d = -p.y;
    if (abs(p.x) < uHalf && d < uD && d > -0.01) { if (uSlot > 0.5) discard; diffuseColor.rgb = vec3(0.06, 0.045, 0.035); }
    else { diffuseColor.rgb = pow(clamp(strata(p), 0.0, 1.0), vec3(2.2)); float e = smoothstep(0.0, 1.0, abs(abs(p.x) - uHalf) / max(fwidth(p.x) * 3.0, 1e-4)); if (d < uD && uSlot < 0.5) diffuseColor.rgb *= mix(0.55, 1.0, e); } }`);
  };
  face = new THREE.Mesh(new THREE.PlaneGeometry(120000, 60000, 1, 1), fm);
  face.rotation.y = Math.PI; face.position.set(0, -30000, 0); face.renderOrder = -1; scene.add(face);
  // Marcas horizontales sobre el corte (mina, Kola, corteza).
  labelsAt.lines = [];
  const bar = (y, x0, x1, color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, fog: false })); m.rotation.y = Math.PI; m.userData = { y, x0, x1 }; m.visible = false; scene.add(m); labelsAt.lines.push(m); return m; };
  labelsAt.mina = bar(-4000, -2600, -60, '#facc15');
  labelsAt.kola = bar(-12262, -24000, -200, '#facc15');
  labelsAt.moho = bar(-35000, -60000, 60000, '#fde68a');

  // ---------------- Torre Eiffel (330 m): cuatro patas curvas con celosía ------------------------
  eiffel = new THREE.Group();
  {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 2048; const g = cv.getContext('2d');
    g.strokeStyle = '#fff'; g.lineWidth = 7;
    for (let y = 0; y < 2048; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + 64); g.moveTo(256, y); g.lineTo(0, y + 64); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    g.fillStyle = '#fff'; g.fillRect(0, 0, 26, 2048); g.fillRect(230, 0, 26, 2048);
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(128, 2048, 96, 330, 0, 0, Math.PI * 2); g.fill();
    const alpha = new THREE.CanvasTexture(cv); alpha.wrapS = THREE.RepeatWrapping; alpha.repeat.set(4, 1);
    const mat = new THREE.MeshStandardMaterial({ color: '#8b5e3c', roughness: 0.7, metalness: 0.2, alphaMap: alpha, alphaTest: 0.5, side: THREE.DoubleSide });
    const prof = []; for (let i = 0; i <= 40; i++) { const y = (i / 40) * 300; prof.push(new THREE.Vector2(3 + 60 * Math.pow(1 - y / 300, 2.3), y)); }
    const legs = new THREE.Mesh(new THREE.LatheGeometry(prof, 4), mat); legs.rotation.y = Math.PI / 4; legs.castShadow = true; eiffel.add(legs);
    for (const [y, s] of [[57, 0.62], [116, 0.36], [276, 0.07]]) { const r = 3 + 60 * Math.pow(1 - y / 300, 2.3); const pl = new THREE.Mesh(new THREE.BoxGeometry(r * 1.55, 4, r * 1.55), MD.M('#7c5233')); pl.position.y = y; pl.castShadow = true; eiffel.add(pl); void s; }
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.5, 30, 8), MD.M('#7c5233')); spire.position.y = 315; eiffel.add(spire);
  }
  eiffel.position.set(EIFFEL.x, 0, EIFFEL.z); eiffel.visible = false; scene.add(eiffel);

  // ---------------- Everest (8,849 m): montaña con nieve arriba -----------------------------------
  {
    const geo = new THREE.ConeGeometry(9800, 8849, 96, 30, true), p = geo.attributes.position, col = [];
    const r = MD.mulberry(88);
    const ridge = Array.from({ length: 12 }, () => [r() * Math.PI * 2, 0.08 + r() * 0.12]);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) + 8849 / 2, z = p.getZ(i), a = Math.atan2(z, x), h = y / 8849;
      let k = 1; for (const [ra, amp] of ridge) k += amp * Math.cos(5 * (a - ra)) * 0.25;
      k += 0.06 * Math.sin(a * 17 + h * 9) * (1 - h) + 0.035 * Math.sin(a * 41 + h * 23) + (r() - 0.5) * 0.03;
      p.setXYZ(i, x * k, y, z * k);
      const snow = 0.7 + 0.06 * Math.sin(a * 9), g = 0.9 + r() * 0.15;
      const c = h > snow ? [0.95, 0.96, 0.98] : h > 0.42 ? [0.5 * g, 0.48 * g, 0.47 * g] : [0.44 * g, 0.41 * g, 0.33 * g];
      col.push(...c);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    everest = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    everest.position.set(EVEREST.x, 0, EVEREST.z); everest.visible = false; scene.add(everest);
  }

  // ---------------- La Tierra cortada (escala 1:10,000) -------------------------------------------
  planet = new THREE.Group(); planet.position.set(PLANET[0], PLANET[1], PLANET[2]); planet.visible = false; scene.add(planet);
  {
    const ps = Math.PI / 2, pl = (3 * Math.PI) / 2;
    const geo = new THREE.SphereGeometry(RP, 160, 96, ps, pl);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (ps + uv.getX(i) * pl) / (2 * Math.PI));
    const tex = earthTexture();
    planet.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.9, fog: false })));
    // Caras del corte: capas en anillos (núcleo interno, externo, manto y corteza).
    const cv = document.createElement('canvas'); cv.width = cv.height = 2048; const g = cv.getContext('2d'), c0 = 1024;
    const ring = (f, a, b) => { const gr = g.createRadialGradient(c0, c0, 0, c0, c0, f * c0); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.beginPath(); g.arc(c0, c0, f * c0, 0, Math.PI * 2); g.fill(); };
    ring(1, '#7c2d12', '#78350f');
    ring(6336 / 6371, '#f97316', '#c2410c');
    ring(3481 / 6371, '#fde047', '#fb923c');
    ring(1221 / 6371, '#fffbeb', '#fde68a');
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; for (const f of [3481, 1221]) { g.beginPath(); g.arc(c0, c0, (f / 6371) * c0, 0, Math.PI * 2); g.stroke(); }
    const ft = new THREE.CanvasTexture(cv); ft.colorSpace = THREE.SRGBColorSpace;
    const fmat = new THREE.MeshBasicMaterial({ map: ft, fog: false, side: THREE.DoubleSide });
    const f1 = new THREE.Mesh(new THREE.CircleGeometry(RP, 128, Math.PI / 2, Math.PI), fmat); planet.add(f1);               // plano z = 0, x < 0
    const f2 = new THREE.Mesh(new THREE.CircleGeometry(RP, 128, -Math.PI / 2, Math.PI), fmat); f2.rotation.y = -Math.PI / 2; planet.add(f2); // plano x = 0, z > 0
    pathLine = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), new THREE.MeshBasicMaterial({ color: '#ef4444', fog: false })); planet.add(pathLine);
    const N = 3000, pos = new Float32Array(N * 3), r = MD.mulberry(4);
    for (let i = 0; i < N; i++) { const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.set([Math.cos(th) * s * 6000, u * 6000, Math.sin(th) * s * 6000], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    planetStars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false })); planet.add(planetStars);
  }
}

/** Día (continuo) en el instante local de la escena; las escalas grandes avanzan en forma logarítmica. */
function dayAt(s, local) {
  if (s.d1 === s.d0) return s.d0;
  const k = ease.inOut(Math.min(1, Math.max(0, local) / (s.dur * 0.82)));
  if (s.d1 / Math.max(1, s.d0) > 8) return Math.exp(lerp(Math.log(Math.max(1, s.d0)), Math.log(s.d1), k));
  return lerp(s.d0, s.d1, k);
}

export function sfx(C) {
  const out = [], s1 = C.scenes.find((s) => s.id === 'dia1');
  for (let t = s1.start + 0.8; t < s1.start + s1.dur - 0.3; t += 1.2) out.push({ t, type: 'thud' });
  const at = (id, k, type) => { const s = C.scenes.find((x) => x.id === id); out.push({ t: s.start + s.dur * k, type }); };
  at('agua', 0.35, 'splash'); at('kola', 0.7, 'crack'); at('centro', 0.6, 'boom');
  return out.sort((a, b) => a.t - b.t);
}

export function update(C, { t, scene: s, local }) {
  const { world, W, H } = C;
  const THREE = T;
  const cross = CROSS.includes(s.id);
  const day = dayAt(s, local);
  const D = Math.max(0.02, day);                                    // profundidad en metros
  const V = s.id === 'cubo' ? lerp(100, 180, Math.min(1, local / (s.dur * 0.82))) : Math.min(D, 12262); // m³ en el cerro

  // ---------------- Corte y recortes --------------------------------------------------------------
  face.visible = cross;
  const clip = cross ? CUT : [];
  for (const m of [world.ground.material, holeMat, pile.material, water.material]) m.clippingPlanes = clip;

  // ---------------- Hoyo, agua, cerro --------------------------------------------------------------
  const holeD = Math.min(D, 60);
  holeBox.visible = !['kola', 'corteza', 'centro', 'mina', 'anio'].includes(s.id);
  holeBox.scale.set(1, holeD, 1); holeBox.position.set(0, -holeD / 2, 0);
  holeMat.map.repeat.set(1, holeD); holeMat.map.offset.set(0, -holeD); holeMat.normalMap.repeat.copy(holeMat.map.repeat); holeMat.normalMap.offset.copy(holeMat.map.offset);
  water.visible = holeBox.visible && D >= 10;
  water.scale.set(1, 0.35, 1); water.position.set(0, -D + 0.175, 0);
  const ph = pileH(V), pr = ph / TAN, pcx = 1.5 + pr;
  pile.visible = s.id !== 'intro' && s.id !== 'centro';
  pile.scale.set(pr, ph, pr); pile.position.set(pcx, ph / 2, 0);
  pileCap.visible = pile.visible && cross; pileCap.scale.set(pr, ph, 1); pileCap.position.set(pcx, 0.005, 0.002);
  ghost.visible = s.id === 'cubo' && local > 0.5;
  const gh = 2 * ph, gr = gh / TAN; ghost.scale.set(gr, gh, gr); ghost.position.set(pcx + pr + 2 + gr, gh / 2, 0);

  // ---------------- Herramientas ---------------------------------------------------------------
  const tools = !['intro', 'dia1'].includes(s.id) && !['corteza', 'centro'].includes(s.id);
  tripod.visible = tools;
  ladder.visible = tools && holeBox.visible;
  if (ladder.visible) {
    const L = holeD + 1.0;
    for (const r of ladder.children) if (r.userData.rail) { r.scale.y = L; r.position.y = -holeD + L / 2; }
    ladder.userData.rungs.forEach((g, i) => { const y = -holeD + 0.3 + i * 0.3; g.visible = y < 0.95; g.position.y = y; });
  }
  const pumping = holeBox.visible && D >= 10;
  pump.visible = hose.visible = pumping;
  hose.scale.set(1, holeD + 0.5, 1); hose.position.set(-0.38, -holeD / 2 + 0.25, 0.38);
  // La cubeta sube y baja por la cuerda.
  const per = 2.4 + Math.min(4, holeD * 0.15), u = (t % per) / per, tri = u < 0.5 ? u * 2 : 2 - u * 2;
  const by = lerp(-holeD + 0.45, 1.7, ease.inOut(tri));
  bucket.visible = rope.visible = tools && holeBox.visible;
  bucket.position.set(0, by, 0.15);
  const top = 2.38; rope.scale.set(1, top - by - 0.16, 1); rope.position.set(0, (top + by + 0.16) / 2, 0.15);

  // ---------------- Quien cava ----------------------------------------------------------------------
  digger.visible = holeBox.visible || s.id === 'outro' || s.id === 'intro';
  let mode = 'dig';
  if (s.id === 'intro') { digger.position.set(-1.1, 0, -0.6); digger.rotation.y = 0.6; mode = 'idle'; }
  else if (s.id === 'outro' || s.id === 'cerro2') { digger.position.set(pcx, ph - 0.05, 0); digger.rotation.y = -0.4; mode = 'wave'; }
  else { digger.position.set(-0.12, -Math.min(D, holeD) + (water.visible ? 0.05 : 0), -0.05); digger.rotation.y = 0.5; }
  if (s.id === 'cerro2') digger.visible = false;
  digger.userData.pose(t, mode, {});
  shovel.visible = mode !== 'wave';
  // Terrones que salen volando del hoyo al cerro (solo cuando el hoyo es poco hondo).
  for (let i = 0; i < clods.length; i++) {
    const c = clods[i], k = ((t * 0.85 + i * 0.1) % 1), active = s.id === 'dia1' && i < 5 && D < 1.3;
    c.visible = active;
    if (!active) continue;
    const x0 = 0.1, y0 = Math.max(0.1, -D + 1.0), x1 = pcx - pr * 0.3 + (i % 3) * 0.15, y1 = ph * 0.8;
    c.position.set(lerp(x0, x1, k), lerp(y0, y1, k) + Math.sin(Math.PI * k) * 1.3, (i % 2 ? 0.15 : -0.15) * k);
    c.rotation.set(k * 6, k * 4, 0);
  }

  // ---------------- Objetos de comparación ----------------------------------------------------------
  eiffel.visible = s.id === 'anio';
  everest.visible = s.id === 'kola';
  planet.visible = s.id === 'centro';
  for (const m of labelsAt.lines) m.visible = false;

  // ---------------- Cámara por escena (fija) --------------------------------------------------------
  const cam = world.camera;
  let pos, tgt, size, fov = 42, frameH = 0;
  const tele = (cx, yTop, yBot, f) => { const hh = yTop - yBot, cy = (yTop + yBot) / 2, dist = hh / 2 / Math.tan((f * Math.PI) / 360); pos = new THREE.Vector3(cx, cy, -dist); tgt = new THREE.Vector3(cx, cy, 0); fov = f; size = hh; frameH = hh; };
  switch (s.id) {
    case 'intro': pos = new THREE.Vector3(3.2, 1.8, -6.8); tgt = new THREE.Vector3(-1.6, 1.3, 2.5); size = 9; break;
    case 'dia1': pos = new THREE.Vector3(2.9, 3.3, -5.6); tgt = new THREE.Vector3(-1.4, -0.1, 1.0); size = 8; break;
    case 'semana': tele(-4.5, 10.5, -8.6, 36); pos.y = 1.2; break;
    case 'agua': tele(-1.5, 5.5, -13.6, 34); break;
    case 'mes': tele(-17, 36, -32, 36); pos.y = 4; break;
    case 'cerro': pos = new THREE.Vector3(9, 4.6, -15.5); tgt = new THREE.Vector3(3.5, 1.4, 1); size = 16; break;
    case 'cubo': pos = new THREE.Vector3(19, 10, -46); tgt = new THREE.Vector3(18, 3.2, 4); size = 50; break;
    case 'anio': tele(-95, 420, -560, 8); pos.y = 25; break;
    case 'mina': tele(-650, 900, -5400, 8); break;
    case 'kola': tele(-7000, 14000, -17500, 8); break;
    case 'corteza': tele(0, 8000, -52000, 8); break;
    case 'cerro2': case 'outro': pos = new THREE.Vector3(6, 16, -70); tgt = new THREE.Vector3(14, 7, 6); size = 70; break;
    default: { // centro: la Tierra cortada
      pos = new THREE.Vector3(PLANET[0] - 1750, PLANET[1] + 650, PLANET[2] + 1750); tgt = new THREE.Vector3(PLANET[0] - 40, PLANET[1] - 30, PLANET[2] + 40); size = 1400;
    }
  }
  cam.fov = fov; cam.position.copy(pos); cam.lookAt(tgt);
  const dist = pos.distanceTo(tgt);
  cam.near = Math.max(0.05, dist * 0.002); cam.far = Math.max(9000, dist * 6); cam.updateProjectionMatrix();
  world.fitToScale(s.id === 'centro' ? tgt : { x: tgt.x, y: Math.max(0, tgt.y), z: Math.max(2, tgt.z) }, Math.min(size, 3000));
  if (fov < 20 || s.id === 'centro') { world.scene.fog.near = dist * 3; world.scene.fog.far = dist * 40; }
  // Ancho del hoyo en el corte: real (1 m, se ve el hueco) o exagerado a ~3 píxeles si es muy delgado.
  const mpp = frameH ? frameH / H : 0;
  faceU.uD.value = D; faceU.uHalf.value = Math.max(0.5, 1.6 * mpp); faceU.uSlot.value = faceU.uHalf.value <= 0.5 ? 1 : 0;
  // Marcas horizontales con un grosor de ~3 px.
  const line = (m) => { const { y, x0, x1 } = m.userData; m.visible = true; m.scale.set(x1 - x0, 3 * mpp, 1); m.position.set((x0 + x1) / 2, y, -2); };
  if (s.id === 'mina') line(labelsAt.mina);
  if (s.id === 'kola') line(labelsAt.kola);
  if (s.id === 'corteza') line(labelsAt.moho);

  // Espacio (la Tierra cortada) o cielo de día.
  const space = s.id === 'centro';
  dress.sky.visible = !space; world.ground.visible = !space;
  world.scene.background.set(space ? '#02030a' : '#d3ecfa');
  dress.follow(cam);

  // ---------------- La Tierra cortada: el camino hasta el centro -------------------------------------
  if (space) {
    const a = (19 * Math.PI) / 180, P0 = new THREE.Vector3(-RP * Math.cos(a), RP * Math.sin(a), 0.6);
    const f = Math.min(1, D / 6371000), len = Math.max(2.5, RP * f);
    const dir = P0.clone().multiplyScalar(-1).setZ(0).normalize();
    pathLine.scale.set(2.2, len, 2.2); pathLine.position.copy(P0).addScaledVector(dir, len / 2); pathLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }

  // ---------------- Capa de texto -----------------------------------------------------------------------
  cam.updateMatrixWorld();
  const labels = [];
  const fa = Math.min(1, local / 0.6);
  const proj = (x, y, z, text, color, alpha = fa) => { const p = new THREE.Vector3(x, y, z).project(cam); if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) labels.push({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, text, alpha, color }); };
  const P = (v) => new THREE.Vector3(PLANET[0] + v[0], PLANET[1] + v[1], PLANET[2] + v[2]);
  switch (s.id) {
    case 'dia1': proj(CAR.x, 1.9, CAR.z, 'Un coche: ~1.5 toneladas', '#fde68a'); break;
    case 'semana': proj(HOUSE.x, 9.4, HOUSE.z - 4, 'Casa de 2 pisos', '#fde68a'); proj(0.6, -D + 2.0, 0, 'Tú', '#ffffff'); break;
    case 'agua': if (D > 9.6) proj(4, -10.8, 0, 'Agua subterránea', '#93c5fd'); proj(0.6, -D + 2.0, 0, 'Tú', '#ffffff'); break;
    case 'mes': proj(APT.x, 33, APT.z - 8, 'Edificio de 10 pisos (30 m)', '#fde68a'); proj(0.6, -D + 2.2, 0, 'Tú', '#ffffff'); break;
    case 'cerro': proj(pcx, ph + 0.3, 0, `${nf(V, 0)} m³ → ${nf(ph, 1)} m de alto`, '#fde68a'); break;
    case 'cubo': proj(pcx, ph + 0.3, 0, `${nf(V, 0)} m³`, '#fde68a'); if (ghost.visible) proj(ghost.position.x, gh + 0.5, 0, `El doble de alto: ${nf(V * 8, 0)} m³ (×8)`, '#facc15'); break;
    case 'anio': proj(EIFFEL.x, 338, EIFFEL.z, 'Torre Eiffel (330 m)', '#fde68a'); proj(0, -D, 0, `Tú: ${fmtD(D)} · +${nf(D * 0.025, 0)} °C`, '#ffffff'); break;
    case 'mina': proj(-1300, -3990, 0, 'Mina más profunda: 4 km (60 °C)', '#fde68a'); proj(0, -D, 0, `Tú: ${fmtD(D)}`, '#ffffff'); break;
    case 'kola': proj(EVEREST.x, 8950, EVEREST.z, 'Everest (8,849 m)', '#ffffff'); proj(-12000, -12250, 0, 'Pozo de Kola: 12.3 km (180 °C)', '#fde68a'); proj(0, -D, 0, 'Tú', '#ffffff'); break;
    case 'corteza': proj(12000, -16000, 0, 'Corteza', '#ffffff'); proj(16000, -37500, 0, 'Manto: más de 500 °C', '#fde68a'); proj(0, -D, 0, `Tú: ${fmtD(D)}`, '#ffffff'); break;
    case 'cerro2': case 'outro': proj(pcx, ph + 1.5, 0, s.id === 'outro' ? 'Tú, en tu cerro de 18 m' : 'Cerro de 18 m (12,262 m³)', '#fde68a'); proj(HOUSE.x, 10, HOUSE.z, 'Tu casa', '#ffffff'); break;
    case 'centro': {
      const a = (19 * Math.PI) / 180;
      proj(...P([-RP * Math.cos(a), RP * Math.sin(a), 0]).toArray(), 'Tú', '#ffffff');
      const at = (f, deg) => P([-RP * f * Math.cos((deg * Math.PI) / 180), RP * f * Math.sin((deg * Math.PI) / 180), 0]).toArray();
      proj(...at(0.995, -48), 'Corteza (35 km)', '#fde68a');
      proj(...at(0.78, -62), 'Manto', '#fde68a');
      proj(...at(0.38, -72), 'Núcleo externo', '#fde68a');
      if (local > s.dur * 0.55) proj(...P([0, 0, 0]).toArray(), 'Centro: 5,200 °C', '#ffffff');
      break;
    }
    default: break;
  }

  let counter = null, chip = null;
  if (!['intro', 'outro', 'cerro', 'cubo', 'cerro2'].includes(s.id)) {
    counter = { label: 'PROFUNDIDAD', value: fmtD(D) };
    const n = Math.max(1, Math.ceil(day - 1e-6));
    const yrs = n / 365.25;
    chip = n < 365 ? `DÍA ${nf(n)}` : `DÍA ${nf(n)} · ${nf(yrs, yrs < 100 ? 1 : 0)} AÑOS`;
  } else if (s.id === 'cerro' || s.id === 'cubo') { counter = { label: 'TIERRA SACADA', value: `${nf(V, 0)} m³` }; chip = `CERRO: ${nf(ph, 1)} m`; }
  else if (s.id === 'cerro2') { counter = { label: 'TIERRA DE 12 km DE HOYO', value: '12,262 m³' }; chip = 'CERRO: 18 m'; }
  let title = null;
  if (s.titleCard) title = { lines: s.titleCard, alpha: Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5)), y: s.titleY ?? 0.3 };
  const ov = { counter, chip, title, labels };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.counter = null; ov.chip = null; }
  return ov;
}
