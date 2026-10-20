import React, { useEffect, useRef } from 'react';
import StudentTabBar from './components/StudentTabBar';
import StudentDashboard from './pages/StudentDashboard';
import PaymentHistory from './pages/PaymentHistory';
import NesaCalendar from './pages/NesaCalendar';
import UpdateProfile from './pages/UpdateProfile';

// The four student tabs stay mounted while the student area is open, so each tab
// keeps its scroll position and current view state when switching between them.
const TAB_PAGES = [
  { page: 'StudentDashboard', Component: StudentDashboard },
  { page: 'PaymentHistory', Component: PaymentHistory },
  { page: 'NesaCalendar', Component: NesaCalendar },
  { page: 'UpdateProfile', Component: UpdateProfile },
];
const TAB_KEYS = TAB_PAGES.map(t => t.page);
const OTHER_STUDENT_PAGES = ['PayDues', 'Donate', 'Suggestions'];

export default function Layout({ children, currentPageName }) {
  const isTabPage = TAB_KEYS.includes(currentPageName);
  const isStudentArea = isTabPage || OTHER_STUDENT_PAGES.includes(currentPageName);
  const scrollPositions = useRef({});
  const lastTab = useRef(null);

  // Remember where each tab was scrolled to, and restore it when returning
  useEffect(() => {
    const previous = lastTab.current;
    if (previous && previous !== currentPageName) scrollPositions.current[previous] = window.scrollY;
    lastTab.current = isTabPage ? currentPageName : null;
    if (isTabPage) window.scrollTo(0, scrollPositions.current[currentPageName] || 0);
  }, [currentPageName, isTabPage]);

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
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>

      <div style={{ paddingBottom: isStudentArea ? 'calc(56px + env(safe-area-inset-bottom))' : '0' }}>
        {isStudentArea ? (
          <>
            <div className={isTabPage ? '' : 'hidden'}>
              {TAB_PAGES.map(({ page, Component }) => (
                <div key={page} className={page === currentPageName ? '' : 'hidden'}>
                  <Component />
                </div>
              ))}
            </div>
            {!isTabPage && children}
          </>
        ) : children}
      </div>

      {isStudentArea && <StudentTabBar activeTab={isTabPage ? currentPageName : ''} />}
    </div>
  );
}