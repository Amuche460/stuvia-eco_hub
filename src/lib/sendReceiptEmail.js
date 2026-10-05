import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const NESA_LOGO = 'https://media.base44.com/images/public/6998637834968a098c6b2721/84f11a8f1_ChatGPTImageSep17202612_24_39PM.png';

/**
 * Sends a beautiful HTML receipt email to the student.
 * @param {object} opts
 * @param {string} opts.email - Student email address
 * @param {string} opts.studentName
 * @param {string} opts.receiptNumber
 * @param {number} opts.amount
 * @param {string} opts.paymentType - 'dues' | 'donation'
 * @param {string} opts.regNo
 * @param {string} opts.matricNo
 * @param {string} opts.level
 * @param {string} [opts.gateway]
 * @param {string} [opts.date] - ISO date string, defaults to now
 */
export async function sendReceiptEmail({
  email,
  studentName,
  receiptNumber,
  amount,
  paymentType,
  regNo,
  matricNo,
  level,
  gateway,
  date,
}) {
  if (!email) return;

  const dateStr = format(new Date(date || new Date()), 'MMMM d, yyyy • h:mm a');
  const typeLabel = paymentType === 'dues' ? 'NESA Dues Payment' : 'Love Foundation Donation';
  const subject = paymentType === 'dues'
    ? `✅ NESA Dues Payment Receipt — ${receiptNumber}`
    : `💛 NESA Love Foundation Donation Receipt — ${receiptNumber}`;

  const accentColor = paymentType === 'dues' ? '#1a6b62' : '#e11d48';
  const accentLight = paymentType === 'dues' ? '#f0fdf4' : '#fff1f2';
  const greeting = paymentType === 'dues'
    ? 'Your NESA dues payment has been confirmed and verified.'
    : 'Thank you for your generous donation to the NESA Love Foundation! Your kindness makes a difference.';

  const rows = [
    ['Receipt No.', receiptNumber],
    ['Student Name', studentName],
    ['Reg Number', regNo || '—'],
    matricNo ? ['Matric Number', matricNo] : null,
    ['Level', level ? `${level}L` : '—'],
    ['Payment Type', typeLabel],
    ['Amount', `₦${Number(amount).toLocaleString()}`],
    ['Date', dateStr],
    gateway ? ['Gateway', gateway === 'paystack' ? 'Paystack' : gateway === 'flutterwave' ? 'Flutterwave' : 'Admin Verified'] : null,
    ['Status', 'VERIFIED ✅'],
  ].filter(Boolean);

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 16px;color:#666;font-size:13px;border-bottom:1px solid #f0f0f0;white-space:nowrap;">${label}</td>
      <td style="padding:10px 16px;color:#111;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f0;">${value}</td>
    </tr>
  `).join('');

  const body = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="background:${accentColor};padding:28px 24px;">
            <img src="${NESA_LOGO}" width="72" height="72" style="border-radius:50%;border:3px solid rgba(255,255,255,0.4);object-fit:cover;display:block;margin:0 auto 12px;" alt="NESA Logo" />
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Nigerian Economic Students Association</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:11px;">Covenant University · "Ceteris Paribus"</p>
          </td>
        </tr>

        <!-- Receipt number badge -->
        <tr>
          <td align="center" style="background:${accentLight};padding:14px 24px;border-bottom:1px solid #e8f5f0;">
            <span style="font-family:monospace;font-size:15px;font-weight:bold;color:${accentColor};">${receiptNumber}</span>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:24px 24px 8px;">
            <p style="margin:0;font-size:15px;color:#111;font-weight:700;">Dear ${studentName},</p>
            <p style="margin:8px 0 0;font-size:14px;color:#555;line-height:1.6;">${greeting}</p>
          </td>
        </tr>

        <!-- Amount -->
        <tr>
          <td align="center" style="padding:16px 24px;">
            <div style="background:${accentLight};border-radius:12px;padding:16px 24px;display:inline-block;">
              <p style="margin:0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount Paid</p>
              <p style="margin:4px 0 0;font-size:32px;font-weight:800;color:${accentColor};">₦${Number(amount).toLocaleString()}</p>
            </div>
          </td>
        </tr>

        <!-- Details table -->
        <tr>
          <td style="padding:0 24px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;">
              ${rowsHtml}
            </table>
          </td>
        </tr>

        <!-- Security note -->
        <tr>
          <td style="padding:0 24px 24px;">
            <div style="background:#f8faff;border:1px solid #e0e8ff;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:8px;">
              <p style="margin:0;font-size:12px;color:#555;line-height:1.5;">🔒 <strong>Digitally Verified</strong> — This receipt is computer-generated and authentic. Keep it for your records.</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:${accentColor};padding:18px 24px;">
            <p style="margin:0;color:rgba(255,255,255,0.75);font-size:11px;">Nigerian Economic Students Association · Covenant University</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.55);font-size:10px;">NESA FinTech Portal · nesa.cu.edu.ng</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  await base44.integrations.Core.SendEmail({ to: email, subject, body });
}