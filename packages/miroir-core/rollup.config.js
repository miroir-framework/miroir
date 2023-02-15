import typescript from 'rollup-plugin-typescript2';
import pluginJson from '@rollup/plugin-json';

export default [
  {
    input: ["src/index.ts"],
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
];
