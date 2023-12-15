// SERVER BUILD WITH WEBPACK DOES NOT WORK, CONFIG HAS TO BE CORRECTED
// const path = require('path');
// require('@babel/register');
// module.exports = require('./config/webpack.entry');

import path from 'path';
// const nodeExternals = require('webpack-node-externals');
import nodeExternals from 'webpack-node-externals';
// import util from 'util';
// const util = require.resolve("util/");
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// module.exports = {
export default {
  mode:'development',
  target: "node",
  entry: './src/server.ts',
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: path.resolve(__dirname, 'dist'),
  },
  externalsPresets: { node: true },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: ["ts-loader"],
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
    ],
  },
  resolve: {
    roots: [
      path.resolve(__dirname, "src"),
   ],
    extensions: ['.tsx', '.ts', '.js', '.json'],
    fallback: {
      // util,
      "url": false,
      "path": false,
      "stream": false,
      "querystring": false,
      "http": false,
      sequelize: false,
      crypto: false,
      fs: false,
      zlib: false
    },
  },
  // externalsPresets: { node: undefined },
};