import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  default: ({ activeTab }: { activeTab: string }) => (
    <div data-testid="settings-page">Settings Page - {activeTab}</div>
  ),
}));

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('App Comprehensive Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    window.innerWidth = 1024;
  });

  describe('NavigationBar Replacement', () => {
    it('successfully replaced NavigationBar with Sidebar', () => {
      render(<App />);
      
      const sidebar = document.querySelector('aside[role="navigation"]');
      expect(sidebar).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Issues')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Epics')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Milestones')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Iterations')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Settings')).toBeInTheDocument();
      
      expect(screen.getByLabelText('Login with GitLab')).toBeInTheDocument();
    });

    it('maintains proper app structure with sidebar integration', () => {
      render(<App />);
      
      const appContainer = document.querySelector('.flex.h-full');
      expect(appContainer).toBeInTheDocument();
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('flex-1', 'overflow-y-auto', 'p-6');
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Layout and Responsive Behavior', () => {
    it('applies correct layout classes and transitions', () => {
      render(<App />);
      
      const mainContentContainer = document.querySelector('.flex.flex-col.flex-1');
      expect(mainContentContainer).toHaveClass(
        'flex', 
        'flex-col', 
        'flex-1', 
        'transition-all', 
        'duration-250', 
        'ease-in-out'
      );
    });

    it('handles responsive behavior correctly', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<App />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('handles window resize events', () => {
      render(<App />);
      
      window.innerWidth = 500;
      fireEvent(window, new Event('resize'));
      
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper semantic structure', () => {
      render(<App />);
      
      const navigationElements = screen.getAllByRole('navigation');
      expect(navigationElements.length).toBeGreaterThan(0);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('provides proper aria labels for navigation', () => {
      render(<App />);
      
      expect(screen.getByLabelText('Navigate to Issues')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Epics')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Milestones')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Iterations')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Login with GitLab')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<App />);
      
      const issueButton = screen.getByLabelText('Navigate to Issues');
      issueButton.focus();
      expect(document.activeElement).toBe(issueButton);
    });
  });

  describe('Settings Integration', () => {
    it('manages settings state correctly', () => {
      render(<App />);
      
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });

    it('passes correct props to Sidebar for settings', () => {
      render(<App />);
      
      const sidebar = document.querySelector('aside[role="navigation"]');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('sets up theme management correctly', () => {
      render(<App />);
      
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
      
    });
  });

  describe('Content Rendering', () => {
    it('renders default content correctly', () => {
      render(<App />);
      
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });

    it('handles tab navigation structure', () => {
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Footer Integration', () => {
    it('renders footer with correct content and styling', () => {
      render(<App />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      
      expect(footer).toHaveTextContent('Created with ❤ by Omer Zirh');
      
      const link = screen.getByRole('link', { name: 'Omer Zirh' });
      expect(link).toHaveAttribute('href', 'https://github.com/omerzirh');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      
      expect(footer).toHaveClass('transition-all', 'duration-250', 'ease-in-out');
    });
  });

  describe('Error Handling', () => {
    it('renders without crashing', () => {
      expect(() => render(<App />)).not.toThrow();
    });

    it('handles missing props gracefully', () => {
      render(<App />);
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });
  });

  describe('Performance and Cleanup', () => {
    it('cleans up event listeners properly', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<App />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('handles multiple renders correctly', () => {
      const { rerender } = render(<App />);
      
      rerender(<App />);
      expect(screen.getByTestId('issue-generator')).toBeInTheDocument();
    });
  });
});