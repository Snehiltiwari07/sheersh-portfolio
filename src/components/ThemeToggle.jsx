import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  return (
    <button onClick={toggle} aria-label="Toggle theme" className="w-12 h-7 rounded-full relative chip" style={{ padding: 0 }}>
      <span
        className="w-5 h-5 rounded-full absolute top-[3px] left-[3px] grad-bg transition-transform duration-300"
        style={{ transform: isLight ? 'translateX(22px)' : 'translateX(0)' }}
      />
    </button>
  );
}
