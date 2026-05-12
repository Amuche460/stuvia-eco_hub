import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '', reg_no: '', matric_no: '', level: '', email: '', phone: '', date_of_birth: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate matric number if provided
    if (form.matric_no && form.matric_no.trim().toUpperCase().slice(2, 4) !== 'AF') {
      setError('Invalid matric number. The 3rd and 4th characters must be "AF" (e.g. 22AF012345).');
      setLoading(false);
      return;
    }

    // Check if reg_no already exists
    const existing = await base44.entities.Student.filter({ reg_no: form.reg_no });
    if (existing.length > 0) {
      setError('A student with this registration number already exists. Please sign in instead.');
      setLoading(false);
      return;
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const student = await base44.entities.Student.create({
      ...form,
      is_verified: false,
      otp_code: otp,
      otp_expiry: expiry,
    });

    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: 'NESA - Email Verification Code',
      body: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
          <h2 style="color: #059669;">Welcome to NESA!</h2>
          <p>Hello ${form.full_name},</p>
          <p>Your verification code is:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `
    });

    localStorage.setItem('nesa_verify_student_id', student.id);
    localStorage.setItem('nesa_verify_email', form.email);
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

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <NesaLogo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Create Your Account</h1>
            <p className="text-gray-500 mt-1">Register as a NESA member</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100">
                {error}
              </div>
            )}

            <div>
              <Label className="text-gray-700">Full Name *</Label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700">Reg Number *</Label>
                <Input
                  required
                  value={form.reg_no}
                  onChange={(e) => setForm({ ...form, reg_no: e.target.value })}
                  placeholder="e.g. 22CJ012345"
                  className="mt-1 rounded-xl h-11 border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700">Matric Number</Label>
                <Input
                  value={form.matric_no}
                  onChange={(e) => setForm({ ...form, matric_no: e.target.value })}
                  placeholder="Optional for 100L"
                  className="mt-1 rounded-xl h-11 border-gray-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Level *</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger className="mt-1 rounded-xl h-11 border-gray-200">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700">Email *</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <div>
              <Label className="text-gray-700">Phone Number *</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08012345678"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <div>
              <Label className="text-gray-700">Date of Birth *</Label>
              <Input
                required
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !form.level}
              className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-xl h-12 text-base shadow-lg shadow-emerald-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Register & Verify Email
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to={createPageUrl('SignIn')} className="text-emerald-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}