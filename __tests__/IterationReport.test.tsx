import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IterationReport from '../IterationReport';
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
      aiBackend: 'openai' as const,
    }),
  },
}));

const mockGitlabService = vi.mocked(gitlabService);
const mockGenerateAssigneeSummary = vi.mocked(generateAssigneeSummary);
const mockFormatIterationName = vi.mocked(formatIterationName);

describe('IterationReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should group issues without assignee labels under "Backlog"', async () => {
    const mockIterations = [
      {
        id: 1,
        iid: 1,
        title: 'Sprint 1',
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
        title: 'Issue without assignee',
        state: 'opened',
        web_url: 'https://gitlab.com/test/project/-/issues/1',
        labels: [],
      },
      {
        id: 2,
        title: 'Issue with assignee',
        state: 'closed',
        web_url: 'https://gitlab.com/test/project/-/issues/2',
        labels: ['Assignee::John Doe'],
      },
      {
        id: 3,
        title: 'Another unassigned issue',
        state: 'opened',
        web_url: 'https://gitlab.com/test/project/-/issues/3',
        labels: ['bug'],
      },
    ];

    mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
    mockGitlabService.fetchIssuesByIteration.mockResolvedValue(mockIssues);

    render(<IterationReport />);

    await waitFor(() => {
      expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
    });

    const iterationSelects = screen.getAllByRole('combobox');
    const iterationSelect = iterationSelects[1]; // Second select is for iteration selection
    fireEvent.change(iterationSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Assignee Summaries')).toBeInTheDocument();
    });

    expect(screen.getByText('Backlog (2 issues)')).toBeInTheDocument();
    expect(screen.getByText('John Doe (1 issues)')).toBeInTheDocument();

    const backlogSection = screen.getByText('Backlog (2 issues)').closest('div');
    expect(backlogSection).toHaveTextContent('Issue without assignee');
    expect(backlogSection).toHaveTextContent('Another unassigned issue');

    const assigneeSection = screen.getByText('John Doe (1 issues)').closest('div');
    expect(assigneeSection).toHaveTextContent('Issue with assignee');
  });

  it('should generate AI summaries correctly for Backlog category', async () => {
    const mockIterations = [
      {
        id: 1,
        iid: 1,
        title: 'Sprint 1',
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
        title: 'Unassigned bug fix',
        state: 'opened',
        web_url: 'https://gitlab.com/test/project/-/issues/1',
        labels: [],
      },
      {
        id: 2,
        title: 'Unassigned feature request',
        state: 'opened',
        web_url: 'https://gitlab.com/test/project/-/issues/2',
        labels: [],
      },
    ];

    mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
    mockGitlabService.fetchIssuesByIteration.mockResolvedValue(mockIssues);
    mockGenerateAssigneeSummary.mockResolvedValue('AI summary for backlog items');

    render(<IterationReport />);

    await waitFor(() => {
      expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
    });

    const iterationSelects = screen.getAllByRole('combobox');
    const iterationSelect = iterationSelects[1];
    fireEvent.change(iterationSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Backlog (2 issues)')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('Generate AI Summaries');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('AI summary for backlog items')).toBeInTheDocument();
    });

    expect(mockGenerateAssigneeSummary).toHaveBeenCalledWith(
      'Backlog',
      ['Unassigned bug fix', 'Unassigned feature request'],
      'openai'
    );
  });

  it('should use formatIterationName for dropdown options', async () => {
    const mockIterations = [
      {
        id: 1,
        iid: 1,
        title: '', // Empty title to trigger date formatting
        description: 'Test sprint',
        state: 1,
        start_date: '2024-01-01',
        due_date: '2024-01-14',
        web_url: 'https://gitlab.com/test/project/-/iterations/1',
      },
      {
        id: 2,
        iid: 2,
        title: 'Sprint 2',
        description: 'Test sprint 2',
        state: 1,
        start_date: '2024-01-15',
        due_date: '2024-01-28',
        web_url: 'https://gitlab.com/test/project/-/iterations/2',
      },
    ];

    mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
    mockFormatIterationName.mockImplementation((iteration) => {
      if (iteration.id === 1) return '1/1/2024 - 1/14/2024';
      if (iteration.id === 2) return 'Sprint 2';
      return 'Unknown';
    });

    render(<IterationReport />);

    await waitFor(() => {
      expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
    });

    expect(mockFormatIterationName).toHaveBeenCalledWith(mockIterations[0]);
    expect(mockFormatIterationName).toHaveBeenCalledWith(mockIterations[1]);

    expect(screen.getByText('1/1/2024 - 1/14/2024')).toBeInTheDocument();
    expect(screen.getByText('Sprint 2')).toBeInTheDocument();
  });

  it('should use formatIterationName in report headers', async () => {
    const mockIterations = [
      {
        id: 1,
        iid: 1,
        title: null, // Null title to trigger date formatting
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
        title: 'Test issue',
        state: 'opened',
        web_url: 'https://gitlab.com/test/project/-/issues/1',
        labels: [],
      },
    ];

    mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
    mockGitlabService.fetchIssuesByIteration.mockResolvedValue(mockIssues);
    mockFormatIterationName.mockReturnValue('1/1/2024 - 1/14/2024');

    render(<IterationReport />);

    await waitFor(() => {
      expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
    });

    const iterationSelects = screen.getAllByRole('combobox');
    const iterationSelect = iterationSelects[1];
    fireEvent.change(iterationSelect, { target: { value: '1' } });

    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox');
      const summaryTextarea = textareas.find((textarea) => textarea.rows === 12);
      expect(summaryTextarea).toBeDefined();

      expect(summaryTextarea!.value).toContain('## 1/1/2024 - 1/14/2024');
    });

    expect(mockFormatIterationName).toHaveBeenCalledWith(mockIterations[0]);
  });

  it('should maintain consistency between dropdown display and report headers', async () => {
    const mockIterations = [
      {
        id: 1,
        iid: 1,
        title: '   ', // Whitespace-only title
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
        title: 'Test issue',
        state: 'opened',
        web_url: 'https://gitlab.com/test/project/-/issues/1',
        labels: [],
      },
    ];

    const formattedName = '1/1/2024 - 1/14/2024';

    mockGitlabService.fetchProjectIterations.mockResolvedValue(mockIterations);
    mockGitlabService.fetchIssuesByIteration.mockResolvedValue(mockIssues);
    mockFormatIterationName.mockReturnValue(formattedName);

    render(<IterationReport />);

    await waitFor(() => {
      expect(screen.getByText('Choose an iteration')).toBeInTheDocument();
    });

    expect(screen.getByText(formattedName)).toBeInTheDocument();

    const iterationSelects = screen.getAllByRole('combobox');
    const iterationSelect = iterationSelects[1];
    fireEvent.change(iterationSelect, { target: { value: '1' } });

    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox');
      const summaryTextarea = textareas.find((textarea) => textarea.rows === 12);
      expect(summaryTextarea).toBeDefined();

      expect(summaryTextarea!.value).toContain(`## ${formattedName}`);
    });

    expect(mockFormatIterationName).toHaveBeenCalledWith(mockIterations[0]);
    expect(mockFormatIterationName).toHaveBeenCalledTimes(4);
  });
});
