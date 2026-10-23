import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Download, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RECEIPT_TEMPLATE as T } from '@/lib/receiptTemplate';
import { academicSession } from '@/lib/duesCycle';

export default function ReceiptCard({ payment }) {
  const receiptRef = useRef(null);

  const formatFieldValue = (field) => {
    const value = payment[field.key];
    if (field.optional && !value) return null;
    switch (field.format) {
      case 'session': return value || academicSession(payment.created_date);
      case 'level': return `${value}L`;
      case 'type': return value === 'dues' ? T.duesLabel : T.donationLabel;
      case 'date': return format(new Date(value), 'PPP');
      case 'datetime': return format(new Date(value), 'PPP • p');
      default: return value || 'N/A';
    }
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    const rows = T.fields.map(f => {
      const val = formatFieldValue(f);
      if (val === null) return '';
      return `<div class="row"><span class="label">${f.label}</span><span class="value">${val}</span></div>`;
    }).join('');

    printWindow.document.write(`
      <html><head><title>NESA Receipt - ${payment.receipt_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 520px; margin: 0 auto; background: #fff; }
        .header { text-align: center; border-bottom: 3px solid ${T.primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
        .logo-img { width: 90px; height: 90px; object-fit: contain; margin-bottom: 8px; }
        .org-name { font-size: 13px; font-weight: 700; color: ${T.primaryColor}; letter-spacing: 1px; text-transform: uppercase; }
        .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
        .receipt-no { background: ${T.primaryLight}; padding: 7px 18px; border-radius: 8px; display: inline-block; font-weight: bold; color: ${T.primaryColor}; margin-top: 10px; font-family: monospace; font-size: 14px; border: 1px solid ${T.primaryBorder}; }
        .verified { display: flex; align-items: center; justify-content: center; gap: 6px; color: ${T.primaryColor}; font-weight: 700; margin: 14px 0 4px; font-size: 14px; }
        .amount { font-size: 32px; font-weight: bold; color: ${T.primaryColor}; text-align: center; padding: 10px 0 18px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .label { color: #888; font-size: 13px; }
        .value { font-weight: 600; font-size: 13px; color: #111; }
        .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 3px solid ${T.primaryColor}; font-size: 11px; color: #999; line-height: 1.8; }
        .seal { display: inline-block; background: ${T.primaryColor}; color: #fff; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <img src="${T.logoUrl}" class="logo-img" alt="NESA Logo" />
          <div class="org-name">${T.orgName}</div>
          <div class="subtitle">${T.orgSubtitle}</div>
          <div class="receipt-no">${payment.receipt_number}</div>
        </div>
        <div class="verified">${T.verifiedText}</div>
        <div class="amount">₦${payment.amount?.toLocaleString()}</div>
        ${rows}
        <div class="footer">
          <div class="seal">${T.sealText}</div><br/>
          ${T.footerLine1}<br/>
          ${T.footerLine2}
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
          <img src={T.logoUrl} alt="NESA Logo" className="w-16 h-16 object-contain" />
        </div>
        <p className="text-emerald-200 text-[10px] tracking-widest uppercase font-semibold">{T.orgName}</p>
        <p className="text-emerald-300 text-[9px] mt-0.5">{T.orgSubtitle}</p>
        <p className="mt-2 font-mono text-sm bg-white/10 rounded-lg py-1 px-3 inline-block border border-white/20 select-text">
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
          {T.fields.map(f => {
            const val = formatFieldValue(f);
            if (val === null) return null;
            return (
              <div key={f.key} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{f.label}</span>
                <span className="font-medium text-gray-800 select-text">{val}</span>
              </div>
            );
          })}
        </div>

        {/* Security note */}
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <p className="text-[10px] text-emerald-700">{T.securityNote}</p>
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