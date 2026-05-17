import { Tabs } from 'expo-router';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';

type TabRouteName = 'home' | 'learn' | 'practice' | 'exam' | 'mistakes' | 'profile';
type TabTitleCopy = Record<TabRouteName, string>;

const tabTitleCopy: Record<AppLanguage, TabTitleCopy> = {
  sv: {
    home: 'Hem',
    learn: 'Lär dig',
    practice: 'Öva',
    exam: 'Prov',
    mistakes: 'Misstag',
    profile: 'Profil',
  },
  en: {
    home: 'Home',
    learn: 'Learn',
    practice: 'Practice',
    exam: 'Exam',
    mistakes: 'Mistakes',
    profile: 'Profile',
  },
};

export default function TabsLayout() {
  const language = useSettingsStore((state) => state.language);
  const copy = tabTitleCopy[language];

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="home" options={{ title: copy.home }} />
      <Tabs.Screen name="learn" options={{ title: copy.learn }} />
      <Tabs.Screen name="practice" options={{ title: copy.practice }} />
      <Tabs.Screen name="exam" options={{ title: copy.exam }} />
      <Tabs.Screen name="mistakes" options={{ title: copy.mistakes }} />
      <Tabs.Screen name="profile" options={{ title: copy.profile }} />
    </Tabs>
  );
}
