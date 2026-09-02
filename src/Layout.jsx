import React from 'react';
import StudentTabBar from './components/StudentTabBar';

const STUDENT_PAGES = ['StudentDashboard', 'Reels', 'PaymentHistory', 'NesaCalendar', 'UpdateProfile', 'PayDues', 'Donate', 'Suggestions'];

export default function Layout({ children, currentPageName }) {
  const isStudentPage = STUDENT_PAGES.includes(currentPageName);

  return (
    <div
      className="min-h-screen bg-background text-foreground select-none transition-colors duration-200"
      style={{
        '--teal': '#1a6b62',
        '--teal-dark': '#0f4a44',
        '--gold': '#d4a833',
        '--gold-light': '#f0c040',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{`
        :root {
          --color-primary: #1a6b62;
          --color-primary-dark: #0f4a44;
          --color-gold: #d4a833;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        input, textarea, [contenteditable] {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
        body {
          overscroll-behavior: none;
          padding-top: env(safe-area-inset-top);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>

      <div style={{ paddingBottom: isStudentPage ? 'calc(56px + env(safe-area-inset-bottom))' : '0' }}>
        {children}
      </div>

      {isStudentPage && <StudentTabBar />}
    </div>
  );
}