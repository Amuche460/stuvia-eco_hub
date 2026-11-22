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

// A reservation only lives for the few seconds between claiming and saving the receipt.
// Anything older with no receipt behind it was abandoned (dropped network, closed app).
const CLAIM_TTL_MS = 2 * 60 * 1000;

async function clearAbandonedClaim(studentId, session) {
  const cutoff = new Date(Date.now() - CLAIM_TTL_MS).toISOString();
  await base44.entities.Student.updateMany(
    { id: studentId, dues_receipt_sessions: { $in: [session] }, $or: [
      { dues_claim_at: { $exists: false } }, { dues_claim_at: null }, { dues_claim_at: '' }, { dues_claim_at: { $lt: cutoff } },
    ] },
    { $pull: { dues_receipt_sessions: session } },
  );
}

export async function reserveDuesReceipt(student, session = academicSession(), excludeId) {
  if (!student?.id) throw new Error('Select a registered student before issuing dues.');
  if (await findDuesReceipt(student, session, excludeId)) throw new Error(duplicateDuesMessage(session));
  // No receipt exists, so any old reservation left behind is abandoned and must not block payment.
  await clearAbandonedClaim(student.id, session);
  // A conditional update of one existing student is atomic across both finance users.
  const claim = await base44.entities.Student.updateMany(
    { id: student.id, dues_receipt_sessions: { $nin: [session] } },
    { $addToSet: { dues_receipt_sessions: session }, $set: { dues_claim_at: new Date().toISOString() } },
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