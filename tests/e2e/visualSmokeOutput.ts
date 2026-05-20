import * as path from 'node:path';

export const VISUAL_SMOKE_UPDATE_BASELINE_ENV = 'VISUAL_SMOKE_UPDATE_BASELINE';
export const VISUAL_SMOKE_BASELINE_RELATIVE_DIR = 'reports/2026-05-15-uiux-screenshots';
export const VISUAL_SMOKE_RUNTIME_RELATIVE_DIR = 'tmp/visual-smoke-uiux-screenshots';

export type VisualSmokeOutputMode = 'runtime-temp' | 'committed-baseline-refresh';

export interface ResolveVisualSmokeOutputOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
}

export interface VisualSmokeOutputResolution {
  dir: string;
  relativeDir: string;
  mode: VisualSmokeOutputMode;
  writesCommittedBaseline: boolean;
  outputPolicy: string;
}

function outputPolicyForMode(mode: VisualSmokeOutputMode): string {
  if (mode === 'committed-baseline-refresh') {
    return `VISUAL_SMOKE_UPDATE_BASELINE=1 is set, so this run intentionally refreshes the committed ${VISUAL_SMOKE_BASELINE_RELATIVE_DIR} baseline. Default checks should leave this unset.`;
  }

  return `Default visual-smoke runs write screenshots under ignored ${VISUAL_SMOKE_RUNTIME_RELATIVE_DIR}. Set VISUAL_SMOKE_UPDATE_BASELINE=1 only when intentionally refreshing the committed ${VISUAL_SMOKE_BASELINE_RELATIVE_DIR} baseline.`;
}

export function resolveVisualSmokeOutput(
  options: ResolveVisualSmokeOutputOptions = {},
): VisualSmokeOutputResolution {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const writesCommittedBaseline = env[VISUAL_SMOKE_UPDATE_BASELINE_ENV] === '1';
  const relativeDir = writesCommittedBaseline
    ? VISUAL_SMOKE_BASELINE_RELATIVE_DIR
    : VISUAL_SMOKE_RUNTIME_RELATIVE_DIR;
  const mode: VisualSmokeOutputMode = writesCommittedBaseline
    ? 'committed-baseline-refresh'
    : 'runtime-temp';

  return {
    dir: path.resolve(cwd, relativeDir),
    relativeDir,
    mode,
    writesCommittedBaseline,
    outputPolicy: outputPolicyForMode(mode),
  };
}
