import { useEffect, useState } from 'react';
import gitlabService, { Iteration } from '../services/gitlabService';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateAssigneeSummary } from '../services/aiService';
import { formatIterationName } from '../utils/iterationUtils';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Button, buttonVariants } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';

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
      if (projectId) {
        console.log(gitlabService)
        data = await gitlabService.fetchProjectIterations(projectId, { 
          state: state || 'opened',
          includeAncestors: true 
        });
      } else if (groupId) {
        data = await gitlabService.fetchIterations(groupId, state || 'opened');
      } else {
        throw new Error('No project or group ID available');
      }
      
      if(data.length === 0) {
        setMessage('No iterations found');
      }
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
      const assigneeLabels = issue.labels?.filter((label: string) => 
        label.startsWith('Assignee::')
      ) || [];
      
      if (assigneeLabels.length === 0) {
        const backlog = assigneeMap.get('Backlog') || [];
        backlog.push({
          title: issue.title,
          state: issue.state,
          web_url: issue.web_url
        });
        assigneeMap.set('Backlog', backlog);
      } else {
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
    
    let iterationInfo = `## ${formatIterationName(selectedIteration)}\n\n` +
      `**Start Date:** ${new Date(selectedIteration.start_date).toLocaleDateString()}\n` +
      `**Due Date:** ${new Date(selectedIteration.due_date).toLocaleDateString()}\n\n`;
    
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
              aiBackend,
              iterationState
            );
            updatedSummaries[i].aiSummary = aiSummary;
            setAssigneeSummaries([...updatedSummaries]); 
          } catch (error) {
            console.error(`Failed to generate AI summary for ${summary.assignee}:`, error);
            updatedSummaries[i].aiSummary = 'Failed to generate AI summary';
          }
        }
      }
      
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
      
      let iterationInfo = `## ${formatIterationName(iteration)}\n\n` +
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
          `${formatIterationName(selectedIteration)} – Iteration Report`,
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
    return formatIterationName(iteration);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Iteration State</Label>
          <Select
            value={iterationState}
            onChange={e => setIterationState(e.target.value as 'opened' | 'current' | 'closed')}
          >
            <option value="current">Current</option>
            <option value="opened">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
      </div>

      {iterations.length > 0 && (
        <div>
          <Label required>Select Iteration</Label>
          <Select
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
          </Select>
        </div>
      )}

      {assigneeSummaries.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Assignee Summaries</h3>
            <Button
              variant="primary"
              size="md"
              loading={generatingAI}
              onClick={() => generateAISummaries(assigneeSummaries)}
            >
              Generate AI Summaries
            </Button>
          </div>
          
          <div className="space-y-4">
            {assigneeSummaries.map(({ assignee, issues, aiSummary }) => (
              <div key={assignee} className="border border-border rounded-md p-4 bg-card">
                <h4 className="font-medium text-lg mb-2 text-card-foreground">{assignee} ({issues.length} issues)</h4>
                
                {aiSummary && (
                  <div className="mb-3 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium text-muted-foreground mb-1">AI Summary:</p>
                    <p className="text-foreground">{aiSummary}</p>
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
                        className="text-primary hover:underline"
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
          <Label>Existing Report IID (optional)</Label>
          <Input
            className="mb-4"
            value={existingReportId}
            onChange={e => setExistingReportId(e.target.value)}
            placeholder="e.g. 123"
          />
          <Label>Generated Summary</Label>
          <Textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={12}
          />
          {createdReport ? (
            <a
              href={createdReport.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("mt-2", buttonVariants({ variant: "success" }))}
            >
              Report #{createdReport.iid} created
            </a>
          ) : (
            <Button
              className="mt-2"
              variant="primary"
              size="md"
              loading={loading}
              onClick={handleCreateOrUpdate}
            >
              Create / Update Report
            </Button>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-sm text-center ${message.startsWith('Report') ? 'text-green-600' : 'text-destructive'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default IterationReport;
