// Duolingo-style course path. The pencil line draws itself as you scroll.

import { crew } from './crew.js';
import { prefersReducedMotion } from './store.js';

export const TRACKS = {
  control: {
    name: 'Control theory',
    who: 'nyq',
    color: 'var(--nyq)',
    units: [
      { title: 'Signals and systems warm-up', lessons: 8, topics: ['LTI systems', 'Impulse response', 'Convolution by picture'] },
      { title: 'The Laplace transform', lessons: 12, topics: ['Transform pairs', 'Partial fractions', 'Initial and final value theorems'] },
      { title: 'Transfer functions and poles', lessons: 10, topics: ['Block diagrams', 'Poles and zeros', 'First- and second-order responses'] },
      { title: 'Feedback and stability', lessons: 14, topics: ['Closed-loop gain', 'Routh–Hurwitz', 'Steady-state error'] },
      { title: 'Root locus', lessons: 11, topics: ['Sketching rules', 'Breakaway points', 'Designing with the locus'] },
      { title: 'Frequency response', lessons: 15, topics: ['Bode plots', 'The Nyquist criterion', 'Gain and phase margin'] },
      { title: 'PID and compensators', lessons: 12, topics: ['P, PI, PID by feel', 'Lead–lag design', 'Tuning without a model'] },
      { title: 'State space', lessons: 16, topics: ['State equations', 'Controllability', 'Pole placement and LQR'] },
    ],
  },
  em: {
    name: 'Electromagnetics',
    who: 'ozzy',
    color: 'var(--ozzy)',
    units: [
      { title: 'Vector calculus you actually need', lessons: 10, topics: ['Gradient, divergence, curl', 'Line and surface integrals', 'Stokes and divergence theorems'] },
      { title: 'Electrostatics', lessons: 12, topics: ["Coulomb's law", 'Electric field lines', 'Superposition'] },
      { title: "Gauss's law", lessons: 9, topics: ['Flux', 'Choosing Gaussian surfaces', 'Conductors'] },
      { title: 'Potential and capacitance', lessons: 11, topics: ['Voltage as a landscape', "Laplace's equation", 'Capacitors in fields'] },
      { title: 'Magnetostatics', lessons: 12, topics: ['Biot–Savart', "Ampère's law", 'Vector potential'] },
      { title: 'Induction', lessons: 10, topics: ["Faraday's law", "Lenz's law", 'Inductance'] },
      { title: "Maxwell's equations", lessons: 13, topics: ['Displacement current', 'The full set', 'Boundary conditions'] },
      { title: 'Waves and transmission lines', lessons: 15, topics: ['Plane waves', 'Impedance and reflection', 'The Smith chart'] },
    ],
  },
  signals: {
    name: 'Signals & systems',
    who: 'polly',
    color: 'var(--polly)',
    units: [
      { title: 'Signals as functions', lessons: 7, topics: ['Even and odd', 'Unit step and impulse', 'Time shifting and scaling'] },
      { title: 'Convolution', lessons: 10, topics: ['Flip and slide', 'Graphical convolution', 'Discrete convolution'] },
      { title: 'Fourier series', lessons: 11, topics: ['Harmonics', 'Gibbs phenomenon', 'Parseval'] },
      { title: 'Fourier transform', lessons: 13, topics: ['Transform pairs', 'Duality', 'Modulation'] },
      { title: 'Sampling', lessons: 9, topics: ['The Nyquist rate', 'Aliasing', 'Reconstruction'] },
      { title: 'The z-transform', lessons: 12, topics: ['Region of convergence', 'Difference equations', 'Digital filters'] },
    ],
  },
  circuits: {
    name: 'Circuits',
    who: 'cubert',
    color: 'var(--cubert)',
    units: [
      { title: 'Circuit laws, properly', lessons: 8, topics: ['KCL and KVL', 'Nodal analysis', 'Mesh analysis'] },
      { title: 'Thévenin and friends', lessons: 9, topics: ['Thévenin and Norton', 'Superposition', 'Maximum power transfer'] },
      { title: 'Op-amps', lessons: 11, topics: ['The golden rules', 'Inverting and non-inverting', 'Integrators'] },
      { title: 'First-order transients', lessons: 10, topics: ['RC and RL', 'Time constants', 'Switching'] },
      { title: 'Second-order circuits', lessons: 12, topics: ['RLC responses', 'Damping', 'Resonance'] },
      { title: 'AC and phasors', lessons: 13, topics: ['Phasors', 'Impedance', 'Power factor'] },
      { title: 'Filters', lessons: 12, topics: ['Bode for circuits', 'Active filters', 'Butterworth by hand'] },
    ],
  },
};

const lockIcon =
  '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#c9c4d8" stroke="#2d2a3e" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#2d2a3e" stroke-width="2"/></svg>';
const checkIcon =
  '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const starIcon =
  '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="#fff" stroke="#2d2a3e" stroke-width="1.8" stroke-linejoin="round"/></svg>';

export function initCourses(root) {
  const tabs = root.querySelectorAll('[data-track-tab]');
  const pathEl = root.querySelector('[data-path]');
  const detail = root.querySelector('[data-unit-detail]');
  let track = 'control';
  let selected = 1;
  let drawProgress = prefersReducedMotion() ? 1 : 0;

  function nodePos(k, n) {
    // gentle S-curve like a winding trail
    const x = 50 + Math.sin(k * 1.05) * 30;
    const y = 70 + k * 120;
    return { x, y, h: 70 + n * 120 };
  }

  function renderPath() {
    const t = TRACKS[track];
    const n = t.units.length;
    const pts = t.units.map((_, k) => nodePos(k, n));
    const height = pts[0].h;
    const W = Math.max(200, pathEl.clientWidth);
    const px = (x) => (x / 100) * W;
    let d = `M ${px(pts[0].x)} ${pts[0].y}`;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      const my = (a.y + b.y) / 2;
      d += ` C ${px(a.x)} ${my}, ${px(b.x)} ${my}, ${px(b.x)} ${b.y}`;
    }
    pathEl.style.height = `${height}px`;
    pathEl.innerHTML = `
      <svg class="path__line" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" aria-hidden="true">
        <path d="${d}" class="path__ghost"/>
        <path d="${d}" class="path__ink"/>
      </svg>
      <ol class="path__nodes" aria-label="${t.name} units">
        ${t.units
          .map((u, k) => {
            const p = pts[k];
            const status = k === 0 ? 'done' : k === 1 ? 'current' : 'locked';
            return `<li style="left:${p.x}%;top:${p.y}px">
              <button type="button" class="node node--${status}" data-unit="${k}" aria-pressed="${k === selected}" style="--track:${t.color}">
                ${status === 'done' ? checkIcon : status === 'current' ? starIcon : lockIcon}
                <span class="visually-hidden">Unit ${k + 1}: ${u.title}${status === 'locked' ? ' (locked)' : status === 'done' ? ' (complete)' : ' (up next)'}</span>
              </button>
              ${status === 'current' ? '<span class="node__start hand" aria-hidden="true">start here</span>' : ''}
              <span class="node__title" aria-hidden="true">${u.title}</span>
            </li>`;
          })
          .join('')}
      </ol>
      <div class="path__mascot" aria-hidden="true">${crew[t.who]({ label: '' })}</div>`;
    const ink = pathEl.querySelector('.path__ink');
    const len = ink.getTotalLength();
    ink.style.strokeDasharray = `${len}`;
    ink.dataset.len = len;
    applyDraw();
    pathEl.querySelectorAll('[data-unit]').forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.unit))));
    renderDetail();
  }

  function applyDraw() {
    const ink = pathEl.querySelector('.path__ink');
    if (!ink) return;
    const len = Number(ink.dataset.len);
    ink.style.strokeDashoffset = `${len * (1 - drawProgress)}`;
    // mascot rides the tip of the line
    const pt = ink.getPointAtLength(len * drawProgress);
    const mascot = pathEl.querySelector('.path__mascot');
    if (mascot) mascot.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -110%)`;
    pathEl.querySelectorAll('.node').forEach((n, k) => {
      const reached = drawProgress * (TRACKS[track].units.length - 1) >= k - 0.15;
      n.classList.toggle('is-reached', reached);
    });
  }

  function renderDetail() {
    const t = TRACKS[track];
    const u = t.units[selected];
    const status = selected === 0 ? 'Complete' : selected === 1 ? 'Up next' : 'Unlocks after unit ' + selected;
    detail.innerHTML = `
      <div class="unit-card sheet" style="--track:${t.color}">
        <div class="unit-card__head">
          <div class="unit-card__who">${crew[t.who]({ label: '' })}</div>
          <div>
            <p class="unit-card__meta">Unit ${selected + 1} of ${t.units.length}, ${u.lessons} lessons</p>
            <h3>${u.title}</h3>
          </div>
        </div>
        <ul class="unit-card__topics">${u.topics.map((x) => `<li>${x}</li>`).join('')}</ul>
        <div class="unit-card__foot">
          <span class="tag ${selected === 0 ? 'tag--nyq' : selected === 1 ? 'tag--ozzy' : 'tag--cubert'}">${status}</span>
          <button class="btn btn--sm" type="button" data-signup data-track="${track}">${selected <= 1 ? 'Start this unit' : 'Unlock the path'}</button>
        </div>
      </div>`;
  }

  function select(k) {
    selected = k;
    pathEl.querySelectorAll('[data-unit]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.unit) === k)));
    renderDetail();
  }

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      track = tab.dataset.trackTab;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      selected = 1;
      renderPath();
    }),
  );
  root.addEventListener('keydown', (e) => {
    const list = [...tabs];
    const idx = list.indexOf(document.activeElement);
    if (idx < 0) return;
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    const next = list[(idx + dir + list.length) % list.length];
    next.focus();
    next.click();
  });

  renderPath();
  let lastW = pathEl.clientWidth;
  new ResizeObserver(() => {
    if (Math.abs(pathEl.clientWidth - lastW) < 2) return;
    lastW = pathEl.clientWidth;
    renderPath();
  }).observe(pathEl);

  return {
    setProgress(p) {
      drawProgress = p;
      applyDraw();
    },
  };
}
