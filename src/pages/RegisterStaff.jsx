import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterStaff() {
  const [form, setForm] = useState({ full_name: '', email: '', department: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    const existing = await base44.entities.Staff.filter({ email: form.email });
    if (existing.length > 0) {
      setError('This email is already registered.');
      setLoading(false);
      return;
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const staff = await base44.entities.Staff.create({
      ...form,
      otp_code: otp,
      otp_expiry: expiry,
      is_verified: false,
    });

    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: 'NESA Staff Portal - Verification Code',
      body: `Hello ${form.full_name},\n\nYour NESA Staff Portal verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    });

    localStorage.setItem('nesa_staff_pending_id', staff.id);
    localStorage.setItem('nesa_staff_pending_email', form.email);

    window.location.href = createPageUrl('StaffVerifyOtp');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="p-4 pt-safe flex items-center gap-3">
        <Link to={createPageUrl('Home')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <NesaLogo size="sm" />
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-blue-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Registration</h1>
            <p className="text-gray-500 text-sm mt-1">For CU Economics department staff</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 space-y-4">
            <div>
              <Label className="text-gray-700">Full Name *</Label>
              <Input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Dr. / Prof. / Mr. / Mrs." className="mt-1 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-gray-700">Email *</Label>
              <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com" className="mt-1 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-gray-700">Department</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Economics" className="mt-1 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-gray-700">Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number" className="mt-1 rounded-xl h-11" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 rounded-xl h-12 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register & Verify Email'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <Link to={createPageUrl('StaffSignIn')} className="text-blue-700 font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}