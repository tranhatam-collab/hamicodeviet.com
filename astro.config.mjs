import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hamicodeviet.com',
  output: 'static',
  build: {
    format: 'directory',
  },
});
