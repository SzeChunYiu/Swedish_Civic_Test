export type VisualSmokeRoute = {
  file: string;
  name: string;
  route: string;
};

export type VisualSmokeRouteManifestEntry = Pick<VisualSmokeRoute, 'file' | 'name' | 'route'>;

export type VisualSmokeDuplicateCapture = VisualSmokeRouteManifestEntry & {
  sha256: string;
};

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

const minDuplicateExplanationReasonLength = 24;

export function visualSmokeDuplicateExplanationKey(names: readonly string[]): string {
  return [...names].sort().join(',');
}

function visualSmokeRouteNameSet(
  routes: readonly VisualSmokeRoute[] = visualSmokeRoutes,
): Set<string> {
  return new Set(routes.map((route) => route.name));
}

export function hasValidVisualSmokeDuplicateExplanation(
  explanation: VisualSmokeDuplicateExplanation,
  routes: readonly VisualSmokeRoute[] = visualSmokeRoutes,
): boolean {
  const routeNames = visualSmokeRouteNameSet(routes);
  const trimmedNames = explanation.names.map((name) => name.trim());

  return (
    trimmedNames.length > 1 &&
    trimmedNames.every((name) => name.length > 0 && routeNames.has(name)) &&
    new Set(trimmedNames).size === trimmedNames.length &&
    typeof explanation.reason === 'string' &&
    explanation.reason.trim().length >= minDuplicateExplanationReasonLength
  );
}

export function validateVisualSmokeDuplicateExplanations(
  explanations: readonly VisualSmokeDuplicateExplanation[] = visualSmokeDuplicateExplanations,
  routes: readonly VisualSmokeRoute[] = visualSmokeRoutes,
): string[] {
  const errors: string[] = [];
  const routeNames = visualSmokeRouteNameSet(routes);
  const groupKeys = new Set<string>();

  explanations.forEach((explanation, index) => {
    const label = `duplicate explanation ${index + 1}`;
    const trimmedNames = explanation.names.map((name) => name.trim());
    const groupKey = visualSmokeDuplicateExplanationKey(trimmedNames);

    if (trimmedNames.length <= 1) {
      errors.push(`${label} must describe at least two routes`);
    }

    for (const name of trimmedNames) {
      if (!name) {
        errors.push(`${label} contains a blank route name`);
      } else if (!routeNames.has(name)) {
        errors.push(`${label} references unknown route ${name}`);
      }
    }

    if (new Set(trimmedNames).size !== trimmedNames.length) {
      errors.push(`${label} contains duplicate route names`);
    }

    if (groupKeys.has(groupKey)) {
      errors.push(`${label} duplicates allowed group ${groupKey}`);
    }
    groupKeys.add(groupKey);

    if (
      typeof explanation.reason !== 'string' ||
      explanation.reason.trim().length < minDuplicateExplanationReasonLength
    ) {
      errors.push(`${label} reason is blank or too short`);
    }
  });

  return errors;
}

export function isExplainedVisualSmokeDuplicate(
  names: readonly string[],
  explanations: readonly VisualSmokeDuplicateExplanation[] = visualSmokeDuplicateExplanations,
): boolean {
  const duplicateKey = visualSmokeDuplicateExplanationKey(names);

  return explanations.some(
    (explanation) =>
      hasValidVisualSmokeDuplicateExplanation(explanation) &&
      visualSmokeDuplicateExplanationKey(explanation.names) === duplicateKey,
  );
}

function formatVisualSmokeDuplicateCapture(capture: VisualSmokeDuplicateCapture): string {
  return `${capture.name} (${capture.route} -> ${capture.file})`;
}

export function findUnexplainedVisualSmokeDuplicateReports(
  captures: readonly VisualSmokeDuplicateCapture[],
  explanations: readonly VisualSmokeDuplicateExplanation[] = visualSmokeDuplicateExplanations,
): string[] {
  const capturesByHash = new Map<string, VisualSmokeDuplicateCapture[]>();

  for (const capture of captures) {
    const hashCaptures = capturesByHash.get(capture.sha256) ?? [];
    hashCaptures.push(capture);
    capturesByHash.set(capture.sha256, hashCaptures);
  }

  return [...capturesByHash.entries()]
    .filter(([, hashCaptures]) => hashCaptures.length > 1)
    .filter(([, hashCaptures]) => {
      const names = hashCaptures.map((capture) => capture.name);
      return !isExplainedVisualSmokeDuplicate(names, explanations);
    })
    .map(([hash, hashCaptures]) => {
      const captureDetails = [...hashCaptures]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(formatVisualSmokeDuplicateCapture)
        .join(', ');
      return `${hash}: ${captureDetails}`;
    });
}
