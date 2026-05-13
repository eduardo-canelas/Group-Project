import React, { useEffect, useMemo, useState } from 'react';
import { ThemeContext, useTheme } from './theme-context';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle color theme">
      <span className={`theme-toggle-thumb ${theme === 'light' ? 'is-light' : 'is-dark'}`} />
      <span className={`theme-toggle-label ${theme === 'dark' ? 'is-active' : ''}`}>Dark</span>
      <span className={`theme-toggle-label ${theme === 'light' ? 'is-active' : ''}`}>Light</span>
    </button>
  );
}
