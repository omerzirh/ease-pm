import { useSettingsStore, AIBackend } from '../store/useSettingsStore';

const BackendSelector = () => {
  const { aiBackend, setBackend } = useSettingsStore();

  const options: { label: string; value: AIBackend }[] = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Gemini', value: 'gemini' },
  ];

  return (
    <select
      className="border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-1 bg-app-surface-primary text-app-text-primary text-sm transition-colors"
      value={aiBackend}
      onChange={(e) => setBackend(e.target.value as AIBackend)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};

export default BackendSelector;
