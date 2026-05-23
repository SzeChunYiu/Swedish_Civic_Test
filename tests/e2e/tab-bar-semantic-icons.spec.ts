import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type RouteName = 'home' | 'learn' | 'practice' | 'exam' | 'mistakes' | 'profile';
type BoundingBox = { height: number; width: number; x: number; y: number };

const activeIconColor = '#006aa7';
const inactiveIconColor = '#44586b';

const routeSequence: Array<{
  label: Record<'sv' | 'en', string>;
  name: RouteName;
  path: string;
}> = [
  { name: 'home', path: '/home', label: { sv: 'Hem', en: 'Home' } },
  { name: 'learn', path: '/learn', label: { sv: 'Lär dig', en: 'Learn' } },
  { name: 'practice', path: '/practice', label: { sv: 'Öva', en: 'Practice' } },
  { name: 'exam', path: '/exam', label: { sv: 'Övningsprov', en: 'Exam' } },
  { name: 'mistakes', path: '/mistakes', label: { sv: 'Repetition', en: 'Review' } },
  { name: 'profile', path: '/profile', label: { sv: 'Profil', en: 'Profile' } },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  const gap = 0.5;

  return !(
    a.x + a.width <= b.x + gap ||
    b.x + b.width <= a.x + gap ||
    a.y + a.height <= b.y + gap ||
    b.y + b.height <= a.y + gap
  );
}

function iconLocator(page: Page, routeName: RouteName): Locator {
  return page.locator(`[data-testid="tab-icon-${routeName}"]:visible`).first();
}

function tabLocator(page: Page, routeName: RouteName): Locator {
  return iconLocator(page, routeName).locator(
    'xpath=ancestor::*[@role="link" or @role="tab" or self::a][1]',
  );
}

async function expectReachableTabTarget(tab: Locator, label: string): Promise<BoundingBox> {
  await expect(tab, `${label} tab should be visible`).toBeVisible();
  const box = await tab.boundingBox();

  expect(box, `${label} tab should have measurable geometry`).not.toBeNull();
  expect(box!.width, `${label} tab should be at least 44px wide`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} tab should be at least 44px tall`).toBeGreaterThanOrEqual(44);

  return box!;
}

async function expectIconColor(icon: Locator, expectedColor: string, label: string) {
  const paintedTokens = await icon
    .locator('path,circle,rect')
    .evaluateAll((nodes) =>
      nodes
        .flatMap((node) => [node.getAttribute('stroke'), node.getAttribute('fill')])
        .filter((value): value is string => Boolean(value) && value !== 'none'),
    );

  expect(paintedTokens, `${label} icon should use ${expectedColor}`).toContain(expectedColor);
}

async function expectTabBarState(page: Page, activeRoute: RouteName, language: 'sv' | 'en') {
  const boxes: Array<{ box: BoundingBox; label: string }> = [];

  for (const route of routeSequence) {
    const label = route.label[language];
    const tab = tabLocator(page, route.name);
    const icon = iconLocator(page, route.name);
    const visibleIconCount = await page
      .locator(`[data-testid="tab-icon-${route.name}"]:visible`)
      .count();

    expect(visibleIconCount, `${label} tab should render a visible icon`).toBeGreaterThan(0);
    await expect(
      icon.locator('path,circle,rect'),
      `${label} tab icon should not be empty`,
    ).not.toHaveCount(0);
    await expect(tab).toHaveAccessibleName(new RegExp(`^${escapeRegExp(label)}$`));
    boxes.push({ box: await expectReachableTabTarget(tab, label), label });
    await expectIconColor(
      icon,
      route.name === activeRoute ? activeIconColor : inactiveIconColor,
      label,
    );
  }

  for (let index = 0; index < boxes.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < boxes.length; otherIndex += 1) {
      const current = boxes[index];
      const other = boxes[otherIndex];

      expect(boxesOverlap(current.box, other.box), `${current.label} overlaps ${other.label}`).toBe(
        false,
      );
    }
  }
}

for (const language of ['sv', 'en'] as const) {
  test(`bottom tab bar renders semantic icons and labels in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await seedSettingsLanguage(page, language);
    await markAboutTheTestSeen(page);
    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectTabBarState(page, 'home', language);

    for (const route of routeSequence.slice(1)) {
      await tabLocator(page, route.name).click();
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(route.path)}(?:[?#].*)?$`));
      await dismissBlockingModals(page);
      await expectTabBarState(page, route.name, language);
    }

    expect(consoleErrors).toEqual([]);
  });
}
