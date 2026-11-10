// Hero playground: the crew stands on the paper. Poke them, pick them up, toss them.

import * as THREE from 'three';
import { Stage } from './stage.js';
import { makers } from './characters.js';
import { blobShadow, inked, paperLights, toon } from './toon.js';

const GRAVITY = -22;
const FLOOR = 0;
const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _hit = new THREE.Vector3();
const _plane = new THREE.Plane();
const _tmp = new THREE.Vector3();

function makeMug() {
  const g = new THREE.Group();
  const cup = inked(new THREE.CylinderGeometry(0.34, 0.3, 0.72, 8, 1, false), toon('#fffbef'), 0.03);
  cup.position.y = 0.36;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8), toon('#7a4a2a'));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.66;
  const band = inked(new THREE.CylinderGeometry(0.345, 0.33, 0.16, 8, 1, true), toon('#3e8bff'), 0.02);
  band.position.y = 0.36;
  const handle = inked(new THREE.TorusGeometry(0.17, 0.05, 4, 8), toon('#fffbef'), 0.02);
  handle.position.set(0.36, 0.38, 0);
  g.add(cup, coffee, band, handle);
  return g;
}

function makePencil() {
  const g = new THREE.Group();
  const shaft = inked(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 6), toon('#ffc234'), 0.022);
  const tip = inked(new THREE.ConeGeometry(0.07, 0.24, 6), toon('#f3d7a6'), 0.02);
  tip.position.y = 0.92;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), new THREE.MeshBasicMaterial({ color: '#2d2a3e' }));
  lead.position.y = 1.04;
  const ferrule = inked(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 6), toon('#c9c4d8'), 0.02);
  ferrule.position.y = -0.86;
  const eraser = inked(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 6), toon('#ff8fb0'), 0.02);
  eraser.position.y = -0.99;
  g.add(shaft, tip, lead, ferrule, eraser);
  g.rotation.set(0, 0.5, Math.PI / 2);
  return g;
}

/** Low-poly paper airplane: two triangles creased. */
function makePlane() {
  const geo = new THREE.BufferGeometry();
  const v = new Float32Array([
    0, 0, 0.8, -0.5, 0.05, -0.5, 0, -0.12, -0.45,
    0, 0, 0.8, 0, -0.12, -0.45, 0.5, 0.05, -0.5,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.computeVertexNormals();
  // Own material: toon() is cached per colour, and the mug shares this white.
  const mat = toon('#fffbef').clone();
  mat.side = THREE.DoubleSide;
  const m = new THREE.Mesh(geo, mat);
  // A zero-thickness sheet can't use an inverted-hull outline (it renders as
  // solid dark triangles from some angles), so draw its edges as lines.
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#2d2a3e' })));
  return m;
}

export function initHero(canvas, { onPoke, onEnter } = {}) {
  let crew = [];
  let props = [];
  let layout = { minX: -4, maxX: 4, shift: 0 };
  let dragging = null;
  let pointerDown = null;
  let lastPointerMove = 0;
  let lastScroll = -10;
  const pointerWorld = new THREE.Vector3(0, 1, 6);
  const history = [];
  let entered = false;

  const stage = new Stage(canvas, {
    fov: 30,
    onResize: (w, h) => {
      const cam = stage.camera;
      const wide = w / h > 1.25 && w > 900;
      const d = cam.position.length();
      const fullW = stage.viewWidthAt(d);
      const shiftFrac = wide ? 0.26 : 0;
      // filmOffset slides the view window without perspective skew, so the crew
      // sits right of the headline while still being seen straight on.
      // shift (near units) = near * offset / filmWidth; want shift = -f * frustum width.
      const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      cam.filmOffset = -shiftFrac * cam.aspect * 2 * tan * cam.getFilmWidth();
      cam.updateProjectionMatrix();
      const centre = shiftFrac * fullW; // world x that sits in the middle of the canvas
      const half = fullW / 2;
      layout = {
        minX: -half - centre + 0.9,
        maxX: half - centre - 0.9,
        anchor: 0,
        // crew spans ~40% of the canvas beside the headline (wide) or ~90% (stacked)
        spread: THREE.MathUtils.clamp(((wide ? 0.4 : 0.88) * fullW - 1.5) / 3, 0.95, 1.9),
        wide,
      };
      if (!entered) placeCrew();
      placeProps();
    },
    onFrame: (dt, t) => step(dt, t),
  });

  const { scene, camera } = stage;
  camera.position.set(0, 3.2, 17.5);
  camera.lookAt(0, 0.8, 0);
  paperLights(scene);

  // crew
  const order = ['polly', 'nyq', 'ozzy', 'cubert'];
  crew = order.map((id) => {
    const c = makers[id]();
    c.shadow = blobShadow(c.radius * 2.4);
    scene.add(c, c.shadow);
    c.wait = 0;
    return c;
  });

  // desk props behind the crew
  const mug = makeMug();
  const pencil = makePencil();
  const plane = makePlane();
  props = [mug, pencil, plane];
  const mugShadow = blobShadow(1.3, 0.18);
  const pencilShadow = blobShadow(1.8, 0.12);
  pencilShadow.scale.set(1.3, 0.35, 1);
  scene.add(mug, pencil, plane, mugShadow, pencilShadow);

  const _edge = new THREE.Vector3();
  /** True when a world-space point projects inside the canvas with some margin. */
  const onScreen = (x, y, z, margin = 0.04) => {
    camera.updateMatrixWorld();
    _edge.set(x, y, z).project(camera);
    return Math.abs(_edge.x) < 1 - margin && Math.abs(_edge.y) < 1 - margin;
  };

  function placeProps() {
    const s = layout.spread;
    // The mug sits right of Cubert. At some window sizes that's the canvas edge,
    // where only its dark outline would show (a black bar), so hide it unless
    // the whole mug fits.
    const mugX = s * 1.5 + 1.3;
    mug.position.set(mugX, 0, -0.7);
    mugShadow.position.set(mugX, 0.002, -0.7);
    pencil.position.set(-s * 1.6, 0.07, -1.4);
    pencilShadow.position.set(-s * 1.6, 0.002, -1.4);
    pencilShadow.rotation.z = 0.5;
    plane.position.set(-s * 1.1, 3.1, -2.6);
    mug.visible = mugShadow.visible = onScreen(mugX + 0.62, 0.7, -0.7) && onScreen(mugX + 0.62, 0, -0.7);
    plane.visible = onScreen(plane.position.x - 0.6, plane.position.y + 0.3, plane.position.z) && onScreen(plane.position.x + 0.6, plane.position.y, plane.position.z);
  }

  function placeCrew() {
    const s = layout.spread;
    const xs = [-1.5 * s, -0.5 * s, 0.5 * s, 1.5 * s];
    const zs = [0.25, -0.15, 0.3, -0.1];
    crew.forEach((c, i) => {
      c.position.set(xs[i], 7 + i * 0.6, zs[i]);
      c.home = new THREE.Vector3(xs[i], 0, zs[i]);
      c.vel.set(0, 0, 0);
      c.wait = stage.reduced ? 0 : 0.25 + i * 0.16;
      if (stage.reduced) c.position.y = c.height;
      c.rotation.y = (i - 1.5) * -0.12;
    });
  }

  function grounded(c) {
    return c.position.y <= c.height + 0.001 && Math.abs(c.vel.y) < 0.01;
  }

  function step(dt, t) {
    // pointer-driven gaze; everyone glances down while the page scrolls
    const idle = performance.now() - lastPointerMove > 3500;
    const scrolling = t - lastScroll < 0.8;
    for (const c of crew) {
      if (scrolling) c.lookTarget.set(c.position.x, -4, 8);
      else if (idle) c.lookTarget.copy(camera.position);
      else c.lookTarget.copy(pointerWorld);
    }

    const sub = 2;
    const h = dt / sub;
    for (let k = 0; k < sub; k++) {
      for (const c of crew) {
        if (c.wait > 0) {
          c.wait -= h;
          continue;
        }
        if (c === dragging) continue;
        c.vel.y += GRAVITY * h;
        c.position.addScaledVector(c.vel, h);
        // floor
        const floorY = FLOOR + c.height;
        if (c.position.y < floorY) {
          const impact = -c.vel.y;
          c.position.y = floorY;
          if (impact > 2.2) {
            c.boing(Math.min(0.55, impact * 0.045));
            c.vel.y = impact * 0.42;
            c.vel.x *= 0.82;
            c.vel.z *= 0.82;
            if (!entered && c === crew[crew.length - 1]) {
              entered = true;
              onEnter?.();
            }
          } else {
            c.vel.y = 0;
          }
        }
        if (grounded(c)) {
          // friction
          const f = Math.exp(-h * 6);
          c.vel.x *= f;
          c.vel.z *= f;
        }
        // walls
        if (c.position.x < layout.minX) {
          c.position.x = layout.minX;
          c.vel.x = Math.abs(c.vel.x) * 0.55;
          c.boing(0.15);
        } else if (c.position.x > layout.maxX) {
          c.position.x = layout.maxX;
          c.vel.x = -Math.abs(c.vel.x) * 0.55;
          c.boing(0.15);
        }
        if (c.position.z < -1.1) {
          c.position.z = -1.1;
          c.vel.z = Math.abs(c.vel.z) * 0.5;
        } else if (c.position.z > 1.6) {
          c.position.z = 1.6;
          c.vel.z = -Math.abs(c.vel.z) * 0.5;
        }
      }
      // gentle separation so they don't overlap
      for (let i = 0; i < crew.length; i++) {
        for (let j = i + 1; j < crew.length; j++) {
          const a = crew[i];
          const b = crew[j];
          const dx = b.position.x - a.position.x;
          const dz = b.position.z - a.position.z;
          const dy = b.position.y - a.position.y;
          const min = (a.radius + b.radius) * 0.92;
          const dist = Math.hypot(dx, dz, dy * 0.6);
          if (dist > 0 && dist < min) {
            const push = (min - dist) / dist / 2;
            if (a !== dragging) {
              a.position.x -= dx * push;
              a.position.z -= dz * push;
            }
            if (b !== dragging) {
              b.position.x += dx * push;
              b.position.z += dz * push;
            }
            const rel = (b.vel.x - a.vel.x) * dx + (b.vel.z - a.vel.z) * dz;
            if (rel < 0) {
              const imp = (rel / (dist * dist)) * 0.8;
              a.vel.x += dx * imp;
              a.vel.z += dz * imp;
              b.vel.x -= dx * imp;
              b.vel.z -= dz * imp;
            }
          }
        }
      }
    }

    for (const c of crew) {
      // spin while airborne, settle upright on the ground
      const air = c.position.y > c.height + 0.05 || c === dragging;
      if (air && c !== dragging) {
        c.rig.rotation.z += c.spin.z * dt;
        c.rig.rotation.x += c.spin.x * dt;
      } else {
        c.spin.multiplyScalar(Math.exp(-dt * 6));
        c.rig.rotation.z += (wrapAngle(0 - c.rig.rotation.z)) * (1 - Math.exp(-dt * 9));
        c.rig.rotation.x += (wrapAngle(0 - c.rig.rotation.x)) * (1 - Math.exp(-dt * 9));
      }
      if (c === dragging) {
        const sway = THREE.MathUtils.clamp(-c.vel.x * 0.05, -0.5, 0.5);
        c.rig.rotation.z += (sway - c.rig.rotation.z) * (1 - Math.exp(-dt * 10));
      }
      // turn slightly toward the middle of the screen
      const faceY = THREE.MathUtils.clamp(-c.position.x * 0.06, -0.35, 0.35);
      c.rotation.y += (faceY - c.rotation.y) * (1 - Math.exp(-dt * 3));
      c.update(dt, stage.reduced ? 0 : t);

      // smudge shadow
      const lift = Math.max(0, c.position.y - c.height);
      c.shadow.position.set(c.position.x, 0.002, c.position.z);
      const s = 1 / (1 + lift * 0.35);
      c.shadow.scale.setScalar(s);
      c.shadow.material.opacity = 0.24 * s;
      c.shadow.visible = c.wait <= 0 || c.position.y < 5;
    }

    if (!stage.reduced) {
      plane.position.y = 3.1 + Math.sin(t * 1.3) * 0.18;
      plane.rotation.set(0.35 + Math.sin(t * 1.1) * 0.12, 0.6 + Math.sin(t * 0.4) * 0.5, Math.sin(t * 0.9) * 0.25);
    }

    if (dragging) {
      history.push({ p: dragging.position.clone(), t: performance.now() });
      while (history.length > 6) history.shift();
    }
  }

  const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function pick(e) {
    stage.ndc(e, _ndc);
    _ray.setFromCamera(_ndc, camera);
    const hits = _ray.intersectObjects(
      crew.map((c) => c.proxy),
      false,
    );
    return hits[0]?.object.userData.character ?? null;
  }

  function updatePointerWorld(e) {
    stage.ndc(e, _ndc);
    _ray.setFromCamera(_ndc, camera);
    _plane.set(new THREE.Vector3(0, 0, 1), -2);
    if (_ray.ray.intersectPlane(_plane, _hit)) pointerWorld.copy(_hit);
  }

  canvas.addEventListener('pointermove', (e) => {
    lastPointerMove = performance.now();
    updatePointerWorld(e);
    if (dragging) {
      stage.ndc(e, _ndc);
      _ray.setFromCamera(_ndc, camera);
      if (_ray.ray.intersectPlane(_plane.setFromNormalAndCoplanarPoint(_tmp.set(0, 0, 1), dragging.dragOrigin), _hit)) {
        const target = _hit.add(dragging.grabOffset);
        target.y = Math.max(dragging.height, target.y);
        target.x = THREE.MathUtils.clamp(target.x, layout.minX, layout.maxX);
        const prev = dragging.position.clone();
        dragging.position.lerp(target, 0.6);
        dragging.vel.subVectors(dragging.position, prev).multiplyScalar(60);
      }
      if (pointerDown && Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 6) pointerDown.moved = true;
      return;
    }
    const over = pick(e);
    canvas.style.cursor = over ? 'grab' : '';
  });

  // Mouse listens on window so the crew also notices the cursor over the headline
  addEventListener(
    'pointermove',
    (e) => {
      if (e.target === canvas || !stage.visible) return;
      lastPointerMove = performance.now();
      updatePointerWorld(e);
    },
    { passive: true },
  );
  addEventListener('scroll', () => (lastScroll = stage.timer.getElapsed()), { passive: true });

  canvas.addEventListener('pointerdown', (e) => {
    const c = pick(e);
    if (!c) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    dragging = c;
    c.wait = 0;
    pointerDown = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, c };
    c.dragOrigin = c.position.clone();
    stage.ndc(e, _ndc);
    _ray.setFromCamera(_ndc, camera);
    _plane.setFromNormalAndCoplanarPoint(_tmp.set(0, 0, 1), c.dragOrigin);
    _ray.ray.intersectPlane(_plane, _hit);
    c.grabOffset = c.position.clone().sub(_hit);
    c.grabOffset.y += 0.25;
    c.vel.set(0, 0, 0);
    c.mood = 'wow';
    c.boing(-0.25);
    history.length = 0;
    canvas.style.cursor = 'grabbing';
  });

  const release = (e) => {
    if (!dragging) return;
    const c = dragging;
    dragging = null;
    canvas.style.cursor = '';
    c.mood = 'happy';
    const quick = pointerDown && !pointerDown.moved && performance.now() - pointerDown.t < 350;
    if (quick) {
      poke(c);
    } else if (history.length > 1) {
      const a = history[0];
      const b = history[history.length - 1];
      const secs = Math.max(0.016, (b.t - a.t) / 1000);
      c.vel.subVectors(b.p, a.p).divideScalar(secs);
      c.vel.clampLength(0, 16);
      c.vel.z = 0;
      c.spin.set(c.vel.y * 0.3, 0, -c.vel.x * 0.8);
    }
    pointerDown = null;
    if (e?.pointerId != null && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  const pokes = new Map();
  function poke(c) {
    c.vel.y = 7;
    c.vel.x += (Math.random() - 0.5) * 1.5;
    c.spin.z = (Math.random() > 0.5 ? 1 : -1) * Math.PI * 2 * 1.6;
    c.boing(0.45);
    c.mood = 'wow';
    setTimeout(() => (c.mood = 'happy'), 700);
    const now = performance.now();
    const recent = (pokes.get(c) ?? []).filter((x) => now - x < 2500);
    recent.push(now);
    pokes.set(c, recent);
    if (c.kind === 'polly') c.instability = Math.min(1, c.instability + 0.22);
    const head = c.position.clone();
    head.y += c.radius + 0.4;
    onPoke?.(c, stage.toScreen(head), recent.length);
  }

  /** Keyboard / button access: poke a character by id. */
  function pokeById(id) {
    const c = crew.find((x) => x.kind === id);
    if (c) {
      c.wait = 0;
      poke(c);
    }
  }

  /** Throw everyone in the air (used by the "shake" button). */
  function scatter() {
    crew.forEach((c, i) => {
      c.wait = 0;
      c.vel.set((Math.random() - 0.5) * 8, 8 + Math.random() * 4, 0);
      c.spin.set(0, 0, (i % 2 ? 1 : -1) * 8);
    });
  }

  return { stage, pokeById, scatter, crew };
}
