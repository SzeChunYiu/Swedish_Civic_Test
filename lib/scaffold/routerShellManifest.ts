export type ExpoRouterShellRole =
  | 'root-layout'
  | 'not-found-route'
  | 'web-document'
  | 'native-intent';

export type ExpoRouterShellFile = {
  readonly file: string;
  readonly role: ExpoRouterShellRole;
  readonly purpose: string;
};

export const expoRouterShellFiles = [
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

export const expoRouterStandaloneHeaderHiddenRoutes = [
  'disclaimer',
  'onboarding',
  'privacy',
  'settings',
  'sources',
  'support',
  'terms',
] as const;

export const expoRouterShellContract = {
  notFoundRouteName: '+not-found',
  notFoundHeaderMode: 'hidden',
  rootStackHeaderMode: 'hidden',
  notFoundRedirectHref: '/home',
  notFoundFileProtocolFallback: 'HomeScreen',
  webLanguage: 'sv',
  webAppShellMarker: 'expo-router',
  themeColorToken: 'colors.canvas',
  statusBarStyle: 'auto',
  nativeFallbackHref: '/home',
  appScheme: 'swedish-civic-test',
} as const;

export type ExpoRouterShellFilePath = (typeof expoRouterShellFiles)[number]['file'];
export type ExpoRouterShellRecoveryHref = (typeof expoRouterShellRecoveryHrefs)[number];
export type ExpoRouterStandaloneHeaderHiddenRoute =
  (typeof expoRouterStandaloneHeaderHiddenRoutes)[number];
