import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrefixState {
  prefixes: string[];
  addPrefix: (p: string) => void;
  removePrefix: (p: string) => void;
}

/**
 * zustand store for managing commit/issue prefixes.
 * Persisted in localStorage under key `prefix-store`.
 */
export const usePrefixStore = create<PrefixState>()(
  persist(
    (set, get) => ({
      prefixes: [],
      addPrefix: (p) => {
        if (!p.trim()) return;
        const { prefixes } = get();
        if (prefixes.includes(p)) return; // avoid duplicates
        set({ prefixes: [...prefixes, p] });
      },
      removePrefix: (p) => {
        const { prefixes } = get();
        set({ prefixes: prefixes.filter((x) => x !== p) });
      },
    }),
    {
      name: 'prefix-store', // localStorage key
    },
  ),
);
