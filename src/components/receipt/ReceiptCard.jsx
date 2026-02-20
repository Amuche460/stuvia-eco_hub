import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Download, CheckCircle, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReceiptCard({ payment }) {
  const receiptRef = useRef(null);

  const handleDownload = () => {
    const el = receiptRef.current;
    if (!el) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>NESA Receipt - ${payment.receipt_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #059669; }
        .subtitle { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px; }
        .receipt-no { background: #f0fdf4; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: bold; color: #059669; margin-top: 10px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: 600; font-size: 14px; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; text-align: center; padding: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #059669; font-size: 12px; color: #888; }
        .verified { display: flex; align-items: center; justify-content: center; gap: 6px; color: #059669; font-weight: 600; margin-bottom: 10px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <div class="logo">NESA</div>
          <div class="subtitle">Nigerian Economic Students Association</div>
          <div class="receipt-no">${payment.receipt_number}</div>
        </div>
        <div class="verified">✓ Payment Verified</div>
        <div class="amount">₦${payment.amount?.toLocaleString()}</div>
        <div class="row"><span class="label">Student Name</span><span class="value">${payment.student_name}</span></div>
        <div class="row"><span class="label">Reg Number</span><span class="value">${payment.student_reg_no || 'N/A'}</span></div>
        <div class="row"><span class="label">Matric Number</span><span class="value">${payment.student_matric_no || 'N/A'}</span></div>
        <div class="row"><span class="label">Level</span><span class="value">${payment.student_level}L</span></div>
        <div class="row"><span class="label">Payment Type</span><span class="value">${payment.type === 'dues' ? 'Dues Payment' : 'Donation - Love Foundation'}</span></div>
        <div class="row"><span class="label">Payment Method</span><span class="value">Bank Transfer</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${format(new Date(payment.created_date), 'PPP')}</span></div>
        ${payment.verified_at ? `<div class="row"><span class="label">Verified</span><span class="value">${format(new Date(payment.verified_at), 'PPP')}</span></div>` : ''}
        <div class="footer">
          <p>Nigerian Economic Students Association • Covenant MFB</p>
          <p>This is a computer-generated receipt</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div ref={receiptRef} className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-5 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Landmark className="w-5 h-5 text-amber-400" />
          <span className="text-xl font-bold">NESA</span>
        </div>
        <p className="text-emerald-200 text-xs tracking-widest uppercase">Official Receipt</p>
        <p className="mt-2 font-mono text-sm bg-white/10 rounded-lg py-1 px-3 inline-block">
          {payment.receipt_number}
        </p>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-4">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Payment Verified</span>
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
            ['Date', format(new Date(payment.created_date), 'PPP')],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleDownload}
          className="w-full mt-5 bg-emerald-700 hover:bg-emerald-800 rounded-xl h-11"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Receipt
        </Button>
      </div>
    </div>
  );
}