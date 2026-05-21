import { expect, test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { blockingModalOverlayLocator, dismissBlockingModals } from './browserLaunch';
import { resolveVisualSmokeOutput } from './visualSmokeOutput';

const webBundleDir = path.resolve('dist-web/_expo/static/js/web');
const visualSmokeOutput = resolveVisualSmokeOutput();
const screenshotDir = visualSmokeOutput.dir;
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

const requiredRouteContextKeys = [
  './_layout.tsx',
  './(tabs)/home.tsx',
  './(tabs)/practice.tsx',
  './about-the-test.tsx',
  './chapter/[chapterId].tsx',
] as const;

const explainedDuplicateScreenshotGroups = [
  {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home, so it may match the Home screenshot exactly.',
  },
] as const;

test.setTimeout(90_000);

function readWebBundleText(): string {
  expect(fs.existsSync(webBundleDir), 'dist-web web bundle directory should exist').toBe(true);
  const bundleFiles = fs
    .readdirSync(webBundleDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join(webBundleDir, file));

  expect(bundleFiles.length, 'dist-web should include a web JavaScript bundle').toBeGreaterThan(0);
  return bundleFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
}

function expectExportBundleToContainRouteContext() {
  const bundleText = readWebBundleText();

  expect(
    bundleText,
    'Expo Router route context should not be emitted as an empty module',
  ).not.toContain('No modules in context');
  for (const routeContextKey of requiredRouteContextKeys) {
    expect(bundleText, `web bundle should include route module ${routeContextKey}`).toContain(
      routeContextKey,
    );
  }
}

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
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

test('primary routes render and capture UI/UX screenshots', async ({ page }) => {
  expectExportBundleToContainRouteContext();
  expect(
    process.env.VISUAL_SMOKE_UPDATE_BASELINE === '1' || !visualSmokeOutput.writesCommittedBaseline,
    'Default visual-smoke runs must not write into the committed screenshot baseline',
  ).toBe(true);

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
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('No routes found');
    expect(
      bodyText.trim().length,
      `${route} should render route-specific body text`,
    ).toBeGreaterThan(40);
    await expect(page.locator('body')).not.toContainText('Not Found');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    const file = `${name}.png`;
    const filePath = path.join(screenshotDir, file);
    await page.screenshot({ path: filePath, fullPage: true });
    const bytes = fs.statSync(filePath).size;
    const sha256 = sha256File(filePath);
    const launchOverlayVisibleAfterDismissal =
      (await page.locator(blockingModalOverlayLocator).count()) > 0;
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
        outputMode: visualSmokeOutput.mode,
        outputPolicy: visualSmokeOutput.outputPolicy,
        writesCommittedBaseline: visualSmokeOutput.writesCommittedBaseline,
        viewport: 'iPhone 12 via Playwright project config',
        source: 'dist-web export served with SPA fallback by tests/e2e/serve-dist-web.cjs',
        launchOverlayPolicy:
          'Visual smoke dismisses the launch sponsor overlay, first-run guide, and language picker before every screenshot and rejects visible dialog or modal menu overlays.',
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
