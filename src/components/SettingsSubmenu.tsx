import React from 'react';
import Tooltip from './Tooltip';

interface SettingsSubmenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SettingsSubmenuProps {
  activeSettingsTab: string;
  onSettingsTabChange: (tab: string) => void;
  isCollapsed: boolean;
  isMobile: boolean;
}

const LabelsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const PrefixesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const AIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const GitLabIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-9.78A2.14 2.14 0 0 1 4.11 2h15.78a2.14 2.14 0 0 1 1.84 1.67l1.22 9.78a.84.84 0 0 1-.3.94z"/>
  </svg>
);

const ProjectIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const settingsSubmenuItems: SettingsSubmenuItem[] = [
  { id: 'labels', label: 'Labels', icon: LabelsIcon },
  { id: 'prefixes', label: 'Prefixes', icon: PrefixesIcon },
  { id: 'ai', label: 'AI Provider', icon: AIIcon },
  { id: 'gitlab', label: 'GitLab', icon: GitLabIcon },
  { id: 'project', label: 'Project', icon: ProjectIcon }
];

const SettingsSubmenu: React.FC<SettingsSubmenuProps> = ({
  activeSettingsTab,
  onSettingsTabChange,
  isCollapsed,
  isMobile
}) => {
  return (
    <div className="mt-2 space-y-1">
      {settingsSubmenuItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeSettingsTab === item.id;
        
        const buttonContent = (
          <button
            key={item.id}
            onClick={() => onSettingsTabChange(item.id)}
            className={`
              w-full flex items-center p-2 rounded-md transition-all duration-150 ease-in-out text-sm
              ${isActive 
                ? 'bg-slate-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }
              ${isCollapsed && !isMobile ? 'justify-center' : 'justify-start'}
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
            `}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Navigate to ${item.label} settings`}
          >
            <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'scale-110' : ''}`} />
            {(!isCollapsed || isMobile) && (
              <span className="ml-2 truncate">
                {item.label}
              </span>
            )}
          </button>
        );

        if (isCollapsed && !isMobile) {
          return (
            <Tooltip 
              key={item.id}
              content={item.label}
              position="right"
              delay={400}
            >
              {buttonContent}
            </Tooltip>
          );
        }

        return buttonContent;
      })}
    </div>
  );
};

export default SettingsSubmenu;