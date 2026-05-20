import { Tabs, usePathname } from 'expo-router';

import { TabBarIcon, type TabBarIconName } from '../../components/ui/icons/TabBarIcon';
import { colors } from '../../lib/theme';
import { TopBarActions } from '../../components/ui/TopBarActions';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';

type TabRouteName = 'home' | 'learn' | 'practice' | 'exam' | 'mistakes' | 'profile';
type TabTitleCopy = Record<TabRouteName, string>;
type TabIconMap = Record<TabRouteName, TabBarIconName>;
type TabPathMap = Record<TabRouteName, string>;

const tabIconMap: TabIconMap = {
  home: 'home',
  learn: 'learn',
  practice: 'practice',
  exam: 'exam',
  mistakes: 'mistakes',
  profile: 'profile',
};

const tabPathMap: TabPathMap = {
  home: '/home',
  learn: '/learn',
  practice: '/practice',
  exam: '/exam',
  mistakes: '/mistakes',
  profile: '/profile',
};

function isActiveTab(routeName: TabRouteName, pathname: string) {
  return pathname === tabPathMap[routeName];
}

function TabRouteIcon({ routeName, size }: { routeName: TabRouteName; size: number }) {
  const pathname = usePathname();

  return (
    <TabBarIcon
      focused={isActiveTab(routeName, pathname)}
      name={tabIconMap[routeName]}
      size={size}
    />
  );
}

function getTabOptions(routeName: TabRouteName, title: string) {
  return {
    title,
    tabBarAccessibilityLabel: title,
    tabBarIcon: ({ size }: { color: string; focused: boolean; size: number }) => (
      <TabRouteIcon routeName={routeName} size={size} />
    ),
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
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen name="home" options={getTabOptions('home', copy.home)} />
      <Tabs.Screen name="learn" options={getTabOptions('learn', copy.learn)} />
      <Tabs.Screen name="practice" options={getTabOptions('practice', copy.practice)} />
      <Tabs.Screen name="exam" options={getTabOptions('exam', copy.exam)} />
      <Tabs.Screen name="mistakes" options={getTabOptions('mistakes', copy.mistakes)} />
      <Tabs.Screen name="profile" options={getTabOptions('profile', copy.profile)} />
    </Tabs>
  );
}
