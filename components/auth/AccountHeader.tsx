import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../../lib/auth/displayName';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import { Avatar } from './Avatar';

type AccountHeaderCopy = {
  loadingLabel: string;
  signInLabel: string;
  signInAccessibilityLabel: string;
  syncedLabel: string;
  accountFallback: string;
  accountAccessibilityLabel: (name: string) => string;
};

const accountHeaderCopy: Record<AppLanguage, AccountHeaderCopy> = {
  sv: {
    loadingLabel: 'Kontot laddas',
    signInLabel: 'Logga in',
    signInAccessibilityLabel: 'Logga in för att synkronisera dina framsteg',
    syncedLabel: 'Synkat',
    accountFallback: 'ditt konto',
    accountAccessibilityLabel: (name) => `Öppna konto för ${name}`,
  },
  en: {
    loadingLabel: 'Loading account',
    signInLabel: 'Sign in',
    signInAccessibilityLabel: 'Sign in to sync your progress',
    syncedLabel: 'Synced',
    accountFallback: 'your account',
    accountAccessibilityLabel: (name) => `Open account for ${name}`,
  },
};

/**
 * Header account affordance. Defaults to the current settings language unless
 * a caller provides `languageOverride` for previews or focused tests.
 */
export interface AccountHeaderProps {
  languageOverride?: AppLanguage;
}

export function AccountHeader({ languageOverride }: AccountHeaderProps = {}) {
  const { status, user } = useAuth();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = accountHeaderCopy[language];
  const info = deriveDisplayInfo(user);

  if (status === 'loading') {
    return (
      <View accessibilityLabel={copy.loadingLabel} accessibilityRole="header" style={styles.row}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText} />
      </View>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <Link
        accessibilityLabel={copy.signInAccessibilityLabel}
        accessibilityRole="link"
        href="/(auth)/sign-in"
        style={styles.signInPill}
      >
        {copy.signInLabel}
      </Link>
    );
  }

  const accountName = info.name ?? info.email ?? copy.accountFallback;

  return (
    <Link
      accessibilityLabel={copy.accountAccessibilityLabel(accountName)}
      accessibilityRole="link"
      href="/account"
      style={styles.row}
    >
      <Avatar uri={info.avatarUrl} name={info.name} email={info.email} size={32} />
      <View style={styles.textColumn}>
        <Text numberOfLines={1} style={styles.name}>
          {info.firstName ?? info.email}
        </Text>
        <Text numberOfLines={1} style={styles.subtext}>
          {copy.syncedLabel}
        </Text>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space[1],
    paddingHorizontal: space[0.75],
    paddingVertical: space[0.5],
  },
  textColumn: {
    paddingRight: space[1],
  },
  name: {
    color: colors.text,
    fontFamily: typography.captionLight.fontFamily,
    fontSize: typography.captionLight.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  subtext: {
    color: colors.success,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
  },
  signInPill: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
    textDecorationLine: 'none',
  },
  skeletonAvatar: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 32,
    width: 32,
  },
  skeletonText: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    height: space[1.5],
    width: space[8],
  },
});
