import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MainTab } from '../store/useTabStore';
import { useSidebarStore } from '../store/useSidebarStore';
import Tooltip from './Tooltip';
import SettingsSubmenu from './SettingsSubmenu';
import gitlab from "../assets/icons/gitlabicon.svg"
interface NavItem {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  isAuthenticated: boolean;
  onAuthToggle: () => void;
  onTitleClick: () => void;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: string) => void;
}

const IssueIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const EpicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l2 2-2 2m2-2H9m10 7l2 2-2 2m2-2H9" />
  </svg>
);

const MilestoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IterationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const navigationItems: NavItem[] = [
  { id: 'issue', label: 'Issues', icon: IssueIcon },
  { id: 'epic', label: 'Epics', icon: EpicIcon },
  { id: 'milestone', label: 'Milestones', icon: MilestoneIcon },
  { id: 'iteration', label: 'Iterations', icon: IterationIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
];

const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isAuthenticated,
  onAuthToggle,
  onTitleClick,
  activeSettingsTab = 'labels',
  onSettingsTabChange = () => { }
}) => {
  const {
    isCollapsed,
    isMobileOpen,
    showSettingsSubmenu,
    toggleCollapsed,
    setMobileOpen,
    setShowSettingsSubmenu
  } = useSidebarStore();

  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOnSettingsTabChange = (tab:string) => {
    toggleCollapsed(false)
    onSettingsTabChange(tab)
  }
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [currentTab, setMobileOpen, isMobile]);

  useEffect(() => {
    setShowSettingsSubmenu(currentTab === 'settings');
  }, [currentTab, setShowSettingsSubmenu]);
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (!mobile) {
      setMobileOpen(false);
    }
  }, [setMobileOpen]);

  useEffect(() => {
    let timeoutId: number;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleResize, 100);
    };

    handleResize(); 
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 250);
    return () => clearTimeout(timer);
  }, [isCollapsed, isMobileOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen, setMobileOpen]);

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className={`
            fixed top-4 right-4 z-50 p-2 bg-slate-800 text-white rounded-md shadow-lg
            transition-all duration-200 ease-in-out hover:bg-slate-700 hover:scale-105
            ${isMobileOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {isMobile && (
        <div
          className={`
            fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out
            ${isMobileOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
          `}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 z-50 h-full bg-slate-800 text-white border-r border-slate-700 shadow-lg
          transition-all duration-250 ease-in-out
          ${isMobile
            ? `right-0 w-72 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}`
            : `left-0 ${isCollapsed ? 'w-16' : 'w-60'}`
          }
          ${isTransitioning ? 'overflow-hidden' : ''}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {(!isCollapsed || isMobile) && (
            <button
              onClick={onTitleClick}
              className="font-medium hover:text-slate-300 transition-colors duration-150 truncate"
              aria-label="Go to issues page"
            >
              GitLab PM
            </button>
          )}

          {!isMobile && (
            <Tooltip
              content={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              position="right"
              delay={300}
            >
              <button
                onClick={() => toggleCollapsed()}
                className="p-1 hover:bg-slate-700 rounded transition-colors duration-150"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </Tooltip>
          )}

          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 hover:bg-slate-700 rounded transition-colors duration-150"
              aria-label="Close navigation menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <nav className="flex-1 p-2" role="navigation" aria-label="Main navigation">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;

              const buttonContent = (
                <div key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full flex items-center p-3 rounded-lg transition-all duration-150 ease-in-out
                      ${isActive
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-sm'
                      }
                      ${isCollapsed && !isMobile ? 'justify-center' : 'justify-start'}
                      focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Navigate to ${item.label}`}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                    {(!isCollapsed || isMobile) && (
                      <span className={`ml-3 truncate transition-opacity duration-200 ${isTransitioning && !isMobile ? 'opacity-0' : 'opacity-100'}`}>
                        {item.label}
                      </span>
                    )}
                  </button>

                  {item.id === 'settings' && showSettingsSubmenu && (
                    <div className={`
                      ml-2 transition-all duration-200 ease-in-out
                      ${(!isCollapsed || isMobile) ? 'opacity-100' : 'opacity-0'}
                    `}>
                      <SettingsSubmenu
                        activeSettingsTab={activeSettingsTab}
                        onSettingsTabChange={onSettingsTabChange}
                        isCollapsed={isCollapsed}
                        isMobile={isMobile}
                      />
                    </div>
                  )}
                </div>
              );

              if (isCollapsed && !isMobile && item.id !== 'settings') {
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

              if (isCollapsed && !isMobile && item.id === 'settings') {
                return (
                  <div key={item.id} className="relative">
                    <Tooltip
                      content={item.label}
                      position="right"
                      delay={400}
                    >
                      <button
                        onClick={() => onTabChange(item.id)}
                        className={`
                          w-full flex items-center p-3 rounded-lg transition-all duration-150 ease-in-out
                          ${isActive
                            ? 'bg-slate-700 text-white shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-sm'
                          }
                          justify-center
                          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
                        `}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`Navigate to ${item.label}`}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                      </button>
                    </Tooltip>

                    {showSettingsSubmenu && (
                      <div className="absolute left-full top-0 ml-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-2 min-w-48 z-50">
                        <SettingsSubmenu
                          activeSettingsTab={activeSettingsTab}
                          onSettingsTabChange={handleOnSettingsTabChange}
                          isCollapsed={false}
                          isMobile={false}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              return buttonContent;
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          {isCollapsed && !isMobile ? (
            <Tooltip
              content={isAuthenticated ? 'Logout' : 'Login with GitLab'}
              position="right"
              delay={400}
            >
              <button
                onClick={onAuthToggle}
                className={`
                  w-full flex items-center p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg 
                  transition-all duration-150 ease-in-out justify-center hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
                `}
                aria-label={isAuthenticated ? 'Logout' : 'Login with GitLab'}
              >
                <img src={gitlab} alt="GitLab" className="w-5 h-5 flex-shrink-0" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={onAuthToggle}
              className={`
                w-full flex items-center p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg 
                transition-all duration-150 ease-in-out justify-start hover:shadow-sm
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
              `}
              aria-label={isAuthenticated ? 'Logout' : 'Login with GitLab'}
            >
              <img src={gitlab} alt="GitLab" className="w-5 h-5 flex-shrink-0" />
              <span className={`ml-3 truncate transition-opacity duration-200 ${isTransitioning && !isMobile ? 'opacity-0' : 'opacity-100'} flex items-center gap-2`}>
                {isAuthenticated ? 'Logout' : 'Login with GitLab'}
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;