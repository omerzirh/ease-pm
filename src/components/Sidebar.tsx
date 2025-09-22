import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MainTab } from '../store/useTabStore';
import { useSidebarStore } from '../store/useSidebarStore';
import Tooltip from './ui/Tooltip';
import SettingsSubmenu from './SettingsSubmenu';
import ThemeToggle from './ThemeToggle';
import gitlab from '../assets/icons/gitlabicon.svg';
import { Button } from './ui';
import { CiStickyNote } from 'react-icons/ci';
import { AiOutlinePicLeft } from 'react-icons/ai';
import { GoMilestone } from 'react-icons/go';
import { GoIterations } from 'react-icons/go';
import { IoSettingsOutline } from 'react-icons/io5';
import { MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from 'react-icons/md';
import { RxCross2 } from 'react-icons/rx';

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

const navigationItems: NavItem[] = [
  { id: 'issue', label: 'Issues', icon: CiStickyNote },
  { id: 'epic', label: 'Epics', icon: AiOutlinePicLeft },
  { id: 'milestone', label: 'Milestones', icon: GoMilestone },
  { id: 'iteration', label: 'Iterations', icon: GoIterations },
  { id: 'settings', label: 'Settings', icon: IoSettingsOutline },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isAuthenticated,
  onAuthToggle,
  onTitleClick,
  activeSettingsTab = 'labels',
  onSettingsTabChange = () => {},
}) => {
  const { isCollapsed, isMobileOpen, showSettingsSubmenu, toggleCollapsed, setMobileOpen, setShowSettingsSubmenu } =
    useSidebarStore();

  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOnSettingsTabChange = (tab: string) => {
    toggleCollapsed(false);
    onSettingsTabChange(tab);
  };
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
        <Button
          onClick={() => setMobileOpen(true)}
          className={`
            fixed top-4 right-4 z-50 p-2 bg-slate-800 text-white rounded-md shadow-lg
            transition-all duration-200 ease-in-out hover:bg-slate-700 hover:scale-105
            ${isMobileOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
          aria-label="Open navigation menu"
          variant={'secondary'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
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
          transition-all duration-250 ease-in-out flex flex-col
          ${
            isMobile
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
            <Button
              onClick={onTitleClick}
              className="font-medium text-orange-400 hover:text-orange-300 transition-colors duration-150 truncate"
              aria-label="Go to issues page"
              variant={'toggle'}
            >
              Ease PM
            </Button>
          )}

          {!isMobile && (
            <Button
              onClick={() => toggleCollapsed()}
              className="text-white p-1 rounded transition-colors duration-150"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              variant={'toggle'}
            >
              {isCollapsed ? (
                <MdOutlineKeyboardArrowRight className="w-6 h-6" />
              ) : (
                <MdOutlineKeyboardArrowLeft className="w-6 h-6" />
              )}
            </Button>
          )}

          {isMobile && (
            <Button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded transition-colors duration-150"
              aria-label="Close navigation menu"
              variant={'toggle'}
            >
              <RxCross2 className="w-5 h-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 p-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;

              const ButtonContent = (
                <div key={item.id}>
                  <Button
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full flex items-center p-3 rounded-lg transition-all duration-150 ease-in-out
                      ${
                        isActive
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-sm'
                      }
                      ${isCollapsed && !isMobile ? 'justify-center' : 'justify-start'}
                      focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Navigate to ${item.label}`}
                    variant={'secondary'}
                  >
                    <IconComponent
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${
                        isActive ? 'scale-110' : ''
                      }`}
                    />
                    {(!isCollapsed || isMobile) && (
                      <span
                        className={`ml-3 truncate transition-opacity duration-200 ${
                          isTransitioning && !isMobile ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </Button>

                  {item.id === 'settings' && showSettingsSubmenu && (
                    <div
                      className={`
                      ml-2 transition-all duration-200 ease-in-out
                      ${!isCollapsed || isMobile ? 'opacity-100' : 'opacity-0'}
                    `}
                    >
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
                  <Tooltip key={item.id} content={item.label} position="right" delay={400}>
                    {ButtonContent}
                  </Tooltip>
                );
              }

              if (isCollapsed && !isMobile && item.id === 'settings') {
                return (
                  <div key={item.id} className="relative">
                    <Tooltip content={item.label} position="right" delay={400}>
                      <Button
                        onClick={() => onTabChange(item.id)}
                        className={`
                          w-full flex items-center p-3 rounded-lg transition-all duration-150 ease-in-out
                          ${
                            isActive
                              ? 'bg-slate-700 text-white shadow-md'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-sm'
                          }
                          justify-center
                          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
                        `}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`Navigate to ${item.label}`}
                        variant={'secondary'}
                      >
                        <item.icon
                          className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${
                            isActive ? 'scale-110' : ''
                          }`}
                        />
                      </Button>
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

              return ButtonContent;
            })}
          </div>
        </nav>

        <div className="w-full p-1 border-t border-slate-700 space-y-1 mt-auto">
          {/* Theme Toggle */}
          {isCollapsed && !isMobile ? (
            <Tooltip content="Toggle theme" position="right" delay={400}>
              <div className="w-full flex justify-center">
                <ThemeToggle />
              </div>
            </Tooltip>
          ) : (
            <div className="w-full flex items-center justify-between px-3 py-2">
              <span
                className={`text-sm text-slate-300 transition-opacity duration-200 ${
                  isTransitioning && !isMobile ? 'opacity-0' : 'opacity-100'
                }`}
              >
                Theme
              </span>
              <ThemeToggle />
            </div>
          )}

          {/* GitLab Auth Button */}
          {isCollapsed && !isMobile ? (
            <Button
              onClick={onAuthToggle}
              className={'w-full'}
              aria-label={isAuthenticated ? 'Logout' : 'Login with GitLab'}
              variant={'toggle'}
            >
              <img src={gitlab} alt="GitLab" className="w-5 h-5 flex-shrink-0" />
            </Button>
          ) : (
            <Button
              onClick={onAuthToggle}
              className={'w-full'}
              aria-label={isAuthenticated ? 'Logout' : 'Login with GitLab'}
              variant={'toggle'}
            >
              <img src={gitlab} alt="GitLab" className="w-5 h-5 flex-shrink-0" />
              <span
                className={`ml-3 truncate transition-opacity duration-200 ${
                  isTransitioning && !isMobile ? 'opacity-0' : 'opacity-100'
                } flex items-center gap-2`}
              >
                {isAuthenticated ? 'Logout' : 'Login with GitLab'}
              </span>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
