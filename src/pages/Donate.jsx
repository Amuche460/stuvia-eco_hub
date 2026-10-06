import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, CheckCircle, Upload, Shield, AlertCircle, Loader2, FileImage, X, Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { validateReceipt } from '../lib/receiptValidator';
import { sendReceiptEmail } from '../lib/sendReceiptEmail';
import ReceiptCard from '../components/receipt/ReceiptCard';

const NESA_ACCOUNT = '0520003964';
const NESA_BANK = 'Covenant Microfinance Bank (CMFB)';

export default function Donate() {
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) setStudent(s[0]);
    });
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setErrors([]);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl('');
    setErrors([]);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: 'Please upload a receipt first.', variant: 'destructive' });
      return;
    }
    if (!student) {
      toast({ title: 'Student profile is still loading. Please try again in a moment.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setErrors([]);
    try {
      // 1. Upload the receipt
      let file_url;
      try {
        const uploadRes = await base44.integrations.Core.UploadPublicFile({ file });
        file_url = uploadRes.file_url;
      } catch (uploadErr) {
        setErrors(['Could not upload the receipt image. Please check your connection and try again.']);
        toast({ title: 'Upload failed. Please try again.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // 2. Validate the receipt with AI
      let result;
      try {
        result = await validateReceipt(file_url, student, 'donation');
      } catch (valErr) {
        setErrors(['Could not analyze the receipt. Please ensure the image is clear and try again.']);
        toast({ title: 'Receipt analysis failed. Please try again.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data, errors: validationErrors, valid } = result;

      if (!valid) {
        setErrors(validationErrors);
        toast({ title: 'Receipt not compliant', description: `${validationErrors.length} issue(s) found — see details below.`, variant: 'destructive' });
        setLoading(false);
        return;
      }

      // 3. Create verified payment record
      const receiptNumber = `NESA-DON-${Date.now().toString().slice(-8)}`;
      const created = await base44.entities.Payment.create({
        student_id: student.id,
        student_name: student.full_name,
        student_level: student.level,
        student_reg_no: student.reg_no,
        student_matric_no: student.matric_no || '',
        type: 'donation',
        amount: data.amount,
        payment_method: 'bank_transfer',
        proof_url: file_url,
        status: 'verified',
        receipt_number: receiptNumber,
        verified_at: new Date().toISOString(),
        verified_by: 'AI Receipt Validator',
        receipt_data: data,
        validation_errors: [],
      });

      // 4. Update total donated
      await base44.entities.Student.update(student.id, {
        total_donated: (student.total_donated || 0) + data.amount,
      });

      // 5. Notify the student
      await base44.entities.NesaNotification.create({
        title: 'Donation Received 💛',
        message: `Your donation of ₦${data.amount.toLocaleString()} to the Love Foundation has been verified. Receipt: ${receiptNumber}`,
        type: 'payment',
        student_id: student.id,
        is_read_by: [],
      });

      // 6. Email the receipt
      await sendReceiptEmail({
        email: student.email,
        studentName: student.full_name,
        receiptNumber,
        amount: data.amount,
        paymentType: 'donation',
        regNo: student.reg_no,
        matricNo: student.matric_no,
        level: student.level,
        gateway: 'AI Validator',
      });

      setPayment(created);
      toast({ title: 'Donation verified! 💛', description: 'Your Love Foundation receipt has been generated.' });
    } catch (e) {
      setErrors(['An error occurred while processing your receipt. Please try again.']);
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  // ── Success screen with receipt ──
  if (payment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <header className="p-4">
          <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-rose-700 hover:text-rose-800 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </header>
        <div className="max-w-md mx-auto px-4 py-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <div className="bg-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Thank You! 💛</h2>
            <p className="text-gray-500 text-sm mt-1">Your donation was verified. Here is your official receipt.</p>
          </motion.div>
          <ReceiptCard payment={payment} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-rose-700 hover:text-rose-800 text-sm font-medium">
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
            <p className="text-gray-500 text-sm mt-1">Upload your donation receipt for instant verification</p>
          </div>

          {/* Bank Details */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
            <p className="text-rose-200 text-xs tracking-wider uppercase mb-2">Donate to this NESA Account</p>
            <p className="font-bold text-base mb-1">Nigerian Economic Students Association</p>
            <p className="text-rose-200 text-sm mb-3">{NESA_BANK}</p>
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
              <div>
                <p className="text-rose-200 text-xs">Account Number</p>
                <p className="font-mono font-bold text-xl tracking-wider">{NESA_ACCOUNT}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(NESA_ACCOUNT); toast({ title: 'Account number copied!' }); }}
                className="text-white bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-medium"
              >
                Copy
              </button>
            </div>
            <p className="text-rose-200 text-xs mt-3">
              Make the beneficiary <span className="font-semibold text-white">NIGERIAN ECONOMIC STUDENT ASSOSIATI</span>.
            </p>
          </div>

          {/* Compliance rules */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-500" /> Your receipt must pass these checks:
            </p>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>• Amount ≥ ₦100</li>
              <li>• Date is within the last 2 months</li>
              <li>• Beneficiary is "NIGERIAN ECONOMIC STUDENT ASSOSIATI"</li>
              <li>• Paid to Covenant MFB, account {NESA_ACCOUNT}</li>
              <li>• Sender name matches your profile name</li>
            </ul>
          </div>

          {/* Student info */}
          {student && (
            <div className="bg-rose-50 rounded-xl p-3 text-sm mb-4">
              <p className="font-semibold text-gray-800">{student.full_name}</p>
              <p className="text-gray-500 text-xs">{student.reg_no}{student.matric_no ? ` • ${student.matric_no}` : ''} • {student.level}L</p>
            </div>
          )}

          {/* Upload area */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-lg p-6 space-y-5">
            {!file ? (
              <label className="block border-2 border-dashed border-rose-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-rose-50 transition-colors">
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                <FileImage className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Tap to upload your receipt</p>
                <p className="text-xs text-gray-400 mt-1">Screenshot or photo of payment confirmation (JPG, PNG, PDF)</p>
              </label>
            ) : (
              <div className="relative">
                {file.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Receipt preview" className="w-full rounded-xl max-h-64 object-contain border border-gray-100" />
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                    <FileImage className="w-8 h-8 text-rose-500" />
                    <p className="text-sm text-gray-700 flex-1 truncate">{file.name}</p>
                  </div>
                )}
                <button
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-red-800 font-semibold text-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Receipt not compliant
                </p>
                {errors.map((err, i) => (
                  <p key={i} className="text-red-700 text-xs flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span> {err}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`w-full rounded-xl h-11 transition-colors flex items-center justify-center text-sm font-medium ${
                file && !loading
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                  : 'bg-rose-200 text-rose-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying receipt...</>
              ) : (
                <><Shield className="w-4 h-4 mr-2" /> Validate & Generate Receipt</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}