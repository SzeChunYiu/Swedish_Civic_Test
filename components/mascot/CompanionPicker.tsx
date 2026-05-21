import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  FAVORITE_COMPANION_IDS,
  getCompanionPickerMascots,
  type MascotDescriptor,
  type MascotId,
} from '../../lib/mascot/catalog';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type CompanionPickerCopy = {
  favoriteBadge: string;
  groupLabel: string;
  selectedBadge: string;
  selectLabel: (label: string, anchor: string) => string;
  selectedLabel: (label: string, anchor: string) => string;
};

const companionPickerCopy: Record<AppLanguage, CompanionPickerCopy> = {
  sv: {
    favoriteBadge: 'Favorit',
    groupLabel: 'Välj studiekompis',
    selectedBadge: 'Vald',
    selectLabel: (label, anchor) => `Välj ${label} som studiekompis. ${anchor}`,
    selectedLabel: (label, anchor) => `${label} är vald som studiekompis. ${anchor}`,
  },
  en: {
    favoriteBadge: 'Favorite',
    groupLabel: 'Choose study companion',
    selectedBadge: 'Selected',
    selectLabel: (label, anchor) => `Choose ${label} as study companion. ${anchor}`,
    selectedLabel: (label, anchor) => `${label} is selected as study companion. ${anchor}`,
  },
};
const favoriteCompanionIds: readonly MascotId[] = FAVORITE_COMPANION_IDS;

type CompanionPickerProps = {
  language: AppLanguage;
  onSelect: (id: MascotId) => void;
  selectedId: MascotId;
};

function mascotLabel(mascot: MascotDescriptor, language: AppLanguage) {
  return language === 'sv' ? mascot.labelSv : mascot.labelEn;
}

function mascotAnchor(mascot: MascotDescriptor, language: AppLanguage) {
  return language === 'sv' ? mascot.anchorSv : mascot.anchorEn;
}

export function CompanionPicker({ language, onSelect, selectedId }: CompanionPickerProps) {
  const copy = companionPickerCopy[language];

  return (
    <View
      aria-label={copy.groupLabel}
      accessibilityLabel={copy.groupLabel}
      accessibilityRole="radiogroup"
      style={styles.grid}
    >
      {getCompanionPickerMascots().map((mascot) => {
        const label = mascotLabel(mascot, language);
        const anchor = mascotAnchor(mascot, language);
        const selected = mascot.id === selectedId;
        const favorite = favoriteCompanionIds.includes(mascot.id);
        const accessibilityLabel = selected
          ? copy.selectedLabel(label, anchor)
          : copy.selectLabel(label, anchor);

        return (
          <Pressable
            key={mascot.id}
            aria-checked={selected}
            aria-label={accessibilityLabel}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onSelect(mascot.id)}
            style={({ pressed }) => [
              styles.option,
              selected ? styles.optionSelected : null,
              pressed ? styles.optionPressed : null,
            ]}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.label}>{label}</Text>
              {favorite ? <Text style={styles.badge}>{copy.favoriteBadge}</Text> : null}
            </View>
            <Text style={styles.anchor}>{anchor}</Text>
            {selected ? <Text style={styles.selected}>{copy.selectedBadge}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: space[1],
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[0.75],
    minHeight: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.25],
  },
  optionSelected: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.accent,
  },
  optionPressed: {
    backgroundColor: colors.surfaceWarm,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1],
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  badge: {
    color: colors.badgeBlueText,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  anchor: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  selected: {
    color: colors.accent,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
});
