import { useThemeStore } from '../store/useThemeStore';

const ThemeToggle = () => {
  const { dark, toggle } = useThemeStore();
  return (
    <button
      className=" rounded-md text-xl"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {dark ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
