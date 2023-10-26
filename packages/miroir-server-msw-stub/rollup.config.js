import typescript2 from 'rollup-plugin-typescript2';
import pluginJson from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    input: ["src/index.ts"],
    external: [
      'miroir-core',
      'msw'
    ],
    output: [
        {
            file: `dist/bundle.js`,
            entryFileNames: "[name].js",
            format: "es",
            exports: "named",
        }
    ],
    plugins: [
      typescript2(),
      pluginJson(),
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
