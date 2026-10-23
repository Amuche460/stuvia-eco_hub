import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useDashboardStudents(level, search, enabled) {
  const client = useQueryClient();
  const query = {};
  if (level && level !== 'all') query.level = level;
  if (search) {
    const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['full_name', 'reg_no', 'matric_no', 'email', 'course_of_study'].map(field => ({ [field]: { $regex: `(?i)${pattern}` } }));
  }
  const list = useInfiniteQuery({
    queryKey: ['dashboard-students', 'list', query], enabled,
    initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.Student.filter(query, { sort: 'full_name', limit: 50, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
  });
  const count = useQuery({ queryKey: ['dashboard-students', 'count', query], enabled, queryFn: () => base44.entities.Student.count(query) });
  return {
    students: list.data?.pages.flatMap(page => page.items) || [],
    total: count.data || 0,
    loading: enabled && (list.isPending || count.isPending),
    error: list.error || count.error,
    hasMore: list.hasNextPage,
    loadingMore: list.isFetchingNextPage,
    loadMore: () => list.fetchNextPage(),
    refresh: () => client.invalidateQueries({ queryKey: ['dashboard-students'] }),
  };
}