import { Tabs } from 'expo-router';
import type { ComponentType } from 'react';

import {
  ExamTabIcon,
  HomeTabIcon,
  LearnTabIcon,
  MistakesTabIcon,
  PracticeTabIcon,
  ProfileTabIcon,
  type TabBarIconProps,
} from '../../components/ui/icons/TabBarIcons';
import { TopBarActions } from '../../components/ui/TopBarActions';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space } from '../../lib/theme';

type TabRouteName = 'home' | 'learn' | 'practice' | 'exam' | 'mistakes' | 'profile';
type TabTitleCopy = Record<TabRouteName, string>;
type TabIconComponent = ComponentType<TabBarIconProps>;

const tabIconByRoute: Record<TabRouteName, TabIconComponent> = {
  home: HomeTabIcon,
  learn: LearnTabIcon,
  practice: PracticeTabIcon,
  exam: ExamTabIcon,
  mistakes: MistakesTabIcon,
  profile: ProfileTabIcon,
};

function getTabOptions(routeName: TabRouteName, title: string) {
  const TabIcon = tabIconByRoute[routeName];

  return {
    title,
    tabBarAccessibilityLabel: title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <TabIcon color={focused ? colors.accent : colors.textMuted} size={space[3]} />
    ),
  };
}

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
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <TopBarActions />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
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
