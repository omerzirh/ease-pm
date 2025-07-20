import { useState } from 'react';
import gitlabService from '../../services/gitlabService';
import { useLabelStore } from '../../store/useLabelStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const LabelsSettings = () => {
  const { labels, setLabels, keywords, setKeywords } = useLabelStore();
  const [preview, setPreview] = useState<typeof labels>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const projectId = useSettingsStore.getState().projectId;

  const handleFetch = async () => {
    if (!projectId) {
      setMessage('Missing VITE_GITLAB_PROJECT_ID');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const all = await gitlabService.fetchLabels(projectId);
      const filtered = filterLabels(all, keywords);
      setPreview(filtered);
    } catch (err: any) {
      setMessage(err.message || 'Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setLabels(preview);
    setMessage('Saved!');
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Label Settings</h2>

      <label className="block text-sm font-medium mb-1">Filter Keywords (comma separated)</label>
      <input
        value={keywords}
        onChange={e => setKeywords(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 bg-white dark:bg-gray-800"
        placeholder="bug,frontend,urgent"
      />

      <button
        onClick={handleFetch}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 mr-2"
        disabled={loading}
      >
        Fetch & Preview
      </button>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
        disabled={preview.length === 0}
      >
        Save
      </button>

      {preview.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto border p-2 rounded-md">
          {preview.map(l => (
            <div key={l.id} className="text-sm py-0.5">
              {l.name}
            </div>
          ))}
        </div>
      )}

      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

import type { Label } from '../../store/useLabelStore';

function filterLabels(all: Label[], kw: string): Label[] {
  if (!kw.trim()) return all;
  const kws = kw.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
  return all.filter(l => kws.some(k => l.name.toLowerCase().includes(k)));
}

export default LabelsSettings;
