import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIBackend = 'openai' | 'gemini';

interface SettingsState {
  aiBackend: AIBackend;
  setBackend: (b: AIBackend) => void;

  openaiApiKey: string | null;
  geminiApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => void;
  setGeminiApiKey: (key: string | null) => void;

  groupId: string | null;
  groupName: string | null;
  projectId: string | null;
  projectName: string | null;
  setGroupId: (id: string) => void;
  setGroupName: (name: string) => void;
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;

  gitlabHost: string | null;
  gitlabAppId: string | null;
  gitlabCallbackUrl: string | null;
  setGitlabHost: (host: string | null) => void;
  setGitlabAppId: (id: string | null) => void;
  setGitlabCallbackUrl: (url: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiBackend: 'openai',
      setBackend: (aiBackend) => set({ aiBackend }),

      openaiApiKey: null,
      geminiApiKey: null,
      setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),

      groupId: null,
      groupName: null,
      projectId: null,
      projectName: null,
      setGroupId: (groupId) => set({ groupId }),
      setGroupName: (groupName) => set({ groupName }),
      setProjectId: (projectId) => set({ projectId }),
      setProjectName: (projectName) => set({ projectName }),

      gitlabHost: null,
      gitlabAppId: null,
      gitlabCallbackUrl: null,
      setGitlabHost: (gitlabHost) => set({ gitlabHost }),
      setGitlabAppId: (gitlabAppId) => set({ gitlabAppId }),
      setGitlabCallbackUrl: (gitlabCallbackUrl) => set({ gitlabCallbackUrl }),
    }),
    {
      name: 'ease-gitlab-settings',
    },
  ),
);
