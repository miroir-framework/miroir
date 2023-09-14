// SERVER BUILD WITH WEBPACK DOES NOT WORK, CONFIG HAS TO BE CORRECTED
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
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
      util: require.resolve("util/"),
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