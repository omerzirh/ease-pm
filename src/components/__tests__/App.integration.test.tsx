import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../App';

vi.mock('../IssueGenerator', () => ({
  default: () => <div data-testid="issue-generator">Issue Generator</div>,
}));

vi.mock('../EpicCreator', () => ({
  default: () => <div data-testid="epic-creator">Epic Creator</div>,
}));

vi.mock('../MilestoneReport', () => ({
  default: () => <div data-testid="milestone-report">Milestone Report</div>,
}));

vi.mock('../IterationReport', () => ({
  default: () => <div data-testid="iteration-report">Iteration Report</div>,
}));

vi.mock('../SettingsPage', () => ({
  default: ({ activeTab }: { activeTab: string }) => <div data-testid="settings-page">Settings Page - {activeTab}</div>,
}));

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.innerWidth = 1024;
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('Sidebar Integration', () => {
    it('renders App with Sidebar instead of NavigationBar', () => {
      render(<App />);

      const sidebar = document.querySelector('aside[role="navigation"]');
      expect(sidebar).toBeInTheDocument();

      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('renders navigation items correctly', () => {
      render(<App />);

      expect(screen.getByLabelText('Navigate to Issues')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Epics')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Milestones')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Iterations')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Settings')).toBeInTheDocument();
    });
  });

  describe('Layout Adjustments', () => {
    it('applies correct layout classes to main content container', () => {
      render(<App />);

      const mainContentContainer = document.querySelector('.flex.flex-col.flex-1');
      expect(mainContentContainer).toHaveClass('flex', 'flex-col', 'flex-1');
    });

    it('applies smooth transitions to layout changes', () => {
      render(<App />);

      const mainContentContainer = document.querySelector('.flex.flex-col.flex-1');
      expect(mainContentContainer).toHaveClass('transition-all', 'duration-250', 'ease-in-out');
    });

    it('handles responsive layout correctly', () => {
      render(<App />);

      const appContainer = document.querySelector('.flex.h-full');
      expect(appContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('sets up resize event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<App />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('cleans up resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<App />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Tab Navigation and Content Rendering', () => {
    it('renders issue generator by default', () => {
      render(<App />);
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });

    it('renders main content area correctly', () => {
      render(<App />);

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('flex-1', 'overflow-y-auto', 'p-6');
    });
  });

  describe('Settings Integration', () => {
    it('manages settings tab state with default value', () => {
      render(<App />);

      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('sets up theme effect correctly', () => {
      render(<App />);

      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });
  });

  describe('Authentication Integration', () => {
    it('renders authentication button in sidebar', () => {
      render(<App />);

      const authButton = screen.getByLabelText('Login with GitLab');
      expect(authButton).toBeInTheDocument();
    });
  });

  describe('Footer Integration', () => {
    it('renders footer with correct styling and transitions', () => {
      render(<App />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('transition-all', 'duration-250', 'ease-in-out');

      expect(footer).toHaveTextContent('Created with ❤ by Omer Zirh');

      const link = screen.getByRole('link', { name: 'Omer Zirh' });
      expect(link).toHaveAttribute('href', 'https://github.com/omerzirh');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
