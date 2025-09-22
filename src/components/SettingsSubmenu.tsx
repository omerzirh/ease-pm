import React from 'react';
import Tooltip from './ui/Tooltip';
import { Button } from './ui';
import { TbLabelImportantFilled } from 'react-icons/tb';
import { ImParagraphLeft } from 'react-icons/im';
import { MdOutlineSmartToy } from 'react-icons/md';
import { AiOutlineGitlab } from 'react-icons/ai';
import { LiaProjectDiagramSolid } from 'react-icons/lia';

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

const settingsSubmenuItems: SettingsSubmenuItem[] = [
  { id: 'labels', label: 'Labels', icon: TbLabelImportantFilled },
  { id: 'prefixes', label: 'Prefixes', icon: ImParagraphLeft },
  { id: 'ai', label: 'AI Provider', icon: MdOutlineSmartToy },
  { id: 'gitlab', label: 'GitLab', icon: AiOutlineGitlab },
  { id: 'project', label: 'Project', icon: LiaProjectDiagramSolid },
];

const SettingsSubmenu: React.FC<SettingsSubmenuProps> = ({
  activeSettingsTab,
  onSettingsTabChange,
  isCollapsed,
  isMobile,
}) => {
  return (
    <div className="mt-2 space-y-1">
      {settingsSubmenuItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeSettingsTab === item.id;

        const buttonContent = (
          <Button
            key={item.id}
            onClick={() => onSettingsTabChange(item.id)}
            className={`
              w-full flex items-center p-2 rounded-md transition-all duration-150 ease-in-out text-sm
              ${
                isActive
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }
              ${isCollapsed && !isMobile ? 'justify-center' : 'justify-start'}
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
            `}
            variant={'secondary'}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Navigate to ${item.label} settings`}
          >
            <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'scale-110' : ''}`} />
            {(!isCollapsed || isMobile) && <span className="ml-2 truncate">{item.label}</span>}
          </Button>
        );

        if (isCollapsed && !isMobile) {
          return (
            <Tooltip key={item.id} content={item.label} position="right" delay={400}>
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
