import { describe, it, expect } from 'vitest';

const groupIssuesByAssignee = (issues: any[]) => {
  const assigneeMap = new Map<string, Array<{ title: string; state: string; web_url: string }>>();

  issues.forEach((issue) => {
    const assigneeLabels = issue.labels?.filter((label: string) => label.startsWith('Assignee::')) || [];

    if (assigneeLabels.length === 0) {
      const backlog = assigneeMap.get('Backlog') || [];
      backlog.push({
        title: issue.title,
        state: issue.state,
        web_url: issue.web_url,
      });
      assigneeMap.set('Backlog', backlog);
    } else {
      assigneeLabels.forEach((label: string) => {
        const assigneeName = label.replace('Assignee::', '');
        const assigneeIssues = assigneeMap.get(assigneeName) || [];
        assigneeIssues.push({
          title: issue.title,
          state: issue.state,
          web_url: issue.web_url,
        });
        assigneeMap.set(assigneeName, assigneeIssues);
      });
    }
  });

  return Array.from(assigneeMap.entries()).map(([assignee, issues]) => ({
    assignee,
    issues,
  }));
};

describe('groupIssuesByAssignee', () => {
  it('should group issues without assignee labels under "Backlog"', () => {
    const issues = [
      {
        title: 'Issue 1',
        state: 'opened',
        web_url: 'https://example.com/1',
        labels: [],
      },
      {
        title: 'Issue 2',
        state: 'closed',
        web_url: 'https://example.com/2',
        labels: ['bug'], // Has labels but no assignee labels
      },
    ];

    const result = groupIssuesByAssignee(issues);

    expect(result).toHaveLength(1);
    expect(result[0].assignee).toBe('Backlog');
    expect(result[0].issues).toHaveLength(2);
    expect(result[0].issues[0].title).toBe('Issue 1');
    expect(result[0].issues[1].title).toBe('Issue 2');
  });

  it('should group issues with assignee labels correctly', () => {
    const issues = [
      {
        title: 'Issue 1',
        state: 'opened',
        web_url: 'https://example.com/1',
        labels: ['Assignee::John Doe'],
      },
      {
        title: 'Issue 2',
        state: 'closed',
        web_url: 'https://example.com/2',
        labels: ['Assignee::Jane Smith'],
      },
      {
        title: 'Issue 3',
        state: 'opened',
        web_url: 'https://example.com/3',
        labels: ['Assignee::John Doe', 'bug'],
      },
    ];

    const result = groupIssuesByAssignee(issues);

    expect(result).toHaveLength(2);

    const johnDoeGroup = result.find((group) => group.assignee === 'John Doe');
    expect(johnDoeGroup).toBeDefined();
    expect(johnDoeGroup!.issues).toHaveLength(2);

    const janeSmithGroup = result.find((group) => group.assignee === 'Jane Smith');
    expect(janeSmithGroup).toBeDefined();
    expect(janeSmithGroup!.issues).toHaveLength(1);
  });

  it('should handle mixed assigned and unassigned issues', () => {
    const issues = [
      {
        title: 'Unassigned Issue',
        state: 'opened',
        web_url: 'https://example.com/1',
        labels: [],
      },
      {
        title: 'Assigned Issue',
        state: 'closed',
        web_url: 'https://example.com/2',
        labels: ['Assignee::John Doe'],
      },
    ];

    const result = groupIssuesByAssignee(issues);

    expect(result).toHaveLength(2);

    const backlogGroup = result.find((group) => group.assignee === 'Backlog');
    expect(backlogGroup).toBeDefined();
    expect(backlogGroup!.issues).toHaveLength(1);
    expect(backlogGroup!.issues[0].title).toBe('Unassigned Issue');

    const johnDoeGroup = result.find((group) => group.assignee === 'John Doe');
    expect(johnDoeGroup).toBeDefined();
    expect(johnDoeGroup!.issues).toHaveLength(1);
    expect(johnDoeGroup!.issues[0].title).toBe('Assigned Issue');
  });

  it('should handle issues with multiple assignee labels', () => {
    const issues = [
      {
        title: 'Multi-assigned Issue',
        state: 'opened',
        web_url: 'https://example.com/1',
        labels: ['Assignee::John Doe', 'Assignee::Jane Smith'],
      },
    ];

    const result = groupIssuesByAssignee(issues);

    expect(result).toHaveLength(2);

    const johnDoeGroup = result.find((group) => group.assignee === 'John Doe');
    expect(johnDoeGroup).toBeDefined();
    expect(johnDoeGroup!.issues).toHaveLength(1);
    expect(johnDoeGroup!.issues[0].title).toBe('Multi-assigned Issue');

    const janeSmithGroup = result.find((group) => group.assignee === 'Jane Smith');
    expect(janeSmithGroup).toBeDefined();
    expect(janeSmithGroup!.issues).toHaveLength(1);
    expect(janeSmithGroup!.issues[0].title).toBe('Multi-assigned Issue');
  });
});
