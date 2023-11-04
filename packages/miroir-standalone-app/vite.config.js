/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  root: 'src',
  build: {
    // Relative to the root
    outDir: '../dist',
  },
  // resolve: {
  //   alias: {
  //     src: path.resolve(__dirname, 'src'),
  //   }
  // },
  plugins: [
    react({
      // Use React plugin in all *.jsx and *.tsx files
      include: '../src/**/*.{jsx,tsx}',
    }),
  ],
  test: {
    root: "tests",
    globals: true,
    watch: false,
    maxConcurrency: 1,
    maxThreads: 1,
    minThreads: 1,
    environment: 'jsdom',
    setupFiles: ['./setup.ts'],
  },
});