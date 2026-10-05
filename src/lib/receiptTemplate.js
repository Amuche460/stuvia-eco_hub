/**
 * NESA Receipt Template — Edit this file to customize all receipts.
 * Every field here controls how the receipt looks when downloaded/printed.
 */

export const RECEIPT_TEMPLATE = {
  // ── Branding ──────────────────────────────────────────────
  logoUrl: 'https://media.base44.com/images/public/6998637834968a098c6b2721/84f11a8f1_ChatGPTImageSep17202612_24_39PM.png',
  orgName: 'Nigerian Economic Students Association',
  orgSubtitle: 'Covenant University · Since 2005 · "Ceteris Paribus"',

  // ── Colors (hex) ───────────────────────────────────────────
  primaryColor: '#1a6b62',       // teal — headers, amounts, borders
  primaryDark: '#0f4a44',        // darker teal — gradient end
  primaryLight: '#f0fdf4',       // light green — receipt number bg
  primaryBorder: '#bbf7d0',      // green border — receipt number
  accentColor: '#10b981',        // emerald — accents

  // ── Labels ────────────────────────────────────────────────
  duesLabel: 'NESA Dues Payment',
  donationLabel: 'Love Foundation Donation',
  verifiedText: '✓ Payment Verified & Authentic',
  sealText: '🔒 Digitally Verified',
  securityNote: 'This receipt is digitally verified and tamper-evident.',

  // ── Footer ─────────────────────────────────────────────────
  footerLine1: 'Nigerian Economic Students Association · Covenant University',
  footerLine2: 'NESA FinTech Portal · This receipt is computer-generated and authentic',

  // ── Field order (left label → right value) ────────────────
  // Edit labels here. Values come from the payment record.
  // Remove or reorder entries to change what shows on the receipt.
  fields: [
    { key: 'student_name',     label: 'Student Name' },
    { key: 'student_reg_no',   label: 'Reg Number' },
    { key: 'student_matric_no', label: 'Matric Number' },
    { key: 'student_level',    label: 'Level',         format: 'level' },
    { key: 'type',             label: 'Payment Type',  format: 'type' },
    { key: 'verified_by',      label: 'Gateway',       format: 'gateway' },
    { key: 'created_date',     label: 'Date',          format: 'date' },
    { key: 'verified_at',      label: 'Verified At',   format: 'datetime', optional: true },
  ],
};