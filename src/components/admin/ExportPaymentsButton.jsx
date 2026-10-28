import React, { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { sessionPaymentQuery, paymentFilters, allPaymentPages } from '@/lib/sessionRecords';

export default function ExportPaymentsButton({ session, filters = {} }) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportPayments = await allPaymentPages(
        sessionPaymentQuery(session, paymentFilters(filters)),
        { sort: 'student_name' }
      );
      const headers = [
        'Student Name',
        'Reg No',
        'Matric No',
        'Level',
        'Type',
        'Amount (NGN)',
        'Payment Method',
        'Status',
        'Receipt No',
        'Verified By',
        'Verified Date',
        'Academic Session',
        'Payment Date',
        'Receipt URL',
      ];
      const rows = exportPayments.map(p => [
        p.student_name || '',
        p.student_reg_no || '',
        p.student_matric_no || '',
        p.student_level ? `${p.student_level}L` : '',
        p.type === 'dues' ? 'Dues' : p.type === 'donation' ? 'Donation' : p.type || '',
        p.amount ?? 0,
        p.payment_method || '',
        p.status || '',
        p.receipt_number || '',
        p.verified_by || '',
        p.verified_at ? new Date(p.verified_at).toISOString().split('T')[0] : '',
        p.academic_session || session,
        p.created_date ? new Date(p.created_date).toISOString().split('T')[0] : '',
        p.proof_url || '',
      ]);
      const csv = '\uFEFF' + [headers, ...rows]
        .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NESA_Payments_${session.replace('/', '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: `Exported ${exportPayments.length} record(s) for ${session}`,
        description: 'Ready to import or open directly in Google Sheets.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 text-sm font-medium"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      {exporting ? 'Exporting...' : `Export ${session} to Google Sheets (.csv)`}
    </Button>
  );
}