import { useCallback, useMemo, useState } from 'react';
import gitlabService from '../services/gitlabService';
import { useSettingsStore } from '../store/useSettingsStore';
import { Button, Input, Label, Checkbox } from './ui';

const parseEpicIid = (url: string): number | null => {
  try {
    const match = url.match(/\/epics\/(\d+)/);
    if (match) return parseInt(match[1], 10);
    return null;
  } catch {
    return null;
  }
};

const EpicMover = () => {
  const { groupId } = useSettingsStore();

  const [sourceUrl, setSourceUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [movedCount, setMovedCount] = useState(0);
  const [toMoveCount, setToMoveCount] = useState(0);
  const [itemsPreview, setItemsPreview] = useState<
    Array<{ id: number; iid: number; project_id: number; title: string; web_url: string; state: string }>
  >([]);

  const sourceIid = useMemo(() => parseEpicIid(sourceUrl || ''), [sourceUrl]);
  const targetIid = useMemo(() => parseEpicIid(targetUrl || ''), [targetUrl]);

  const validate = useCallback(() => {
    if (!groupId) return 'Group ID not set. Please configure it in Settings.';
    if (!sourceIid) return 'Invalid source epic URL. Expected to contain /epics/<iid>.';
    if (!targetIid) return 'Invalid target epic URL. Expected to contain /epics/<iid>.';
    if (sourceIid === targetIid) return 'Source and target epic cannot be the same.';
    return null;
  }, [groupId, sourceIid, targetIid]);

  const handlePreview = async () => {
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }
    setLoading(true);
    setMessage(null);
    setMovedCount(0);
    try {
      const issues = await gitlabService.fetchEpicIssues(groupId as string, sourceIid as number, 'opened');
      const openIssues = issues.filter((it) => it.state === 'opened');
      setItemsPreview(openIssues);
      setToMoveCount(openIssues.length);
      if (openIssues.length === 0) setMessage('No open items to move.');
    } catch (e: any) {
      setMessage(e.message || 'Failed to fetch epic issues');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async () => {
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }
    setLoading(true);
    setMessage(null);
    setMovedCount(0);
    try {
      const fetched = itemsPreview.length
        ? itemsPreview
        : await gitlabService.fetchEpicIssues(groupId as string, sourceIid as number, 'opened');
      const issues = fetched.filter((it) => it.state === 'opened');
      setToMoveCount(issues.length);

      if (issues.length === 0) {
        setMessage('No open items to move.');
        return;
      }

      if (dryRun) {
        setMessage(`Dry run: ${issues.length} items would be moved to target epic.`);
        return;
      }

      for (let i = 0; i < issues.length; i++) {
        const iss = issues[i];
        await gitlabService.addIssueToEpic(groupId as string, targetIid as number, iss.project_id, iss.id);
        setMovedCount(i + 1);
      }
      setMessage(`Moved ${issues.length} items to target epic.`);
    } catch (e: any) {
      setMessage(e.message || 'Failed to move items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <h2 className="text-lg font-medium">Move open items between epics</h2>

      <div>
        <Label>Source Epic URL</Label>
        <Input placeholder="https://gitlab.com/groups/.../-/epics/123" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
      </div>

      <div>
        <Label>Target Epic URL</Label>
        <Input placeholder="https://gitlab.com/groups/.../-/epics/456" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox label="Dry run" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
        <Button size="sm" variant="secondary" onClick={handlePreview} loading={loading}>Preview</Button>
        <Button size="sm" variant="primary" onClick={handleMove} loading={loading}>Move Open Items</Button>
      </div>

      {toMoveCount > 0 && (
        <p className="text-sm">Items to move: {toMoveCount}{movedCount > 0 ? ` • Moved: ${movedCount}` : ''}</p>
      )}

      {itemsPreview.length > 0 && (
        <div className="border rounded-md divide-y">
          {itemsPreview.map((it) => (
            <a key={`${it.project_id}-${it.iid}`} href={it.web_url} className="block px-3 py-2 hover:bg-accent text-sm" target="_blank" rel="noreferrer">
              #{it.iid} • {it.title}
            </a>
          ))}
        </div>
      )}

      {message && <p className="text-sm mt-1">{message}</p>}
    </div>
  );
};

export default EpicMover;
