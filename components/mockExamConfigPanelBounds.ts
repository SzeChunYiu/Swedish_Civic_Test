export const defaultMockExamConfigPanelBounds = {
  maxDurationMinutes: 90,
  minDurationMinutes: 2,
  minQuestionCount: 5,
  step: 1,
} as const;

export interface MockExamStepperRangeInput {
  fallbackMax: number;
  fallbackMin: number;
  max: number;
  min: number;
  step: number;
  value: number;
}

export interface MockExamStepperRange {
  boundsValid: boolean;
  max: number;
  min: number;
  step: number;
  value: number;
}

export function clampMockExamStepperValue(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(Math.round(value), max));
}

function roundFiniteInteger(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function normalizeNonNegativeInteger(value: number, fallback: number) {
  return Math.max(0, roundFiniteInteger(value, fallback));
}

export function normalizeMockExamPositiveStep(
  value: number,
  fallback = defaultMockExamConfigPanelBounds.step,
) {
  const rounded = roundFiniteInteger(value, fallback);
  return rounded > 0 ? rounded : fallback;
}

export function normalizeMockExamStepperRange({
  fallbackMax,
  fallbackMin,
  max,
  min,
  step,
  value,
}: MockExamStepperRangeInput): MockExamStepperRange {
  const minIsFinite = Number.isFinite(min);
  const maxIsFinite = Number.isFinite(max);
  const normalizedMin = normalizeNonNegativeInteger(min, fallbackMin);
  const rawMax = maxIsFinite ? Math.round(max) : fallbackMax;
  const normalizedMax = Math.max(normalizedMin, normalizeNonNegativeInteger(rawMax, fallbackMax));

  return {
    boundsValid: minIsFinite && maxIsFinite && rawMax >= normalizedMin,
    max: normalizedMax,
    min: normalizedMin,
    step: normalizeMockExamPositiveStep(step),
    value: clampMockExamStepperValue(value, normalizedMin, normalizedMax),
  };
}
