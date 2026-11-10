// A WebGL canvas that sizes itself to its CSS box, only renders while visible,
// and degrades to a static fallback when WebGL is unavailable.

import * as THREE from 'three';
import { boil } from './toon.js';
import { prefersReducedMotion } from '../store.js';

export { hasWebGL } from '../store.js';

export class Stage {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ fov?: number, onFrame?: (dt:number, t:number) => void, onResize?: (w:number,h:number) => void }} opts
   */
  constructor(canvas, { fov = 30, onFrame, onResize } = {}) {
    this.canvas = canvas;
    this.onFrame = onFrame;
    this.onResize = onResize;
    this.reduced = prefersReducedMotion();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.visible = false;
    this.width = 1;
    this.height = 1;

    // Callbacks reference the caller's `const stage = new Stage(...)`, so nothing
    // may call them synchronously from this constructor — defer to a microtask.
    this.ro = new ResizeObserver(() => this.resize());
    this.io = new IntersectionObserver(([e]) => this.setVisible(e.isIntersecting), { rootMargin: '120px' });
    queueMicrotask(() => {
      this.resize();
      this.ro.observe(canvas);
      this.io.observe(canvas);
    });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize?.(w, h);
    // Resizing clears the drawing buffer; repaint now rather than waiting a frame
    // so window-resize animations never flash an empty canvas.
    this.renderOnce();
  }

  /** Width of the view frustum at distance `d` from the camera. */
  viewWidthAt(d) {
    return 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * d * this.camera.aspect;
  }

  setVisible(v) {
    this.visible = v;
    if (v) {
      this.timer.reset();
      this.renderer.setAnimationLoop((ts) => this.frame(ts));
    } else {
      this.renderer.setAnimationLoop(null);
    }
  }

  frame(ts) {
    this.timer.update(ts);
    const dt = Math.min(this.timer.getDelta(), 1 / 20);
    const t = this.timer.getElapsed();
    boil.uTime.value = this.reduced ? 0 : t;
    this.onFrame?.(dt, t);
    this.renderer.render(this.scene, this.camera);
  }

  renderOnce() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Pointer position in NDC relative to this canvas. */
  ndc(e, out = new THREE.Vector2()) {
    const r = this.canvas.getBoundingClientRect();
    out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return out;
  }

  /** Project a world point to CSS pixels inside the canvas. */
  toScreen(v3) {
    const p = v3.clone().project(this.camera);
    return { x: ((p.x + 1) / 2) * this.width, y: ((1 - p.y) / 2) * this.height };
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.io.disconnect();
    this.renderer.dispose();
  }
}
