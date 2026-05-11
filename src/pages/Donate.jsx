import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Heart, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PaymentGatewaySelector from '../components/payments/PaymentGatewaySelector';
import { checkPaymentRateLimit, isRefAlreadyUsed, markRefUsed, validatePaymentAmount } from '../lib/paymentSecurity';
import { sendReceiptEmail } from '../lib/sendReceiptEmail';

export default function Donate() {
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [amountError, setAmountError] = useState('');

  const quickAmounts = [500, 1000, 2000, 5000];

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) setStudent(s[0]);
    });
  }, []);

  const handleAmountChange = (val) => {
    setAmount(val);
    const { valid, error } = validatePaymentAmount(val, 'donation');
    setAmountError(!val ? '' : valid ? '' : error);
  };

  const handleSuccess = async ({ txRef, flwRef, amount: paidAmount, response }) => {
    // Security: prevent duplicate callback processing
    if (isRefAlreadyUsed(txRef)) {
      toast.error('This transaction has already been processed.');
      return;
    }
    markRefUsed(txRef);

    setLoading(true);
    const gateway = response?.reference ? 'paystack' : 'flutterwave';
    const receiptNumber = `NESA-DON-${txRef.split('-').slice(-2).join('-')}`;

    await base44.entities.Payment.create({
      student_id: student.id,
      student_name: student.full_name,
      student_level: student.level,
      student_reg_no: student.reg_no,
      student_matric_no: student.matric_no || '',
      type: 'donation',
      amount: paidAmount,
      payment_method: 'bank_transfer',
      proof_url: '',
      status: 'verified',
      receipt_number: receiptNumber,
      verified_at: new Date().toISOString(),
      verified_by: gateway,
    });

    await base44.entities.Student.update(student.id, {
      total_donated: (student.total_donated || 0) + paidAmount,
    });

    await base44.entities.NesaNotification.create({
      title: 'Donation Received 💛',
      message: `Your donation of ₦${paidAmount.toLocaleString()} to the Love Foundation has been received. Receipt: ${receiptNumber}`,
      type: 'payment',
      is_read_by: [],
    });

    await sendReceiptEmail({
      email: student.email,
      studentName: student.full_name,
      receiptNumber,
      amount: paidAmount,
      paymentType: 'donation',
      regNo: student.reg_no,
      matricNo: student.matric_no,
      level: student.level,
      gateway,
    });

    setReceiptNo(receiptNumber);
    setSubmitted(true);
    setLoading(false);
    toast.success('Donation received! Receipt sent to your email.');
  };

  const handlePayClick = () => {
    const { allowed, remainingMs } = checkPaymentRateLimit();
    if (!allowed) {
      const mins = Math.ceil(remainingMs / 60000);
      toast.error(`Too many attempts. Please wait ${mins} minute(s) before trying again.`);
      return false;
    }
    return true;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="bg-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 💛</h2>
          <p className="text-gray-500 mb-2">Your donation to the Love Foundation was received instantly.</p>
          <p className="text-sm font-mono bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-rose-700 mb-6">
            Receipt: {receiptNo}
          </p>
          <p className="text-xs text-gray-400 mb-6">A receipt has been sent to {student?.email}</p>
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

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-4">
            <Shield className="w-4 h-4 text-rose-600" />
            <p className="text-xs text-rose-700 font-medium">256-bit encrypted · PCI DSS compliant · No card data stored</p>
          </div>

          {/* Bank Details */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
            <p className="text-rose-200 text-xs tracking-wider uppercase mb-2">NESA Bank Account</p>
            <p className="font-bold text-base mb-3">Nigerian Economic Students Association</p>
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
              <div>
                <p className="text-rose-200 text-xs">Covenant MFB</p>
                <p className="font-mono font-bold text-xl tracking-wider">0520003964</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText('0520003964'); toast.success('Account number copied!'); }}
                className="text-white bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-medium"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-rose-100 shadow-lg p-6 space-y-5">
            {student && (
              <div className="bg-rose-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-gray-800">{student.full_name}</p>
                <p className="text-gray-500 text-xs">{student.reg_no} • {student.level}L</p>
              </div>
            )}

            <div>
              <Label className="text-gray-700">
                Donation Amount (₦) * <span className="text-rose-500 text-xs">(max ₦5,000)</span>
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                max={5000}
                className={`mt-1 rounded-xl h-11 border-gray-200 ${amountError ? 'border-red-400' : ''}`}
              />
              {amountError && <p className="text-xs text-red-600 mt-1">{amountError}</p>}
              <div className="flex gap-2 mt-2">
                {quickAmounts.map(qa => (
                  <Button
                    key={qa}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAmountChange(String(qa))}
                    className={`rounded-lg text-xs flex-1 ${amount === String(qa) ? 'bg-rose-50 border-rose-300 text-rose-700' : ''}`}
                  >
                    ₦{qa.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <PaymentGatewaySelector
              amount={amount}
              student={student || {}}
              paymentType="donation"
              onSuccess={handleSuccess}
              loading={loading}
              disabled={!student || !amount || !!amountError}
              onBeforePay={handlePayClick}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}