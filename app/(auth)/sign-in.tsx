import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FacebookLogo } from '../../components/auth/FacebookLogo';
import { GoogleLogo } from '../../components/auth/GoogleLogo';
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
          Optional. Sync your progress across devices and tie Remove-Ads to your account.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: busy !== null, busy: busy === 'google' }}
          onPress={wrap('google', signInWithGoogle)}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.providerButton,
            styles.googleButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <GoogleLogo size={20} />
          <Text style={styles.googleText}>
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          accessibilityState={{ disabled: busy !== null, busy: busy === 'facebook' }}
          onPress={wrap('facebook', signInWithFacebook)}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.providerButton,
            styles.facebookButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <FacebookLogo size={20} />
          <Text style={styles.facebookText}>
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

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue without signing in"
          onPress={() => router.back()}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Continue without signing in</Text>
        </Pressable>

        <Text style={styles.fineprint}>
          By signing in you accept our terms and privacy policy. We never receive your password.
        </Text>
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
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    maxWidth: 420,
    padding: space[4],
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginBottom: space[1],
  },
  providerButton: {
    alignItems: 'center',
    borderRadius: radius.small,
    flexDirection: 'row',
    gap: space[1.5],
    justifyContent: 'center',
    paddingVertical: space[1.5],
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  facebookButton: {
    backgroundColor: colors.brandFacebook,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  googleText: {
    color: colors.text,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  facebookText: {
    color: colors.surface,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  appleButton: {
    height: space[6],
    width: '100%',
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1],
    marginTop: space[0.5],
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: colors.textMuted,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    letterSpacing: typography.micro.letterSpacing,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: space[1],
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: typography.captionLight.fontFamily,
    fontSize: typography.captionLight.fontSize,
  },
  fineprint: {
    color: colors.textMuted,
    fontFamily: typography.disclaimer.fontFamily,
    fontSize: typography.disclaimer.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
    textAlign: 'center',
  },
});
