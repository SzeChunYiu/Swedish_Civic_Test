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

import type { ThemePreference } from '../theme';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { readRecoverably, writeRecoverably } from './persistenceWarning';

const easyReadFontKey = 'a11y.easyReadFont.v1';
const fontSizeStepKey = 'a11y.fontSizeStep.v1';
const audioPlaybackRateKey = 'a11y.audioPlaybackRate.v1';
const themeModeKey = 'a11y.themeMode.v1';
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

/** Free visual theme preference. "system" follows the device color scheme. */
export type ThemeMode = ThemePreference;
export const THEME_MODE_VALUES: readonly ThemeMode[] = ['system', 'light', 'dark'];

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
  themeMode: ThemeMode;
  persistenceWarning: RecoverablePersistenceWarning | null;
};

function normalizeEasyReadFont(value: unknown): boolean {
  return value === true;
}

function normalizeFontSizeStep(value: unknown): FontSizeStep {
  return value === 0 || value === 1 || value === 2 || value === 3 ? value : 1;
}

function normalizeAudioPlaybackRate(value: unknown): AudioPlaybackRate {
  return AUDIO_PLAYBACK_RATES.includes(value as AudioPlaybackRate)
    ? (value as AudioPlaybackRate)
    : 1.0;
}

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
  return { value: normalizeEasyReadFont(result.value), persistenceWarning: result.warning };
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
  return { value: normalizeFontSizeStep(result.value), persistenceWarning: result.warning };
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
  return { value: normalizeAudioPlaybackRate(result.value), persistenceWarning: result.warning };
}

function readInitialAccessibilityState(): InitialAccessibilityState {
  const easyReadFont = readEasyReadFont();
  const fontSizeStep = readFontSizeStep();
  const audioPlaybackRate = readAudioPlaybackRate();
  const themeMode = readThemeMode();
  return {
    easyReadFont: easyReadFont.value,
    fontSizeStep: fontSizeStep.value,
    audioPlaybackRate: audioPlaybackRate.value,
    themeMode,
    persistenceWarning:
      easyReadFont.persistenceWarning ??
      fontSizeStep.persistenceWarning ??
      audioPlaybackRate.persistenceWarning,
  };
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readThemeMode(): ThemeMode {
  try {
    const v = accessibilityStorage?.getString(themeModeKey);
    if (isThemeMode(v)) return v;
  } catch {
    return 'system';
  }

  return 'system';
}

type AccessibilityState = {
  easyReadFont: boolean;
  fontSizeStep: FontSizeStep;
  audioPlaybackRate: AudioPlaybackRate;
  themeMode: ThemeMode;
  persistenceWarning: RecoverablePersistenceWarning | null;
  setEasyReadFont: (enabled: boolean) => void;
  setFontSizeStep: (step: FontSizeStep) => void;
  setAudioPlaybackRate: (rate: AudioPlaybackRate) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  clearPersistenceWarning: () => void;
};

const initialAccessibilityState = readInitialAccessibilityState();

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  easyReadFont: initialAccessibilityState.easyReadFont,
  fontSizeStep: initialAccessibilityState.fontSizeStep,
  audioPlaybackRate: initialAccessibilityState.audioPlaybackRate,
  themeMode: initialAccessibilityState.themeMode,
  persistenceWarning: initialAccessibilityState.persistenceWarning,
  setEasyReadFont: (enabled) => {
    const normalized = normalizeEasyReadFont(enabled);
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      easyReadFontKey,
      normalized,
    );
    set({ easyReadFont: normalized, persistenceWarning });
  },
  setFontSizeStep: (step) => {
    const clamped = normalizeFontSizeStep(step);
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      fontSizeStepKey,
      clamped,
    );
    set({ fontSizeStep: clamped, persistenceWarning });
  },
  setAudioPlaybackRate: (rate) => {
    const clamped = normalizeAudioPlaybackRate(rate);
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      audioPlaybackRateKey,
      clamped,
    );
    set({ audioPlaybackRate: clamped, persistenceWarning });
  },
  setThemeMode: (themeMode) => {
    const clamped: ThemeMode = isThemeMode(themeMode) ? themeMode : 'system';
    const persistenceWarning = writeRecoverably(
      accessibilityStorage,
      accessibilityStorageId,
      themeModeKey,
      clamped,
    );
    set({ themeMode: clamped, persistenceWarning });
  },
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

/** Pure selector for the active font scale multiplier. */
export function fontScaleFor(step: unknown): number {
  return FONT_SIZE_MULTIPLIERS[normalizeFontSizeStep(step)];
}
