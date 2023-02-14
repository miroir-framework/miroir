import dts from 'rollup-plugin-dts';
import pluginJson from '@rollup/plugin-json';
import typescript2 from 'rollup-plugin-typescript2'

export default [
  {
    input: ["src/index.ts"],
    external: [
      '@reduxjs/toolkit',
      'immer',
      'level',
      'lodash',
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
      pluginJson()
    ],
  },
  {
    input: ["src/index.ts"],
    output: [
        {
          file: `dist/bundle.d.ts`,
          format: 'es',
        }
    ],
    plugins: [
      pluginJson(),
      dts(),
    ],
  }
];
