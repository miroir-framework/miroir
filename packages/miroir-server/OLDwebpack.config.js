const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = { //not called in package.json
  entry: './server.js',
  resolve: {
    roots: [
      path.resolve(__dirname, "src"),
   ],
    extensions: ['.tsx', '.ts', '.js', 'json'],
  },
  mode:'development',
  externals: [nodeExternals()],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};