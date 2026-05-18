import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AccountHeader } from '../auth/AccountHeader';
import { space } from '../../lib/theme';
import { LanguageToggle } from './LanguageToggle';
import { SettingsIcon } from './icons/SettingsIcon';

export function TopBarActions() {
  return (
    <View style={styles.row}>
      <LanguageToggle />
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
    gap: space[1],
    paddingHorizontal: space[1.5],
  },
  iconLink: {
    padding: space[0.5],
  },
});
