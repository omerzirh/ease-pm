import { useThemeStore } from '../store/useThemeStore';
import { Button } from './ui';

const ThemeToggle = () => {
	const { dark, toggle } = useThemeStore();

	return (
		<Button
			onClick={toggle}
			className='p-2 rounded-md transition-all duration-150 ease-in-out hover:bg-slate-700 hover:scale-105'
			aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
			variant='toggle'
		>
			<span className='text-xl transition-transform duration-200'>
				{dark ? '🌞' : '🌙'}
			</span>
		</Button>
	);
};

export default ThemeToggle;
