import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, CheckCircle, Upload, Shield, AlertCircle, Loader2, FileImage, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { validateReceipt } from '../lib/receiptValidator';
import { sendReceiptEmail } from '../lib/sendReceiptEmail';
import ReceiptCard from '../components/receipt/ReceiptCard';

const NESA_ACCOUNT = '0520003964';
const NESA_BANK = 'Covenant Microfinance Bank (CMFB)';

export default function PayDues() {
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [payment, setPayment] = useState(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) {
        setStudent(s[0]);
        if (s[0].dues_paid) setAlreadyPaid(true);
      }
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
        result = await validateReceipt(file_url, student);
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
      const receiptNumber = `NESA-${Date.now().toString().slice(-8)}`;
      const created = await base44.entities.Payment.create({
        student_id: student.id,
        student_name: student.full_name,
        student_level: student.level,
        student_reg_no: student.reg_no,
        student_matric_no: student.matric_no || '',
        type: 'dues',
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

      // 4. Mark dues as paid
      await base44.entities.Student.update(student.id, { dues_paid: true });

      // 5. Notify the student
      await base44.entities.NesaNotification.create({
        title: 'Dues Payment Verified ✅',
        message: `Your dues payment of ₦${data.amount.toLocaleString()} has been verified. Receipt: ${receiptNumber}`,
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
        paymentType: 'dues',
        regNo: student.reg_no,
        matricNo: student.matric_no,
        level: student.level,
        gateway: 'AI Validator',
      });

      setPayment(created);
      toast({ title: 'Receipt verified! 🎉', description: 'Your NESA receipt has been generated.' });
    } catch (e) {
      setErrors(['An error occurred while processing your receipt. Please try again.']);
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  // ── Success screen with NESA receipt ──
  if (payment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <header className="p-4">
          <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </header>
        <div className="max-w-md mx-auto px-4 py-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Receipt Verified!</h2>
            <p className="text-gray-500 text-sm mt-1">Your payment was compliant. Here is your official NESA receipt.</p>
          </motion.div>
          <ReceiptCard payment={payment} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-emerald-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <Upload className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pay NESA Dues</h1>
            <p className="text-gray-500 text-sm mt-1">Upload your payment receipt for instant verification</p>
          </div>

          {alreadyPaid && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-emerald-800 text-sm font-medium">Your dues are already paid for this session.</p>
            </div>
          )}

          {/* Bank Details */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-2xl p-5 text-white mb-6 shadow-lg">
            <p className="text-emerald-200 text-xs tracking-wider uppercase mb-2">Pay to this NESA Account</p>
            <p className="font-bold text-base mb-1">Nigerian Economic Students Association</p>
            <p className="text-emerald-200 text-sm mb-3">{NESA_BANK}</p>
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
              <div>
                <p className="text-emerald-200 text-xs">Account Number</p>
                <p className="font-mono font-bold text-xl tracking-wider">{NESA_ACCOUNT}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(NESA_ACCOUNT); toast({ title: 'Account number copied!' }); }}
                className="text-white bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-medium"
              >
                Copy
              </button>
            </div>
            <p className="text-emerald-200 text-xs mt-3">
              Use "<span className="font-semibold text-white">NESA dues</span>" as the payment description/narration.
            </p>
          </div>

          {/* Compliance rules */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Your receipt must pass these checks:
            </p>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>• Amount ≥ ₦6,000</li>
              <li>• Date is within the last 7 days</li>
              <li>• Description mentions "NESA dues"</li>
              <li>• Paid to Covenant MFB, account {NESA_ACCOUNT}</li>
              <li>• Sender name matches your profile name</li>
            </ul>
          </div>

          {/* Student info */}
          {student && (
            <div className="bg-emerald-50 rounded-xl p-3 text-sm mb-4">
              <p className="font-semibold text-gray-800">{student.full_name}</p>
              <p className="text-gray-500 text-xs">{student.reg_no}{student.matric_no ? ` • ${student.matric_no}` : ''} • {student.level}L</p>
            </div>
          )}

          {/* Upload area */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6 space-y-5">
            {!file ? (
              <label className="block border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-emerald-50 transition-colors">
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                <FileImage className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Tap to upload your receipt</p>
                <p className="text-xs text-gray-400 mt-1">Screenshot or photo of payment confirmation (JPG, PNG, PDF)</p>
              </label>
            ) : (
              <div className="relative">
                {file.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Receipt preview" className="w-full rounded-xl max-h-64 object-contain border border-gray-100" />
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                    <FileImage className="w-8 h-8 text-emerald-600" />
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
              disabled={!file || loading || alreadyPaid}
              className={`w-full rounded-xl h-11 transition-colors flex items-center justify-center text-sm font-medium ${
                file && !loading && !alreadyPaid
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-200 text-emerald-500 cursor-not-allowed'
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