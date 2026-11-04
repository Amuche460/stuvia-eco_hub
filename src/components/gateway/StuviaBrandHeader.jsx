import React from 'react';
import { GraduationCap } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export function StuviaBrandMark() {
  return (
    <div className="inline-flex items-center justify-center gap-2.5 mb-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-900/15">
        <GraduationCap className="w-5 h-5 text-amber-300" />
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-400">
        Stuvia
      </span>
    </div>
  );
}

export default function StuviaGatewayShell({ children, topRight }) {
  return (
    <div
      className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-[#f8f3eb] dark:bg-gray-950 transition-colors duration-200"
      style={{
        backgroundImage: `radial-gradient(rgba(26, 107, 98, 0.09) 1.5px, transparent 1.5px), radial-gradient(rgba(212, 168, 51, 0.12) 1.5px, transparent 1.5px)`,
        backgroundSize: '36px 36px',
        backgroundPosition: '0 0, 18px 18px',
      }}
    >
      <header className="w-full max-w-5xl mx-auto px-4 pt-safe py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-amber-300" />
          </div>
          <span className="font-bold text-base tracking-tight text-emerald-900 dark:text-emerald-300">
            STUVIA
          </span>
        </div>
        <div className="flex items-center gap-2">
          {topRight}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 z-10">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-stone-900/5 border border-stone-200/70 dark:border-gray-800 p-6 sm:p-8">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-stone-400 dark:text-gray-500 z-10">
        © {new Date().getFullYear()} Stuvia Campus Portal · Multi-University Departmental Hub
      </footer>
    </div>
  );
}