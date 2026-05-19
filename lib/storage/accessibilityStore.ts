// Accessibility settings store (blueprint 21).
//
// Separate from `settingsStore.ts` because the v1.0 SettingsState shape is
// pinned by scripts/validate-content.js — extending it would break the
// schema-parity test. v1.1 additions live here.
//
// LOAD-BEARING INVARIANT: every setting in this store is Free for everyone.
// Accessibility MUST NEVER be Pro-gated.

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

const easyReadFontKey = 'a11y.easyReadFont.v1';
const fontSizeStepKey = 'a11y.fontSizeStep.v1';
const audioPlaybackRateKey = 'a11y.audioPlaybackRate.v1';

/** Four discrete steps for the text-size stepper. */
export type FontSizeStep = 0 | 1 | 2 | 3;
export const FONT_SIZE_MULTIPLIERS: Record<FontSizeStep, number> = {
  0: 0.9, // compact
  1: 1.0, // standard
  2: 1.15, // large
  3: 1.35, // x-large
};

/** Allowed audio playback rates. Engine support varies; runtime clamps. */
export type AudioPlaybackRate = 0.5 | 0.75 | 1.0 | 1.25;
export const AUDIO_PLAYBACK_RATES: readonly AudioPlaybackRate[] = [0.5, 0.75, 1.0, 1.25];

let accessibilityStorage: MMKV | null = null;

try {
  accessibilityStorage = createMMKV({ id: 'accessibility' });
} catch {
  accessibilityStorage = null;
}

function readEasyReadFont(): boolean {
  return accessibilityStorage?.getBoolean(easyReadFontKey) ?? false;
}

function readFontSizeStep(): FontSizeStep {
  const v = accessibilityStorage?.getNumber(fontSizeStepKey);
  if (v === 0 || v === 1 || v === 2 || v === 3) return v;
  return 1;
}

function readAudioPlaybackRate(): AudioPlaybackRate {
  const v = accessibilityStorage?.getNumber(audioPlaybackRateKey);
  if (v === 0.5 || v === 0.75 || v === 1.0 || v === 1.25) return v;
  return 1.0;
}

type AccessibilityState = {
  easyReadFont: boolean;
  fontSizeStep: FontSizeStep;
  audioPlaybackRate: AudioPlaybackRate;
  setEasyReadFont: (enabled: boolean) => void;
  setFontSizeStep: (step: FontSizeStep) => void;
  setAudioPlaybackRate: (rate: AudioPlaybackRate) => void;
};

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  easyReadFont: readEasyReadFont(),
  fontSizeStep: readFontSizeStep(),
  audioPlaybackRate: readAudioPlaybackRate(),
  setEasyReadFont: (enabled) => {
    accessibilityStorage?.set(easyReadFontKey, enabled);
    set({ easyReadFont: enabled });
  },
  setFontSizeStep: (step) => {
    const clamped: FontSizeStep = step === 0 || step === 1 || step === 2 || step === 3 ? step : 1;
    accessibilityStorage?.set(fontSizeStepKey, clamped);
    set({ fontSizeStep: clamped });
  },
  setAudioPlaybackRate: (rate) => {
    const clamped: AudioPlaybackRate = AUDIO_PLAYBACK_RATES.includes(rate) ? rate : 1.0;
    accessibilityStorage?.set(audioPlaybackRateKey, clamped);
    set({ audioPlaybackRate: clamped });
  },
}));

/** Pure selector for the active font scale multiplier. */
export function fontScaleFor(step: FontSizeStep): number {
  return FONT_SIZE_MULTIPLIERS[step];
}
