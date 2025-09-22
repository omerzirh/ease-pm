import { useEffect, useState } from 'react';
import IssueGenerator from './components/IssueGenerator';
import MilestoneReport from './components/MilestoneReport';
import IterationReport from './components/IterationReport';
import EpicCreator from './components/EpicCreator';
import Sidebar from './components/Sidebar';
import { useSidebarStore } from './store/useSidebarStore';
import { useGitlabAuth } from './store/useGitlabAuth';
import SettingsPage from './components/SettingsPage';
import { useTabStore } from './store/useTabStore';
import { useThemeStore } from './store/useThemeStore';

const App = () => {
	const { token, login, logout } = useGitlabAuth();
	const { tab, setTab } = useTabStore();
	const { dark } = useThemeStore();
	const { isCollapsed } = useSidebarStore();
	const [isMobile, setIsMobile] = useState(false);
	const [activeSettingsTab, setActiveSettingsTab] = useState('labels');

	useEffect(() => {
		const root = document.documentElement;
		if (dark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}, [dark]);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className='flex h-full'>
			<Sidebar
				currentTab={tab}
				onTabChange={setTab}
				isAuthenticated={!!token}
				onAuthToggle={token ? logout : login}
				onTitleClick={() => setTab('issue')}
				activeSettingsTab={activeSettingsTab}
				onSettingsTabChange={setActiveSettingsTab}
			/>

			<div
				className={`
          flex flex-col flex-1 transition-all duration-250 ease-in-out
          ${isMobile ? 'ml-0' : isCollapsed ? 'ml-16' : 'ml-60'}
        `}
			>
				<main className='flex-1 overflow-y-auto p-6 bg-background text-foreground'>
					{tab === 'issue' && <IssueGenerator />}
					{tab === 'epic' && <EpicCreator />}
					{tab === 'milestone' && <MilestoneReport />}
					{tab === 'iteration' && <IterationReport />}
					{tab === 'settings' && <SettingsPage activeTab={activeSettingsTab} />}
				</main>

				<footer
					className={`
            p-4 border-t border-border bg-background text-center text-sm transition-all duration-250 ease-in-out
          `}
				>
					Created with <span className='text-destructive'>❤</span> by{' '}
					<a
						href='https://github.com/omerzirh'
						className='text-muted-foreground hover:text-foreground hover:underline transition-colors'
						target='_blank'
						rel='noopener noreferrer'
					>
						Omer Zirh
					</a>
				</footer>
			</div>
		</div>
	);
};

export default App;
