// Inverted pendulum on a cart. You are the controller (pointer / arrow keys),
// or hand it to Nyq's state-feedback controller and try to knock it over.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Stage } from './stage.js';
import { makeOzzy } from './characters.js';
import { blobShadow, inked, paperLights, toon } from './toon.js';

const G = 9.8;
const L = 1.6; // pivot → bob
const DAMP = 0.15;
const FALL = 1.15; // rad, past this nobody recovers
const K = [40, 10, 2, 3.5]; // u = K·[θ, θ̇, x, ẋ] — tuned offline, stable from |θ| ≤ 0.65
const DIST = 7.4; // camera distance; pointer mapping uses the same plane

export function initCartPole(canvas, { onState, onSample } = {}) {
  const s = {
    x: 0,
    v: 0,
    th: 0.04,
    thd: 0,
    a: 0,
    target: 0,
    mode: 'you', // 'you' | 'nyq'
    phase: 'ready', // 'ready' | 'playing' | 'fallen'
    time: 0,
    keys: { left: false, right: false },
    xmax: 2.6,
  };

  const stage = new Stage(canvas, {
    fov: 32,
    onResize: () => {
      const w = stage.viewWidthAt(DIST);
      s.xmax = Math.min(2.8, w / 2 - 0.9);
      buildTrack();
    },
    onFrame: (dt) => step(dt),
  });
  const { scene, camera } = stage;
  camera.position.set(0, 2.1, DIST);
  camera.lookAt(0, 1.2, 0);
  paperLights(scene);

  // track
  const track = new THREE.Group();
  scene.add(track);
  function buildTrack() {
    track.clear();
    const len = s.xmax * 2 + 1.1;
    const rail = inked(new THREE.BoxGeometry(len, 0.08, 0.5), toon('#c9c4d8'), 0.025);
    rail.position.y = 0.04;
    track.add(rail);
    for (const side of [-1, 1]) {
      const stop = inked(new RoundedBoxGeometry(0.22, 0.5, 0.6, 1, 0.05), toon('#ff5d8f'), 0.025);
      stop.position.set(side * (len / 2 - 0.11), 0.25, 0);
      track.add(stop);
    }
    // tick marks every 0.5 like a ruler
    const tickGeo = new THREE.BoxGeometry(0.025, 0.012, 0.18);
    const tickMat = new THREE.MeshBasicMaterial({ color: '#2d2a3e' });
    for (let x = -s.xmax; x <= s.xmax + 1e-6; x += 0.5) {
      const t = new THREE.Mesh(tickGeo, tickMat);
      t.position.set(x, 0.086, 0.16);
      t.scale.z = Math.abs(x % 1) < 1e-6 ? 1.6 : 1;
      track.add(t);
    }
    const sh = blobShadow(1, 0.12);
    sh.scale.set(len * 1.05, 1.2, 1);
    sh.position.y = 0.001;
    track.add(sh);
  }

  // cart
  const cart = new THREE.Group();
  const chassis = inked(new RoundedBoxGeometry(0.95, 0.38, 0.62, 1, 0.07), toon('#3e8bff'), 0.03);
  chassis.position.y = 0.36;
  cart.add(chassis);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.07, 0.625), toon('#fffbef'));
  stripe.position.y = 0.4;
  cart.add(stripe);
  const wheels = [];
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.33, 0.33]) {
      const w = inked(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 7), toon('#2d2a3e'), 0.015);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.15, z);
      cart.add(w);
      wheels.push(w);
    }
  }
  const pivot = new THREE.Group();
  pivot.position.y = 0.6;
  cart.add(pivot);
  const hub = inked(new THREE.IcosahedronGeometry(0.09, 0), toon('#ffc234'), 0.02);
  pivot.add(hub);
  const rod = inked(new THREE.CylinderGeometry(0.035, 0.035, L, 6), toon('#ffc234'), 0.02);
  rod.position.y = L / 2;
  pivot.add(rod);
  const rider = makeOzzy();
  rider.scale.setScalar(0.6);
  rider.position.y = L + 0.26;
  pivot.add(rider);
  const cartShadow = blobShadow(1.5, 0.2);
  cartShadow.scale.y = 0.6;
  scene.add(cart, cartShadow);

  // input
  function aimAt(e) {
    const r = canvas.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const w = stage.viewWidthAt(DIST);
    s.target = THREE.MathUtils.clamp((fx - 0.5) * w, -s.xmax, s.xmax);
    if (s.phase === 'ready' && Math.abs(s.target - s.x) > 0.05) start();
  }
  canvas.addEventListener('pointermove', (e) => {
    // mice steer by hovering; touch steers while the finger is down
    if (s.mode !== 'you' || (e.pointerType === 'touch' && !e.buttons)) return;
    aimAt(e);
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (s.mode === 'nyq') {
      // poke the rider to disturb the controller
      nudge(e.clientX < canvas.getBoundingClientRect().left + canvas.clientWidth / 2 ? 1 : -1);
    } else if (e.pointerType === 'touch') {
      aimAt(e);
    }
  });

  function onKey(e, down) {
    if (!stage.visible) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') s.keys.left = down;
    else if (e.key === 'ArrowRight' || e.key === 'd') s.keys.right = down;
    else return;
    if (document.activeElement === canvas || canvas.matches(':hover') || canvas.closest('section')?.contains(document.activeElement)) {
      e.preventDefault();
    }
    if (down && s.phase === 'ready' && s.mode === 'you') start();
  }
  canvas.addEventListener('keydown', (e) => onKey(e, true));
  canvas.addEventListener('keyup', (e) => onKey(e, false));

  function start() {
    s.phase = 'playing';
    s.time = 0;
    emit();
  }

  function reset() {
    s.x = 0;
    s.v = 0;
    s.th = (Math.random() > 0.5 ? 1 : -1) * (0.03 + Math.random() * 0.03);
    s.thd = 0;
    s.target = 0;
    s.time = 0;
    s.phase = s.mode === 'nyq' ? 'playing' : 'ready';
    rider.mood = 'happy';
    emit();
  }

  function nudge(dir = 1) {
    s.thd += dir * (1.4 + Math.random() * 0.6);
    rider.mood = 'wow';
    rider.boing(0.3);
    setTimeout(() => s.phase !== 'fallen' && (rider.mood = 'happy'), 600);
    if (s.phase === 'ready') start();
  }

  function setMode(mode) {
    s.mode = mode;
    reset();
  }

  function emit() {
    onState?.({ phase: s.phase, mode: s.mode, time: s.time });
  }

  let sampleAcc = 0;
  function physics(h) {
    let a;
    if (s.phase === 'fallen') {
      a = -6 * s.v; // cart rolls to a stop
    } else if (s.mode === 'nyq') {
      a = K[0] * s.th + K[1] * s.thd + K[2] * s.x + K[3] * s.v;
    } else {
      if (s.keys.left) s.target = Math.max(-s.xmax, s.target - 3.2 * h);
      if (s.keys.right) s.target = Math.min(s.xmax, s.target + 3.2 * h);
      a = 90 * (s.target - s.x) - 17 * s.v;
    }
    a = THREE.MathUtils.clamp(a, -28, 28);
    s.a = a;
    if (s.phase === 'ready') {
      // hold the pole up until the player moves
      s.th *= 0.98;
      s.thd = 0;
    } else {
      const thdd = (G * Math.sin(s.th) - a * Math.cos(s.th)) / L - DAMP * s.thd;
      s.thd += thdd * h;
      s.th += s.thd * h;
    }
    s.v += a * h;
    s.x += s.v * h;
    if (Math.abs(s.x) > s.xmax) {
      s.x = Math.sign(s.x) * s.xmax;
      // slamming into the stop kicks the pendulum
      s.thd += s.v * 0.6 / L;
      s.v = -s.v * 0.3;
      cart.userData.bump = 1;
    }
    if (s.phase === 'playing' && Math.abs(s.th) > FALL) {
      s.phase = 'fallen';
      rider.mood = 'sad';
      emit();
    }
    if (s.phase === 'fallen' && Math.abs(s.th) > Math.PI / 2 - 0.08) {
      s.th = Math.sign(s.th) * (Math.PI / 2 - 0.08);
      s.thd = -s.thd * 0.25;
    }
  }

  function step(dt) {
    const scale = s.mode === 'you' ? 0.8 : 1; // a little slow-mo for humans
    const n = 4;
    const h = (dt * scale) / n;
    for (let i = 0; i < n; i++) physics(h);
    if (s.phase === 'playing') {
      s.time += dt;
      sampleAcc += dt;
      if (sampleAcc > 1 / 30) {
        sampleAcc = 0;
        onSample?.(s.th, s.x / s.xmax);
      }
    }

    cart.position.x = s.x;
    pivot.rotation.z = -s.th;
    for (const w of wheels) w.rotation.y -= (s.v * dt) / 0.13;
    rider.rotation.z = 0;
    rider.lookTarget.set(s.x + s.v * 0.5, 0, 6);
    if (s.phase !== 'fallen' && Math.abs(s.th) > 0.4) rider.mood = 'wow';
    else if (s.phase !== 'fallen' && rider.mood === 'wow' && Math.abs(s.th) < 0.2) rider.mood = 'happy';
    rider.update(dt, 0);
    cartShadow.position.set(s.x, 0.003, 0);
    chassis.rotation.z = THREE.MathUtils.clamp(-s.a * 0.004, -0.08, 0.08);
  }

  reset();
  return { stage, reset, setMode, nudge, state: s };
}
