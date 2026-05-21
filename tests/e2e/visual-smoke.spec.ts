import { expect, test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  blockingModalOverlayLocator,
  dismissBlockingModals,
  seedFreshFirstRunSettingsLanguage,
} from './browserLaunch';
import { resolveVisualSmokeOutput } from './visualSmokeOutput';
import {
  findUnexplainedVisualSmokeDuplicateReports,
  visualSmokeDuplicateExplanations,
  visualSmokeRouteManifestEntries,
  type VisualSmokeRoute,
} from './visualSmokeRoutes';

const webBundleDir = path.resolve('dist-web/_expo/static/js/web');
const visualSmokeOutput = resolveVisualSmokeOutput();
const screenshotDir = visualSmokeOutput.dir;

test.setTimeout(60_000);

type RouteCapture = VisualSmokeRoute & {
  bytes: number;
  sha256: string;
  firstRunAboutDismissed: boolean;
  languagePickerDismissed: boolean;
  launchOverlayDismissed: boolean;
  launchOverlayVisibleAfterDismissal: boolean;
};

const requiredRouteContextKeys = [
  './_layout.tsx',
  './(tabs)/home.tsx',
  './(tabs)/practice.tsx',
  './about-the-test.tsx',
  './chapter/[chapterId].tsx',
] as const;

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

  for (const { file, name, route } of visualSmokeRouteManifestEntries()) {
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

  const unexplainedDuplicateScreenshots = findUnexplainedVisualSmokeDuplicateReports(manifest);
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
        duplicateExplanations: visualSmokeDuplicateExplanations,
        routes: manifest,
      },
      null,
      2,
    ) + '\n',
  );

  expect(consoleErrors).toEqual([]);
});

test('shared modal dismissal helper closes forced first-run guide and language picker', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedFreshFirstRunSettingsLanguage(page, 'sv');
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await expect(page.getByRole('dialog', { name: 'Vad är medborgarskapsprovet?' })).toBeVisible();

  const firstRunDismissal = await dismissBlockingModals(page);
  expect(firstRunDismissal.firstRunAboutDismissed).toBe(true);
  await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);

  await page
    .getByRole('button', {
      name: /Nuvarande språk SV\. Öppna språkväljaren\.|Current language SV\. Open language picker\./,
    })
    .click();
  await expect(page.getByRole('menu', { name: /Språkväljare|Language picker/ })).toBeVisible();

  const languagePickerDismissal = await dismissBlockingModals(page);
  const forcedDismissal = {
    firstRunAboutDismissed:
      firstRunDismissal.firstRunAboutDismissed || languagePickerDismissal.firstRunAboutDismissed,
    languagePickerDismissed:
      firstRunDismissal.languagePickerDismissed || languagePickerDismissal.languagePickerDismissed,
  };

  expect(forcedDismissal).toEqual({
    firstRunAboutDismissed: true,
    languagePickerDismissed: true,
  });
  await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('menu', { name: /Språkväljare|Language picker/ })).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
