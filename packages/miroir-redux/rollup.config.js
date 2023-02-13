import dts from 'rollup-plugin-dts';
import pluginJson from '@rollup/plugin-json';

export default [
  {
    input: ["dist/out-tsc/src/index.js"],
    external: ['level','msw'],
    output: [
        {
            file: `dist/bundle.js`,
            entryFileNames: "[name].js",
            format: "es",
            exports: "named",
        }
    ],
    plugins: [
      pluginJson()
    ],
  },
  {
    input: ["dist/out-tsc/dts/src/index.d.ts"],
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
