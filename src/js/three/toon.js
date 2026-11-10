// Doodle look for three.js: 3-step toon shading on flat-shaded low-poly meshes,
// plus inverted-hull ink outlines whose thickness "boils" at ~6fps like a
// hand-redrawn animation frame.

import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const INK = new THREE.Color('#2d2a3e');

// Shared uniform so every outline boils in sync.
export const boil = { uTime: { value: 0 }, uBoil: { value: 1 } };

let gradient;
function gradientMap() {
  if (gradient) return gradient;
  // dark / mid / light bands — warm shadow, never grey
  const data = new Uint8Array([120, 165, 255]);
  gradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

const materialCache = new Map();
/** Flat-shaded toon material, cached per colour. */
export function toon(color, { emissive = 0x000000, opacity = 1 } = {}) {
  const key = `${color}-${emissive}-${opacity}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    emissive,
    gradientMap: gradientMap(),
    transparent: opacity < 1,
    opacity,
  });
  m.flatShading = true;
  materialCache.set(key, m);
  return m;
}

const outlineMaterials = new Map();
function outlineMaterial(thickness) {
  if (outlineMaterials.has(thickness)) return outlineMaterials.get(thickness);
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = boil.uTime;
    shader.uniforms.uBoil = boil.uBoil;
    shader.uniforms.uThickness = { value: thickness };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         uniform float uBoil;
         uniform float uThickness;
         float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float frame = floor(uTime * 6.0);
         float wob = (h31(position * 7.0 + frame) - 0.5) * 0.55 * uBoil;
         // MeshBasicMaterial never declares objectNormal; read the attribute directly
         transformed += normalize(normal) * uThickness * (1.0 + wob);`,
      );
  };
  // distinct program per thickness
  m.customProgramCacheKey = () => `outline-${thickness}`;
  outlineMaterials.set(thickness, m);
  return m;
}

const smoothCache = new WeakMap();
/** Smooth-normal copy so the hull doesn't crack along flat-shaded hard edges. */
function smoothed(geometry) {
  if (smoothCache.has(geometry)) return smoothCache.get(geometry);
  const g = geometry.clone();
  for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
  const merged = mergeVertices(g, 1e-3);
  merged.computeVertexNormals();
  smoothCache.set(geometry, merged);
  return merged;
}

/** Mesh + ink outline as one Group-like Mesh (outline is a child). */
export function inked(geometry, material, thickness = 0.035) {
  const mesh = new THREE.Mesh(geometry, material);
  const hull = new THREE.Mesh(smoothed(geometry), outlineMaterial(thickness));
  hull.raycast = () => {};
  hull.renderOrder = -1;
  mesh.add(hull);
  mesh.castShadow = false;
  return mesh;
}

let blobTex;
/** Soft pencil-smudge contact shadow — cheaper and softer than shadow maps. */
export function blobShadow(size = 1.4, opacity = 0.22) {
  if (!blobTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(45,42,62,1)');
    g.addColorStop(0.55, 'rgba(45,42,62,.45)');
    g.addColorStop(1, 'rgba(45,42,62,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(c);
    blobTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -2;
  return m;
}

/** Lighting rig tuned for warm paper: soft sky/ground fill + one key. */
export function paperLights(scene) {
  const hemi = new THREE.HemisphereLight('#fffaf0', '#e9d9b0', 2.2);
  const key = new THREE.DirectionalLight('#fff6e0', 2.2);
  key.position.set(3, 6, 5);
  scene.add(hemi, key);
  return { hemi, key };
}
