import { useState } from 'react';
import gitlabService from '../../services/gitlabService';
import { useLabelStore, filterLabelsByKeywords } from '../../store/useLabelStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const LabelsSettings = () => {
  const { labels, setLabels, issueKeywords, epicKeywords, setIssueKeywords, setEpicKeywords } = useLabelStore();
  const [allLabels, setAllLabels] = useState<typeof labels>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { projectId } = useSettingsStore();

  const issuePreview = filterLabelsByKeywords(allLabels, issueKeywords);
  const epicPreview = filterLabelsByKeywords(allLabels, epicKeywords);

  const handleFetch = async () => {
    if (!projectId) {
      setMessage('Missing VITE_GITLAB_PROJECT_ID');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const all = await gitlabService.fetchLabels(projectId);
      setAllLabels(all);
      setMessage(`Fetched ${all.length} labels. Set filter keywords to preview filtered results.`);
    } catch (err: any) {
      setMessage(err.message || 'Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (allLabels.length === 0) {
      setMessage('Please fetch labels first');
      return;
    }

    setLabels(allLabels);
    setMessage('Label filters saved!');
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Label Settings</h2>

      {allLabels.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">All Available Labels ({allLabels.length})</h3>
          <div className="max-h-32 overflow-y-auto border p-2 rounded-md bg-gray-50">
            <div className="flex flex-wrap gap-1">
              {allLabels.map((l) => (
                <span key={l.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label>Issue Filter Keywords (comma separated)</Label>
          <Input
            value={issueKeywords}
            onChange={(e) => setIssueKeywords(e.target.value)}
            placeholder="bug,frontend,urgent"
            className="mb-4"
          />

          {allLabels.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Issue Labels Preview ({issuePreview.length})
                {issueKeywords.trim() === '' && <span className="text-gray-500 font-normal"> - showing all</span>}
              </h3>
              <div className="max-h-48 overflow-y-auto border p-2 rounded-md">
                {issuePreview.map((l) => (
                  <div key={l.id} className="text-sm py-0.5">
                    {l.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Label>Epic Filter Keywords (comma separated)</Label>
          <Input
            value={epicKeywords}
            onChange={(e) => setEpicKeywords(e.target.value)}
            placeholder="epic,feature,milestone"
            className="mb-4"
          />

          {allLabels.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Epic Labels Preview ({epicPreview.length})
                {epicKeywords.trim() === '' && <span className="text-gray-500 font-normal"> - showing all</span>}
              </h3>
              <div className="max-h-48 overflow-y-auto border p-2 rounded-md">
                {epicPreview.map((l) => (
                  <div key={l.id} className="text-sm py-0.5">
                    {l.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={handleFetch} variant="primary" className="mr-2" disabled={loading} loading={loading}>
          Fetch & Preview
        </Button>
        <Button onClick={handleSave} variant="primary" disabled={allLabels.length === 0}>
          Save
        </Button>
      </div>

      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default LabelsSettings;
