import { defineConfig, devices } from '@playwright/test';

import { getChromiumLaunchOptions } from './tests/e2e/browserLaunch';

const DEFAULT_E2E_PORT = 4173;
const e2ePort = Number(process.env.E2E_PORT ?? DEFAULT_E2E_PORT);
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;
const chromiumLaunchOptions = getChromiumLaunchOptions();

if (!Number.isInteger(e2ePort) || e2ePort < 1 || e2ePort > 65535) {
  throw new Error(`E2E_PORT must be an integer TCP port, received ${process.env.E2E_PORT}`);
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: e2eBaseUrl,
    ...devices['iPhone 12'],
    browserName: 'chromium',
    ...(chromiumLaunchOptions ? { launchOptions: chromiumLaunchOptions } : {}),
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node tests/e2e/serve-dist-web.cjs',
    url: e2eBaseUrl,
    env: { PORT: String(e2ePort) },
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
