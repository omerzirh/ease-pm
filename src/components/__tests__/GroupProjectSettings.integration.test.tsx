import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GroupProjectSettings from '../settings/GroupProjectSettings';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useEpicStore } from '../../store/useEpicStore';
import { useGeneratedEpicStore } from '../../store/useGeneratedEpicStore';
import { useGeneratedIssueStore } from '../../store/useGeneratedIssueStore';
import { useLabelStore } from '../../store/useLabelStore';

vi.mock('../../store/useGitlabAuth', () => ({
  useGitlabAuth: () => ({ token: 'mock-token' }),
}));

vi.mock('../../services/gitlabService', () => ({
  default: {
    fetchProjects: vi.fn(() => Promise.resolve([{ id: 1, path_with_namespace: 'group/project' }])),
  },
}));

describe('GroupProjectSettings state sync', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      groupId: 'old-group',
      projectId: 'old-project',
      projectName: 'old/project',
    });
    useEpicStore.setState({ selectedEpic: { id: 1, title: 'Old Epic', web_url: '' } });
    useGeneratedEpicStore.getState().setGeneratedContent({
      prompt: 'old', title: 'old', description: 'old', titlePrefix: '', selectedLabels: [], parentEpic: null, enableEpic: false
    });
    useGeneratedIssueStore.getState().setGeneratedContent({
      prompt: 'old', draftTitle: 'old', draftDescription: 'old', selectedLabels: [], selectedEpic: null, enableEpic: false, epicQuery: ''
    });
    useLabelStore.getState().setLabels([{ id: 1, name: 'old', description: '' }]);
  });

  it('clears related state when switching group', async () => {
    render(<GroupProjectSettings />);
    const input = screen.getByPlaceholderText(/group/i);
    fireEvent.change(input, { target: { value: 'new-group' } });
    const saveBtn = screen.getByText(/save group/i);
    fireEvent.click(saveBtn);
    await waitFor(() => expect(useSettingsStore.getState().groupId).toBe('new-group'));
    expect(useEpicStore.getState().selectedEpic).toBeNull();
    expect(useGeneratedEpicStore.getState().generatedContent).toBeNull();
    expect(useGeneratedIssueStore.getState().generatedContent).toBeNull();
    expect(useLabelStore.getState().labels).toEqual([]);
  });

  it('clears related state when switching project', async () => {
    render(<GroupProjectSettings />);
    // Simulate group fetch
    const input = screen.getByPlaceholderText(/group/i);
    fireEvent.change(input, { target: { value: 'group' } });
    fireEvent.click(screen.getByText(/save group/i));
    await waitFor(() => screen.getByText(/choose a project/i));
    // Select project
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/save project/i));
    expect(useSettingsStore.getState().projectId).toBe('1');
    expect(useEpicStore.getState().selectedEpic).toBeNull();
    expect(useGeneratedEpicStore.getState().generatedContent).toBeNull();
    expect(useGeneratedIssueStore.getState().generatedContent).toBeNull();
    expect(useLabelStore.getState().labels).toEqual([]);
  });
});
