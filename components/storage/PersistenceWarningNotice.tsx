import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecoverablePersistenceWarning } from '../../lib/storage/persistenceWarning';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

export type PersistenceWarningNoticeCopy = {
  accessibilityLabel: string;
  body: string;
  dismiss: string;
  title: string;
};

export type PersistenceWarningNoticeScope =
  | 'accessibilityPreferences'
  | 'settingsPreferences'
  | 'studyData';

const persistenceWarningNoticeCopy: Record<
  AppLanguage,
  Record<
    PersistenceWarningNoticeScope,
    Record<RecoverablePersistenceWarning['operation'], PersistenceWarningNoticeCopy>
  >
> = {
  sv: {
    accessibilityPreferences: {
      read: {
        accessibilityLabel:
          'Tillgänglighetsinställningar kunde inte läsas. Appen använder standardinställningar i den här sessionen.',
        body: 'Tillgänglighetsinställningar kunde inte läsas. Appen använder standardinställningar för tema, text och ljud i den här sessionen tills lagringen fungerar igen.',
        dismiss: 'Jag förstår',
        title: 'Tillgänglighetsinställningar kunde inte läsas',
      },
      write: {
        accessibilityLabel:
          'Tillgänglighetsinställningar kunde inte sparas. Ändringen fungerar tillfälligt i den här sessionen.',
        body: 'Ändringen för tema, text eller ljud fungerar nu, men kunde inte sparas på enheten. Prova samma ändring igen när lagringen fungerar.',
        dismiss: 'Jag förstår',
        title: 'Inställningen sparades bara tillfälligt',
      },
    },
    settingsPreferences: {
      read: {
        accessibilityLabel:
          'Inställningar kunde inte läsas. Appen använder standardval i den här sessionen.',
        body: 'Sparade inställningar kunde inte läsas. Appen använder standardval för språk, ljud, dagligt mål och kompletterande frågor i den här sessionen tills lagringen fungerar igen.',
        dismiss: 'Jag förstår',
        title: 'Inställningar kunde inte läsas',
      },
      write: {
        accessibilityLabel:
          'Inställningen kunde inte sparas. Ändringen fungerar tillfälligt i den här sessionen.',
        body: 'Ändringen fungerar nu, men kunde inte sparas på enheten. Prova samma inställning igen när lagringen fungerar.',
        dismiss: 'Jag förstår',
        title: 'Inställningen sparades bara tillfälligt',
      },
    },
    studyData: {
      read: {
        accessibilityLabel:
          'Lokal studiedata kunde inte läsas. Appen använder ett tomt tillfälligt läge i den här sessionen.',
        body: 'Lokal studiedata kunde inte läsas. Appen använder ett tomt tillfälligt läge i den här sessionen tills lagringen fungerar igen.',
        dismiss: 'Jag förstår',
        title: 'Lokal studiedata kunde inte läsas',
      },
      write: {
        accessibilityLabel:
          'Sparningen misslyckades. Ändringen fungerar tillfälligt i den här sessionen.',
        body: 'Ändringen fungerar nu, men kunde inte sparas på enheten. Prova samma ändring igen när lagringen fungerar.',
        dismiss: 'Jag förstår',
        title: 'Sparades bara tillfälligt',
      },
    },
  },
  en: {
    accessibilityPreferences: {
      read: {
        accessibilityLabel:
          'Accessibility preferences could not be loaded. The app is using default preferences for this session.',
        body: 'Accessibility preferences could not be loaded. The app is using default theme, text, and audio preferences for this session until storage is available again.',
        dismiss: 'Got it',
        title: 'Accessibility preferences could not be loaded',
      },
      write: {
        accessibilityLabel:
          'Accessibility preferences could not be saved. The change is available temporarily in this session.',
        body: 'The theme, text, or audio change works now, but could not be saved on this device. Try the same change again when storage is available.',
        dismiss: 'Got it',
        title: 'Preference saved only for this session',
      },
    },
    settingsPreferences: {
      read: {
        accessibilityLabel:
          'Settings could not be loaded. The app is using default choices for this session.',
        body: 'Saved settings could not be loaded. The app is using default choices for language, audio, daily goal, and supplementary questions for this session until storage is available again.',
        dismiss: 'Got it',
        title: 'Settings could not be loaded',
      },
      write: {
        accessibilityLabel:
          'The setting could not be saved. The change is available temporarily in this session.',
        body: 'The change works now, but could not be saved on this device. Try the same setting again when storage is available.',
        dismiss: 'Got it',
        title: 'Setting saved only for this session',
      },
    },
    studyData: {
      read: {
        accessibilityLabel:
          'Local study data could not be loaded. The app is using empty in-memory state for this session.',
        body: 'Local study data could not be loaded. The app is using empty in-memory study data for this session until storage is available again.',
        dismiss: 'Got it',
        title: 'Local study data could not be loaded',
      },
      write: {
        accessibilityLabel: 'Saving failed. The change is available temporarily in this session.',
        body: 'The change works now, but could not be saved on this device. Try the same change again when storage is available.',
        dismiss: 'Got it',
        title: 'Saved only for this session',
      },
    },
  },
};

export function getPersistenceWarningNoticeCopy({
  language,
  operation,
  warningScope = 'studyData',
}: {
  language: AppLanguage;
  operation: RecoverablePersistenceWarning['operation'];
  warningScope?: PersistenceWarningNoticeScope;
}): PersistenceWarningNoticeCopy {
  return persistenceWarningNoticeCopy[language][warningScope][operation];
}

type PersistenceWarningNoticeProps = {
  language: AppLanguage;
  onDismiss: () => void;
  warningScope?: PersistenceWarningNoticeScope;
  warning: RecoverablePersistenceWarning | null;
};

export function PersistenceWarningNotice({
  language,
  onDismiss,
  warningScope = 'studyData',
  warning,
}: PersistenceWarningNoticeProps) {
  if (!warning) return null;

  const copy = getPersistenceWarningNoticeCopy({
    language,
    operation: warning.operation,
    warningScope,
  });

  return (
    <View
      accessible
      accessibilityLabel={copy.accessibilityLabel}
      accessibilityRole="alert"
      style={styles.notice}
    >
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      <Pressable
        accessibilityLabel={copy.dismiss}
        accessibilityRole="button"
        hitSlop={space[1]}
        onPress={onDismiss}
        style={({ pressed }) => [styles.dismissButton, pressed ? styles.dismissPressed : null]}
      >
        <Text style={styles.dismissText}>{copy.dismiss}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[0.75],
    padding: space[1.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyTight.lineHeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  dismissButton: {
    alignSelf: 'flex-start',
    borderColor: colors.warning,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  dismissPressed: {
    backgroundColor: colors.surface,
  },
  dismissText: {
    color: colors.warning,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
