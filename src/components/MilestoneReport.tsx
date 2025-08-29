import { useEffect, useState } from 'react';
import gitlabService from '../services/gitlabService';
import { useSettingsStore } from '../store/useSettingsStore';



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

  const {projectId, groupId} = useSettingsStore.getState();

  const loadMilestones = async () => {
    if (!projectId) {
      setMessage('Missing VITE_GITLAB_PROJECT_ID');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      let data = await gitlabService.fetchMilestones(projectId!);
      if(data.length === 0) {
        setMessage('No milestones found');
        data = await gitlabService.fetchGroupMilestones(groupId!);
      }
      setMilestones(data);
    } catch (err: any) {
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
    } catch (err: any) {
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
          selectedMilestone.id,
        );
        reportIid = res.iid;
        setMessage(`Report created: ${res.web_url}`);
        setCreatedReport({ iid: res.iid, url: res.web_url });
      }
      const issues = await gitlabService.fetchIssuesByMilestone(projectId, selectedMilestone.title);
      const already = await gitlabService.fetchIssueLinks(projectId, reportIid);
      for (const iss of issues) {
        console.log(iss.iid, reportIid)
        if (!already.includes(iss.iid) && iss.iid !== reportIid) {
          await gitlabService.linkIssues(projectId, reportIid, iss.iid);
        }
      }
      setMessage(prev => `${prev ? prev + ' | ' : ''}Linked ${issues.length} issues to report #${reportIid}`);
    } catch (err: any) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      </div>

      {milestones.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Select Milestone</label>
          <select
            className="w-full border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-2 bg-app-surface-primary text-app-text-primary transition-colors"
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
          </select>
        </div>
      )}

      {summary && (
        <div>
          <label className="block text-sm font-medium mb-1">Existing Report IID (optional)</label>
          <input
            className="w-full border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-2 mb-4 bg-app-surface-primary text-app-text-primary placeholder:text-app-text-tertiary transition-colors"
            value={existingReportId}
            onChange={e => setExistingReportId(e.target.value)}
            placeholder="e.g. 123"
          />
          <label className="block text-sm font-medium mb-1">Generated Summary</label>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={10}
            className="w-full border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-2 bg-app-surface-primary text-app-text-primary placeholder:text-app-text-tertiary transition-colors"
          />
          {createdReport ? (
            <a
              href={createdReport.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-2 bg-app-surface-secondary border-l-4 border-app-semantic-success text-app-semantic-success rounded-md inline-block"
            >
              Report #{createdReport.iid} created
            </a>
          ) : (
            <button
              className="mt-2 px-4 py-2 bg-app-interactive-primary hover:bg-app-interactive-primary-hover text-app-text-inverse rounded-md disabled:bg-app-interactive-disabled disabled:opacity-50 transition-colors"
              onClick={handleCreateOrUpdate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create / Update Report'}
            </button>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-sm text-center ${message.startsWith('Report issue') ? 'text-app-semantic-success' : 'text-app-semantic-error'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default MilestoneReport;
