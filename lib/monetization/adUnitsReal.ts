import type { AdPlacement } from '../../types/monetization';

export const REAL_AD_UNITS_JSON_ENV = 'EXPO_PUBLIC_ADMOB_REAL_UNITS_JSON';

export interface RealAdUnitOverride {
  androidUnitId?: string;
  iosUnitId?: string;
}

export type RealAdUnitOverrides = Partial<Record<AdPlacement, RealAdUnitOverride>>;

const AD_UNIT_ID_PATTERN = /^ca-app-pub-\d{16}\/\d{10}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readAdUnitId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return AD_UNIT_ID_PATTERN.test(trimmed) ? trimmed : undefined;
}

function normalizeOverride(value: unknown): RealAdUnitOverride | undefined {
  if (!isRecord(value)) return undefined;

  const androidUnitId = readAdUnitId(value.androidUnitId ?? value.android);
  const iosUnitId = readAdUnitId(value.iosUnitId ?? value.ios);

  if (!androidUnitId && !iosUnitId) return undefined;

  return {
    androidUnitId,
    iosUnitId,
  };
}

export function readRealAdUnitOverrides(
  rawJson = process.env[REAL_AD_UNITS_JSON_ENV],
): RealAdUnitOverrides {
  if (!rawJson?.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {};
  }

  if (!isRecord(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed).flatMap(([placement, value]) => {
      const override = normalizeOverride(value);
      return override ? [[placement, override]] : [];
    }),
  ) as RealAdUnitOverrides;
}

export function getRealAdUnitOverride(
  placement: AdPlacement,
  overrides = readRealAdUnitOverrides(),
): RealAdUnitOverride | undefined {
  return overrides[placement];
}
