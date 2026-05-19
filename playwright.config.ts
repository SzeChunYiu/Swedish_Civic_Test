import { defineConfig, devices } from '@playwright/test';

import { getChromiumLaunchOptions } from './tests/e2e/browserLaunch';

const chromiumLaunchOptions = getChromiumLaunchOptions();
const e2ePort = process.env.PORT || '4173';
const e2eBaseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: e2eBaseURL,
    ...devices['iPhone 12'],
    browserName: 'chromium',
    ...(chromiumLaunchOptions ? { launchOptions: chromiumLaunchOptions } : {}),
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node tests/e2e/serve-dist-web.cjs',
    url: e2eBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
