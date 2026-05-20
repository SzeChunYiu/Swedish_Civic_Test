import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { readRecoverably, writeRecoverably } from './persistenceWarning';

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
const highlightsStorageId = 'ebook-highlights';
const maxHighlightOffset = 200_000;
const maxHighlightNoteLength = 2_000;

let highlightsStorage: MMKV | null = null;

try {
  highlightsStorage = createMMKV({ id: highlightsStorageId });
} catch {
  highlightsStorage = null;
}

interface PersistedHighlights {
  // indexed by chapterId for fast per-chapter reads
  byChapter: Record<string, Highlight[]>;
}

const EMPTY: PersistedHighlights = { byChapter: {} };

function isHighlightColor(value: unknown): value is HighlightColor {
  return value === 'yellow' || value === 'green' || value === 'blue' || value === 'pink';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function isValidOffset(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maxHighlightOffset
  );
}

function isValidNote(value: unknown): value is string | undefined {
  return (
    value === undefined || (typeof value === 'string' && value.length <= maxHighlightNoteLength)
  );
}

function normalize(value: unknown): PersistedHighlights {
  if (!value || typeof value !== 'object') return EMPTY;
  const candidate = value as Partial<PersistedHighlights>;
  const byChapter: Record<string, Highlight[]> = {};

  if (candidate.byChapter && typeof candidate.byChapter === 'object') {
    for (const [chapterId, list] of Object.entries(candidate.byChapter)) {
      if (!isNonEmptyString(chapterId)) continue;
      if (!Array.isArray(list)) continue;
      const cleaned: Highlight[] = [];
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const h = item as Partial<Highlight>;
        if (
          !isNonEmptyString(h.id) ||
          !isNonEmptyString(h.blockId) ||
          !isValidOffset(h.startOffset) ||
          !isValidOffset(h.endOffset) ||
          h.endOffset <= h.startOffset ||
          !isHighlightColor(h.color) ||
          !isCanonicalIsoTimestamp(h.createdAt) ||
          (h.updatedAt !== undefined && !isCanonicalIsoTimestamp(h.updatedAt)) ||
          !isValidNote(h.note)
        ) {
          continue;
        }
        cleaned.push({
          id: h.id,
          chapterId,
          blockId: h.blockId,
          startOffset: h.startOffset,
          endOffset: h.endOffset,
          color: h.color,
          note: h.note,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt ?? h.createdAt,
        });
      }
      byChapter[chapterId] = cleaned;
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
  try {
    return { state: normalize(JSON.parse(result.value)), persistenceWarning: result.warning };
  } catch {
    return { state: EMPTY, persistenceWarning: result.warning };
  }
}

function write(state: PersistedHighlights): RecoverablePersistenceWarning | null {
  return writeRecoverably(
    highlightsStorage,
    highlightsStorageId,
    HIGHLIGHTS_STATE_KEY,
    JSON.stringify(state),
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

function normalizeNoteInput(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  return value.length <= maxHighlightNoteLength ? value : value.slice(0, maxHighlightNoteLength);
}

function normalizeAddHighlightInput(input: AddHighlightInput): AddHighlightInput | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<AddHighlightInput>;
  const note = normalizeNoteInput(candidate.note);
  if (
    !isNonEmptyString(candidate.chapterId) ||
    !isNonEmptyString(candidate.blockId) ||
    !isValidOffset(candidate.startOffset) ||
    !isValidOffset(candidate.endOffset) ||
    candidate.endOffset <= candidate.startOffset ||
    !isHighlightColor(candidate.color) ||
    note === null
  ) {
    return null;
  }

  return {
    chapterId: candidate.chapterId.trim(),
    blockId: candidate.blockId.trim(),
    startOffset: candidate.startOffset,
    endOffset: candidate.endOffset,
    color: candidate.color,
    note,
  };
}

function normalizeHighlightPatch(
  patch: Partial<Pick<Highlight, 'color' | 'note'>>,
): Partial<Pick<Highlight, 'color' | 'note'>> | null {
  if (!patch || typeof patch !== 'object') return null;
  const candidate = patch as Partial<Record<'color' | 'note', unknown>>;
  const normalized: Partial<Pick<Highlight, 'color' | 'note'>> = {};

  if ('color' in candidate) {
    if (!isHighlightColor(candidate.color)) return null;
    normalized.color = candidate.color;
  }

  if ('note' in candidate && candidate.note !== undefined) {
    const note = normalizeNoteInput(candidate.note);
    if (note === null) return null;
    normalized.note = note;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
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
    const highlight: Highlight = {
      id: genId(),
      chapterId: normalizedInput.chapterId,
      blockId: normalizedInput.blockId,
      startOffset: normalizedInput.startOffset,
      endOffset: normalizedInput.endOffset,
      color: normalizedInput.color,
      note: normalizedInput.note,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const existing = state.byChapter[normalizedInput.chapterId] ?? [];
      const next = {
        byChapter: { ...state.byChapter, [normalizedInput.chapterId]: [...existing, highlight] },
      };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
    return highlight;
  },
  updateHighlight: (id, patch) => {
    const normalizedPatch = normalizeHighlightPatch(patch);
    if (!normalizedPatch) return;
    set((state) => {
      const byChapter: Record<string, Highlight[]> = {};
      let touched = false;
      for (const [chapterId, list] of Object.entries(state.byChapter)) {
        byChapter[chapterId] = list.map((h) => {
          if (h.id !== id) return h;
          touched = true;
          return {
            ...h,
            color: normalizedPatch.color ?? h.color,
            note: normalizedPatch.note !== undefined ? normalizedPatch.note : h.note,
            updatedAt: new Date().toISOString(),
          };
        });
      }
      if (!touched) return state;
      const next = { byChapter };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
  },
  removeHighlight: (id) => {
    set((state) => {
      const byChapter: Record<string, Highlight[]> = {};
      for (const [chapterId, list] of Object.entries(state.byChapter)) {
        byChapter[chapterId] = list.filter((h) => h.id !== id);
      }
      const next = { byChapter };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
  },
  clearChapter: (chapterId) => {
    set((state) => {
      const next = { byChapter: { ...state.byChapter, [chapterId]: [] } };
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

// Pure selector helpers — usable outside React.
export function getHighlightsForChapter(
  state: Pick<HighlightsState, 'byChapter'>,
  chapterId: string,
): Highlight[] {
  return state.byChapter[chapterId] ?? [];
}

export function getHighlightsForBlock(
  state: Pick<HighlightsState, 'byChapter'>,
  chapterId: string,
  blockId: string,
): Highlight[] {
  return getHighlightsForChapter(state, chapterId).filter((h) => h.blockId === blockId);
}

export function isColorAllowed(color: HighlightColor, isPro: boolean): boolean {
  return isPro ? PRO_HIGHLIGHT_COLORS.includes(color) : FREE_HIGHLIGHT_COLORS.includes(color);
}
