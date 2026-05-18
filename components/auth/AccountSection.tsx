import { Link } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRemoteEntitlement } from '../../lib/auth/entitlements';

export function AccountSection() {
  const { status, user, signOut } = useAuth();
  const { entitlement } = useRemoteEntitlement();

  if (status === 'loading') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.subtitle}>Checking sign-in status…</Text>
      </View>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.subtitle}>
          Sign in to sync your progress across devices and tie Remove-Ads to your account.
        </Text>
        <Link
          accessibilityLabel="Sign in"
          accessibilityRole="link"
          href="/(auth)/sign-in"
          style={styles.primaryButton}
        >
          Sign in
        </Link>
      </View>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Sign-out failed', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      <Text style={styles.subtitle}>Signed in as {user.email ?? user.id}</Text>
      <Text style={styles.subtitle}>
        Remove-Ads: {entitlement.removeAds ? 'active' : 'not active'}
      </Text>
      <Pressable
        accessibilityLabel="Sign out"
        accessibilityRole="button"
        onPress={handleSignOut}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
