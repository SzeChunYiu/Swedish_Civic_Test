import type { Page } from '@playwright/test';

const googleFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

export type TrapExternalRequestOptions = {
  capturedGoogleFontRequests?: string[];
  expectedExternalHosts?: readonly string[];
  unexpectedExternalRequests?: string[];
};

function isGoogleFontRequest(url: string): boolean {
  return googleFontHosts.has(new URL(url).hostname);
}

function isExpectedExternalRequest(
  parsedUrl: URL,
  expectedExternalHosts: ReadonlySet<string>,
): boolean {
  return expectedExternalHosts.has(parsedUrl.hostname);
}

export async function trapExternalRequests(
  page: Page,
  allowedOrigin: string,
  options: TrapExternalRequestOptions = {},
): Promise<void> {
  const expectedExternalHosts = new Set(options.expectedExternalHosts ?? []);

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const parsedUrl = new URL(url);

    if (isGoogleFontRequest(url)) {
      options.capturedGoogleFontRequests?.push(url);
      if (!isExpectedExternalRequest(parsedUrl, expectedExternalHosts)) {
        options.unexpectedExternalRequests?.push(url);
      }
      await route.abort('blockedbyclient');
      return;
    }

    if (parsedUrl.origin !== allowedOrigin) {
      if (!isExpectedExternalRequest(parsedUrl, expectedExternalHosts)) {
        options.unexpectedExternalRequests?.push(url);
      }
      await route.abort('blockedbyclient');
      return;
    }

    await route.continue();
  });
}
