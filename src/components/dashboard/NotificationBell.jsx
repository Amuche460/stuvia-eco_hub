import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, Calendar, CreditCard, Megaphone, Info, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInHours } from 'date-fns';

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

// Plays a gentle chime using Web Audio API
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch (e) {
    // Audio not supported
  }
}

export default function NotificationBell({ studentId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('nesa_chime') !== 'off');
  const ref = useRef();
  const checkedEventsRef = useRef(new Set());

  useEffect(() => {
    if (studentId) loadNotifications();
  }, [studentId]);

  // Check for events happening tomorrow and chime
  useEffect(() => {
    if (!soundOn) return;
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 60 * 60 * 1000); // re-check every hour
    return () => clearInterval(interval);
  }, [soundOn]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const checkUpcomingEvents = async () => {
    try {
      const events = await base44.entities.NesaEvent.list('event_date', 50);
      const now = new Date();
      events.forEach(ev => {
        if (!ev.event_date || checkedEventsRef.current.has(ev.id)) return;
        const eventDate = new Date(ev.event_date);
        const hoursUntil = differenceInHours(eventDate, now);
        // Chime if event is between 20 and 28 hours away (approx 1 day)
        if (hoursUntil >= 20 && hoursUntil <= 28) {
          checkedEventsRef.current.add(ev.id);
          playChime();
        }
      });
    } catch (e) {
      // silently fail
    }
  };

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

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem('nesa_chime', next ? 'on' : 'off');
    if (next) playChime(); // preview the chime when turning on
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
                {/* Sound toggle */}
                <button
                  onClick={toggleSound}
                  title={soundOn ? 'Mute event chimes' : 'Enable event chimes'}
                  className={`p-1.5 rounded-lg transition-colors ${soundOn ? 'bg-teal-50 text-teal-600 hover:bg-teal-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-teal-600 hover:underline">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>

            {/* Sound hint */}
            <div className={`px-4 py-2 text-xs flex items-center gap-1.5 ${soundOn ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-400'}`}>
              {soundOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              {soundOn ? 'Chime alerts on for events happening tomorrow' : 'Event chime alerts are muted'}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
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