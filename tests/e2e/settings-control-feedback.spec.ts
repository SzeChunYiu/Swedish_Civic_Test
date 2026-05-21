import { expect, test, type Locator, type Page } from '@playwright/test';

import { colors, motion } from '../../lib/theme';
import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  markAboutTheTestSeen,
} from './browserLaunch';

type Box = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;
type Center = { x: number; y: number };
type LayoutSnapshot = {
  bodyScrollHeight: number;
  bodyScrollWidth: number;
  rootScrollHeight: number;
  rootScrollWidth: number;
};
type ControlTarget = {
  label: string;
  locator: Locator;
};

const focusColor = hexToRgb(colors.focus);
const mobileViewport = { width: 390, height: 844 };

function hexToRgb(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return ['rgb', '(', red, ', ', green, ', ', blue, ')'].join('');
}

function centerOf(box: Box): Center {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function expectSameCenter(before: Center, after: Center, label: string) {
  expect(Math.abs(after.x - before.x), `${label} center x drift`).toBeLessThanOrEqual(0.75);
  expect(Math.abs(after.y - before.y), `${label} center y drift`).toBeLessThanOrEqual(0.75);
}

function expectSameLayout(before: LayoutSnapshot, after: LayoutSnapshot, label: string) {
  expect(after.rootScrollWidth, `${label} root scroll width`).toBe(before.rootScrollWidth);
  expect(after.bodyScrollWidth, `${label} body scroll width`).toBe(before.bodyScrollWidth);
  expect(
    Math.abs(after.rootScrollHeight - before.rootScrollHeight),
    `${label} root scroll height`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(after.bodyScrollHeight - before.bodyScrollHeight),
    `${label} body scroll height`,
  ).toBeLessThanOrEqual(1);
}

async function getBox(locator: Locator, label: string): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box, `${label} should have measurable geometry`).not.toBeNull();
  return box!;
}

async function getLayoutSnapshot(page: Page): Promise<LayoutSnapshot> {
  return page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    bodyScrollWidth: document.body.scrollWidth,
    rootScrollHeight: document.documentElement.scrollHeight,
    rootScrollWidth: document.documentElement.scrollWidth,
  }));
}

async function getTargetStyle(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);

    return {
      borderColor: style.borderTopColor,
      transform: style.transform,
    };
  });
}

function readScale(transform: string): number {
  if (transform === 'none') return 1;

  const matrixMatch = transform.match(/^matrix\(([^,]+),/);
  if (matrixMatch) return Number.parseFloat(matrixMatch[1]);

  const matrix3dMatch = transform.match(/^matrix3d\(([^,]+),/);
  if (matrix3dMatch) return Number.parseFloat(matrix3dMatch[1]);

  throw new Error(`Unsupported transform format: ${transform}`);
}

async function expectStableMobileTarget(target: ControlTarget): Promise<Box> {
  await target.locator.scrollIntoViewIfNeeded();
  await expect(target.locator, `${target.label} should be visible`).toBeVisible();
  const box = await getBox(target.locator, target.label);

  expect(box.width, `${target.label} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
  expect(box.height, `${target.label} should be at least 44px tall`).toBeGreaterThanOrEqual(44);

  return box;
}

async function expectFocusFeedback(page: Page, target: ControlTarget, idleBox: Box) {
  const idleCenter = centerOf(idleBox);
  const idleLayout = await getLayoutSnapshot(page);

  await target.locator.focus();
  await expect
    .poll(async () => (await getTargetStyle(target.locator)).borderColor)
    .toBe(focusColor);

  const focusedBox = await getBox(target.locator, `${target.label} focused`);
  const focusedLayout = await getLayoutSnapshot(page);

  expectSameCenter(idleCenter, centerOf(focusedBox), `${target.label} focus`);
  expectSameLayout(idleLayout, focusedLayout, `${target.label} focus`);
}

async function expectPressFeedback(page: Page, target: ControlTarget, idleBox: Box) {
  const idleCenter = centerOf(idleBox);
  const idleLayout = await getLayoutSnapshot(page);

  await page.mouse.move(idleCenter.x, idleCenter.y);
  await page.mouse.down();
  await expect
    .poll(async () => readScale((await getTargetStyle(target.locator)).transform))
    .toBeCloseTo(motion.pressedScale, 2);

  const pressedBox = await getBox(target.locator, `${target.label} pressed`);
  const pressedLayout = await getLayoutSnapshot(page);

  expectSameCenter(idleCenter, centerOf(pressedBox), `${target.label} press`);
  expectSameLayout(idleLayout, pressedLayout, `${target.label} press`);

  await page.mouse.move(1, 1);
  await page.mouse.up();
}

async function expectReducedMotionPressFeedback(page: Page, target: ControlTarget, idleBox: Box) {
  const idleCenter = centerOf(idleBox);
  const idleLayout = await getLayoutSnapshot(page);

  await page.mouse.move(idleCenter.x, idleCenter.y);
  await page.mouse.down();
  await expect
    .poll(async () => readScale((await getTargetStyle(target.locator)).transform))
    .toBe(1);

  const pressedBox = await getBox(target.locator, `${target.label} reduced-motion pressed`);
  const pressedLayout = await getLayoutSnapshot(page);

  expectSameCenter(idleCenter, centerOf(pressedBox), `${target.label} reduced-motion press`);
  expectSameLayout(idleLayout, pressedLayout, `${target.label} reduced-motion press`);

  await page.mouse.move(1, 1);
  await page.mouse.up();
}

test.use({ viewport: mobileViewport });

test('settings language, audio, and daily goal controls keep token focus and press feedback', async ({
  page,
}) => {
  await markAboutTheTestSeen(page);
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const controls: ControlTarget[] = [
    {
      label: 'English support language control',
      locator: page.getByRole('radio', { name: 'Byt studiespråk till Engelskt stöd' }),
    },
    {
      label: 'Audio switch',
      locator: page.getByRole('switch', { name: 'Stäng av ljud' }),
    },
    {
      label: '20-answer daily goal control',
      locator: page.getByRole('radio', { name: 'Ställ in dagligt mål till 20 svar' }),
    },
  ];

  for (const control of controls) {
    const idleBox = await expectStableMobileTarget(control);

    await expectFocusFeedback(page, control, idleBox);
    await expectPressFeedback(page, control, idleBox);
  }

  expect(errors.get()).toEqual([]);
});

test('settings controls suppress token scale feedback when reduced motion is active', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await markAboutTheTestSeen(page);
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const controls: ControlTarget[] = [
    {
      label: 'English support language control',
      locator: page.getByRole('radio', { name: 'Byt studiespråk till Engelskt stöd' }),
    },
    {
      label: 'Audio switch',
      locator: page.getByRole('switch', { name: 'Stäng av ljud' }),
    },
    {
      label: '20-answer daily goal control',
      locator: page.getByRole('radio', { name: 'Ställ in dagligt mål till 20 svar' }),
    },
  ];

  for (const control of controls) {
    const idleBox = await expectStableMobileTarget(control);

    await expectFocusFeedback(page, control, idleBox);
    await expectReducedMotionPressFeedback(page, control, idleBox);
  }

  expect(errors.get()).toEqual([]);
});
