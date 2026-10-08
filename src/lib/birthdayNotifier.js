import { base44 } from '@/api/base44Client';

const BIRTHDAY_EMAIL_HTML = (firstName) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #f0fdf4, #fffbeb); border-radius: 20px; padding: 40px; text-align: center;">
    <div style="font-size: 56px; margin-bottom: 16px;">🎂🎉</div>
    <h1 style="color: #1a6b62; font-size: 28px; margin-bottom: 12px;">Happy Birthday, ${firstName}! 🎉</h1>
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
      On behalf of the entire <strong>Nigerian Economic Students Association (NESA)</strong> family,
      we wish you a wonderful birthday filled with joy, success, and great memories. 🎁
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
      May this new year bring you academic excellence, personal growth, and abundant blessings.
      You are a valued member of our community, and we're celebrating you today! 💚
    </p>
    <div style="background: #1a6b62; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #fff; font-size: 18px; font-weight: bold; margin: 0;">
        Enjoy your special day! 🎈
      </p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Warm regards,</p>
    <p style="color: #1a6b62; font-weight: bold; font-size: 16px; margin-top: 4px;">NESA Executive Team 💚</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Nigerian Economic Students Association — STUVIA eco hub · Covenant University</p>
  </div>
`;

function isBirthdayToday(dateOfBirth) {
  if (!dateOfBirth) return false;
  const parts = String(dateOfBirth).split('-');
  if (parts.length < 3) return false;
  const today = new Date();
  const todayMonthDay =
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  return parts[1] + '-' + parts[2] === todayMonthDay;
}

function birthdayKey(studentId) {
  return `nesa_birthday_${studentId}_${new Date().getFullYear()}`;
}

async function sendBirthdayEmail(student) {
  const firstName = (student.full_name || 'there').split(' ')[0];
  await base44.integrations.Core.SendEmail({
    to: student.email,
    subject: '🎂 Happy Birthday from NESA!',
    html: BIRTHDAY_EMAIL_HTML(firstName),
  });
  localStorage.setItem(birthdayKey(student.id), '1');
}

/**
 * Checks a single student's birthday and sends a customized email if today
 * is their birthday.  Throttled per student per year so logging in multiple
 * times on the same birthday never produces duplicates.
 *
 * @param {Object} student
 * @returns {Promise<boolean>} Whether an email was sent
 */
export async function checkStudentBirthday(student) {
  if (!student || !student.date_of_birth || !student.email) return false;
  if (localStorage.getItem(birthdayKey(student.id))) return false;
  if (!isBirthdayToday(student.date_of_birth)) return false;
  try {
    await sendBirthdayEmail(student);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Checks all students' birthdays and sends emails to those whose birthday
 * falls on today.  Intended to run when an executive opens the dashboard.
 *
 * Uses a per-student-per-year key (shared with `checkStudentBirthday`) so
 * the two entry points never duplicate each other, plus a daily batch
 * guard so the scan only runs once per day per browser.
 *
 * @param {Array} students
 * @returns {Promise<{ sent: number, skipped: boolean }>}
 */
export async function checkAllBirthdays(students) {
  if (!students || students.length === 0) return { sent: 0, skipped: false };

  const todayKey = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('nesa_birthday_batch_date') === todayKey) {
    return { sent: 0, skipped: true };
  }

  const eligible = students.filter(
    (s) =>
      s &&
      s.date_of_birth &&
      s.email &&
      isBirthdayToday(s.date_of_birth) &&
      !localStorage.getItem(birthdayKey(s.id))
  );

  let sent = 0;
  for (const student of eligible) {
    try {
      await sendBirthdayEmail(student);
      sent++;
    } catch (e) {
      // continue with remaining students
    }
  }

  localStorage.setItem('nesa_birthday_batch_date', todayKey);
  return { sent, skipped: false };
}