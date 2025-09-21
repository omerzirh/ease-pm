import { useSettingsStore } from '../../store/useSettingsStore';
import { Input, Select, Label } from '../ui';

const AISettings = () => {
  const {
    aiBackend,
    setBackend,
    openaiApiKey,
    geminiApiKey,
    setOpenaiApiKey,
    setGeminiApiKey,
    setGeminiModel,
    setOpenaiModel,
    setOpenaiBaseUrl,
    openaiModel,
    geminiModel,
    openaiBaseUrl,
  } = useSettingsStore();

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">AI Provider</h2>
      <Label>Select backend</Label>
      <Select value={aiBackend} onChange={e => setBackend(e.target.value as any)}>
        <option value="openai">OpenAI</option>
        <option value="gemini">Google Gemini</option>
      </Select>

      {aiBackend === 'openai' && (
        <div>
          <div className="mt-4">
            <Label required>OpenAI Compatible API Url</Label>
            <Input
              type="text"
              value={openaiBaseUrl ?? ''}
              onChange={e => setOpenaiBaseUrl(e.target.value.trim() || null)}
              placeholder="https://api..."
              helperText="Pasting will be enough. No save button required."
            />
          </div>

          <div className="mt-4">
            <Label required>Model Name</Label>
            <Input
              type="text"
              value={openaiModel ?? ''}
              onChange={e => setOpenaiModel(e.target.value.trim() || null)}
              placeholder="gpt-4o"
              helperText="Pasting will be enough. No save button required."
            />
          </div>
          <div className="mt-4">
            <Label required>OpenAI Compatible API Key</Label>
            <Input
              type="password"
              value={openaiApiKey ?? ''}
              onChange={e => setOpenaiApiKey(e.target.value.trim() || null)}
              placeholder="sk-..."
              helperText="Pasting will be enough. No save button required."
            />
          </div>
        </div>
      )}

      {aiBackend === 'gemini' && (
        <div>
          <div className="mt-4">
            <Label required>Model Name</Label>
            <Input
              type="text"
              value={geminiModel ?? ''}
              onChange={e => setGeminiModel(e.target.value.trim() || null)}
              placeholder="gemini-2.5-flash"
              helperText="Pasting will be enough. No save button required."
            />
          </div>
          <div className="mt-4">
            <Label required>API Key</Label>
            <Input
              type="password"
              value={geminiApiKey ?? ''}
              onChange={e => setGeminiApiKey(e.target.value.trim() || null)}
              placeholder="AIza..."
              helperText="Pasting will be enough. No save button required."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettings;
