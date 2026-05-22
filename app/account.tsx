import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/auth/Avatar';
import { deriveAuthDisplayInfo } from '../lib/auth/displayName';
import { useAuth } from '../lib/auth/AuthContext';
import { useRemoveAdsEntitlements } from '../lib/monetization/useRemoveAdsEntitlements';
import { RouteLink } from '../components/ui/RouteLink';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

export default function AccountScreen() {
  const { isAuthConfigured, signOut, status, user } = useAuth();
  const { entitlements } = useRemoveAdsEntitlements({ skipPurchaseRuntime: true });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const display = deriveAuthDisplayInfo(user);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/home');
    } catch (error) {
      Alert.alert('Sign-out failed', error instanceof Error ? error.message : String(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>Loading account...</Text>
      </View>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            Account is optional
          </Text>
          <Text style={styles.body}>
            You can use the study bank, track local progress, and keep purchases on this device
            without signing in.
          </Text>
          {!isAuthConfigured ? (
            <Text style={styles.status}>
              Sign-in is not configured on this build, so account features are unavailable.
            </Text>
          ) : null}
          <View style={styles.links}>
            <RouteLink
              accessibilityLabel="Open sign-in"
              href="/(auth)/sign-in"
              style={styles.link}
              variant="primary"
            >
              Sign in
            </RouteLink>
            <RouteLink
              accessibilityLabel="Continue to home without an account"
              href="/home"
              style={styles.link}
              variant="secondary"
            >
              Continue without an account
            </RouteLink>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <Avatar email={display.email} name={display.name} size={72} uri={display.avatarUrl} />
          <View style={styles.profileText}>
            <Text accessibilityRole="header" style={styles.title}>
              {display.name ?? display.email ?? 'Signed in'}
            </Text>
            {display.email ? <Text style={styles.body}>{display.email}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local study data stays local</Text>
        <Text style={styles.body}>
          This foundation does not upload study progress, bookmarks, mistakes, notes, or citizenship
          checklist items to Supabase. Account-backed sync can be added later behind an explicit
          product contract.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Purchases stay separate</Text>
        <Text style={styles.body}>
          Remove Ads is {entitlements.adsDisabled ? 'active' : 'not active'} on this device. The
          account session does not rename, merge, or replace Remove Ads or Pro entitlements.
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Sign out"
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut }}
        disabled={isSigningOut}
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.signOutButton,
          pressed ? styles.signOutButtonPressed : null,
        ]}
      >
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out...' : 'Sign out'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    body: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    card: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1.5],
      padding: space[2],
    },
    cardTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    centered: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      flex: 1,
      justifyContent: 'center',
      padding: space[3],
    },
    container: {
      backgroundColor: themeColors.surface,
      flex: 1,
    },
    content: {
      gap: space[2],
      padding: space[3],
      paddingBottom: space[10],
    },
    link: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: space[6],
    },
    links: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    profileRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: space[2],
    },
    profileText: {
      flex: 1,
      gap: space[0.5],
    },
    signOutButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.dangerSoft,
      borderColor: themeColors.danger,
      borderRadius: radius.button,
      borderWidth: space.hairline,
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
    },
    signOutButtonPressed: {
      borderColor: themeColors.focus,
    },
    signOutText: {
      color: themeColors.danger,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      lineHeight: typography.navButton.lineHeight,
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
