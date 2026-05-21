import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import {
  citizenshipRequirementAreas,
  type CitizenshipRequirementAreaId,
} from '../../data/citizenshipRequirements';
import { isSafeImportedMapKey } from './importKeySafety';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { parseJsonRecoverably, readRecoverably, writeRecoverably } from './persistenceWarning';

export type PersistedCitizenshipRequirementsChecklist = {
  checkedAreaIds: CitizenshipRequirementAreaId[];
};

const checklistStateKey = 'citizenshipRequirementsChecklistState';
const checklistStorageId = 'citizenship-requirements';
const validAreaIds = new Set<CitizenshipRequirementAreaId>(
  citizenshipRequirementAreas.map((area) => area.id),
);
const emptyChecklist: PersistedCitizenshipRequirementsChecklist = {
  checkedAreaIds: [],
};

let checklistStorage: MMKV | null = null;

try {
  checklistStorage = createMMKV({ id: checklistStorageId });
} catch {
  checklistStorage = null;
}

function normalizeCheckedAreaIds(value: unknown): CitizenshipRequirementAreaId[] {
  if (!Array.isArray(value)) return [];

  const selected = new Set<CitizenshipRequirementAreaId>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    if (!isSafeImportedMapKey(item)) continue;
    if (validAreaIds.has(item as CitizenshipRequirementAreaId)) {
      selected.add(item as CitizenshipRequirementAreaId);
    }
  }

  return citizenshipRequirementAreas
    .map((area) => area.id)
    .filter((areaId) => selected.has(areaId));
}

export function normalizeImportedCitizenshipRequirementsChecklist(
  value: unknown,
): PersistedCitizenshipRequirementsChecklist {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyChecklist;

  const candidate = value as Partial<PersistedCitizenshipRequirementsChecklist>;
  return {
    checkedAreaIds: normalizeCheckedAreaIds(candidate.checkedAreaIds),
  };
}

function parseChecklist(rawChecklist: string): PersistedCitizenshipRequirementsChecklist {
  return normalizeImportedCitizenshipRequirementsChecklist(JSON.parse(rawChecklist));
}

function readChecklist(): PersistedCitizenshipRequirementsChecklist & {
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const readResult = readRecoverably(checklistStorage, checklistStorageId, checklistStateKey, () =>
    checklistStorage?.getString(checklistStateKey),
  );
  if (!readResult.value) {
    return { ...emptyChecklist, persistenceWarning: readResult.warning };
  }

  const parseResult = parseJsonRecoverably(
    readResult.value,
    checklistStorageId,
    checklistStateKey,
    parseChecklist,
    emptyChecklist,
  );
  return { ...parseResult.value, persistenceWarning: parseResult.warning ?? readResult.warning };
}

function writeChecklist(
  checklist: PersistedCitizenshipRequirementsChecklist,
): PersistedCitizenshipRequirementsChecklist & {
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const normalizedChecklist = normalizeImportedCitizenshipRequirementsChecklist(checklist);
  const persistenceWarning = writeRecoverably(
    checklistStorage,
    checklistStorageId,
    checklistStateKey,
    JSON.stringify(normalizedChecklist),
  );
  return { ...normalizedChecklist, persistenceWarning };
}

type CitizenshipRequirementsChecklistState = PersistedCitizenshipRequirementsChecklist & {
  persistenceWarning: RecoverablePersistenceWarning | null;
  clearPersistenceWarning: () => void;
  setCheckedAreaIds: (areaIds: readonly CitizenshipRequirementAreaId[]) => void;
  toggleArea: (areaId: CitizenshipRequirementAreaId) => void;
};

const initialChecklist = readChecklist();

export const useCitizenshipRequirementsStore = create<CitizenshipRequirementsChecklistState>(
  (set) => ({
    ...initialChecklist,
    clearPersistenceWarning: () => set({ persistenceWarning: null }),
    setCheckedAreaIds: (areaIds) => {
      const persistedChecklist = writeChecklist({ checkedAreaIds: [...areaIds] });
      set(persistedChecklist);
    },
    toggleArea: (areaId) =>
      set((state) => {
        const checkedAreaIds = state.checkedAreaIds.includes(areaId)
          ? state.checkedAreaIds.filter((id) => id !== areaId)
          : [...state.checkedAreaIds, areaId];

        return writeChecklist({ checkedAreaIds });
      }),
  }),
);

export function importCitizenshipRequirementsChecklistSnapshot(
  checklist: unknown,
): PersistedCitizenshipRequirementsChecklist {
  const persistedChecklist = writeChecklist(
    normalizeImportedCitizenshipRequirementsChecklist(checklist),
  );
  useCitizenshipRequirementsStore.setState(persistedChecklist);
  return persistedChecklist;
}
