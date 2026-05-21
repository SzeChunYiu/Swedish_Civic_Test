import path from 'node:path';

export const visualSmokeBaselineScreenshotDir = path.resolve('reports/2026-05-15-uiux-screenshots');
export const visualSmokeRuntimeScreenshotDir = path.resolve('tmp/visual-smoke-uiux-screenshots');
export const visualSmokeOutputPolicy =
  'Default visual-smoke runs write screenshots under ignored tmp/visual-smoke-uiux-screenshots. Set VISUAL_SMOKE_UPDATE_BASELINE=1 only when intentionally refreshing the committed reports/2026-05-15-uiux-screenshots baseline.';

export type VisualSmokeOutputMode = 'runtime-temp' | 'committed-baseline-refresh';

export type VisualSmokeOutputResolution = {
  outputDir: string;
  outputMode: VisualSmokeOutputMode;
  outputPolicy: string;
  refreshCommittedBaseline: boolean;
  writesCommittedBaseline: boolean;
};

export function isVisualSmokeCommittedBaselineOutput(
  outputDir: string,
  baselineDir = visualSmokeBaselineScreenshotDir,
): boolean {
  const relativePath = path.relative(baselineDir, outputDir);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export function resolveVisualSmokeOutput(
  env: Record<string, string | undefined> = process.env,
): VisualSmokeOutputResolution {
  const refreshCommittedBaseline = env.VISUAL_SMOKE_UPDATE_BASELINE === '1';
  const outputDir = refreshCommittedBaseline
    ? visualSmokeBaselineScreenshotDir
    : visualSmokeRuntimeScreenshotDir;

  return {
    outputDir,
    outputMode: refreshCommittedBaseline ? 'committed-baseline-refresh' : 'runtime-temp',
    outputPolicy: visualSmokeOutputPolicy,
    refreshCommittedBaseline,
    writesCommittedBaseline: isVisualSmokeCommittedBaselineOutput(outputDir),
  };
}
