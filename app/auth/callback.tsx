import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { colors, space, typography } from '../../lib/theme';

export default function AuthCallbackScreen() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/(tabs)/home');
    } else if (status === 'anonymous') {
      router.replace('/(auth)/sign-in');
    }
  }, [status]);

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Completing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    flex: 1,
    justifyContent: 'center',
    padding: space[3],
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
});
