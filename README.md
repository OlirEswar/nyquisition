# Nyquisition website

Marketing site for Nyquisition, a Duolingo-style app for intermediate and advanced engineering (control theory, electromagnetics, signals, circuits). Daily AI-tuned quizzes, interactive notes, and a crew of characters made of engineering symbols.

Hand-drawn "engineer's notepad" design: graph paper, graphite ink, low-poly 3D characters with ink outlines, and things you can play with.

## Pages

| Page | What's there |
| --- | --- |
| `index.html` | Hero with draggable 3D crew, playable sample lesson, forgetting-curve chart, interactive notes (step response, field lines), "Ask Nyq", inverted-pendulum game, course path, crew turntable, pricing, FAQ |
| `blog.html` / `post.html?slug=` | Filterable, searchable blog; posts with table of contents, reading progress, embedded simulations |
| `careers.html` / `job.html?id=` | Roles with filters and search; application form with validation, résumé upload and draft autosave |
| `legal.html`, `404.html` | Privacy and terms, not-found page |

There's no backend yet: accounts, applications, drafts and preferences are stored in `localStorage`, and network calls are simulated so every loading, error and success state is real.

## Develop

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview
```

Vanilla JS + [Vite](https://vite.dev) (multi-page), [three.js](https://threejs.org) r187 for 3D, [GSAP](https://gsap.com) ScrollTrigger and [Lenis](https://lenis.darkroom.engineering) for scroll. The 3D scenes are code-split and only load as they approach the viewport.

## Layout

```
src/
  css/        base (tokens, chrome, components), home, blog, careers, sims
  js/
    three/    stage (renderer wrapper), toon (materials + ink outlines), characters, hero, cartpole, cast
    sims/     pencil-style canvas helpers, forgetting curve, step response, field lines
    data/     blog posts, job openings
    chrome.js header/footer/menu, signup.js onboarding dialog, quiz.js, courses.js, toast.js, store.js
```

## Content to replace before launch

Stats, testimonials, author names, job openings and salaries, and the legal copy are placeholders.
