import { create } from 'zustand';

type SettingsState = { language: 'sv' | 'en' };

export const useSettingsStore = create<SettingsState>(() => ({ language: 'sv' }));
