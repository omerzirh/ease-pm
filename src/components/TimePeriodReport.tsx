import { useState } from 'react';
import gitlabService from '../services/gitlabService';
import { useSettingsStore } from '../store/useSettingsStore';
import { Select, Textarea, Button, Input, Label, buttonVariants } from './ui';
import { cn } from '../lib/utils';

interface Issue {
  id: number;
  iid: number;
  title: string;
  web_url: string;
  state: string;
  closed_at: string;
  labels: string[];
}

interface AssigneeSummary {
  assignee: string;
  issues: Issue[];
}

const TimePeriodReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [assigneeSummaries, setAssigneeSummaries] = useState<AssigneeSummary[]>([]);
  const [summary, setSummary] = useState('');
  const [existingReportId, setExistingReportId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<{ iid: number; url: string } | null>(null);

  const { projectId } = useSettingsStore();

  const groupIssuesByAssignee = (issues: Issue[]): AssigneeSummary[] => {
    const assigneeMap = new Map<string, Issue[]>();

    issues.forEach((issue) => {
      const assigneeLabels = issue.labels?.filter((label: string) => label.startsWith('Assignee::')) || [];

      if (assigneeLabels.length === 0) {
        const backlog = assigneeMap.get('Backlog') || [];
        backlog.push(issue);
        assigneeMap.set('Backlog', backlog);
      } else {
        assigneeLabels.forEach((label: string) => {
          const assigneeName = label.replace('Assignee::', '');
          const assigneeIssues = assigneeMap.get(assigneeName) || [];
          assigneeIssues.push(issue);
          assigneeMap.set(assigneeName, assigneeIssues);
        });
      }
    });

    return Array.from(assigneeMap.entries()).map(([assignee, issues]) => ({
      assignee,
      issues,
    }));
  };

  const fetchIssuesByDateRange = async () => {
    if (!projectId || !startDate || !endDate) {
      setMessage('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setMessage('Start date must be before end date');
      return;
    }

    setLoading(true);
    setMessage(null);
    setIssues([]);
    setAssigneeSummaries([]);
    setSummary('');

    try {
      const fetchedIssues = await gitlabService.fetchIssuesByDateRange(
        projectId,
        startDate + 'T00:00:00Z',
        endDate + 'T23:59:59Z'
      );


      if (fetchedIssues.length === 0) {
        setMessage('No closed issues found in the selected date range');
        return;
      }

      setIssues(fetchedIssues);
      const grouped = groupIssuesByAssignee(fetchedIssues);
      setAssigneeSummaries(grouped);

      // Generate summary
      const dateRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      let reportContent = `## Time Period Report\n\n`;
      reportContent += `**Date Range:** ${dateRange}\n`;
      reportContent += `**Total Issues Closed:** ${fetchedIssues.length}\n\n`;

      if (grouped.length > 0) {
        reportContent += `### Work by Assignee:\n\n`;
        grouped.forEach(({ assignee, issues }) => {
          reportContent += `**${assignee}** (${issues.length} issues):\n`;
          issues.forEach((issue) => {
            const closedDate = new Date(issue.closed_at).toLocaleDateString();
            reportContent += `- ✅ [${issue.title}](${issue.web_url}) (closed: ${closedDate})\n`;
          });
          reportContent += '\n';
        });
      }

      reportContent += `### All Issues:\n`;
      fetchedIssues.forEach((issue) => {
        const closedDate = new Date(issue.closed_at).toLocaleDateString();
        reportContent += `- ✅ [${issue.title}](${issue.web_url}) (closed: ${closedDate})\n`;
      });

      setSummary(reportContent);
    } catch (err: unknown) {
      setMessage((err instanceof Error && err.message) ? err.message : 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!projectId || !summary) return;
    setLoading(true);
    setMessage(null);

    try {
      let reportIid: number;
      let reportUrl: string;
      const dateRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;

      if (existingReportId.trim()) {
        reportIid = Number(existingReportId.trim());
        try {
          await gitlabService.updateIssue(projectId, reportIid, {
            description: summary,
          });
          reportUrl = `${gitlabService.getHostUrl()}/projects/${projectId}/-/issues/${reportIid}`;
          setMessage(`Report #${reportIid} updated`);
        } catch (error) {
          throw new Error(`Failed to update existing report: ${error}`);
        }
      } else {
        const res = await gitlabService.createIssue(
          projectId,
          `Time Period Report – ${dateRange}`,
          summary,
          ['time-period-report']
        );
        reportIid = res.iid;
        reportUrl = res.web_url;
        setMessage(`Report created: ${reportUrl}`);
        setCreatedReport({ iid: res.iid, url: res.web_url });
      }

      const already = await gitlabService.fetchIssueLinks(projectId, reportIid);
      let linkedCount = 0;

      for (const issue of issues) {
        if (!already.includes(issue.iid) && issue.iid !== reportIid) {
          try {
            await gitlabService.linkIssues(projectId, reportIid, issue.iid);
            linkedCount++;
          } catch (error) {
            console.warn(`Failed to link issue #${issue.iid}:`, error);
          }
        }
      }

      setMessage((prev) => `${prev ? prev + ' | ' : ''}Linked ${linkedCount} issues to report #${reportIid}`);
    } catch (err: unknown) {
      setMessage((err instanceof Error && err.message) ? err.message : 'Failed to create/update report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Label required>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={fetchIssuesByDateRange}
          disabled={!startDate || !endDate}
        >
          Fetch Issues
        </Button>
      </div>

      {assigneeSummaries.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Issues by Assignee</h3>
          <div className="space-y-4">
            {assigneeSummaries.map(({ assignee, issues }) => (
              <div key={assignee} className="border border-border rounded-md p-4 bg-card">
                <h4 className="font-medium text-lg mb-2 text-card-foreground">
                  {assignee} ({issues.length} issues)
                </h4>
                <div className="space-y-1">
                  {issues.map((issue) => (
                    <div key={issue.id} className="flex items-center gap-2">
                      <span>✅</span>
                      <a
                        href={issue.web_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {issue.title}
                      </a>
                      <span className="text-sm text-muted-foreground">
                        (closed: {new Date(issue.closed_at).toLocaleDateString()})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div>
          <Label>Existing Report IID (optional)</Label>
          <Input
            className="mb-4"
            value={existingReportId}
            onChange={(e) => setExistingReportId(e.target.value)}
            placeholder="e.g. 123"
          />
          <Label>Generated Summary</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={12} />
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
          className={`mt-2 text-sm text-center ${message.startsWith('Report') ? 'text-green-600' : 'text-destructive'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default TimePeriodReport;