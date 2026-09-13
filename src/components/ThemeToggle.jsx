import { useTheme } from '../context/ThemeContext';

/* NOTE: this component is not mounted anywhere today (App.jsx renders no theme
   toggle). Tokenised anyway so it stays consistent with the design system when
   it is re-mounted. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  return (
    <button onClick={toggle} aria-label="Toggle theme" aria-pressed={isLight} className="w-12 h-7 rounded-full relative chip p-0">
      <span
        className="w-5 h-5 rounded-full absolute top-knob left-knob grad-bg transition-transform duration-base ease-spring"
        style={{ transform: isLight ? 'translateX(var(--layout-toggle-travel))' : 'translateX(0)' }}
      />
    </button>
  );
}
