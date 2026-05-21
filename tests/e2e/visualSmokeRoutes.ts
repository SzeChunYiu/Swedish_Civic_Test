export type VisualSmokeRoute = {
  file: string;
  name: string;
  route: string;
};

export type VisualSmokeRouteManifestEntry = Pick<VisualSmokeRoute, 'file' | 'name' | 'route'>;

export type VisualSmokeDuplicateExplanation = {
  names: readonly string[];
  reason: string;
};

export const visualSmokeRoutes = [
  { name: 'index', route: '/', file: 'index.png' },
  { name: 'onboarding', route: '/onboarding', file: 'onboarding.png' },
  { name: 'home', route: '/home', file: 'home.png' },
  { name: 'learn', route: '/learn', file: 'learn.png' },
  { name: 'practice', route: '/practice', file: 'practice.png' },
  { name: 'exam', route: '/exam', file: 'exam.png' },
  { name: 'mistakes', route: '/mistakes', file: 'mistakes.png' },
  { name: 'profile', route: '/profile', file: 'profile.png' },
  { name: 'settings', route: '/settings', file: 'settings.png' },
  { name: 'chapter-ch01', route: '/chapter/ch01', file: 'chapter-ch01.png' },
  { name: 'disclaimer', route: '/disclaimer', file: 'disclaimer.png' },
  { name: 'privacy', route: '/privacy', file: 'privacy.png' },
  { name: 'terms', route: '/terms', file: 'terms.png' },
  { name: 'sources', route: '/sources', file: 'sources.png' },
  { name: 'support', route: '/support', file: 'support.png' },
] as const satisfies readonly VisualSmokeRoute[];

export function visualSmokeRouteManifestEntries(
  routes: readonly VisualSmokeRoute[] = visualSmokeRoutes,
): VisualSmokeRouteManifestEntry[] {
  return routes.map(({ file, name, route }) => ({ file, name, route }));
}

export const visualSmokeDuplicateExplanations = [
  {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home, so it may match the Home screenshot exactly.',
  },
] as const satisfies readonly VisualSmokeDuplicateExplanation[];

export function visualSmokeDuplicateExplanationKey(names: readonly string[]): string {
  return [...names].sort().join(',');
}

export function isExplainedVisualSmokeDuplicate(names: readonly string[]): boolean {
  const duplicateKey = visualSmokeDuplicateExplanationKey(names);

  return visualSmokeDuplicateExplanations.some(
    (explanation) => visualSmokeDuplicateExplanationKey(explanation.names) === duplicateKey,
  );
}
