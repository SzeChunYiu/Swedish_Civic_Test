import '@expo/metro-runtime';

import React from 'react';
import { ExpoRoot } from 'expo-router';
import Head from 'expo-router/head';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

const ctx = require.context(
  './app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*\.[tj]sx?$/,
);

function App() {
  return React.createElement(
    Head.Provider,
    null,
    React.createElement(ExpoRoot, {
      context: ctx,
    }),
  );
}

renderRootComponent(App);
