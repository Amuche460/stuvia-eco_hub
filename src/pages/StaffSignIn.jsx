import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StaffSignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loading) return;
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const pattern = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Email confirmation is self-service, never an administrator approval gate.
      const staffList = await base44.entities.Staff.filter({ email: { $regex: `(?i)^${pattern}$` } });
      if (!staffList.length) { setError('No staff account found. Please register first.'); return; }
      const staff = staffList[0];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await base44.entities.Staff.update(staff.id, { otp_code: otp, otp_expiry: expiry });
      localStorage.setItem('nesa_staff_pending_id', staff.id);
      localStorage.setItem('nesa_staff_pending_email', normalizedEmail);
      await base44.integrations.Core.SendEmail({
        to: staff.email.trim(),
        subject: 'NESA Staff Portal - Sign In Code',
        body: `Hello ${staff.full_name},\n\nYour NESA Staff Portal sign-in code is: ${otp}\n\nExpires in 10 minutes. No administrator approval is required.`,
      });
      window.location.href = createPageUrl('StaffVerifyOtp');
    } catch (e) {
      setError('Could not send your sign-in code. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <NesaLogo size="md" />
          <div className="bg-blue-100 rounded-2xl p-3 w-fit mx-auto mt-4 mb-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Sign In</h1>
          <p className="text-gray-500 text-sm mt-1">For CU Economics staff only. Confirm your email to sign in, no admin approval needed.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 space-y-4">
          <div>
            <Label className="text-gray-700">Staff Email</Label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" className="mt-1 rounded-xl h-11" />
          </div>
          <Button type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 rounded-xl h-12 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
          </Button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-500">
            Not registered?{' '}
            <Link to={createPageUrl('RegisterStaff')} className="text-blue-700 font-medium">Register as Staff</Link>
          </p>
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-1 text-sm text-gray-400">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}