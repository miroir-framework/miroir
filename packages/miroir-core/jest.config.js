// import { pathsToModuleNameMapper } from 'ts-jest';
// import compilerOptions from './tsconfig'

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }
const esModules = ['uuid'].join('|');

export default (path, options) =>({
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
  "transform": {
    "^.+\\.ts?$": [
      "ts-jest",
      {
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
    "^.+\\.js?$": [ "babel-jest"],
  },
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
})