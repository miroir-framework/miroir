/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import { babelImport } from 'vite-plugin-babel-import';
import * as path from "path";

export default defineConfig({
  root: 'src',
  build: {
    // Relative to the root
    outDir: '../dist',
    target: 'esnext',
    // rollupOptions: {
    //   external: ["process"]
    // },
  },
  // resolve: {
  // // //   alias: {
  // // //     src: path.resolve(__dirname, 'src'),
  // // //   }
  //   alias: {
  //     '@uiw/react-codemirror': path.resolve(__dirname, '../../node_modules/@uiw/react-codemirror/cjs/useCodeMirror.js'),
  //     // '@uiw/react-codemirror': path.resolve(__dirname, '../../node_modules/@uiw/react-codemirror/cjs/useCodeMirror.js'),
  // //     '@codemirror/state': path.resolve(__dirname, './node_modules/@codemirror/state/dist/index.cjs'),
  // //     // '@codemirror/state': path.resolve(__dirname, '../../node_modules/@codemirror/state/dist/index.cjs'),
  // //     // '@codemirror/state': path.resolve(__dirname, 'node_modules/@codemirror/state/dist/index.cjs'),
  // //     // '@codemirror/state': path.resolve(
  // //     //   __dirname,
  // //     //   './node_modules/@codemirror/state/dist/index.cjs'
  // //     // ),
  // //     // // '@codemirror/lang-yaml': path.resolve(
  // //     // //   __dirname,
  // //     // // ),
  // //     // '@codemirror/lang-json': path.resolve(
  // //     //   __dirname,
  // //     //   './node_modules/@codemirror/lang-json/dist/index.cjs'
  // //     // )
  //   }
  // },
  optimizeDeps: {
    include: [
      '@emotion/react', 
      '@emotion/styled', 
      '@mui/material/Tooltip'
    ],
  },
  plugins: [
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      // include: [ "crypto", "stream", "perf_hooks", "process" ],
      include: [ "crypto" ],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      exclude: [
        // "stream", "perf_hooks"
        "process"
        // 'http', // Excludes the polyfill for `http` and `node:http`.
      ],
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
      jsxImportSource: '@emotion/react',
      // Use React plugin in all *.jsx and *.tsx files
      include: '../src/**/*.{jsx,tsx}',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    // babelImport([
    //   {
    //     libraryName: '@mui/icons-material',
    //     libraryDirectory: '',
    //     camel2DashComponentName: false,
    //   },
    // ]),
  ],
  test: {
    root: "tests",
    globals: true,
    watch: false,
    environment: 'happy-dom',
    hookTimeout: 30000,
    setupFiles: ['./setup.ts'],
  },
});