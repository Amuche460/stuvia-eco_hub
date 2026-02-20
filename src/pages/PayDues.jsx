import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Loader2, CheckCircle, Copy, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PayDues() {
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }

    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) setStudent(s[0]);
    });
  }, []);

  const copyAccount = () => {
    navigator.clipboard.writeText('0520003964');
    toast.success('Account number copied!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let proofUrl = '';
    if (proofFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
      proofUrl = file_url;
    }

    const receiptNumber = `NESA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await base44.entities.Payment.create({
      student_id: student.id,
      student_name: student.full_name,
      student_level: student.level,
      student_reg_no: student.reg_no,
      student_matric_no: student.matric_no || '',
      type: 'dues',
      amount: parseFloat(amount),
      payment_method: 'bank_transfer',
      proof_url: proofUrl,
      status: 'pending',
      receipt_number: receiptNumber,
    });

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="bg-emerald-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your proof of payment has been submitted for verification. You'll see the receipt once it's verified.
          </p>
          <Link to={createPageUrl('StudentDashboard')}>
            <Button className="bg-emerald-700 hover:bg-emerald-800 rounded-xl">
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-emerald-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pay Dues</h1>
            <p className="text-gray-500 text-sm mt-1">Transfer to NESA account & upload proof</p>
          </div>

          {/* Bank Details */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-2xl p-5 text-white mb-6 shadow-lg">
            <p className="text-emerald-200 text-xs tracking-wider uppercase mb-2">Transfer To</p>
            <p className="font-bold text-lg mb-3">Nigerian Economic Students Association</p>
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
              <div>
                <p className="text-emerald-200 text-xs">Covenant MFB</p>
                <p className="font-mono font-bold text-lg tracking-wider">0520003964</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyAccount}
                className="text-white hover:bg-white/20"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6 space-y-4">
            <div>
              <Label className="text-gray-700">Amount (₦) *</Label>
              <Input
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount paid"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <div>
              <Label className="text-gray-700">Proof of Payment *</Label>
              <div className="mt-1 border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('proof-upload').click()}
              >
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {proofFile ? proofFile.name : 'Click to upload screenshot or receipt'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF</p>
                <input
                  id="proof-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files[0])}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !proofFile || !amount}
              className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-xl h-12 text-base shadow-lg shadow-emerald-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Payment'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}