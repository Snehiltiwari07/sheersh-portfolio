import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Match the prerendered markup; the head script already applies the saved palette.
  const [theme, setTheme] = useState('light');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const initial = document.documentElement.dataset.theme;
    setTheme(initial === 'dark' || initial === 'light' ? initial : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme, ready]);

  const toggle = () => setTheme(t => { const next = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('portfolio-theme', next); } catch { /* Theme still works without persistence. */ } return next; });

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
