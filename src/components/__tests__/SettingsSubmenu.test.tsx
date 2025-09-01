import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsSubmenu from '../SettingsSubmenu';

describe('SettingsSubmenu', () => {
  const defaultProps = {
    activeSettingsTab: 'labels',
    onSettingsTabChange: vi.fn(),
    isCollapsed: false,
    isMobile: false,
  };

  it('renders all settings submenu items', () => {
    render(<SettingsSubmenu {...defaultProps} />);
    
    expect(screen.getByLabelText('Navigate to Labels settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Prefixes settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to AI Provider settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to GitLab settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Project settings')).toBeInTheDocument();
  });

  it('shows active state for current settings tab', () => {
    render(<SettingsSubmenu {...defaultProps} activeSettingsTab="ai" />);
    
    const aiButton = screen.getByLabelText('Navigate to AI Provider settings');
    expect(aiButton).toHaveAttribute('aria-current', 'page');
  });

  it('handles settings tab clicks', () => {
    const onSettingsTabChange = vi.fn();
    render(<SettingsSubmenu {...defaultProps} onSettingsTabChange={onSettingsTabChange} />);
    
    const gitlabButton = screen.getByLabelText('Navigate to GitLab settings');
    fireEvent.click(gitlabButton);
    
    expect(onSettingsTabChange).toHaveBeenCalledWith('gitlab');
  });

  it('applies collapsed styling when collapsed on desktop', () => {
    render(<SettingsSubmenu {...defaultProps} isCollapsed={true} isMobile={false} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('justify-center');
    });
  });

  it('shows text labels when not collapsed or on mobile', () => {
    render(<SettingsSubmenu {...defaultProps} isCollapsed={false} isMobile={false} />);
    
    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Prefixes')).toBeInTheDocument();
    expect(screen.getByText('AI Provider')).toBeInTheDocument();
    expect(screen.getByText('GitLab')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });
});