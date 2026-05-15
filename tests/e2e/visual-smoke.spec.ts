import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const screenshotDir = path.resolve('reports/2026-05-15-uiux-screenshots');
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

test('primary routes render and capture UI/UX screenshots', async ({ page }) => {
  fs.rmSync(screenshotDir, { force: true, recursive: true });
  fs.mkdirSync(screenshotDir, { recursive: true });
  const consoleErrors: string[] = [];
  const manifest: Array<{ name: string; route: string; file: string; bytes: number }> = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  for (const [name, route] of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).not.toContainText('Not Found');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    const file = `${name}.png`;
    const filePath = path.join(screenshotDir, file);
    await page.screenshot({ path: filePath, fullPage: true });
    const bytes = fs.statSync(filePath).size;
    expect(bytes, `${file} should not be empty`).toBeGreaterThan(10_000);
    manifest.push({ name, route, file, bytes });
  }

  fs.writeFileSync(
    path.join(screenshotDir, 'manifest.json'),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        viewport: 'iPhone 12 via Playwright project config',
        source: 'dist-web export served with SPA fallback by tests/e2e/serve-dist-web.cjs',
        routes: manifest,
      },
      null,
      2,
    ) + '\n',
  );

  expect(consoleErrors).toEqual([]);
});
