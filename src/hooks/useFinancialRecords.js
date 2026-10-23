import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sessionPaymentQuery, paymentFilters, allPaymentPages } from '@/lib/sessionRecords';

export default function useFinancialRecords(session, filters = {}, enabled = true) {
  const client = useQueryClient();
  const query = sessionPaymentQuery(session, paymentFilters(filters));
  const scope = filters.studentId ? { student_id: filters.studentId } : {};
  const base = sessionPaymentQuery(session, scope);
  const list = useInfiniteQuery({
    queryKey: ['session-payments', session, filters], enabled,
    initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.Payment.filter(query, { sort: filters.sort || '-created_date', limit: 50, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
  });
  const count = useQuery({ queryKey: ['session-payment-count', query], enabled, queryFn: () => base44.entities.Payment.count(query) });
  const summary = useQuery({
    queryKey: ['session-payment-summary', session, scope], enabled,
    queryFn: async () => {
      const verifiedDues = sessionPaymentQuery(session, { ...scope, status: 'verified', type: 'dues' });
      const [totals, months, paidIds] = await Promise.all([
        base44.entities.Payment.aggregate({ query: base, groupBy: ['status', 'type', 'student_level'], sum: ['amount'] }),
        base44.entities.Payment.aggregate({ query: sessionPaymentQuery(session, { ...scope, status: 'verified', type: 'donation' }), dateBucket: { field: 'created_date', unit: 'month' }, sum: ['amount'] }),
        allPaymentPages(verifiedDues, { distinct: 'student_id' }),
      ]);
      return { rows: totals.rows, months: months.rows, paidIds };
    },
  });
  return {
    payments: list.data?.pages.flatMap(page => page.items) || [],
    total: count.data || 0,
    summary: summary.data || { rows: [], months: [], paidIds: [] },
    loading: enabled && (list.isPending || count.isPending || summary.isPending),
    error: list.error || count.error || summary.error,
    hasMore: list.hasNextPage, loadingMore: list.isFetchingNextPage,
    loadMore: () => list.fetchNextPage(),
    refresh: () => Promise.all(['session-payments', 'session-payment-count', 'session-payment-summary', 'academic-sessions'].map(key => client.invalidateQueries({ queryKey: [key] }))),
  };
}