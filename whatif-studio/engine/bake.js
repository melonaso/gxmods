// "Horneado" de lo estático: junta todas las piezas que no se mueven (casas, árboles, calles...)
// en una malla por material. Con cientos de objetos de decenas de piezas, el render por software
// pasa de miles de llamadas de dibujo a unas decenas, sin cambiar nada de la imagen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function clean(g) {
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.morphAttributes = {};
  return g;
}

/** Parte de una geometría no indexada (vértices start … start+count). */
function slice(g, start, count) {
  const out = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(g.attributes)) out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize));
  return out;
}

/**
 * Junta las mallas de `roots` (grupos ya colocados en la escena) por material y las reemplaza
 * por mallas fusionadas. Devuelve la lista de mallas nuevas.
 */
export function bake(scene, roots) {
  const buckets = new Map(), keep = [];
  const push = (mat, geo, cast) => {
    const key = mat.uuid + (cast ? 'c' : 'n');
    if (!buckets.has(key)) buckets.set(key, { mat, cast, list: [] });
    buckets.get(key).list.push(geo);
  };
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData.keep) { keep.push(o); return; } // piezas que cambian (p. ej. nieve que crece): no se hornean
      let vis = true; for (let p = o; p && p !== root.parent; p = p.parent) if (!p.visible) vis = false;
      if (!vis) return;
      const base = clean((o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld));
      if (Array.isArray(o.material)) {
        const groups = o.geometry.groups.length ? o.geometry.groups : [{ start: 0, count: base.attributes.position.count, materialIndex: 0 }];
        for (const gr of groups) push(o.material[gr.materialIndex], slice(base, gr.start, Math.min(gr.count, base.attributes.position.count - gr.start)), o.castShadow);
      } else push(o.material, base, o.castShadow);
    });
    for (const k of keep.splice(0)) scene.attach(k); // conserva su posición en el mundo
    scene.remove(root);
  }
  const meshes = [];
  for (const { mat, cast, list } of buckets.values()) {
    const g = mergeGeometries(list, false);
    if (!g) continue;
    const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = true; m.matrixAutoUpdate = false;
    scene.add(m); meshes.push(m);
  }
  return meshes;
}

/** Choques entre sólidos ANTES de hornear (mismo criterio que el control de calidad). */
export function solidOverlaps(roots) {
  const solids = [];
  for (const r of roots) r.traverse((o) => { if (o.userData?.solid) { o.updateMatrixWorld(true); solids.push({ o, b: new THREE.Box3().setFromObject(o, true) }); } });
  const out = [];
  for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
    const a = solids[i].b, b = solids[j].b;
    const ox = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x), oz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z), oy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    if (!(ox > 0.3 && oz > 0.3 && oy > 0)) continue;
    const oa = solids[i].o, ob = solids[j].o;
    if (oa.userData.radius && ob.userData.radius) {
      const pa = oa.getWorldPosition(new THREE.Vector3()), pb = ob.getWorldPosition(new THREE.Vector3());
      if (Math.hypot(pa.x - pb.x, pa.z - pb.z) >= oa.userData.radius + ob.userData.radius - 0.3) continue;
    }
    const c = (bx) => { const v = bx.getCenter(new THREE.Vector3()); return `(${v.x.toFixed(0)}, ${v.z.toFixed(0)})`; };
    out.push(`${oa.userData.solid} ${c(a)} ↔ ${ob.userData.solid} ${c(b)}`);
  }
  return out;
}
