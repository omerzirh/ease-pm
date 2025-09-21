import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrefixState {
  prefixes: string[];
  addPrefix: (p: string) => void;
  removePrefix: (p: string) => void;
}

export const usePrefixStore = create<PrefixState>()(
  persist(
    (set, get) => ({
      prefixes: [],
      addPrefix: p => {
        if (!p.trim()) return;
        const { prefixes } = get();
        if (prefixes.includes(p)) return;
        set({ prefixes: [...prefixes, p] });
      },
      removePrefix: p => {
        const { prefixes } = get();
        set({ prefixes: prefixes.filter(x => x !== p) });
      },
    }),
    {
      name: 'prefix-store',
    }
  )
);
