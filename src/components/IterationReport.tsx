import { useEffect, useState } from 'react';
import gitlabService, { Iteration } from '../services/gitlabService';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateAssigneeSummary } from '../services/aiService';

interface AssigneeSummary {
  assignee: string;
  issues: Array<{ title: string; state: string; web_url: string }>;
  aiSummary?: string;
}

const IterationReport = () => {
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [selectedIteration, setSelectedIteration] = useState<Iteration | null>(null);
  const [summary, setSummary] = useState('');
  const [assigneeSummaries, setAssigneeSummaries] = useState<AssigneeSummary[]>([]);
  const [existingReportId, setExistingReportId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<{ iid: number; url: string } | null>(null);
  const [iterationState, setIterationState] = useState<'opened' | 'current' | 'closed'>('current');

  const { projectId, groupId, aiBackend } = useSettingsStore.getState();

  const loadIterations = async (state?: 'opened' | 'current' | 'closed') => {
    if (!groupId && !projectId) {
      setMessage('Missing Group ID or Project ID in settings');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      let data;
      // Try project iterations first if projectId is available
      if (projectId) {
        console.log(gitlabService)
        data = await gitlabService.fetchProjectIterations(projectId, { 
          state: state || 'opened',
          includeAncestors: true 
        });
      } else if (groupId) {
        // Fall back to group iterations
        data = await gitlabService.fetchIterations(groupId, state || 'opened');
      } else {
        throw new Error('No project or group ID available');
      }
      
      if(data.length === 0) {
        setMessage('No iterations found');
      }
      // Sort iterations by start date (most recent first)
      const sortedData = data.sort((a: Iteration, b: Iteration) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      setIterations(sortedData);
    } catch (err: any) {
      setMessage(err.message || 'Failed to load iterations');
    } finally {
      setLoading(false);
    }
  };

  const groupIssuesByAssignee = (issues: any[]): AssigneeSummary[] => {
    const assigneeMap = new Map<string, Array<{ title: string; state: string; web_url: string }>>();
    
    issues.forEach(issue => {
      // Find assignee labels (format: "Assignee::Name")
      const assigneeLabels = issue.labels?.filter((label: string) => 
        label.startsWith('Assignee::')
      ) || [];
      
      if (assigneeLabels.length === 0) {
        // If no assignee label, group under "Unassigned"
        const unassigned = assigneeMap.get('Unassigned') || [];
        unassigned.push({
          title: issue.title,
          state: issue.state,
          web_url: issue.web_url
        });
        assigneeMap.set('Unassigned', unassigned);
      } else {
        // Group by each assignee (in case there are multiple assignee labels)
        assigneeLabels.forEach((label: string) => {
          const assigneeName = label.replace('Assignee::', '');
          const assigneeIssues = assigneeMap.get(assigneeName) || [];
          assigneeIssues.push({
            title: issue.title,
            state: issue.state,
            web_url: issue.web_url
          });
          assigneeMap.set(assigneeName, assigneeIssues);
        });
      }
    });
    
    return Array.from(assigneeMap.entries()).map(([assignee, issues]) => ({
      assignee,
      issues
    }));
  };

  const updateSummaryWithAI = (summariesWithAI: AssigneeSummary[]) => {
    if (!selectedIteration) return;
    
    let iterationInfo = `## ${selectedIteration.title}\n\n` +
      `**Start Date:** ${new Date(selectedIteration.start_date).toLocaleDateString()}\n` +
      `**Due Date:** ${new Date(selectedIteration.due_date).toLocaleDateString()}\n\n`;
    
    // Add assignee breakdown with AI summaries
    if (summariesWithAI.length > 0) {
      iterationInfo += `### Work by Assignee:\n\n`;
      summariesWithAI.forEach(({ assignee, issues, aiSummary }) => {
        iterationInfo += `**${assignee}** (${issues.length} issues):\n`;
        if (aiSummary) {
          iterationInfo += `*${aiSummary}*\n\n`;
        }
        issues.forEach(issue => {
          iterationInfo += `- ${issue.state === 'closed' ? '✅' : '🟢'} [${issue.title}](${issue.web_url})\n`;
        });
        iterationInfo += '\n';
      });
    }
    
    setSummary(iterationInfo);
  };

  const generateAISummaries = async (assigneeSummaries: AssigneeSummary[]) => {
    setGeneratingAI(true);
    const updatedSummaries = [...assigneeSummaries];
    
    try {
      for (let i = 0; i < updatedSummaries.length; i++) {
        const summary = updatedSummaries[i];
        if (summary.issues.length > 0) {
          try {
            const aiSummary = await generateAssigneeSummary(
              summary.assignee,
              summary.issues.map(issue => issue.title),
              aiBackend
            );
            updatedSummaries[i].aiSummary = aiSummary;
            setAssigneeSummaries([...updatedSummaries]); // Update UI progressively
          } catch (error) {
            console.error(`Failed to generate AI summary for ${summary.assignee}:`, error);
            updatedSummaries[i].aiSummary = 'Failed to generate AI summary';
          }
        }
      }
      
      // Update the main summary with AI summaries
      updateSummaryWithAI(updatedSummaries);
      
    } finally {
      setGeneratingAI(false);
    }
  };

  const loadIssuesAndSummary = async (iteration: Iteration) => {
    setLoading(true);
    setMessage(null);
    setAssigneeSummaries([]);
    try {
      const issues = await gitlabService.fetchIssuesByIteration(projectId!, iteration.id);
      
      const grouped = groupIssuesByAssignee(issues);
      setAssigneeSummaries(grouped);
      
      const listMarkdown = issues
        .map((i: any) => `- ${i.state === 'closed' ? '✅' : '🟢'} [${i.title}](${i.web_url})`)
        .join('\n');
      setSelectedIteration(iteration);
      
      let iterationInfo = `## ${iteration.title}\n\n` +
        `**Start Date:** ${new Date(iteration.start_date).toLocaleDateString()}\n` +
        `**Due Date:** ${new Date(iteration.due_date).toLocaleDateString()}\n\n`;
      
      if (grouped.length > 0) {
        iterationInfo += `### Work by Assignee:\n\n`;
        grouped.forEach(({ assignee, issues }) => {
          iterationInfo += `**${assignee}** (${issues.length} issues):\n`;
          issues.forEach(issue => {
            iterationInfo += `- ${issue.state === 'closed' ? '✅' : '🟢'} [${issue.title}](${issue.web_url})\n`;
          });
          iterationInfo += '\n';
        });
      }
      
      iterationInfo += `### All Issues:\n${listMarkdown}`;
      setSummary(iterationInfo);
      
    } catch (err: any) {
      setMessage(err.message || 'Failed to load issues / summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!projectId || !selectedIteration) return;
    setLoading(true);
    setMessage(null);
    try {
      // Get all issues for this iteration
      const issues = await gitlabService.fetchIssuesByIteration(projectId, selectedIteration.id);
      
      let reportIid: number;
      let reportUrl: string;
      
      if (existingReportId.trim()) {
        reportIid = Number(existingReportId.trim());
        try {
          await gitlabService.updateIssue(projectId, reportIid, {
            description: summary
          });
          reportUrl = `${gitlabService.getHostUrl()}/projects/${projectId}/-/issues/${reportIid}`;
          setMessage(`Report #${reportIid} updated`);
        } catch (error) {
          throw new Error(`Failed to update existing report: ${error}`);
        }
      } else {
        const res = await gitlabService.createIssue(
          projectId,
          `${selectedIteration.title} – Iteration Report`,
          summary,
          ['iteration-report'],
          undefined,
          selectedIteration.id
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
      
      setMessage(prev => `${prev ? prev + ' | ' : ''}Linked ${linkedCount} issues to report #${reportIid}`);
      
    } catch (err: any) {
      setMessage(err.message || 'Failed to create/update report issue');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadIterations(iterationState);
  }, [iterationState]);

  const formatIterationOption = (iteration: Iteration) => {
    const startDate = new Date(iteration.start_date).toLocaleDateString();
    const dueDate = new Date(iteration.due_date).toLocaleDateString();
    return `${iteration.title} (${startDate} - ${dueDate})`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Iteration State</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
            value={iterationState}
            onChange={e => setIterationState(e.target.value as 'opened' | 'current' | 'closed')}
          >
            <option value="current">Current</option>
            <option value="opened">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {iterations.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Select Iteration</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
            onChange={e => {
              const iter = iterations.find(it => it.id === Number(e.target.value));
              if (iter) loadIssuesAndSummary(iter);
            }}
          >
            <option value="">Choose an iteration</option>
            {iterations.map(iter => (
              <option key={iter.id} value={iter.id}>
                {formatIterationOption(iter)}
              </option>
            ))}
          </select>
        </div>
      )}

      {assigneeSummaries.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Assignee Summaries</h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              onClick={() => generateAISummaries(assigneeSummaries)}
              disabled={generatingAI}
            >
              {generatingAI ? 'Generating AI Summaries...' : 'Generate AI Summaries'}
            </button>
          </div>
          
          <div className="space-y-4">
            {assigneeSummaries.map(({ assignee, issues, aiSummary }) => (
              <div key={assignee} className="border border-gray-300 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium text-lg mb-2">{assignee} ({issues.length} issues)</h4>
                
                {aiSummary && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">AI Summary:</p>
                    <p className="text-blue-700 dark:text-blue-300">{aiSummary}</p>
                  </div>
                )}
                
                <div className="space-y-1">
                  {issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span>{issue.state === 'closed' ? '✅' : '🟢'}</span>
                      <a 
                        href={issue.web_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {issue.title}
                      </a>
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
            rows={12}
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
        <p className={`mt-2 text-sm text-center ${message.startsWith('Report') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default IterationReport;
