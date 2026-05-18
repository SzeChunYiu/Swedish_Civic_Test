import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { colors, radius, space, typography } from '../../lib/theme';

export default function SignInScreen() {
  const { signInWithGoogle, signInWithFacebook, signInWithApple } = useAuth();
  const [busy, setBusy] = useState<null | 'google' | 'facebook' | 'apple'>(null);

  const wrap = (label: 'google' | 'facebook' | 'apple', fn: () => Promise<void>) => async () => {
    setBusy(label);
    try {
      await fn();
      router.back();
    } catch (err) {
      Alert.alert('Sign-in failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          Optional. Sign in to sync your progress across devices and keep Remove-Ads tied to your
          account.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: busy !== null, busy: busy === 'google' }}
          onPress={wrap('google', signInWithGoogle)}
          disabled={busy !== null}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          accessibilityState={{ disabled: busy !== null, busy: busy === 'facebook' }}
          onPress={wrap('facebook', signInWithFacebook)}
          disabled={busy !== null}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>
            {busy === 'facebook' ? 'Opening Facebook…' : 'Continue with Facebook'}
          </Text>
        </Pressable>

        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.small}
            style={styles.appleButton}
            onPress={wrap('apple', signInWithApple)}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue without signing in"
          onPress={() => router.back()}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Continue without signing in</Text>
        </Pressable>
      </View>
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[2],
    maxWidth: 420,
    padding: space[4],
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginBottom: space[1],
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.small,
    paddingVertical: space[1.75],
  },
  buttonPressed: {
    backgroundColor: colors.accentActive,
  },
  buttonText: {
    color: colors.surface,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  appleButton: {
    height: space[6],
    width: '100%',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: space[1.5],
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: typography.captionLight.fontFamily,
    fontSize: typography.captionLight.fontSize,
  },
});
