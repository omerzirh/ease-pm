import { create } from 'zustand';

interface GeneratedIssueContent {
  prompt: string;
  draftTitle: string;
  draftDescription: string;
  selectedLabels: string[];
  selectedEpic: { id: number; iid?: number; title: string; web_url: string } | null;
  enableEpic: boolean;
  epicQuery: string;
}

interface GeneratedIssueState {
  generatedContent: GeneratedIssueContent | null;
  setGeneratedContent: (content: GeneratedIssueContent) => void;
  updateField: <K extends keyof GeneratedIssueContent>(field: K, value: GeneratedIssueContent[K]) => void;
  clearContent: () => void;
}

const initialContent: GeneratedIssueContent = {
  prompt: '',
  draftTitle: '',
  draftDescription: '',
  selectedLabels: [],
  selectedEpic: null,
  enableEpic: false,
  epicQuery: '',
};

export const useGeneratedIssueStore = create<GeneratedIssueState>()((set, get) => ({
  generatedContent: null,
  setGeneratedContent: (generatedContent) => set({ generatedContent }),
  updateField: (field, value) => {
    const current = get().generatedContent || initialContent;
    set({ generatedContent: { ...current, [field]: value } });
  },
  clearContent: () => set({ generatedContent: null }),
}));