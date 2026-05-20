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

import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { readRecoverably, writeRecoverably } from './persistenceWarning';

const easyReadFontKey = 'a11y.easyReadFont.v1';
const fontSizeStepKey = 'a11y.fontSizeStep.v1';
const audioPlaybackRateKey = 'a11y.audioPlaybackRate.v1';
const accessibilityStorageId = 'accessibility';

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
  accessibilityStorage = createMMKV({ id: accessibilityStorageId });
} catch {
  accessibilityStorage = null;
}

type InitialAccessibilityState = {
  easyReadFont: boolean;
  fontSizeStep: FontSizeStep;
  audioPlaybackRate: AudioPlaybackRate;
  persistenceWarning: RecoverablePersistenceWarning | null;
};

function readEasyReadFont(): {
  value: boolean;
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const result = readRecoverably(
    accessibilityStorage,
    accessibilityStorageId,
    easyReadFontKey,
    () => accessibilityStorage?.getBoolean(easyReadFontKey),
  );
  return { value: result.value ?? false, persistenceWarning: result.warning };
}

function readFontSizeStep(): {
  value: FontSizeStep;
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const result = readRecoverably(
    accessibilityStorage,
    accessibilityStorageId,
    fontSizeStepKey,
    () => accessibilityStorage?.getNumber(fontSizeStepKey),
  );
  const v = result.value;
  if (v === 0 || v === 1 || v === 2 || v === 3) {
    return { value: v, persistenceWarning: result.warning };
  }
  return { value: 1, persistenceWarning: result.warning };
}

function readAudioPlaybackRate(): {
  value: AudioPlaybackRate;
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const result = readRecoverably(
    accessibilityStorage,
    accessibilityStorageId,
    audioPlaybackRateKey,
    () => accessibilityStorage?.getNumber(audioPlaybackRateKey),
  );
  const v = result.value;
  if (v === 0.5 || v === 0.75 || v === 1.0 || v === 1.25) {
    return { value: v, persistenceWarning: result.warning };
  }
  return { value: 1.0, persistenceWarning: result.warning };
}

function readInitialAccessibilityState(): InitialAccessibilityState {
  const easyReadFont = readEasyReadFont();
  const fontSizeStep = readFontSizeStep();
  const audioPlaybackRate = readAudioPlaybackRate();
  return {
    easyReadFont: easyReadFont.value,
    fontSizeStep: fontSizeStep.value,
    audioPlaybackRate: audioPlaybackRate.value,
    persistenceWarning:
      easyReadFont.persistenceWarning ??
      fontSizeStep.persistenceWarning ??
      audioPlaybackRate.persistenceWarning,
  };
}

type AccessibilityState = {
  easyReadFont: boolean;
  fontSizeStep: FontSizeStep;
  audioPlaybackRate: AudioPlaybackRate;
  persistenceWarning: RecoverablePersistenceWarning | null;
  setEasyReadFont: (enabled: boolean) => void;
  setFontSizeStep: (step: FontSizeStep) => void;
  setAudioPlaybackRate: (rate: AudioPlaybackRate) => void;
  clearPersistenceWarning: () => void;
};

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  ...readInitialAccessibilityState(),
  setEasyReadFont: (enabled) => {
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      easyReadFontKey,
      enabled,
    );
    set({ easyReadFont: enabled, persistenceWarning });
  },
  setFontSizeStep: (step) => {
    const clamped: FontSizeStep = step === 0 || step === 1 || step === 2 || step === 3 ? step : 1;
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      fontSizeStepKey,
      clamped,
    );
    set({ fontSizeStep: clamped, persistenceWarning });
  },
  setAudioPlaybackRate: (rate) => {
    const clamped: AudioPlaybackRate = AUDIO_PLAYBACK_RATES.includes(rate) ? rate : 1.0;
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      audioPlaybackRateKey,
      clamped,
    );
    set({ audioPlaybackRate: clamped, persistenceWarning });
  },
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

/** Pure selector for the active font scale multiplier. */
export function fontScaleFor(step: FontSizeStep): number {
  return FONT_SIZE_MULTIPLIERS[step];
}
