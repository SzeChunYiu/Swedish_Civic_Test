import { expect, test, type TestInfo } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { dismissBlockingModals } from './browserLaunch';

const committedScreenshotDir = path.resolve('reports/2026-05-15-uiux-screenshots');
const updateCommittedScreenshots = process.env.VISUAL_SMOKE_UPDATE_BASELINE === '1';
type RouteCapture = {
  name: string;
  route: string;
  file: string;
  bytes: number;
  sha256: string;
  firstRunAboutDismissed: boolean;
  languagePickerDismissed: boolean;
  launchOverlayDismissed: boolean;
  launchOverlayVisibleAfterDismissal: boolean;
};

const routes = [
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

const explainedDuplicateScreenshotGroups = [
  {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home, so it may match the Home screenshot exactly.',
  },
] as const;

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function screenshotDirFor(testInfo: TestInfo): string {
  return updateCommittedScreenshots
    ? committedScreenshotDir
    : testInfo.outputPath('visual-smoke-screenshots');
}

function findUnexplainedDuplicateScreenshots(captures: RouteCapture[]): string[] {
  const namesByHash = new Map<string, string[]>();

  for (const capture of captures) {
    const names = namesByHash.get(capture.sha256) ?? [];
    names.push(capture.name);
    namesByHash.set(capture.sha256, names);
  }

  return [...namesByHash.entries()]
    .filter(([, names]) => names.length > 1)
    .filter(([, names]) => {
      const sortedNames = [...names].sort();
      return !explainedDuplicateScreenshotGroups.some(
        (group) => JSON.stringify([...group.names].sort()) === JSON.stringify(sortedNames),
      );
    })
    .map(([hash, names]) => `${hash}: ${names.sort().join(', ')}`);
}

test('primary routes render and capture UI/UX screenshots', async ({ page }, testInfo) => {
  const screenshotDir = screenshotDirFor(testInfo);
  fs.rmSync(screenshotDir, { force: true, recursive: true });
  fs.mkdirSync(screenshotDir, { recursive: true });
  const consoleErrors: string[] = [];
  const manifest: RouteCapture[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  for (const [name, route] of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const dismissal = await dismissBlockingModals(page);
    await expect(page.locator('body')).not.toContainText('Not Found');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    const file = `${name}.png`;
    const filePath = path.join(screenshotDir, file);
    await page.screenshot({ path: filePath, fullPage: true });
    const bytes = fs.statSync(filePath).size;
    const sha256 = sha256File(filePath);
    const launchOverlayVisibleAfterDismissal =
      (await page.locator('[role="dialog"][aria-modal="true"]').count()) > 0;
    expect(bytes, `${file} should not be empty`).toBeGreaterThan(10_000);
    expect(launchOverlayVisibleAfterDismissal, `${file} should not show launch overlay`).toBe(
      false,
    );
    manifest.push({
      name,
      route,
      file,
      bytes,
      sha256,
      firstRunAboutDismissed: dismissal.firstRunAboutDismissed,
      languagePickerDismissed: dismissal.languagePickerDismissed,
      launchOverlayDismissed: dismissal.launchOverlayDismissed,
      launchOverlayVisibleAfterDismissal,
    });
  }

  const unexplainedDuplicateScreenshots = findUnexplainedDuplicateScreenshots(manifest);
  expect(unexplainedDuplicateScreenshots).toEqual([]);

  fs.writeFileSync(
    path.join(screenshotDir, 'manifest.json'),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        viewport: 'iPhone 12 via Playwright project config',
        source: 'dist-web export served with SPA fallback by tests/e2e/serve-dist-web.cjs',
        artifactDirectory: path.relative(process.cwd(), screenshotDir),
        artifactPolicy: updateCommittedScreenshots
          ? 'VISUAL_SMOKE_UPDATE_BASELINE=1 rewrites committed baseline screenshots intentionally.'
          : 'Default visual-smoke screenshots are written under Playwright test-results so normal verification leaves committed reports unchanged.',
        launchOverlayPolicy:
          'Visual smoke dismisses the launch sponsor overlay, first-run guide, and language picker before every screenshot and rejects visible overlays.',
        duplicatePolicy:
          'Duplicate screenshot hashes fail unless the route pair is explicitly explained in the test.',
        duplicateExplanations: explainedDuplicateScreenshotGroups,
        routes: manifest,
      },
      null,
      2,
    ) + '\n',
  );

  expect(consoleErrors).toEqual([]);
});
