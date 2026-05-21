import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import {
  citizenshipRequirementAreas,
  type CitizenshipRequirementAreaId,
} from '../../data/citizenshipRequirements';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { parseJsonRecoverably, readRecoverably, writeRecoverably } from './persistenceWarning';

const checkedAreaIdsKey = 'citizenshipRequirements.checkedAreaIds.v1';
const citizenshipRequirementsStorageId = 'citizenship-requirements';
const citizenshipRequirementAreaIdSet = new Set<CitizenshipRequirementAreaId>(
  citizenshipRequirementAreas.map((area) => area.id),
);

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

function parseCheckedAreaIds(rawValue: string): CitizenshipRequirementAreaId[] {
  return normalizeCitizenshipRequirementAreaIds(JSON.parse(rawValue));
}

function readCheckedAreaIds(): {
  checkedAreaIds: CitizenshipRequirementAreaId[];
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const readResult = readRecoverably(
    citizenshipRequirementsStorage,
    citizenshipRequirementsStorageId,
    checkedAreaIdsKey,
    () => citizenshipRequirementsStorage?.getString(checkedAreaIdsKey),
  );

  if (!readResult.value) {
    return { checkedAreaIds: [], persistenceWarning: readResult.warning };
  }

  const parseResult = parseJsonRecoverably(
    readResult.value,
    citizenshipRequirementsStorageId,
    checkedAreaIdsKey,
    parseCheckedAreaIds,
    [],
  );

  return {
    checkedAreaIds: parseResult.value,
    persistenceWarning: parseResult.warning ?? readResult.warning,
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

  return { checkedAreaIds: normalizedCheckedAreaIds, persistenceWarning };
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
