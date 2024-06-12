// import { pathsToModuleNameMapper } from 'ts-jest';
// import compilerOptions from './tsconfig'

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }
// const esModules = ['uuid'].join('|');

export default (path, options) =>({
  "verbose": true,
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
  // "verbose": false,
  "rootDir": ".",
  modulePaths: [
    "./src",
    // "<rootDir>/src",
    // "<rootDir>/dist",
    "<rootDir>/node_modules",
    // // "<rootDir>/../..",
    "<rootDir>/../../node_modules",
  ], // <-- This will be set to 'baseUrl' value
  moduleDirectories: [
    "node_modules",
    // "<rootDir>/../../node_modules",
    // "packages/miroir-localcache-redux/node_modules",
    // "packages/miroir-core",

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
          module:"ES2017",
          target: "ES2017",
          // target: "ES6",
          // module:"ES2020",
          // module: "ES2017",
          // pl
                // rootDir: "./src/",
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