import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIBackend = 'openai' | 'gemini';

interface SettingsState {
  aiBackend: AIBackend;
  setBackend: (b: AIBackend) => void;

  groupId: string | null;
  groupName: string | null;
  projectId: string | null;
  projectName: string | null;
  setGroupId: (id: string) => void;
  setGroupName: (name: string) => void;
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiBackend: 'openai',
      setBackend: (aiBackend) => set({ aiBackend }),

      groupId: null,
      groupName: null,
      projectId: null,
      projectName: null,
      setGroupId: (groupId) => set({ groupId }),
      setGroupName: (groupName) => set({ groupName }),
      setProjectId: (projectId) => set({ projectId }),
      setProjectName: (projectName) => set({ projectName }),
    }),
    {
      name: 'ease-gitlab-settings',
    },
  ),
);
