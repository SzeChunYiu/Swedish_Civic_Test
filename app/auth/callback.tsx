import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

export default function AuthCallbackScreen() {
  const { status } = useAuth();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/account');
    if (status === 'anonymous') router.replace('/(auth)/sign-in');
  }, [status]);

  return (
    <View style={styles.screen} testID="auth-callback">
      <Text accessibilityRole="header" style={styles.text}>
        Completing sign-in...
      </Text>
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      flex: 1,
      justifyContent: 'center',
      padding: space[3],
    },
    text: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
  });
}
