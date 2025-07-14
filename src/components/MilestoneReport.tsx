import { useEffect, useState } from 'react';
import gitlabService from '../services/gitlabService';



interface Milestone {
  id: number;
  title: string;
  description: string;
}

const MilestoneReport = () => {
  const groupId = import.meta.env.VITE_GITLAB_GROUP_ID as string;
  const projectId = import.meta.env.VITE_GITLAB_PROJECT_ID as string;
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [summary, setSummary] = useState('');
  const [existingReportId, setExistingReportId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<{ iid: number; url: string } | null>(null);


  const loadMilestones = async () => {
    if (!groupId) {
      setMessage('Missing VITE_GITLAB_GROUP_ID');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await gitlabService.fetchMilestones(groupId);
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
      const issues = await gitlabService.fetchIssuesByMilestone(projectId, milestone.title);
      const listMarkdown = issues
        .map(i => `- ${i.state === 'closed' ? '✅' : '🟢'} ${i.title}`)
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
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
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
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 bg-white dark:bg-gray-800"
            value={existingReportId}
            onChange={e => setExistingReportId(e.target.value)}
            placeholder="e.g. 123"
          />
          <label className="block text-sm font-medium mb-1">Generated Summary</label>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
          />
          {createdReport ? (
            <a
              href={createdReport.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-2 bg-green-700 text-white rounded-md inline-block"
            >
              Report #{createdReport.iid} created
            </a>
          ) : (
            <button
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
              onClick={handleCreateOrUpdate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create / Update Report'}
            </button>
          )}
        </div>
      )}

      {message && (
        <p className="mt-2 text-sm text-center {message.startsWith('Report issue') ? 'text-green-600' : 'text-red-600'}">
          {message}
        </p>
      )}
    </div>
  );
};

export default MilestoneReport;
