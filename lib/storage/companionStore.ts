// Selected mascot study-companion persistence (blueprint 23, iteration 2).
//
// Separate MMKV-backed Zustand store rather than extending settingsStore.ts
// (whose v1.0 shape is pinned by scripts/validate-content.js).
//
// Free for everyone — companion picker is NEVER Pro-gated, by invariant.

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { DEFAULT_COMPANION_ID, isMascotId, type MascotId } from '../mascot/catalog';

const SELECTED_ID_KEY = 'companion.selectedId.v1';

let companionStorage: MMKV | null = null;
try {
  companionStorage = createMMKV({ id: 'companion' });
} catch {
  companionStorage = null;
}

function readSelected(): MascotId {
  const raw = companionStorage?.getString(SELECTED_ID_KEY);
  return isMascotId(raw) ? raw : DEFAULT_COMPANION_ID;
}

type CompanionState = {
  selectedId: MascotId;
  setSelected: (id: MascotId) => void;
  reset: () => void;
};

export const useCompanionStore = create<CompanionState>((set) => ({
  selectedId: readSelected(),
  setSelected: (id) => {
    if (!isMascotId(id)) return;
    companionStorage?.set(SELECTED_ID_KEY, id);
    set({ selectedId: id });
  },
  reset: () => {
    companionStorage?.set(SELECTED_ID_KEY, DEFAULT_COMPANION_ID);
    set({ selectedId: DEFAULT_COMPANION_ID });
  },
}));

/**
 * Pure resolver — given a possibly-stale persisted id, return a usable
 * MascotId. Falls back to DEFAULT_COMPANION_ID when the id no longer
 * exists in the catalog (e.g. content shipped a renamed mascot).
 */
export function resolveCompanionId(stored: unknown): MascotId {
  return isMascotId(stored) ? stored : DEFAULT_COMPANION_ID;
}
