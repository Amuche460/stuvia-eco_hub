import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

// Days-before-term-end thresholds at which reminders are sent
const REMINDER_THRESHOLDS = [30, 14, 7, 1];

/**
 * Scans all active executives and sends tenure-end reminder emails
 * to those approaching their term end date.
 *
 * Runs when any executive opens the dashboard so reminders fire even
 * if a specific executive hasn't logged in recently.
 *
 * Each (execId, threshold) pair is tracked in localStorage to avoid
 * duplicate sends. When a new threshold is crossed, a fresh email fires.
 */
export async function checkAllExecutiveTenures() {
  try {
    const executives = await base44.entities.Executive.filter({ is_active: true });
    const now = new Date();
    const sent = [];

    for (const exec of executives) {
      if (!exec.term_end_date || !exec.email) continue;

      const termEnd = new Date(exec.term_end_date);
      const daysLeft = Math.ceil((termEnd - now) / (1000 * 60 * 60 * 24));

      // Term already expired — skip (expiry deletion handled elsewhere)
      if (daysLeft <= 0) continue;

      for (const threshold of REMINDER_THRESHOLDS) {
        if (daysLeft > threshold) continue;

        const key = `nesa_term_reminder_${exec.id}_${threshold}`;
        if (localStorage.getItem(key)) continue;

        await base44.integrations.Core.SendEmail({
          to: exec.email,
          subject: `NESA Tenure Reminder: ${daysLeft} Day(s) Left as ${exec.post}`,
          body: `Hello ${exec.full_name},

This is an automated reminder from the NESA Portal.

Your tenure as ${exec.post} ends on ${format(termEnd, 'MMMM d, yyyy')} — only ${daysLeft} day(s) remaining.

To ensure a smooth handover, please:
  • Finalize all pending tasks and reports
  • Prepare handover documents for your successor
  • Transfer access to shared accounts and resources
  • Brief the incoming executive on ongoing projects

Thank you for your dedicated service to NESA.

— NESA Leadership`,
        });

        localStorage.setItem(key, '1');
        sent.push(`${exec.full_name} (${threshold}d)`);
      }
    }

    return sent;
  } catch (e) {
    console.error('Tenure notification error:', e);
    return [];
  }
}