import pluginJson from '@rollup/plugin-json';
import typescript2 from 'rollup-plugin-typescript2'

export default [
  {
    input: ["src/index.ts"],
    external: [
      '@reduxjs/toolkit',
      '@teroneko/redux-saga-promise',
      'immer',
      'level',
      'lodash',
      'miroir-core',
      'msw',
      'redux-saga',
      'redux-saga/effects'
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
];
