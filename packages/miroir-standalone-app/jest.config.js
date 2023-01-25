// import { pathsToModuleNameMapper } from 'ts-jest';
// import compilerOptions from './tsconfig'

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // [...]
// }

export default (path, options) =>({
  "verbose": true,
  // "verbose": false,
  "rootDir": ".",
  "moduleDirectories": [
    "node_modules",
    "packages/miroir-standalone-app/node_modules",
    // "packages/miroir-core",

  ],
  // transformIgnorePatterns: ['<rootDir>\/(?!(node_modules|packages\/miroir-core))\/'],
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
  "transform": {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          resolveJsonModule: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports:true,
          allowJs: true,
          moduleResolution: "node",
          // rootDir: "./src/",
          traceResolution: true,
          module:"commonjs"
        },
      }
    ],
    "\\.js$": ["babel-jest"],
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