import { Redirect } from 'expo-router';

import HomeScreen from './(tabs)/home';

function isFileProtocolWebExport() {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

export default function NotFoundScreen() {
  if (isFileProtocolWebExport()) {
    return <HomeScreen />;
  }

  return <Redirect href="/home" />;
}
