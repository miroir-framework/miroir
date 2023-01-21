import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';

export default {
    input: ["src/index.ts"],
    output: [
        {
            dir: "dist",
            entryFileNames: "[name].js",
            format: "cjs",
            exports: "named"
        }
    ],
    plugins: [
      dts(),
      typescript(),
    ],
    // external: ["react"]
};
