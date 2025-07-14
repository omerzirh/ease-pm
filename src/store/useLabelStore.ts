import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Label {
  id: number;
  name: string;
  description: string;
}

interface LabelState {
  labels: Label[];
  keywords: string; // comma-separated filter keywords
  setLabels: (labels: Label[]) => void;
  setKeywords: (kw: string) => void;
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set) => ({
      labels: [],
      keywords: '',
      setLabels: (labels) => set({ labels }),
      setKeywords: (keywords) => set({ keywords }),
    }),
    {
      name: 'label-store', // localStorage key
    },
  ),
);
