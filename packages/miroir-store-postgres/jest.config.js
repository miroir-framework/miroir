// import { pathsToModuleNameMapper } from 'ts-jest';
// import compilerOptions from './tsconfig'

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }
// const esModules = ['uuid'].join('|');

export default (path, options) =>({
  "verbose": true,
  // "verbose": false,
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
  "rootDir": ".",
  modulePaths: [
    // "./src",
    // "./test",
    "<rootDir>/src",
    "<rootDir>/test",
    // "<rootDir>/dist",
    "<rootDir>/node_modules",
    // // "<rootDir>/../..",
    "<rootDir>/../../node_modules",
  ], // <-- This will be set to 'baseUrl' value
  moduleDirectories: [
    "node_modules",
    "<rootDir>/test",
    "<rootDir>/src",

  ],
  // transformIgnorePatterns: [`<rootDir>\/(?!(/node_modules/(?!${esModules})))\/`],
  // transformIgnorePatterns: ['node_modules','miroir-core'],
  // roots: ["."],
  // modulePaths: ["./src/"], // <-- This will be set to 'baseUrl' value
  // modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: 
    // Object.assign(
      {
      // "^miroir-fwk(.*)$": "<rootDir>/src/$1",
      // "^(.*)$": "$1",
      '\\.(css|scss|sass)$': 'identity-obj-proxy',
      }
    // pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */)
    // )
  ,
  // resolver:options.defaultResolver(path, {...options}),
  testEnvironment: "node",
  moduleFileExtensions:[
    "ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"
  ],
  // preset:'ts-jest/presets/default-esm',
  "transform": {
    "^.+\\.ts": [
      "ts-jest",
      {
        // useESM:true,
        // tsconfig: "../../tsconfig.json"
        tsconfig: 
        {
          resolveJsonModule: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports:true,
          allowJs: true,
          moduleResolution: "node",
          module:"ESNext",
          target: "ESNext",
          traceResolution: true
        },
      }
    ],
    "^.+\\.js?$": ["babel-jest"],
  },
  // moduleNameMapper: {
  //   "^miroir-fwk\/(.+)$": "<rootDir>/src/$1",
  //   '\\.(css|scss|sass)$': 'identity-obj-proxy',
  // },
  
})