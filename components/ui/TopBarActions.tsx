import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useSettingsStore } from '../../lib/storage/settingsStore';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space } from '../../lib/theme';
import { LanguagePicker } from './LanguagePicker';
import { AudioIcon } from './icons/AudioIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';

type TopBarActionsCopy = {
  audioEnabled: string;
  audioMuted: string;
  savedQuestions: string;
  search: string;
  settings: string;
};

type TopBarActionLinkProps = {
  accessibilityLabel: string;
  children: ReactNode;
  href: Href;
};

type TopBarAudioSwitchProps = {
  accessibilityLabel: string;
  audioEnabled: boolean;
  iconSize: number;
  onToggle: () => void;
};

const topBarActionsCopy: Record<AppLanguage, TopBarActionsCopy> = {
  sv: {
    audioEnabled: 'Ljud är på, tryck för att stänga av',
    audioMuted: 'Ljud är avstängt, tryck för att slå på',
    savedQuestions: 'Öppna sparade frågor',
    search: 'Sök',
    settings: 'Öppna inställningar',
  },
  en: {
    audioEnabled: 'Audio enabled, tap to mute',
    audioMuted: 'Audio muted, tap to enable',
    savedQuestions: 'Open saved questions',
    search: 'Search',
    settings: 'Open settings',
  },
};

const defaultIconSize = space[3];
const topBarActionLinkClassName = 'top-bar-action-link';
const topBarActionLinkStyleElementId = 'top-bar-action-link-style';

function useTopBarActionLinkWebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById(topBarActionLinkStyleElementId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = topBarActionLinkStyleElementId;
    styleElement.textContent = `
.${topBarActionLinkClassName}:hover,
.${topBarActionLinkClassName}:focus-visible {
  background-color: ${colors.focusSoft};
  transform: scale(${motion.hoverScale});
}

.${topBarActionLinkClassName}:active {
  background-color: ${colors.focusSoft};
  transform: scale(${motion.pressedScale});
}
`;
    document.head.appendChild(styleElement);
  }, []);
}

/**
 * Defaults: reads language and audio state from settings, renders token-sized
 * header actions with localized labels and 48px touch targets.
 */
export interface TopBarActionsProps {
  iconSize?: number;
}

export function TopBarActions({ iconSize = defaultIconSize }: TopBarActionsProps = {}) {
  useTopBarActionLinkWebStyles();

  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const copy = topBarActionsCopy[language];

  return (
    <View style={styles.row}>
      <LanguagePicker />
      <TopBarAudioSwitch
        accessibilityLabel={audioEnabled ? copy.audioEnabled : copy.audioMuted}
        audioEnabled={audioEnabled}
        iconSize={iconSize}
        onToggle={() => setAudioEnabled(!audioEnabled)}
      />
      <TopBarActionLink href="/search" accessibilityLabel={copy.search}>
        <SearchIcon size={iconSize} />
      </TopBarActionLink>
      <TopBarActionLink href="/mistakes" accessibilityLabel={copy.savedQuestions}>
        <BookmarkIcon size={iconSize} />
      </TopBarActionLink>
      <TopBarActionLink href="/settings" accessibilityLabel={copy.settings}>
        <SettingsIcon size={iconSize} />
      </TopBarActionLink>
    </View>
  );
}

function TopBarAudioSwitch({
  accessibilityLabel,
  audioEnabled,
  iconSize,
  onToggle,
}: TopBarAudioSwitchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: () => setIsFocused(false),
          onFocus: () => setIsFocused(true),
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => {
            setIsHovered(false);
            setIsPressed(false);
          },
        }
      : {};

  return (
    <Pressable
      {...webInteractionHandlers}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: audioEnabled }}
      hitSlop={space[1]}
      onPress={onToggle}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.iconButton,
        isFocused || isHovered ? styles.iconButtonHover : null,
        isPressed ? styles.iconButtonPressed : null,
      ]}
    >
      <AudioIcon size={iconSize} muted={!audioEnabled} />
    </Pressable>
  );
}

function TopBarActionLink({ accessibilityLabel, children, href }: TopBarActionLinkProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const webInteractionHandlers =
    Platform.OS === 'web'
      ? {
          onBlur: () => setIsFocused(false),
          onFocus: () => setIsFocused(true),
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => {
            setIsHovered(false);
            setIsPressed(false);
          },
        }
      : {};

  return (
    <Link
      {...webInteractionHandlers}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      href={href}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.iconLink,
        isFocused || isHovered ? styles.iconLinkHover : null,
        isPressed ? styles.iconLinkPressed : null,
      ]}
    >
      {children}
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[0.75],
    paddingHorizontal: space[1.5],
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: space[6],
    minWidth: space[6],
  },
  iconButtonHover: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.hoverScale }],
  },
  iconButtonPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  iconLink: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: space[6],
    minWidth: space[6],
  },
  iconLinkHover: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.hoverScale }],
  },
  iconLinkPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
});
