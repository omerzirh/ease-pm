import { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

const AISettings = () => {
  const { aiBackend, setBackend, openaiApiKey, geminiApiKey, setOpenaiApiKey, setGeminiApiKey } = useSettingsStore();
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

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

      {aiBackend === 'openai' && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">OpenAI Compatible API Key</label>
          <div className="relative">
            <input
              type={showOpenai ? 'text' : 'password'}
              value={openaiApiKey ?? ''}
              onChange={e => setOpenaiApiKey(e.target.value.trim() || null)}
              placeholder="sk-..."
              className="w-full pr-10 border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
            />
            <button
              type="button"
              onClick={() => setShowOpenai(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
              aria-label={showOpenai ? 'Hide key' : 'Show key'}
            >
              {showOpenai ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Don't worry about clicking the eye button. Pasting the key is enough.</p>
        </div>
      )}

      {aiBackend === 'gemini' && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Google Gemini API Key</label>
          <div className="relative">
            <input
              type={showGemini ? 'text' : 'password'}
              value={geminiApiKey ?? ''}
              onChange={e => setGeminiApiKey(e.target.value.trim() || null)}
              placeholder="AIza..."
              className="w-full pr-10 border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
            />
            <button
              type="button"
              onClick={() => setShowGemini(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
              aria-label={showGemini ? 'Hide key' : 'Show key'}
            >
              {showGemini ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Don't worry about clicking the eye button. Pasting the key is enough.</p>
        </div>
      )}
    </div>
  );
};

export default AISettings;
