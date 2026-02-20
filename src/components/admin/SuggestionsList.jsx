import React from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MessageSquare, CheckCircle, Eye } from 'lucide-react';

const teamColors = {
  'Welfare': 'bg-rose-50 text-rose-700',
  'Social': 'bg-purple-50 text-purple-700',
  'Sports': 'bg-blue-50 text-blue-700',
  'Financial': 'bg-emerald-50 text-emerald-700',
  'Community Development': 'bg-amber-50 text-amber-700',
  'Academic': 'bg-indigo-50 text-indigo-700',
  'General NESA': 'bg-gray-100 text-gray-700',
};

const statusActions = {
  new: 'reviewed',
  reviewed: 'addressed',
};

export default function SuggestionsList({ suggestions, onRefresh }) {
  const handleStatusUpdate = async (suggestion) => {
    const nextStatus = statusActions[suggestion.status];
    if (!nextStatus) return;
    await base44.entities.Suggestion.update(suggestion.id, { status: nextStatus });
    onRefresh();
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
        No suggestions yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map(s => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={teamColors[s.team] || 'bg-gray-100 text-gray-700'}>
                {s.team}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {s.status}
              </Badge>
            </div>
            <span className="text-xs text-gray-400">
              {format(new Date(s.created_date), 'MMM d, yyyy')}
            </span>
          </div>
          <h4 className="font-semibold text-sm text-gray-900 mb-1">{s.subject}</h4>
          <p className="text-sm text-gray-600 mb-3">{s.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {s.is_anonymous ? 'Anonymous' : s.student_name}
            </span>
            {statusActions[s.status] && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate(s)}
                className="text-xs rounded-lg"
              >
                {s.status === 'new' ? (
                  <><Eye className="w-3 h-3 mr-1" /> Mark Reviewed</>
                ) : (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Mark Addressed</>
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}