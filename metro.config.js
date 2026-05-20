const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const expoRouterWebContextPath = path.join(__dirname, 'lib/router/expoRouterWebContext.js');
const expoNotificationsWebStubPath = path.join(__dirname, 'lib/notifications/expoNotificationsWebStub.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-notifications') {
    return {
      filePath: expoNotificationsWebStubPath,
      type: 'sourceFile',
    };
  }

  if (platform === 'web' && moduleName === 'expo-router/_ctx') {
    return {
      filePath: expoRouterWebContextPath,
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
