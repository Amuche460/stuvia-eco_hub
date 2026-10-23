import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MobileSelect from '@/components/MobileSelect';
import { availableSessions } from '@/lib/sessionRecords';

export default function AcademicSessionFilter({ value, onChange }) {
  const { data = [], error, refetch } = useQuery({ queryKey: ['academic-sessions'], queryFn: availableSessions });
  const sessions = [...new Set([value, ...data])].sort().reverse();
  return <div className="space-y-1">
    <p className="text-sm font-semibold text-foreground">Academic session</p>
    <div className="w-full sm:w-56"><MobileSelect value={value} onValueChange={onChange} placeholder="Select session" options={sessions.map(session => ({ value: session, label: session }))} /></div>
    <p className="text-xs text-muted-foreground">September–August. Financial records shown for {value} only.</p>
    {error && <button className="text-xs text-destructive underline" onClick={() => refetch()}>Could not load older sessions. Retry</button>}
  </div>;
}