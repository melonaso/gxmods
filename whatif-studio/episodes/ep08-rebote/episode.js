// Episodio 08: una pelota que rebota 10% más alto cada vez. Altura del rebote n: 1.1^n m.
// Física: vuelo de un rebote de altura h = 2·√(2h/g); velocidad al caer = √(2gh) (sin aire).
// Escenas en distintos lugares del mismo barrio (cortes de cámara): cancha → casa → coche →
// plaza (choques con cannon-es) → torre (cráter y escombros) → nubes → aviones → espacio.
import { ease, lerp } from '../../engine/timeline.js';
import * as MD from '../../engine/models.js';
import * as TX from '../../engine/textures.js';
import { dressWorld, streetGrid, lineOfHouses, lampsAlong } from '../../engine/town.js';
import { createPlacer } from '../../engine/actors.js';
import { createSim, boxBody, sphereBody, cylBody, CANNON } from '../../engine/physics.js';
import { createEarth, createStars } from '../../engine/planet.js';
import { bake, solidOverlaps } from '../../engine/bake.js';

const G = 9.81, BR = 0.12;                       // gravedad (m/s²) y radio de la pelota (m)
const HN = (n) => Math.pow(1.1, n);               // altura del rebote n
const TF = (h) => 2 * Math.sqrt((2 * h) / G);     // segundos en el aire
const VEL = (h) => Math.sqrt(2 * G * h);          // m/s al tocar el suelo
const CUM = [0]; for (let n = 1; n <= 130; n++) CUM[n] = CUM[n - 1] + TF(HN(n)); // tiempo real acumulado

const SPOT = {
  court: { x: -60, z: 30, y: 0.06 },
  house: { x: 24, z: 11.5, y: 0 },
  car: { x: 63.87, z: 2.6, y: 1.51 },
  plaza: { x: 150, z: -40, y: 0.12 },
  tower: { x: 262, z: -42, y: 0.12 },
};
const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtH = (h) => (h < 10 ? `${nf(h, 2)} m` : h < 1000 ? `${nf(h, h < 100 ? 1 : 0)} m` : `${nf(h / 1000, h < 10000 ? 1 : 0)} km`);

let T, ball, trail, kid, dog, sim, dust = [], schedule = [], landings = [], car, owner, plaza = {}, tower = {}, earth, stars, dress, clouds, plane, contrails = [], birds = [];
let city = [], crater, rocks = [], neighbors = [], ruler, earthMat, earthFog;

export function setup(C) {
  const { THREE, world, scenes } = C;
  T = THREE;
  const { scene } = world;
  dress = dressWorld(world, { top: '#4f9be0', horizon: '#d6ecf8' });
  const P = createPlacer();
  const rng = MD.mulberry(808);
  const before = new Set(scene.children);
  const add = (o) => { scene.add(o); return o; };

  // ---------------- Calles, parque con cancha, casas, plaza y torre --------------------------
  streetGrid(scene, P, { xs: [-20, 100, 220], zs: [0], x0: -170, x1: 400, z0: -150, z1: 80 });
  P.blockRect(-104, -26, 8, 64);              // parque
  P.blockRect(126, 214, -60, -20);            // plaza (y pasillo libre para la cámara hacia el este)
  P.blockRect(232, 330, -95, -18);            // explanada de la torre
  // Cancha: losa de concreto con líneas pintadas, aro, banca y bote.
  const courtTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 352; const g = c.getContext('2d');
    g.fillStyle = '#3f7f6a'; g.fillRect(0, 0, 512, 352); g.fillStyle = '#c2643b'; g.fillRect(24, 24, 464, 304);
    for (let i = 0; i < 4000; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'; g.fillRect((i * 97) % 512, (i * 53) % 352, 2, 2); }
    g.strokeStyle = '#f8fafc'; g.lineWidth = 5; g.strokeRect(24, 24, 464, 304); g.beginPath(); g.moveTo(256, 24); g.lineTo(256, 328); g.stroke();
    g.beginPath(); g.arc(256, 176, 46, 0, Math.PI * 2); g.stroke(); g.strokeRect(24, 116, 90, 120); g.strokeRect(398, 116, 90, 120);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
  })();
  const court = new THREE.Mesh(new THREE.BoxGeometry(22, 0.06, 15), [MD.M('#3f7f6a'), MD.M('#3f7f6a'), MD.M('#ffffff', { map: courtTex, roughness: 0.9 }), MD.M('#3f7f6a'), MD.M('#3f7f6a'), MD.M('#3f7f6a')]);
  court.position.set(SPOT.court.x, 0.03, SPOT.court.z); court.receiveShadow = true; add(court);
  const hoop = MD.createHoop(); hoop.position.set(SPOT.court.x - 10.6, 0.06, SPOT.court.z); hoop.rotation.y = Math.PI / 2; add(hoop);
  const bench = MD.createBench(); bench.position.set(SPOT.court.x + 2, 0.06, SPOT.court.z - 6.5); add(bench);
  // Regla de medir junto a la pelota (marcas cada 10 cm, números cada 50 cm).
  ruler = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 1024; const g = c.getContext('2d');
    for (let i = 0; i < 30; i++) { g.fillStyle = i % 2 ? '#f8fafc' : '#facc15'; g.fillRect(0, 1024 - (i + 1) * (1024 / 30), 64, 1024 / 30); }
    g.fillStyle = '#111827'; for (let i = 0; i <= 30; i++) g.fillRect(0, 1024 - i * (1024 / 30) - 1, i % 5 === 0 ? 64 : 28, 3);
    g.font = 'bold 26px sans-serif'; for (let m = 0.5; m < 3; m += 0.5) g.fillText(`${m}`, 22, 1024 - m * 10 * (1024 / 30) + 9);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 0.05), [MD.M('#e5e7eb'), MD.M('#e5e7eb'), MD.M('#e5e7eb'), MD.M('#e5e7eb'), MD.M('#ffffff', { map: t }), MD.M('#e5e7eb')]);
    r.position.set(SPOT.court.x + 0.75, 1.56, SPOT.court.z - 0.1); r.castShadow = true; add(r);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.05, 12), MD.M('#334155')); base.position.set(SPOT.court.x + 0.75, 0.085, SPOT.court.z - 0.1); add(base);
    return r;
  })();
  // Árboles del parque (fuera de la cancha).
  for (let k = 0; k < 40; k++) {
    const x = -100 + rng() * 72, z = 10 + rng() * 52, h = 6 + rng() * 5;
    if (Math.abs(x - SPOT.court.x) < 14 && Math.abs(z - SPOT.court.z) < 11) continue;
    if (!P.place(x, z, h * 0.36)) continue;
    const t = MD.createTreeHQ({ h, seed: k + 1 }); t.position.set(x, 0, z); add(t);
  }
  // Casa de la escena 3 (de un piso: el techo llega a ~5.9 m) con su jardín.
  const hq = MD.createHouseHQ({ w: 9, d: 7, floors: 1, wall: 'siding', wallColor: '#fde7b0', roofColor: '#9a3412' });
  hq.position.set(SPOT.house.x, 0, 21.5); hq.rotation.y = Math.PI; P.place(SPOT.house.x, 21.5, 6.2); add(hq);
  P.blockRect(SPOT.house.x - 6, SPOT.house.x + 6, 6.5, 17);   // jardín libre para la pelota
  P.blockRect(SPOT.house.x + 5.5, SPOT.house.x + 22, 6.5, 34); // sin árboles detrás de la pelota (en cámara)
  P.blockCircle(64, 10, 7);                                    // ni detrás del coche
  // Coche de la escena 4.
  car = MD.createCar({ color: '#2563eb' }); car.position.set(64, 0.03, 2.6); scene.add(car); // se mueve: no se hornea
  P.blockCircle(64, 2.6, 2.6);
  // Casas a ambos lados de la calle principal.
  lineOfHouses(scene, P, rng, { zStreet: 0, side: 1, x0: -170, x1: 96, carChance: 0.3, noCarsNear: [64] });
  lineOfHouses(scene, P, rng, { zStreet: 0, side: -1, x0: -170, x1: 96, carChance: 0.3, noCarsNear: [64] });
  for (const l of lampsAlong(scene, { zStreet: 0, x0: -160, x1: 380, every: 32, side: 1 })) if ([32, 64].includes(l.position.x)) scene.remove(l); // sin farolas frente a la casa y el coche
  // Plaza: losa de concreto, bancas, edificio de 17 pisos al fondo.
  const con = TX.concrete();
  const pad = (cx, cz, w, d) => { const m = new THREE.Mesh(MD.boxUV(w, 0.12, d, 2), MD.M('#ffffff', { map: con.map, normalMap: con.normalMap, roughness: 0.95 })); m.position.set(cx, 0.06, cz); m.receiveShadow = true; add(m); };
  pad(150, -40, 46, 38); pad(281, -56, 96, 74);
  const apt = MD.createApartment({ floors: 17, w: 20, d: 16, color: '#e7e5e4', seed: 4 }); apt.position.set(150, 0, -78); add(apt);
  P.place(150, -78, 13);
  for (const [x, z, a] of [[136, -26, 0], [164, -26, 0], [133, -52, Math.PI / 2], [167, -54, -Math.PI / 2]]) { const b = MD.createBench(); b.position.set(x, 0.12, z); b.rotation.y = a; add(b); }
  // Torre de 182 m (más antena de 22 m) y otros edificios de fondo.
  const tw = MD.createTower({ h: 178.4, w: 30, antenna: 22 }); tw.position.set(300, 0.12, -66); add(tw);
  P.place(300, -66, 24);
  for (let k = 0; k < 14; k++) {
    const x = -120 + k * 38 + rng() * 10, z = -125 - rng() * 30, fl = 8 + ((rng() * 14) | 0);
    if (!P.place(x, z, 13)) continue;
    const b = MD.createApartment({ floors: fl, w: 18, d: 16, color: ['#e7e5e4', '#d6d3d1', '#fde68a', '#bfdbfe', '#fecaca'][k % 5], seed: k + 9 }); b.position.set(x, 0, z); add(b);
  }
  // Árboles sueltos en el resto del mapa.
  for (let k = 0; k < 260; k++) {
    const x = -170 + rng() * 560, z = -150 + rng() * 230, h = 6 + rng() * 6;
    if (!P.place(x, z, h * 0.36 + 0.3)) continue;
    const t = MD.createTreeHQ({ h, seed: 500 + k, pine: rng() < 0.15 }); t.position.set(x, 0, z); add(t);
  }
  // Todo lo estático hasta aquí se revisa (choques) y se hornea en pocas mallas.
  const staticRoots = scene.children.filter((o) => !before.has(o) && o !== car);
  world.userData.preOverlaps = solidOverlaps(staticRoots);
  city = bake(scene, staticRoots);

  // ---------------- Personajes -------------------------------------------------------------
  kid = MD.createCharacter({ seed: 77, kid: true, shirt: '#f97316', pants: '#1e3a8a', hairStyle: 'cap', capColor: '#dc2626', skin: '#e0ac69' });
  scene.add(kid);
  dog = MD.createDog({ color: '#c8873a' }); scene.add(dog);
  owner = MD.createCharacter({ seed: 31, shirt: '#16a34a', hairStyle: 'short' }); scene.add(owner);
  earthFog = true;
  for (let i = 0; i < 2; i++) { const p = MD.createCharacter({ seed: 40 + i }); p.position.set(SPOT.house.x - 4.6 + i * 9.6, 0, 15.2 - i * 1.2); p.rotation.y = Math.PI + (i ? -0.5 : 0.5); scene.add(p); neighbors.push(p); }
  plaza.people = [];
  for (let i = 0; i < 9; i++) {
    const a = 0.4 + i * 0.62, r = 13 + (i % 3) * 2.5;
    const p = MD.createCharacter({ seed: 200 + i });
    p.position.set(150 + Math.cos(a) * r, 0.12, -40 + Math.sin(a) * r);
    p.rotation.y = Math.atan2(150 - p.position.x, -40 - p.position.z);
    p.userData.home = p.position.clone(); p.userData.runs = i % 3 === 0; p.userData.a = a;
    scene.add(p); plaza.people.push(p);
  }
  tower.people = [];
  for (let i = 0; i < 7; i++) { const p = MD.createCharacter({ seed: 300 + i }); p.position.set(246 + i * 4.2, 0.12, -62 - (i % 2) * 2.5); p.rotation.y = 0.2 - (i - 3) * 0.08; scene.add(p); tower.people.push(p); }

  // ---------------- Pelota, estela y polvo --------------------------------------------------
  ball = new THREE.Mesh(new THREE.SphereGeometry(BR, 32, 20), MD.M('#ffffff', { map: TX.basketball().map, roughness: 0.65 }));
  ball.castShadow = true; scene.add(ball);
  trail = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.45, depthWrite: false, fog: false }));
  trail.visible = false; scene.add(trail);
  const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  for (let i = 0; i < 48; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: '#cbbfa8', transparent: true, depthWrite: false })); s.visible = false; scene.add(s); dust.push(s); }

  // ---------------- Cráter de la torre --------------------------------------------------------
  const cc = document.createElement('canvas'); cc.width = cc.height = 256;
  { const g = cc.getContext('2d'); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#1c1917'); gr.addColorStop(0.55, '#44403c'); gr.addColorStop(0.85, '#78716c'); gr.addColorStop(1, '#a8a29e'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#1c1917'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { const a = i * 0.45; g.beginPath(); g.moveTo(128 + Math.cos(a) * 60, 128 + Math.sin(a) * 60); g.lineTo(128 + Math.cos(a + 0.1) * 124, 128 + Math.sin(a + 0.1) * 124); g.stroke(); } }
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  crater = new THREE.Mesh(new THREE.CircleGeometry(1, 40), MD.M('#ffffff', { map: ct, roughness: 1 }));
  crater.rotation.x = -Math.PI / 2; crater.position.set(SPOT.tower.x, 0.165, SPOT.tower.z); crater.visible = false; crater.receiveShadow = true; scene.add(crater);
  for (let i = 0; i < 16; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + (i % 3) * 0.12, 0), MD.M('#78716c', { roughness: 1, flatShading: true })); r.castShadow = true; r.visible = false; r.userData.a = i * 0.39; scene.add(r); rocks.push(r); }

  // ---------------- Nubes (capa a 1.3–1.8 km), avión y la Tierra -----------------------------
  clouds = new THREE.Group(); scene.add(clouds);
  const cm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: false });
  for (let i = 0; i < 70; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(90 + rng() * 110, 2), cm); s.position.set((k - 2.5) * 110 + rng() * 60, rng() * 70, rng() * 120 - 60); s.scale.y = 0.55; c.add(s); }
    const a = rng() * Math.PI * 2, d = 400 + rng() * 6000;
    c.position.set(SPOT.tower.x + Math.cos(a) * d, 1350 + rng() * 450, SPOT.tower.z + Math.sin(a) * d);
    clouds.add(c);
  }
  plane = MD.createPlane(); scene.add(plane);
  for (const s of [-1, 1]) { const ctl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.5, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false })); ctl.rotation.z = Math.PI / 2; ctl.userData.s = s; scene.add(ctl); contrails.push(ctl); }
  const E = createEarth({ lat: 19.4, lon: -99.1, drop: 3 }); earth = E.group; earth.visible = false; scene.add(earth);
  earthMat = E.earth.material;
  stars = createStars(); stars.visible = false; scene.add(stars);
  // Pájaros en el techo del edificio de la plaza (salen volando con el primer golpe).
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), MD.M('#334155')); body.scale.set(1.6, 0.8, 0.8); b.add(body);
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.32), MD.M('#475569')); w.position.z = s * 0.18; w.userData.s = s; b.add(w); }
    b.position.set(142 + i * 2.2, 55.4, -71); scene.add(b); birds.push(b);
  }

  // ---------------- Calendario de rebotes por escena ----------------------------------------
  for (const s of scenes) {
    const sp = SPOT[s.spot]; const list = [];
    const D = s.dur - 0.7;
    if (s.id === 'regla' || s.id === 'dobla' || (s.n1 > s.n0)) {
      let idx = [];
      for (let n = s.n0 + 1; n <= s.n1; n++) idx.push(n);
      const maxShow = s.id === 'aviones' || s.id === 'espacio' ? 1 : s.id === 'nubes' ? 3 : s.id === 'torre' ? 5 : 14;
      if (idx.length > maxShow) idx = Array.from({ length: maxShow }, (_, i) => Math.round(s.n0 + ((s.n1 - s.n0) * (i + 1)) / maxShow));
      const segs = [];
      if (s.id === 'regla') segs.push({ n: 0, h: 1, fall: true });
      for (const n of idx) segs.push({ n, h: HN(n) });
      const total = segs.reduce((a, g) => a + (g.fall ? TF(g.h) / 2 : TF(g.h)), 0);
      const speed = total / D, t0 = s.id === 'regla' ? 0.9 : 0.25;
      let t = t0;
      for (const g of segs) { const d = (g.fall ? TF(g.h) / 2 : TF(g.h)) / speed * (D - t0) / D; list.push({ ...g, t0: t, t1: t + d }); t += d; }
      schedule.push({ s, sp, list, speed });
    } else if (s.id === 'real') {
      let h = 1.5, t = 0.9;
      list.push({ n: 0, h, fall: true, t0: t, t1: t + TF(h) / 2 }); t += TF(h) / 2;
      for (let k = 0; k < 9; k++) { h *= 0.7; const d = TF(h); list.push({ n: k + 1, h, t0: t, t1: t + d }); t += d; }
      schedule.push({ s, sp, list, speed: 1, real: true });
    } else schedule.push({ s, sp, list: [], speed: 1 });
  }
  // Aterrizajes (para polvo, sonidos, golpes y abolladuras).
  for (const sc of schedule) for (const b of sc.list) landings.push({ t: sc.s.start + b.t1, v: VEL(b.h), sc, b });

  // ---------------- Física: plaza (objetos que salen volando) y escombros de la torre --------
  sim = createSim({ restitution: 0.3 });
  const holder = (obj, oy) => { const h = new THREE.Group(); obj.position.y = oy; h.add(obj); scene.add(h); return h; };
  const prng = MD.mulberry(42);
  const taken = [];
  for (let i = 0; i < 40; i++) {
    // Posiciones sin encimarse (si dos cuerpos empiezan encimados, la física los separa de golpe).
    let a, r, x, z, tries = 0;
    do { a = prng() * Math.PI * 2; r = 1.6 + prng() * 5.4; x = 150 + Math.cos(a) * r; z = -40 + Math.sin(a) * r; tries++; }
    while (taken.some(([qx, qz]) => Math.hypot(qx - x, qz - z) < 1.2) && tries < 50);
    taken.push([x, z]);
    const kind = i % 4;
    if (kind === 0) sim.add(cylBody(0.29, 0.9, 12, x, 0.12 + 0.45, z), holder(MD.createTrashCan(), -0.45));
    else if (kind === 1) { const b = new CANNON.Body({ mass: 1.5, shape: new CANNON.Cylinder(0.06, 0.18, 0.64, 10), position: new CANNON.Vec3(x, 0.12 + 0.32, z) }); sim.add(b, holder(MD.createCone(), -0.32)); }
    else if (kind === 2) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), MD.M(['#f8fafc', '#facc15', '#ef4444'][i % 3], { roughness: 0.5 })); m.castShadow = true; const h = new THREE.Group(); h.add(m); scene.add(h); sim.add(sphereBody(0.11, 0.45, x, 0.12 + 0.11, z), h); }
    else { const m = new THREE.Mesh(MD.boxUV(0.6, 0.6, 0.6, 0.6), MD.M('#ffffff', { map: TX.wood('#b07a3f').map, roughness: 0.85 })); m.castShadow = true; const h = new THREE.Group(); h.add(m); scene.add(h); sim.add(boxBody(0.6, 0.6, 0.6, 8, x, 0.12 + 0.3, z, prng() * 3), h); }
  }
  // La losa de la plaza es un cuerpo fijo (los objetos descansan sobre ella).
  sim.addStatic(boxBody(46, 0.12, 38, 0, 150, 0.06, -40));
  sim.addStatic(boxBody(96, 0.12, 74, 0, 281, 0.06, -56));
  // Los primeros golpes solo hacen temblar las cosas; los últimos cuatro (en la toma cercana) las avientan.
  const pls = landings.filter((l) => l.sc.s.id === 'plaza');
  pls.forEach((l, i) => sim.blast(l.t, SPOT.plaza.x, 0.2, SPOT.plaza.z, i < pls.length - 4 ? 0.6 : i < pls.length - 1 ? l.v * 0.1 : l.v * 0.24, 12));
  // Escombros: aparecen en el borde del cráter con cada golpe fuerte en la torre.
  tower.chunks = [];
  const tl = landings.filter((l) => l.sc.s.id === 'torre');
  for (let i = 0; i < 24; i++) {
    const sz = 0.25 + prng() * 0.45, m = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), MD.M(i % 2 ? '#a8a29e' : '#78716c', { roughness: 1, flatShading: true }));
    m.castShadow = true; const h = new THREE.Group(); h.add(m); h.visible = false; scene.add(h);
    const b = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, shape: new CANNON.Sphere(sz * 0.85), position: new CANNON.Vec3(SPOT.tower.x, -40 - i, SPOT.tower.z) });
    sim.add(b, h);
    const L = tl[Math.min(tl.length - 1, Math.floor(i / 6) + Math.max(0, tl.length - 4))];
    const a = prng() * Math.PI * 2, sp = 7 + prng() * 9;
    h.userData.t = L.t;
    sim.at(L.t, () => {
      b.type = CANNON.Body.DYNAMIC; b.mass = 30 * sz; b.updateMassProperties();
      b.position.set(SPOT.tower.x + Math.cos(a) * 0.8, 0.6, SPOT.tower.z + Math.sin(a) * 0.8);
      b.velocity.set(Math.cos(a) * sp, 6 + prng() * 8, Math.sin(a) * sp); b.angularVelocity.set(prng() * 8, prng() * 8, prng() * 8); b.wakeUp();
    });
    tower.chunks.push(h);
  }
  const lastT = scenes[scenes.length - 1].start + scenes[scenes.length - 1].dur + 3;
  sim.run(lastT);
}

/** Sonidos: bote, golpe fuerte, crujido del cráter, alarma del coche y el avión. */
export function sfx() {
  const out = [];
  for (const l of landings) {
    out.push({ t: l.t, type: l.v > 24 ? 'boom' : 'thud' });
    if (l.sc.s.id === 'torre') out.push({ t: l.t + 0.02, type: 'crack' });
  }
  const c = landings.find((l) => l.sc.s.id === 'coche'); if (c) out.push({ t: c.t + 0.15, type: 'alarm' }, { t: c.t + 1.9, type: 'alarm' });
  const a = schedule.find((x) => x.s.id === 'aviones'); if (a) out.push({ t: a.s.start + 0.6, type: 'jet' });
  return out.sort((x, y) => x.t - y.t);
}

/** Posición de la pelota (y la altura del rebote en curso) en el instante local de la escena. */
function ballAt(sc, local) {
  const L = sc.list;
  if (!L.length) return null;
  if (local <= L[0].t0) return { y: L[0].fall ? L[0].h : 0, cur: L[0], i: 0 };
  for (let i = 0; i < L.length; i++) {
    const b = L[i];
    if (local <= b.t1) {
      const u = (local - b.t0) / (b.t1 - b.t0);
      const y = b.fall ? b.h * (1 - u * u) : b.h * 4 * u * (1 - u);
      return { y, cur: b, i, u };
    }
  }
  const last = L[L.length - 1];
  return { y: 0, cur: last, i: L.length - 1, u: 1, done: true };
}

export function update(C, { t, scene: s, local }) {
  const { world, W, H } = C;
  const THREE = T;
  const sc = schedule[s.index], sp = sc.sp;
  const big = ['nubes', 'aviones', 'espacio'].includes(s.id);
  const space = s.id === 'espacio', high = s.id === 'aviones' || space;
  sim.apply(t);

  // ---------------- Pelota ---------------------------------------------------------------------
  let st = ballAt(sc, local);
  let by;
  if (!st) { // en manos del niño (intro y final)
    by = 0.98; ball.position.set(sp.x, by, sp.z + 0.32);
  } else {
    if (sc.list[0].fall && local <= sc.list[0].t0) st = { ...st, y: sc.list[0].h };
    by = sp.y + BR + st.y;
    ball.position.set(sp.x, by, sp.z);
    ball.rotation.x = t * 3; ball.rotation.z = t * 1.3;
  }
  // Squash al tocar el suelo (se aplasta un poco y recupera).
  const landing = landings.find((l) => l.sc === sc && t >= l.t && t < l.t + 0.08);
  ball.scale.set(1, 1, 1);
  if (landing && !big) ball.scale.set(1.15, 0.78, 1.15);

  // ---------------- Cámara por escena (encuadre fijo, sin zooms rápidos) -----------------------
  const cam = world.camera;
  const hMax = sc.list.length ? Math.max(...sc.list.map((b) => b.h)) : 1;
  let pos, tgt, size;
  const drift = 0; // cámara quieta: un deslizamiento de centímetros hace "hormiguear" las texturas finas lejanas
  if (s.spot === 'court') {
    const near = s.id === 'intro' || s.id === 'outro';
    pos = new THREE.Vector3(sp.x + 1.6 + drift * 20, near ? 1.25 : 1.35, sp.z + (near ? 4.2 : 5.4)); tgt = new THREE.Vector3(sp.x - 0.15, near ? 0.85 : 1.0, sp.z); size = 6;
  } else if (s.id === 'casa') {
    pos = new THREE.Vector3(sp.x + 7.5 - drift * 20, 1.9, sp.z - 9.5); tgt = new THREE.Vector3(sp.x - 1, 3.2, sp.z + 3); size = 14;
  } else if (s.id === 'coche') {
    pos = new THREE.Vector3(sp.x + 9.5 - drift * 10, 1.5, sp.z - 6); tgt = new THREE.Vector3(sp.x, 3.4, sp.z + 0.5); size = 14;
  } else if (s.id === 'plaza') {
    // Toma abierta (la pelota sube 55 m) y, para los últimos golpes, toma cercana de la plaza.
    const pl = landings.filter((l) => l.sc === sc), close = pl.length > 3 && t >= pl[pl.length - 4].t - 0.6;
    if (close) { pos = new THREE.Vector3(sp.x + 9.5, 2.4, sp.z + 8.5); tgt = new THREE.Vector3(sp.x - 0.5, 1.4, sp.z - 0.5); size = 14; }
    else { pos = new THREE.Vector3(sp.x + 78, 18, sp.z + 8); tgt = new THREE.Vector3(sp.x - 4, 26, sp.z - 8); size = 60; }
  } else if (s.id === 'torre') {
    // Toma abierta junto a la torre y, tras el último golpe, el cráter de cerca.
    const tl = landings.filter((l) => l.sc === sc), close = tl.length && t >= tl[tl.length - 1].t - 0.05;
    if (close) { pos = new THREE.Vector3(sp.x + 13, 3.8, sp.z + 15); tgt = new THREE.Vector3(sp.x - 1, 1.0, sp.z - 2); size = 22; }
    else { pos = new THREE.Vector3(sp.x - 150, 30, sp.z + 260); tgt = new THREE.Vector3(sp.x + 12, 96, sp.z - 10); size = 160; }
  } else if (s.id === 'nubes') {
    pos = new THREE.Vector3(sp.x - 2600, 700, sp.z + 2900); tgt = new THREE.Vector3(sp.x, 1050, sp.z); size = 900;
  } else if (s.id === 'aviones') {
    pos = new THREE.Vector3(sp.x + 210, 10290, sp.z + 330); tgt = new THREE.Vector3(sp.x, 10262, sp.z); size = 400;
  } else {
    pos = new THREE.Vector3(sp.x - 255000, 120000, sp.z + 150000); tgt = new THREE.Vector3(sp.x, 60000, sp.z); size = 50000;
  }
  cam.position.copy(pos); cam.lookAt(tgt);
  cam.near = space ? 50 : high ? 2 : 0.05; cam.far = space ? 4e7 : high ? 8e5 : big ? 60000 : 9000;
  cam.updateProjectionMatrix();
  world.fitToScale({ x: tgt.x, y: 0, z: tgt.z }, size);
  const fog = world.scene.fog;
  if (s.id === 'nubes') { fog.near = 3500; fog.far = 11000; }
  if (s.id === 'aviones') { fog.near = 15000; fog.far = 420000; }
  if (space) { fog.near = 1e9; fog.far = 2e9; }

  // Tamaño visible mínimo de la pelota y estela vertical en las escenas enormes.
  const dist = cam.position.distanceTo(ball.position);
  const vis = Math.max(1, dist / 38);
  ball.scale.multiplyScalar(vis);
  trail.visible = big || s.id === 'torre';
  if (trail.visible) {
    const r = BR * vis * 0.32, top = by, bot = sp.y;
    trail.scale.set(r, Math.max(0.01, top - bot), r); trail.position.set(sp.x, (top + bot) / 2, sp.z);
  }

  // ---------------- Qué se ve en cada escena ---------------------------------------------------
  for (const o of city) o.visible = !high;
  world.ground.visible = !high;
  earth.visible = high; stars.visible = space;
  clouds.visible = !space;
  dress.sky.visible = !space;
  world.scene.background.set(space ? '#000000' : '#d6ecf8');
  kid.visible = dog.visible = s.spot === 'court' || s.id === 'casa';
  owner.visible = s.id === 'coche';
  for (const p of neighbors) p.visible = s.id === 'casa';
  for (const p of plaza.people) p.visible = s.id === 'plaza';
  for (const p of tower.people) p.visible = s.id === 'torre' || s.id === 'nubes';
  plane.visible = s.id === 'aviones'; for (const c of contrails) c.visible = plane.visible;

  // ---------------- Niño y perro ------------------------------------------------------------------
  if (s.spot === 'court') {
    kid.position.set(sp.x, sp.y, sp.z - 0.32); kid.rotation.y = 0.15;
    const released = s.id === 'regla' ? local > 0.9 : s.id === 'real' ? local > 0.9 : s.id === 'dobla';
    if (s.id === 'intro' || s.id === 'outro') kid.userData.pose(t, 'hold', { up: 0 });
    else if (!released) kid.userData.pose(t, 'hold', { up: s.id === 'real' ? 0.55 : 0.12 });
    else kid.userData.pose(t, 'lookUp', { amount: Math.min(1, by / 1.6) });
    if (s.id === 'intro' || s.id === 'outro' || (s.id !== 'real' && !released)) { ball.position.set(kid.position.x + 0.02, s.id === 'real' ? 1.5 : (s.id === 'regla' ? 1.0 : 0.98), kid.position.z + 0.34); if (s.id === 'regla' || s.id === 'real') ball.position.y = sc.list[0].h + sp.y + BR; }
    // Perro: emocionado mientras la pelota rebota; al final va por ella y se sienta.
    if (s.id === 'real' && local > 6) { const k = Math.min(1, (local - 6) / 1.2); dog.position.set(lerp(sp.x + 1.3, sp.x + 0.45, k), sp.y, lerp(sp.z + 0.9, sp.z + 0.35, k)); dog.rotation.y = -1.9; dog.userData.pose(t, k < 1 ? 'run' : 'sit'); }
    else { dog.position.set(sp.x + 1.3, sp.y, sp.z + 0.9); dog.rotation.y = -0.6; dog.userData.pose(t, s.id === 'intro' ? 'sit' : 'jump'); }
    if (s.id === 'real' && st?.done) ball.position.y = sp.y + BR;
  } else if (s.id === 'casa') {
    kid.position.set(sp.x - 1.6, 0, sp.z - 1.2); kid.rotation.y = -0.4 + Math.PI; kid.userData.pose(t, 'lookUp', { amount: Math.min(1, by / 4) });
    dog.position.set(sp.x + 1.4, 0, sp.z - 1.5); dog.rotation.y = Math.PI + 0.5; dog.userData.pose(t, 'jump');
    neighbors.forEach((p, i) => p.userData.pose(t, i ? 'point' : 'lookUp', { amount: 1, up: 1.4 }));
  }

  // ---------------- Coche: abolladura, rebote de la suspensión y alarma ---------------------------
  const carL = landings.filter((l) => l.sc.s.id === 'coche');
  const hits = carL.filter((l) => t >= l.t);
  const lastHit = hits.length ? hits[hits.length - 1] : null;
  const dent = Math.min(0.32, hits.reduce((a, l) => a + l.v * 0.0012, 0));
  car.userData.roofCap.position.y = 1.45 - dent; car.userData.roofCap.scale.y = 1;
  car.userData.body.position.y = lastHit ? -Math.exp(-(t - lastHit.t) * 9) * Math.sin((t - lastHit.t) * 30) * 0.05 : 0;
  car.userData.alarm(hits.length > 0 && t < (carL[0]?.t ?? 0) + 3.6 && Math.floor((t - carL[0].t) * 4) % 2 === 0);
  if (s.id === 'coche') {
    // La pelota rebota sobre el techo abollado.
    ball.position.y = by - dent;
    const k = hits.length ? Math.min(1, (t - carL[0].t) / 4) : 0;
    owner.position.set(lerp(66, 65.2, k), 0.15, lerp(14, 6.6, k)); owner.rotation.y = Math.atan2(-0.8, -7.4);
    owner.userData.pose(t, k > 0 && k < 1 ? 'run' : hits.length ? 'scared' : 'idle');
  }

  // ---------------- Plaza: gente que se agacha o corre, pájaros que se van -----------------------
  const pl = landings.filter((l) => l.sc.s.id === 'plaza');
  const p0 = pl[0]?.t ?? 1e9;
  if (s.id === 'plaza') {
    for (const p of plaza.people) {
      if (t < p0) { p.position.copy(p.userData.home); p.userData.pose(t, 'point', { up: 1.5 }); continue; }
      if (p.userData.runs) {
        const k = Math.min(1, (t - p0) / 5), a = p.userData.a;
        p.position.set(p.userData.home.x + Math.cos(a) * 9 * k, 0.12, p.userData.home.z + Math.sin(a) * 9 * k);
        p.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); p.userData.pose(t, k < 1 ? 'run' : 'scared');
      } else { p.position.copy(p.userData.home); p.userData.pose(t, 'scared'); }
    }
  }
  birds.forEach((b, i) => {
    const k = Math.max(0, t - p0);
    b.position.set(142 + i * 2.2 + k * (3 + i), 55.4 + k * (2.2 + (i % 3)), -71 - k * (2 + i * 0.6));
    b.children.forEach((c) => { if (c.userData.s) c.rotation.x = c.userData.s * (k > 0 ? Math.sin(t * 22 + i) * 0.7 : 0.1); });
  });

  // ---------------- Torre: cráter que crece y gente que señala -----------------------------------
  const tlands = landings.filter((l) => l.sc.s.id === 'torre' && t >= l.t);
  crater.visible = tlands.length > 0;
  const cr = 0.9 + tlands.reduce((a, l) => a + l.v * 0.012, 0);
  crater.scale.setScalar(cr);
  rocks.forEach((r, i) => { r.visible = crater.visible; r.position.set(SPOT.tower.x + Math.cos(r.userData.a) * cr * 1.02, 0.18, SPOT.tower.z + Math.sin(r.userData.a) * cr * 1.02); r.rotation.set(i, i * 2, 0); });
  for (const c of tower.chunks) c.visible = t >= c.userData.t;
  for (const p of tower.people) p.userData.pose(t, 'point', { up: 1.45 });

  // ---------------- Polvo en cada golpe -----------------------------------------------------------
  let di = 0;
  for (const l of landings) {
    const age = t - l.t;
    if (age < 0 || age > 1.4 || l.sc !== sc || big || di >= dust.length - 12) continue;
    const spd = Math.min(1, l.v / 30), n = 12;
    for (let k = 0; k < n; k++) {
      const s2 = dust[di++], a = (k / n) * Math.PI * 2 + l.t;
      const small = s.spot === 'court' || s.spot === 'car';
      const r = (0.2 + spd * 3.5) * Math.sqrt(age / 1.4) * (small ? 0.3 : 1);
      s2.visible = true;
      s2.position.set(sp.x + Math.cos(a) * r, sp.y + 0.15 + age * (0.4 + spd), sp.z + Math.sin(a) * r);
      s2.scale.setScalar((0.25 + spd * 2.2) * (0.5 + age) * (small ? 0.3 : 1));
      s2.material.opacity = 0.75 * (1 - age / 1.4);
    }
  }
  for (; di < dust.length; di++) dust[di].visible = false;

  // ---------------- Avión cruzando junto a la pelota (escena de 10 km) ---------------------------
  if (plane.visible) {
    const px = sp.x - 420 + local * 95;
    plane.position.set(px, 10245, sp.z - 60); plane.rotation.y = 0;
    contrails.forEach((c) => { const len = Math.max(1, local * 95); c.scale.set(1, len, 1); c.position.set(px - 19 - len / 2, 10243.1, sp.z - 60 + c.userData.s * 6.5); });
  }

  dress.follow(cam);
  if (space) dress.sky.visible = false;

  // ---------------- Capa de texto -----------------------------------------------------------------
  cam.updateMatrixWorld();
  const labels = [];
  const proj = (v, text, alpha = 1, color) => { const p = v.clone().project(cam); if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) labels.push({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, text, alpha, color }); };
  const cur = st?.cur;
  if (cur && !st.done && sc.list.length && !sc.real && cur.n > 0 && st.u > 0.35 && st.u < 0.65 && !big) proj(new THREE.Vector3(sp.x, by + 0.35 * vis, sp.z), fmtH(cur.h), 1, '#fde68a');
  if (big || s.id === 'torre') proj(new THREE.Vector3(sp.x, by + 2 * BR * vis, sp.z), 'PELOTA', 1, '#fde68a');
  if (s.id === 'casa') proj(new THREE.Vector3(SPOT.house.x + 3.5, 6.3, 21.5), 'Techo ≈ 5.9 m', Math.min(1, local / 0.6));
  if (s.id === 'plaza') proj(new THREE.Vector3(150, 57, -78), 'Edificio de 17 pisos (55 m)', Math.min(1, local / 0.6));
  if (s.id === 'torre') proj(new THREE.Vector3(300, 186, -66), 'Torre de 182 m', Math.min(1, local / 0.6));
  if (s.id === 'nubes') proj(new THREE.Vector3(sp.x + 900, 1500, sp.z - 600), 'Nubes (1.5 km)', Math.min(1, local / 0.6));
  if (s.id === 'aviones') proj(new THREE.Vector3(plane.position.x, 10262, plane.position.z), 'Avión (10 km)', Math.min(1, local / 0.6));
  if (space) proj(new THREE.Vector3(sp.x, 100000, sp.z), 'Frontera del espacio (100 km)', Math.min(1, local / 0.6));

  let counter = null, chip = null;
  if (sc.list.length && !sc.real) {
    const n = cur ? cur.n : 0;
    counter = { label: 'ALTURA DEL REBOTE', value: fmtH(cur ? cur.h : 1) };
    const mins = CUM[Math.max(0, n)] / 60;
    chip = n > 0 ? `REBOTE ${n}` + (n >= 19 ? ` · ${mins < 1 ? `${nf(mins * 60)} s` : `${nf(mins)} min`}` : '') + (sc.speed > 1.6 ? ` · ×${nf(sc.speed)}` : sc.speed < 0.7 ? ' · CÁMARA LENTA' : '') : 'LA SUELTAS DESDE 1 M';
  } else if (sc.real && st) {
    counter = { label: 'REBOTE REAL (−30%)', value: fmtH(st.cur.h), color: '#93c5fd' };
    chip = 'EN LA VIDA REAL';
  }
  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro' ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5)) : Math.min(1, Math.max(0, (local / s.dur - 0.5) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title, labels };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}
