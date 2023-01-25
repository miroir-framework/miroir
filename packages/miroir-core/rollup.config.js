// import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import pluginJson from '@rollup/plugin-json';
// import esbuild from 'rollup-plugin-esbuild';

export default [
  {
    input: ["dist/out-tsc/src/index.js"],
    output: [
        {
            file: `dist/bundle.js`,
            entryFileNames: "[name].js",
            format: "es",
            // name: "bundle",
            exports: "named"
        }
    ],
    plugins: [
      pluginJson()
      // typescript(),
      // esbuild()
    ],
    // external: ["react"]
  },
  {
    input: ["dist/out-tsc/dts/src/index.d.ts"],
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
    // external: ["react"]
  }
];
