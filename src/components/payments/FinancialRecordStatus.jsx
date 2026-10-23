import React from 'react';
import { Button } from '@/components/ui/button';

export default function FinancialRecordStatus({ records }) {
  return <div className="space-y-2" aria-live="polite">
    {records.loading && <p className="text-sm text-muted-foreground">Loading session records...</p>}
    {records.error && <p role="alert" className="text-sm text-destructive">Financial records could not be loaded. <button className="underline" onClick={records.refresh}>Retry</button></p>}
    {!records.loading && !records.error && <p className="text-xs text-muted-foreground">Showing {records.payments.length} of {records.total} records</p>}
    {records.hasMore && <Button variant="outline" disabled={records.loadingMore} onClick={records.loadMore}>{records.loadingMore ? 'Loading...' : 'Load more records'}</Button>}
  </div>;
}