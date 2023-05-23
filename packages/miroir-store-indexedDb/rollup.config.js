import typescript from 'rollup-plugin-typescript2';
import pluginJson from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';

// import pkg from './package.json'

export default [
  {
    input: ["src/index.ts"],
    external: [
      'miroir-core',
      'level',
      'detect-browser'
    ],
    output: [
      {
          file: `dist/bundle.esm.js`,
          entryFileNames: "[name].js",
          format: "esm",
          exports: "named"
      }
    ],
    plugins: [
      typescript(),
      pluginJson(),
      nodeResolve({browser:false})
    ],
  },
  {
    input: ["dist/src/index.d.ts"],
    output: [
      {
        file: `dist/bundle.d.ts`,
        format: 'esm',
      }
    ],
    plugins: [
      pluginJson(),
      dts(),
    ],
  }
];
