import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AutoVerifyPanel from '@/components/admin/AutoVerifyPanel';
import { allPaymentPages, sessionPaymentQuery } from '@/lib/sessionRecords';

export default function SessionAutoVerifyPanel({ session, onRefresh }) {
  const { data = [], isPending, error, refetch } = useQuery({
    queryKey: ['session-payments', 'pending-verification', session],
    queryFn: () => allPaymentPages(sessionPaymentQuery(session, { status: 'pending' })),
  });
  if (isPending) return <p className="text-muted-foreground text-sm">Loading pending payments for {session}...</p>;
  if (error) return <button className="text-destructive text-sm underline" onClick={() => refetch()}>Could not load pending payments. Retry</button>;
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">Academic session: {session}</p><AutoVerifyPanel payments={data} onRefresh={onRefresh} /></div>;
}