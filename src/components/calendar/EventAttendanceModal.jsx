import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Users, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export default function EventAttendanceModal({ event, onClose }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, [event.id]);

  const loadRegistrations = async () => {
    const regs = await base44.entities.EventRegistration.filter({ event_id: event.id }, 'student_name');
    setRegistrations(regs);
    setLoading(false);
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Reg No', 'Level', 'Registered At'],
      ...registrations.map(r => [r.student_name, r.student_reg_no || '', r.student_level || '', r.created_date ? format(parseISO(r.created_date), 'MMM d, yyyy h:mm a') : ''])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${event.title}-attendance.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">{event.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {loading ? '...' : `${registrations.length} registrant${registrations.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {registrations.length > 0 && (
              <button onClick={handleExport} className="text-teal-600 hover:text-teal-800 p-2 rounded-xl hover:bg-teal-50 transition-colors" title="Export CSV">
                <Download className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-400 animate-pulse">Loading...</div>
          ) : registrations.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No registrations yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {registrations.map((r, i) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.student_name}</p>
                    <p className="text-xs text-gray-400">{r.student_reg_no || '—'} {r.student_level ? `• ${r.student_level}L` : ''}</p>
                  </div>
                  <div className="ml-auto text-xs text-gray-300">
                    {r.created_date ? format(parseISO(r.created_date), 'MMM d') : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}