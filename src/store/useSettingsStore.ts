import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIBackend = 'openai' | 'gemini';

interface SettingsState {
  aiBackend: AIBackend;
  setBackend: (b: AIBackend) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiBackend: 'openai',
      setBackend: (aiBackend) => set({ aiBackend }),
    }),
    {
      name: 'ease-gitlab-settings',
    },
  ),
);
