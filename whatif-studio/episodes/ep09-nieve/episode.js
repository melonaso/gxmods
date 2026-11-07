// Episodio 09: cada día nieva 1 cm más que el anterior. Total del día n: n × (n + 1) ÷ 2 cm.
// Escala del barrio a la ciudad: muñeco de nieve, guerra de bolas (golpes), regla de altura, techo que
// se hunde (física con cannon-es), edificios, torre de 182 m y el edificio más alto del mundo (828 m).
import { ease, lerp } from '../../engine/timeline.js';
import * as MD from '../../engine/models.js';
import * as TX from '../../engine/textures.js';
import { dressWorld, streetGrid, lineOfHouses, lampsAlong } from '../../engine/town.js';
import { createPlacer } from '../../engine/actors.js';
import { createSim, boxBody, sphereBody, CANNON } from '../../engine/physics.js';
import { bake, solidOverlaps } from '../../engine/bake.js';

const DEPTH = (day) => (day * (day + 1)) / 200;          // metros acumulados al final del día
const YARD = { x: 6, z: 11.5 }, HOUSE = { x: 40, z: 21 }, TOWER = { x: 150, z: -170 }, BURJ = { x: 900, z: -2400 };
const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt = (m) => (m < 1 ? `${nf(m * 100)} cm` : m < 10 ? `${nf(m, 2)} m` : `${nf(m, m < 100 ? 1 : 0)} m`);

let T, snowPlane, flakes, kids = [], adult, dog, snowman, smParts, head, ball, featured, caps = [], sim, puffs = [], dress, hemi;
let roadMats = [], curbMats = [], ruler, carY, buried = [];
const throws = [];

export function setup(C) {
  const { THREE, world, scenes } = C;
  T = THREE;
  const { scene } = world;
  // Invierno: cielo gris, suelo blanco con grumos finos, luz suave.
  world.ground.material.map = null;
  dress = dressWorld(world, { top: '#9fb0c4', horizon: '#e6ebf1', ground: 'snow', groundTint: '#f3f6fa' });
  world.sun.intensity = 1.5;
  scene.traverse((o) => { if (o.isHemisphereLight) { hemi = o; o.intensity = 1.8; o.color.set('#eef4fb'); o.groundColor.set('#cfd8e3'); } });
  const P = createPlacer();
  const rng = MD.mulberry(909);
  const before = new Set(scene.children);

  // ---------------- Barrio ----------------------------------------------------------------------
  streetGrid(scene, P, { xs: [-40, 120], zs: [0, 64], x0: -160, x1: 260, z0: -260, z1: 120 });
  scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.normalMap && !roadMats.includes(o.material)) { if (o.position.y < 0.05) roadMats.push(o.material); else curbMats.push(o.material); } });
  P.blockRect(-4, 20, 6.2, 19);                        // jardín de los niños (sin casa)
  P.blockRect(HOUSE.x - 6, HOUSE.x + 6, 6.2, 30);      // casa del techo que se hunde
  P.blockRect(46, 70, 6.2, 34);                        // vista libre de la cámara hacia esa casa
  featured = MD.createHouseHQ({ w: 9, d: 8, floors: 1, wall: 'brick', wallColor: '#b5563b', roofColor: '#7c2d12', snowRoof: true });
  featured.position.set(HOUSE.x, 0, HOUSE.z); featured.rotation.y = Math.PI; scene.add(featured); // no se hornea
  lineOfHouses(scene, P, rng, { zStreet: 0, side: 1, x0: -160, x1: 116, carChance: 0.35, winter: true, noCarsNear: [8, 40] });
  lineOfHouses(scene, P, rng, { zStreet: 0, side: -1, x0: -160, x1: 116, carChance: 0.35, winter: true });
  // Segunda calle al fondo: casas detrás del jardín (para que la toma no se vea vacía).
  lineOfHouses(scene, P, rng, { zStreet: 64, side: -1, x0: -160, x1: 116, lot: 15, setback: 4, carChance: 0.25, winter: true });
  lineOfHouses(scene, P, rng, { zStreet: 64, side: 1, x0: -160, x1: 116, carChance: 0.25, winter: true });
  for (const l of lampsAlong(scene, { zStreet: 0, x0: -150, x1: 250, every: 30, side: 1 })) if (Math.abs(l.position.x - 8) < 10) scene.remove(l);
  // Edificios de 15 pisos (48 m) en la siguiente calle y torre de 182 m.
  const apts = [];
  for (const [x, fl] of [[-110, 15], [-75, 15], [-5, 15], [30, 15], [65, 15], [95, 12], [-145, 10]]) {
    const a = MD.createApartment({ floors: fl, w: 18, d: 16, color: ['#e7e5e4', '#d6d3d1', '#fde68a', '#bfdbfe', '#fecaca'][apts.length % 5], seed: apts.length + 3 });
    a.position.set(x, 0, -72); P.place(x, -72, 12.5); scene.add(a); apts.push(a);
  }
  const tw = MD.createTower({ h: 178.4, w: 30, antenna: 22 }); tw.position.set(TOWER.x, 0, TOWER.z); P.blockCircle(TOWER.x, TOWER.z, 24); scene.add(tw);
  for (let k = 0; k < 18; k++) {
    const x = -200 + k * 32 + rng() * 10, z = -230 - rng() * 60;
    if (!P.place(x, z, 13)) continue;
    const b = MD.createApartment({ floors: 6 + ((rng() * 14) | 0), w: 18, d: 16, color: ['#e7e5e4', '#d6d3d1', '#cbd5e1'][k % 3], seed: 40 + k }); b.position.set(x, 0, z); scene.add(b);
  }
  for (let k = 0; k < 220; k++) {
    const x = -160 + rng() * 420, z = -260 + rng() * 350, h = 6 + rng() * 7;
    if (!P.place(x, z, h * 0.36 + 0.3)) continue;
    const t = MD.createTreeHQ({ h, seed: 900 + k, pine: rng() < 0.85 }); t.position.set(x, 0, z); scene.add(t);
  }
  // El edificio más alto del mundo (828 m): torre escalonada con aguja.
  {
    const g = new THREE.Group(), glass = tw.children[0].material;
    const tiers = [[0, 210, 70], [210, 420, 52], [420, 590, 38], [590, 700, 26], [700, 770, 15], [770, 800, 8]];
    for (const [y0, y1, w] of tiers) { for (const r of [0, Math.PI / 3, (2 * Math.PI) / 3]) { const b = new THREE.Mesh(MD.boxUV(w, y1 - y0, w * 0.42, 4), glass); b.position.y = (y0 + y1) / 2; b.rotation.y = r; b.castShadow = true; g.add(b); } }
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 3, 28, 8), MD.M('#e2e8f0', { metalness: 0.7, roughness: 0.3 })); spire.position.y = 814; g.add(spire);
    g.position.set(BURJ.x, 0, BURJ.z); g.userData.solid = 'rascacielos'; g.userData.radius = 40; scene.add(g);
  }
  const staticRoots = scene.children.filter((o) => !before.has(o) && o !== featured);
  world.userData.preOverlaps = solidOverlaps([...staticRoots, featured]);
  bake(scene, staticRoots);
  // Regla de 2.5 m con la marca de "tu altura" (1.7 m) (no se hornea: solo aparece en una escena).
  ruler = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 1024; const g = c.getContext('2d');
    for (let i = 0; i < 25; i++) { g.fillStyle = i % 2 ? '#f8fafc' : '#ef4444'; g.fillRect(0, 1024 - (i + 1) * (1024 / 25), 64, 1024 / 25); }
    g.fillStyle = '#111827'; for (let i = 0; i <= 25; i++) g.fillRect(0, 1024 - i * (1024 / 25) - 1, i % 5 === 0 ? 64 : 26, 3);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 0.06), [MD.M('#e5e7eb'), MD.M('#e5e7eb'), MD.M('#e5e7eb'), MD.M('#e5e7eb'), MD.M('#ffffff', { map: t }), MD.M('#e5e7eb')]);
    r.position.set(YARD.x + 3.2, 1.25, YARD.z - 1.2); r.castShadow = true; scene.add(r);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.1), MD.M('#facc15', { emissive: '#a16207', emissiveIntensity: 0.4 })); mark.position.set(0, 0.45, 0.03); r.add(mark);
    return r;
  })();
  // Casquetes de nieve (techos y coches): crecen con la nevada. Se guarda su base y su "arriba".
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.userData.snowCap) return;
    const n = new THREE.Vector3(0, 1, 0).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion()));
    caps.push({ o, n, base: o.getWorldPosition(new THREE.Vector3()), parent: o.parent, local: o.position.clone() });
  });

  // ---------------- Nieve: plano que sube, copos que caen --------------------------------------
  const sn = TX.snow();
  const pm = sn.map.clone(), pn = sn.normalMap.clone(); pm.repeat.set(12000, 12000); pn.repeat.set(12000, 12000); pm.needsUpdate = pn.needsUpdate = true;
  snowPlane = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000, 192, 192), new THREE.MeshStandardMaterial({ map: pm, normalMap: pn, roughness: 0.9 }));
  snowPlane.rotation.x = -Math.PI / 2; snowPlane.receiveShadow = true; snowPlane.visible = false; scene.add(snowPlane);
  {
    const N = 7000, pos = new Float32Array(N * 3), r = MD.mulberry(5);
    for (let i = 0; i < N; i++) pos.set([r(), r(), r()], i * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    flakes = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.06, transparent: true, depthWrite: false, sizeAttenuation: true }));
    flakes.frustumCulled = false; flakes.userData.base = pos.slice(); scene.add(flakes);
  }

  // ---------------- Personajes -------------------------------------------------------------------
  const kidStyle = [{ coat: '#dc2626', scarf: '#facc15', beanie: '#1d4ed8' }, { coat: '#2563eb', scarf: '#f8fafc', beanie: '#dc2626' }, { coat: '#16a34a', scarf: '#ef4444', beanie: '#f59e0b' }];
  kidStyle.forEach((st, i) => { const k = MD.createCharacter({ seed: 600 + i, kid: true, ...st, gloves: '#334155', longSleeves: true, pants: '#1e293b' }); scene.add(k); kids.push(k); });
  adult = MD.createCharacter({ seed: 650, coat: '#7c3aed', scarf: '#f472b6', beanie: '#0f172a', gloves: '#1f2937', pants: '#334155' }); scene.add(adult);
  dog = MD.createDog({ color: '#f8fafc', spots: '#1f2937' }); scene.add(dog);
  // Muñeco de nieve: tres bolas, ojos de carbón, nariz de zanahoria, brazos de palo y sombrero.
  snowman = new THREE.Group(); snowman.position.set(YARD.x, 0, YARD.z); scene.add(snowman);
  const sm = MD.M('#ffffff', { map: sn.map, roughness: 0.85 });
  const ballG = (r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), sm); m.castShadow = m.receiveShadow = true; return m; };
  const b0 = ballG(0.42), b1 = ballG(0.3); b0.position.y = 0.42; b1.position.y = 1.04; snowman.add(b0, b1);
  head = new THREE.Group(); head.position.y = 1.47; snowman.add(head);
  const hb = ballG(0.21); head.add(hb);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), MD.M('#111827')); e.position.set(s * 0.07, 0.05, 0.19); head.add(e); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 10), MD.M('#f97316')); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0, 0.27); head.add(nose);
  const hat = new THREE.Group(); hat.position.y = 0.17; head.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 18), MD.M('#111827')); hat.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.24, 18), MD.M('#111827')); crown.position.y = 0.13; hat.add(crown);
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.75, 6), MD.M('#6b4423')); a.position.set(s * 0.52, 1.18, 0); a.rotation.z = s * 1.0; snowman.add(a); }
  for (let i = 0; i < 3; i++) { const btn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), MD.M('#111827')); btn.position.set(0, 0.92 + i * 0.13, 0.29 - Math.abs(i - 1) * 0.01); snowman.add(btn); }
  smParts = { b0, b1, head, arms: snowman.children.filter((c) => c.geometry?.type === 'CylinderGeometry') };

  // ---------------- Guerra de bolas de nieve (tiros con parábola real) -------------------------
  const sg = scenes.find((s) => s.id === 'gauss');
  const A = [YARD.x - 3.2, YARD.z - 0.6], B = [YARD.x + 2.4, YARD.z + 2.6];
  for (let k = 0; k < 6; k++) {
    const from = k % 2 ? B : A, to = k % 2 ? A : B, t0 = sg.start + 0.6 + k * (sg.dur - 2.4) / 6;
    throws.push({ t0, t1: t0 + 0.75, from, to, who: k % 2 });
  }
  // Último tiro: le da a la cabeza del muñeco (la tumba: choque con física).
  const hitT = sg.start + sg.dur - 1.3;
  throws.push({ t0: hitT - 0.7, t1: hitT, from: A, to: [YARD.x, YARD.z], who: 0, head: true });
  ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), sm); ball.castShadow = true; scene.add(ball);

  // ---------------- Física: cabeza del muñeco y nieve del techo que cae ------------------------
  sim = createSim({ restitution: 0.15, friction: 0.8 });
  const dHit = DEPTH(lerp(7, 10, ease.inOut(Math.min(1, (hitT - sg.start) / (sg.dur * 0.85)))));
  sim.addStatic(boxBody(12, 1, 12, 0, YARD.x, dHit - 0.5, YARD.z)); // superficie de la nieve en el jardín
  const headHolder = new THREE.Group(); scene.add(headHolder); head.userData.holder = headHolder;
  { const hc = head.clone(); hc.position.set(0, 0, 0); headHolder.add(hc); headHolder.visible = false; }
  const hbBody = sphereBody(0.21, 2, YARD.x, -50, YARD.z); hbBody.type = CANNON.Body.STATIC; sim.add(hbBody, headHolder);
  sim.at(hitT, () => { hbBody.type = CANNON.Body.DYNAMIC; hbBody.mass = 2; hbBody.updateMassProperties(); hbBody.position.set(YARD.x, 1.47, YARD.z); hbBody.velocity.set(1.6, 1.2, -1.0); hbBody.angularVelocity.set(-3, 0, 4); hbBody.wakeUp(); });
  head.userData.hitT = hitT;
  // Techo: el hundimiento ocurre cuando la nieve llega a ~4.3 m (día 29).
  const st = scenes.find((s) => s.id === 'techos');
  let tc = st.start + st.dur * 0.75;
  for (let tt = st.start; tt < st.start + st.dur; tt += 0.05) if (DEPTH(dayAt(st, tt - st.start)) >= 3.6) { tc = tt; break; }
  featured.userData.collapseT = tc;
  const dRoof = DEPTH(dayAt(st, tc - st.start));
  sim.addStatic(boxBody(30, 1, 30, 0, HOUSE.x, dRoof - 0.5, HOUSE.z));
  featured.userData.chunks = [];
  const pr = MD.mulberry(77);
  for (let i = 0; i < 14; i++) {
    const sz = 0.35 + pr() * 0.4, m = new THREE.Mesh(MD.boxUV(sz, sz * 0.7, sz, 1), sm); m.castShadow = true;
    const h = new THREE.Group(); h.add(m); h.visible = false; scene.add(h);
    const b = boxBody(sz, sz * 0.7, sz, 0, HOUSE.x, -60 - i, HOUSE.z); b.type = CANNON.Body.STATIC; sim.add(b, h);
    const x = HOUSE.x + (pr() - 0.5) * 8, z = HOUSE.z + (pr() - 0.5) * 6;
    sim.at(tc, () => { b.type = CANNON.Body.DYNAMIC; b.mass = 25 * sz; b.updateMassProperties(); b.position.set(x, dRoof + 2.4 + pr() * 1.2, z); b.velocity.set((pr() - 0.5) * 2, -1, (pr() - 0.5) * 2); b.angularVelocity.set(pr() * 3, pr() * 3, pr() * 3); b.wakeUp(); });
    featured.userData.chunks.push(h);
  }
  sim.run(scenes[scenes.length - 1].start + scenes[scenes.length - 1].dur + 2);

  // Bocanadas de nieve (golpes de bolas, techo).
  const pt = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pt, color: '#ffffff', transparent: true, depthWrite: false })); s.visible = false; scene.add(s); puffs.push(s); }
}

/** Día (continuo) en el instante local de la escena. */
function dayAt(s, local) {
  if (s.d1 === s.d0) return s.d0;
  const goal = s.dur * 0.82;
  return lerp(s.d0, s.d1, ease.inOut(Math.min(1, Math.max(0, local) / goal)));
}

export function sfx() {
  const out = [];
  for (const th of throws) out.push({ t: th.t1, type: 'pop' });
  if (featured?.userData.collapseT) out.push({ t: featured.userData.collapseT, type: 'crack' }, { t: featured.userData.collapseT + 0.1, type: 'boom' });
  return out.sort((a, b) => a.t - b.t);
}

export function update(C, { t, scene: s, local }) {
  const { world, W, H } = C;
  const THREE = T;
  sim.apply(t);
  const real = s.id === 'real' || s.id === 'outro' || s.id === 'intro';
  const day = dayAt(s, local);
  const D = s.id === 'real' || s.id === 'outro' ? 0.3 : DEPTH(day);

  // ---------------- Nieve en el suelo --------------------------------------------------------------
  // Hasta 17 cm la nieve "pinta" calles y banquetas de blanco; desde ahí, un plano de nieve que sube.
  const k = Math.min(1, D / 0.15);
  for (const m of [...roadMats, ...curbMats]) { m.emissive.setRGB(0.86, 0.89, 0.93).multiplyScalar(k); m.color.setScalar(1 - 0.6 * k); }
  snowPlane.visible = D >= 0.17;
  snowPlane.position.y = D;
  // Casquetes de nieve en techos y coches: 2 cm → 45 cm.
  const th = Math.min(0.45, 0.02 + D * 0.35);
  for (const c of caps) { c.o.scale.y = th / 0.1; const off = (th - 0.1) / 2; if (c.o.parent !== world.scene) c.o.position.set(c.local.x, c.local.y + off, c.local.z); else c.o.position.copy(c.base).addScaledVector(c.n, off); }

  // ---------------- Luz: nublado (y sol en "la vida real") ----------------------------------------
  const sunny = s.id === 'real' || s.id === 'outro';
  world.sun.intensity = sunny ? 2.5 : 1.5; hemi.intensity = sunny ? 1.5 : 1.8;
  dress.skyMat.uniforms.top.value.set(sunny ? '#5aa6e6' : '#9fb0c4'); dress.skyMat.uniforms.horizon.value.set(sunny ? '#d6ecf8' : '#e6ebf1');
  world.scene.background.set(sunny ? '#d6ecf8' : '#e6ebf1'); world.scene.fog.color.set(sunny ? '#d6ecf8' : '#e6ebf1');

  // ---------------- Cámara por escena (fija; se para sobre la nieve) -----------------------------
  const cam = world.camera;
  let pos, tgt, size;
  const yard = ['intro', 'semana', 'gauss', 'formula', 'real', 'outro'].includes(s.id);
  // Cámara fija por escena, a la altura de la nieve al FINAL de la escena: si subiera poco a poco con la
  // nieve, ladrillos y follaje lejanos "hormiguearían".
  const Dc = s.id === 'real' || s.id === 'outro' ? 0.3 : DEPTH(s.d1);
  if (yard) { pos = new THREE.Vector3(YARD.x + 4.6, 1.35 + Dc, YARD.z - 5.8); tgt = new THREE.Vector3(YARD.x + 0.2, 0.9 + Dc * 0.85, YARD.z + 0.8); size = 7; }
  else if (s.id === 'techos') { pos = new THREE.Vector3(HOUSE.x + 8.5, 6.4, HOUSE.z - 11.5); tgt = new THREE.Vector3(HOUSE.x - 0.3, 3.6, HOUSE.z); size = 14; }
  // Tomas abiertas: la cámara siempre por encima de la nieve (desde abajo el plano no se ve).
  else if (s.id === 'dia60') { pos = new THREE.Vector3(70, Dc + 22, 100); tgt = new THREE.Vector3(-5, Dc, -40); size = 90; }
  else if (s.id === 'dia100') { pos = new THREE.Vector3(120, Dc + 45, 140); tgt = new THREE.Vector3(-5, Dc - 6, -72); size = 150; }
  else if (s.id === 'record') { pos = new THREE.Vector3(TOWER.x + 150, Dc + 45, TOWER.z + 200); tgt = new THREE.Vector3(TOWER.x, Dc - 40, TOWER.z); size = 200; }
  else if (s.id === 'anio') { pos = new THREE.Vector3(2200, Dc + 380, 1300); tgt = new THREE.Vector3(500, Dc - 60, -1100); size = 1500; }
  else { pos = new THREE.Vector3(BURJ.x + 260, Dc + 15, BURJ.z + 310); tgt = new THREE.Vector3(BURJ.x, Dc - 50, BURJ.z); size = 300; }
  cam.position.copy(pos); cam.lookAt(tgt);
  const huge = ['anio', 'burj'].includes(s.id);
  cam.near = huge ? 2 : 0.05; cam.far = huge ? 60000 : 9000; cam.updateProjectionMatrix();
  world.fitToScale({ x: tgt.x, y: D, z: tgt.z }, size);
  if (huge) { world.scene.fog.near = 3000; world.scene.fog.far = 16000; }

  // ---------------- Copos: caja alrededor del objetivo, tamaño según la escala ---------------------
  const sc = Math.max(1, size / 8), box = 26 * sc, base = flakes.userData.base, arr = flakes.geometry.attributes.position.array;
  const fall = 1.1 * sc, snowing = !sunny;
  flakes.visible = snowing;
  if (snowing) {
    for (let i = 0; i < arr.length; i += 3) {
      const bx = base[i], by = base[i + 1], bz = base[i + 2];
      const yy = (((by - (t * fall) / box) % 1) + 1) % 1;
      arr[i] = tgt.x + (bx - 0.5) * box + Math.sin(t * 0.8 + i) * 0.2 * sc;
      arr[i + 1] = D + yy * box * 0.6;
      arr[i + 2] = tgt.z + (bz - 0.5) * box;
    }
    flakes.geometry.attributes.position.needsUpdate = true;
    flakes.material.size = 0.06 * sc;
  }

  // ---------------- Muñeco de nieve, niños, perro, adulto -----------------------------------------
  const sg = C.scenes.find((x) => x.id === 'gauss');
  smParts.b0.scale.setScalar(1); smParts.b1.scale.setScalar(1); smParts.head.visible = true;
  snowman.visible = yard && s.id !== 'intro';
  if (s.id === 'semana') { // se construye
    const a = local / s.dur;
    smParts.b0.scale.setScalar(Math.max(0.01, Math.min(1, a / 0.35)));
    smParts.b1.visible = a > 0.35; smParts.b1.scale.setScalar(Math.max(0.01, Math.min(1, (a - 0.35) / 0.25)));
    smParts.head.visible = a > 0.6; smParts.head.scale.setScalar(Math.max(0.01, Math.min(1, (a - 0.6) / 0.2)));
    for (const arm of smParts.arms) arm.visible = a > 0.82;
  } else { smParts.b1.visible = true; smParts.head.scale.setScalar(1); for (const arm of smParts.arms) arm.visible = true; }
  // La cabeza sale volando con el bolazo (física) y se queda en la nieve.
  const holder = head.userData.holder;
  const knocked = t >= head.userData.hitT && (s.id === 'gauss' || s.id === 'formula');
  holder.visible = knocked;
  if (knocked) smParts.head.visible = false;
  if (s.id === 'real' || s.id === 'outro') { // muñeco nuevo que se derrite al sol
    const melt = s.id === 'real' ? Math.min(0.35, local / s.dur * 0.4) : 0;
    snowman.scale.set(1 + melt * 0.3, 1 - melt, 1 + melt * 0.3); snowman.position.y = 0;
  } else { snowman.scale.setScalar(1); snowman.position.y = 0; }

  const kidPos = [[YARD.x - 3.2, YARD.z - 0.6], [YARD.x + 2.4, YARD.z + 2.6], [YARD.x - 1.2, YARD.z + 1.4]];
  kids.forEach((kd, i) => {
    kd.visible = yard;
    const [x, z] = kidPos[i];
    kd.position.set(x, s.id === 'formula' ? D : Math.max(0, D - 0.12), z);
    kd.lookAt(new THREE.Vector3(YARD.x, kd.position.y, YARD.z));
    let mode = 'idle', opt = {};
    if (s.id === 'intro') { mode = i === 1 ? 'cheer' : 'lookUp'; opt = { amount: 0.9 }; }
    else if (s.id === 'semana') mode = i === 2 ? 'cheer' : 'dig';
    else if (s.id === 'gauss' && i < 2) {
      const th0 = throws.filter((q) => q.who === i).find((q) => t >= q.t0 - 0.6 && t <= q.t1);
      if (th0) { mode = 'throw'; opt = { k: Math.min(1, Math.max(0, (t - (th0.t0 - 0.6)) / 0.6)) }; kd.lookAt(new THREE.Vector3(th0.to[0], kd.position.y, th0.to[1])); }
      const hit = throws.find((q) => !q.head && q.who !== i && t >= q.t1 && t < q.t1 + 0.45);
      if (hit) { mode = 'scared'; }
    } else if (s.id === 'formula') { mode = i === 0 ? 'point' : 'lookUp'; opt = { up: 0.3, amount: 0.3 }; }
    else if (s.id === 'real' || s.id === 'outro') mode = i === 1 ? 'wave' : 'cheer';
    else if (s.id === 'gauss') mode = 'cheer';
    kd.userData.pose(t, mode, opt);
  });
  adult.visible = s.id === 'formula' || s.id === 'intro';
  adult.position.set(YARD.x + 2.4, s.id === 'formula' ? D : 0, YARD.z - 1.4); adult.rotation.y = -0.6;
  adult.userData.pose(t, s.id === 'formula' ? 'shiver' : 'lookUp', { amount: 0.8 });
  dog.visible = yard; dog.position.set(YARD.x + 1.4, Math.max(0, D - 0.05), YARD.z - 2.4); dog.rotation.y = -2.4;
  dog.userData.pose(t, s.id === 'gauss' || s.id === 'semana' ? 'run' : s.id === 'outro' ? 'sit' : 'jump');
  ruler.visible = s.id === 'formula';

  // ---------------- Bolas de nieve: parábola + "splat" al pegar ---------------------------------
  ball.visible = false;
  for (const th of throws) {
    if (t < th.t0 || t > th.t1) continue;
    const u = (t - th.t0) / (th.t1 - th.t0), y0 = D + 1.0;
    const tx = th.to[0], tz = th.to[1], ty = th.head ? 1.5 : D + 0.9;
    ball.visible = true;
    ball.position.set(lerp(th.from[0], tx, u), lerp(y0, ty, u) + Math.sin(Math.PI * u) * 1.1, lerp(th.from[1], tz, u));
  }
  let pi = 0;
  const puff = (x, y, z, age, n, spread, size) => {
    for (let q = 0; q < n && pi < puffs.length; q++) {
      const sp = puffs[pi++], a = q * 2.4;
      sp.visible = true; sp.position.set(x + Math.cos(a) * spread * age, y + age * 0.6, z + Math.sin(a) * spread * age);
      sp.scale.setScalar(size * (0.4 + age)); sp.material.opacity = Math.max(0, 0.9 * (1 - age));
    }
  };
  for (const th of throws) { const age = t - th.t1; if (age >= 0 && age < 1) puff(th.to[0], th.head ? 1.45 : D + 0.9, th.to[1], age, 6, 1.2, 0.35); }

  // ---------------- Casa: techo que se hunde ------------------------------------------------------
  const tc = featured.userData.collapseT;
  const ck = Math.min(1, Math.max(0, (t - tc) / 1.0));
  featured.userData.collapse(ease.in(ck));
  for (const c of featured.userData.chunks) c.visible = t >= tc;
  if (t >= tc && t < tc + 1.4) puff(HOUSE.x, D + 0.5, HOUSE.z, (t - tc) / 1.4, 12, 5, 2.4);
  for (; pi < puffs.length; pi++) puffs[pi].visible = false;

  dress.follow(cam);

  // ---------------- Capa de texto -----------------------------------------------------------------
  cam.updateMatrixWorld();
  const labels = [];
  const proj = (v, text, alpha = 1, color) => { const p = v.clone().project(cam); if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) labels.push({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, text, alpha, color }); };
  const fa = Math.min(1, local / 0.6);
  if (s.id === 'formula') proj(new THREE.Vector3(YARD.x + 3.2, 1.75, YARD.z - 1.2), 'Tu altura: 1.7 m', fa, '#fde68a');
  if (s.id === 'techos') proj(new THREE.Vector3(HOUSE.x, Math.max(7.4, D + 1.8), HOUSE.z), `${nf(Math.round(D * 100))} kg por m² de techo`, fa, '#fde68a');
  if (s.id === 'dia60' || s.id === 'dia100') proj(new THREE.Vector3(-5, 50.5, -72), 'Edificio de 15 pisos (48 m)', fa);
  if (s.id === 'record') proj(new THREE.Vector3(TOWER.x, 186, TOWER.z), 'Torre de 182 m', fa);
  if (huge) proj(new THREE.Vector3(BURJ.x, 832, BURJ.z), 'Burj Khalifa (828 m)', fa);

  let counter = null, chip = null;
  if (!real || s.id === 'intro') {
    const n = Math.max(0, Math.ceil(day - 1e-6)); // el día en curso: su nieve ya se está sumando al total
    counter = { label: 'NIEVE ACUMULADA', value: fmt(DEPTH(day)) };
    const today = n / 100;
    chip = n >= 1 ? `DÍA ${nf(n)} · HOY CAEN ${today < 1 ? `${nf(n)} cm` : `${nf(today, 2)} m`}` : 'DÍA 0';
  } else if (s.id === 'real') { counter = { label: 'NIEVE (EN LA VIDA REAL)', value: '30 cm', color: '#93c5fd' }; chip = 'SE APLASTA Y SE DERRITE'; }
  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro' ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5)) : Math.min(1, Math.max(0, (local / s.dur - 0.5) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title, labels };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}
