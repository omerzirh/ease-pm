import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EpicRef {
  id: number;
  iid?: number;
  title: string;
  web_url: string;
}

interface EpicState {
  selectedEpic: EpicRef | null;
  setEpic: (e: EpicRef | null) => void;
}

export const useEpicStore = create<EpicState>()(
  persist(
    (set) => ({
      selectedEpic: null,
      setEpic: (selectedEpic) => set({ selectedEpic }),
    }),
    { name: 'ease-gitlab-epic' },
  ),
);
