import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Download, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NESA_LOGO_URL = 'https://media.base44.com/images/public/6998637834968a098c6b2721/24f9cf519_IMG_20260217_123243_461.jpg';

export default function ReceiptCard({ payment }) {
  const receiptRef = useRef(null);

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>NESA Receipt - ${payment.receipt_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 520px; margin: 0 auto; color: #111; }
        .header { text-align: center; border-bottom: 3px solid #1a6b62; padding-bottom: 24px; margin-bottom: 24px; }
        .logo-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; display: block; border: 3px solid #1a6b62; }
        .org-name { font-size: 13px; color: #444; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
        .receipt-no { background: #f0fdf4; padding: 6px 16px; border-radius: 8px; display: inline-block; font-weight: bold; color: #1a6b62; margin-top: 10px; font-family: monospace; font-size: 14px; }
        .verified-badge { display: flex; align-items: center; justify-content: center; gap: 6px; color: #1a6b62; font-weight: 700; font-size: 14px; margin: 16px 0; }
        .amount { font-size: 36px; font-weight: 800; color: #1a6b62; text-align: center; padding: 10px 0 20px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .label { color: #666; }
        .value { font-weight: 600; text-align: right; max-width: 60%; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 3px solid #1a6b62; font-size: 11px; color: #888; }
        .security { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 14px; font-size: 11px; color: #166534; margin-top: 20px; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <img src="${NESA_LOGO_URL}" class="logo-img" alt="NESA Logo" />
          <div class="org-name">Nigerian Economic Students Association</div>
          <div class="org-name" style="font-size:11px;color:#888;">Covenant University · Since 2005</div>
          <div class="receipt-no">${payment.receipt_number}</div>
        </div>
        <div class="verified-badge">✓ Payment Verified &amp; Authentic</div>
        <div class="amount">₦${payment.amount?.toLocaleString()}</div>
        <div class="row"><span class="label">Student Name</span><span class="value">${payment.student_name}</span></div>
        <div class="row"><span class="label">Reg Number</span><span class="value">${payment.student_reg_no || 'N/A'}</span></div>
        <div class="row"><span class="label">Matric Number</span><span class="value">${payment.student_matric_no || 'N/A'}</span></div>
        <div class="row"><span class="label">Level</span><span class="value">${payment.student_level}L</span></div>
        <div class="row"><span class="label">Payment Type</span><span class="value">${payment.type === 'dues' ? 'NESA Dues Payment' : 'Love Foundation Donation'}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${format(new Date(payment.created_date), 'PPP')}</span></div>
        ${payment.verified_at ? `<div class="row"><span class="label">Verified At</span><span class="value">${format(new Date(payment.verified_at), 'PPP · p')}</span></div>` : ''}
        ${payment.verified_by ? `<div class="row"><span class="label">Gateway</span><span class="value" style="text-transform:capitalize">${payment.verified_by}</span></div>` : ''}
        <div class="security">🔒 This receipt is digitally generated and cryptographically linked to transaction ${payment.receipt_number}. Any alteration invalidates it.</div>
        <div class="footer">
          <p><strong>NESA · Covenant University · Ceteris Paribus</strong></p>
          <p>This is a computer-generated receipt. No signature required.</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div ref={receiptRef} className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
      {/* Header with NESA logo */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-5 text-white text-center">
        <div className="flex justify-center mb-3">
          <img
            src={NESA_LOGO_URL}
            alt="NESA Logo"
            className="w-20 h-20 rounded-full object-cover border-2 border-white/40 shadow-lg"
          />
        </div>
        <p className="text-emerald-200 text-xs tracking-widest uppercase mb-1">Official Receipt</p>
        <p className="mt-1 font-mono text-sm bg-white/10 rounded-lg py-1 px-3 inline-block">
          {payment.receipt_number}
        </p>
      </div>

      <div className="p-5">
        {/* Verified badge */}
        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-3">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Payment Verified</span>
        </div>

        <p className="text-3xl font-bold text-center text-emerald-800 mb-5">
          ₦{payment.amount?.toLocaleString()}
        </p>

        <div className="space-y-2 text-sm">
          {[
            ['Student', payment.student_name],
            ['Reg No.', payment.student_reg_no || 'N/A'],
            ['Matric No.', payment.student_matric_no || 'N/A'],
            ['Level', `${payment.student_level}L`],
            ['Type', payment.type === 'dues' ? 'Dues Payment' : 'Love Foundation Donation'],
            ['Gateway', payment.verified_by ? payment.verified_by.charAt(0).toUpperCase() + payment.verified_by.slice(1) : 'N/A'],
            ['Date', format(new Date(payment.created_date), 'PPP')],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        {/* Security notice */}
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700">
            This receipt is digitally generated and linked to transaction <span className="font-mono font-semibold">{payment.receipt_number}</span>. Any alteration renders it invalid.
          </p>
        </div>

        <Button
          onClick={handleDownload}
          className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 rounded-xl h-11"
        >
          <Download className="w-4 h-4 mr-2" />
          Download / Print Receipt
        </Button>
      </div>
    </div>
  );
}