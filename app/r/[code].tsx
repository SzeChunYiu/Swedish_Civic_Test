import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isReferralCode, normalizeReferralCode } from '../../lib/referral/generateCode';
import { storePendingReferralCode } from '../../lib/referral/pendingReferralStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type ReferralLinkStatus = 'checking' | 'ready' | 'invalid' | 'unavailable';

const copy = {
  body: 'Sign in with an optional account to redeem it. You can still keep studying without an account.',
  continueLocal: 'Continue without an account',
  invalid: 'This referral link is not valid.',
  ready: 'Referral code saved',
  signIn: 'Continue to sign-in',
  title: 'Referral invite',
  unavailable: 'This build cannot save referral links right now.',
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function ReferralInviteScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const rawCode = firstParam(params.code);
  const normalizedCode = normalizeReferralCode(rawCode);
  const validCode = isReferralCode(normalizedCode);
  const [status, setStatus] = useState<ReferralLinkStatus>(validCode ? 'checking' : 'invalid');
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  useEffect(() => {
    let mounted = true;

    if (!validCode) {
      setStatus('invalid');
      return () => {
        mounted = false;
      };
    }

    void storePendingReferralCode(normalizedCode)
      .then((storedCode) => {
        if (!mounted) return;
        setStatus(storedCode ? 'ready' : 'unavailable');
      })
      .catch(() => {
        if (mounted) setStatus('unavailable');
      });

    return () => {
      mounted = false;
    };
  }, [normalizedCode, validCode]);

  const statusText =
    status === 'ready'
      ? `${copy.ready}: ${normalizedCode}`
      : status === 'invalid'
        ? copy.invalid
        : status === 'unavailable'
          ? copy.unavailable
          : 'Saving referral code...';

  return (
    <View style={styles.screen} testID="referral-invite-screen">
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.status}>{statusText}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={status !== 'ready'}
            onPress={() => router.replace('/(auth)/sign-in')}
            style={({ pressed }) => [
              styles.primaryButton,
              status !== 'ready' ? styles.disabledButton : null,
              pressed && status === 'ready' ? styles.pressedButton : null,
            ]}
            testID="referral-sign-in"
          >
            <Text style={styles.primaryButtonText}>{copy.signIn}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/home')}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressedButton : null]}
            testID="referral-continue-local"
          >
            <Text style={styles.secondaryButtonText}>{copy.continueLocal}</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
    disabledButton: {
      opacity: 0.5,
    },
    pressedButton: {
      opacity: 0.86,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: themeColors.accent,
      borderRadius: radius.button,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: space[2],
      paddingVertical: space[1.5],
    },
    primaryButtonText: {
      color: themeColors.surface,
      fontSize: typography.body.fontSize,
      fontWeight: '700',
      lineHeight: typography.body.lineHeight,
    },
    screen: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      flex: 1,
      justifyContent: 'center',
      padding: space[3],
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.button,
      borderWidth: space.hairline,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: space[2],
      paddingVertical: space[1.5],
    },
    secondaryButtonText: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: '700',
      lineHeight: typography.body.lineHeight,
    },
    status: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: '700',
      lineHeight: typography.body.lineHeight,
    },
    title: {
      color: themeColors.text,
      fontSize: typography.sectionHeading.fontSize,
      fontWeight: typography.sectionHeading.fontWeight,
      lineHeight: typography.sectionHeading.lineHeight,
    },
  });
}
