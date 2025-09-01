import { useSettingsStore } from '../../store/useSettingsStore';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Label } from '../ui/label';

const AISettings = () => {
  const { aiBackend, setBackend, openaiApiKey, geminiApiKey, setOpenaiApiKey, setGeminiApiKey } = useSettingsStore();

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">AI Provider</h2>
      <Label>Select backend</Label>
      <Select
        value={aiBackend}
        onChange={e => setBackend(e.target.value as any)}
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Google Gemini</option>
      </Select>

      {aiBackend === 'openai' && (
        <div className="mt-4">
          <Label required>OpenAI Compatible API Key</Label>
          <Input
            type="password"
            value={openaiApiKey ?? ''}
            onChange={e => setOpenaiApiKey(e.target.value.trim() || null)}
            placeholder="sk-..."
            helperText="Don't worry about clicking the eye button. Pasting the key is enough."
          />
        </div>
      )}

      {aiBackend === 'gemini' && (
        <div className="mt-4">
          <Label required>Google Gemini API Key</Label>
          <Input
            type="password"
            value={geminiApiKey ?? ''}
            onChange={e => setGeminiApiKey(e.target.value.trim() || null)}
            placeholder="AIza..."
            helperText="Don't worry about clicking the eye button. Pasting the key is enough."
          />
        </div>
      )}
    </div>
  );
};

export default AISettings;
