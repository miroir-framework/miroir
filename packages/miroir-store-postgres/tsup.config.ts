import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    dts: true,
    target: "node20",
    format: ["esm"],
    clean: true,
});
