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

const checkedAreaIdsKey = 'citizenshipRequirements.checkedAreaIds.v1';
const legacyChecklistStateKey = 'citizenshipRequirementsChecklistState';
const citizenshipRequirementsStorageId = 'citizenship-requirements';
const citizenshipRequirementAreaIdSet = new Set<CitizenshipRequirementAreaId>(
  citizenshipRequirementAreas.map((area) => area.id),
);
const emptyCitizenshipRequirementsChecklist = {
  checkedAreaIds: [],
} as const satisfies PersistedCitizenshipRequirementsChecklist;

let citizenshipRequirementsStorage: MMKV | null = null;

try {
  citizenshipRequirementsStorage = createMMKV({ id: citizenshipRequirementsStorageId });
} catch {
  citizenshipRequirementsStorage = null;
}

export function normalizeCitizenshipRequirementAreaIds(
  value: unknown,
): CitizenshipRequirementAreaId[] {
  if (!Array.isArray(value)) return [];

  const selectedIds = new Set<CitizenshipRequirementAreaId>();
  for (const candidate of value) {
    if (typeof candidate !== 'string') continue;
    const areaId = candidate.trim() as CitizenshipRequirementAreaId;
    if (citizenshipRequirementAreaIdSet.has(areaId)) selectedIds.add(areaId);
  }

  return citizenshipRequirementAreas
    .map((area) => area.id)
    .filter((areaId) => selectedIds.has(areaId));
}

export type PersistedCitizenshipRequirementsChecklist = {
  checkedAreaIds: CitizenshipRequirementAreaId[];
};

export function normalizeImportedCitizenshipRequirementsChecklist(
  value: unknown,
): PersistedCitizenshipRequirementsChecklist {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...emptyCitizenshipRequirementsChecklist };
  }

  const candidate = value as Record<string, unknown>;
  const checkedAreaIdsEntry = Object.entries(candidate).find(
    ([key]) => key === 'checkedAreaIds' && isSafeImportedMapKey(key),
  );

  return {
    checkedAreaIds: normalizeCitizenshipRequirementAreaIds(checkedAreaIdsEntry?.[1]),
  };
}

function readCheckedAreaIds(): {
  checkedAreaIds: CitizenshipRequirementAreaId[];
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const readLegacyCheckedAreaIds = (
    primaryPersistenceWarning: RecoverablePersistenceWarning | null,
  ) => {
    const legacyReadResult = readRecoverably(
      citizenshipRequirementsStorage,
      citizenshipRequirementsStorageId,
      legacyChecklistStateKey,
      () => citizenshipRequirementsStorage?.getString(legacyChecklistStateKey),
    );

    if (!legacyReadResult.value) {
      return {
        checkedAreaIds: [],
        persistenceWarning: primaryPersistenceWarning ?? legacyReadResult.warning,
      };
    }

    const legacyParseResult = parseJsonRecoverably(
      legacyReadResult.value,
      citizenshipRequirementsStorageId,
      legacyChecklistStateKey,
      (rawValue) => {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed)
          ? normalizeCitizenshipRequirementAreaIds(parsed)
          : normalizeImportedCitizenshipRequirementsChecklist(parsed).checkedAreaIds;
      },
      [],
    );

    return {
      checkedAreaIds: legacyParseResult.value,
      persistenceWarning:
        primaryPersistenceWarning ?? legacyParseResult.warning ?? legacyReadResult.warning,
    };
  };

  const readResult = readRecoverably(
    citizenshipRequirementsStorage,
    citizenshipRequirementsStorageId,
    checkedAreaIdsKey,
    () => citizenshipRequirementsStorage?.getString(checkedAreaIdsKey),
  );

  if (!readResult.value) {
    return readLegacyCheckedAreaIds(readResult.warning);
  }

  const parseResult = parseJsonRecoverably(
    readResult.value,
    citizenshipRequirementsStorageId,
    checkedAreaIdsKey,
    (rawValue) => {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed)
        ? normalizeCitizenshipRequirementAreaIds(parsed)
        : normalizeImportedCitizenshipRequirementsChecklist(parsed).checkedAreaIds;
    },
    [],
  );

  if (parseResult.warning) {
    return readLegacyCheckedAreaIds(parseResult.warning);
  }

  return {
    checkedAreaIds: parseResult.value,
    persistenceWarning: readResult.warning,
  };
}

function persistCheckedAreaIds(checkedAreaIds: readonly CitizenshipRequirementAreaId[]): {
  checkedAreaIds: CitizenshipRequirementAreaId[];
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const normalizedCheckedAreaIds = normalizeCitizenshipRequirementAreaIds(checkedAreaIds);
  const persistenceWarning = writeRecoverably(
    citizenshipRequirementsStorage,
    citizenshipRequirementsStorageId,
    checkedAreaIdsKey,
    JSON.stringify(normalizedCheckedAreaIds),
  );
  const legacyPersistenceWarning = writeRecoverably(
    citizenshipRequirementsStorage,
    citizenshipRequirementsStorageId,
    legacyChecklistStateKey,
    JSON.stringify({ checkedAreaIds: normalizedCheckedAreaIds }),
  );

  return {
    checkedAreaIds: normalizedCheckedAreaIds,
    persistenceWarning: persistenceWarning ?? legacyPersistenceWarning,
  };
}

type CitizenshipRequirementsChecklistState = {
  checkedAreaIds: CitizenshipRequirementAreaId[];
  clearPersistenceWarning: () => void;
  isAreaChecked: (areaId: CitizenshipRequirementAreaId) => boolean;
  persistenceWarning: RecoverablePersistenceWarning | null;
  setCheckedAreaIds: (areaIds: readonly CitizenshipRequirementAreaId[]) => void;
  toggleArea: (areaId: CitizenshipRequirementAreaId) => void;
};

const initialChecklistState = readCheckedAreaIds();

export const useCitizenshipRequirementsChecklistStore =
  create<CitizenshipRequirementsChecklistState>((set, get) => ({
    checkedAreaIds: initialChecklistState.checkedAreaIds,
    persistenceWarning: initialChecklistState.persistenceWarning,
    clearPersistenceWarning: () => set({ persistenceWarning: null }),
    isAreaChecked: (areaId) => get().checkedAreaIds.includes(areaId),
    setCheckedAreaIds: (areaIds) => set(persistCheckedAreaIds(areaIds)),
    toggleArea: (areaId) =>
      set((state) => {
        if (!citizenshipRequirementAreaIdSet.has(areaId)) return state;

        const checkedIds = new Set(state.checkedAreaIds);
        if (checkedIds.has(areaId)) {
          checkedIds.delete(areaId);
        } else {
          checkedIds.add(areaId);
        }

        return persistCheckedAreaIds([...checkedIds]);
      }),
  }));

export const useCitizenshipRequirementsStore = useCitizenshipRequirementsChecklistStore;

export function importCitizenshipRequirementsChecklistSnapshot(
  value: unknown,
): PersistedCitizenshipRequirementsChecklist {
  const normalized = normalizeImportedCitizenshipRequirementsChecklist(value);
  useCitizenshipRequirementsChecklistStore.setState(
    persistCheckedAreaIds(normalized.checkedAreaIds),
  );
  return normalized;
}
