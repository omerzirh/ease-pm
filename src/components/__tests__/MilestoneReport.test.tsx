import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MilestoneReport from '../MilestoneReport';
import gitlabService from '../../services/gitlabService';
import { useSettingsStore } from '../../store/useSettingsStore';

vi.mock('../../services/gitlabService');
vi.mock('../../store/useSettingsStore');

const mockGitlabService = vi.mocked(gitlabService);
const mockUseSettingsStore = vi.mocked(useSettingsStore);

describe('MilestoneReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSettingsStore.getState.mockReturnValue({
      projectId: '123',
      groupId: '456',
      gitlabHost: 'https://gitlab.example.com',
      aiProvider: 'openai',
      openaiApiKey: '',
      anthropicApiKey: '',
      geminiApiKey: '',
      labels: [],
      prefixes: [],
    });
  });

  describe('loadIssuesAndSummary', () => {
    it('should generate markdown links for issues with web_url', async () => {
      const mockMilestones = [{ id: 1, title: 'Test Milestone', description: 'Test description' }];

      const mockIssues = [
        {
          id: 1,
          iid: 1,
          title: 'Issue with URL',
          web_url: 'https://gitlab.example.com/project/issues/1',
          state: 'opened',
        },
        {
          id: 2,
          iid: 2,
          title: 'Closed issue with URL',
          web_url: 'https://gitlab.example.com/project/issues/2',
          state: 'closed',
        },
      ];

      mockGitlabService.fetchMilestones.mockResolvedValue(mockMilestones);
      mockGitlabService.fetchIssuesByMilestone.mockResolvedValue(mockIssues);

      render(<MilestoneReport />);

      await waitFor(() => {
        expect(screen.getByText('Test Milestone')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 10);
        expect(summaryTextarea).toBeDefined();
        const summaryValue = summaryTextarea!.value;

        expect(summaryValue).toContain('- 🟢 [Issue with URL](https://gitlab.example.com/project/issues/1)');
        expect(summaryValue).toContain('- ✅ [Closed issue with URL](https://gitlab.example.com/project/issues/2)');
      });
    });

    it('should fallback to plain text for issues without web_url', async () => {
      const mockMilestones = [{ id: 1, title: 'Test Milestone', description: 'Test description' }];

      const mockIssues = [
        {
          id: 1,
          iid: 1,
          title: 'Issue without URL',
          web_url: null,
          state: 'opened',
        },
        {
          id: 2,
          iid: 2,
          title: 'Issue with empty URL',
          web_url: '',
          state: 'opened',
        },
      ];

      mockGitlabService.fetchMilestones.mockResolvedValue(mockMilestones);
      mockGitlabService.fetchIssuesByMilestone.mockResolvedValue(mockIssues);

      render(<MilestoneReport />);

      await waitFor(() => {
        expect(screen.getByText('Test Milestone')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 10);
        expect(summaryTextarea).toBeDefined();
        const summaryValue = summaryTextarea!.value;

        expect(summaryValue).toContain('- 🟢 Issue without URL');
        expect(summaryValue).toContain('- 🟢 Issue with empty URL');
        expect(summaryValue).not.toContain('[Issue without URL]');
        expect(summaryValue).not.toContain('[Issue with empty URL]');
      });
    });

    it('should handle mixed scenarios with some issues having URLs and others not', async () => {
      const mockMilestones = [{ id: 1, title: 'Test Milestone', description: 'Test description' }];

      const mockIssues = [
        {
          id: 1,
          iid: 1,
          title: 'Issue with URL',
          web_url: 'https://gitlab.example.com/project/issues/1',
          state: 'opened',
        },
        {
          id: 2,
          iid: 2,
          title: 'Issue without URL',
          web_url: null,
          state: 'closed',
        },
      ];

      mockGitlabService.fetchMilestones.mockResolvedValue(mockMilestones);
      mockGitlabService.fetchIssuesByMilestone.mockResolvedValue(mockIssues);

      render(<MilestoneReport />);

      await waitFor(() => {
        expect(screen.getByText('Test Milestone')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const summaryTextarea = textareas.find((textarea) => textarea.rows === 10);
        expect(summaryTextarea).toBeDefined();
        const summaryValue = summaryTextarea!.value;

        expect(summaryValue).toContain('- 🟢 [Issue with URL](https://gitlab.example.com/project/issues/1)');
        expect(summaryValue).toContain('- ✅ Issue without URL');
      });
    });
  });
});
