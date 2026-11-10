import { initChrome } from './chrome.js';
import { cover } from './covers.js';
import { crew } from './crew.js';
import { AUTHORS, CATEGORIES, POSTS, formatDate } from './data/posts.js';

initChrome();

const PAGE = 6;
const params = new URLSearchParams(location.search);
const state = {
  category: CATEGORIES.includes(params.get('category')) ? params.get('category') : 'All',
  q: params.get('q') ?? '',
  shown: PAGE,
};

const tagClass = { 'Learning science': 'tag--ozzy', 'Study guides': 'tag--nyq', 'Inside Nyquisition': 'tag--polly' };

const byline = (p) => {
  const a = AUTHORS[p.author];
  return `<div class="byline"><span class="byline__face" aria-hidden="true">${crew[a.who]({ label: '' })}</span><span><strong>${a.name}</strong><span class="byline__meta">${formatDate(p.date)}, ${p.mins} min read</span></span></div>`;
};

function card(p) {
  return `<article class="post-card">
    <a class="post-card__link" href="/post.html?slug=${p.slug}">
      <div class="post-card__cover">${cover(p)}</div>
      <div class="post-card__body">
        <span class="tag ${tagClass[p.category]}">${p.category}</span>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        ${byline(p)}
      </div>
    </a>
  </article>`;
}

const featured = POSTS.find((p) => p.featured);
document.querySelector('[data-featured]').innerHTML = `
  <article class="featured sheet">
    <a class="featured__link" href="/post.html?slug=${featured.slug}">
      <div class="featured__cover">${cover(featured, { size: 'hero' })}</div>
      <div class="featured__body">
        <span class="tag ${tagClass[featured.category]}">${featured.category}</span>
        <h2>${featured.title}</h2>
        <p class="lede">${featured.excerpt}</p>
        ${byline(featured)}
        <span class="featured__cta btn btn--sm">Read the post</span>
      </div>
    </a>
  </article>`;

document.querySelector('[data-news-crew]').innerHTML = ['cubert', 'nyq'].map((w) => crew[w]({ label: '' })).join('');

const filters = document.querySelector('[data-filters]');
filters.innerHTML = ['All', ...CATEGORIES]
  .map((c) => `<button class="chip" type="button" aria-pressed="${c === state.category}" data-cat="${c}">${c}</button>`)
  .join('');

const grid = document.querySelector('[data-grid]');
const count = document.querySelector('[data-count]');
const more = document.querySelector('[data-more]');
const search = document.querySelector('[data-search]');
search.value = state.q;

function matches(p) {
  if (state.category !== 'All' && p.category !== state.category) return false;
  if (!state.q) return true;
  const q = state.q.toLowerCase();
  return [p.title, p.excerpt, p.category, AUTHORS[p.author].name, p.body.replace(/<[^>]+>/g, ' ')].some((t) => t.toLowerCase().includes(q));
}

function syncURL() {
  const u = new URL(location.href);
  state.category === 'All' ? u.searchParams.delete('category') : u.searchParams.set('category', state.category);
  state.q ? u.searchParams.set('q', state.q) : u.searchParams.delete('q');
  history.replaceState(null, '', u);
}

function render() {
  const list = POSTS.filter((p) => !(p.featured && state.category === 'All' && !state.q)).filter(matches);
  const visible = list.slice(0, state.shown);
  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${crew.ozzy({ mood: 'sleepy', label: '' })}
      <h3>No posts match “${state.q.replace(/</g, '&lt;')}”</h3>
      <p>Try a shorter search, or look in all topics.</p>
      <button class="btn btn--sm btn--ghost" type="button" data-clear>Clear search</button></div>`;
    grid.querySelector('[data-clear]').addEventListener('click', () => {
      state.q = '';
      state.category = 'All';
      search.value = '';
      filters.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === 'All')));
      update();
    });
  } else {
    grid.innerHTML = visible.map(card).join('');
  }
  const label = state.category === 'All' ? 'posts' : `posts in ${state.category}`;
  count.textContent = state.q || state.category !== 'All' ? `${list.length} ${label}${state.q ? ` matching “${state.q}”` : ''}` : '';
  more.hidden = visible.length >= list.length;
  document.querySelector('[data-featured]').hidden = Boolean(state.q) || state.category !== 'All';
}

function update() {
  state.shown = PAGE;
  syncURL();
  render();
}

filters.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  state.category = b.dataset.cat;
  filters.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  update();
});
let t;
search.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => {
    state.q = search.value.trim();
    update();
  }, 180);
});
more.addEventListener('click', () => {
  state.shown += PAGE;
  render();
  grid.querySelectorAll('.post-card')[state.shown - PAGE]?.querySelector('a').focus();
});

render();
