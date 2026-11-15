/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app uses hash routing, so a relative base works on GitHub Pages
// (https://<user>.github.io/<repo>/) and on any other static host without
// knowing the repository name at build time.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Lesson content and its runtime validator ship in the main bundle (~150 kB gzipped).
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
