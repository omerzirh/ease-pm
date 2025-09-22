import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../Sidebar';
import { MainTab } from '../../store/useTabStore';

const mockCloseSettingsSubmenu = vi.fn();
const mockSetShowSettingsSubmenu = vi.fn();
const mockToggleCollapsed = vi.fn();
const mockSetMobileOpen = vi.fn();

vi.mock('../../store/useSidebarStore', () => ({
  useSidebarStore: () => ({
    isCollapsed: false,
    isMobileOpen: false,
    showSettingsSubmenu: false,
    toggleCollapsed: mockToggleCollapsed,
    setMobileOpen: mockSetMobileOpen,
    setShowSettingsSubmenu: mockSetShowSettingsSubmenu,
    closeSettingsSubmenu: mockCloseSettingsSubmenu,
  }),
}));

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('Sidebar', () => {
  const defaultProps = {
    currentTab: 'issue' as MainTab,
    onTabChange: vi.fn(),
    isAuthenticated: false,
    onAuthToggle: vi.fn(),
    onTitleClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 1024;
  });

  it('renders desktop sidebar with navigation items', () => {
    render(<Sidebar {...defaultProps} />);

    const sidebar = document.querySelector('aside[role="navigation"]');
    expect(sidebar).toBeInTheDocument();

    expect(screen.getByLabelText('Navigate to Issues')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Epics')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Milestones')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Iterations')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Settings')).toBeInTheDocument();
  });

  it('shows mobile hamburger button on mobile screens', async () => {
    window.innerWidth = 500;

    render(<Sidebar {...defaultProps} />);

    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      const hamburgerButton = screen.getByLabelText('Open navigation menu');
      expect(hamburgerButton).toBeInTheDocument();
    });
  });

  it('applies correct responsive classes', () => {
    render(<Sidebar {...defaultProps} />);

    const sidebar = document.querySelector('aside[role="navigation"]');

    expect(sidebar).toHaveClass('fixed', 'top-0', 'z-50', 'h-full');
  });

  it('handles navigation item clicks', () => {
    const onTabChange = vi.fn();
    render(<Sidebar {...defaultProps} onTabChange={onTabChange} />);

    const epicButton = screen.getByLabelText('Navigate to Epics');
    fireEvent.click(epicButton);

    expect(onTabChange).toHaveBeenCalledWith('epic');
  });

  it('shows active state for current tab', () => {
    render(<Sidebar {...defaultProps} currentTab="epic" />);

    const epicButton = screen.getByLabelText('Navigate to Epics');
    expect(epicButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders auth button with correct label', () => {
    render(<Sidebar {...defaultProps} isAuthenticated={false} />);

    const authButton = screen.getByLabelText('Login with GitLab');
    expect(authButton).toBeInTheDocument();
  });

  it('renders logout button when authenticated', () => {
    render(<Sidebar {...defaultProps} isAuthenticated={true} />);

    const authButton = screen.getByLabelText('Logout');
    expect(authButton).toBeInTheDocument();
  });
});
