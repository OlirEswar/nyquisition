import { initChrome } from './chrome.js';
import { cover } from './covers.js';
import { crew } from './crew.js';
import { AUTHORS, POSTS, formatDate, postBySlug } from './data/posts.js';
import { toast } from './toast.js';
import { get, set } from './store.js';

initChrome();

const main = document.querySelector('[data-post]');
const slug = new URLSearchParams(location.search).get('slug');
const post = postBySlug(slug);
const tagClass = { 'Learning science': 'tag--ozzy', 'Study guides': 'tag--nyq', 'Inside Nyquisition': 'tag--polly' };

if (!post) {
  document.title = 'Post not found | Nyquisition';
  main.innerHTML = `<div class="wrap empty" style="padding-block:var(--s-9)">
    ${crew.polly({ mood: 'wow', label: '' })}
    <h1 style="font-size:var(--step-4)">We couldn't find that post</h1>
    <p class="lede">It may have moved, or the link has a typo.</p>
    <a class="btn" href="/blog.html">See all posts</a>
  </div>`;
} else {
  render();
}

function slugify(s) {
  return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function render() {
  const a = AUTHORS[post.author];
  document.title = `${post.title} | Nyquisition`;
  document.querySelector('meta[name=description]').setAttribute('content', post.excerpt);

  // headings get ids for the table of contents
  const tmp = document.createElement('div');
  tmp.innerHTML = post.body;
  const heads = [...tmp.querySelectorAll('h2')];
  heads.forEach((h) => (h.id = slugify(h.textContent)));
  tmp.querySelectorAll('[data-embed]').forEach((el) => {
    el.outerHTML = embedMarkup(el.dataset.embed);
  });

  const related = POSTS.filter((p) => p.slug !== post.slug)
    .sort((x, y) => (y.category === post.category) - (x.category === post.category))
    .slice(0, 3);
  const helpful = get(`helpful:${post.slug}`);

  main.innerHTML = `
    <article class="article">
      <header class="wrap article__head">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/blog.html">Blog</a><span aria-hidden="true">/</span><a href="/blog.html?category=${encodeURIComponent(post.category)}">${post.category}</a></nav>
        <span class="tag ${tagClass[post.category]}">${post.category}</span>
        <h1>${post.title}</h1>
        <p class="lede">${post.excerpt}</p>
        <div class="byline byline--lg">
          <span class="byline__face" aria-hidden="true">${crew[a.who]({ label: '' })}</span>
          <span><strong>${a.name}</strong><span class="byline__meta">${a.role}</span></span>
          <span class="byline__meta byline__date">${formatDate(post.date)}<br />${post.mins} min read</span>
        </div>
      </header>
      <div class="wrap article__cover">${cover(post, { size: 'hero' })}</div>
      <div class="wrap article__layout">
        <aside class="toc" aria-label="On this page">
          ${heads.length ? `<p class="toc__title">On this page</p><ol>${heads.map((h) => `<li><a href="#${h.id}">${h.textContent}</a></li>`).join('')}</ol>` : ''}
          <div class="share">
            <button class="chip" type="button" data-copy>Copy link</button>
            <button class="chip" type="button" data-share>Share</button>
          </div>
        </aside>
        <div class="prose article__body">${tmp.innerHTML}</div>
      </div>
      <footer class="wrap article__foot">
        <div class="helpful sheet" data-helpful>
          <p><strong>Was this useful?</strong></p>
          <div class="segmented">
            <button class="chip" type="button" data-vote="yes" aria-pressed="${helpful === 'yes'}">Yes</button>
            <button class="chip" type="button" data-vote="no" aria-pressed="${helpful === 'no'}">Not really</button>
          </div>
        </div>
        <section class="related" aria-labelledby="related-title">
          <h2 id="related-title">Keep reading</h2>
          <div class="post-grid post-grid--3">
            ${related
              .map(
                (p) => `<article class="post-card"><a class="post-card__link" href="/post.html?slug=${p.slug}">
                  <div class="post-card__cover">${cover(p)}</div>
                  <div class="post-card__body"><span class="tag ${tagClass[p.category]}">${p.category}</span><h3>${p.title}</h3><p>${p.excerpt}</p></div>
                </a></article>`,
              )
              .join('')}
          </div>
        </section>
        <aside class="news sheet" aria-labelledby="news-title">
          <div class="news__crew" aria-hidden="true">${crew.cubert({ label: '' })}${crew.nyq({ label: '' })}</div>
          <div><h2 id="news-title">Get posts like this monthly.</h2><p>New study guides and what we're learning from the data. Nothing else.</p></div>
          <form class="inline-form" data-newsletter novalidate>
            <label class="visually-hidden" for="post-email">Email</label>
            <input class="input" id="post-email" name="email" type="email" placeholder="you@school.edu" autocomplete="email" />
            <button class="btn" type="submit">Subscribe</button>
          </form>
        </aside>
      </footer>
    </article>`;

  // newsletter forms injected after initChrome ran
  import('./chrome.js').then(({ bindNewsletter }) => main.querySelectorAll('form[data-newsletter]').forEach(bindNewsletter));
  wireEmbeds();
  wireShare();
  wireHelpful();
  wireProgress();
  wireToc(heads.map((h) => h.id));
}

function embedMarkup(kind) {
  if (kind === 'step') {
    return `<figure class="embed sheet" data-step>
      <canvas class="note__plot" data-step-plot aria-label="Step response plot"></canvas>
      <div class="embed__row">
        <canvas class="note__splane" data-splane aria-label="Pole locations"></canvas>
        <div class="note__controls">
          <label class="slider"><span>Damping ζ <strong data-out-zeta>0.30</strong></span><input type="range" min="5" max="200" value="30" data-zeta /></label>
          <label class="slider"><span>Natural freq. ωₙ <strong data-out-wn>2.0 rad/s</strong></span><input type="range" min="5" max="40" value="20" data-wn /></label>
          <dl class="note__readout"><div><dt>Overshoot</dt><dd data-out-os></dd></div><div><dt>Settling (2%)</dt><dd data-out-ts></dd></div></dl>
          <p class="note__verdict" data-out-verdict></p>
        </div>
      </div>
      <figcaption>Try it: change ωₙ and watch the overshoot stay put.</figcaption>
    </figure>`;
  }
  if (kind === 'field') {
    return `<figure class="embed sheet" data-field>
      <canvas class="note__field" tabindex="0" aria-label="Electric field lines between point charges. Drag the charges."></canvas>
      <div class="note__presets" style="margin-top:var(--s-3)">
        <button class="chip" type="button" data-add="1">Add +</button>
        <button class="chip" type="button" data-add="-1">Add −</button>
        <button class="chip" type="button" data-reset>Reset</button>
      </div>
      <figcaption>Drag the charges. Double-click one to remove it.</figcaption>
    </figure>`;
  }
  return '';
}

function wireEmbeds() {
  const step = main.querySelector('.embed[data-step]');
  if (step) import('./sims/step.js').then(({ initStep }) => initStep(step));
  const field = main.querySelector('.embed[data-field]');
  if (field) import('./sims/field.js').then(({ initField }) => initField(field));
}

function wireShare() {
  main.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast({ title: 'Link copied', body: 'Paste it anywhere to share this post.', who: 'nyq' });
    } catch {
      toast({ title: 'Couldn’t copy the link', body: 'Copy it from the address bar instead.', who: 'polly', mood: 'sad' });
    }
  });
  const share = main.querySelector('[data-share]');
  if (!navigator.share) share.hidden = true;
  share.addEventListener('click', () => navigator.share?.({ title: post.title, text: post.excerpt, url: location.href }).catch(() => {}));
}

function wireHelpful() {
  const box = main.querySelector('[data-helpful]');
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vote]');
    if (!b) return;
    set(`helpful:${post.slug}`, b.dataset.vote);
    box.querySelectorAll('[data-vote]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    toast(
      b.dataset.vote === 'yes'
        ? { title: 'Thanks for the feedback', body: 'We’ll write more like this.', who: 'nyq', mood: 'wink' }
        : { title: 'Thanks, noted', body: 'Tell us what was missing at hello@nyquisition.app.', who: 'cubert' },
    );
  });
}

function wireProgress() {
  const bar = document.querySelector('[data-progress]');
  const body = main.querySelector('.article__body');
  const update = () => {
    const r = body.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * 0.6)));
    bar.style.transform = `scaleX(${p})`;
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

function wireToc(ids) {
  if (!ids.length) return;
  const links = new Map(ids.map((id) => [id, main.querySelector(`.toc a[href="#${id}"]`)]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.removeAttribute('aria-current'));
          links.get(e.target.id)?.setAttribute('aria-current', 'true');
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  ids.forEach((id) => io.observe(document.getElementById(id)));
}
