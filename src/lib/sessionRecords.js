import { base44 } from '@/api/base44Client';
import { academicSession } from '@/lib/duesCycle';

export function sessionPaymentQuery(session, extra = {}) {
  const start = Number(session.split('/')[0]);
  return { $and: [extra, { $or: [
    { academic_session: session },
    { $and: [
      { $or: [{ academic_session: { $exists: false } }, { academic_session: '' }, { academic_session: null }] },
      { created_date: { $gte: `${start}-08-31T23:00:00Z`, $lt: `${start + 1}-08-31T23:00:00Z` } },
    ] },
  ] }] };
}

export function paymentFilters({ status, type, level, search, studentId } = {}) {
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (type && type !== 'all') query.type = type;
  if (level && level !== 'all') query.student_level = level;
  if (studentId) query.student_id = studentId;
  if (search?.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['student_name', 'student_reg_no', 'student_matric_no', 'receipt_number'].map(field => ({ [field]: { $regex: `(?i)${pattern}` } }));
  }
  return query;
}

export async function allPaymentPages(query, options = {}) {
  const items = [];
  let cursor;
  do {
    const page = await base44.entities.Payment.filter(query, { limit: 1000, ...options, ...(cursor ? { cursor } : {}) });
    items.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return items;
}

export async function availableSessions() {
  const [values, dates] = await Promise.all([
    allPaymentPages({}, { distinct: 'academic_session' }),
    base44.entities.Payment.aggregate({ min: ['created_date'] }),
  ]);
  const current = Number(academicSession().split('/')[0]);
  const earliest = dates.rows[0]?.min_created_date;
  const first = earliest ? Number(academicSession(earliest).split('/')[0]) : current;
  const sessions = new Set([academicSession(), ...values.filter(value => /^\d{4}\/\d{4}$/.test(value || ''))]);
  for (let year = first; year <= current; year++) sessions.add(`${year}/${year + 1}`);
  return [...sessions].sort().reverse();
}