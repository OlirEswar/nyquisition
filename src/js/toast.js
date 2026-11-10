import { crew } from './crew.js';
import { prefersReducedMotion } from './store.js';

let host;

function ensureHost() {
  if (host) return host;
  host = document.createElement('div');
  host.className = 'toasts';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  document.body.append(host);
  return host;
}

/**
 * toast({ title, body, who: 'nyq' | 'polly' | 'ozzy' | 'cubert', mood, ms })
 */
export function toast({ title, body = '', who = 'nyq', mood = 'happy', ms = 4200 }) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${crew[who]({ mood, label: '' })}<div><strong></strong><p></p></div>`;
  el.querySelector('svg').setAttribute('aria-hidden', 'true');
  el.querySelector('strong').textContent = title;
  el.querySelector('p').textContent = body;
  if (!body) el.querySelector('p').remove();
  const host = ensureHost();
  host.append(el);
  // keep the stack short so it never runs off the screen
  while (host.children.length > 3) host.firstElementChild.remove();
  const leave = () => {
    el.dataset.leaving = '';
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  };
  setTimeout(leave, ms);
  el.addEventListener('click', leave);
  return el;
}

const CONFETTI = ['#2fbf71', '#ff5d8f', '#3e8bff', '#ffc234', '#ff8a1e'];
const SHAPES = ['50%', '0', 'tri', '4px'];

/** Burst of little paper shapes from a point (defaults to screen centre). */
export function confetti(x = innerWidth / 2, y = innerHeight / 2, count = 36) {
  if (prefersReducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    const shape = SHAPES[i % SHAPES.length];
    p.style.background = CONFETTI[i % CONFETTI.length];
    if (shape === 'tri') {
      p.style.clipPath = 'polygon(50% 0, 100% 100%, 0 100%)';
      p.style.border = '0';
    } else p.style.borderRadius = shape;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    document.body.append(p);
    const angle = Math.random() * Math.PI * 2;
    const speed = 180 + Math.random() * 320;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - 260;
    p.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 420}px)) rotate(${(Math.random() - 0.5) * 900}deg) scale(.7)`,
          opacity: 0,
        },
      ],
      { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' },
    ).onfinish = () => p.remove();
  }
}
