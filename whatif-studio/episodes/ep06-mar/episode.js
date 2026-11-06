// Episodio 06: el mar sube 1 cm cada día. Nivel L = 0.01 · día (metros).
// Escenario: una montaña de 5,636 m (la altura del Pico de Orizaba) con su playa y su pueblo.
// El terreno es radial: la altura depende solo de la distancia a la costa, así que cada anillo
// del terreno tiene altura exacta y las banderas de referencia quedan justo a su altura real.
import { ease, lerp } from '../../engine/timeline.js';

const R = 30000;            // distancia de la costa a la cima (m)
const PEAK = 5636;          // Pico de Orizaba (m)
// Perfil del terreno: [distancia tierra adentro desde la costa (m), altura (m)]. d < 0 = fondo marino.
const PROFILE = [[-6000, -900], [-1500, -150], [-300, -12], [-40, -1.2], [0, 0], [60, 1.5], [140, 3.2], [250, 6],
  [500, 12], [1000, 30], [2000, 80], [3500, 200], [6000, 540], [9500, 1100], [12000, 1566], [15000, 2240],
  [19000, 3200], [24000, 4300], [27500, 5100], [29700, 5600], [30000, PEAK]];
const MARKS = [
  { id: 'm10', h: 10, text: '10 m · puertos y playas' },
  { id: 'm70', h: 70, text: '70 m · todo el hielo derretido' },
  { id: 'm540', h: 540, text: '540 m · Monterrey' },
  { id: 'm1566', h: 1566, text: '1,566 m · Guadalajara' },
  { id: 'm2240', h: 2240, text: '2,240 m · Ciudad de México' },
  { id: 'm5636', h: 5636, text: '5,636 m · Pico de Orizaba' },
];

let sea, hero, boat, flags = [], props = [], THREEref;

/** Altura del terreno a una distancia d de la costa (interpolación lineal del perfil). */
function heightAt(d) {
  if (d <= PROFILE[0][0]) return PROFILE[0][1];
  for (let i = 1; i < PROFILE.length; i++) {
    const [d1, h1] = PROFILE[i], [d0, h0] = PROFILE[i - 1];
    if (d <= d1) return h0 + ((h1 - h0) * (d - d0)) / (d1 - d0);
  }
  return PEAK;
}
/** Distancia tierra adentro donde el terreno alcanza la altura h (inversa del perfil). */
function distAt(h) {
  if (h <= 0) return 0;
  for (let i = 1; i < PROFILE.length; i++) {
    const [d1, h1] = PROFILE[i], [d0, h0] = PROFILE[i - 1];
    if (h <= h1 && h1 > h0) return d0 + ((h - h0) * (d1 - d0)) / (h1 - h0);
  }
  return R;
}
const groundY = (x, z) => heightAt(R - Math.hypot(x, z));

const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtLevel = (L) => (L < 1 ? `+${nf(L * 100)} cm` : L < 100 ? `+${nf(L, 2)} m` : `+${nf(L)} m`);

export function setup({ THREE, world, actors }) {
  THREEref = THREE;
  const { scene, rng } = world;
  // Este episodio tiene su propio terreno y sus propias nubes.
  world.ground.visible = false;
  scene.children.filter((o) => o.isGroup).forEach((o) => (o.visible = false));

  // --- Terreno radial ------------------------------------------------------------------------
  const ds = [];
  for (let d = -6000; d < -300; d += 400) ds.push(d);
  for (let d = -300; d < 600; d += 8) ds.push(d);
  for (let d = 600; d < 3000; d += 40) ds.push(d);
  for (let d = 3000; d < R; d += 250) ds.push(d);
  ds.push(R);
  // Segmentos angulares concentrados cerca del pueblo (ángulo 0): piezas de ~4 m junto a la costa
  // del pueblo y de cientos de metros al otro lado de la montaña, que casi no se ve.
  // (Triángulos de cientos de metros donde el agua corta la playa casi en paralelo hacen parpadear la orilla.)
  const SEG = 512;
  const angle = (sIdx) => { const u = (sIdx / SEG) * 2 - 1; return Math.PI * Math.sign(u) * Math.pow(Math.abs(u), 1.8); };
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  const colorFor = (h, k) => {
    if (h < -1) c.set('#c9b68a'); else if (h < 2.2) c.set('#ead9a7');
    else if (h < 900) c.set(k % 2 ? '#7fb04a' : '#78a845');
    else if (h < 2600) c.set(k % 2 ? '#5f9440' : '#5a8c3c');
    else if (h < 4600) c.set(k % 2 ? '#8c8271' : '#857b6a');
    else c.set('#f1f5f9');
    return c;
  };
  ds.forEach((d, ri) => {
    const r = R - d, h = heightAt(d);
    for (let s = 0; s <= SEG; s++) {
      const a = angle(s); // a = 0 → punto (0, h, R): la costa del pueblo
      pos.push(Math.sin(a) * r, h, Math.cos(a) * r);
      colorFor(h, ri + s); col.push(c.r, c.g, c.b);
    }
  });
  for (let ri = 0; ri < ds.length - 1; ri++) for (let s = 0; s < SEG; s++) {
    const a = ri * (SEG + 1) + s, b = a + SEG + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b); // sentido antihorario visto desde arriba: la cara mira al cielo
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  tg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  tg.setIndex(idx);
  tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  // --- Mar: plano subdividido que acompaña a la cámara (nunca triángulos de kilómetros) -------
  sea = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 120, 120),
    new THREE.MeshStandardMaterial({ color: '#2b7bbf', roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.88 }));
  sea.rotation.x = -Math.PI / 2;
  sea.receiveShadow = true;
  scene.add(sea);

  // --- Pueblo costero (sin choques) ------------------------------------------------------------
  const P = actors.createPlacer();
  P.blockRect(-30, 30, R - 70, R + 50); // la franja donde se para el protagonista y mira la cámara
  const hc = ['#f4e1c1', '#e0f2fe', '#fce7f3', '#dcfce7', '#fef3c7', '#ffedd5'], rcl = ['#b45309', '#7c2d12', '#1e3a8a', '#991b1b', '#0f766e'];
  let k = 0;
  for (const dRow of [80, 112, 148, 195, 255, 325, 405]) {
    for (let x = -230; x <= 230; x += 15 + rng() * 6) {
      const xx = x + (rng() - 0.5) * 4, z = R - dRow - (rng() - 0.5) * 6;
      if (!P.place(xx, z, 6.8)) continue;
      const house = actors.createHouse(hc[k % 6], rcl[k % 5]); k++;
      house.position.set(xx, groundY(xx, z) - 0.35, z);
      house.userData.h = 9; props.push(house);
      scene.add(house);
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = (rng() - 0.5) * 1400, dd = 60 + Math.pow(rng(), 1.6) * 2400, z = R - dd;
    const th = 6 + rng() * 6;
    if (!P.place(x, z, th * 0.34 + 0.6)) continue;
    const tree = actors.createTree(rng, th);
    tree.position.set(x, groundY(x, z) - 0.2, z);
    tree.userData.h = th; props.push(tree);
    scene.add(tree);
  }

  // --- Banderas de altura: en la cresta, a la altura exacta de cada referencia ------------------
  for (const m of MARKS) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), actors.mat('#f8fafc'));
    pole.position.y = 0.5; g.add(pole);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.01), actors.mat('#ef4444'));
    cloth.position.set(0.22, 0.86, 0); g.add(cloth);
    const d = distAt(m.h);
    g.position.set(-45, heightAt(d), R - d);
    g.userData.mark = m;
    scene.add(g); flags.push(g);
  }

  // --- Nubes propias, siempre por encima del terreno que tienen debajo -----------------------
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 });
  for (let i = 0; i < 60; i++) {
    const x = (rng() - 0.5) * 30000, z = R - 2000 + (rng() - 0.5) * 30000, y = 900 + rng() * 1800;
    if (groundY(x, z) > y - 400) continue;
    const cl = new THREE.Group(), s = 60 + rng() * 80;
    for (let j = 0; j < 4; j++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s * (0.6 + rng() * 0.5), 0), cloudMat);
      b.position.set(j * s * 1.1 - s * 1.6, rng() * s * 0.3, rng() * s * 0.5); cl.add(b);
    }
    cl.position.set(x, y, z); scene.add(cl);
  }

  hero = actors.createPerson({ shirt: '#0ea5e9', pants: '#1e293b', hair: '#2b1a10' });
  scene.add(hero);

  // Lancha para el final (el protagonista termina navegando junto a la cima).
  boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 5), actors.mat('#f8fafc'));
  hull.position.y = 0.15; hull.castShadow = true; boat.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.16, 5.04), actors.mat('#ef4444'));
  stripe.position.y = 0.32; boat.add(stripe);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.5), actors.mat('#93c5fd'));
  cabin.position.set(0, 0.95, -0.9); cabin.castShadow = true; boat.add(cabin);
  boat.visible = false;
  scene.add(boat);
}

/** Día (continuo) en el instante local de la escena. */
function dayAt(s, local) {
  const goal = s.reach === 'all' ? s.audio : Math.max(1.5, s.cueTimes[0]?.[1] ?? s.audio);
  return lerp(s.d0, s.d1, ease.inOut(Math.min(1, local / goal)));
}

export function update({ world, scenes, W, H }, { t, scene: s, local }) {
  const THREE = THREEref;
  const day = dayAt(s, local);
  const L = day * 0.01;
  const dShore = distAt(L);
  const shoreZ = R - dShore;

  // Encuadre de cada escena: qué mira (T) y a qué escala (S, en metros).
  //  shore: la orilla; town: el pueblo, para ver cómo se inunda; plain: la llanura (cámara quieta);
  //  peak: la cima, para el final.
  const frameFor = (sc) => {
    if (sc.focus === 'town') return { T: new THREE.Vector3(0, 5, R - 190), S: 120 };
    // fixed: cámara quieta sobre el tramo que el agua va a cubrir en la escena (at = distancia tierra adentro).
    if (sc.focus === 'fixed') return { T: new THREE.Vector3(0, heightAt(sc.at) * 0.85, R - sc.at), S: sc.scale };
    if (sc.focus === 'peak') return { T: new THREE.Vector3(0, L, 0), S: 26 };
    if (sc.focus === 'plain') return { T: new THREE.Vector3(0, 30, R - 750), S: 380 }; // cámara quieta: el agua avanza hacia ella
    return { T: new THREE.Vector3(0, L, shoreZ), S: 10 + 1.6 * L + 3.5 * Math.max(0, L - 60) };
  };
  const prevS = scenes[Math.max(0, s.index - 1)];
  // camT: duración de la transición de cámara (0 = corte directo, mejor que un paneo brusco).
  const w = (s.camT ?? 2.2) <= 0 ? 1 : ease.inOut(Math.min(1, local / (s.camT ?? 2.2)));
  const fa = frameFor(prevS), fb = frameFor(s);
  const T = fa.T.clone().lerp(fb.T, w);
  const S = Math.exp(lerp(Math.log(fa.S), Math.log(fb.S), w)); // zoom suave aunque la escala cambie ×1000

  // Protagonista: unos metros tierra adentro de la orilla; al final, en la lancha junto a la cima.
  const onBoat = s.focus === 'peak';
  const dh = Math.max(22, dShore + 8);
  boat.visible = onBoat;
  if (onBoat) {
    const bob = Math.sin(t * 1.3) * 0.12;
    boat.position.set(9, L + bob, 7); boat.rotation.set(Math.sin(t * 0.9) * 0.04, 0.6, Math.sin(t * 1.1) * 0.05);
    hero.position.set(9 + Math.sin(0.6) * 0.8, L + bob + 0.5, 7 + Math.cos(0.6) * 0.8); hero.rotation.y = 0.6;
    hero.userData.pose(t, 'wave');
  } else {
    hero.position.set(6, heightAt(dh), R - dh); hero.rotation.y = 0;
    hero.userData.pose(t, 'idle');
  }
  hero.visible = onBoat || L < 400;

  // Cámara: desde el mar hacia tierra; distancia y altura proporcionales a la escala.
  const cam = {};
  for (const k of ['dist', 'yaw', 'lift']) cam[k] = lerp(prevS.cam[k], s.cam[k], w);
  const D = cam.dist * S;
  const yaw = cam.yaw + Math.sin(t * 0.2) * 0.04;
  const pitch = 0.08 + cam.lift * 0.55;
  const look = new THREE.Vector3(0, S * 0.12, -S * 0.35 * (1 - (s.focus === 'peak' ? w : 0))).add(T);
  world.camera.position.set(T.x + Math.sin(yaw) * D * Math.cos(pitch), Math.max(L + 1.2, T.y + D * Math.sin(pitch)), T.z + Math.cos(yaw) * D * Math.cos(pitch));
  world.camera.lookAt(look);
  world.camera.near = Math.max(0.1, D * 0.002);
  world.camera.far = Math.max(9000, D * 12);
  world.camera.updateProjectionMatrix();
  world.fitToScale({ x: T.x, y: T.y, z: T.z - S * 0.2 }, S * 1.3);

  // Objetos lejanos de menos de ~4 px se encogen suavemente hasta desaparecer: así no "titilan"
  // en el horizonte cuando la cámara se mueve (cada uno ocuparía menos de un píxel).
  const pxPerM = H / (2 * Math.tan((world.camera.fov * Math.PI) / 360));
  for (const o of props) {
    const px = (o.userData.h * pxPerM) / Math.max(1, world.camera.position.distanceTo(o.position));
    const k = Math.min(1, Math.max(0, (px - 3) / 4));
    o.visible = k > 0;
    o.scale.setScalar(k > 0 ? 0.6 + 0.4 * k : 1);
  }

  // Mar: centrado frente a la cámara, con tamaño acorde a la escala.
  const size = Math.min(200000, Math.max(3000, D * 40));
  sea.scale.set(size, size, 1);
  sea.position.set(T.x, L, T.z - size * 0.15);

  // Banderas: crecen con la escala para seguir viéndose (siempre en su altura real).
  world.camera.updateMatrixWorld(); // la proyección a pantalla usa la cámara de ESTE fotograma
  const fk = Math.max(3.5, S * 0.05);
  const labels = [];
  const show = new Set(s.labels || []);
  for (const f of flags) {
    f.scale.setScalar(fk);
    const m = f.userData.mark;
    const above = f.position.y + fk * 0.9 > L;
    f.visible = above || show.has(m.id);
    if (!show.has(m.id)) continue;
    const p = new THREE.Vector3(f.position.x, f.position.y + fk * 1.05, f.position.z).project(world.camera);
    if (p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1) {
      labels.push({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, text: m.text, alpha: Math.min(1, local / 0.6), bg: L >= m.h ? 'rgba(30,64,175,0.9)' : undefined });
    }
  }

  // Capa de texto.
  const years = day / 365;
  const chip = day < 365 ? `DÍA ${nf(Math.round(day))}` : `AÑO ${nf(Math.floor(years))}`;
  const counter = { label: 'NIVEL DEL MAR', value: fmtLevel(L), color: '#7dd3fc' };
  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro'
      ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5))
      : Math.min(1, Math.max(0, (local / s.dur - 0.55) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title, labels };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}
