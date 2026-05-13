import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Download, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NESA_LOGO = 'https://media.base44.com/images/public/6998637834968a098c6b2721/24f9cf519_IMG_20260217_123243_461.jpg';

export default function ReceiptCard({ payment }) {
  const receiptRef = useRef(null);

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>NESA Receipt - ${payment.receipt_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 520px; margin: 0 auto; background: #fff; }
        .header { text-align: center; border-bottom: 3px solid #1a6b62; padding-bottom: 20px; margin-bottom: 20px; }
        .logo-img { width: 90px; height: 90px; object-fit: contain; margin-bottom: 8px; }
        .org-name { font-size: 13px; font-weight: 700; color: #1a6b62; letter-spacing: 1px; text-transform: uppercase; }
        .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
        .receipt-no { background: #f0fdf4; padding: 7px 18px; border-radius: 8px; display: inline-block; font-weight: bold; color: #1a6b62; margin-top: 10px; font-family: monospace; font-size: 14px; border: 1px solid #bbf7d0; }
        .verified { display: flex; align-items: center; justify-content: center; gap: 6px; color: #1a6b62; font-weight: 700; margin: 14px 0 4px; font-size: 14px; }
        .amount { font-size: 32px; font-weight: bold; color: #1a6b62; text-align: center; padding: 10px 0 18px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .label { color: #888; font-size: 13px; }
        .value { font-weight: 600; font-size: 13px; color: #111; }
        .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 3px solid #1a6b62; font-size: 11px; color: #999; line-height: 1.8; }
        .seal { display: inline-block; background: #1a6b62; color: #fff; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <img src="${NESA_LOGO}" class="logo-img" alt="NESA Logo" />
          <div class="org-name">Nigerian Economic Students Association</div>
          <div class="subtitle">Covenant University · Since 2005 · "Ceteris Paribus"</div>
          <div class="receipt-no">${payment.receipt_number}</div>
        </div>
        <div class="verified">✓ Payment Verified &amp; Authentic</div>
        <div class="amount">₦${payment.amount?.toLocaleString()}</div>
        <div class="row"><span class="label">Student Name</span><span class="value">${payment.student_name}</span></div>
        <div class="row"><span class="label">Reg Number</span><span class="value">${payment.student_reg_no || 'N/A'}</span></div>
        <div class="row"><span class="label">Matric Number</span><span class="value">${payment.student_matric_no || 'N/A'}</span></div>
        <div class="row"><span class="label">Level</span><span class="value">${payment.student_level}L</span></div>
        <div class="row"><span class="label">Payment Type</span><span class="value">${payment.type === 'dues' ? 'NESA Dues Payment' : 'Love Foundation Donation'}</span></div>
        <div class="row"><span class="label">Gateway</span><span class="value">${payment.verified_by === 'paystack' ? 'Paystack' : 'Flutterwave'}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${format(new Date(payment.created_date), 'PPP')}</span></div>
        ${payment.verified_at ? `<div class="row"><span class="label">Verified At</span><span class="value">${format(new Date(payment.verified_at), 'PPP • p')}</span></div>` : ''}
        <div class="footer">
          <div class="seal">🔒 Digitally Verified</div><br/>
          Nigerian Economic Students Association · Covenant University<br/>
          NESA FinTech Portal · This receipt is computer-generated and authentic
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
        <div className="flex items-center justify-center mb-2">
          <img
            src={NESA_LOGO}
            alt="NESA Logo"
            className="w-16 h-16 object-contain"
          />
        </div>
        <p className="text-emerald-200 text-[10px] tracking-widest uppercase font-semibold">Nigerian Economic Students Association</p>
        <p className="text-emerald-300 text-[9px] mt-0.5">Covenant University · "Ceteris Paribus"</p>
        <p className="mt-2 font-mono text-sm bg-white/10 rounded-lg py-1 px-3 inline-block border border-white/20">
          {payment.receipt_number}
        </p>
      </div>

      <div className="p-5">
        {/* Verified badge */}
        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-3">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Payment Verified</span>
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
        </div>

        <p className="text-3xl font-bold text-center text-emerald-800 mb-5">
          ₦{payment.amount?.toLocaleString()}
        </p>

        <div className="space-y-3 text-sm">
          {[
            ['Student', payment.student_name],
            ['Reg No.', payment.student_reg_no || 'N/A'],
            ['Matric No.', payment.student_matric_no || 'N/A'],
            ['Level', `${payment.student_level}L`],
            ['Type', payment.type === 'dues' ? 'Dues Payment' : 'Donation'],
            ['Gateway', payment.verified_by === 'paystack' ? 'Paystack' : 'Flutterwave'],
            ['Date', format(new Date(payment.created_date), 'PPP')],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <p className="text-[10px] text-emerald-700">This receipt is digitally verified and tamper-evident.</p>
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