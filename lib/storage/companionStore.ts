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
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { readRecoverably, writeRecoverably } from './persistenceWarning';

const SELECTED_ID_KEY = 'companion.selectedId.v1';
const companionStorageId = 'companion';

let companionStorage: MMKV | null = null;
try {
  companionStorage = createMMKV({ id: companionStorageId });
} catch {
  companionStorage = null;
}

function readSelected(): {
  selectedId: MascotId;
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const result = readRecoverably(companionStorage, companionStorageId, SELECTED_ID_KEY, () =>
    companionStorage?.getString(SELECTED_ID_KEY),
  );
  return {
    selectedId: resolveCompanionId(result.value),
    persistenceWarning: result.warning,
  };
}

type CompanionState = {
  selectedId: MascotId;
  persistenceWarning: RecoverablePersistenceWarning | null;
  setSelected: (id: MascotId) => void;
  reset: () => void;
  clearPersistenceWarning: () => void;
};

const initial = readSelected();

export const useCompanionStore = create<CompanionState>((set) => ({
  selectedId: initial.selectedId,
  persistenceWarning: initial.persistenceWarning,
  setSelected: (id) => {
    if (!isMascotId(id)) return;
    const persistenceWarning = writeRecoverably(
      companionStorage,
      companionStorageId,
      SELECTED_ID_KEY,
      id,
    );
    set({ selectedId: id, persistenceWarning });
  },
  reset: () => {
    const persistenceWarning = writeRecoverably(
      companionStorage,
      companionStorageId,
      SELECTED_ID_KEY,
      DEFAULT_COMPANION_ID,
    );
    set({ selectedId: DEFAULT_COMPANION_ID, persistenceWarning });
  },
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

/**
 * Pure resolver — given a possibly-stale persisted id, return a usable
 * MascotId. Falls back to DEFAULT_COMPANION_ID when the id no longer
 * exists in the catalog (e.g. content shipped a renamed mascot).
 */
export function resolveCompanionId(stored: unknown): MascotId {
  return isMascotId(stored) ? stored : DEFAULT_COMPANION_ID;
}
