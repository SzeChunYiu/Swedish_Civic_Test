import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSettingsStore } from '../../lib/storage/settingsStore';
import { space } from '../../lib/theme';
import { AccountHeader } from '../auth/AccountHeader';
import { LanguagePicker } from './LanguagePicker';
import { AudioIcon } from './icons/AudioIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';

export function TopBarActions() {
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);

  return (
    <View style={styles.row}>
      <LanguagePicker />
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={audioEnabled ? 'Audio enabled, tap to mute' : 'Audio muted, tap to enable'}
        accessibilityState={{ checked: audioEnabled }}
        onPress={() => setAudioEnabled(!audioEnabled)}
        style={styles.iconButton}
      >
        <AudioIcon size={22} muted={!audioEnabled} />
      </Pressable>
      <Link
        accessibilityLabel="Search"
        accessibilityRole="link"
        href="/search"
        style={styles.iconLink}
      >
        <SearchIcon size={22} />
      </Link>
      <Link
        accessibilityLabel="Open saved questions"
        accessibilityRole="link"
        href="/mistakes"
        style={styles.iconLink}
      >
        <BookmarkIcon size={22} />
      </Link>
      <Link
        accessibilityLabel="Open settings"
        accessibilityRole="link"
        href="/settings"
        style={styles.iconLink}
      >
        <SettingsIcon size={22} />
      </Link>
      <AccountHeader />
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
