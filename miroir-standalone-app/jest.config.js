module.exports = {
  // "verbose": true,
  "verbose": false,
  "rootDir": ".",
  "moduleDirectories": [
    "node_modules",
    "<rootDir>",
  ],
  testEnvironment: "node",
  moduleFileExtensions:[
    "js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"
  ],
  "transform": {
    "^.+\\.(ts|js)x?$": [
      "ts-jest",
      {
        tsconfig: {
          resolveJsonModule: true,
          esModuleInterop: true,
          moduleResolution: "node",
        }
      }
    ]
  },
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  "testPathIgnorePatterns": [
    "./node_modules/",
    "./.cache/"
  ],
}