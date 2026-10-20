import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Megaphone, ExternalLink } from 'lucide-react';

const TYPE_LABELS = {
  announcement: { label: 'Announcement', color: 'bg-blue-100 text-blue-700' },
  editorial: { label: 'Editorial', color: 'bg-purple-100 text-purple-700' },
  magazine: { label: 'Magazine', color: 'bg-rose-100 text-rose-700' },
  weekly_update: { label: 'Weekly Update', color: 'bg-emerald-100 text-emerald-700' },
  form_poll: { label: 'Form/Poll', color: 'bg-amber-100 text-amber-700' },
};

export default function AnnouncementFeed({ studentLevel }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    base44.entities.NesaAnnouncement.list('-created_date', 10).then(data => {
      // Filter by level if applicable
      const filtered = data.filter(a =>
        !a.target_levels || a.target_levels.length === 0 || a.target_levels.includes(studentLevel)
      );
      setAnnouncements(filtered);
    });
  }, [studentLevel]);

  if (announcements.length === 0) return null;

  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-blue-600" />
        NESA Announcements
      </h3>
      <div className="space-y-2">
        {announcements.map(a => {
          const typeInfo = TYPE_LABELS[a.type] || TYPE_LABELS.announcement;
          return (
            <div key={a.id} className="bg-white rounded-xl border border-blue-50 p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={`text-xs ${typeInfo.color} border-0`}>{typeInfo.label}</Badge>
                <span className="text-xs text-gray-400 ml-auto">{format(new Date(a.created_date), 'MMM d')}</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm select-text">{a.title}</h4>
              <p className="text-xs text-gray-500 mt-1 select-text">{a.content}</p>
              {a.form_url && (
                <a href={a.form_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                  <ExternalLink className="w-3 h-3" /> Open Form/Poll
                </a>
              )}
              {(a.posted_by_name || a.posted_by) && (
                <p className="text-xs text-gray-400 mt-1.5">
                  — {a.posted_by_name}{a.posted_by ? `, ${a.posted_by}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}