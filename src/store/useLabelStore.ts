import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Label {
  id: number;
  name: string;
  description: string;
}

interface LabelState {
  labels: Label[];
  issueKeywords: string;
  epicKeywords: string;
  setLabels: (labels: Label[]) => void;
  setIssueKeywords: (kw: string) => void;
  setEpicKeywords: (kw: string) => void;
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set) => ({
      labels: [],
      issueKeywords: '',
      epicKeywords: '',
      setLabels: (labels) => set({ labels }),
      setIssueKeywords: (issueKeywords) => set({ issueKeywords }),
      setEpicKeywords: (epicKeywords) => set({ epicKeywords }),
    }),
    {
      name: 'label-store',
    }
  )
);

export const filterLabelsByKeywords = (labels: Label[], keywords: string): Label[] => {
  if (!keywords.trim()) return labels;
  const kws = keywords
    .toLowerCase()
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return labels.filter((l) => kws.some((k) => l.name.toLowerCase().includes(k)));
};
