import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType, ViewStyle } from 'react-native';

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
  selectedBadge: string;
  selectLabel: (label: string, anchor: string) => string;
  selectedLabel: (label: string, anchor: string) => string;
};

const companionPickerCopy: Record<AppLanguage, CompanionPickerCopy> = {
  sv: {
    favoriteBadge: 'Favorit',
    selectedBadge: 'Vald',
    selectLabel: (label, anchor) => `Välj ${label} som studiekompis. ${anchor}`,
    selectedLabel: (label, anchor) => `${label} är vald som studiekompis. ${anchor}`,
  },
  en: {
    favoriteBadge: 'Favorite',
    selectedBadge: 'Selected',
    selectLabel: (label, anchor) => `Choose ${label} as study companion. ${anchor}`,
    selectedLabel: (label, anchor) => `${label} is selected as study companion. ${anchor}`,
  },
};
const favoriteCompanionIds: readonly MascotId[] = FAVORITE_COMPANION_IDS;

const companionPreviewSources = {
  'dala-horse': require('../../assets/mascot/dala-horse/idle.svg'),
  kanelbulle: require('../../assets/mascot/kanelbulle/idle.svg'),
  skoglimpa: require('../../assets/mascot/skoglimpa/idle.svg'),
  moose: require('../../assets/mascot/moose/idle.svg'),
  tomte: require('../../assets/mascot/tomte/idle.svg'),
  salmon: require('../../assets/mascot/salmon/idle.svg'),
  'fika-cup': require('../../assets/mascot/fika-cup/idle.svg'),
  'vasa-ship': require('../../assets/mascot/vasa-ship/idle.svg'),
  'midsummer-pole': require('../../assets/mascot/midsummer-pole/idle.svg'),
  lucia: require('../../assets/mascot/lucia/idle.svg'),
  snowman: require('../../assets/mascot/snowman/idle.svg'),
} as const satisfies Record<MascotId, ImageSourcePropType>;

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

function companionPreviewSource(mascotId: MascotId) {
  const source = companionPreviewSources[mascotId];

  if (typeof source === 'object' && source !== null && 'uri' in source) {
    return { uri: source.uri };
  }

  return source;
}

function companionPreviewUri(mascotId: MascotId) {
  const source = companionPreviewSources[mascotId];

  return typeof source === 'object' && source !== null && 'uri' in source ? source.uri : undefined;
}

function webPreviewImageStyle(uri: string): ViewStyle {
  return {
    backgroundImage: `url(${uri})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
  } as ViewStyle;
}

export function CompanionPicker({ language, onSelect, selectedId }: CompanionPickerProps) {
  const copy = companionPickerCopy[language];

  return (
    <View style={styles.grid}>
      {getCompanionPickerMascots().map((mascot) => {
        const label = mascotLabel(mascot, language);
        const anchor = mascotAnchor(mascot, language);
        const selected = mascot.id === selectedId;
        const favorite = favoriteCompanionIds.includes(mascot.id);
        const previewUri = companionPreviewUri(mascot.id);
        const accessibilityLabel = selected
          ? copy.selectedLabel(label, anchor)
          : copy.selectLabel(label, anchor);

        return (
          <Pressable
            key={mascot.id}
            aria-label={accessibilityLabel}
            aria-selected={selected}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(mascot.id)}
            style={({ pressed }) => [
              styles.option,
              selected ? styles.optionSelected : null,
              pressed ? styles.optionPressed : null,
            ]}
          >
            <View style={styles.optionBody}>
              <View
                accessibilityElementsHidden
                aria-hidden={true}
                importantForAccessibility="no-hide-descendants"
                style={styles.preview}
                testID={`companion-preview-${mascot.id}`}
              >
                {Platform.OS === 'web' && previewUri ? (
                  <View style={[styles.previewImage, webPreviewImageStyle(previewUri)]} />
                ) : (
                  <Image
                    accessible={false}
                    resizeMode="contain"
                    source={companionPreviewSource(mascot.id)}
                    style={styles.previewImage}
                  />
                )}
              </View>
              <View style={styles.optionText}>
                <View style={styles.optionHeader}>
                  <Text style={styles.label}>{label}</Text>
                  {favorite ? <Text style={styles.badge}>{copy.favoriteBadge}</Text> : null}
                </View>
                <Text style={styles.anchor}>{anchor}</Text>
                {selected ? <Text style={styles.selected}>{copy.selectedBadge}</Text> : null}
              </View>
            </View>
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
  optionBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.25],
  },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.card,
    flexShrink: 0,
    height: space[6],
    justifyContent: 'center',
    overflow: 'hidden',
    width: space[6],
  },
  previewImage: {
    height: space[5],
    width: space[5],
  },
  optionText: {
    flex: 1,
    gap: space[0.75],
    minWidth: 0,
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
