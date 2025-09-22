import { create } from 'zustand';

interface GeneratedEpicContent {
  prompt: string;
  title: string;
  description: string;
  titlePrefix: string;
  selectedLabels: string[];
  parentEpic: { id: number; title: string; web_url: string } | null;
  enableEpic: boolean;
}

interface GeneratedEpicState {
  generatedContent: GeneratedEpicContent | null;
  setGeneratedContent: (content: GeneratedEpicContent) => void;
  updateField: <K extends keyof GeneratedEpicContent>(field: K, value: GeneratedEpicContent[K]) => void;
  clearContent: () => void;
}

const initialContent: GeneratedEpicContent = {
  prompt: '',
  title: '',
  description: '',
  titlePrefix: '',
  selectedLabels: [],
  parentEpic: null,
  enableEpic: false,
};

export const useGeneratedEpicStore = create<GeneratedEpicState>()((set, get) => ({
  generatedContent: null,
  setGeneratedContent: (generatedContent) => set({ generatedContent }),
  updateField: (field, value) => {
    const current = get().generatedContent || initialContent;
    set({ generatedContent: { ...current, [field]: value } });
  },
  clearContent: () => set({ generatedContent: null }),
}));
