import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { motion, radius, space, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
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
  styles: TopBarStyles;
  themeColors: ThemeColors;
};

type TopBarAudioSwitchProps = {
  accessibilityLabel: string;
  audioEnabled: boolean;
  iconSize: number;
  onToggle: () => void;
  styles: TopBarStyles;
  themeColors: ThemeColors;
};

type TopBarStyles = ReturnType<typeof createStyles>;

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
const keyboardActivationKeys = new Set(['Enter', ' ', 'Spacebar']);
const topBarActionLinkClassName = 'top-bar-action-link';
const topBarActionLinkStyleElementId = 'top-bar-action-link-style';

function isKeyboardActivationKey(key: string | undefined) {
  return key ? keyboardActivationKeys.has(key) : false;
}

function useTopBarActionLinkWebStyles(themeColors: ThemeColors) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let styleElement = document.getElementById(topBarActionLinkStyleElementId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = topBarActionLinkStyleElementId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
.${topBarActionLinkClassName} {
  -webkit-tap-highlight-color: transparent;
  transition: transform ${motion.duration.fast}ms ${motion.easing.press};
}

.${topBarActionLinkClassName}.${topBarActionLinkClassName}:hover,
.${topBarActionLinkClassName}.${topBarActionLinkClassName}:focus,
.${topBarActionLinkClassName}.${topBarActionLinkClassName}:focus-visible {
  background-color: ${themeColors.focusSoft};
  transform: scale(${motion.hoverScale});
}

.${topBarActionLinkClassName}.${topBarActionLinkClassName}:active {
  background-color: ${themeColors.focusSoft};
  transform: scale(${motion.pressedScale});
}

@media (prefers-reduced-motion: reduce) {
  .${topBarActionLinkClassName} {
    transition: none;
  }

  .${topBarActionLinkClassName}.${topBarActionLinkClassName}:hover,
  .${topBarActionLinkClassName}.${topBarActionLinkClassName}:focus,
  .${topBarActionLinkClassName}.${topBarActionLinkClassName}:focus-visible,
  .${topBarActionLinkClassName}.${topBarActionLinkClassName}:active {
    transform: none;
  }
}
`;
  }, [themeColors.focusSoft]);
}

/**
 * Defaults: reads language and audio state from settings, renders token-sized
 * header actions with localized labels and 48px touch targets.
 */
export interface TopBarActionsProps {
  iconSize?: number;
}

export function TopBarActions({ iconSize = defaultIconSize }: TopBarActionsProps = {}) {
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = topBarActionsCopy[language];

  return (
    <View style={styles.row}>
      <LanguagePicker themeColors={themeColors} />
      <TopBarAudioSwitch
        accessibilityLabel={audioEnabled ? copy.audioEnabled : copy.audioMuted}
        audioEnabled={audioEnabled}
        iconSize={iconSize}
        onToggle={() => setAudioEnabled(!audioEnabled)}
        styles={styles}
        themeColors={themeColors}
      />
      <TopBarActionLink
        href="/search"
        accessibilityLabel={copy.search}
        styles={styles}
        themeColors={themeColors}
      >
        <SearchIcon size={iconSize} color={themeColors.text} />
      </TopBarActionLink>
      <TopBarActionLink
        href="/mistakes"
        accessibilityLabel={copy.savedQuestions}
        styles={styles}
        themeColors={themeColors}
      >
        <BookmarkIcon size={iconSize} color={themeColors.text} />
      </TopBarActionLink>
      <TopBarActionLink
        href="/settings"
        accessibilityLabel={copy.settings}
        styles={styles}
        themeColors={themeColors}
      >
        <SettingsIcon size={iconSize} color={themeColors.text} />
      </TopBarActionLink>
    </View>
  );
}

function TopBarAudioSwitch({
  accessibilityLabel,
  audioEnabled,
  iconSize,
  onToggle,
  styles,
  themeColors,
}: TopBarAudioSwitchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const interactionHandlers = {
    onBlur: () => {
      setIsFocused(false);
      setIsPressed(false);
    },
    onFocus: () => setIsFocused(true),
    onHoverIn: () => setIsHovered(true),
    onHoverOut: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
  };

  return (
    <Pressable
      {...interactionHandlers}
      aria-checked={audioEnabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: audioEnabled }}
      hitSlop={space[1]}
      onPress={onToggle}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.iconButton,
        isFocused || isHovered
          ? reduceMotion
            ? styles.iconButtonHoverReducedMotion
            : styles.iconButtonHover
          : null,
        isPressed
          ? reduceMotion
            ? styles.iconButtonPressedReducedMotion
            : styles.iconButtonPressed
          : null,
      ]}
    >
      <AudioIcon size={iconSize} color={themeColors.text} muted={!audioEnabled} />
    </Pressable>
  );
}

function TopBarActionLink({
  accessibilityLabel,
  children,
  href,
  styles,
  themeColors,
}: TopBarActionLinkProps) {
  useTopBarActionLinkWebStyles(themeColors);

  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const webClassName =
    Platform.OS === 'web'
      ? {
          className: topBarActionLinkClassName,
        }
      : {};
  const interactionHandlers = {
    onBlur: () => {
      setIsFocused(false);
      setIsPressed(false);
    },
    onFocus: () => setIsFocused(true),
    onKeyDown: (event: { key?: string }) => {
      if (isKeyboardActivationKey(event.key)) setIsPressed(true);
    },
    onKeyUp: (event: { key?: string }) => {
      if (isKeyboardActivationKey(event.key)) setIsPressed(false);
    },
    onMouseDown: () => setIsPressed(true),
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseUp: () => setIsPressed(false),
    onTouchCancel: () => setIsPressed(false),
    onTouchEnd: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
  };

  return (
    <Link
      {...interactionHandlers}
      {...webClassName}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      href={href}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.iconLink,
        isFocused || isHovered
          ? reduceMotion
            ? styles.iconLinkHoverReducedMotion
            : styles.iconLinkHover
          : null,
        isPressed
          ? reduceMotion
            ? styles.iconLinkPressedReducedMotion
            : styles.iconLinkPressed
          : null,
      ]}
    >
      {children}
    </Link>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: space[0.75],
      paddingHorizontal: space[1.5],
    },
    iconButton: {
      alignItems: 'center',
      borderRadius: radius.pill,
      display: 'flex',
      flexShrink: 0,
      height: space[6],
      justifyContent: 'center',
      minHeight: space[6],
      minWidth: space[6],
      width: space[6],
    },
    iconButtonHover: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.hoverScale }],
    },
    iconButtonHoverReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    iconButtonPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    iconButtonPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    iconLink: {
      alignItems: 'center',
      borderRadius: radius.pill,
      display: 'flex',
      flexShrink: 0,
      height: space[6],
      justifyContent: 'center',
      minHeight: space[6],
      minWidth: space[6],
      width: space[6],
    },
    iconLinkHover: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.hoverScale }],
    },
    iconLinkHoverReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    iconLinkPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    iconLinkPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
  });
}
