import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { sendReceiptEmail } from '../../lib/sendReceiptEmail';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import verifyDuesPayment from '@/lib/verifyDuesPayment';
import {
  CheckCircle, XCircle, Clock, Eye, Search, ExternalLink, ImageIcon
} from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function PaymentTable({ payments, onRefresh }) {
  const [search, setSearch] = useState('');
  const [viewProof, setViewProof] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);
  const [verificationError, setVerificationError] = useState('');

  const filtered = payments.filter(p =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.student_reg_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.student_matric_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.receipt_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = async (payment) => {
    setProcessing(payment.id);
    const receiptNumber = payment.receipt_number || `NESA-ADMIN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setVerificationError('');
    try {
      await verifyDuesPayment(payment, {
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: 'admin',
        receipt_number: receiptNumber,
      });
    } catch (e) {
      setVerificationError(e.message || 'Could not verify the payment.');
      setProcessing(null);
      return;
    }

    if (payment.type === 'dues') {
      await base44.entities.Student.update(payment.student_id, { dues_paid: true });
    } else if (payment.student_id) {
      const students = await base44.entities.Student.filter({ id: payment.student_id });
      if (students.length) {
        await base44.entities.Student.update(payment.student_id, {
          total_donated: (students[0].total_donated || 0) + (payment.amount || 0),
        });
      }
    }

    // Send verification notification — personal to the student
    await base44.entities.NesaNotification.create({
      title: `Payment Verified ✅`,
      message: `Your ${payment.type === 'dues' ? 'dues' : 'donation'} payment of ₦${payment.amount?.toLocaleString()} has been verified.`,
      type: 'payment',
      student_id: payment.student_id,
      is_read_by: [],
    });

    // Fetch student email and send receipt email
    if (payment.student_id) {
      const students = await base44.entities.Student.filter({ id: payment.student_id });
      if (students.length && students[0].email) {
        await sendReceiptEmail({
          email: students[0].email,
          studentName: payment.student_name,
          receiptNumber,
          amount: payment.amount,
          paymentType: payment.type,
          regNo: payment.student_reg_no,
          matricNo: payment.student_matric_no,
          level: payment.student_level,
          gateway: 'admin',
          date: new Date().toISOString(),
        });
      }
    }

    setProcessing(null);
    onRefresh();
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setProcessing(rejectDialog.id);
    await base44.entities.Payment.update(rejectDialog.id, {
      status: 'rejected',
      rejection_reason: rejectReason,
    });
    setProcessing(null);
    setRejectDialog(null);
    setRejectReason('');
    onRefresh();
  };

  return (
    <div>
      {verificationError && <p role="alert" className="text-destructive text-sm mb-3">{verificationError}</p>}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reg no, matric no, or receipt..."
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Level</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow key={p.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{p.student_name}</p>
                        <p className="text-xs text-gray-400">{p.student_reg_no}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.student_level}L</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={p.type === 'dues' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}>
                        {p.type === 'dues' ? 'Dues' : 'Donation'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">₦{p.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`border ${statusColors[p.status]}`}>
                        {p.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {p.status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {p.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(p.created_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.proof_url && (
                          <Button size="sm" variant="ghost" onClick={() => setViewProof(p.proof_url)} title="View proof">
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                        {p.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerify(p)}
                              disabled={processing === p.id}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRejectDialog(p)}
                              disabled={processing === p.id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Proof Viewer */}
      <Dialog open={!!viewProof} onOpenChange={() => setViewProof(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Proof of Payment</DialogTitle>
          </DialogHeader>
          {viewProof && (
            <div className="space-y-3">
              <img src={viewProof} alt="Proof" className="w-full rounded-xl border" />
              <a href={viewProof} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
                <ExternalLink className="w-3 h-3" /> Open in new tab
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Rejecting payment from <strong>{rejectDialog?.student_name}</strong> for ₦{rejectDialog?.amount?.toLocaleString()}
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}