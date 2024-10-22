/** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
// };
// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }
const esModules = ['uuid'].join('|');

export default (path, options) =>({
  "verbose": true,
  // "verbose": false,
  "rootDir": ".",
  "moduleDirectories": [
    "node_modules",
    "packages/miroir-store-filesystem/node_modules",
    // "packages/miroir-core",

  ],
  transformIgnorePatterns: [`<rootDir>\/(?!(/node_modules/(?!${esModules})))\/`],
  // transformIgnorePatterns: ['node_modules','miroir-core'],
  // roots: ["."],
  // modulePaths: ["./packages/miroir-standalone-app/src/"], // <-- This will be set to 'baseUrl' value
  modulePaths: ["./src/"], // <-- This will be set to 'baseUrl' value
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
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
  // preset:'ts-jest/presets/default-esm',
  // "transform": {
  // //   "^.+\\.tsx?$": [
  // //     "ts-jest",
  // //     {
  // //       // useESM:true,
  // //       // diagnostics: true,
  // //       // tsconfig: "../../tsconfig.json"
  // //       // tsconfig: 
  // //       // {
  // //       //   resolveJsonModule: true,
  // //       //   esModuleInterop: true,
  // //       //   allowSyntheticDefaultImports:true,
  // //       //   allowJs: true,
  // //       //   moduleResolution: "node",
  // //       //   module: "ESNext",
  // //       //   target: "ESNext",
  // //       //   traceResolution: true,
  // //       //   // module:"commonjs"
  // //       // },
  // //     }
  // //   ],
  //   "^.+\\.js?$": ["babel-jest"],
  // },
  // // moduleNameMapper: {
  // //   "^miroir-fwk\/(.+)$": "<rootDir>/src/$1",
  // //   '\\.(css|scss|sass)$': 'identity-obj-proxy',
  // // },
  // "testPathIgnorePatterns": [
  //   "./node_modules/",
  //   "./.cache/"
  // ],
})