import type { Page } from '@playwright/test';

const googleFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function isGoogleFontRequest(url: string): boolean {
  return googleFontHosts.has(new URL(url).hostname);
}

export async function trapExternalRequests(
  page: Page,
  allowedOrigin: string,
  capturedGoogleFontRequests?: string[],
): Promise<void> {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const parsedUrl = new URL(url);

    if (isGoogleFontRequest(url)) {
      capturedGoogleFontRequests?.push(url);
      await route.abort('blockedbyclient');
      return;
    }

    if (parsedUrl.origin !== allowedOrigin) {
      await route.abort('blockedbyclient');
      return;
    }

    await route.continue();
  });
}
