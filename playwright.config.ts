import { defineConfig, devices } from '@playwright/test';

import { getChromiumLaunchOptions } from './tests/e2e/browserLaunch';

const chromiumLaunchOptions = getChromiumLaunchOptions();

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['iPhone 12'],
    browserName: 'chromium',
    ...(chromiumLaunchOptions ? { launchOptions: chromiumLaunchOptions } : {}),
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node tests/e2e/serve-dist-web.cjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
