import { base44 } from '@/api/base44Client';

/**
 * Automatically sends dues payment reminders (email + in-app) to students
 * who haven't paid their dues yet.
 * Throttled to once per day via localStorage to avoid spamming.
 * @param {Array} students - All student records
 * @param {Array} payments - All payment records
 * @returns {Promise<{sent: number, total: number, skipped: boolean}>}
 */
export async function sendDuesReminders(students, payments) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const lastSent = localStorage.getItem('nesa_dues_reminder_date');
  if (lastSent === todayKey) {
    return { sent: 0, total: 0, skipped: true };
  }

  const paidStudentIds = new Set(
    payments.filter(p => p.type === 'dues' && p.status === 'verified').map(p => p.student_id)
  );

  const unpaid = students.filter(s => s.email && !paidStudentIds.has(s.id));

  if (unpaid.length === 0) {
    localStorage.setItem('nesa_dues_reminder_date', todayKey);
    return { sent: 0, total: 0, skipped: false };
  }

  let sent = 0;
  for (const student of unpaid) {
    try {
      // Personal in-app notification
      await base44.entities.NesaNotification.create({
        title: '⚠️ Dues Payment Reminder',
        message: `Hi ${student.full_name}, your NESA dues for this session are still outstanding. Please log in to the portal and complete your payment to retain full access to NESA benefits.`,
        type: 'payment',
        student_id: student.id,
        is_read_by: [],
      });

      // Email reminder
      await base44.integrations.Core.SendEmail({
        to: student.email,
        subject: '⏰ NESA Dues Payment Reminder',
        body: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #fffbeb; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #fde68a;">
            <div style="font-size: 40px; margin-bottom: 12px;">⏰</div>
            <h1 style="color: #1a6b62; font-size: 24px; margin-bottom: 8px;">Dues Payment Reminder</h1>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
              Dear <strong>${student.full_name}</strong>,
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              This is a friendly reminder that your <strong>NESA dues</strong> for the current session are yet to be paid.
              Completing your payment ensures you retain full access to NESA benefits, events, and welfare support.
            </p>
            <div style="background: #1a6b62; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #fff; font-size: 16px; font-weight: bold; margin: 0;">
                Log in to the STUVIA portal and tap "Pay Dues" to complete your payment.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Regards,</p>
            <p style="color: #1a6b62; font-weight: bold; font-size: 15px; margin-top: 4px;">NESA Executive Team 💚</p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">Nigerian Economic Students Association — STUVIA eco hub</p>
          </div>
        `,
      });

      sent++;
    } catch (e) {
      // continue with remaining students
    }
  }

  localStorage.setItem('nesa_dues_reminder_date', todayKey);
  return { sent, total: unpaid.length, skipped: false };
}