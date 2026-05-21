import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { isSafeImportedMapKey } from './importKeySafety';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { parseJsonRecoverably, readRecoverably, writeRecoverably } from './persistenceWarning';

// Ebook highlight + optional margin note. See
// swedish_citizenship_app_project_plan/15_ebook_highlights.md.
//
// Storage shape is intentionally indexed by chapterId so a chapter render
// can read only the highlights for the chapter it's showing.
//
// Block-and-offset addressing — NOT line numbers — keeps highlights stable
// when content is edited (block ids are stable, offsets only break when a
// specific block's text changes).

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export const FREE_HIGHLIGHT_COLORS: readonly HighlightColor[] = ['yellow'];
export const PRO_HIGHLIGHT_COLORS: readonly HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];

export interface Highlight {
  id: string;
  chapterId: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

const HIGHLIGHTS_STATE_KEY = 'ebook.highlights.v1';
const highlightsStorageId = 'highlights';
export const MAX_HIGHLIGHT_SPAN = 5000;
export const MAX_HIGHLIGHT_NOTE_LENGTH = 1000;
const ADD_HIGHLIGHT_INPUT_VALIDATION_ID = 'hl_input_validation';
const ADD_HIGHLIGHT_INPUT_VALIDATION_TIMESTAMP = '2026-01-01T00:00:00.000Z';

let highlightsStorage: MMKV | null = null;

try {
  highlightsStorage = createMMKV({ id: highlightsStorageId });
} catch {
  highlightsStorage = null;
}

export interface PersistedHighlights {
  // indexed by chapterId for fast per-chapter reads
  byChapter: Record<string, Highlight[]>;
}

const EMPTY: PersistedHighlights = { byChapter: {} };

function isHighlightColor(value: unknown): value is HighlightColor {
  return value === 'yellow' || value === 'green' || value === 'blue' || value === 'pink';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value === value.trim();
}

function isSafeChapterId(value: unknown): value is string {
  return isNonEmptyString(value) && isSafeImportedMapKey(value);
}

function createHighlightsByChapterMap(): Record<string, Highlight[]> {
  return Object.create(null) as Record<string, Highlight[]>;
}

function copySafeHighlightsByChapterMap(
  source: Record<string, Highlight[]>,
): Record<string, Highlight[]> {
  const byChapter = createHighlightsByChapterMap();
  for (const [chapterId, list] of Object.entries(source)) {
    if (!isSafeChapterId(chapterId) || !Array.isArray(list)) continue;
    byChapter[chapterId] = list;
  }
  return byChapter;
}

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0
  );
}

function isCanonicalUtcIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() !== value) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function normalizeNote(value: unknown, mode: 'hydrate' | 'write'): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    if (mode === 'write') throw new Error('Highlight note must be a string.');
    return undefined;
  }
  const note = value.trim();
  if (note.length === 0) return undefined;
  if (note.length > MAX_HIGHLIGHT_NOTE_LENGTH) {
    if (mode === 'write') throw new Error('Highlight note is too long.');
    return undefined;
  }
  return note;
}

function normalizeHighlight(
  value: unknown,
  chapterKey: string,
  mode: 'hydrate' | 'write',
): Highlight | null {
  if (!value || typeof value !== 'object') return null;
  const h = value as Partial<Highlight>;
  if (
    !isSafeChapterId(chapterKey) ||
    !isNonEmptyString(h.id) ||
    !isNonEmptyString(h.chapterId) ||
    h.chapterId !== chapterKey ||
    !isNonEmptyString(h.blockId) ||
    !isFiniteNonNegativeInteger(h.startOffset) ||
    !isFiniteNonNegativeInteger(h.endOffset) ||
    h.startOffset >= h.endOffset ||
    h.endOffset - h.startOffset > MAX_HIGHLIGHT_SPAN ||
    !isHighlightColor(h.color) ||
    !isCanonicalUtcIsoTimestamp(h.createdAt) ||
    !isCanonicalUtcIsoTimestamp(h.updatedAt ?? h.createdAt)
  ) {
    return null;
  }

  const note = normalizeNote(h.note, mode);
  return {
    id: h.id,
    chapterId: h.chapterId,
    blockId: h.blockId,
    startOffset: h.startOffset,
    endOffset: h.endOffset,
    color: h.color,
    ...(note ? { note } : {}),
    createdAt: h.createdAt,
    updatedAt: h.updatedAt ?? h.createdAt,
  };
}

export function normalizeHighlightsState(value: unknown): PersistedHighlights {
  if (!value || typeof value !== 'object') return EMPTY;
  const candidate = value as Partial<PersistedHighlights>;
  const byChapter = createHighlightsByChapterMap();

  if (candidate.byChapter && typeof candidate.byChapter === 'object') {
    for (const [chapterId, list] of Object.entries(candidate.byChapter)) {
      if (!isSafeChapterId(chapterId)) continue;
      if (!Array.isArray(list)) continue;
      const cleaned: Highlight[] = [];
      for (const item of list) {
        const highlight = normalizeHighlight(item, chapterId, 'hydrate');
        if (highlight) cleaned.push(highlight);
      }
      if (cleaned.length > 0) byChapter[chapterId] = cleaned;
    }
  }

  return { byChapter };
}

function read(): {
  state: PersistedHighlights;
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const result = readRecoverably(highlightsStorage, highlightsStorageId, HIGHLIGHTS_STATE_KEY, () =>
    highlightsStorage?.getString(HIGHLIGHTS_STATE_KEY),
  );
  if (!result.value) return { state: EMPTY, persistenceWarning: result.warning };
  const parsed = parseJsonRecoverably(
    result.value,
    highlightsStorageId,
    HIGHLIGHTS_STATE_KEY,
    (rawValue) => normalizeHighlightsState(JSON.parse(rawValue)),
    EMPTY,
  );
  return { state: parsed.value, persistenceWarning: parsed.warning ?? result.warning };
}

function write(state: PersistedHighlights): RecoverablePersistenceWarning | null {
  return writeRecoverably(
    highlightsStorage,
    highlightsStorageId,
    HIGHLIGHTS_STATE_KEY,
    JSON.stringify(normalizeHighlightsState(state)),
  );
}

function genId(): string {
  return `hl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface AddHighlightInput {
  chapterId: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  note?: string;
}

function normalizeAddHighlightInput(input: unknown): AddHighlightInput | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<AddHighlightInput>;
  if (!isSafeChapterId(candidate.chapterId)) throw new Error('Invalid highlight range.');
  if (candidate.color !== undefined && !isHighlightColor(candidate.color)) {
    throw new Error('Invalid highlight color.');
  }
  const highlight = normalizeHighlight(
    {
      id: ADD_HIGHLIGHT_INPUT_VALIDATION_ID,
      chapterId: candidate.chapterId,
      blockId: candidate.blockId,
      startOffset: candidate.startOffset,
      endOffset: candidate.endOffset,
      color: candidate.color,
      ...(candidate.note !== undefined ? { note: candidate.note } : {}),
      createdAt: ADD_HIGHLIGHT_INPUT_VALIDATION_TIMESTAMP,
      updatedAt: ADD_HIGHLIGHT_INPUT_VALIDATION_TIMESTAMP,
    },
    candidate.chapterId,
    'write',
  );
  if (!highlight) throw new Error('Invalid highlight range.');
  return {
    chapterId: highlight.chapterId,
    blockId: highlight.blockId,
    startOffset: highlight.startOffset,
    endOffset: highlight.endOffset,
    color: highlight.color,
    ...(highlight.note !== undefined ? { note: highlight.note } : {}),
  };
}

function createHighlight(input: AddHighlightInput, now: string): Highlight {
  const candidate: Highlight = {
    id: genId(),
    chapterId: input.chapterId,
    blockId: input.blockId,
    startOffset: input.startOffset,
    endOffset: input.endOffset,
    color: input.color,
    ...(input.note !== undefined ? { note: input.note } : {}),
    createdAt: now,
    updatedAt: now,
  };
  const highlight = normalizeHighlight(candidate, input.chapterId, 'write');
  if (!highlight) throw new Error('Invalid highlight range.');
  return highlight;
}

interface HighlightsState extends PersistedHighlights {
  persistenceWarning: RecoverablePersistenceWarning | null;
  addHighlight: (input: AddHighlightInput) => Highlight | null;
  updateHighlight: (id: string, patch: Partial<Pick<Highlight, 'color' | 'note'>>) => void;
  removeHighlight: (id: string) => void;
  clearChapter: (chapterId: string) => void;
  clearAll: () => void;
  clearPersistenceWarning: () => void;
}

const initial = read();

export const useHighlightsStore = create<HighlightsState>((set, get) => ({
  ...initial.state,
  persistenceWarning: initial.persistenceWarning,
  addHighlight: (input) => {
    const normalizedInput = normalizeAddHighlightInput(input);
    if (!normalizedInput) return null;
    const now = new Date().toISOString();
    const highlight = createHighlight(normalizedInput, now);
    set((state) => {
      const byChapter = copySafeHighlightsByChapterMap(state.byChapter);
      const existing = byChapter[normalizedInput.chapterId] ?? [];
      byChapter[normalizedInput.chapterId] = [...existing, highlight];
      const next = { byChapter };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
    return highlight;
  },
  updateHighlight: (id, patch) => {
    if (!isNonEmptyString(id) || !patch || typeof patch !== 'object') return;
    if (patch.color !== undefined && !isHighlightColor(patch.color)) {
      throw new Error('Invalid highlight color.');
    }
    const normalizedNote =
      patch.note !== undefined ? normalizeNote(patch.note, 'write') : undefined;
    set((state) => {
      const byChapter = createHighlightsByChapterMap();
      let touched = false;
      const updatedAt = new Date().toISOString();
      for (const [chapterId, list] of Object.entries(state.byChapter)) {
        if (!isSafeChapterId(chapterId) || !Array.isArray(list)) continue;
        byChapter[chapterId] = list.map((h) => {
          if (h.id !== id) return h;
          touched = true;
          const highlight = normalizeHighlight(
            {
              ...h,
              color: patch.color ?? h.color,
              note: patch.note !== undefined ? normalizedNote : h.note,
              updatedAt,
            },
            chapterId,
            'write',
          );
          if (!highlight) throw new Error('Invalid highlight update.');
          return highlight;
        });
      }
      if (!touched) return state;
      const next = normalizeHighlightsState({ byChapter });
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
  },
  removeHighlight: (id) => {
    set((state) => {
      const byChapter = createHighlightsByChapterMap();
      for (const [chapterId, list] of Object.entries(state.byChapter)) {
        if (!isSafeChapterId(chapterId) || !Array.isArray(list)) continue;
        byChapter[chapterId] = list.filter((h) => h.id !== id);
      }
      const next = { byChapter };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
  },
  clearChapter: (chapterId) => {
    if (!isSafeChapterId(chapterId)) return;
    set((state) => {
      const byChapter = copySafeHighlightsByChapterMap(state.byChapter);
      byChapter[chapterId] = [];
      const next = { byChapter };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
  },
  clearAll: () => {
    const persistenceWarning = write(EMPTY);
    set({ ...EMPTY, persistenceWarning });
  },
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

export function importHighlightsSnapshot(value: unknown): PersistedHighlights {
  const normalized = normalizeHighlightsState(value);
  const persistenceWarning = write(normalized);
  useHighlightsStore.setState({ ...normalized, persistenceWarning });
  return normalized;
}

// Pure selector helpers — usable outside React.
export function getHighlightsForChapter(
  state: Pick<HighlightsState, 'byChapter'>,
  chapterId: string,
): Highlight[] {
  if (!isSafeChapterId(chapterId)) return [];
  const list = state.byChapter[chapterId];
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizeHighlight(item, chapterId, 'hydrate'))
    .filter((item): item is Highlight => item !== null);
}

export function getHighlightsForBlock(
  state: Pick<HighlightsState, 'byChapter'>,
  chapterId: string,
  blockId: string,
): Highlight[] {
  return getHighlightsForChapter(state, chapterId).filter((h) => h.blockId === blockId);
}

export function isColorAllowed(color: HighlightColor, isPro: boolean): boolean {
  return isPro === true
    ? PRO_HIGHLIGHT_COLORS.includes(color)
    : FREE_HIGHLIGHT_COLORS.includes(color);
}
