import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const page = (name) => resolve(import.meta.dirname, name);

export default defineConfig({
  build: {
    // three.js is one ~700 kB chunk, but it's only loaded lazily when a 3D scene nears the viewport
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: page('index.html'),
        blog: page('blog.html'),
        post: page('post.html'),
        careers: page('careers.html'),
        job: page('job.html'),
        legal: page('legal.html'),
        notFound: page('404.html'),
      },
    },
  },
});
