import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, Loader2 } from 'lucide-react';
import ReceiptCard from '@/components/receipt/ReceiptCard';
import { sendReceiptEmail } from '@/lib/sendReceiptEmail';
import { academicSession, reserveDuesReceipt, releaseDuesReceipt } from '@/lib/duesCycle';

const LEVELS = ['100', '200', '300', '400'];

const BLANK = {
  student_id: '', full_name: '', reg_no: '', matric_no: '',
  level: '', type: 'dues', amount: '', note: '',
};

/**
 * Lets the Financial Secretary / Assistant Financial Secretary record a cash
 * payment by hand and issue the student a receipt on the spot.
 */
export default function CashReceiptPanel({ students = [], exec, onIssued }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState(null);

  const matches = search.trim()
    ? students.filter(s => {
        const q = search.trim().toLowerCase();
        return (s.full_name || '').toLowerCase().includes(q) ||
               (s.reg_no || '').toLowerCase().includes(q) ||
               (s.matric_no || '').toLowerCase().includes(q);
      }).slice(0, 50)
    : [];

  const openForm = () => {
    setForm(BLANK);
    setSearch('');
    setError('');
    setIssued(null);
    setOpen(true);
  };

  const linkStudent = (id) => {
    const s = students.find(x => x.id === id);
    if (!s) return;
    setForm(f => ({
      ...f,
      student_id: s.id,
      full_name: s.full_name || '',
      reg_no: s.reg_no || '',
      matric_no: s.matric_no || '',
      level: s.level || f.level,
    }));
    setSearch('');
  };

  const handleIssue = async () => {
    setError('');
    if (!form.full_name.trim()) return setError('Please enter the student\'s full name.');
    if (!form.level) return setError('Please select the student\'s level.');
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return setError('Please enter the amount received.');

    if (saving) return;
    setSaving(true);
    let claim;
    let recorded = false;
    try {
      const receiptNumber = `NESA-${Date.now().toString().slice(-8)}`;
      let linkedStudent = students.find(s => s.id === form.student_id);
      if (form.type === 'dues') {
        if (!linkedStudent && form.reg_no.trim()) {
          const page = await base44.entities.Student.filter({ reg_no: form.reg_no.trim() }, { limit: 1 });
          linkedStudent = page.items[0];
        }
        claim = await reserveDuesReceipt(linkedStudent);
      }

      const created = await base44.entities.Payment.create({
        student_id: linkedStudent?.id || '',
        student_name: form.full_name.trim(),
        student_level: form.level,
        student_reg_no: linkedStudent?.reg_no || form.reg_no.trim(),
        student_matric_no: form.matric_no.trim(),
        type: form.type,
        academic_session: claim?.session || academicSession(),
        amount,
        payment_method: 'cash',
        status: 'verified',
        receipt_number: receiptNumber,
        verified_at: new Date().toISOString(),
        verified_by: `${exec?.post || 'Financial Secretary'} (Cash)`,
        receipt_data: { description: form.note.trim() || 'Cash payment received', amount },
        validation_errors: [],
      });

      recorded = true;
      if (linkedStudent) {
        // Keep the student's record in step with the payment (non-blocking)
        try {
          if (form.type === 'dues') {
            await base44.entities.Student.update(linkedStudent.id, { dues_paid: true });
          } else {
            await base44.entities.Student.update(linkedStudent.id, {
              total_donated: (linkedStudent.total_donated || 0) + amount,
            });
          }
        } catch (e) { /* non-blocking */ }

        try {
          await base44.entities.NesaNotification.create({
            title: form.type === 'dues' ? 'Dues Payment Received ✅' : 'Donation Received 💛',
            message: `A cash ${form.type === 'dues' ? 'dues payment' : 'donation'} of ₦${amount.toLocaleString()} was recorded for you. Receipt: ${receiptNumber}`,
            type: 'payment',
            student_id: linkedStudent.id,
            is_read_by: [],
          });
        } catch (e) { /* non-blocking */ }

        if (linkedStudent.email) {
          sendReceiptEmail({
            email: linkedStudent.email,
            studentName: linkedStudent.full_name,
            receiptNumber,
            amount,
            paymentType: form.type,
            regNo: linkedStudent.reg_no,
            matricNo: linkedStudent.matric_no,
            level: linkedStudent.level,
          }).catch(() => {});
        }
      }

      setIssued(created);
      onIssued?.(created);
    } catch (e) {
      setError(e.message?.startsWith('Receipt already') || e.message?.startsWith('Select a registered') ? e.message : 'Could not issue the receipt. Please try again.');
    } finally {
      try { if (!recorded) await releaseDuesReceipt(claim); }
      finally { setSaving(false); }
    }
  };

  return (
    <>
      <Button onClick={openForm} className="bg-emerald-700 hover:bg-emerald-800 rounded-xl text-sm">
        <Receipt className="w-4 h-4 mr-1" /> Issue Cash Receipt
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {issued ? 'Receipt Issued' : 'Issue Cash Receipt'}
            </DialogTitle>
          </DialogHeader>

          {issued ? (
            <div className="space-y-4">
              <ReceiptCard payment={issued} />
              <Button onClick={openForm} variant="outline" className="w-full rounded-xl">
                Issue another receipt
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100">
                  {error}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <Label className="text-gray-700 text-xs">Link to a registered student (required for dues)</Label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, reg no or matric no"
                  className="rounded-xl h-10 bg-white"
                />
                {search.trim() && (
                  <div className="max-h-40 overflow-y-auto bg-white rounded-xl border divide-y">
                    {matches.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3">No student matches that search.</p>
                    ) : matches.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => linkStudent(s.id)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50"
                      >
                        <span className="text-sm text-gray-800">{s.full_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{s.reg_no} · {s.level}L</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.student_id && (
                  <p className="text-xs text-emerald-700">Linked — record will be marked paid.</p>
                )}
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Full Name *</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-1 rounded-xl h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-700 text-sm">Reg Number</Label>
                  <Input
                    value={form.reg_no}
                    onChange={(e) => setForm({ ...form, reg_no: e.target.value })}
                    className="mt-1 rounded-xl h-11"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 text-sm">Matric Number</Label>
                  <Input
                    value={form.matric_no}
                    onChange={(e) => setForm({ ...form, matric_no: e.target.value })}
                    className="mt-1 rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-700 text-sm">Level *</Label>
                  <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                    <SelectTrigger className="mt-1 rounded-xl h-11">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(l => <SelectItem key={l} value={l}>{l} Level</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-700 text-sm">Payment Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dues">NESA Dues</SelectItem>
                      <SelectItem value="donation">Donation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Amount Received (₦) *</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 12000"
                  className="mt-1 rounded-xl h-11"
                />
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Note (optional)</Label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Paid at the secretariat"
                  className="mt-1 rounded-xl h-11"
                />
              </div>

              <p className="text-xs text-gray-400">
                Payment method will be recorded as cash. Dues session: {academicSession()} (September–August). One dues receipt per student per session.
              </p>

              <Button
                onClick={handleIssue}
                disabled={saving}
                className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-xl h-12"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" /> Generate Receipt
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}