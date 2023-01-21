const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './server.js',
  resolve: {
    roots: [
      path.resolve(__dirname, "src"),
   ],
    extensions: ['.tsx', '.ts', '.js', 'json'],
  },
  mode:'development',
  // externalsPresets: { node: undefined },
  externals: [nodeExternals()],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};