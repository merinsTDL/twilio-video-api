const path = require('path');

module.exports = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  entry: {
    app: './src/app.ts',
    foo: './src/admin.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist'),
  },
  devtool: 'inline-source-map',
  devServer: {
    https: false,
    contentBase: './dist',
    proxy: {
      '/token': 'http://localhost:3000',
      '/getCreds': 'http://localhost:3000',
      '/settings': 'http://localhost:9000'
    }
  }
};
