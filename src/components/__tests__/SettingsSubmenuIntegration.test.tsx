import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../Sidebar';

const mockToggleCollapsed = vi.fn();
const mockSetMobileOpen = vi.fn();
const mockSetShowSettingsSubmenu = vi.fn();
const mockSetActiveSettingsTab = vi.fn();

const mockSidebarStore = {
  isCollapsed: false,
  isMobileOpen: false,
  showSettingsSubmenu: false,
  activeSettingsTab: 'labels',
  toggleCollapsed: mockToggleCollapsed,
  setMobileOpen: mockSetMobileOpen,
  setShowSettingsSubmenu: mockSetShowSettingsSubmenu,
  setActiveSettingsTab: mockSetActiveSettingsTab,
};

vi.mock('../../store/useSidebarStore', () => ({
  useSidebarStore: () => mockSidebarStore,
}));

describe('Settings Submenu Integration', () => {
  const defaultProps = {
    currentTab: 'settings' as const,
    onTabChange: vi.fn(),
    isAuthenticated: false,
    onAuthToggle: vi.fn(),
    onTitleClick: vi.fn(),
    onSettingsTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarStore.isCollapsed = false;
    mockSidebarStore.isMobileOpen = false;
    mockSidebarStore.showSettingsSubmenu = true;
    mockSidebarStore.activeSettingsTab = 'labels';
  });

  it('renders complete settings submenu with all expected items', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('AI Provider')).toBeInTheDocument();
    expect(screen.getByText('GitLab')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('handles settings tab selection workflow correctly', () => {
    render(<Sidebar {...defaultProps} />);

    const aiProviderButton = screen.getByText('AI Provider');
    fireEvent.click(aiProviderButton);

    expect(mockSetActiveSettingsTab).toHaveBeenCalledWith('ai');

    expect(defaultProps.onSettingsTabChange).toHaveBeenCalledWith('ai');
  });

  it('shows correct visual states for active and inactive settings tabs', () => {
    mockSidebarStore.activeSettingsTab = 'ai';
    render(<Sidebar {...defaultProps} />);

    const aiButton = screen.getByText('AI Provider').closest('button');
    expect(aiButton).toHaveClass('bg-slate-600', 'text-white');

    const labelsButton = screen.getByText('Labels').closest('button');
    expect(labelsButton).toHaveClass('text-slate-400');
    expect(labelsButton).not.toHaveClass('bg-slate-600');
  });

  it('demonstrates complete settings navigation workflow', () => {
    render(<Sidebar {...defaultProps} />);

    expect(mockSidebarStore.activeSettingsTab).toBe('labels');

    const settingsTabs = ['Prefixes', 'AI Provider', 'GitLab', 'Project'];
    const expectedIds = ['prefixes', 'ai', 'gitlab', 'project'];

    settingsTabs.forEach((tabName, index) => {
      const button = screen.getByText(tabName);
      fireEvent.click(button);

      expect(mockSetActiveSettingsTab).toHaveBeenCalledWith(expectedIds[index]);
      expect(defaultProps.onSettingsTabChange).toHaveBeenCalledWith(expectedIds[index]);
    });

    expect(mockSetActiveSettingsTab).toHaveBeenCalledTimes(4);
    expect(defaultProps.onSettingsTabChange).toHaveBeenCalledTimes(4);
  });

  it('works correctly in both collapsed and expanded states', () => {
    mockSidebarStore.isCollapsed = false;
    const { rerender } = render(<Sidebar {...defaultProps} />);

    let submenuContainer = document.querySelector('.ml-4.space-y-1');
    expect(submenuContainer).toBeInTheDocument();

    mockSidebarStore.isCollapsed = true;
    rerender(<Sidebar {...defaultProps} />);

    const labelsButton = screen.getByText('Labels');
    expect(labelsButton).toBeInTheDocument();

    fireEvent.click(labelsButton);
    expect(mockSetActiveSettingsTab).toHaveBeenCalledWith('labels');
  });
});
