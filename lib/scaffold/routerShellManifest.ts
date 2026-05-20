export type ExpoRouterShellRole =
  | 'initial-redirect'
  | 'root-layout'
  | 'not-found-route'
  | 'web-document'
  | 'native-intent';

export type ExpoRouterShellFile = {
  readonly file: string;
  readonly role: ExpoRouterShellRole;
  readonly purpose: string;
};

export type ExpoRouterRootStackScreen = {
  readonly name: string;
  readonly file: string;
  readonly purpose: string;
};

export type ExpoRouterTabScreen = {
  readonly name: string;
  readonly file: string;
  readonly copyKey: string;
  readonly purpose: string;
};

export type ExpoRouterDynamicRoute = {
  readonly name: string;
  readonly file: string;
  readonly hrefSample: string;
  readonly purpose: string;
};

export type ExpoRouterRootLayoutGlobalPlacement = {
  readonly name: string;
  readonly file: string;
  readonly importFrom: string;
  readonly contractSnippet: string;
  readonly purpose: string;
};

export type ExpoRouterNativeIntentDynamicRoute = {
  readonly route: string;
  readonly routeFile: string;
  readonly patternName: string;
  readonly samplePath: string;
};

export type ExpoRouterNativeIntentRuntimeSample = {
  readonly input: string;
  readonly expectedPath: string;
};

export type ExpoRouterWebDocumentMetaDescription = {
  readonly language: 'sv' | 'en';
  readonly description: string;
};

export type ExpoRouterStandaloneRoute = {
  readonly name: string;
  readonly file: string;
  readonly href: string;
  readonly purpose: string;
};

export const expoRouterShellFiles = [
  {
    file: 'app/index.tsx',
    role: 'initial-redirect',
    purpose: 'Initial Expo Router redirect into the Home tab shell',
  },
  {
    file: 'app/_layout.tsx',
    role: 'root-layout',
    purpose: 'Expo Router stack, theme shell, launch placement, and native canvas color',
  },
  {
    file: 'app/+not-found.tsx',
    role: 'not-found-route',
    purpose: 'Safe Home redirect for unknown links with a file-export fallback',
  },
  {
    file: 'app/+html.tsx',
    role: 'web-document',
    purpose: 'Swedish Expo web document metadata and React Native web reset',
  },
  {
    file: 'app/+native-intent.ts',
    role: 'native-intent',
    purpose: 'Native deep-link normalization with a safe Home fallback',
  },
] as const satisfies readonly ExpoRouterShellFile[];

export const expoRouterShellRecoveryHrefs = ['/home'] as const;

export const expoRouterRootStackScreens = [
  {
    name: 'index',
    file: 'app/index.tsx',
    purpose: 'Initial redirect screen registered in the root stack',
  },
  {
    name: '(tabs)',
    file: 'app/(tabs)/_layout.tsx',
    purpose: 'Primary tab shell registered in the root stack',
  },
  {
    name: 'search',
    file: 'app/search.tsx',
    purpose: 'Search route registered in the root stack',
  },
  {
    name: 'dashboard',
    file: 'app/dashboard.tsx',
    purpose: 'Progress dashboard route registered in the root stack',
  },
  {
    name: 'citizenship-requirements',
    file: 'app/citizenship-requirements.tsx',
    purpose: 'Citizenship requirements guide route registered in the root stack',
  },
  {
    name: '+not-found',
    file: 'app/+not-found.tsx',
    purpose: 'Unknown-route recovery screen registered in the root stack',
  },
] as const satisfies readonly ExpoRouterRootStackScreen[];

export const expoRouterTabScreens = [
  {
    name: 'home',
    file: 'app/(tabs)/home.tsx',
    copyKey: 'home',
    purpose: 'Home screen registered in the primary tab shell',
  },
  {
    name: 'learn',
    file: 'app/(tabs)/learn.tsx',
    copyKey: 'learn',
    purpose: 'Learn screen registered in the primary tab shell',
  },
  {
    name: 'practice',
    file: 'app/(tabs)/practice.tsx',
    copyKey: 'practice',
    purpose: 'Practice screen registered in the primary tab shell',
  },
  {
    name: 'exam',
    file: 'app/(tabs)/exam.tsx',
    copyKey: 'exam',
    purpose: 'Exam screen registered in the primary tab shell',
  },
  {
    name: 'mistakes',
    file: 'app/(tabs)/mistakes.tsx',
    copyKey: 'mistakes',
    purpose: 'Mistakes screen registered in the primary tab shell',
  },
  {
    name: 'profile',
    file: 'app/(tabs)/profile.tsx',
    copyKey: 'profile',
    purpose: 'Profile screen registered in the primary tab shell',
  },
] as const satisfies readonly ExpoRouterTabScreen[];

export const expoRouterDynamicRoutes = [
  {
    name: 'chapter/[chapterId]',
    file: 'app/chapter/[chapterId].tsx',
    hrefSample: '/chapter/ch01',
    purpose: 'Chapter detail route registered by Expo Router file routing',
  },
  {
    name: 'quiz/[sessionId]',
    file: 'app/quiz/[sessionId].tsx',
    hrefSample: '/quiz/q001',
    purpose: 'Routed quiz session registered by Expo Router file routing',
  },
] as const satisfies readonly ExpoRouterDynamicRoute[];

export const expoRouterRootLayoutGlobalPlacements = [
  {
    name: 'native-canvas-color',
    file: 'app/_layout.tsx',
    importFrom: 'expo-system-ui',
    contractSnippet: 'SystemUI.setBackgroundColorAsync(colors.canvas)',
    purpose: 'Native root shell background follows the tokenized canvas color',
  },
  {
    name: 'launch-popup-ad',
    file: 'app/_layout.tsx',
    importFrom: '../components/monetization/LaunchPopupAd',
    contractSnippet: 'LaunchPopupAd entitlements={monetizationEntitlements}',
    purpose: 'Global launch placement stays mounted outside exam-suppressed routes',
  },
  {
    name: 'expo-status-bar',
    file: 'app/_layout.tsx',
    importFrom: 'expo-status-bar',
    contractSnippet: 'StatusBar style=',
    purpose: 'Expo status bar remains part of the root shell chrome',
  },
] as const satisfies readonly ExpoRouterRootLayoutGlobalPlacement[];

export const expoRouterNativeIntentStaticRoutes = [
  '/',
  '/about-the-test',
  '/citizenship-requirements',
  '/dashboard',
  '/disclaimer',
  '/exam',
  '/home',
  '/learn',
  '/mistakes',
  '/onboarding',
  '/practice',
  '/privacy',
  '/profile',
  '/settings',
  '/sources',
  '/support',
  '/terms',
] as const;

export const expoRouterNativeIntentDynamicRoutes = [
  {
    route: '/chapter/[chapterId]',
    routeFile: 'app/chapter/[chapterId].tsx',
    patternName: 'chapterRoutePattern',
    samplePath: '/chapter/ch01',
  },
  {
    route: '/quiz/[sessionId]',
    routeFile: 'app/quiz/[sessionId].tsx',
    patternName: 'quizRoutePattern',
    samplePath: '/quiz/q001',
  },
] as const satisfies readonly ExpoRouterNativeIntentDynamicRoute[];

export const expoRouterNativeIntentRuntimeSamples = [
  {
    input: '   ',
    expectedPath: '/home',
  },
  {
    input: '/practice?mode=review#question',
    expectedPath: '/practice?mode=review#question',
  },
  {
    input: '/about-the-test',
    expectedPath: '/about-the-test',
  },
  {
    input: '/citizenship-requirements',
    expectedPath: '/citizenship-requirements',
  },
  {
    input: '/dashboard',
    expectedPath: '/dashboard',
  },
  {
    input: '/dashboard?from=home',
    expectedPath: '/dashboard?from=home',
  },
  {
    input: 'almost-swedish://app/chapter/ch01?from=learn',
    expectedPath: '/chapter/ch01?from=learn',
  },
  {
    input: 'almost-swedish://app/about-the-test',
    expectedPath: '/about-the-test',
  },
  {
    input: 'almost-swedish://app/citizenship-requirements',
    expectedPath: '/citizenship-requirements',
  },
  {
    input: 'almost-swedish://app/search?q=riksdag',
    expectedPath: '/search?q=riksdag',
  },
  {
    input: 'almost-swedish://quiz/q001',
    expectedPath: '/quiz/q001',
  },
  {
    input: 'almost-swedish://app/not-real',
    expectedPath: '/home',
  },
] as const satisfies readonly ExpoRouterNativeIntentRuntimeSample[];

export const expoRouterNativeIntentConfigFiles = ['app.json', 'app/+native-intent.ts'] as const;

export const expoRouterWebDocumentMetaDescriptions = [
  {
    language: 'sv',
    description: 'Öva svensk samhällskunskap med offlinequiz, lokala framsteg och källreferenser.',
  },
  {
    language: 'en',
    description:
      'Practice Swedish civic knowledge with offline quizzes, local progress, and source references.',
  },
] as const satisfies readonly ExpoRouterWebDocumentMetaDescription[];

export const expoRouterStandaloneRoutes = [
  {
    name: 'disclaimer',
    file: 'app/disclaimer.tsx',
    href: '/disclaimer',
    purpose: 'Official-authority disclaimer route outside the primary tabs',
  },
  {
    name: 'onboarding',
    file: 'app/onboarding.tsx',
    href: '/onboarding',
    purpose: 'First-run onboarding route outside the primary tabs',
  },
  {
    name: 'privacy',
    file: 'app/privacy.tsx',
    href: '/privacy',
    purpose: 'Privacy policy route outside the primary tabs',
  },
  {
    name: 'settings',
    file: 'app/settings.tsx',
    href: '/settings',
    purpose: 'Local app settings route outside the primary tabs',
  },
  {
    name: 'sources',
    file: 'app/sources.tsx',
    href: '/sources',
    purpose: 'Source reference route outside the primary tabs',
  },
  {
    name: 'support',
    file: 'app/support.tsx',
    href: '/support',
    purpose: 'Support contact route outside the primary tabs',
  },
  {
    name: 'terms',
    file: 'app/terms.tsx',
    href: '/terms',
    purpose: 'Terms of use route outside the primary tabs',
  },
  {
    name: 'about-the-test',
    file: 'app/about-the-test.tsx',
    href: '/about-the-test',
    purpose: 'About-the-test informational route outside the primary tabs',
  },
] as const satisfies readonly ExpoRouterStandaloneRoute[];

export const expoRouterStandaloneHeaderHiddenRoutes = [
  'disclaimer',
  'onboarding',
  'privacy',
  'settings',
  'sources',
  'support',
  'terms',
  'about-the-test',
] as const;

export const expoRouterShellContract = {
  notFoundRouteName: '+not-found',
  notFoundHeaderMode: 'visible-language-picker',
  rootStackHeaderMode: 'visible-language-picker',
  notFoundRedirectHref: '/home',
  notFoundFileProtocolFallback: 'HomeScreen',
  webLanguage: 'sv',
  webAppShellMarker: 'expo-router',
  themeColorToken: 'colors.canvas',
  statusBarStyle: 'auto',
  nativeFallbackHref: '/home',
  appScheme: 'almost-swedish',
} as const;

export type ExpoRouterShellFilePath = (typeof expoRouterShellFiles)[number]['file'];
export type ExpoRouterShellRecoveryHref = (typeof expoRouterShellRecoveryHrefs)[number];
export type ExpoRouterRootStackScreenName = (typeof expoRouterRootStackScreens)[number]['name'];
export type ExpoRouterTabScreenName = (typeof expoRouterTabScreens)[number]['name'];
export type ExpoRouterDynamicRouteName = (typeof expoRouterDynamicRoutes)[number]['name'];
export type ExpoRouterDynamicRouteHrefSample =
  (typeof expoRouterDynamicRoutes)[number]['hrefSample'];
export type ExpoRouterRootLayoutGlobalPlacementName =
  (typeof expoRouterRootLayoutGlobalPlacements)[number]['name'];
export type ExpoRouterNativeIntentStaticRoute = (typeof expoRouterNativeIntentStaticRoutes)[number];
export type ExpoRouterNativeIntentDynamicRoutePath =
  (typeof expoRouterNativeIntentDynamicRoutes)[number]['route'];
export type ExpoRouterNativeIntentRuntimeSampleInput =
  (typeof expoRouterNativeIntentRuntimeSamples)[number]['input'];
export type ExpoRouterNativeIntentConfigFile = (typeof expoRouterNativeIntentConfigFiles)[number];
export type ExpoRouterWebDocumentMetaDescriptionLanguage =
  (typeof expoRouterWebDocumentMetaDescriptions)[number]['language'];
export type ExpoRouterStandaloneRouteName = (typeof expoRouterStandaloneRoutes)[number]['name'];
export type ExpoRouterStandaloneRouteHref = (typeof expoRouterStandaloneRoutes)[number]['href'];
export type ExpoRouterStandaloneHeaderHiddenRoute =
  (typeof expoRouterStandaloneHeaderHiddenRoutes)[number];
