import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Loader2, CheckCircle, Copy, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Donate() {
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

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let proofUrl = '';
    if (proofFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
      proofUrl = file_url;
    }

    const receiptNumber = `NESA-DON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await base44.entities.Payment.create({
      student_id: student.id,
      student_name: student.full_name,
      student_level: student.level,
      student_reg_no: student.reg_no,
      student_matric_no: student.matric_no || '',
      type: 'donation',
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
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="bg-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 💛</h2>
          <p className="text-gray-500 mb-6">
            Your donation to the Love Foundation has been submitted. God bless you!
          </p>
          <Link to={createPageUrl('StudentDashboard')}>
            <Button className="bg-emerald-700 hover:bg-emerald-800 rounded-xl">Back to Dashboard</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-rose-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Love Foundation</h1>
            <p className="text-gray-500 text-sm mt-1">Support NESA's welfare initiative</p>
          </div>

          {/* Bank Details */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
            <p className="text-rose-200 text-xs tracking-wider uppercase mb-2">Donate To</p>
            <p className="font-bold text-lg mb-3">Nigerian Economic Students Association</p>
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
              <div>
                <p className="text-rose-200 text-xs">Covenant MFB</p>
                <p className="font-mono font-bold text-lg tracking-wider">0520003964</p>
              </div>
              <Button size="sm" variant="ghost" onClick={copyAccount} className="text-white hover:bg-white/20">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-rose-100 shadow-lg p-6 space-y-4">
            <div>
              <Label className="text-gray-700">Donation Amount (₦) *</Label>
              <Input
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
              <div className="flex gap-2 mt-2">
                {quickAmounts.map(qa => (
                  <Button
                    key={qa}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(qa))}
                    className={`rounded-lg text-xs flex-1 ${amount === String(qa) ? 'bg-rose-50 border-rose-300 text-rose-700' : ''}`}
                  >
                    ₦{qa.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Proof of Payment *</Label>
              <div
                className="mt-1 border-2 border-dashed border-rose-200 rounded-xl p-6 text-center hover:border-rose-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('donate-proof').click()}
              >
                <Upload className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {proofFile ? proofFile.name : 'Upload your transfer receipt'}
                </p>
                <input
                  id="donate-proof"
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
              className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl h-12 text-base shadow-lg shadow-rose-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Submit Donation
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}