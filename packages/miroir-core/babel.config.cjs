module.exports = api => {
  const isTest = api.env('test');
  // You can use isTest to determine what presets and plugins to use.
  console.log('########################################################')
  return {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}], '@babel/preset-typescript'],
  // "preset": [
  //   ["@babel/preset-env", { "targets": { "node": "current" } }],
  //   '@babel/preset-typescript'
  //   // [
  //   //   "babel-preset-vite",
  //   //   {
  //   //     "env": true,
  //   //     "glob": false
  //   //   }
  //   // ]
  // ],
  "env": {
      "test": {
        "plugins": ["@babel/plugin-transform-modules-commonjs"]
      }
    }
  };
}
