import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../Sidebar';
import SettingsPage from '../SettingsPage';
import { MainTab } from '../../store/useTabStore';

vi.mock('../../store/useSidebarStore', () => ({
  useSidebarStore: () => ({
    isCollapsed: false,
    isMobileOpen: false,
    showSettingsSubmenu: true,
    toggleCollapsed: vi.fn(),
    setMobileOpen: vi.fn(),
    setShowSettingsSubmenu: vi.fn(),
  }),
}));

vi.mock('../../store/useLabelStore', () => ({
  useLabelStore: () => ({
    labels: [],
    setLabels: vi.fn(),
    keywords: '',
    setKeywords: vi.fn(),
  }),
}));

const mockSettingsStore = {
  projectId: 'test-project',
  aiBackend: 'openai',
  openaiApiKey: null,
  geminiApiKey: null,
  gitlabHost: null,
  gitlabAppId: null,
  gitlabCallbackUrl: null,
  setBackend: vi.fn(),
  setOpenaiApiKey: vi.fn(),
  setGeminiApiKey: vi.fn(),
  setGitlabHost: vi.fn(),
  setGitlabAppId: vi.fn(),
  setGitlabCallbackUrl: vi.fn(),
};

vi.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: Object.assign(
    () => mockSettingsStore,
    {
      getState: () => mockSettingsStore,
    }
  ),
}));

vi.mock('../../store/usePrefixStore', () => ({
  usePrefixStore: () => ({
    prefixes: [],
    setPrefixes: vi.fn(),
  }),
}));

vi.mock('../../services/gitlabService', () => ({
  default: {
    fetchLabels: vi.fn(),
  },
}));

describe('Settings Integration', () => {
  const sidebarProps = {
    currentTab: 'settings' as MainTab,
    onTabChange: vi.fn(),
    isAuthenticated: false,
    onAuthToggle: vi.fn(),
    onTitleClick: vi.fn(),
    activeSettingsTab: 'labels',
    onSettingsTabChange: vi.fn(),
  };

  it('shows settings submenu when settings tab is active', () => {
    render(<Sidebar {...sidebarProps} />);
    
    expect(screen.getByLabelText('Navigate to Labels settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to AI Provider settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to GitLab settings')).toBeInTheDocument();
  });

  it('renders correct settings page based on active tab', () => {
    render(<SettingsPage activeTab="labels" />);
    expect(screen.getByText('Label Settings')).toBeInTheDocument();
    
    render(<SettingsPage activeTab="ai" />);
    expect(screen.getByText('AI Provider')).toBeInTheDocument();
    
    render(<SettingsPage activeTab="gitlab" />);
    expect(screen.getByText('GitLab Settings')).toBeInTheDocument();
  });

  it('handles settings submenu navigation', () => {
    const onSettingsTabChange = vi.fn();
    render(<Sidebar {...sidebarProps} onSettingsTabChange={onSettingsTabChange} />);
    
    const aiButton = screen.getByLabelText('Navigate to AI Provider settings');
    fireEvent.click(aiButton);
    
    expect(onSettingsTabChange).toHaveBeenCalledWith('ai');
  });

  it('shows active state in settings submenu', () => {
    render(<Sidebar {...sidebarProps} activeSettingsTab="gitlab" />);
    
    const gitlabButton = screen.getByLabelText('Navigate to GitLab settings');
    expect(gitlabButton).toHaveAttribute('aria-current', 'page');
  });

  it('defaults to labels tab when unknown tab is provided', () => {
    render(<SettingsPage activeTab="unknown" />);
    expect(screen.getByText('Label Settings')).toBeInTheDocument();
  });
});