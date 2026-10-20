import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Receipt, Calendar, User } from 'lucide-react';

const tabs = [
  { label: 'Home', icon: Home, page: 'StudentDashboard' },
  { label: 'History', icon: Receipt, page: 'PaymentHistory' },
  { label: 'Calendar', icon: Calendar, page: 'NesaCalendar' },
  { label: 'Profile', icon: User, page: 'UpdateProfile' },
];

export default function StudentTabBar({ activeTab }) {
  const navigate = useNavigate();

  // Which tab is showing is owned by the layout, so the mounted tab pane and the
  // highlighted tab always agree.
  const isActive = (page) => page === activeTab;

  const handleTabPress = (e, page) => {
    if (isActive(page)) {
      // Already on this tab — keep the pane mounted and just bring it back to the top
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(createPageUrl(page), { replace: true });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex">
      {tabs.map(({ label, icon: Icon, page }) => {
        const active = isActive(page);
        return (
          <Link
            key={page}
            to={createPageUrl(page)}
            onClick={(e) => handleTabPress(e, page)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
              ${active
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            style={{ minHeight: '56px' }}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}