import { useState, useEffect } from 'react';
import IssueGenerator from './components/IssueGenerator';
import MilestoneReport from './components/MilestoneReport';
import EpicCreator from './components/EpicCreator';
import ThemeToggle from './components/ThemeToggle';
import SettingsPage from './components/SettingsPage';
import { useTabStore } from './store/useTabStore';

import { useThemeStore } from './store/useThemeStore';

const App = () => {
  const { tab, setTab } = useTabStore();
  const { dark } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold cursor-pointer" onClick={() => setTab('issue')}>Ease GitLab</h1>
        <div className="flex items-center gap-4">
          <nav>
            <button
              className={`mr-2 px-3 py-1 rounded-md ${
                tab === 'issue' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onClick={() => setTab('issue')}
            >
              Issue Generator
            </button>
            <button
              className={`px-3 py-1 rounded-md ${
                tab === 'epic' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onClick={() => setTab('epic')}
            >
              Epic Creator
            </button>
            <button
              className={`ml-2 px-3 py-1 rounded-md ${
                tab === 'milestone' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onClick={() => setTab('milestone')}
            >
              Milestone Reports
            </button>
            <button
              className={`ml-2 px-3 py-1 rounded-md ${
                tab === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onClick={() => setTab('settings')}
            >
              Settings
            </button>
          </nav>
        
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {tab === 'issue' && <IssueGenerator />}
        {tab === 'epic' && <EpicCreator />}
        {tab === 'milestone' && <MilestoneReport />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <footer className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm">
        Created with <span className="text-black">❤</span> by{' '}
        <a
          href="https://github.com/omerzirh"
          className="text-gray-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Omer Zirh
        </a>
      </footer>
    </div>
  );
};

export default App;
