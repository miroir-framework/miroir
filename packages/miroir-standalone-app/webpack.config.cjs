const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.tsx?$/,
        use: ["ts-loader"],
        exclude: /node_modules/,
      }
  ],
    // noParse: [require.resolve('typescript/lib/typescript.js')],
  },
  resolve: {
    roots: [
      path.resolve(__dirname, "src"),
   ],
    extensions: ['.tsx', '.ts', '.js', '.json'],
    fallback: {
      util: require.resolve("util/"),
      process: require.resolve("process/browser"),
      sequelize: false,
      crypto: false,
      fs: false
    },
  },
  mode:'development',
  target:'web',
  // externalsPresets: { node: true },
  externals: [nodeExternals()],
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: path.resolve(__dirname, 'dist'),
  },
};