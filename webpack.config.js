const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add rule for vector icons
  config.module.rules.push({
    test: /\.ttf$/,
    loader: 'file-loader',
    include: path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
  });

  return config;
}; 