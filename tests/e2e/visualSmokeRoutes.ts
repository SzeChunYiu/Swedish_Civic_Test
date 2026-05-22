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

export type VisualSmokeDuplicateHashGroup = {
  captures: readonly VisualSmokeDuplicateCapture[];
  explained: boolean;
  names: readonly string[];
  sha256: string;
};

const visualSmokeRouteFilePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;

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
  assertValidVisualSmokeRouteEntries(routes);
  return routes.map(({ file, name, route }) => ({
    file: file.trim(),
    name: name.trim(),
    route: route.trim(),
  }));
}

export const visualSmokeDuplicateExplanations = [
  {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home, so it may match the Home screenshot exactly.',
  },
] as const satisfies readonly VisualSmokeDuplicateExplanation[];

const minDuplicateExplanationReasonLength = 24;

function routeEntryLabel(index: number): string {
  return `visual smoke route entry ${index + 1}`;
}

function formatDuplicateIndexes(indexes: readonly number[]): string {
  return indexes.map((index) => index + 1).join(', ');
}

function pushDuplicateValueErrors({
  errors,
  label,
  values,
}: {
  errors: string[];
  label: string;
  values: ReadonlyMap<string, number[]>;
}) {
  for (const [value, indexes] of values.entries()) {
    if (indexes.length > 1) {
      errors.push(
        `${label} "${value}" is duplicated by entries ${formatDuplicateIndexes(indexes)}`,
      );
    }
  }
}

export function validateVisualSmokeRouteEntries(
  routes: readonly Partial<VisualSmokeRoute>[] = visualSmokeRoutes,
): string[] {
  const errors: string[] = [];
  const names = new Map<string, number[]>();
  const routePaths = new Map<string, number[]>();
  const files = new Map<string, number[]>();

  routes.forEach((entry, index) => {
    const label = routeEntryLabel(index);
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    const route = typeof entry.route === 'string' ? entry.route.trim() : '';
    const file = typeof entry.file === 'string' ? entry.file.trim() : '';

    if (!name) {
      errors.push(`${label} has a blank route name`);
    } else {
      names.set(name, [...(names.get(name) ?? []), index]);
    }

    if (!route) {
      errors.push(`${label} has a blank route path`);
    } else if (!route.startsWith('/')) {
      errors.push(`${label} route "${route}" must start with /`);
    } else {
      routePaths.set(route, [...(routePaths.get(route) ?? []), index]);
    }

    if (!file) {
      errors.push(`${label} has a blank screenshot file`);
    } else if (!visualSmokeRouteFilePattern.test(file)) {
      errors.push(`${label} file "${file}" must be a safe .png basename`);
    } else {
      files.set(file, [...(files.get(file) ?? []), index]);
    }
  });

  pushDuplicateValueErrors({ errors, label: 'route name', values: names });
  pushDuplicateValueErrors({ errors, label: 'route path', values: routePaths });
  pushDuplicateValueErrors({ errors, label: 'screenshot file', values: files });

  return errors;
}

export function assertValidVisualSmokeRouteEntries(
  routes: readonly Partial<VisualSmokeRoute>[] = visualSmokeRoutes,
): void {
  const errors = validateVisualSmokeRouteEntries(routes);

  if (errors.length > 0) {
    throw new Error(`Visual smoke route entries are invalid:\n${errors.join('\n')}`);
  }
}

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

export function collectVisualSmokeDuplicateHashGroups(
  captures: readonly VisualSmokeDuplicateCapture[],
  explanations: readonly VisualSmokeDuplicateExplanation[] = visualSmokeDuplicateExplanations,
): VisualSmokeDuplicateHashGroup[] {
  const capturesByHash = new Map<string, VisualSmokeDuplicateCapture[]>();

  for (const capture of captures) {
    const hashCaptures = capturesByHash.get(capture.sha256) ?? [];
    hashCaptures.push(capture);
    capturesByHash.set(capture.sha256, hashCaptures);
  }

  return [...capturesByHash.entries()]
    .filter(([, hashCaptures]) => hashCaptures.length > 1)
    .map(([sha256, hashCaptures]) => {
      const names = hashCaptures.map((capture) => capture.name);

      return {
        captures: [...hashCaptures],
        explained: isExplainedVisualSmokeDuplicate(names, explanations),
        names,
        sha256,
      };
    });
}

export function findUnexplainedVisualSmokeDuplicateReports(
  captures: readonly VisualSmokeDuplicateCapture[],
  explanations: readonly VisualSmokeDuplicateExplanation[] = visualSmokeDuplicateExplanations,
): string[] {
  return collectVisualSmokeDuplicateHashGroups(captures, explanations)
    .filter((group) => !group.explained)
    .map((group) => {
      const captureDetails = [...group.captures]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(formatVisualSmokeDuplicateCapture)
        .join(', ');
      return `${group.sha256}: ${captureDetails}`;
    });
}
