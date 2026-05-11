import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { sendReceiptEmail } from '../../lib/sendReceiptEmail';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoVerifyPanel({ payments, onRefresh }) {
  const [bankLines, setBankLines] = useState('');
  const [results, setResults] = useState(null);
  const [processing, setProcessing] = useState(false);

  const pendingDues = payments.filter(p => p.type === 'dues' && p.status === 'pending');

  const normalizeStr = (str) => (str || '').toLowerCase().replace(/[\s\/\-_]/g, '');

  const handleAutoMatch = async () => {
    if (!bankLines.trim()) {
      toast.error('Please paste bank transfer records first');
      return;
    }
    setProcessing(true);
    setResults(null);

    const lines = bankLines.split('\n').map(l => l.trim()).filter(Boolean);
    const matched = [];
    const unmatched = [];

    for (const payment of pendingDues) {
      const regNo = normalizeStr(payment.student_reg_no);
      const matricNo = normalizeStr(payment.student_matric_no);

      const matchedLine = lines.find(line => {
        const normalized = normalizeStr(line);
        const hasReg = regNo && normalized.includes(regNo);
        const hasMatric = matricNo && normalized.includes(matricNo);
        // 100L only has reg_no, 200L+ need matric
        if (payment.student_level === '100') return hasReg;
        return hasReg || hasMatric;
      });

      if (matchedLine) {
        matched.push({ payment, matchedLine });
      } else {
        unmatched.push(payment);
      }
    }

    // Auto-verify matched payments
    for (const { payment } of matched) {
      const receiptNumber = payment.receipt_number || `NESA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await base44.entities.Payment.update(payment.id, {
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: 'auto-system',
        receipt_number: receiptNumber,
      });
      await base44.entities.Student.update(payment.student_id, { dues_paid: true });

      // Create notification
      await base44.entities.NesaNotification.create({
        title: 'Dues Payment Verified ✅',
        message: `Your dues payment of ₦${payment.amount?.toLocaleString()} has been verified. Receipt: ${receiptNumber}`,
        type: 'payment',
        is_read_by: [],
      });

      // Send receipt email
      if (payment.student_id) {
        const students = await base44.entities.Student.filter({ id: payment.student_id });
        if (students.length && students[0].email) {
          await sendReceiptEmail({
            email: students[0].email,
            studentName: payment.student_name,
            receiptNumber,
            amount: payment.amount,
            paymentType: 'dues',
            regNo: payment.student_reg_no,
            matricNo: payment.student_matric_no,
            level: payment.student_level,
            gateway: 'auto-system',
            date: new Date().toISOString(),
          });
        }
      }
    }

    setResults({ matched, unmatched });
    setProcessing(false);
    if (matched.length > 0) {
      toast.success(`Auto-verified ${matched.length} payment(s)!`);
      onRefresh();
    } else {
      toast.error('No matches found in bank records');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">How Auto-Verify Works</p>
            <p className="text-blue-700 text-xs mt-1">
              Paste your bank statement lines (one per line). The system will scan each pending dues payment and check if the student's
              registration number (100L) or matric/reg number (200L+) appears in the transfer description. Matched payments are verified instantly with digital receipts issued.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Bank Transfer Records</label>
          <Badge variant="outline" className="text-xs">{pendingDues.length} pending dues</Badge>
        </div>
        <Textarea
          value={bankLines}
          onChange={e => setBankLines(e.target.value)}
          placeholder={"Paste bank transfer lines here (one per line), e.g.:\nECO/2026/001 Dues Payment — ₦5,000 — 10 Mar 2026\n20260001 ECO/2026/002 Dues Payment — ₦5,000\n..."}
          className="min-h-[160px] rounded-xl font-mono text-xs border-gray-200"
        />
      </div>

      <Button
        onClick={handleAutoMatch}
        disabled={processing || pendingDues.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-11"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Matching & Verifying...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Auto-Match & Verify Payments</>
        )}
      </Button>

      {results && (
        <div className="space-y-3">
          {results.matched.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="font-semibold text-emerald-800 text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {results.matched.length} Payment(s) Auto-Verified
              </p>
              <div className="space-y-2">
                {results.matched.map(({ payment, matchedLine }) => (
                  <div key={payment.id} className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="font-medium text-sm text-gray-900">{payment.student_name}</p>
                    <p className="text-xs text-gray-500">{payment.student_reg_no} {payment.student_matric_no ? `• ${payment.student_matric_no}` : ''} • ₦{payment.amount?.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1 font-mono truncate">Matched: "{matchedLine}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.unmatched.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {results.unmatched.length} Unmatched — Needs Manual Review
              </p>
              <div className="space-y-2">
                {results.unmatched.map(payment => (
                  <div key={payment.id} className="bg-white rounded-lg p-3 border border-amber-100">
                    <p className="font-medium text-sm text-gray-900">{payment.student_name}</p>
                    <p className="text-xs text-gray-500">{payment.student_reg_no} {payment.student_matric_no ? `• ${payment.student_matric_no}` : ''} • ₦{payment.amount?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}