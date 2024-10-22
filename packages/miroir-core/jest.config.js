// import { pathsToModuleNameMapper } from 'ts-jest';
// import compilerOptions from './tsconfig'

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }
const esModules = ['uuid'].join('|');

export default (path, options) =>({
  "verbose": true,
  // "verbose": false,
  "rootDir": ".",
  // "rootDir": "./tmp/src/tests",
  // "rootDir": "./src/tests",
  // "rootDir": "./tests",
  moduleDirectories: [
    "node_modules",
    "packages/miroir-standalone-app/node_modules",
    "<rootDir>/tests",
    "<rootDir>/src",
    "<rootDir>/assets",

    // "packages/miroir-core",
  ],
  // modulePaths: ["./packages/miroir-standalone-app/src/"], // <-- This will be set to 'baseUrl' value
  modulePaths: [
    "<rootDir>/src",
    "<rootDir>/tests",
    // "<rootDir>/dist",
    "<rootDir>/node_modules",
    // // "<rootDir>/../..",
    "<rootDir>/../../node_modules",
  ], // <-- This will be set to 'baseUrl' value
  // modulePaths: ["./src/", "./tmp/"], // <-- This will be set to 'baseUrl' value
  // modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  // transformIgnorePatterns: [`<rootDir>\/(?!(/node_modules/(?!${esModules})))\/`],
  // transformIgnorePatterns: ['node_modules','miroir-core'],
  // roots: ["."],
  // moduleNameMapper: 
  //   // Object.assign(
  //     {
  //     // "^miroir-fwk(.*)$": "<rootDir>/src/$1",
  //     // "^(.*)$": "$1",
  //     '\\.(css|scss|sass)$': 'identity-obj-proxy',
  //     }
  //   // pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */)
  //   // )
  // ,
  // resolver:options.defaultResolver(path, {...options}),
  testEnvironment: "node",
  moduleFileExtensions:[
    "ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"
  ],
  // preset:'ts-jest/presets/default-esm',
  "transform": {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        // useESM:true,
        // tsconfig: "../../tsconfig.json"
        // Plugin: [ "plugin-syntax-import-attributes"],
        tsconfig: {
          resolveJsonModule: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports:true,
          allowJs: true,
          moduleResolution: "node",
          module: "ESNext",
          target: "ESNext",
          traceResolution: true
        },
      }
    ],
    // "^.+\\.js?$": [ "babel-jest", "plugin-syntax-import-attributes"],
    "^.+\\.js?$": [ "babel-jest"],
  },
  // moduleNameMapper: {
  //   "^miroir-fwk\/(.+)$": "<rootDir>/src/$1",
  //   '\\.(css|scss|sass)$': 'identity-obj-proxy',
  // },
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
})