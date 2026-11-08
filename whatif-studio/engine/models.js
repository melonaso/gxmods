// Modelos detallados (segunda generación): personajes con articulaciones y cara, perro, casas con
// texturas, coches, árboles con follaje en capas, mobiliario urbano, edificios y avión.
// Unidad = 1 metro. Reglas para que no haya parpadeo: ninguna cara queda en el mismo plano que otra
// (todo lo que sobresale de un muro sobresale al menos 2 cm) y las texturas usan mipmaps.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as TX from './textures.js';

// ---------------------------------------------------------------- materiales y utilidades
const mcache = new Map();
/** Material estándar con caché (color + opciones). */
export function M(color, o = {}) {
  const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (!mcache.has(key)) mcache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }));
  return mcache.get(key);
}
function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m;
}
/** Grupo con pivote: el hijo cuelga hacia -y desde el punto de giro (hombro, cadera, rodilla...). */
function joint(x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); return g; }

/** Caja con coordenadas de textura en metros: 1 repetición de la textura = `unit` metros. */
export function boxUV(w, h, d, unit = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x, -x, +y, -y, +z, -z
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] / unit, uv.getY(i) * dims[f][1] / unit);
  }
  return g;
}
const rbox = (w, h, d, r = 0.02, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
const sphere = (r, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs);
const capsule = (r, len, cs = 4, rs = 10) => new THREE.CapsuleGeometry(r, len, cs, rs);

// ---------------------------------------------------------------- personajes
export const PALETTE = {
  shirts: ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#a855f7', '#f97316', '#0ea5e9', '#84cc16', '#f43f5e'],
  pants: ['#1e293b', '#334155', '#3f3f46', '#1e3a8a', '#44403c', '#57534e', '#164e63'],
  skins: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4a373'],
  hairs: ['#2b1a10', '#0f0f0f', '#5a3a1a', '#c9a15b', '#7a4a20', '#a33b20'],
  shoes: ['#1f2937', '#f8fafc', '#7c2d12', '#374151', '#b91c1c'],
};

/**
 * Persona con articulaciones (hombros, codos, caderas, rodillas, cuello), cara (ojos que parpadean,
 * cejas, nariz, boca que cambia) y ropa. Altura ≈ 1.72 m (niño: kid = true, ≈ 1.25 m).
 * Devuelve un Group con userData.pose(t, modo, opciones). Modos: idle, walk, run, wave, cheer,
 * lookUp, point, scared, jump, throw, shiver, sit, dig.
 */
export function createCharacter(o = {}) {
  const r = mulberry(o.seed ?? 1);
  const pick = (a) => a[(r() * a.length) | 0];
  const skin = o.skin ?? pick(PALETTE.skins), shirt = o.shirt ?? pick(PALETTE.shirts), pants = o.pants ?? pick(PALETTE.pants);
  const hairC = o.hair ?? pick(PALETTE.hairs), shoeC = o.shoes ?? pick(PALETTE.shoes);
  const style = o.hairStyle ?? pick(['short', 'short', 'long', 'bun', 'cap', 'curly']);
  const sk = M(skin, { roughness: 0.6 }), sh = M(shirt, { roughness: 0.85 }), pa = M(pants, { roughness: 0.9 });
  const ha = M(hairC, { roughness: 0.7 }), so = M(shoeC, { roughness: 0.6 });
  const coat = o.coat ? M(o.coat, { roughness: 0.9 }) : null;
  const top = coat ?? sh;

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);          // se mueve con saltos y agachadas
  // Pelvis y torso.
  const pelvis = mesh(rbox(0.3, 0.17, 0.2, 0.06), pa); pelvis.position.y = 0.95; body.add(pelvis);
  const belt = mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.035, 16), M('#3f2a1d')); belt.scale.z = 0.68; belt.position.y = 1.02; body.add(belt);
  const chest = joint(0, 1.03, 0); body.add(chest);         // giro del tronco
  // Torso torneado: cintura más angosta que el pecho y hombros redondeados.
  const prof = coat
    ? [[0.001, -0.06], [0.17, -0.05], [0.175, 0.1], [0.19, 0.28], [0.18, 0.38], [0.12, 0.45], [0.05, 0.47], [0.001, 0.47]]
    : [[0.001, -0.03], [0.15, -0.02], [0.145, 0.08], [0.17, 0.25], [0.175, 0.34], [0.14, 0.42], [0.06, 0.46], [0.001, 0.46]];
  const torso = mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 18), top); torso.scale.set(1.12, 1, 0.68); chest.add(torso);
  if (coat) { // cierre y bolsillos del abrigo
    const zip = mesh(new THREE.BoxGeometry(0.012, 0.42, 0.01), M('#d1d5db')); zip.position.set(0, 0.2, 0.125); chest.add(zip);
  } else {
    const collar = mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 14), sh); collar.rotation.x = Math.PI / 2; collar.position.y = 0.42; chest.add(collar);
  }
  if (o.scarf) {
    const sc = M(o.scarf, { roughness: 0.95 });
    const ring = mesh(new THREE.TorusGeometry(0.07, 0.035, 8, 16), sc); ring.rotation.x = Math.PI / 2; ring.position.y = 0.41; chest.add(ring);
    const tail = mesh(rbox(0.07, 0.22, 0.03, 0.012), sc); tail.position.set(0.05, 0.29, 0.13); tail.rotation.z = 0.1; chest.add(tail);
  }
  const neck = mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.1, 10), sk); neck.position.y = 0.45; chest.add(neck);

  // Cabeza.
  const head = joint(0, 0.5, 0); chest.add(head);
  const skull = mesh(sphere(0.125, 20, 16), sk); skull.scale.set(1, 1.1, 1.02); skull.position.y = 0.1; head.add(skull);
  for (const s of [-1, 1]) { const ear = mesh(sphere(0.026, 8, 6), sk); ear.scale.set(0.5, 1, 0.8); ear.position.set(s * 0.124, 0.1, 0); head.add(ear); }
  const nose = mesh(sphere(0.019, 8, 6), M(skin, { roughness: 0.5 })); nose.scale.set(1, 1, 1.35); nose.position.set(0, 0.085, 0.124); head.add(nose);
  const eyes = new THREE.Group(); eyes.position.set(0, 0.115, 0.1); head.add(eyes);
  for (const s of [-1, 1]) {
    const white = mesh(sphere(0.022, 10, 8), M('#ffffff', { roughness: 0.3 }), { cast: false }); white.position.set(s * 0.045, 0, 0); white.scale.z = 0.7; eyes.add(white);
    const pupil = mesh(sphere(0.012, 8, 6), M('#1c1917', { roughness: 0.2 }), { cast: false }); pupil.position.set(s * 0.045, 0, 0.016); eyes.add(pupil);
  }
  const brows = [];
  for (const s of [-1, 1]) { const b = mesh(rbox(0.05, 0.011, 0.012, 0.005), ha, { cast: false }); b.position.set(s * 0.046, 0.158, 0.112); head.add(b); brows.push(b); }
  const smile = mesh(new THREE.TorusGeometry(0.028, 0.0065, 5, 12, Math.PI), M('#7f1d1d'), { cast: false });
  smile.rotation.z = Math.PI; smile.position.set(0, 0.058, 0.118); head.add(smile);
  const ohh = mesh(sphere(0.019, 10, 8), M('#450a0a'), { cast: false }); ohh.scale.set(0.9, 1.25, 0.4); ohh.position.set(0, 0.045, 0.118); ohh.visible = false; head.add(ohh);
  // Pelo / gorro.
  const cap = (rr, th) => { const g = new THREE.SphereGeometry(rr, 20, 12, 0, Math.PI * 2, 0, th); return g; };
  if (o.beanie) {
    const be = M(o.beanie, { roughness: 0.95 });
    const b = mesh(cap(0.136, Math.PI * 0.55), be); b.position.y = 0.11; head.add(b);
    const band = mesh(new THREE.TorusGeometry(0.128, 0.022, 8, 20), be); band.rotation.x = Math.PI / 2; band.position.y = 0.105; head.add(band);
    const pom = mesh(sphere(0.04, 10, 8), M('#f8fafc', { roughness: 1 })); pom.position.y = 0.26; head.add(pom);
  } else if (style === 'cap') {
    const cc = M(o.capColor ?? pick(PALETTE.shirts), { roughness: 0.8 });
    const c = mesh(cap(0.133, Math.PI * 0.48), cc); c.position.y = 0.115; head.add(c);
    const visor = mesh(rbox(0.17, 0.014, 0.11, 0.006), cc); visor.position.set(0, 0.13, 0.15); visor.rotation.x = 0.12; head.add(visor);
  } else if (style !== 'bald') {
    const h = mesh(cap(0.133, Math.PI * (style === 'curly' ? 0.56 : 0.5)), ha); h.position.y = 0.1; h.rotation.x = -0.32; head.add(h);
    if (style === 'curly') for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const c = mesh(sphere(0.04, 8, 6), ha); c.position.set(Math.cos(a) * 0.1, 0.19 + Math.sin(i) * 0.02, Math.sin(a) * 0.1 - 0.02); head.add(c); }
    if (style === 'long') { const back = mesh(capsule(0.1, 0.18), ha); back.scale.set(1.15, 1, 0.55); back.position.set(0, -0.01, -0.07); head.add(back); }
    if (style === 'bun') { const bun = mesh(sphere(0.055, 10, 8), ha); bun.position.set(0, 0.22, -0.08); head.add(bun); }
  }

  // Brazos: hombro → codo → mano.
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = joint(s * 0.215, 0.38, 0); chest.add(shoulder);
    const upper = mesh(capsule(0.052, 0.2), top); upper.position.y = -0.13; shoulder.add(upper);
    const elbow = joint(0, -0.27, 0); shoulder.add(elbow);
    const fore = mesh(capsule(0.044, 0.18), (o.longSleeves || coat) ? top : sk); fore.position.y = -0.11; elbow.add(fore);
    if (coat) { const cuff = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), coat); cuff.position.y = -0.2; elbow.add(cuff); }
    const hand = mesh(sphere(0.047, 10, 8), o.gloves ? M(o.gloves, { roughness: 0.95 }) : sk); hand.scale.set(0.85, 1.15, 0.7); hand.position.y = -0.25; elbow.add(hand);
    arms.push({ shoulder, elbow, s });
  }
  // Piernas: cadera → rodilla → pie.
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = joint(s * 0.09, 0.87, 0); body.add(hip);
    const thigh = mesh(capsule(0.074, 0.3), pa); thigh.position.y = -0.2; hip.add(thigh);
    const knee = joint(0, -0.43, 0); hip.add(knee);
    const shin = mesh(capsule(0.06, 0.3), pa); shin.position.y = -0.2; knee.add(shin);
    const foot = mesh(rbox(0.11, 0.075, 0.25, 0.03), so); foot.position.set(0, -0.395, 0.045); knee.add(foot);
    const sole = mesh(rbox(0.115, 0.022, 0.255, 0.008), M('#e5e7eb', { roughness: 0.9 })); sole.position.set(0, -0.43, 0.045); knee.add(sole);
    legs.push({ hip, knee, s });
  }
  const scale = o.kid ? 0.72 : (o.height ?? 1.72) / 1.72;
  root.scale.setScalar(scale);
  if (o.kid) head.scale.setScalar(1.18);

  const phase0 = r() * 10;
  root.userData.solid = null;
  // Codos (la mano está en (0, -0.25, 0) de cada uno): sirven para colgar herramientas.
  root.userData.hands = arms.map((a) => a.elbow);
  root.userData.pose = (t, mode = 'idle', opt = {}) => {
    const ph = (opt.phase ?? 0) + phase0, s = t * (opt.speed ?? 1) + ph;
    // Reinicio.
    body.position.set(0, 0, 0); body.rotation.set(0, 0, 0);
    chest.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
    for (const a of arms) { a.shoulder.rotation.set(0, 0, a.s * 0.08); a.elbow.rotation.set(-0.15, 0, 0); }
    for (const l of legs) { l.hip.rotation.set(0, 0, 0); l.knee.rotation.set(0, 0, 0); }
    let mouth = 'smile', browUp = 0;
    const [L, R] = arms, [LL, RL] = legs;
    const breathe = Math.sin(s * 1.6) * 0.012;
    chest.rotation.x = breathe;
    switch (mode) {
      case 'walk': case 'run': {
        const run = mode === 'run', f = run ? 9 : 5.5, a = Math.sin(s * f), amp = run ? 0.75 : 0.45;
        LL.hip.rotation.x = a * amp; RL.hip.rotation.x = -a * amp;
        LL.knee.rotation.x = Math.max(0, Math.sin(s * f - 1.4)) * (run ? 1.4 : 0.75);
        RL.knee.rotation.x = Math.max(0, -Math.sin(s * f - 1.4)) * (run ? 1.4 : 0.75);
        L.shoulder.rotation.x = -a * amp * 0.9; R.shoulder.rotation.x = a * amp * 0.9;
        L.elbow.rotation.x = R.elbow.rotation.x = run ? -1.3 : -0.35;
        body.position.y = Math.abs(Math.cos(s * f)) * (run ? 0.06 : 0.025);
        chest.rotation.x = run ? 0.28 : 0.04;
        if (run) mouth = 'oh';
        break;
      }
      case 'wave': R.shoulder.rotation.z = 2.5 + Math.sin(s * 7) * 0.25; R.elbow.rotation.z = -0.4; R.elbow.rotation.x = -0.2; head.rotation.z = 0.08; browUp = 0.01; break;
      case 'cheer': {
        const b = Math.abs(Math.sin(s * 5));
        L.shoulder.rotation.z = -2.6 - b * 0.2; R.shoulder.rotation.z = 2.6 + b * 0.2;
        L.elbow.rotation.x = R.elbow.rotation.x = -0.3;
        body.position.y = b * 0.12; head.rotation.x = -0.2; mouth = 'oh'; browUp = 0.015;
        break;
      }
      case 'lookUp': {
        const k = opt.amount ?? 1;
        head.rotation.x = -0.75 * k; chest.rotation.x = -0.12 * k;
        L.shoulder.rotation.z = -0.25; R.shoulder.rotation.z = 0.25; mouth = k > 0.5 ? 'oh' : 'smile'; browUp = 0.018 * k;
        break;
      }
      case 'point': R.shoulder.rotation.x = -(opt.up ?? 1.3); R.elbow.rotation.x = 0; head.rotation.x = -(opt.up ?? 1.3) * 0.35; mouth = 'oh'; browUp = 0.012; break;
      case 'scared': {
        // Agachado con las manos en la cabeza.
        L.shoulder.rotation.set(-2.2, 0, -0.9); R.shoulder.rotation.set(-2.2, 0, 0.9);
        L.elbow.rotation.x = R.elbow.rotation.x = -2.0;
        LL.hip.rotation.x = RL.hip.rotation.x = -0.9; LL.knee.rotation.x = RL.knee.rotation.x = 1.6;
        body.position.y = -0.3; chest.rotation.x = 0.35; mouth = 'oh'; browUp = 0.02;
        break;
      }
      case 'jump': {
        const j = Math.max(0, Math.sin(s * 4.5));
        body.position.y = j * 0.45;
        L.shoulder.rotation.z = -2.4; R.shoulder.rotation.z = 2.4;
        LL.knee.rotation.x = RL.knee.rotation.x = 0.4 + (1 - j) * 0.6; LL.hip.rotation.x = RL.hip.rotation.x = -(0.2 + (1 - j) * 0.4);
        mouth = 'oh'; browUp = 0.015;
        break;
      }
      case 'throw': {
        // opt.k: 0 preparando → 1 soltando.
        const k = opt.k ?? 0;
        R.shoulder.rotation.x = 1.2 - k * 3.4; R.elbow.rotation.x = -1.2 + k * 1.1;
        L.shoulder.rotation.x = -0.6 + k * 0.6; chest.rotation.y = 0.5 - k * 1.0; LL.hip.rotation.x = -0.35; RL.hip.rotation.x = 0.3;
        break;
      }
      case 'hold': // sostiene algo frente al pecho (opt.up: 0 pecho … 1 arriba de la cabeza)
        { const u = opt.up ?? 0;
          L.shoulder.rotation.set(-0.9 - u * 1.9, 0, 0.25); R.shoulder.rotation.set(-0.9 - u * 1.9, 0, -0.25);
          L.elbow.rotation.x = R.elbow.rotation.x = -0.9 + u * 0.8; head.rotation.x = -0.15 - u * 0.3; }
        break;
      case 'shiver': chest.rotation.z = Math.sin(s * 9) * 0.035; L.shoulder.rotation.set(-0.5, 0, 0.5); R.shoulder.rotation.set(-0.5, 0, -0.5); L.elbow.rotation.x = R.elbow.rotation.x = -1.9; mouth = 'oh'; break;
      case 'sit': LL.hip.rotation.x = RL.hip.rotation.x = -1.55; LL.knee.rotation.x = RL.knee.rotation.x = 1.55; body.position.y = -0.42; break;
      case 'dig': { const k = Math.sin(s * 4); chest.rotation.x = 0.5 + k * 0.15; L.shoulder.rotation.x = R.shoulder.rotation.x = -0.9 - k * 0.4; L.elbow.rotation.x = R.elbow.rotation.x = -0.5; LL.knee.rotation.x = RL.knee.rotation.x = 0.4; LL.hip.rotation.x = RL.hip.rotation.x = -0.3; body.position.y = -0.06; break; }
      default: { // idle: respira, mira alrededor
        L.shoulder.rotation.z = -0.1 - Math.sin(s) * 0.03; R.shoulder.rotation.z = 0.1 + Math.sin(s) * 0.03;
        head.rotation.y = Math.sin(s * 0.45) * 0.25; head.rotation.x = Math.sin(s * 0.3) * 0.05;
      }
    }
    if (opt.mouth) mouth = opt.mouth;
    smile.visible = mouth === 'smile'; ohh.visible = mouth === 'oh';
    for (const b of brows) b.position.y = 0.158 + browUp;
    // Parpadeo: 0.12 s cada ~3.7 s.
    eyes.scale.y = ((s + 7) % 3.7) < 0.12 ? 0.12 : 1;
  };
  root.userData.pose(0);
  return root;
}

/** Grupo de personas variadas (semilla fija). */
export function crowd(n, seed, extra = {}) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(createCharacter({ seed: seed * 100 + i, ...extra }));
  return out;
}

// ---------------------------------------------------------------- perro
export function createDog({ color = '#c8873a', spots = null, collar = '#dc2626' } = {}) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const fur = M(color, { roughness: 0.95 }), dark = M('#1c1917', { roughness: 0.4 });
  const torso = mesh(capsule(0.15, 0.36), fur); torso.rotation.x = Math.PI / 2; torso.position.y = 0.46; body.add(torso);
  if (spots) for (let i = 0; i < 3; i++) { const sp = mesh(sphere(0.07, 8, 6), M(spots, { roughness: 0.95 })); sp.scale.set(1, 0.4, 1); sp.position.set((i - 1) * 0.06, 0.6, (i - 1) * 0.14); body.add(sp); }
  const neck = joint(0, 0.52, 0.26); body.add(neck);
  const head = mesh(sphere(0.12, 14, 10), fur); head.position.set(0, 0.14, 0.06); neck.add(head);
  const snout = mesh(capsule(0.06, 0.08), M(color, { roughness: 0.9 })); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.1, 0.18); neck.add(snout);
  const nose = mesh(sphere(0.03, 8, 6), dark); nose.position.set(0, 0.12, 0.25); neck.add(nose);
  for (const s of [-1, 1]) {
    const eye = mesh(sphere(0.02, 8, 6), dark); eye.position.set(s * 0.055, 0.19, 0.15); neck.add(eye);
    const ear = mesh(sphere(0.06, 8, 6), M(spots ?? color, { roughness: 0.95 })); ear.scale.set(0.45, 1, 0.75); ear.position.set(s * 0.11, 0.17, 0.03); ear.rotation.z = s * 0.35; neck.add(ear);
  }
  const tongue = mesh(rbox(0.04, 0.01, 0.06, 0.004), M('#f472b6')); tongue.position.set(0, 0.05, 0.21); neck.add(tongue);
  const col = mesh(new THREE.TorusGeometry(0.085, 0.018, 6, 14), M(collar)); col.position.set(0, 0.04, 0.02); col.rotation.x = 1.2; neck.add(col);
  const legs = [];
  for (const [x, z] of [[-0.08, 0.2], [0.08, 0.2], [-0.08, -0.18], [0.08, -0.18]]) {
    const hip = joint(x, 0.4, z); body.add(hip);
    const leg = mesh(capsule(0.04, 0.28), fur); leg.position.y = -0.18; hip.add(leg);
    const paw = mesh(sphere(0.045, 8, 6), M(color, { roughness: 1 })); paw.scale.set(1, 0.6, 1.3); paw.position.set(0, -0.37, 0.02); hip.add(paw);
    legs.push(hip);
  }
  const tailJ = joint(0, 0.52, -0.3); body.add(tailJ);
  const tail = mesh(capsule(0.025, 0.2), fur); tail.position.y = 0.11; tailJ.add(tail); tailJ.rotation.x = -0.6;
  root.userData.pose = (t, mode = 'idle') => {
    body.position.y = 0; body.rotation.set(0, 0, 0); neck.rotation.set(0, 0, 0);
    legs.forEach((l) => l.rotation.set(0, 0, 0));
    tailJ.rotation.set(-0.6, 0, Math.sin(t * 14) * 0.6);
    if (mode === 'run') {
      const a = Math.sin(t * 14);
      legs[0].rotation.x = legs[1].rotation.x = a * 0.8; legs[2].rotation.x = legs[3].rotation.x = -a * 0.8;
      body.position.y = Math.abs(a) * 0.06; body.rotation.x = a * 0.08;
    } else if (mode === 'sit') {
      body.rotation.x = -0.55; body.position.y = -0.08; legs[2].rotation.x = legs[3].rotation.x = 1.3; legs[0].rotation.x = legs[1].rotation.x = 0.55;
      neck.rotation.x = 0.4;
    } else if (mode === 'jump') {
      const j = Math.max(0, Math.sin(t * 6)); body.position.y = j * 0.35; body.rotation.x = -0.3 * j;
      legs[0].rotation.x = legs[1].rotation.x = -0.8 * j; legs[2].rotation.x = legs[3].rotation.x = 0.6 * j;
    } else if (mode === 'lookUp') { neck.rotation.x = -0.7; }
  };
  root.userData.pose(0);
  return root;
}

// ---------------------------------------------------------------- casa detallada
/**
 * Casa de uno o dos pisos: muros con textura (ladrillo o tablas), techo a dos aguas con tejas,
 * ventanas con marco y vidrio, puerta con perilla, escalón y chimenea.
 * Devuelve Group con userData.roof (para hundir el techo) y userData.size.
 */
export function createHouseHQ({ w = 9, d = 8, floors = 1, wall = 'siding', wallColor = '#f1e3c6', roofColor = '#9a3412', door = '#7c2d12', trim = '#ffffff', seed = 1, chimney = true, snowRoof = false } = {}) {
  const g = new THREE.Group();
  const H = floors === 2 ? 5.8 : 3.2;
  const wt = wall === 'brick' ? TX.brick(wallColor) : TX.siding(wallColor);
  const wallMat = M('#ffffff', { map: wt.map, normalMap: wt.normalMap, roughness: 0.9 });
  const walls = mesh(boxUV(w, H, d, wall === 'brick' ? 1.2 : 1.6), wallMat); walls.position.y = H / 2; g.add(walls);
  // Zócalo (base) un poco más ancho que el muro.
  const plinth = mesh(boxUV(w + 0.12, 0.35, d + 0.12, 1), M('#9ca3af', { map: TX.concrete().map, roughness: 1 })); plinth.position.y = 0.175; g.add(plinth);
  // Techo a dos aguas: dos losas inclinadas con tejas + hastiales triangulares.
  const pitch = 0.6, over = 0.45, rise = (d / 2 + over) * Math.tan(pitch);
  const slabLen = (d / 2 + over) / Math.cos(pitch);
  const st = TX.shingles(roofColor);
  const roofMat = M('#ffffff', { map: st.map, normalMap: st.normalMap, roughness: 0.85 });
  const roof = new THREE.Group(); roof.position.y = H; g.add(roof);
  const slabs = [];
  for (const s of [-1, 1]) {
    const pivot = joint(0, -over * Math.tan(pitch) + 0.04, s * (d / 2 + over)); roof.add(pivot); // alero
    const slab = mesh(boxUV(w + 2 * over, 0.16, slabLen, 1.4), roofMat);
    slab.position.set(0, slabLen / 2 * Math.sin(pitch), -s * slabLen / 2 * Math.cos(pitch));
    slab.rotation.x = s * pitch;
    pivot.add(slab); slabs.push({ pivot, s });
    if (snowRoof) {
      const sn = mesh(boxUV(w + 2 * over + 0.1, 0.1, slabLen + 0.06, 2), M('#ffffff', { map: TX.snow().map, normalMap: TX.snow().normalMap, roughness: 0.85 }));
      sn.position.set(0, 0.14, 0); slab.add(sn);
      sn.userData.keep = true; sn.userData.snowCap = { th0: 0.1 };
    }
  }
  const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, d / 2 * Math.tan(pitch)); tri.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false });
  const uvs = gableGeo.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) / 1.6, uvs.getY(i) / 1.6);
  const gables = [];
  for (const s of [-1, 1]) { const gb = mesh(gableGeo, wallMat); gb.rotation.y = Math.PI / 2; gb.position.set(s * (w / 2 - 0.01) - (s > 0 ? 0.2 : 0), -0.001, 0); roof.add(gb); gables.push(gb); }
  if (chimney) { const ch = mesh(boxUV(0.7, 2.2, 0.7, 1), M('#ffffff', { map: TX.brick('#8b3a2a').map, roughness: 0.9 })); ch.position.set(w * 0.28, H + 1.2, -d * 0.18); g.add(ch); }
  // Ventanas y puerta en el frente (+z) y ventanas atrás y a los lados.
  const glass = M('#9cc9e8', { roughness: 0.12, metalness: 0.35, emissive: '#1e3a5f', emissiveIntensity: 0.15 });
  const trimM = M(trim, { roughness: 0.6 });
  const windowAt = (x, y, z, ry, ww = 1.2, wh = 1.1) => {
    const win = new THREE.Group(); win.position.set(x, y, z); win.rotation.y = ry;
    const gl = mesh(new THREE.BoxGeometry(ww, wh, 0.04), glass, { cast: false }); gl.position.z = 0.0; win.add(gl);
    const bar = (bw, bh, px, py) => { const b = mesh(new THREE.BoxGeometry(bw, bh, 0.1), trimM); b.position.set(px, py, 0.03); win.add(b); };
    bar(ww + 0.16, 0.08, 0, wh / 2 + 0.04); bar(ww + 0.16, 0.08, 0, -wh / 2 - 0.04);
    bar(0.08, wh, -ww / 2 - 0.04, 0); bar(0.08, wh, ww / 2 + 0.04, 0);
    bar(0.05, wh, 0, 0); bar(ww, 0.05, 0, 0);
    const sill = mesh(new THREE.BoxGeometry(ww + 0.3, 0.06, 0.2), trimM); sill.position.set(0, -wh / 2 - 0.1, 0.08); win.add(sill);
    g.add(win);
  };
  const front = d / 2 + 0.01;
  for (let f = 0; f < floors; f++) {
    const y = 1.65 + f * 2.6;
    windowAt(-w * 0.3, y, front, 0); windowAt(w * 0.3, y, front, 0);
    windowAt(-w * 0.25, y, -front, Math.PI); windowAt(w * 0.25, y, -front, Math.PI);
    windowAt(w / 2 + 0.01, y, 0, Math.PI / 2); windowAt(-w / 2 - 0.01, y, 0, -Math.PI / 2);
    if (f === 1) windowAt(0, y, front, 0, 0.9, 1.0);
  }
  const dm = TX.wood(door);
  const doorG = new THREE.Group(); doorG.position.set(0, 0, front); g.add(doorG);
  const leaf = mesh(new THREE.BoxGeometry(1.1, 2.15, 0.06), M('#ffffff', { map: dm.map, normalMap: dm.normalMap, roughness: 0.7 })); leaf.position.set(0, 1.42, 0.01); doorG.add(leaf);
  for (const [bw, bh, px, py] of [[1.35, 0.1, 0, 2.55], [0.1, 2.2, -0.62, 1.42], [0.1, 2.2, 0.62, 1.42]]) { const b = mesh(new THREE.BoxGeometry(bw, bh, 0.12), trimM); b.position.set(px, py, 0.03); doorG.add(b); }
  const knob = mesh(sphere(0.04, 8, 6), M('#d4af37', { metalness: 0.8, roughness: 0.3 })); knob.position.set(0.38, 1.35, 0.07); doorG.add(knob);
  const step = mesh(boxUV(1.8, 0.32, 0.9, 1), M('#ffffff', { map: TX.concrete().map, roughness: 1 })); step.position.set(0, 0.16, front + 0.45); g.add(step);
  g.userData.solid = 'casa';
  g.userData.radius = Math.hypot(w / 2 + over, d / 2 + over) * 0.8;
  g.userData.size = { w, d, H, rise };
  /** Hunde el techo (0 = entero, 1 = caído hacia dentro). */
  g.userData.collapse = (k) => { for (const sl of slabs) sl.pivot.rotation.x = -sl.s * k * 0.9; for (const gb of gables) gb.scale.y = Math.max(0.02, 1 - k); };
  void seed;
  return g;
}

// ---------------------------------------------------------------- coche
export function createCar({ color = '#dc2626', seed = 1, snow = false } = {}) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const paint = M(color, { roughness: 0.32, metalness: 0.45 });
  const L = 4.3, Wd = 1.78;
  // Perfil lateral (x = largo, y = alto), extruido a lo ancho.
  const p = new THREE.Shape();
  p.moveTo(-L / 2, 0.38); p.lineTo(-L / 2, 0.85); p.quadraticCurveTo(-L / 2 + 0.05, 0.98, -L / 2 + 0.4, 1.0);
  p.lineTo(L / 2 - 0.35, 1.0); p.quadraticCurveTo(L / 2, 0.95, L / 2, 0.75); p.lineTo(L / 2, 0.38); p.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(p, { depth: Wd - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 6 });
  bodyGeo.translate(0, 0, -(Wd - 0.12) / 2);
  body.add(mesh(bodyGeo, paint));
  // Cabina (vidrio) y techo.
  const c = new THREE.Shape();
  c.moveTo(-L * 0.28, 1.0); c.lineTo(-L * 0.2, 1.42); c.lineTo(L * 0.14, 1.42); c.lineTo(L * 0.3, 1.0); c.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(c, { depth: Wd - 0.34, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  cabGeo.translate(0, 0, -(Wd - 0.34) / 2);
  body.add(mesh(cabGeo, M('#1e293b', { roughness: 0.08, metalness: 0.6 })));
  const roofCap = mesh(rbox(L * 0.34, 0.06, Wd - 0.3, 0.03), paint); roofCap.position.set(-L * 0.03, 1.45, 0); body.add(roofCap);
  const pillar = mesh(new THREE.BoxGeometry(0.08, 0.42, Wd - 0.28), paint); pillar.position.set(-L * 0.03, 1.21, 0); body.add(pillar);
  // Defensas, luces, placa, espejos.
  for (const s of [-1, 1]) {
    const bump = mesh(rbox(0.14, 0.22, Wd + 0.02, 0.05), M('#27272a', { roughness: 0.6 })); bump.position.set(s * (L / 2 + 0.06), 0.48, 0); body.add(bump);
    for (const z of [-0.6, 0.6]) {
      const lt = mesh(rbox(0.06, 0.13, 0.32, 0.02), s > 0 ? M('#fffbeb', { emissive: '#fde68a', emissiveIntensity: 0.6 }) : M('#b91c1c', { emissive: '#7f1d1d', emissiveIntensity: 0.5 }));
      lt.position.set(s * (L / 2 + 0.035), 0.8, z); body.add(lt);
      if (s < 0) (g.userData.tail ??= []).push(lt);
    }
    const plate = mesh(new THREE.BoxGeometry(0.03, 0.14, 0.42), M('#f8fafc', { roughness: 0.5 })); plate.position.set(s * (L / 2 + 0.14), 0.52, 0); body.add(plate);
    const mirror = mesh(rbox(0.12, 0.1, 0.16, 0.03), paint); mirror.position.set(L * 0.22, 1.05, s * (Wd / 2 + 0.05)); body.add(mirror);
  }
  // Ruedas: llanta + rin + tapón.
  const tire = M('#18181b', { roughness: 0.9 }), rim = M('#cbd5e1', { metalness: 0.8, roughness: 0.25 });
  const wheels = [];
  for (const x of [-L * 0.32, L * 0.32]) for (const s of [-1, 1]) {
    const wh = new THREE.Group(); wh.position.set(x, 0.34, s * (Wd / 2 - 0.08)); g.add(wh);
    const t = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18), tire); t.rotation.x = Math.PI / 2; wh.add(t);
    const rm = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.25, 12), rim); rm.rotation.x = Math.PI / 2; wh.add(rm);
    wheels.push(wh);
  }
  if (snow) {
    const sm = M('#ffffff', { map: TX.snow().map, roughness: 0.85 });
    for (const [x, y, len] of [[-L * 0.03, 1.5, L * 0.36], [L * 0.38, 1.05, L * 0.22], [-L * 0.42, 1.05, L * 0.14]]) {
      const c = mesh(rbox(len, 0.1, Wd - 0.2, 0.04), sm); c.position.set(x, y, 0); body.add(c);
      c.userData.keep = true; c.userData.snowCap = { th0: 0.1 };
    }
  }
  g.userData.solid = 'coche';
  g.userData.radius = 2.25;
  g.userData.body = body; g.userData.roofCap = roofCap;
  /** Alarma: luces traseras parpadeando (on = 0/1). */
  g.userData.alarm = (on) => { for (const l of g.userData.tail) l.material = on ? M('#fca5a5', { emissive: '#ef4444', emissiveIntensity: 2.2 }) : M('#b91c1c', { emissive: '#7f1d1d', emissiveIntensity: 0.5 }); };
  void seed;
  return g;
}

// ---------------------------------------------------------------- árboles y plantas
export function createTreeHQ({ h = 8, seed = 1, pine = false, leaf = null, snow = 0 } = {}) {
  const r = mulberry(seed);
  const g = new THREE.Group();
  const bk = TX.bark();
  const barkM = M('#ffffff', { map: bk.map, normalMap: bk.normalMap, roughness: 1 });
  const th = pine ? h * 0.3 : h * 0.5;
  const trunkGeo = new THREE.CylinderGeometry(h * 0.022, h * 0.035, th, 10, 1);
  const tu = trunkGeo.attributes.uv; for (let i = 0; i < tu.count; i++) tu.setXY(i, tu.getX(i) * 2, tu.getY(i) * th / 1.5);
  const trunk = mesh(trunkGeo, barkM); trunk.position.y = th / 2; g.add(trunk);
  const leafC = leaf ?? (pine ? ['#2f6b3a', '#285e33', '#36733f'] : ['#3f8f3a', '#4c9a3f', '#5aa546', '#37803a'])[(r() * 3) | 0];
  const lv = TX.leaves(leafC);
  const leafM = M('#ffffff', { map: lv.map, normalMap: lv.normalMap, roughness: 0.95 });
  const snowM = snow ? M('#ffffff', { map: TX.snow().map, roughness: 0.9 }) : null;
  if (pine) {
    for (let i = 0; i < 4; i++) {
      const rr = h * (0.3 - i * 0.055), hh = h * 0.32, y = th * 0.7 + i * h * 0.17;
      const c = mesh(new THREE.ConeGeometry(rr, hh, 10, 1), leafM); c.position.y = y + hh / 2; c.rotation.y = r() * 3; g.add(c);
      if (snowM) { const sc = mesh(new THREE.ConeGeometry(rr * 0.75, hh * 0.45, 10, 1), snowM); sc.position.y = y + hh * 0.78; g.add(sc); }
    }
  } else {
    // Ramas y copa de 6 bolas de follaje.
    for (let i = 0; i < 3; i++) {
      const br = mesh(new THREE.CylinderGeometry(h * 0.01, h * 0.016, h * 0.22, 6), barkM);
      const a = i * 2.1 + r(); br.position.set(Math.cos(a) * h * 0.05, th * 0.85, Math.sin(a) * h * 0.05); br.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); g.add(br);
    }
    const blobs = [[0, 0.72, 0, 0.3], [0.17, 0.66, 0.05, 0.22], [-0.16, 0.65, -0.04, 0.22], [0.04, 0.66, 0.17, 0.21], [-0.04, 0.68, -0.17, 0.21], [0.02, 0.86, 0.01, 0.2]];
    for (const [x, y, z, s] of blobs) {
      const k = 0.9 + r() * 0.2;
      const b = mesh(new THREE.IcosahedronGeometry(h * s * k, 1), leafM); b.position.set(x * h, y * h, z * h); b.rotation.set(r() * 3, r() * 3, 0); g.add(b);
      if (snowM && y > 0.7) { const sc = mesh(new THREE.SphereGeometry(h * s * k * 0.9, 12, 6, 0, Math.PI * 2, 0, 1.0), snowM); sc.position.set(x * h, y * h + h * s * 0.15, z * h); g.add(sc); }
    }
  }
  g.userData.solid = 'árbol';
  g.userData.radius = pine ? h * 0.28 : h * 0.36;
  return g;
}

export function createBush({ size = 1, seed = 1, color = '#3f8f3a' } = {}) {
  const r = mulberry(seed), g = new THREE.Group();
  const lv = TX.leaves(color), m = M('#ffffff', { map: lv.map, normalMap: lv.normalMap, roughness: 1 });
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.IcosahedronGeometry(size * (0.45 + r() * 0.2), 1), m); b.position.set((r() - 0.5) * size, size * 0.4, (r() - 0.5) * size); g.add(b); }
  g.userData.solid = 'arbusto'; g.userData.radius = size * 0.85;
  return g;
}

// ---------------------------------------------------------------- mobiliario urbano
export function createLamp() {
  const g = new THREE.Group(), metal = M('#1f2937', { metalness: 0.6, roughness: 0.4 });
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.1, 5, 10), metal); pole.position.y = 2.5; g.add(pole);
  const arm = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), metal); arm.rotation.z = Math.PI / 2; arm.position.set(0.5, 4.9, 0); g.add(arm);
  const head = mesh(rbox(0.5, 0.14, 0.3, 0.04), metal); head.position.set(1.0, 4.85, 0); g.add(head);
  const bulb = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.22), M('#fef9c3', { emissive: '#fde68a', emissiveIntensity: 0.4 }), { cast: false }); bulb.position.set(1.0, 4.77, 0); g.add(bulb);
  g.userData.bulb = bulb;
  return g;
}

export function createBench() {
  const g = new THREE.Group(), wd = TX.wood('#a0662f'), woodM = M('#ffffff', { map: wd.map, normalMap: wd.normalMap, roughness: 0.8 }), metal = M('#334155', { metalness: 0.5, roughness: 0.5 });
  for (let i = 0; i < 3; i++) { const s = mesh(rbox(1.8, 0.05, 0.13, 0.02), woodM); s.position.set(0, 0.48, -0.16 + i * 0.16); g.add(s); }
  for (let i = 0; i < 2; i++) { const s = mesh(rbox(1.8, 0.13, 0.05, 0.02), woodM); s.position.set(0, 0.68 + i * 0.17, -0.3); s.rotation.x = -0.12; g.add(s); }
  for (const x of [-0.75, 0.75]) { const l = mesh(new THREE.BoxGeometry(0.06, 0.48, 0.5), metal); l.position.set(x, 0.24, -0.05); g.add(l); const b = mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), metal); b.position.set(x, 0.72, -0.32); g.add(b); }
  return g;
}

export function createTrashCan(color = '#166534') {
  const g = new THREE.Group(), m = M(color, { metalness: 0.4, roughness: 0.5 });
  const b = mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.85, 14), m); b.position.y = 0.425; g.add(b);
  const lid = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14), M('#14532d', { metalness: 0.4, roughness: 0.5 })); lid.position.y = 0.88; g.add(lid);
  for (const y of [0.25, 0.6]) { const ring = mesh(new THREE.TorusGeometry(0.275, 0.012, 4, 20), M('#0f172a')); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); }
  return g;
}

export function createCone() {
  const g = new THREE.Group();
  const c = mesh(new THREE.ConeGeometry(0.17, 0.62, 14), M('#f97316', { roughness: 0.5 })); c.position.y = 0.35; g.add(c);
  const band = mesh(new THREE.CylinderGeometry(0.095, 0.115, 0.1, 14), M('#f8fafc', { roughness: 0.4 })); band.position.y = 0.42; g.add(band);
  const base = mesh(rbox(0.42, 0.04, 0.42, 0.015), M('#ea580c')); base.position.y = 0.02; g.add(base);
  return g;
}

export function createHydrant() {
  const g = new THREE.Group(), m = M('#dc2626', { roughness: 0.45, metalness: 0.2 });
  const b = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.65, 12), m); b.position.y = 0.33; g.add(b);
  const top = mesh(sphere(0.14, 12, 8), m); top.scale.y = 0.6; top.position.y = 0.66; g.add(top);
  for (const s of [-1, 1]) { const n = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), m); n.rotation.z = Math.PI / 2; n.position.set(s * 0.17, 0.45, 0); g.add(n); }
  return g;
}

export function createHoop() {
  const g = new THREE.Group(), metal = M('#334155', { metalness: 0.6, roughness: 0.4 });
  const pole = mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 10), metal); pole.position.y = 1.65; g.add(pole);
  const arm = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), metal); arm.position.set(0, 3.15, 0.45); g.add(arm);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160;
  const c2 = cv.getContext('2d'); c2.fillStyle = '#f8fafc'; c2.fillRect(0, 0, 256, 160); c2.strokeStyle = '#dc2626'; c2.lineWidth = 8; c2.strokeRect(6, 6, 244, 148); c2.strokeRect(84, 70, 88, 64);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const board = mesh(new THREE.BoxGeometry(1.8, 1.05, 0.05), [M('#e5e7eb'), M('#e5e7eb'), M('#e5e7eb'), M('#e5e7eb'), M('#ffffff', { map: tex }), M('#e5e7eb')]);
  board.position.set(0, 3.3, 0.92); g.add(board);
  const rimM = mesh(new THREE.TorusGeometry(0.23, 0.018, 6, 20), M('#ea580c', { metalness: 0.4 })); rimM.rotation.x = Math.PI / 2; rimM.position.set(0, 3.05, 1.18); g.add(rimM);
  const net = mesh(new THREE.CylinderGeometry(0.23, 0.15, 0.4, 12, 3, true), M('#f8fafc', { wireframe: true })); net.position.set(0, 2.83, 1.18); g.add(net);
  return g;
}

/** Edificio de departamentos: fachada con ventanas pintadas en textura (una repetición = un piso). */
export function createApartment({ floors = 15, w = 18, d = 16, color = '#d6d3d1', seed = 1 } = {}) {
  const key = color;
  const tex = facadeTex(key, seed);
  const h = floors * 3.2;
  const g = new THREE.Group();
  const geo = boxUV(w, h, d, 3.2);
  const fm = M('#ffffff', { map: tex.map, normalMap: tex.normalMap, roughness: 0.85 });
  const bodyM = mesh(geo, [fm, fm, M(color, { roughness: 0.9 }), M(color), fm, fm]); bodyM.position.y = h / 2; g.add(bodyM);
  const parapet = mesh(boxUV(w + 0.3, 0.8, d + 0.3, 2), M('#a8a29e', { roughness: 0.9 })); parapet.position.y = h + 0.4; g.add(parapet);
  const roofIn = mesh(new THREE.BoxGeometry(w - 0.4, 0.82, d - 0.4), M('#6b7280', { roughness: 1 })); roofIn.position.y = h + 0.42; g.add(roofIn);
  for (let i = 0; i < 3; i++) { const ac = mesh(rbox(1.6, 1.0, 1.2, 0.08), M('#9ca3af', { metalness: 0.4 })); ac.position.set(-w * 0.3 + i * w * 0.3, h + 1.3, d * 0.15); g.add(ac); }
  g.userData.solid = 'edificio'; g.userData.radius = Math.hypot(w, d) / 2;
  g.userData.height = h;
  return g;
}

function facadeTex(color, seed) {
  return cached('facade' + color + seed, () => {
    const n = 256, c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), r = mulberry(seed);
    g.fillStyle = color; g.fillRect(0, 0, n, n);
    // 4 ventanas por repetición (3.2 m × 3.2 m → 1 piso): marco, vidrio con reflejo, cortinas variadas.
    for (let i = 0; i < 2; i++) {
      const x = 22 + i * 128, y = 50, ww = 84, wh = 120;
      g.fillStyle = '#e7e5e4'; g.fillRect(x - 6, y - 6, ww + 12, wh + 18);
      const grd = g.createLinearGradient(x, y, x + ww, y + wh); grd.addColorStop(0, '#7fa6c8'); grd.addColorStop(1, '#3d5f80');
      g.fillStyle = grd; g.fillRect(x, y, ww, wh);
      if (r() < 0.5) { g.fillStyle = ['#fde68a', '#fecaca', '#bbf7d0', '#e0e7ff'][(r() * 4) | 0]; g.globalAlpha = 0.55; g.fillRect(x, y, ww * (0.3 + r() * 0.4), wh); g.globalAlpha = 1; }
      g.fillStyle = '#e7e5e4'; g.fillRect(x + ww / 2 - 2, y, 4, wh);
    }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, n - 10, n, 10);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16;
    const hc = document.createElement('canvas'); hc.width = hc.height = n; const hg = hc.getContext('2d');
    hg.fillStyle = '#999'; hg.fillRect(0, 0, n, n); hg.fillStyle = '#333'; for (let i = 0; i < 2; i++) hg.fillRect(22 + i * 128, 50, 84, 120);
    return { map: t, normalMap: null };
  });
}

/** Rascacielos con fachada de vidrio, escalonado arriba y antena. */
export function createTower({ h = 182, w = 30, color = '#93c5fd', seed = 3, antenna = null } = {}) {
  const g = new THREE.Group();
  const tex = cached('glass' + color, () => {
    const n = 128, c = document.createElement('canvas'); c.width = c.height = n;
    const g2 = c.getContext('2d');
    const grd = g2.createLinearGradient(0, 0, n, n); grd.addColorStop(0, color); grd.addColorStop(1, '#1e3a5f');
    g2.fillStyle = grd; g2.fillRect(0, 0, n, n);
    g2.fillStyle = 'rgba(226,232,240,0.85)'; g2.fillRect(0, n - 8, n, 8); g2.fillRect(0, 0, 6, n);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16;
    return t;
  });
  const gm = M('#ffffff', { map: tex, roughness: 0.2, metalness: 0.5 });
  const tiers = [[1, 0.78], [0.82, 0.14], [0.62, 0.08]];
  let y = 0;
  for (const [k, frac] of tiers) {
    const hh = h * frac, ww = w * k;
    const b = mesh(boxUV(ww, hh, ww, 4), gm); b.position.y = y + hh / 2; g.add(b);
    const band = mesh(boxUV(ww + 0.6, 1.2, ww + 0.6, 2), M('#e2e8f0', { metalness: 0.5, roughness: 0.4 })); band.position.y = y + hh + 0.6; g.add(band);
    y += hh + 1.2;
  }
  const aH = antenna ?? h * 0.25;
  const ant = mesh(new THREE.CylinderGeometry(0.4, 0.9, aH, 8), M('#cbd5e1', { metalness: 0.7, roughness: 0.3 })); ant.position.y = y + aH / 2; g.add(ant);
  g.userData.solid = 'torre'; g.userData.radius = w * 0.75; g.userData.height = y + aH; g.userData.roof = y;
  void seed;
  return g;
}

/** Avión de pasajeros (≈ 38 m). Nariz hacia +x. */
export function createPlane() {
  const g = new THREE.Group(), white = M('#f8fafc', { roughness: 0.4, metalness: 0.2 }), blue = M('#1d4ed8', { roughness: 0.4 });
  const fus = mesh(capsule(2, 30, 6, 16), white); fus.rotation.z = Math.PI / 2; g.add(fus);
  const stripe = mesh(new THREE.CylinderGeometry(2.02, 2.02, 26, 16, 1, true, -0.3, 0.6), blue); stripe.rotation.z = Math.PI / 2; g.add(stripe);
  const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.lineTo(-6, 17); wing.lineTo(-9, 17); wing.lineTo(-7, 0); wing.closePath();
  const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.5, bevelEnabled: false }); wg.rotateX(Math.PI / 2);
  for (const s of [-1, 1]) {
    const wm = mesh(wg, white); wm.scale.z = s; wm.position.set(3, -0.8, 0); g.add(wm);
    const eng = mesh(new THREE.CylinderGeometry(1.1, 1.0, 4, 14), M('#cbd5e1', { metalness: 0.6 })); eng.rotation.z = Math.PI / 2; eng.position.set(1.5, -1.9, s * 6.5); g.add(eng);
    const tail = mesh(new THREE.BoxGeometry(3, 0.3, 6), white); tail.position.set(-15, 0.5, s * 3); g.add(tail);
  }
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(-4, 7); fin.lineTo(-6.5, 7); fin.lineTo(-5, 0); fin.closePath();
  const fm = mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.4, bevelEnabled: false }), blue); fm.position.set(-12, 1.5, -0.2); g.add(fm);
  return g;
}

// ---------------------------------------------------------------- utilidades
const tcache = new Map();
function cached(k, fn) { if (!tcache.has(k)) tcache.set(k, fn()); return tcache.get(k); }
export function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
