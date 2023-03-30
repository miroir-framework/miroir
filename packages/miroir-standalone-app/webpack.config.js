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
      util: require.resolve("util/"),
      // path: require.resolve(__dirname,"../../node-modules/path-browserify"),
      // "miroir-datastore-postgres": false,
      process: require.resolve("process/browser"),
      sequelize: false,
      // path: false,
      // util: false,
      crypto: false,
      fs: false
    },
  },
  mode:'development',
  target:'web',
  // externalsPresets: { node: undefined },
  externals: [nodeExternals()],
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: path.resolve(__dirname, 'dist'),
    // libraryTarget: 'umd',
  },
};