import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IterationReport from '../IterationReport';
import MilestoneReport from '../MilestoneReport';
import gitlabService from '../../services/gitlabService';
import { generateAssigneeSummary } from '../../services/aiService';
import { formatIterationName } from '../../utils/iterationUtils';

vi.mock('../../services/gitlabService');
vi.mock('../../services/aiService');
vi.mock('../../utils/iterationUtils');
vi.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: {
    getState: () => ({
      projectId: '123',
      groupId: '456',
      aiBackend: 'openai',
      gitlabHost: 'https://gitlab.example.com',
      aiProvider: 'openai',
      openaiApiKey: '',
      anthropicApiKey: '',
      geminiApiKey: '',
      labels: [],
      prefixes: [],
    }),
  },
}));

const mockGitlabService = vi.mocked(gitlabService);
const mockGenerateAssigneeSummary = vi.mocked(generateAssigneeSummary);
const mockFormatIterationName = vi.mocked(formatIterationName);

describe('Report Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IterationReport with mixed data conditions', () => {
    it('should handle iterations with mixed title conditions and assignee scenarios', async () => {
      const mockIterations = [
        {
          id: 1,
          iid: 1,
          title: '',
          description: 'Sprint with empty title',
          state: 1,
          start_date: '2024-01-01',
          due_date: '2024-01-14',
          web_url: 'https://gitlab.com/test/project/-/iterations/1',
        },
        {
          id: 2,
          iid: 2,
          title: 'Sprint 2',
          description: 'Sprint with valid title',
          state: 1,
          start_date: '2024-01-15',
          due_date: '2024-01-28',
          web_url: 'https://gitlab.com/test/project/-/iterations/2',
        },
      ];

      const mockIssues = [
        {
          id: 1,
          title: 'Unassigned bug fix',
          state: 'opened',
          web_url: 'https://gitlab.com/test/project/-/issues/1',
          labels: [],
        },
        {
          id: 2,
          title: 'Feature assigned to John',
          state: 'closed',
          web_url: 'https://gitlab.com/test/project/-/issues/2',
          labels: ['Assignee::John Doe', 'feature'],
        },
        {
          id: 3,
          title: 'Bug with multiple assignees',
          state: 'opened',
          web_url: 'https://gitlab.com/test/project/-/issues/3',
          labels: ['Assignee::John Doe', 'Assignee::Jane Smith', 'bug'],
        },
        {
          id: 4,
          title: 'Another backlog item',
          state: 'opened',
          web_url: 'https://gitlab.com/test/project/-/issues/4',
          labels: ['enhancement'],
        },
      ];

      mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
      mockGitlabService.fetchIssuesByIteration.mockResolvedValue(mockIssues);
      mockFormatIterationName.mockImplementation((iteration) => {
        if (iteration.id === 1) return '1/1/2024 - 1/14/2024';
        if (iteration.id === 2) return 'Sprint 2';
        return 'Unknown';
      });

      render(<IterationReport />);

      await waitFor(() => {
        expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
      });

      expect(screen.getByText('1/1/2024 - 1/14/2024')).toBeInTheDocument();
      expect(screen.getByText('Sprint 2')).toBeInTheDocument();

      const iterationSelects = screen.getAllByRole('combobox');
      const iterationSelect = iterationSelects[1];
      fireEvent.change(iterationSelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByText('Assignee Summaries')).toBeInTheDocument();
      });

      expect(screen.getByText('Backlog (2 issues)')).toBeInTheDocument();
      expect(screen.getByText('John Doe (2 issues)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith (1 issues)')).toBeInTheDocument();

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 12);
        expect(summaryTextarea).toBeDefined();
        expect(summaryTextarea!.value).toContain('## 1/1/2024 - 1/14/2024');
      });

      expect(mockFormatIterationName).toHaveBeenCalledWith(mockIterations[0]);
    });

    it('should generate AI summaries for all assignee groups including Backlog', async () => {
      const mockIterations = [
        {
          id: 1,
          iid: 1,
          title: 'Test Sprint',
          description: 'Test sprint',
          state: 1,
          start_date: '2024-01-01',
          due_date: '2024-01-14',
          web_url: 'https://gitlab.com/test/project/-/iterations/1',
        },
      ];

      const mockIssues = [
        {
          id: 1,
          title: 'Backlog item 1',
          state: 'opened',
          web_url: 'https://gitlab.com/test/project/-/issues/1',
          labels: [],
        },
        {
          id: 2,
          title: 'Backlog item 2',
          state: 'opened',
          web_url: 'https://gitlab.com/test/project/-/issues/2',
          labels: [],
        },
        {
          id: 3,
          title: "John's task",
          state: 'closed',
          web_url: 'https://gitlab.com/test/project/-/issues/3',
          labels: ['Assignee::John Doe'],
        },
      ];

      mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
      mockGitlabService.fetchIssuesByIteration.mockResolvedValue(mockIssues);
      mockFormatIterationName.mockReturnValue('Test Sprint');
      mockGenerateAssigneeSummary.mockImplementation((assignee) => {
        if (assignee === 'Backlog') return 'AI summary for backlog items';
        if (assignee === 'John Doe') return "AI summary for John's work";
        return 'Generic AI summary';
      });

      render(<IterationReport />);

      await waitFor(() => {
        expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
      });

      const iterationSelects = screen.getAllByRole('combobox');
      const iterationSelect = iterationSelects[1];
      fireEvent.change(iterationSelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByText('Backlog (2 issues)')).toBeInTheDocument();
        expect(screen.getByText('John Doe (1 issues)')).toBeInTheDocument();
      });

      const generateButton = screen.getByText('Generate AI Summaries');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('AI summary for backlog items')).toBeInTheDocument();
        expect(screen.getByText("AI summary for John's work")).toBeInTheDocument();
      });

      expect(mockGenerateAssigneeSummary).toHaveBeenCalledWith(
        'Backlog',
        ['Backlog item 1', 'Backlog item 2'],
        'openai'
      );
      expect(mockGenerateAssigneeSummary).toHaveBeenCalledWith('John Doe', ["John's task"], 'openai');
    });
  });

  describe('MilestoneReport with mixed link scenarios', () => {
    it('should handle issues with mixed web_url availability', async () => {
      const mockMilestones = [{ id: 1, title: 'Mixed URL Milestone', description: 'Test milestone' }];

      const mockIssues = [
        {
          id: 1,
          iid: 1,
          title: 'Issue with valid URL',
          web_url: 'https://gitlab.example.com/project/issues/1',
          state: 'opened',
        },
        {
          id: 2,
          iid: 2,
          title: 'Issue with null URL',
          web_url: null,
          state: 'closed',
        },
        {
          id: 3,
          iid: 3,
          title: 'Issue with empty URL',
          web_url: '',
          state: 'opened',
        },
        {
          id: 4,
          iid: 4,
          title: 'Issue with undefined URL',
          web_url: undefined,
          state: 'closed',
        },
      ];

      mockGitlabService.fetchMilestones.mockResolvedValue(mockMilestones);
      mockGitlabService.fetchIssuesByMilestone.mockResolvedValue(mockIssues);

      render(<MilestoneReport />);

      await waitFor(() => {
        expect(screen.getByText('Mixed URL Milestone')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 10);
        expect(summaryTextarea).toBeDefined();
        const summaryValue = summaryTextarea!.value;

        expect(summaryValue).toContain('- 🟢 [Issue with valid URL](https://gitlab.example.com/project/issues/1)');

        expect(summaryValue).toContain('- ✅ Issue with null URL');
        expect(summaryValue).toContain('- 🟢 Issue with empty URL');
        expect(summaryValue).toContain('- ✅ Issue with undefined URL');

        expect(summaryValue).not.toContain('[Issue with null URL](null)');
        expect(summaryValue).not.toContain('[Issue with empty URL]()');
        expect(summaryValue).not.toContain('[Issue with undefined URL](undefined)');
      });
    });

    it('should preserve link formatting in textarea for user editing', async () => {
      const mockMilestones = [{ id: 1, title: 'Link Test Milestone', description: 'Test milestone' }];

      const mockIssues = [
        {
          id: 1,
          iid: 1,
          title: 'Clickable issue',
          web_url: 'https://gitlab.example.com/project/issues/1',
          state: 'opened',
        },
        {
          id: 2,
          iid: 2,
          title: 'Non-clickable issue',
          web_url: null,
          state: 'closed',
        },
      ];

      mockGitlabService.fetchMilestones.mockResolvedValue(mockMilestones);
      mockGitlabService.fetchIssuesByMilestone.mockResolvedValue(mockIssues);

      render(<MilestoneReport />);

      await waitFor(() => {
        expect(screen.getByText('Link Test Milestone')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 10);
        expect(summaryTextarea).toBeDefined();

        const summaryValue = summaryTextarea!.value;

        expect(summaryValue).toContain('[Clickable issue](https://gitlab.example.com/project/issues/1)');
        expect(summaryValue).toContain('Non-clickable issue');

        fireEvent.change(summaryTextarea!, {
          target: { value: summaryValue + '\n\n## Additional Notes\nUser added content' },
        });

        expect(summaryTextarea!.value).toContain('## Additional Notes');
        expect(summaryTextarea!.value).toContain('User added content');
      });
    });
  });

  describe('Cross-component consistency', () => {
    it('should maintain consistent link formatting between IterationReport and MilestoneReport', async () => {
      const testIssue = {
        id: 1,
        iid: 1,
        title: 'Test Issue',
        web_url: 'https://gitlab.example.com/project/issues/1',
        state: 'opened',
        labels: [],
      };

      const mockIterations = [
        {
          id: 1,
          iid: 1,
          title: 'Test Sprint',
          description: 'Test',
          state: 1,
          start_date: '2024-01-01',
          due_date: '2024-01-14',
          web_url: 'https://gitlab.com/test/project/-/iterations/1',
        },
      ];

      mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
      mockGitlabService.fetchIssuesByIteration.mockResolvedValue([testIssue]);
      mockFormatIterationName.mockReturnValue('Test Sprint');

      const { unmount } = render(<IterationReport />);

      await waitFor(() => {
        expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
      });

      const iterationSelects = screen.getAllByRole('combobox');
      const iterationSelect = iterationSelects[1];
      fireEvent.change(iterationSelect, { target: { value: '1' } });

      let iterationSummary = '';
      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 12);
        expect(summaryTextarea).toBeDefined();
        iterationSummary = summaryTextarea!.value;
        expect(iterationSummary).toContain('[Test Issue](https://gitlab.example.com/project/issues/1)');
      });

      unmount();

      const mockMilestones = [{ id: 1, title: 'Test Milestone', description: 'Test' }];
      mockGitlabService.fetchMilestones.mockResolvedValue(mockMilestones);
      mockGitlabService.fetchIssuesByMilestone.mockResolvedValue([testIssue]);

      render(<MilestoneReport />);

      await waitFor(() => {
        expect(screen.getByText('Test Milestone')).toBeInTheDocument();
      });

      const milestoneSelect = screen.getByRole('combobox');
      fireEvent.change(milestoneSelect, { target: { value: '1' } });

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 10);
        expect(summaryTextarea).toBeDefined();
        const milestoneSummary = summaryTextarea!.value;

        expect(milestoneSummary).toContain('[Test Issue](https://gitlab.example.com/project/issues/1)');

        expect(iterationSummary).toContain('🟢');
        expect(milestoneSummary).toContain('🟢');
      });
    });
  });
});
