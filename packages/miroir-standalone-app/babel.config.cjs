module.exports = api => {
  const isTest = api.env('test');
  // You can use isTest to determine what presets and plugins to use.
  console.log('########################################################')
  return {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
  "env": {
      "test": {
        "plugins": ["@babel/plugin-transform-modules-commonjs"]
      }
    }
  };
}
