import { base44 } from '@/api/base44Client';
import { academicSession, reserveDuesReceipt, releaseDuesReceipt } from '@/lib/duesCycle';

export default async function verifyDuesPayment(payment, changes) {
  if (payment.type !== 'dues') return base44.entities.Payment.update(payment.id, changes);
  const page = await base44.entities.Student.filter(payment.student_id ? { id: payment.student_id } : { reg_no: payment.student_reg_no }, { limit: 1 });
  const student = page.items[0];
  const session = payment.academic_session || academicSession(payment.created_date);
  const claim = await reserveDuesReceipt(student, session, payment.id);
  try {
    return await base44.entities.Payment.update(payment.id, { ...changes, student_id: student.id, academic_session: session });
  } catch (e) {
    await releaseDuesReceipt(claim);
    throw e;
  }
}