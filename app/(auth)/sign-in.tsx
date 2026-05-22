import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthProviderButton } from '../../components/auth/AuthProviderButton';
import { GoogleLogo } from '../../components/auth/GoogleLogo';
import { useAuth, type AuthProviderId } from '../../lib/auth/AuthContext';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

const copy = {
  apple: 'Continue with Apple',
  body: 'Optional accounts are for future sync and account-backed features. Practice, local progress, Remove Ads, and Pro purchases keep working without sign-in.',
  continueWithout: 'Continue without an account',
  google: 'Continue with Google',
  loading: 'Opening sign-in...',
  title: 'Sign in or keep studying locally',
  unavailable:
    'Account sign-in is not configured for this build. You can continue without an account.',
};

export default function SignInScreen() {
  const { isAuthConfigured, signInWithApple, signInWithGoogle } = useAuth();
  const [busyProvider, setBusyProvider] = useState<AuthProviderId | null>(null);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const handleProviderPress = (provider: AuthProviderId) => async () => {
    setBusyProvider(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithApple();
    } catch (error) {
      Alert.alert('Sign-in unavailable', error instanceof Error ? error.message : copy.unavailable);
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card} testID="optional-sign-in-card">
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.body}>{copy.body}</Text>
        {!isAuthConfigured ? <Text style={styles.status}>{copy.unavailable}</Text> : null}

        <View style={styles.actions}>
          <AuthProviderButton
            disabled={busyProvider !== null}
            icon={<GoogleLogo />}
            label={busyProvider === 'google' ? copy.loading : copy.google}
            onPress={handleProviderPress('google')}
            testID="sign-in-google"
          />
          <AuthProviderButton
            disabled={busyProvider !== null}
            label={busyProvider === 'apple' ? copy.loading : copy.apple}
            onPress={handleProviderPress('apple')}
            testID="sign-in-apple"
          />
          <AuthProviderButton
            disabled={busyProvider !== null}
            label={copy.continueWithout}
            onPress={() => router.replace('/home')}
            testID="sign-in-anonymous"
          />
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    actions: {
      gap: space[1],
    },
    body: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    card: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: space.hairline,
      gap: space[2],
      maxWidth: 520,
      padding: space[3],
      width: '100%',
    },
    container: {
      backgroundColor: themeColors.surface,
      flex: 1,
    },
    content: {
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center',
      padding: space[3],
      paddingBottom: space[10],
    },
    status: {
      backgroundColor: themeColors.warningSoft,
      borderColor: themeColors.warning,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      color: themeColors.warning,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      padding: space[1.5],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.sectionHeading.fontSize,
      fontWeight: typography.sectionHeading.fontWeight,
      lineHeight: typography.sectionHeading.lineHeight,
    },
  });
}
