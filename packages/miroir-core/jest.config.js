// import { pathsToModuleNameMapper } from 'ts-jest';
// import compilerOptions from './tsconfig'

import { useCallback } from "react";

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }
const esModules = ['uuid'].join('|');

/** @type {import('jest').Config} */
const config  = {
  "verbose": true,
  "rootDir": ".",
  moduleDirectories: [
    "node_modules",
    "packages/miroir-standalone-app/node_modules",
    "<rootDir>/tests",
    "<rootDir>/src",
    "<rootDir>/assets",
  ],
  modulePaths: [
    "<rootDir>/src",
    "<rootDir>/tests",
    "<rootDir>/node_modules",
    "<rootDir>/../../node_modules",
  ],
  testEnvironment: "node",
  moduleFileExtensions:[
    "ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"
  ],
  "extensionsToTreatAsEsm": [".ts"],
  "transform": {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          target: "ESNext",
          module: "NodeNext",
          moduleResolution: "Node",
          traceResolution: true,
          resolveJsonModule: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports:true,
          allowJs: true
        },
      }
    ],
    "^.+\\.js?$": [ "babel-jest"],
  },
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
};
// module.exports = config;
export default config;

// export default (path, options) =>({
//   "verbose": true,
//   "rootDir": ".",
//   moduleDirectories: [
//     "node_modules",
//     "packages/miroir-standalone-app/node_modules",
//     "<rootDir>/tests",
//     "<rootDir>/src",
//     "<rootDir>/assets",
//   ],
//   modulePaths: [
//     "<rootDir>/src",
//     "<rootDir>/tests",
//     "<rootDir>/node_modules",
//     "<rootDir>/../../node_modules",
//   ],
//   testEnvironment: "node",
//   moduleFileExtensions:[
//     "ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"
//   ],
//   "extensionsToTreatAsEsm": [".ts"],
//   "presets": [
//     ["@babel/preset-env", { "targets": { "node": "current" } }],
//     '@babel/preset-typescript'
//     // [
//     //   "babel-preset-vite",
//     //   {
//     //     "env": true,
//     //     "glob": false
//     //   }
//     // ]
//   ],
//   // "transform": {
//   //   "^.+\\.ts?$": [
//   //     "ts-jest",
//   //     {
//   //       useESM: true,
//   //       tsconfig: {
//   //         target: "ESNext",
//   //         module: "NodeNext",
//   //         moduleResolution: "Node",
//   //         traceResolution: true,
//   //         resolveJsonModule: true,
//   //         esModuleInterop: true,
//   //         allowSyntheticDefaultImports:true,
//   //         allowJs: true
//   //       },
//   //     }
//   //   ],
//   //   "^.+\\.js?$": [ "babel-jest"],
//   // },
//   "testPathIgnorePatterns": [
//     "./node_modules/",
//     "./.cache/"
//   ],
// })