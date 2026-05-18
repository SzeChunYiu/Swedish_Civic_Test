import { Link, usePathname } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

/**
 * Suppress on routes where a blocking modal would be hostile to flow:
 * - exam routes (timed)
 * - quiz mid-session
 * - auth modals
 * - the about-the-test screen itself (otherwise the modal sits on top of the page it sends you to)
 */
const SUPPRESSED_PATH_PREFIXES = ['/exam', '/quiz', '/(auth)', '/about-the-test'] as const;

type FirstRunCopy = {
  eyebrow: string;
  title: string;
  body: string;
  open: string;
  openAccessibilityLabel: string;
  skip: string;
  skipAccessibilityLabel: string;
};

const firstRunCopy: Record<AppLanguage, FirstRunCopy> = {
  sv: {
    eyebrow: 'Välkommen',
    title: 'Vad är medborgarskapsprovet?',
    body: 'En kort guide till vad provet är, vem som ska göra det och hur det här studieverktyget förhåller sig till UHR:s officiella material.',
    open: 'Läs guiden',
    openAccessibilityLabel: 'Öppna om-provet-guiden',
    skip: 'Hoppa över',
    skipAccessibilityLabel: 'Hoppa över guiden',
  },
  en: {
    eyebrow: 'Welcome',
    title: 'What is the Swedish civic test?',
    body: "A short guide to what the test is, who takes it, and how this study tool relates to UHR's official material.",
    open: 'Read the guide',
    openAccessibilityLabel: 'Open the about-the-test guide',
    skip: 'Skip',
    skipAccessibilityLabel: 'Skip the guide',
  },
};

function pathIsSuppressed(pathname: string | null): boolean {
  if (!pathname) return false;
  return SUPPRESSED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function FirstRunAboutTheTestModal() {
  const pathname = usePathname();
  const language = useSettingsStore((state) => state.language);
  const hasSeen = useSettingsStore((state) => state.hasSeenAboutTheTest);
  const markSeen = useSettingsStore((state) => state.markAboutTheTestSeen);

  if (hasSeen) return null;
  if (pathIsSuppressed(pathname)) return null;

  const copy = firstRunCopy[language];

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={markSeen}
      accessibilityLabel={copy.title}
    >
      <Pressable
        accessibilityLabel={copy.skipAccessibilityLabel}
        accessibilityRole="button"
        onPress={markSeen}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityRole="none"
          accessibilityLabel={copy.title}
          onPress={(event) => event.stopPropagation()}
          style={styles.card}
        >
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title}
          </Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.actions}>
            <Link
              accessibilityLabel={copy.openAccessibilityLabel}
              accessibilityRole="link"
              href="/about-the-test"
              onPress={markSeen}
              style={styles.primaryLink}
            >
              {copy.open}
            </Link>
            <Pressable
              accessibilityLabel={copy.skipAccessibilityLabel}
              accessibilityRole="button"
              onPress={markSeen}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>{copy.skip}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
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
    maxWidth: 480,
    padding: space[3],
    width: '100%',
  },
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.25],
    marginTop: space[1],
  },
  primaryLink: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryButton: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
