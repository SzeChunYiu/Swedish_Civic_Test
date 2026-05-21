import * as path from 'node:path';

export const VISUAL_SMOKE_BASELINE_RELATIVE_DIR = 'reports/2026-05-15-uiux-screenshots';
export const VISUAL_SMOKE_RUNTIME_RELATIVE_DIR = 'tmp/visual-smoke-uiux-screenshots';
export const visualSmokeBaselineScreenshotDir = path.resolve(VISUAL_SMOKE_BASELINE_RELATIVE_DIR);
export const visualSmokeRuntimeScreenshotDir = path.resolve(VISUAL_SMOKE_RUNTIME_RELATIVE_DIR);
export const visualSmokeOutputPolicy =
  'Default visual-smoke runs write screenshots under ignored tmp/visual-smoke-uiux-screenshots. Set VISUAL_SMOKE_UPDATE_BASELINE=1 only when intentionally refreshing the committed reports/2026-05-15-uiux-screenshots baseline.';

export type VisualSmokeOutputMode = 'runtime-temp' | 'committed-baseline-refresh';

export type VisualSmokeOutputResolution = {
  dir: string;
  mode: VisualSmokeOutputMode;
  outputDir: string;
  outputMode: VisualSmokeOutputMode;
  outputPolicy: string;
  relativeDir: string;
  refreshCommittedBaseline: boolean;
  writesCommittedBaseline: boolean;
};

type VisualSmokeOutputOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
};

export function isVisualSmokeCommittedBaselineOutput(
  outputDir: string,
  baselineDir = visualSmokeBaselineScreenshotDir,
): boolean {
  const relativePath = path.relative(baselineDir, outputDir);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export function resolveVisualSmokeOutput(
  optionsOrEnv: Record<string, string | undefined> | VisualSmokeOutputOptions = process.env,
): VisualSmokeOutputResolution {
  const hasNestedEnv =
    typeof optionsOrEnv === 'object' &&
    optionsOrEnv !== null &&
    'env' in optionsOrEnv &&
    typeof optionsOrEnv.env === 'object';
  const env = hasNestedEnv
    ? ((optionsOrEnv as VisualSmokeOutputOptions).env ?? {})
    : (optionsOrEnv as Record<string, string | undefined>);
  const cwd = hasNestedEnv
    ? ((optionsOrEnv as VisualSmokeOutputOptions).cwd ?? process.cwd())
    : process.cwd();
  const refreshCommittedBaseline = env.VISUAL_SMOKE_UPDATE_BASELINE === '1';
  const relativeDir = refreshCommittedBaseline
    ? VISUAL_SMOKE_BASELINE_RELATIVE_DIR
    : VISUAL_SMOKE_RUNTIME_RELATIVE_DIR;
  const outputDir = path.join(cwd, relativeDir);
  const mode = refreshCommittedBaseline ? 'committed-baseline-refresh' : 'runtime-temp';

  const outputPolicy = refreshCommittedBaseline
    ? 'VISUAL_SMOKE_UPDATE_BASELINE=1 intentionally refreshes the committed reports/2026-05-15-uiux-screenshots baseline; default visual-smoke runs write screenshots under ignored tmp/visual-smoke-uiux-screenshots.'
    : visualSmokeOutputPolicy;

  return {
    dir: outputDir,
    mode,
    outputDir,
    outputMode: mode,
    outputPolicy,
    relativeDir,
    refreshCommittedBaseline,
    writesCommittedBaseline: isVisualSmokeCommittedBaselineOutput(outputDir),
  };
}
