import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignIn() {
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const students = await base44.entities.Student.filter({ reg_no: regNo.trim() });

    if (students.length === 0) {
      setError('No account found with this email. Please register first.');
      setLoading(false);
      return;
    }

    const student = students[0];

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await base44.entities.Student.update(student.id, { otp_code: otp, otp_expiry: expiry });

    await base44.integrations.Core.SendEmail({
      to: student.email,
      subject: 'NESA - Login Verification Code',
      body: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
          <h2 style="color: #059669;">NESA Login</h2>
          <p>Hello ${student.full_name},</p>
          <p>Your login code is:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `
    });

    localStorage.setItem('nesa_verify_student_id', student.id);
    localStorage.setItem('nesa_verify_email', student.email);
    window.location.href = createPageUrl('VerifyOtp');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex flex-col">
      <header className="p-4">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <NesaLogo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome Back</h1>
            <p className="text-gray-500 mt-1">Sign in with your student email</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100">
                {error}
              </div>
            )}

            <div>
              <Label className="text-gray-700">Student Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@stu.cu.edu.ng"
                className="mt-1 rounded-xl h-12 border-gray-200 text-base"
              />
              <p className="text-xs text-gray-400 mt-1">Must end with @stu.cu.edu.ng</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-xl h-12 text-base shadow-lg shadow-emerald-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to={createPageUrl('Register')} className="text-emerald-700 font-medium hover:underline">
                Register
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}