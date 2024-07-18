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
  "rootDir": "./tmp/src/tests",
  // "rootDir": "./tests",
  "moduleDirectories": [
    "node_modules",
    "packages/miroir-standalone-app/node_modules",
    // "packages/miroir-core",

  ],
  transformIgnorePatterns: [`<rootDir>\/(?!(/node_modules/(?!${esModules})))\/`],
  // transformIgnorePatterns: ['node_modules','miroir-core'],
  // roots: ["."],
  // modulePaths: ["./packages/miroir-standalone-app/src/"], // <-- This will be set to 'baseUrl' value
  modulePaths: ["./src/"], // <-- This will be set to 'baseUrl' value
  // modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  transform: {},
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
  // "transform": {
  //   "^.+\\.ts?$": [
  //     "ts-jest",
  //     {
  //       // useESM:true,
  //       // tsconfig: "../../tsconfig.json"
  //       // Plugin: [ "plugin-syntax-import-attributes"],
  //       tsconfig: 
  //       {
  //         resolveJsonModule: true,
  //         esModuleInterop: true,
  //         allowSyntheticDefaultImports:true,
  //         allowJs: true,
  //         moduleResolution: "node",
  //         // module:"commonjs",
  //         // module: "ES2017",
  //         // target: "ES2017",
  //         module: "ESNext",
  //         target: "ESNext",
  //         // module:"ES2022",
  //         // pl
  //               // rootDir: "./src/",
  //         traceResolution: true
  //       },
  //     }
  //   ],
  //   // "^.+\\.js?$": [ "babel-jest", "plugin-syntax-import-attributes"],
  //   "^.+\\.js?$": [ "babel-jest"],
  // },
  // moduleNameMapper: {
  //   "^miroir-fwk\/(.+)$": "<rootDir>/src/$1",
  //   '\\.(css|scss|sass)$': 'identity-obj-proxy',
  // },
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
})