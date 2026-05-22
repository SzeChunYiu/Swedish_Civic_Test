import { defineConfig, devices } from '@playwright/test';

import { getChromiumLaunchOptions } from './tests/e2e/browserLaunch';

const DEFAULT_E2E_PORT = 4173;
const e2ePort = Number(process.env.E2E_PORT ?? DEFAULT_E2E_PORT);
const e2eBaseURL = `http://127.0.0.1:${e2ePort}`;
const chromiumLaunchOptions = getChromiumLaunchOptions();
const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER === '1' && !process.env.CI;

if (!Number.isInteger(e2ePort) || e2ePort < 1 || e2ePort > 65535) {
  throw new Error(`E2E_PORT must be an integer TCP port, received ${process.env.E2E_PORT}`);
}

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
    command: `PORT=${e2ePort} node tests/e2e/serve-dist-web.cjs`,
    url: e2eBaseURL,
    // Default local runs must start this worktree's dist-web server. Use a unique
    // E2E_PORT or explicitly set E2E_REUSE_EXISTING_SERVER=1 when reusing one.
    reuseExistingServer,
    timeout: 10_000,
  },
});
