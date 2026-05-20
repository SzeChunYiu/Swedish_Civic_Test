import { expect, test, type Locator, type Page } from '@playwright/test';

import { citizenshipRequirementSources } from '../../data/citizenshipRequirements';
import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

function expectedSourceLinkLabel(
  source: (typeof citizenshipRequirementSources)[number],
  language: AppLanguage,
) {
  const title = source.title[language];

  if (language === 'sv') {
    return `Öppna källa: ${source.publisher}, ${title}`;
  }

  return `Open source: ${source.publisher}, ${title}`;
}

function expectedInternalLinks(language: AppLanguage) {
  if (language === 'sv') {
    return [
      {
        href: /\/practice$/,
        label: 'Öppna övningsläget för samhällskunskap',
        name: 'practice link',
      },
      {
        href: /\/about-the-test$/,
        label: 'Gå tillbaka till sidan om medborgarskapsprovet',
        name: 'about-the-test link',
      },
    ];
  }

  return [
    {
      href: /\/practice$/,
      label: 'Open civic knowledge practice mode',
      name: 'practice link',
    },
    {
      href: /\/about-the-test$/,
      label: 'Go back to the page about the citizenship test',
      name: 'about-the-test link',
    },
  ];
}

async function openCitizenshipRequirements(page: Page, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectMinimumLinkTarget(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable link target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;

          return (
            document.documentElement.scrollWidth <= viewportWidth + 1 &&
            document.body.scrollWidth <= viewportWidth + 1
          );
        }),
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

for (const language of ['sv', 'en'] as const) {
  test(`citizenship requirements official sources are real external links in ${language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await openCitizenshipRequirements(page, language);

    await expect(page.locator('body')).toContainText(
      language === 'sv' ? 'Officiella källor' : 'Official sources',
    );

    for (const source of citizenshipRequirementSources) {
      const linkLabel = expectedSourceLinkLabel(source, language);
      const link = page.getByRole('link', { exact: true, name: linkLabel });

      await expect(link, `${source.id} should expose one localized source link`).toHaveCount(1);
      await expect(link).toHaveAttribute('href', source.url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noreferrer/);
      await expect(link).toContainText(source.title[language]);
      await expect(link).toContainText(new URL(source.url).hostname);
      await expectMinimumLinkTarget(link, `${source.id} source link`);

      const sourceCard = link.locator('xpath=..');
      await expect(sourceCard).toContainText(source.publisher);
      await expect(sourceCard).toContainText(source.retrievedDate);
    }

    for (const internalLink of expectedInternalLinks(language)) {
      const link = page.getByRole('link', { exact: true, name: internalLink.label });

      await expect(link, `${internalLink.name} should stay reachable`).toHaveCount(1);
      await expect(link).toHaveAttribute('href', internalLink.href);
      await expectMinimumLinkTarget(link, internalLink.name);
    }

    await expectNoHorizontalOverflow(page, `citizenship requirements ${language}`);
    expect(consoleErrors).toEqual([]);
  });
}
