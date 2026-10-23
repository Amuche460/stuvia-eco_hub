import { base44 } from '@/api/base44Client';

export function academicSession(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Lagos', year: 'numeric', month: 'numeric' }).formatToParts(new Date(date));
  const year = Number(parts.find(p => p.type === 'year').value);
  const start = Number(parts.find(p => p.type === 'month').value) >= 9 ? year : year - 1;
  return `${start}/${start + 1}`;
}

export const duplicateDuesMessage = (session = academicSession()) => `Receipt already issued or being processed for the ${session} academic session.`;

export async function findDuesReceipt(student, session = academicSession(), excludeId) {
  const start = Number(session.split('/')[0]);
  const identities = [];
  if (student.id) identities.push({ student_id: student.id });
  if (student.reg_no?.trim()) identities.push({ student_reg_no: student.reg_no.trim() });
  if (!identities.length) throw new Error('Select a registered student before issuing dues.');
  const query = { $and: [
    { type: 'dues', status: { $in: ['pending', 'verified'] } },
    { $or: identities },
    { $or: [ { academic_session: session }, { $and: [
      { $or: [{ academic_session: { $exists: false } }, { academic_session: '' }, { academic_session: null }] },
      { created_date: { $gte: `${start}-08-31T23:00:00Z`, $lt: `${start + 1}-08-31T23:00:00Z` } },
    ] } ] },
  ] };
  if (excludeId) query.$and.push({ id: { $ne: excludeId } });
  const page = await base44.entities.Payment.filter(query, { limit: 1 });
  return page.items[0] || null;
}

export async function reserveDuesReceipt(student, session = academicSession(), excludeId) {
  if (!student?.id) throw new Error('Select a registered student before issuing dues.');
  if (await findDuesReceipt(student, session, excludeId)) throw new Error(duplicateDuesMessage(session));
  // A conditional update of one existing student is atomic across both finance users.
  const claim = await base44.entities.Student.updateMany(
    { id: student.id, dues_receipt_sessions: { $nin: [session] } },
    { $addToSet: { dues_receipt_sessions: session } },
  );
  if (claim.updated !== 1) throw new Error(duplicateDuesMessage(session));
  return { studentId: student.id, session };
}

export async function releaseDuesReceipt(claim) {
  if (claim) await base44.entities.Student.updateMany(
    { id: claim.studentId, dues_receipt_sessions: { $in: [claim.session] } },
    { $pull: { dues_receipt_sessions: claim.session } },
  );
}