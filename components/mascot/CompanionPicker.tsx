import { useRef } from 'react';
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

type FocusableElement = { focus?: () => void };
type KeyboardEventLike = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};
type WebRadioKeyboardProps = {
  onKeyDown?: (event: KeyboardEventLike) => void;
  tabIndex?: 0 | -1;
};

function getRadioArrowDirection(event: KeyboardEventLike): -1 | 1 | null {
  const key = event.nativeEvent?.key ?? event.key;
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return null;
}

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
  const mascots = getCompanionPickerMascots();
  const optionRefs = useRef<Record<string, FocusableElement | null>>({});

  const handleRadioGroupKeyDown = (event: KeyboardEventLike) => {
    const direction = getRadioArrowDirection(event);
    if (!direction || mascots.length === 0) return;

    event.preventDefault?.();
    const currentIndex = mascots.findIndex((mascot) => mascot.id === selectedId);
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + direction + mascots.length) % mascots.length
        : direction > 0
          ? 0
          : mascots.length - 1;
    const nextId = mascots[nextIndex].id;

    onSelect(nextId);
    optionRefs.current[nextId]?.focus?.();
  };

  const getWebRadioKeyboardProps = (selected: boolean): WebRadioKeyboardProps =>
    Platform.OS === 'web'
      ? {
          onKeyDown: handleRadioGroupKeyDown,
          tabIndex: selected ? 0 : -1,
        }
      : {};

  return (
    <View
      aria-label={copy.groupLabel}
      accessibilityLabel={copy.groupLabel}
      accessibilityRole="radiogroup"
      style={styles.grid}
    >
      {mascots.map((mascot) => {
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
            aria-checked={selected}
            aria-label={accessibilityLabel}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onSelect(mascot.id)}
            ref={(node) => {
              optionRefs.current[mascot.id] = node as FocusableElement | null;
            }}
            style={({ pressed }) => [
              styles.option,
              selected ? styles.optionSelected : null,
              pressed ? styles.optionPressed : null,
            ]}
            {...getWebRadioKeyboardProps(selected)}
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
