import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'nesa_theme';

const getSystemTheme = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  // A saved choice wins; otherwise start from the device's system appearance
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || getSystemTheme());
  const hasUserChoice = useRef(Boolean(localStorage.getItem(STORAGE_KEY)));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (hasUserChoice.current) localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Keep following the system setting while the user hasn't picked a theme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!hasUserChoice.current) setTheme(e.matches ? 'dark' : 'light');
    };
    if (media.addEventListener) media.addEventListener('change', handleChange);
    else media.addListener(handleChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', handleChange);
      else media.removeListener(handleChange);
    };
  }, []);

  const toggleTheme = () => {
    hasUserChoice.current = true;
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}