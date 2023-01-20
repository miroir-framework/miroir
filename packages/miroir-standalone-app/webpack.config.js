const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ["ts-loader"],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    roots: [
      path.resolve(__dirname, "src"),
   ],
    extensions: ['.tsx', '.ts', '.js', 'json'],
    fallback: {
      util: require.resolve("util/")
    },
  },
  mode:'development',
  // externalsPresets: { node: undefined },
  externals: [nodeExternals()],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};