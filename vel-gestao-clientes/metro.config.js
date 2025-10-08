const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurações para melhor compatibilidade web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.alias = {
  'react-native$': 'react-native-web',
};

// Configurações para resolver problemas de módulos ES6
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;