import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSettingsStore } from '../../lib/storage/settingsStore';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { space } from '../../lib/theme';
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

export function TopBarActions() {
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const copy = topBarActionsCopy[language];

  return (
    <View style={styles.row}>
      <LanguagePicker />
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={audioEnabled ? copy.audioEnabled : copy.audioMuted}
        accessibilityState={{ checked: audioEnabled }}
        onPress={() => setAudioEnabled(!audioEnabled)}
        style={styles.iconButton}
      >
        <AudioIcon size={22} muted={!audioEnabled} />
      </Pressable>
      <Link
        accessibilityLabel={copy.search}
        accessibilityRole="link"
        href="/search"
        style={styles.iconLink}
      >
        <SearchIcon size={22} />
      </Link>
      <Link
        accessibilityLabel={copy.savedQuestions}
        accessibilityRole="link"
        href="/mistakes"
        style={styles.iconLink}
      >
        <BookmarkIcon size={22} />
      </Link>
      <Link
        accessibilityLabel={copy.settings}
        accessibilityRole="link"
        href="/settings"
        style={styles.iconLink}
      >
        <SettingsIcon size={22} />
      </Link>
    </View>
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
    padding: space[0.5],
  },
  iconLink: {
    padding: space[0.5],
  },
});
