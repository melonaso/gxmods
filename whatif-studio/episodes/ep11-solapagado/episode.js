// Episodio 11: ¿y si el Sol se apagara? Minuto a minuto.
// Escenarios: barrio con parque y estanque (día → oscuridad → escarcha → hielo), el espacio (la última
// luz viaja 8 min 20 s hasta la Tierra; la órbita sigue igual; la Tierra congelada), el mar cubierto de
// hielo en corte, las ventilas hidrotermales del fondo del mar y un invernadero en Islandia.
import { ease, lerp } from '../../engine/timeline.js';
import * as MD from '../../engine/models.js';
import * as TX from '../../engine/textures.js';
import { dressWorld, streetGrid, lineOfHouses, lampsAlong } from '../../engine/town.js';
import { createPlacer } from '../../engine/actors.js';
import { bake, solidOverlaps } from '../../engine/bake.js';
import { earthTexture } from '../../engine/planet.js';

const SPACE = [0, 2.0e6, 0], ICE = [60000, 0, 0], VENT = [60000, 0, 9000], ISL = [-60000, 0, 0];
const PARK = { x: 12, z: 20 }, POND = { x: 15, z: 22, r: 5.5 }, FLAG = { x: 3, z: 12 };
const AU = 1600;                                       // distancia Sol–Tierra en el esquema del espacio

// Estado del ambiente por escena: dark (cielo negro), lamps, frost 0..1, wilt (plantas secas) 0..1,
// wind 0..1, ice (estanque) 0..1, snow (nieve de aire), time (texto del contador), temp (chip).
const ENV = {
  intro: { set: 'town', time: null }, t0: { set: 'town', time: '0 s', temp: '15 °C' },
  luz: { set: 'space', time: '0 s' }, cuenta: { set: 'space', time: 'cuenta' }, ultimos: { set: 'town', time: 'ultimos', temp: '15 °C' },
  apagon: { set: 'town', dark: 'switch', time: '8 min 20 s', temp: '15 °C' },
  estrellas: { set: 'town', dark: 1, lamps: 1, time: '9 min', temp: '15 °C' }, luna: { set: 'town', dark: 1, lamps: 1, time: '9 min', temp: '15 °C', moon: 'fade' },
  jupiter: { set: 'town', dark: 1, lamps: 1, time: '1 h 30 min', temp: '12 °C', planets: 'j' }, saturno: { set: 'town', dark: 1, lamps: 1, time: '2 h 30 min', temp: '11 °C', planets: 'js' },
  luces: { set: 'town', dark: 1, lamps: 1, time: '1 hora', temp: '13 °C' }, solar: { set: 'town', dark: 1, lamps: 1, time: '1 hora', temp: '13 °C' },
  viento: { set: 'town', dark: 1, lamps: 1, wind: 'stop', time: '6 horas', temp: '8 °C' },
  dia1: { set: 'town', dark: 1, lamps: 1, frost: 0.15, time: '1 día', temp: '5 °C' }, plantas: { set: 'town', dark: 1, lamps: 1, frost: 0.2, wilt: [0, 0.35], time: '2 días', temp: '0 °C' },
  oxigeno: { set: 'town', dark: 1, lamps: 1, frost: 0.3, wilt: 0.35, time: '4 días', temp: '−8 °C' },
  semana: { set: 'town', dark: 1, lamps: 1, frost: 0.55, wilt: 0.5, ice: 0.3, time: '1 semana', temp: '−18 °C' },
  lagos: { set: 'town', dark: 1, lamps: 1, frost: 0.6, wilt: 0.55, ice: [0.3, 1], time: '2 semanas', temp: '−25 °C' },
  comida: { set: 'town', dark: 1, lamps: 1, frost: 0.65, wilt: 0.7, ice: 1, time: '3 semanas', temp: '−30 °C' },
  mes1: { set: 'town', dark: 1, lamps: 1, frost: 0.7, wilt: 1, ice: 1, time: '1 mes', temp: '−35 °C' },
  anio1: { set: 'town', dark: 1, lamps: 0.6, frost: 1, wilt: 1, ice: 1, time: '1 año', temp: '−73 °C' },
  hielo: { set: 'ice', time: '1 año', temp: '−73 °C' }, ventilas: { set: 'vent', time: '1 año', temp: '≈ 350 °C junto a la ventila' },
  humanos: { set: 'isl', time: '1 año', temp: '−73 °C' }, invernaderos: { set: 'green', time: '1 año', temp: '−73 °C' },
  orbita: { set: 'space', time: '1 año' }, decadas: { set: 'town', dark: 1, lamps: 0, frost: 1, wilt: 1, ice: 1, time: 'décadas', temp: '−100 °C' },
  aire: { set: 'town', dark: 1, lamps: 0, frost: 1, wilt: 1, ice: 1, snow: 1, time: 'millones de años', temp: '−215 °C' },
  final: { set: 'space', time: 'millones de años', temp: '−240 °C' },
  real: { set: 'town', time: null }, outro: { set: 'town', time: null },
};

let T, dress, hemi, P;
let roadMats = [], curbMats = [], roofMats = [], leafMats = [], glassMat, bulbMats = [];
let sky, stars, moon, jup, sat, flakes, flag, flagGeo, flagBase, pond, pondMat, people = [], boxes = [], panels = [], lampLights = [];
let space, sunMesh, sunGlow, earth, earthMat, moonS, ring, orbitLine, sunLight;
let iceSet, iceSlab, fish = [], ventSet, smoke = [], worms = [], ventLight, isl, steam = [], greenLight;

export function setup(C) {
  const { THREE, world } = C;
  T = THREE;
  const { scene } = world;
  dress = dressWorld(world, { top: '#4f9ee3', horizon: '#d3ecfa', ground: 'grass' });
  scene.traverse((o) => { if (o.isHemisphereLight) hemi = o; });
  P = createPlacer();
  const rng = MD.mulberry(1111);
  const before = new Set(scene.children);

  // ---------------- Barrio (como el de los episodios de nieve, pero con un parque) ---------------
  streetGrid(scene, P, { xs: [-40, 120], zs: [0, 64], x0: -160, x1: 260, z0: -260, z1: 120 });
  scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.normalMap && !roadMats.includes(o.material) && !curbMats.includes(o.material)) { if (o.position.y < 0.05) roadMats.push(o.material); else curbMats.push(o.material); } });
  P.blockRect(-6, 30, 6.2, 36);                                     // parque
  const houses = [
    ...lineOfHouses(scene, P, rng, { zStreet: 0, side: 1, x0: -160, x1: 116, carChance: 0.35 }).houses,
    ...lineOfHouses(scene, P, rng, { zStreet: 0, side: -1, x0: -160, x1: 116, carChance: 0.35 }).houses,
    ...lineOfHouses(scene, P, rng, { zStreet: 64, side: -1, x0: -160, x1: 116, lot: 15, setback: 4, carChance: 0.25 }).houses,
    ...lineOfHouses(scene, P, rng, { zStreet: 64, side: 1, x0: -160, x1: 116, carChance: 0.25 }).houses,
  ];
  lampsAlong(scene, { zStreet: 0, x0: -150, x1: 250, every: 30, side: 1 });
  lampsAlong(scene, { zStreet: 0, x0: -135, x1: 250, every: 30, side: -1 });
  for (const [x, fl] of [[-110, 12], [-75, 15], [65, 15], [95, 10]]) { const a = MD.createApartment({ floors: fl, w: 18, d: 16, color: ['#e7e5e4', '#fde68a', '#bfdbfe', '#fecaca'][Math.abs(x) % 4], seed: x }); a.position.set(x, 0, -72); P.place(x, -72, 12.5); scene.add(a); }
  for (let k = 0; k < 160; k++) { const x = -160 + rng() * 420, z = -260 + rng() * 350, h = 6 + rng() * 6; if (!P.place(x, z, h * 0.36 + 0.3)) continue; const t = MD.createTreeHQ({ h, seed: 500 + k }); t.position.set(x, 0, z); scene.add(t); }
  // Parque: árboles alrededor del estanque, bancas y botes de basura.
  for (const [x, z, h] of [[-2, 30, 8], [6, 32, 7], [26, 31, 8.5], [27, 13, 7.5], [-2, 20, 7], [19, 34.5, 7]]) { const t = MD.createTreeHQ({ h, seed: 900 + x * 7 + z }); t.position.set(x, 0, z); scene.add(t); }
  for (const [x, z, r] of [[8, 13, 0], [20, 13, 0], [9, 30, Math.PI]]) { const b = MD.createBench(); b.position.set(x, 0, z); b.rotation.y = r; scene.add(b); }
  { const tc = MD.createTrashCan(); tc.position.set(14, 0, 12.6); scene.add(tc); }
  // Paneles solares en los techos de algunas casas que dan a la calle principal.
  const pv = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d'); g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, 128, 192); g.strokeStyle = '#93c5fd'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 192); g.stroke(); } for (let j = 0; j <= 6; j++) { g.beginPath(); g.moveTo(0, j * 32); g.lineTo(128, j * 32); g.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const pvMat = new THREE.MeshStandardMaterial({ map: pv, roughness: 0.25, metalness: 0.5 });
  for (const h of houses.filter((h) => Math.abs(h.position.z - 19) < 3 && h.position.x > -60 && h.position.x < 80).slice(0, 6)) {
    const { w, d, H } = h.userData.size, pitch = 0.6, over = 0.45;
    const grp = new THREE.Group();
    for (let i = -1; i <= 1; i++) { const p = new THREE.Mesh(MD.boxUV(1.0, 0.05, 1.6, 1), pvMat); p.position.set(i * 1.1, 0, 0); grp.add(p); }
    const run = (d / 2 + over) * 0.5;
    grp.position.set(0, H + Math.tan(pitch) * (d / 2 + over - run) - over * Math.tan(pitch) + 0.28, run); grp.rotation.x = pitch;
    h.add(grp); panels.push(grp); void w;
  }
  const staticRoots = scene.children.filter((o) => !before.has(o));
  world.userData.preOverlaps = solidOverlaps(staticRoots);
  bake(scene, staticRoots);

  // Materiales que cambian: vidrio (ventanas encendidas), focos, techos (escarcha) y hojas (se secan).
  const shingleMaps = new Set(['#9a3412', '#7c2d12', '#1e3a8a', '#374151', '#7f1d1d'].map((c) => TX.shingles(c).map));
  const leafMaps = new Set(['#3f8f3a', '#4c9a3f', '#5aa546', '#37803a', '#2f6b3a', '#285e33', '#36733f'].map((c) => TX.leaves(c).map));
  scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m?.color) continue;
      if (m.color.getHex() === 0x9cc9e8) glassMat = m;
      if (m.color.getHex() === 0xfef9c3 && !bulbMats.includes(m)) bulbMats.push(m);
      if (m.map && shingleMaps.has(m.map) && !roofMats.includes(m)) roofMats.push(m);
      if (m.map && leafMaps.has(m.map) && !leafMats.includes(m)) { leafMats.push(m); m.userData.base = m.color.clone(); }
    }
  });
  // Luces de las farolas cercanas al parque (solo de noche).
  for (const [x, z] of [[0, 5.4], [30, 5.4]]) { const l = new THREE.PointLight('#fde68a', 0, 26, 1.4); l.position.set(x + 1, 4.6, z); l.visible = false; scene.add(l); lampLights.push(l); }

  // ---------------- Estanque que se congela -------------------------------------------------------
  pondMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.08, metalness: 0.2 });
  pond = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 48), pondMat); pond.rotation.x = -Math.PI / 2; pond.position.set(POND.x, 0.06, POND.z); pond.receiveShadow = true; scene.add(pond);
  { const rim = new THREE.Mesh(new THREE.TorusGeometry(POND.r + 0.1, 0.18, 6, 48), MD.M('#a8a29e', { roughness: 0.9 })); rim.rotation.x = Math.PI / 2; rim.position.set(POND.x, 0.08, POND.z); scene.add(rim); }

  // ---------------- Bandera: ondea con el viento y cuelga cuando para --------------------------------
  { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 7, 10), MD.M('#cbd5e1', { metalness: 0.7, roughness: 0.3 })); pole.position.set(FLAG.x, 3.5, FLAG.z); pole.castShadow = true; scene.add(pole);
    const fc = document.createElement('canvas'); fc.width = 192; fc.height = 128; const g = fc.getContext('2d');
    ['#16a34a', '#f8fafc', '#dc2626'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 64, 0, 64, 128); });
    g.fillStyle = '#92400e'; g.beginPath(); g.arc(96, 64, 16, 0, Math.PI * 2); g.fill();
    const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
    flagGeo = new THREE.PlaneGeometry(2.1, 1.4, 16, 8); flagGeo.translate(1.05, 0, 0); flagBase = flagGeo.attributes.position.array.slice();
    flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ map: ft, side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(FLAG.x, 6.2, FLAG.z); flag.castShadow = true; scene.add(flag); }

  // ---------------- Gente del parque ----------------------------------------------------------------------
  const looks = [{ shirt: '#ef4444' }, { shirt: '#3b82f6', hairStyle: 'cap' }, { shirt: '#22c55e', kid: true }, { shirt: '#a855f7' }, { shirt: '#f59e0b', kid: true }];
  looks.forEach((lk, i) => { const c = MD.createCharacter({ seed: 300 + i, ...lk }); scene.add(c); people.push(c); });
  for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(MD.boxUV(0.45, 0.32, 0.35, 1), new THREE.MeshStandardMaterial({ ...TX.wood('#b45309'), roughness: 0.9 })); b.castShadow = true; b.visible = false; scene.add(b); boxes.push(b); }

  // ---------------- Cielo de noche: estrellas, Luna, Júpiter y Saturno (siguen a la cámara) ---------
  sky = new THREE.Group(); scene.add(sky);
  { const N = 3600, pos = new Float32Array(N * 3), r = MD.mulberry(42);
    for (let i = 0; i < N; i++) { const u = r() * 0.95 + 0.03, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.set([Math.cos(th) * s * 3000, u * 3000, Math.sin(th) * s * 3000], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    stars = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 3.2, sizeAttenuation: false, fog: false, transparent: true })); sky.add(stars); }
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const dirTo = (az, el, d = 2900) => new THREE.Vector3(Math.cos(el) * Math.sin(az) * d, Math.sin(el) * d, Math.cos(el) * Math.cos(az) * d);
  jup = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#fde68a', fog: false, transparent: true, depthWrite: false })); jup.scale.setScalar(70); jup.position.copy(dirTo(0.3, 0.55)); sky.add(jup);
  sat = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#fef3c7', fog: false, transparent: true, depthWrite: false })); sat.scale.setScalar(55); sat.position.copy(dirTo(-0.25, 0.42)); sky.add(sat);
  moon = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), new THREE.MeshBasicMaterial({ color: '#e5e7eb', fog: false })); moon.position.copy(dirTo(0.12, 0.48)); sky.add(moon);
  { const N = 5000, pos = new Float32Array(N * 3), r = MD.mulberry(5); for (let i = 0; i < N; i++) pos.set([r(), r(), r()], i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    flakes = new THREE.Points(g, new THREE.PointsMaterial({ map: dot, color: '#e0f2fe', size: 0.09, transparent: true, depthWrite: false })); flakes.frustumCulled = false; flakes.userData.base = pos.slice(); flakes.visible = false; scene.add(flakes); }

  // ---------------- El espacio: Sol, Tierra, Luna, última luz y órbita ----------------------------------
  space = new THREE.Group(); space.position.set(...SPACE); space.visible = false; scene.add(space);
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 24), new THREE.MeshBasicMaterial({ color: '#fde047', fog: false })); space.add(sunMesh);
  sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#fbbf24', fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sunGlow.scale.setScalar(520); space.add(sunGlow);
  earthMat = new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.9, fog: false });
  earth = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), earthMat); earth.position.set(AU, 0, 0); space.add(earth);
  moonS = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 12), new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 1, fog: false })); moonS.position.set(AU + 70, 6, 20); space.add(moonS);
  ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.004, 6, 160), new THREE.MeshBasicMaterial({ color: '#fde68a', fog: false, transparent: true, opacity: 0.9 })); ring.rotation.x = Math.PI / 2; space.add(ring);
  { const pts = []; for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * AU, 0, Math.sin(a) * AU)); }
    orbitLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: '#94a3b8', dashSize: 40, gapSize: 30, fog: false })); orbitLine.computeLineDistances(); space.add(orbitLine); }
  { const N = 3000, pos = new Float32Array(N * 3), r = MD.mulberry(9); for (let i = 0; i < N; i++) { const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.set([Math.cos(th) * s * 30000, u * 30000, Math.sin(th) * s * 30000], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); space.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false }))); }
  sunLight = new THREE.PointLight('#fff7e0', 0, 9000, 0); sunLight.position.set(...SPACE); sunLight.visible = false; scene.add(sunLight);

  // ---------------- El mar en corte: hielo arriba, agua líquida abajo -----------------------------------
  iceSet = new THREE.Group(); iceSet.position.set(...ICE); iceSet.visible = false; scene.add(iceSet);
  { const water = new THREE.Mesh(new THREE.BoxGeometry(40, 14, 24), new THREE.MeshStandardMaterial({ color: '#0e7490', roughness: 0.4, emissive: '#0c4a6e', emissiveIntensity: 0.9 })); water.position.y = -7; iceSet.add(water);
    const floor = new THREE.Mesh(MD.boxUV(40, 2, 24, 4), new THREE.MeshStandardMaterial({ ...TX.dirt(), color: '#57534e', roughness: 1 })); floor.position.y = -15; iceSet.add(floor);
    iceSlab = new THREE.Mesh(new THREE.BoxGeometry(40.2, 1, 24.2), new THREE.MeshStandardMaterial({ color: '#f0f9ff', roughness: 0.25, emissive: '#bae6fd', emissiveIntensity: 0.7 })); iceSet.add(iceSlab);
    for (let i = 0; i < 7; i++) { const f = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), MD.M(['#f59e0b', '#94a3b8', '#f97316'][i % 3], { emissive: '#fbbf24', emissiveIntensity: 0.6 })); b.scale.set(1.6, 0.8, 0.5); f.add(b); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), b.material); tl.rotation.z = Math.PI / 2; tl.position.x = -0.75; f.add(tl); iceSet.add(f); fish.push(f); } }

  // ---------------- Ventilas hidrotermales -------------------------------------------------------------
  ventSet = new THREE.Group(); ventSet.position.set(...VENT); ventSet.visible = false; scene.add(ventSet);
  { const floor = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.MeshStandardMaterial({ ...TX.dirt(), color: '#3f3f46', roughness: 1 })); floor.rotation.x = -Math.PI / 2; ventSet.add(floor);
    const prof = []; for (let i = 0; i <= 14; i++) { const y = i * 0.5; prof.push(new THREE.Vector2(1.5 - y * 0.15 + 0.12 * Math.sin(i * 2.3), y)); }
    const chim = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), new THREE.MeshStandardMaterial({ color: '#292524', roughness: 1, emissive: '#7c2d12', emissiveIntensity: 0.25 })); chim.castShadow = true; ventSet.add(chim);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({ color: '#fb923c', fog: false })); mouth.rotation.x = -Math.PI / 2; mouth.position.y = 7.02; ventSet.add(mouth);
    const r = MD.mulberry(23);
    for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2, d = 2.2 + r() * 2.8, h = 0.7 + r() * 0.9; const g = new THREE.Group(); g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, h, 8), MD.M('#f5f5f4', { roughness: 0.6 })); tube.position.y = h / 2; g.add(tube);
      const plume = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), MD.M('#dc2626', { emissive: '#7f1d1d', emissiveIntensity: 0.6 })); plume.scale.y = 1.6; plume.position.y = h + 0.1; g.add(plume);
      g.userData.ph = r() * 6; ventSet.add(g); worms.push(g); }
    for (let i = 0; i < 4; i++) { const cr = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), MD.M('#f8fafc', { roughness: 0.7 })); cr.scale.set(1.3, 0.5, 1); const a = i * 1.6 + 0.4; cr.position.set(Math.cos(a) * 3.4, 0.12, Math.sin(a) * 3.4); ventSet.add(cr); }
    const sm = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(40,40,45,0.95)'); gr.addColorStop(1, 'rgba(40,40,45,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    for (let i = 0; i < 36; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sm, transparent: true, depthWrite: false, fog: false })); ventSet.add(s); smoke.push(s); } }
  ventLight = new THREE.PointLight('#fb923c', 0, 30, 1.2); ventLight.position.set(VENT[0], VENT[1] + 7.6, VENT[2]); ventLight.visible = false; scene.add(ventLight);

  // ---------------- Islandia: planta geotérmica e invernadero ---------------------------------------------
  isl = new THREE.Group(); isl.position.set(...ISL); isl.visible = false; scene.add(isl);
  { const sn = TX.snow(); const snowGround = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshStandardMaterial({ map: sn.map, normalMap: sn.normalMap, color: '#e2e8f0', roughness: 0.9 })); snowGround.rotation.x = -Math.PI / 2; snowGround.position.y = 0.02; snowGround.receiveShadow = true; isl.add(snowGround);
    // Invernadero: bóveda de vidrio con camas de plantas y barras de luz.
    const gh = new THREE.Group(); gh.position.set(0, 0, 0); isl.add(gh);
    const glassM = new THREE.MeshStandardMaterial({ color: '#e9d5ff', transparent: true, opacity: 0.32, roughness: 0.1, emissive: '#a855f7', emissiveIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 18, 32, 1, true, -Math.PI / 2, Math.PI), glassM); vault.rotation.z = Math.PI / 2; vault.rotation.y = Math.PI / 2; vault.position.y = 1.2; gh.add(vault);
    for (const s of [-1, 1]) { const wall = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32, 0, Math.PI), glassM); wall.position.set(0, 1.2, s * 9); gh.add(wall); }
    const frameM = MD.M('#e5e7eb', { metalness: 0.6, roughness: 0.4 });
    for (let i = -4; i <= 4; i++) { const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.05, 6, 24, Math.PI), frameM); arch.position.set(0, 1.2, i * 2.2); gh.add(arch); }
    const base = new THREE.Mesh(MD.boxUV(7.4, 1.2, 18.2, 1), MD.M('#94a3b8', { roughness: 0.9 })); base.position.y = 0.6; gh.add(base);
    const leafM = MD.M('#22c55e', { roughness: 0.8, emissive: '#14532d', emissiveIntensity: 0.4 });
    for (const x of [-2, 0, 2]) {
      const bed = new THREE.Mesh(MD.boxUV(1.2, 0.5, 15, 1), MD.M('#78350f', { roughness: 1 })); bed.position.set(x, 1.45, 0); gh.add(bed);
      for (let z = -7; z <= 7; z += 0.8) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), leafM); p.position.set(x + Math.sin(z * 3) * 0.2, 1.85, z); gh.add(p); }
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 15), new THREE.MeshBasicMaterial({ color: '#f0abfc', fog: false })); led.position.set(x, 3.6, 0); gh.add(led);
    }
    // Planta geotérmica: tanques, tubos y una chimenea con vapor.
    const metal = MD.M('#cbd5e1', { metalness: 0.6, roughness: 0.4 });
    for (const [x, z] of [[16, -6], [20, -6], [18, -10]]) { const tk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5, 20), metal); tk.position.set(x, 2.5, z); tk.castShadow = true; isl.add(tk); }
    for (let i = 0; i < 3; i++) { const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 30, 12), metal); pipe.rotation.x = Math.PI / 2; pipe.position.set(24 + i * 1.2, 1.2, 4); isl.add(pipe); }
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 9, 20), MD.M('#94a3b8', { roughness: 0.8 })); stack.position.set(30, 4.5, -14); isl.add(stack);
    const sm = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sm, transparent: true, depthWrite: false })); isl.add(s); steam.push(s); }
    for (let i = 0; i < 3; i++) { const c = MD.createCharacter({ seed: 700 + i, coat: ['#dc2626', '#2563eb', '#16a34a'][i], beanie: '#0f172a', scarf: '#facc15', gloves: '#1f2937', longSleeves: true }); c.position.set(-5 + i * 1.4, 0, -11 + (i % 2)); c.rotation.y = 0.4; c.userData.pose(0, 'idle'); isl.add(c); isl.userData['p' + i] = c; } }
  greenLight = new THREE.PointLight('#f0abfc', 0, 30, 1.2); greenLight.position.set(ISL[0], 3.4, ISL[2]); greenLight.visible = false; scene.add(greenLight);
}

export function sfx(C) {
  const at = (id, k, type) => { const s = C.scenes.find((x) => x.id === id); return { t: s.start + (k < 1 ? s.dur * k : k), type }; };
  return [at('apagon', 0.45, 'boom'), at('luz', 0.2, 'whoosh'), at('lagos', 0.5, 'crack'), at('comida', 0.3, 'thud'), at('real', 0.2, 'whoosh')].sort((a, b) => a.t - b.t);
}

const val = (v, local, dur) => (Array.isArray(v) ? lerp(v[0], v[1], ease.inOut(Math.min(1, local / (dur * 0.8)))) : v ?? 0);

export function update(C, { t, scene: s, local }) {
  const { world, W, H, scenes } = C;
  const THREE = T;
  const E = ENV[s.id] || { set: 'town' };
  const set = E.set;
  // Momento del apagón dentro de su escena.
  const offT = s.dur * 0.4;
  const dark = E.dark === 'switch' ? (local >= offT ? 1 : 0) : E.dark ?? 0;
  const lamps = E.lamps ?? 0;
  const frost = E.frost ?? 0, wilt = val(E.wilt, local, s.dur), ice = val(E.ice, local, s.dur);
  const wind = E.wind === 'stop' ? 1 - Math.min(1, local / (s.dur * 0.7)) : dark ? 0 : 1;

  // ---------------- Qué escenario se ve ---------------------------------------------------------------
  const town = set === 'town';
  space.visible = set === 'space'; iceSet.visible = set === 'ice'; ventSet.visible = set === 'vent'; isl.visible = set === 'isl' || set === 'green';
  world.ground.visible = town;
  sky.visible = town || set === 'ice' || set === 'isl' || set === 'green';

  // ---------------- Luz y cielo -------------------------------------------------------------------------
  const night = town ? dark : set === 'vent' ? 1 : set === 'space' ? 1 : 1;
  world.sun.intensity = town && !dark ? 2.6 : 0;
  hemi.intensity = town && !dark ? 1.4 : set === 'vent' ? 0.25 : 0.85;
  hemi.color.set(town && !dark ? '#dff3ff' : '#7d8fb8'); hemi.groundColor.set(town && !dark ? '#5d7a3a' : '#1e293b');
  const skyTop = set === 'vent' ? '#01101f' : night ? '#02040c' : '#4f9ee3', skyHor = set === 'vent' ? '#03203a' : night ? '#0b1226' : '#d3ecfa';
  dress.skyMat.uniforms.top.value.set(skyTop); dress.skyMat.uniforms.horizon.value.set(skyHor);
  world.scene.background.set(skyHor); world.scene.fog.color.set(skyHor);
  dress.sky.visible = set !== 'space';
  stars.visible = night > 0 && set !== 'vent'; stars.material.opacity = 1;
  // Ventanas, focos y farolas.
  const lit = town ? lamps : 0;
  glassMat.emissive.set(lit ? '#fbbf24' : '#1e3a5f'); glassMat.emissiveIntensity = lit ? 0.9 * lit : 0.15;
  for (const m of bulbMats) m.emissiveIntensity = lit ? 3 : 0.4;
  for (const l of lampLights) { l.visible = town && lit > 0; l.intensity = 16 * lit; l.distance = 22; }
  // Escarcha: calles, techos y suelo se aclaran; las hojas se secan.
  for (const m of [...roadMats, ...curbMats]) { m.emissive.setRGB(0.55, 0.6, 0.68).multiplyScalar(frost * 0.6); m.color.setScalar(1 - 0.5 * frost); }
  for (const m of roofMats) { m.emissive.setRGB(0.6, 0.66, 0.74).multiplyScalar(frost * 0.55); m.color.setScalar(1 - 0.45 * frost); }
  world.ground.material.color.setRGB(1 - 0.2 * frost, 1 - 0.1 * frost, 1); world.ground.material.emissive?.setRGB(0.5, 0.55, 0.62).multiplyScalar(frost * 0.45);
  const brown = new THREE.Color('#8a6a3a');
  for (const m of leafMats) { m.color.copy(m.userData.base).lerp(brown, wilt * 0.85); m.emissive.setRGB(0.55, 0.6, 0.66).multiplyScalar(frost * 0.35); }
  pondMat.color.set('#2563eb').lerp(new THREE.Color('#e0f2fe'), ice); pondMat.roughness = lerp(0.08, 0.5, ice); pondMat.emissive.set('#93c5fd'); pondMat.emissiveIntensity = ice * 0.25;
  for (const p of panels) p.children.forEach((c) => { c.material.emissive.set(dark ? '#000000' : '#1d4ed8'); c.material.emissiveIntensity = dark ? 0 : 0.15; });

  // ---------------- Bandera ---------------------------------------------------------------------------------
  { const a = flagGeo.attributes.position.array, droop = 1 - wind;
    for (let i = 0; i < a.length; i += 3) { const x = flagBase[i], y = flagBase[i + 1];
      const w = Math.sin(x * 3 - t * 7) * 0.18 * x * wind;
      // Sin viento la bandera cuelga: se dobla hacia abajo junto al mástil.
      const ang = droop * 1.35 * Math.min(1, x / 2.1);
      a[i] = x * Math.cos(ang) * (1 - 0.3 * droop) + 0; a[i + 1] = y - x * Math.sin(ang) * (1 - 0.2 * droop); a[i + 2] = w; }
    flagGeo.attributes.position.needsUpdate = true; flagGeo.computeVertexNormals(); }

  // ---------------- Gente ------------------------------------------------------------------------------------
  const cold = frost > 0.1;
  const spots = [[10, 12.5], [13, 15], [16.5, 14], [9, 17], [18.5, 16.5]];
  people.forEach((c, i) => {
    c.visible = town;
    let [x, z] = spots[i];
    let mode = 'idle', opt = {};
    if (['intro', 't0', 'ultimos'].includes(s.id)) { mode = i % 2 ? 'walk' : 'idle'; if (i % 2) { x += ((t * 1.1 + i * 3) % 10) - 5; c.rotation.y = Math.PI / 2; } else c.rotation.y = -0.6 + i; }
    else if (['apagon'].includes(s.id)) { mode = local > offT + 0.3 ? 'scared' : 'walk'; c.rotation.y = 0.4 * i; }
    else if (['estrellas', 'luna', 'jupiter', 'saturno'].includes(s.id)) { mode = 'lookUp'; opt = { amount: 0.9 }; c.rotation.y = 0.3 * i - 0.6; }
    else if (s.id === 'comida' && i < 2) { mode = 'hold'; opt = { up: 0 }; z += ((t * 0.9 + i * 2) % 6) - 3; c.rotation.y = 0; }
    else if (s.id === 'oxigeno') { mode = i === 2 ? 'cheer' : 'idle'; c.rotation.y = -0.5 + i * 0.4; }
    else if (['real', 'outro'].includes(s.id)) { mode = i % 2 ? 'cheer' : 'wave'; c.rotation.y = Math.PI; }
    else if (cold) { mode = 'shiver'; c.rotation.y = -0.8 + i * 0.5; }
    else { mode = 'idle'; c.rotation.y = -0.6 + i * 0.4; }
    if (['decadas', 'aire', 'anio1'].includes(s.id)) c.visible = false;
    c.position.set(x, 0, z);
    c.userData.pose(t, mode, opt);
  });
  boxes.forEach((b, i) => { b.visible = s.id === 'comida'; const c = people[i]; b.position.set(c.position.x, 1.18, c.position.z + 0.32); });

  // ---------------- Cielo: Luna, planetas, nieve del aire --------------------------------------------------
  const moonDark = E.moon === 'fade' ? Math.min(1, Math.max(0, (local - s.dur * 0.35) / 0.8)) : night ? 1 : 0;
  moon.visible = town && (!night || E.moon === 'fade');
  moon.material.color.set('#e5e7eb').lerp(new THREE.Color('#05070d'), moonDark);
  jup.visible = town && !!E.planets; sat.visible = town && E.planets === 'js';
  if (s.id === 'saturno') jup.material.opacity = Math.max(0, 1 - local / (s.dur * 0.4)); else jup.material.opacity = 1;
  flakes.visible = town && !!E.snow;

  // ---------------- Cámara por escena ---------------------------------------------------------------------
  const cam = world.camera;
  let pos, tgt, size = 30, fov = 42;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = (v) => V(SPACE[0] + v[0], SPACE[1] + v[1], SPACE[2] + v[2]);
  switch (s.id) {
    case 'intro': pos = V(-3, 2.6, -9); tgt = V(14, 3.5, 22); size = 35; break;
    case 't0': case 'ultimos': pos = V(4.5, 1.7, 3); tgt = V(16, 1.6, 16); size = 20; break;
    case 'apagon': pos = V(6, 2.2, -4); tgt = V(14, 6, 28); size = 35; break;
    case 'estrellas': case 'jupiter': case 'saturno': pos = V(12, 1.7, 6); tgt = V(14, 12, 40); size = 25; fov = 55; break;
    case 'luna': pos = V(12, 1.7, 6); tgt = V(12 + 2900 * Math.sin(0.12) * 0.01, 2900 * Math.sin(0.48) * 0.01 + 1.7, 6 + 2900 * Math.cos(0.12) * 0.01); size = 25; fov = 40; break;
    case 'luces': pos = V(42, 5.5, -10); tgt = V(10, 3, 18); size = 45; break;
    case 'solar': { const sp = panels[0] ? panels[0].getWorldPosition(new THREE.Vector3()) : V(28, 6.5, 19); pos = V(sp.x + 5, 5.5, -5); tgt = V(sp.x, sp.y - 1, sp.z - 3); size = 22; break; }
    case 'viento': pos = V(8.5, 3.6, 3.5); tgt = V(FLAG.x, 5.5, FLAG.z); size = 14; break;
    case 'dia1': case 'semana': case 'anio1': pos = V(11, 8, -15); tgt = V(16, 1, 26); size = 45; break;
    case 'plantas': case 'mes1': pos = V(18, 2.4, 8); tgt = V(24, 4.5, 28); size = 25; break;
    case 'oxigeno': pos = V(9, 1.9, 6); tgt = V(13, 1.5, 15); size = 14; break;
    case 'lagos': pos = V(POND.x - 2, 4.2, POND.z - 11); tgt = V(POND.x, 0, POND.z); size = 16; break;
    case 'comida': pos = V(6, 2.2, 6); tgt = V(11, 1.4, 15); size = 16; break;
    case 'decadas': pos = V(70, 45, -70); tgt = V(10, 0, 25); size = 140; break;
    case 'aire': pos = V(6, 2.8, 2); tgt = V(15, 4, 22); size = 25; break;
    case 'real': case 'outro': pos = V(-3, 2.6, -9); tgt = V(14, 3.5, 22); size = 35; break;
    case 'hielo': pos = V(ICE[0] + 2, 1, ICE[2] - 40); tgt = V(ICE[0], -4.5, ICE[2]); size = 40; break;
    case 'ventilas': pos = V(VENT[0] + 6.5, 4.5, VENT[2] - 10.5); tgt = V(VENT[0], 4.5, VENT[2]); size = 20; break;
    case 'humanos': pos = V(ISL[0] - 22, 7, ISL[2] - 30); tgt = V(ISL[0] + 6, 2, ISL[2] - 4); size = 50; break;
    case 'invernaderos': pos = V(ISL[0] + 0.1, 2.6, ISL[2] - 8.4); tgt = V(ISL[0], 1.9, ISL[2] + 6); size = 12; fov = 60; break;
    case 'luz': case 'cuenta': pos = S([AU * 0.5, 1000, -1500]); tgt = S([AU * 0.5, 0, 0]); size = 2000; break;
    case 'orbita': pos = S([0, 1700, -2300]); tgt = S([0, 0, 0]); size = 3000; break;
    default: /* final */ pos = S([AU - 130, 50, -135]); tgt = S([AU, -6, 0]); size = 200;
  }
  cam.fov = fov; cam.position.copy(pos); cam.lookAt(tgt);
  cam.near = set === 'space' ? 1 : 0.05; cam.far = set === 'space' ? 80000 : 9000; cam.updateProjectionMatrix();
  world.fitToScale({ x: tgt.x, y: Math.max(0, tgt.y), z: tgt.z }, size);
  if (set === 'vent') { world.scene.fog.near = 4; world.scene.fog.far = 55; }
  if (set === 'space') { world.scene.fog.near = 1e7; world.scene.fog.far = 2e7; }
  if (set === 'isl' || set === 'green' || set === 'ice') { world.scene.fog.near = 120; world.scene.fog.far = 900; }
  sky.position.copy(cam.position);
  dress.follow(cam);

  // Nieve que cae (el aire congelado).
  if (flakes.visible) {
    const box = 40, base = flakes.userData.base, arr = flakes.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) { const yy = (((base[i + 1] - t * 0.04) % 1) + 1) % 1; arr[i] = tgt.x + (base[i] - 0.5) * box; arr[i + 1] = yy * 22; arr[i + 2] = tgt.z + (base[i + 2] - 0.5) * box; }
    flakes.geometry.attributes.position.needsUpdate = true;
  }

  // ---------------- Espacio ------------------------------------------------------------------------------------
  let front = 0;
  if (space.visible) {
    const sunOn = 0;
    sunMesh.material.color.set(sunOn ? '#fde047' : '#44403c'); sunGlow.visible = true; sunGlow.material.color.set('#7c2d12'); sunGlow.material.opacity = 0.35; sunGlow.scale.setScalar(300);
    // Última luz: frente que se aleja del Sol a la velocidad de la luz (500 s hasta la Tierra).
    if (s.id === 'luz' || s.id === 'cuenta') {
      const s0 = scenes.find((x) => x.id === 'luz').start, s1 = scenes.find((x) => x.id === 'cuenta');
      const span = s1.start + s1.dur * 0.9 - s0;
      front = 0.75 * Math.min(1, (t - s0) / span);
      ring.visible = true; ring.scale.setScalar(80 + (AU + 60) * front);
    } else ring.visible = false;
    const earthLit = (s.id === 'luz' || s.id === 'cuenta') && front < (AU - 80) / (AU + 60);
    sunLight.visible = true; sunLight.intensity = earthLit ? 3.2 : 0;
    hemi.intensity = s.id === 'final' ? 0.9 : earthLit ? 0.25 : s.id === 'orbita' ? 0.35 : 0.12; if (s.id === 'final') { hemi.color.set('#93c5fd'); hemi.groundColor.set('#1e293b'); }
    orbitLine.visible = s.id === 'orbita';
    const ang = s.id === 'orbita' ? local * 0.12 : 0;
    earth.position.set(Math.cos(ang) * AU, 0, Math.sin(ang) * AU);
    moonS.position.set(earth.position.x + 150 * Math.cos(t * 0.5), 10, earth.position.z + 150 * Math.sin(t * 0.5));
    earth.rotation.y = t * 0.05;
    const frozen = s.id === 'final';
    earthMat.color.set(frozen ? '#f8fafc' : '#ffffff'); earthMat.emissive.set(frozen ? '#cbd5e1' : '#000000'); earthMat.emissiveIntensity = frozen ? 0.45 : 1;
    earth.scale.setScalar(frozen ? 1 : 1);
  } else { sunLight.visible = false; }

  // ---------------- Hielo del mar ------------------------------------------------------------------------------
  if (iceSet.visible) {
    const th = lerp(0.6, 3.2, ease.inOut(Math.min(1, local / (s.dur * 0.8))));
    iceSlab.scale.y = th; iceSlab.position.y = th * 0.4;
    fish.forEach((f, i) => { const u = ((t * 0.08 + i * 0.17) % 1); f.position.set(-18 + 36 * u, -4 - i * 1.3, -12.6); f.rotation.y = 0; });
  }
  // ---------------- Ventilas ----------------------------------------------------------------------------------------
  ventLight.visible = ventSet.visible; ventLight.intensity = ventSet.visible ? 60 : 0;
  if (ventSet.visible) {
    smoke.forEach((sp, i) => { const u = ((t * 0.18 + i / smoke.length) % 1); sp.position.set(Math.sin(i * 1.7 + t * 0.3) * u * 1.2, 7.1 + u * 12, Math.cos(i * 1.3) * u * 1.0); sp.scale.setScalar(0.8 + u * 4.5); sp.material.opacity = 0.9 * (1 - u); });
    worms.forEach((g) => { g.rotation.z = 0.12 * Math.sin(t * 1.4 + g.userData.ph); g.rotation.x = 0.1 * Math.cos(t * 1.1 + g.userData.ph); });
  }
  // ---------------- Islandia ---------------------------------------------------------------------------------------
  greenLight.visible = isl.visible; greenLight.intensity = isl.visible ? 45 : 0;
  if (isl.visible) {
    steam.forEach((sp, i) => { const u = ((t * 0.12 + i / steam.length) % 1); sp.position.set(30 + Math.sin(i * 2.1) * u * 4, 9 + u * 26, -14 + Math.cos(i) * u * 3); sp.scale.setScalar(3 + u * 12); sp.material.opacity = 0.75 * (1 - u); });
    for (let i = 0; i < 3; i++) isl.userData['p' + i].userData.pose(t, i === 1 ? 'point' : 'idle', { up: 0.4 });
  }

  // ---------------- Capa de texto -------------------------------------------------------------------------------------
  cam.updateMatrixWorld();
  const labels = [];
  const fa = Math.min(1, local / 0.6);
  const proj = (v, text, color = '#ffffff', alpha = fa) => { const p = v.clone().project(cam); if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) labels.push({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, text, alpha, color }); };
  const skyPos = (o) => o.getWorldPosition(new THREE.Vector3());
  if (s.id === 'jupiter' || s.id === 'saturno') { if (jup.material.opacity > 0.3) proj(skyPos(jup), 'Júpiter', '#fde68a', fa * jup.material.opacity); if (s.id === 'saturno') proj(skyPos(sat), 'Saturno', '#fef3c7'); }
  if (s.id === 'luna') proj(skyPos(moon).add(V(0, 90, 0)), moonDark > 0.5 ? 'La Luna (sin luz)' : 'La Luna', '#e5e7eb');
  if (s.id === 'solar' && panels[0]) proj(panels[0].getWorldPosition(new THREE.Vector3()).add(V(0, 1.4, 0)), 'Paneles solares: 0 watts', '#fca5a5');
  if (s.id === 'oxigeno') proj(V(13, 2.6, 15), 'Oxígeno para miles de años', '#bbf7d0');
  if (s.id === 'lagos' || s.id === 'semana') proj(V(POND.x, 0.6, POND.z), ice > 0.6 ? 'Estanque congelado' : 'El agua se congela', '#bfdbfe');
  if (s.id === 'hielo') { proj(V(ICE[0] - 8, iceSlab.scale.y * 0.9 + 0.3, ICE[2] - 12.2), 'Hielo: la cobija', '#e0f2fe'); proj(V(ICE[0] + 8, -6, ICE[2] - 12.2), 'Agua líquida', '#a5f3fc'); }
  if (s.id === 'ventilas') { proj(V(VENT[0], 7.3, VENT[2]), 'Ventila hidrotermal: calor de la Tierra', '#fdba74'); proj(V(VENT[0] - 3, 1.6, VENT[2] - 2.5), 'Gusanos tubícolas', '#fecaca'); }
  if (s.id === 'humanos') { proj(V(ISL[0], 5.2, ISL[2]), 'Invernadero', '#f5d0fe'); proj(V(ISL[0] + 30, 10, ISL[2] - 14), 'Planta geotérmica', '#e2e8f0'); }
  if (s.id === 'luz' || s.id === 'cuenta') { proj(S([0, 120, 0]), 'Sol (apagado)', '#cbd5e1'); proj(S([AU, 60, 0]), 'Tierra', '#93c5fd'); if (ring.visible) proj(S([0, 0, -(80 + (AU + 60) * front)]), 'Última luz', '#fde68a'); }
  if (s.id === 'orbita') { proj(S([0, 120, 0]), 'Sol apagado (su gravedad sigue)', '#cbd5e1'); proj(earth.getWorldPosition(new THREE.Vector3()).add(V(0, 60, 0)), 'Tierra', '#93c5fd'); }

  // Contador de tiempo y chip de temperatura.
  let counter = null, chip = null;
  if (E.time) {
    let value = E.time;
    if (E.time === 'cuenta' || E.time === '0 s') {
      const s0 = scenes.find((x) => x.id === 'luz').start, s1 = scenes.find((x) => x.id === 'cuenta');
      const k = Math.min(1, Math.max(0, (t - s0) / (s1.start + s1.dur * 0.9 - s0))), sec = Math.round(375 * k);
      value = s.id === 't0' ? '0 s' : `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, '0')} s`;
    }
    if (E.time === 'ultimos') { const sec = Math.round(lerp(375, 495, Math.min(1, local / s.dur))); value = `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, '0')} s`; }
    if (s.id === 'apagon' && local < offT) value = '8 min 19 s';
    counter = { label: 'DESDE QUE SE APAGÓ EL SOL', value };
    if (E.temp) chip = `TEMPERATURA: ${E.temp}`;
  }
  let title = null;
  if (s.titleCard) title = { lines: s.titleCard, alpha: Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5)), y: s.titleY ?? 0.3 };
  const ov = { counter, chip, title, labels };
  if (s.id === 'intro' && title && title.alpha > 0.5) { ov.counter = null; ov.chip = null; }
  return ov;
}
