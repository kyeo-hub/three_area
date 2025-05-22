const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: {
    app: ['@babel/polyfill', './src/app.js'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        },
      },
      // Shaders
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader'],
      },
    ],
  },
  plugins: [new CompressionPlugin()],
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, ''),
      watch: true,
    },
    compress: true,
    port: 8089,
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
  node: {
    global: true,
    __filename: 'mock',
    __dirname: 'mock'
  },
};
