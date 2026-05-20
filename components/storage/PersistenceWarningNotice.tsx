import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecoverablePersistenceWarning } from '../../lib/storage/persistenceWarning';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type PersistenceWarningNoticeCopy = {
  accessibilityLabel: string;
  body: string;
  dismiss: string;
  title: string;
};

const persistenceWarningNoticeCopy: Record<AppLanguage, PersistenceWarningNoticeCopy> = {
  sv: {
    accessibilityLabel:
      'Sparningen misslyckades. Ändringen fungerar tillfälligt i den här sessionen.',
    body: 'Ändringen fungerar nu, men kunde inte sparas på enheten. Prova samma ändring igen när lagringen fungerar.',
    dismiss: 'Jag förstår',
    title: 'Sparades bara tillfälligt',
  },
  en: {
    accessibilityLabel: 'Saving failed. The change is available temporarily in this session.',
    body: 'The change works now, but could not be saved on this device. Try the same change again when storage is available.',
    dismiss: 'Got it',
    title: 'Saved only for this session',
  },
};

type PersistenceWarningNoticeProps = {
  language: AppLanguage;
  onDismiss: () => void;
  warning: RecoverablePersistenceWarning | null;
};

export function PersistenceWarningNotice({
  language,
  onDismiss,
  warning,
}: PersistenceWarningNoticeProps) {
  if (!warning) return null;

  const copy = persistenceWarningNoticeCopy[language];

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
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
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
