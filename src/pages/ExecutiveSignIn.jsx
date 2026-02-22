import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExecutiveSignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@stu.cu.edu.ng')) {
      setError('Please use your student email (@stu.cu.edu.ng).');
      return;
    }

    setLoading(true);

    const executives = await base44.entities.Executive.filter({ email, is_approved: true, is_active: true });
    if (executives.length === 0) {
      setError('No approved executive account found with this email. Contact the admin.');
      setLoading(false);
      return;
    }

    const exec = executives[0];

    // Check term expiry
    const termEnd = new Date(exec.term_end_date);
    if (termEnd < new Date()) {
      setError('Your executive term has ended. You can still access the student portal.');
      setLoading(false);
      return;
    }

    // Check 400L graduation auto-logout
    if (exec.level === '400' && exec.graduation_year) {
      const logoutDate = new Date(`January 1, ${parseInt(exec.graduation_year) + 1}`);
      if (new Date() >= logoutDate) {
        setError('Your executive session has expired (graduated). Access the student portal instead.');
        setLoading(false);
        return;
      }
    }

    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await base44.entities.Executive.update(exec.id, { otp_code: otp, otp_expiry: expiry });

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'NESA Executive Portal - Sign In Code',
      body: `Hello ${exec.full_name},\n\nYour sign-in code is: ${otp}\n\nThis expires in 10 minutes.\n\nPost: ${exec.post}`,
    });

    localStorage.setItem('nesa_exec_pending_id', exec.id);
    window.location.href = createPageUrl('ExecutiveVerifyOtp');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <NesaLogo size="md" />
          <div className="bg-purple-100 rounded-2xl p-3 w-fit mx-auto mt-4 mb-3">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Sign In</h1>
          <p className="text-gray-500 text-sm mt-1">For approved NESA executives only</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6 space-y-4">
          <div>
            <Label className="text-gray-700">Student Email</Label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="yourname@stu.cu.edu.ng" className="mt-1 rounded-xl h-11" />
          </div>
          <Button type="submit" disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 rounded-xl h-12 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
          </Button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-500">
            Not registered yet?{' '}
            <Link to={createPageUrl('RegisterExecutive')} className="text-purple-700 font-medium">Register as Executive</Link>
          </p>
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}