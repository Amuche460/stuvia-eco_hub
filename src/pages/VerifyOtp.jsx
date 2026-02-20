import React, { useState } from 'react';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import OtpInput from '../components/auth/OtpInput';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyOtp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const studentId = localStorage.getItem('nesa_verify_student_id');
  const email = localStorage.getItem('nesa_verify_email');

  const handleVerify = async (code) => {
    setLoading(true);
    setError('');

    const students = await base44.entities.Student.filter({ id: studentId });
    const student = students[0];

    if (!student) {
      setError('Student not found. Please register again.');
      setLoading(false);
      return;
    }

    if (student.otp_code !== code) {
      setError('Invalid OTP code. Please try again.');
      setLoading(false);
      return;
    }

    if (new Date(student.otp_expiry) < new Date()) {
      setError('OTP has expired. Please request a new one.');
      setLoading(false);
      return;
    }

    await base44.entities.Student.update(studentId, {
      is_verified: true,
      otp_code: '',
      otp_expiry: '',
    });

    localStorage.setItem('nesa_student_id', studentId);
    localStorage.removeItem('nesa_verify_student_id');
    localStorage.removeItem('nesa_verify_email');
    window.location.href = createPageUrl('StudentDashboard');
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    const students = await base44.entities.Student.filter({ id: studentId });
    const student = students[0];
    if (!student) { setError('Student not found.'); setResending(false); return; }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await base44.entities.Student.update(studentId, { otp_code: otp, otp_expiry: expiry });

    await base44.integrations.Core.SendEmail({
      to: student.email,
      subject: 'NESA - New Verification Code',
      body: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
          <h2 style="color: #059669;">NESA Verification</h2>
          <p>Your new OTP code is:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `
    });

    setResending(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-6">
          <NesaLogo size="lg" />
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-8">
          <div className="bg-emerald-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-500 mb-6">
            We sent a 6-digit code to<br />
            <span className="font-medium text-gray-700">{email}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100 mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <OtpInput length={6} onComplete={handleVerify} />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verifying...</span>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={resending}
            className="text-emerald-700 hover:text-emerald-800"
          >
            {resending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Resend Code
          </Button>
        </div>
      </motion.div>
    </div>
  );
}