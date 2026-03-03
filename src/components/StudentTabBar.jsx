import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Receipt, Calendar, User } from 'lucide-react';

const tabs = [
  { label: 'Home', icon: Home, page: 'StudentDashboard' },
  { label: 'History', icon: Receipt, page: 'PaymentHistory' },
  { label: 'Calendar', icon: Calendar, page: 'NesaCalendar' },
  { label: 'Profile', icon: User, page: 'UpdateProfile' },
];

export default function StudentTabBar() {
  const location = useLocation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ label, icon: Icon, page }) => {
        const url = createPageUrl(page);
        const isActive = location.pathname.includes(page) ||
          (page === 'StudentDashboard' && location.pathname === '/');
        return (
          <Link
            key={page}
            to={url}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors no-min-h
              ${isActive
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            style={{ minHeight: '56px' }}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}