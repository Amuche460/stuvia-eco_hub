import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, Calendar, CreditCard, Megaphone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const TYPE_ICONS = {
  event: Calendar,
  payment: CreditCard,
  announcement: Megaphone,
  general: Info,
};

const TYPE_COLORS = {
  event: 'bg-teal-50 text-teal-700',
  payment: 'bg-emerald-50 text-emerald-700',
  announcement: 'bg-amber-50 text-amber-700',
  general: 'bg-blue-50 text-blue-700',
};

export default function NotificationBell({ studentId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (studentId) loadNotifications();
    // eslint-disable-next-line
  }, [studentId]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    const all = await base44.entities.NesaNotification.list('-created_date', 30);
    setNotifications(all);
  };

  const unreadCount = notifications.filter(n => !n.is_read_by?.includes(studentId)).length;

  const markRead = async (notif) => {
    if (notif.is_read_by?.includes(studentId)) return;
    const updated = { ...notif, is_read_by: [...(notif.is_read_by || []), studentId] };
    await base44.entities.NesaNotification.update(notif.id, { is_read_by: updated.is_read_by });
    setNotifications(prev => prev.map(n => n.id === notif.id ? updated : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read_by?.includes(studentId));
    await Promise.all(unread.map(n => {
      const updated = { is_read_by: [...(n.is_read_by || []), studentId] };
      return base44.entities.NesaNotification.update(n.id, updated);
    }));
    setNotifications(prev => prev.map(n => ({
      ...n, is_read_by: n.is_read_by?.includes(studentId) ? n.is_read_by : [...(n.is_read_by || []), studentId]
    })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-teal-600 hover:underline">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No notifications yet</div>
              ) : notifications.map(n => {
                const isRead = n.is_read_by?.includes(studentId);
                const Icon = TYPE_ICONS[n.type] || Info;
                return (
                  <button key={n.id} onClick={() => markRead(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!isRead ? 'bg-teal-50/40' : ''}`}>
                    <div className={`rounded-lg p-1.5 flex-shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || 'bg-gray-50 text-gray-500'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-300 mt-1">{format(parseISO(n.created_date), 'MMM d, h:mm a')}</p>
                    </div>
                    {!isRead && <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}