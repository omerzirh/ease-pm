import { useSettingsStore, AIBackend } from '../store/useSettingsStore';

const BackendSelector = () => {
  const { aiBackend, setBackend } = useSettingsStore();

  const options: { label: string; value: AIBackend }[] = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Gemini', value: 'gemini' },
  ];

  return (
    <select
      className="border border-gray-300 dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800 text-sm"
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
