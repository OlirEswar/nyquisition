// Shared page chrome: header, mobile menu, footer, paper margin, doodle line-boil,
// smooth scroll, newsletter forms. Every page entry calls `initChrome()`.

import Lenis from 'lenis';
import { nyq } from './crew.js';
import { openSignup, refreshSignupButtons } from './signup.js';
import { toast } from './toast.js';
import { fakeRequest, get, isEmail, prefersReducedMotion, set } from './store.js';

const NAV = [
  { href: '/#courses', label: 'Courses' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog.html', label: 'Blog', match: ['blog', 'post'] },
  { href: '/careers.html', label: 'Careers', match: ['careers', 'job'] },
];

const icon = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5c6-1 12 .8 18-.4M3 12.2c6 .6 12-.8 18 .2M3 17.8c6-.9 12 .7 18-.3" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 5.5l13.5 13M18.5 5L5.5 18.6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
  pencil:
    '<svg viewBox="0 0 20 60" aria-hidden="true"><path d="M4 2h12v42l-6 12-6-12z" fill="#ffc234" stroke="#2d2a3e" stroke-width="2" stroke-linejoin="round"/><path d="M4 44h12l-6 12z" fill="#f3d7a6" stroke="#2d2a3e" stroke-width="2" stroke-linejoin="round"/><path d="M8 52l2 4 2-4z" fill="#2d2a3e"/><path d="M4 2h12v6H4z" fill="#ff8fb0" stroke="#2d2a3e" stroke-width="2"/></svg>',
  yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1.2" fill="currentColor"/></svg>',
  tk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.6 2.6 2.4 4.2 5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

function pageKey() {
  const file = location.pathname.split('/').pop() || 'index.html';
  return file.replace('.html', '') || 'index';
}

function headerHTML(current) {
  const links = NAV.map((l) => {
    const isCurrent = l.match?.includes(current);
    return `<a href="${l.href}"${isCurrent ? ' aria-current="page"' : ''}>${l.label}</a>`;
  }).join('');
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" data-header>
    <div class="wrap site-header__inner">
      <a class="brand" href="/" aria-label="Nyquisition home">${nyq({ label: '' })}<span>nyquisition</span></a>
      <nav class="nav" aria-label="Main">${links}</nav>
      <div class="header-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-login>Log in</button>
        <button class="btn btn--sm" type="button" data-signup>Get started</button>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-open>
          ${icon.menu}<span class="visually-hidden">Open menu</span>
        </button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" inert>
    <div class="mobile-menu__top">
      <a class="brand" href="/">${nyq({ label: '' })}<span>nyquisition</span></a>
      <button class="dialog__close" type="button" data-menu-close>${icon.close}<span class="visually-hidden">Close menu</span></button>
    </div>
    <nav aria-label="Mobile">${links}</nav>
    <div class="mobile-menu__actions">
      <button class="btn btn--block" type="button" data-signup>Get started</button>
      <button class="btn btn--ghost btn--block" type="button" data-login>Log in</button>
    </div>
  </div>
  <div class="pad-margin" aria-hidden="true"><div class="pad-margin__trace"></div><div class="pad-margin__pencil">${icon.pencil}</div></div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    ${[0, 1, 2]
      .map(
        (i) => `<filter id="boil-${i}" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${i * 7 + 3}"/>
        <feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>`,
      )
      .join('')}
  </svg>`;
}

function footerHTML() {
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/">${nyq({ label: '' })}<span>nyquisition</span></a>
          <p>Daily engineering lessons that adapt to what you are about to forget. Made in Pittsburgh and on lots of graph paper.</p>
          <form class="footer-news inline-form" data-newsletter novalidate>
            <label class="visually-hidden" for="footer-email">Email for the monthly letter</label>
            <input class="input" id="footer-email" name="email" type="email" placeholder="you@school.edu" autocomplete="email" required />
            <button class="btn btn--yellow" type="submit">Subscribe</button>
          </form>
        </div>
        <div>
          <h3>Learn</h3>
          <ul>
            <li><a href="/#courses">Control theory</a></li>
            <li><a href="/#courses">Electromagnetics</a></li>
            <li><a href="/#courses">Signals &amp; systems</a></li>
            <li><a href="/#courses">Circuits</a></li>
            <li><a href="/#pricing">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h3>Company</h3>
          <ul>
            <li><a href="/careers.html">Careers</a></li>
            <li><a href="/blog.html">Blog</a></li>
            <li><a href="/blog.html?category=Inside%20Nyquisition">Inside Nyquisition</a></li>
            <li><a href="mailto:press@nyquisition.app">Press</a></li>
          </ul>
        </div>
        <div>
          <h3>Help</h3>
          <ul>
            <li><a href="/#faq">FAQ</a></li>
            <li><a href="mailto:hello@nyquisition.app">Contact us</a></li>
            <li><a href="/legal.html#privacy">Privacy</a></li>
            <li><a href="/legal.html#terms">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Nyquisition, Inc. Sampled at twice the frequency of forgetting.</span>
        <div class="socials">
          <a href="#" aria-label="YouTube" data-social>${icon.yt}</a>
          <a href="#" aria-label="Instagram" data-social>${icon.ig}</a>
          <a href="#" aria-label="TikTok" data-social>${icon.tk}</a>
          <a href="#" aria-label="X" data-social>${icon.x}</a>
        </div>
      </div>
    </div>
  </footer>`;
}

export let lenis = null;

function initSmoothScroll() {
  if (prefersReducedMotion()) return;
  lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, anchors: { offset: -88 }, autoRaf: true });
  // Let elements opt out (dialogs, scrolling lists)
  document.querySelectorAll('[data-lenis-prevent]').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  const margin = document.querySelector('.pad-margin');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.toggleAttribute('data-scrolled', y > 12);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > 480) header.setAttribute('data-hidden', '');
    else if (goingUp || y < 480) header.removeAttribute('data-hidden');
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    margin?.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  header.addEventListener('focusin', () => header.removeAttribute('data-hidden'));
  onScroll();
}

function initMenu() {
  const menu = document.getElementById('mobile-menu');
  const openBtn = document.querySelector('[data-menu-open]');
  const close = () => {
    menu.removeAttribute('data-open');
    menu.inert = true;
    openBtn.setAttribute('aria-expanded', 'false');
    lenis?.start();
    openBtn.focus();
  };
  openBtn.addEventListener('click', () => {
    menu.setAttribute('data-open', '');
    menu.inert = false;
    openBtn.setAttribute('aria-expanded', 'true');
    lenis?.stop();
    menu.querySelector('nav a')?.focus();
  });
  menu.querySelector('[data-menu-close]').addEventListener('click', close);
  menu.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  menu.querySelectorAll('nav a, [data-signup], [data-login]').forEach((a) =>
    a.addEventListener('click', () => {
      menu.removeAttribute('data-open');
      menu.inert = true;
      openBtn.setAttribute('aria-expanded', 'false');
      lenis?.start();
    }),
  );
}

function initBoil() {
  if (prefersReducedMotion()) return;
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % 3;
    document.documentElement.dataset.boil = String(i);
  }, 170);
}

/** Paths inside [data-draw] elements stroke themselves in when scrolled into view. */
export function initDraw(root = document) {
  const els = root.querySelectorAll('[data-draw]');
  els.forEach((el) =>
    el.querySelectorAll('path').forEach((p) => {
      try {
        p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2));
      } catch {
        /* not rendered */
      }
    }),
  );
  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add('is-drawn'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-drawn');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.4 },
  );
  els.forEach((el) => io.observe(el));
}

/** Any form[data-newsletter] gets validation + a fake subscribe round trip. */
export function bindNewsletter(form) {
  const input = form.querySelector('input[type=email]');
  const btn = form.querySelector('button[type=submit]');
  if (get('newsletter')) {
    input.value = get('newsletter');
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isEmail(input.value)) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      toast({ title: 'That email looks off', body: 'Check for a typo, like a missing @ or domain.', who: 'polly', mood: 'wow' });
      return;
    }
    input.removeAttribute('aria-invalid');
    const label = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Subscribing';
    await fakeRequest(800);
    set('newsletter', input.value.trim());
    btn.disabled = false;
    btn.textContent = 'Subscribed';
    setTimeout(() => (btn.textContent = label), 2600);
    toast({
      title: 'Subscribed',
      body: `The next letter goes to ${input.value.trim()} on the first Sunday of the month.`,
      who: 'cubert',
    });
  });
}

export function initChrome() {
  const current = pageKey();
  document.body.insertAdjacentHTML('afterbegin', headerHTML(current));
  document.body.insertAdjacentHTML('beforeend', footerHTML());

  initSmoothScroll();
  initHeader();
  initMenu();
  initBoil();
  initDraw();

  document.addEventListener('click', (e) => {
    const signup = e.target.closest('[data-signup]');
    if (signup) {
      e.preventDefault();
      openSignup({ track: signup.dataset.track, plan: signup.dataset.plan });
    }
    if (e.target.closest('[data-login]')) {
      e.preventDefault();
      openSignup({ mode: 'login' });
    }
    if (e.target.closest('[data-social]')) {
      e.preventDefault();
      toast({ title: 'Our socials launch with the app', body: 'Subscribe to the letter and we will tell you first.', who: 'ozzy' });
    }
  });
  document.querySelectorAll('form[data-newsletter]').forEach(bindNewsletter);
  refreshSignupButtons();
}
