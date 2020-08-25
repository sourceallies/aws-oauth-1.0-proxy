const path = require('path');

const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './app.js',
  externals: [
    nodeExternals({
      whitelist: [
        'chance',
        'coveralls',
        'dotenv',
        'eslint',
        'eslint-plugin-jest',
        'jest',
        'webpack',
        'webpack-cli',
        'webpack-command',
      ],
    }),
  ],
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.js$/,
      },
    ],
  },
  output: {
    filename: 'index.js',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, './'),
  },
  target: 'node',
};
