import '@expo/metro-runtime';

import { ExpoRoot } from 'expo-router';
import { Head } from 'expo-router/build/head';
import 'expo-router/build/fast-refresh';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

const ctx = require.context(
  './app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+middleware)|(?:\+(html|native-intent))))\.[tj]sx?$).*(?:\.android|\.ios|\.native)?\.[tj]sx?$/,
  process.env.EXPO_ROUTER_IMPORT_MODE,
);

export function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}

renderRootComponent(App);
