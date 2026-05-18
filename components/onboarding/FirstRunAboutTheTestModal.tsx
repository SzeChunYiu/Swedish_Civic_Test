import { usePathname, useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';

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

/**
 * Defaults: uses the settings-store language and first-run flag, suppresses
 * exam/quiz/auth/about routes, and dismisses after backdrop, skip, hardware
 * back, or guide-open actions.
 */
export interface FirstRunAboutTheTestModalProps {
  languageOverride?: AppLanguage;
  suppressedPathPrefixes?: readonly string[];
}

function pathIsSuppressed(
  pathname: string | null,
  suppressedPathPrefixes: readonly string[],
): boolean {
  if (!pathname) return false;
  return suppressedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function FirstRunAboutTheTestModal({
  languageOverride,
  suppressedPathPrefixes = SUPPRESSED_PATH_PREFIXES,
}: FirstRunAboutTheTestModalProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const hasSeen = useSettingsStore((state) => state.hasSeenAboutTheTest);
  const markSeen = useSettingsStore((state) => state.markAboutTheTestSeen);

  if (hasSeen) return null;
  if (pathIsSuppressed(pathname, suppressedPathPrefixes)) return null;

  const language = languageOverride ?? settingsLanguage;
  const copy = firstRunCopy[language];
  const handleOpenGuide = () => {
    markSeen();
    router.push('/about-the-test');
  };

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
        hitSlop={space[1]}
        onPress={markSeen}
        style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
      >
        <Pressable
          accessibilityRole="none"
          accessibilityLabel={copy.title}
          hitSlop={space[0]}
          onPress={(event) => event.stopPropagation()}
          style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
        >
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title}
          </Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={copy.openAccessibilityLabel}
              accessibilityRole="link"
              hitSlop={space[1]}
              onPress={handleOpenGuide}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{copy.open}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={copy.skipAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={space[1]}
              onPress={markSeen}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.secondaryButtonPressed : null,
              ]}
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
  backdropPressed: {
    backgroundColor: colors.focusSoft,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1.5],
    maxWidth: 480,
    padding: space[3],
    width: '100%',
  },
  cardPressed: {
    transform: [{ scale: motion.pressedScale }],
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: radius.micro,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  secondaryButtonPressed: {
    backgroundColor: colors.surfaceWarm,
    transform: [{ scale: motion.pressedScale }],
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
