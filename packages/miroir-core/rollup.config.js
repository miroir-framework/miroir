import typescript from 'rollup-plugin-typescript2';
import pluginJson from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: ["src/index.ts"],
    external: [
      'level',
      'uuid',
      'msw',
      'zod',
      'zod-to-json-schema',
      '@miroir-framework/jzod',
      '@miroir-framework/jzod-ts',
      'lodash'
    ],
    output: [
        {
            file: `dist/bundle.js`,
            entryFileNames: "[name].js",
            format: "es",
            exports: "named"
        }
    ],
    plugins: [
      typescript(),
      pluginJson()
    ],
  },
  {
    input: ["dist/src/index.d.ts"],
    output: [
        {
          file: `dist/bundle.d.ts`,
          format: 'es',
          // exports: "named",

        }
    ],
    plugins: [
      pluginJson(),
      dts(),
    ],
  }
];
