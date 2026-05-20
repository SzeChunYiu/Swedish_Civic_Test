import { Tabs } from 'expo-router';

import { TopBarActions } from '../../components/ui/TopBarActions';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';

type TabRouteName = 'home' | 'learn' | 'practice' | 'exam' | 'mistakes' | 'profile';
type TabTitleCopy = Record<TabRouteName, string>;

const hiddenTabIcon = () => null;

function getTabOptions(title: string) {
  return {
    title,
    tabBarAccessibilityLabel: title,
    tabBarIcon: hiddenTabIcon,
  };
}

const tabTitleCopy: Record<AppLanguage, TabTitleCopy> = {
  sv: {
    home: 'Hem',
    learn: 'Lär dig',
    practice: 'Öva',
    exam: 'Övningsprov',
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
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <TopBarActions />,
      }}
    >
      <Tabs.Screen name="home" options={getTabOptions(copy.home)} />
      <Tabs.Screen name="learn" options={getTabOptions(copy.learn)} />
      <Tabs.Screen name="practice" options={getTabOptions(copy.practice)} />
      <Tabs.Screen name="exam" options={getTabOptions(copy.exam)} />
      <Tabs.Screen name="mistakes" options={getTabOptions(copy.mistakes)} />
      <Tabs.Screen name="profile" options={getTabOptions(copy.profile)} />
    </Tabs>
  );
}
