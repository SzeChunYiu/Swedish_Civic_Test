import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../../lib/auth/displayName';
import { useRemoteEntitlement } from '../../lib/auth/entitlements';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import { Avatar } from './Avatar';

type AccountSectionCopy = {
  accountTitle: string;
  loadingSubtitle: string;
  signInTitle: string;
  signInSubtitle: string;
  signInLabel: string;
  signInAccessibilityLabel: string;
  accountFallback: string;
  accountAccessibilityLabel: (name: string) => string;
  removeAdsActiveLabel: string;
  manageAccountLabel: string;
};

const accountSectionCopy: Record<AppLanguage, AccountSectionCopy> = {
  sv: {
    accountTitle: 'Konto',
    loadingSubtitle: 'Kontrollerar inloggningsstatus…',
    signInTitle: 'Logga in',
    signInSubtitle:
      'Synkronisera dina framsteg mellan enheter och koppla annonsfri åtkomst till ditt konto. Det är valfritt; appen fungerar även utan konto.',
    signInLabel: 'Logga in',
    signInAccessibilityLabel: 'Öppna inloggning',
    accountFallback: 'ditt konto',
    accountAccessibilityLabel: (name) => `Öppna konto för ${name}`,
    removeAdsActiveLabel: 'Annonsfritt · aktivt',
    manageAccountLabel: 'Hantera konto →',
  },
  en: {
    accountTitle: 'Account',
    loadingSubtitle: 'Checking sign-in status…',
    signInTitle: 'Sign in',
    signInSubtitle:
      'Sync your progress across devices and link ad-free access to your account. This is optional; the app still works without an account.',
    signInLabel: 'Sign in',
    signInAccessibilityLabel: 'Open sign-in',
    accountFallback: 'your account',
    accountAccessibilityLabel: (name) => `Open account for ${name}`,
    removeAdsActiveLabel: 'Ad-free · active',
    manageAccountLabel: 'Manage account →',
  },
};

/**
 * Account settings surface. Defaults to the current settings language unless
 * a caller provides `languageOverride` for previews or focused tests.
 */
export interface AccountSectionProps {
  languageOverride?: AppLanguage;
}

export function AccountSection({ languageOverride }: AccountSectionProps = {}) {
  const { status, user } = useAuth();
  const { entitlement } = useRemoteEntitlement();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = accountSectionCopy[language];
  const info = deriveDisplayInfo(user);

  if (status === 'loading') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.accountTitle}</Text>
        <Text style={styles.subtitle}>{copy.loadingSubtitle}</Text>
      </View>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.signInTitle}</Text>
        <Text style={styles.subtitle}>{copy.signInSubtitle}</Text>
        <Link
          accessibilityLabel={copy.signInAccessibilityLabel}
          accessibilityRole="link"
          href="/(auth)/sign-in"
          style={styles.primaryButton}
        >
          {copy.signInLabel}
        </Link>
      </View>
    );
  }

  const accountName = info.name ?? info.email ?? copy.accountFallback;

  return (
    <Link
      accessibilityLabel={copy.accountAccessibilityLabel(accountName)}
      accessibilityRole="link"
      href="/account"
      style={styles.linkSection}
    >
      <View style={styles.row}>
        <Avatar uri={info.avatarUrl} name={info.name} email={info.email} size={48} />
        <View style={styles.textColumn}>
          <Text numberOfLines={1} style={styles.name}>
            {info.name ?? info.email}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {entitlement.removeAds ? copy.removeAdsActiveLabel : copy.manageAccountLabel}
          </Text>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    padding: space[2],
  },
  linkSection: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[2],
    textDecorationLine: 'none',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
  },
  textColumn: {
    flex: 1,
    gap: space[0.5],
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  name: {
    color: colors.text,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    overflow: 'hidden',
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
