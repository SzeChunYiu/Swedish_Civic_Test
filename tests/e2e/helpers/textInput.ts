import type { Locator } from '@playwright/test';

export async function forceTextInputValue(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, nextValue) => {
    const target = element as HTMLInputElement | HTMLTextAreaElement;
    const prototype =
      target instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    valueSetter?.call(target, nextValue);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
