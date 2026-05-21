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

const visualSmokeRouteNameSet = new Set<string>(visualSmokeRoutes.map(([name]) => name));

export interface VisualSmokeDuplicateCandidate {
  name: string;
  sha256: string;
}

export function visualSmokeRouteNamesKey(names: readonly string[]): string {
  return [...names].sort().join(',');
}

function isKnownVisualSmokeRouteName(name: string): boolean {
  return visualSmokeRouteNameSet.has(name);
}

function hasVisualSmokeDuplicateExplanationReason(
  group: VisualSmokeDuplicateExplanationGroup,
): boolean {
  return group.reason.trim().length > 0;
}

export function visualSmokeDuplicateExplanationMatches(
  names: readonly string[],
  group: VisualSmokeDuplicateExplanationGroup,
): boolean {
  if (!hasVisualSmokeDuplicateExplanationReason(group)) return false;
  if (!names.every(isKnownVisualSmokeRouteName)) return false;
  if (!group.names.every(isKnownVisualSmokeRouteName)) return false;

  const namesKey = visualSmokeRouteNamesKey(names);
  return visualSmokeRouteNamesKey(group.names) === namesKey;
}

export function isExplainedVisualSmokeDuplicate(
  names: readonly string[],
  groups: readonly VisualSmokeDuplicateExplanationGroup[] = explainedVisualSmokeDuplicateScreenshotGroups,
): boolean {
  return groups.some((group) => visualSmokeDuplicateExplanationMatches(names, group));
}

export function findUnexplainedVisualSmokeDuplicateScreenshots(
  captures: readonly VisualSmokeDuplicateCandidate[],
  groups: readonly VisualSmokeDuplicateExplanationGroup[] = explainedVisualSmokeDuplicateScreenshotGroups,
): string[] {
  const namesByHash = new Map<string, string[]>();

  for (const capture of captures) {
    const names = namesByHash.get(capture.sha256) ?? [];
    names.push(capture.name);
    namesByHash.set(capture.sha256, names);
  }

  return [...namesByHash.entries()]
    .filter(([, names]) => names.length > 1)
    .filter(([, names]) => !isExplainedVisualSmokeDuplicate(names, groups))
    .map(([hash, names]) => `${hash}: ${visualSmokeRouteNamesKey(names)}`);
}
