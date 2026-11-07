// Física de colisiones (cannon-es) PRECALCULADA: la simulación corre una sola vez al preparar el
// episodio, a paso fijo, y se guarda la posición y el giro de cada cuerpo 60 veces por segundo.
// Al dibujar el instante t se interpola entre las dos muestras más cercanas. Así cada fotograma
// sale idéntico en cada render (el video no depende de la velocidad de la computadora).
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export { CANNON };

export function createSim({ gravity = -9.81, dt = 1 / 120, rate = 60, friction = 0.45, restitution = 0.25 } = {}) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, gravity, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.defaultContactMaterial.friction = friction;
  world.defaultContactMaterial.restitution = restitution;
  world.solver.iterations = 12;
  const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(ground);
  const tracked = [], events = [];
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion();

  return {
    CANNON, world, ground, tracked,
    /** Agrega un cuerpo y el objeto 3D que lo sigue. */
    add(body, obj) { body.sleepSpeedLimit = 0.15; body.sleepTimeLimit = 0.6; world.addBody(body); tracked.push({ body, obj, pos: [], rot: [] }); return body; },
    /** Cuerpo fijo (no se registra: no se mueve). */
    addStatic(body) { body.type = CANNON.Body.STATIC; world.addBody(body); return body; },
    /** Ejecuta fn(world) en el instante t de la simulación (empujones, explosiones...). */
    at(t, fn) { events.push({ t, fn }); },
    /** Empujón radial desde un punto (x, y, z): fuerza que baja con la distancia. */
    blast(t, x, y, z, strength, radius) {
      events.push({ t, fn: () => {
        for (const tr of tracked) {
          const b = tr.body, dx = b.position.x - x, dy = b.position.y - y, dz = b.position.z - z;
          const d = Math.hypot(dx, dy, dz);
          if (d > radius) continue;
          const k = strength * (1 - d / radius) * b.mass, n = Math.max(d, 0.3);
          b.wakeUp();
          // El punto de aplicación es RELATIVO al centro del cuerpo: un poco descentrado para que gire.
          b.applyImpulse(new CANNON.Vec3((dx / n) * k, k * 0.9 + (dy / n) * k * 0.3, (dz / n) * k), new CANNON.Vec3(Math.sin(d * 7) * 0.08, 0.06, Math.cos(d * 5) * 0.08));
        }
      } });
    },
    /** Corre la simulación de 0 a T segundos y guarda las muestras. */
    run(T) {
      events.sort((a, b) => a.t - b.t);
      const every = Math.round(1 / (rate * dt)), n = Math.ceil(T / dt);
      let ei = 0;
      const rec = () => { for (const tr of tracked) { const b = tr.body; tr.pos.push(b.position.x, b.position.y, b.position.z); tr.rot.push(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w); } };
      rec();
      for (let i = 1; i <= n; i++) {
        const t = (i - 1) * dt;
        while (ei < events.length && events[ei].t <= t) events[ei++].fn(world);
        world.step(dt);
        if (i % every === 0) rec();
      }
      this.duration = T;
    },
    /** Coloca cada objeto 3D en el instante t (interpolado). */
    apply(t) {
      for (const tr of tracked) {
        const N = tr.pos.length / 3;
        const f = Math.min(N - 1.0001, Math.max(0, t * rate)), i = Math.floor(f), a = f - i;
        const p = tr.pos, r = tr.rot;
        tr.obj.position.set(p[i * 3] + (p[i * 3 + 3] - p[i * 3]) * a, p[i * 3 + 1] + (p[i * 3 + 4] - p[i * 3 + 1]) * a, p[i * 3 + 2] + (p[i * 3 + 5] - p[i * 3 + 2]) * a);
        q.set(r[i * 4], r[i * 4 + 1], r[i * 4 + 2], r[i * 4 + 3]); q2.set(r[i * 4 + 4], r[i * 4 + 5], r[i * 4 + 6], r[i * 4 + 7]);
        tr.obj.quaternion.copy(q.slerp(q2, a));
      }
    },
  };
}

/** Cuerpo de caja (medidas completas en metros). */
export function boxBody(w, h, d, mass, x, y, z, rotY = 0) {
  const b = new CANNON.Body({ mass, shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)), position: new CANNON.Vec3(x, y, z) });
  b.quaternion.setFromEuler(0, rotY, 0);
  b.linearDamping = 0.05; b.angularDamping = 0.1;
  return b;
}
export function sphereBody(r, mass, x, y, z) {
  const b = new CANNON.Body({ mass, shape: new CANNON.Sphere(r), position: new CANNON.Vec3(x, y, z) });
  b.linearDamping = 0.05; b.angularDamping = 0.15;
  return b;
}
export function cylBody(r, h, mass, x, y, z) {
  const b = new CANNON.Body({ mass, shape: new CANNON.Cylinder(r, r, h, 10), position: new CANNON.Vec3(x, y, z) });
  b.linearDamping = 0.05; b.angularDamping = 0.1;
  return b;
}
