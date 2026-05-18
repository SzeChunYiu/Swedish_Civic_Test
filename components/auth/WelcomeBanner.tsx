import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth/AuthContext';
import { deriveDisplayInfo } from '../../lib/auth/displayName';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

const DISMISSED_KEY = 'welcomeBannerDismissedFor';

function readDismissed(): string | null {
  if (typeof globalThis === 'undefined') return null;
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage?.getItem(DISMISSED_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeDismissed(userId: string) {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    storage?.setItem(DISMISSED_KEY, userId);
  } catch {
    /* no-op */
  }
}

type WelcomeBannerCopy = {
  greeting: (firstName?: string | null) => string;
  body: string;
  dismissLabel: string;
  dismissText: string;
};

const welcomeBannerCopy: Record<AppLanguage, WelcomeBannerCopy> = {
  sv: {
    greeting: (firstName) => (firstName ? `Välkommen, ${firstName}!` : 'Välkommen!'),
    body: 'Dina framsteg synkas nu mellan enheter. Annonsfri åtkomst kopplas också till ditt konto.',
    dismissLabel: 'Stäng välkomstmeddelandet',
    dismissText: 'Jag förstår',
  },
  en: {
    greeting: (firstName) => (firstName ? `Welcome, ${firstName}!` : 'Welcome!'),
    body: 'Your progress now syncs across devices. Ad-free access is also linked to your account.',
    dismissLabel: 'Dismiss welcome banner',
    dismissText: 'Got it',
  },
};

/**
 * Auth success banner. Defaults to the current settings language unless a
 * caller provides `languageOverride` for previews or focused tests.
 */
export interface WelcomeBannerProps {
  languageOverride?: AppLanguage;
}

export function WelcomeBanner({ languageOverride }: WelcomeBannerProps = {}) {
  const { status, user } = useAuth();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = welcomeBannerCopy[language];
  const info = deriveDisplayInfo(user);
  const [dismissedFor, setDismissedFor] = useState<string | null>(() => readDismissed());

  useEffect(() => {
    setDismissedFor(readDismissed());
  }, [user]);

  if (status !== 'authenticated' || !user) return null;
  if (dismissedFor === user.id) return null;

  const greeting = copy.greeting(info.firstName);

  const handleDismiss = () => {
    writeDismissed(user.id);
    setDismissedFor(user.id);
  };

  return (
    <View
      accessibilityLabel={`${greeting} ${copy.body}`}
      accessibilityRole="alert"
      style={styles.banner}
    >
      <View style={styles.textColumn}>
        <Text style={styles.title}>{greeting}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>
      <Pressable
        accessibilityLabel={copy.dismissLabel}
        accessibilityRole="button"
        hitSlop={space[1]}
        onPress={handleDismiss}
        style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
      >
        <Text style={styles.dismissText}>{copy.dismissText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'flex-start',
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space[1.5],
    padding: space[2],
  },
  textColumn: {
    flex: 1,
    gap: space[0.5],
  },
  title: {
    color: colors.badgeBlueText,
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  dismissButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  dismissButtonPressed: {
    backgroundColor: colors.accentActive,
  },
  dismissText: {
    color: colors.surface,
    fontFamily: typography.navButton.fontFamily,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
