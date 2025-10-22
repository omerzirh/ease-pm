import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrefixState {
  issuePrefixes: string[];
  epicPrefixes: string[];
  addIssuePrefix: (prefix: string) => void;
  addEpicPrefix: (prefix: string) => void;
  removeIssuePrefix: (prefix: string) => void;
  removeEpicPrefix: (prefix: string) => void;
}

export const usePrefixStore = create<PrefixState>()(
  persist(
    (set) => ({
      issuePrefixes: [],
      epicPrefixes: [],
      addIssuePrefix: (prefix) =>
        set((state) => ({
          issuePrefixes: [...new Set([...state.issuePrefixes, prefix])]
        })),
      addEpicPrefix: (prefix) =>
        set((state) => ({
          epicPrefixes: [...new Set([...state.epicPrefixes, prefix])]
        })),
      removeIssuePrefix: (prefix) =>
        set((state) => ({
          issuePrefixes: state.issuePrefixes.filter((p) => p !== prefix)
        })),
      removeEpicPrefix: (prefix) =>
        set((state) => ({
          epicPrefixes: state.epicPrefixes.filter((p) => p !== prefix)
        })),
    }),
    {
      name: 'ease-gitlab-prefixes'
    }
  )
);
