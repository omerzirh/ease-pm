import { useSettingsStore } from '../../store/useSettingsStore';

const AISettings = () => {
  const { aiBackend, setBackend } = useSettingsStore();

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">AI Provider</h2>
      <label className="block text-sm font-medium mb-1">Select backend</label>
      <select
        value={aiBackend}
        onChange={e => setBackend(e.target.value as any)}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Google Gemini</option>
      </select>
    </div>
  );
};

export default AISettings;
