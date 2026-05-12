import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`p-2 rounded-xl transition-colors ${
        theme === 'dark'
          ? 'bg-gray-700 text-amber-400 hover:bg-gray-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}