export const visualSmokeRoutes = [
  ['index', '/'],
  ['onboarding', '/onboarding'],
  ['home', '/home'],
  ['learn', '/learn'],
  ['practice', '/practice'],
  ['exam', '/exam'],
  ['mistakes', '/mistakes'],
  ['profile', '/profile'],
  ['settings', '/settings'],
  ['chapter-ch01', '/chapter/ch01'],
  ['disclaimer', '/disclaimer'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
  ['sources', '/sources'],
  ['support', '/support'],
] as const;

export const requiredVisualSmokeRouteContextKeys = [
  './_layout.tsx',
  './(tabs)/home.tsx',
  './(tabs)/practice.tsx',
  './about-the-test.tsx',
  './chapter/[chapterId].tsx',
] as const;

export type VisualSmokeRouteName = (typeof visualSmokeRoutes)[number][0];

export interface VisualSmokeDuplicateExplanationGroup {
  names: readonly VisualSmokeRouteName[];
  reason: string;
}

export const explainedVisualSmokeDuplicateScreenshotGroups = [
  {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home, so it may match the Home screenshot exactly.',
  },
] as const satisfies readonly VisualSmokeDuplicateExplanationGroup[];

export interface VisualSmokeDuplicateCandidate {
  name: string;
  sha256: string;
}

export function visualSmokeRouteNamesKey(names: readonly string[]): string {
  return [...names].sort().join(',');
}

const visualSmokeRouteNameSet = new Set<string>(visualSmokeRoutes.map(([name]) => name));

function hasKnownVisualSmokeRouteNames(names: readonly string[]): boolean {
  return names.every((name) => visualSmokeRouteNameSet.has(name));
}

function hasHumanDuplicateExplanation(reason: string): boolean {
  return reason.trim().length > 0;
}

export function isExplainedVisualSmokeDuplicate(
  names: readonly string[],
  explanationGroups: readonly VisualSmokeDuplicateExplanationGroup[] = explainedVisualSmokeDuplicateScreenshotGroups,
): boolean {
  if (!hasKnownVisualSmokeRouteNames(names)) return false;

  const namesKey = visualSmokeRouteNamesKey(names);

  return explanationGroups.some(
    (group) =>
      hasHumanDuplicateExplanation(group.reason) &&
      hasKnownVisualSmokeRouteNames(group.names) &&
      visualSmokeRouteNamesKey(group.names) === namesKey,
  );
}

export function findUnexplainedVisualSmokeDuplicateScreenshots(
  captures: readonly VisualSmokeDuplicateCandidate[],
): string[] {
  const namesByHash = new Map<string, string[]>();

  for (const capture of captures) {
    const names = namesByHash.get(capture.sha256) ?? [];
    names.push(capture.name);
    namesByHash.set(capture.sha256, names);
  }

  return [...namesByHash.entries()]
    .filter(([, names]) => names.length > 1)
    .filter(([, names]) => !isExplainedVisualSmokeDuplicate(names))
    .map(([hash, names]) => `${hash}: ${visualSmokeRouteNamesKey(names)}`);
}
