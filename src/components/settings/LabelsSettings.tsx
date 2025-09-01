import { useState } from "react";
import gitlabService from "../../services/gitlabService";
import { useLabelStore } from "../../store/useLabelStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const LabelsSettings = () => {
  const { labels, setLabels, keywords, setKeywords } = useLabelStore();
  const [preview, setPreview] = useState<typeof labels>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const projectId = useSettingsStore.getState().projectId;

  const handleFetch = async () => {
    if (!projectId) {
      setMessage("Missing VITE_GITLAB_PROJECT_ID");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const all = await gitlabService.fetchLabels(projectId);
      const filtered = filterLabels(all, keywords);
      setPreview(filtered);
    } catch (err: unknown) {
      setMessage(err.message || "Failed to fetch labels");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setLabels(preview);
    setMessage("Saved!");
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Label Settings</h2>

      <Label>Filter Keywords (comma separated)</Label>
      <Input
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="bug,frontend,urgent"
        className="mb-4"
      />

      <Button
        onClick={handleFetch}
        variant="primary"
        className="mr-2"
        disabled={loading}
        loading={loading}
      >
        Fetch & Preview
      </Button>
      <Button
        onClick={handleSave}
        variant="primary"
        disabled={preview.length === 0}
      >
        Save
      </Button>

      {preview.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto border p-2 rounded-md">
          {preview.map((l) => (
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

import type { Label as LabelType } from "../../store/useLabelStore";

function filterLabels(all: LabelType[], kw: string): LabelType[] {
  if (!kw.trim()) return all;
  const kws = kw
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return all.filter((l) => kws.some((k) => l.name.toLowerCase().includes(k)));
}

export default LabelsSettings;
