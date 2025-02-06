/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import * as path from "path";

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
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      // include: ['crypto'],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      // exclude: [
      //   'http', // Excludes the polyfill for `http` and `node:http`.
      // ],
      // // Whether to polyfill specific globals.
      // globals: {
      //   Buffer: true, // can also be 'build', 'dev', or false
      //   global: true,
      //   process: true,
      // },
      // // Whether to polyfill `node:` protocol imports.
      // protocolImports: true,
    }),
    react({
      // Use React plugin in all *.jsx and *.tsx files
      include: '../src/**/*.{jsx,tsx}',
    }),
  ],
  test: {
    root: "./src/tests",
    globals: true,
    watch: false,
    environment: 'happy-dom',
    // setupFiles: ['./setup.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});