import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MainTab = 'issue' | 'epic' | 'milestone' | 'iteration' | 'timeperiod' | 'settings';

interface TabState {
  tab: MainTab;
  setTab: (t: MainTab) => void;
}

export const useTabStore = create<TabState>()(
  persist(
    (set) => ({
      tab: 'issue',
      setTab: (tab) => set({ tab }),
    }),
    { name: 'ease-gitlab-tab' }
  )
);
