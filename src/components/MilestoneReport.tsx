import { useEffect, useState } from 'react';
import gitlabService from '../services/gitlabService';
import { useSettingsStore } from '../store/useSettingsStore';
import { Select, Textarea, Button, Input, Label, buttonVariants } from './ui';

import { cn } from '../lib/utils';

interface Milestone {
  id: number;
  title: string;
  description: string;
}

const MilestoneReport = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [summary, setSummary] = useState('');
  const [existingReportId, setExistingReportId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<{ iid: number; url: string } | null>(null);

  const { projectId, groupId } = useSettingsStore.getState();

  const loadMilestones = async () => {
    if (!projectId) {
      setMessage('Missing VITE_GITLAB_PROJECT_ID');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      let data = await gitlabService.fetchMilestones(projectId!);
      if (data.length === 0) {
        setMessage('No milestones found');
        data = await gitlabService.fetchGroupMilestones(groupId!);
      }
      setMilestones(data);
    } catch (err: unknown) {
      setMessage(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const loadIssuesAndSummary = async (milestone: Milestone) => {
    setLoading(true);
    setMessage(null);
    try {
      const issues = await gitlabService.fetchIssuesByMilestone(projectId!, milestone.title);
      const listMarkdown = issues
        .map(i => {
          const statusIcon = i.state === 'closed' ? '✅' : '🟢';
          const titleText = i.web_url ? `[${i.title}](${i.web_url})` : i.title;
          return `- ${statusIcon} ${titleText}`;
        })
        .join('\n');
      setSelectedMilestone(milestone);
      setSummary(listMarkdown);
    } catch (err: unknown) {
      setMessage(err.message || 'Failed to load issues / summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!projectId || !selectedMilestone) return;
    setLoading(true);
    setMessage(null);
    try {
      let reportIid: number;
      if (existingReportId.trim()) {
        reportIid = Number(existingReportId.trim());
      } else {
        const res = await gitlabService.createIssue(
          projectId,
          `${selectedMilestone.title} – Report`,
          summary,
          [],
          selectedMilestone.id
        );
        reportIid = res.iid;
        setMessage(`Report created: ${res.web_url}`);
        setCreatedReport({ iid: res.iid, url: res.web_url });
      }
      const issues = await gitlabService.fetchIssuesByMilestone(projectId, selectedMilestone.title);
      const already = await gitlabService.fetchIssueLinks(projectId, reportIid);
      for (const iss of issues) {
        console.log(iss.iid, reportIid);
        if (!already.includes(iss.iid) && iss.iid !== reportIid) {
          await gitlabService.linkIssues(projectId, reportIid, iss.iid);
        }
      }
      setMessage(prev => `${prev ? prev + ' | ' : ''}Linked ${issues.length} issues to report #${reportIid}`);
    } catch (err: unknown) {
      setMessage(err.message || 'Failed to create report issue');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadMilestones();
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>

      {milestones.length > 0 && (
        <div>
          <Label required>Select Milestone</Label>
          <Select
            onChange={e => {
              const m = milestones.find(mil => mil.id === Number(e.target.value));
              if (m) loadIssuesAndSummary(m);
            }}
          >
            <option value="">Choose a milestone</option>
            {milestones.map(m => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
        </div>
      )}

      {summary && (
        <div>
          <Label>Existing Report IID (optional)</Label>
          <Input
            className="mb-4"
            value={existingReportId}
            onChange={e => setExistingReportId(e.target.value)}
            placeholder="e.g. 123"
          />
          <Label>Generated Summary</Label>
          <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={10} />
          {createdReport ? (
            <a
              href={createdReport.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('mt-2', buttonVariants({ variant: 'success' }))}
            >
              Report #{createdReport.iid} created
            </a>
          ) : (
            <Button className="mt-2" variant="primary" size="md" loading={loading} onClick={handleCreateOrUpdate}>
              Create / Update Report
            </Button>
          )}
        </div>
      )}

      {message && (
        <p
          className={`mt-2 text-sm text-center ${message.startsWith('Report issue') ? 'text-green-600' : 'text-destructive'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default MilestoneReport;
