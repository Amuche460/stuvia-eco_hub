import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StaffVerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staffId, setStaffId] = useState('');
  const [isNewReg, setIsNewReg] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('nesa_staff_pending_id');
    if (!id) window.location.href = createPageUrl('StaffSignIn');
    setStaffId(id);
    // Check if coming from registration (not yet verified)
    base44.entities.Staff.filter({ id }).then(s => {
      if (s.length && !s[0].is_verified) setIsNewReg(true);
    });
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const staffList = await base44.entities.Staff.filter({ id: staffId });
    if (!staffList.length) { setError('Staff record not found.'); setLoading(false); return; }

    const staff = staffList[0];
    if (staff.otp_code !== otp) { setError('Invalid code.'); setLoading(false); return; }
    if (new Date(staff.otp_expiry) < new Date()) { setError('Code expired. Please sign in again.'); setLoading(false); return; }

    await base44.entities.Staff.update(staffId, { is_verified: true });
    localStorage.setItem('nesa_staff_id', staffId);
    localStorage.removeItem('nesa_staff_pending_id');
    window.location.href = createPageUrl('StaffDashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <NesaLogo size="md" />
        <div className="bg-blue-100 rounded-2xl p-3 w-fit mx-auto mt-4 mb-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify Your Email</h1>
        <p className="text-gray-500 text-sm mb-6">Enter the 6-digit code sent to your staff email</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleVerify} className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 space-y-4">
          <input
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000" maxLength={6}
            className="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-blue-200 rounded-xl py-4 focus:outline-none focus:border-blue-500"
          />
          <Button type="submit" disabled={loading || otp.length !== 6}
            className="w-full bg-blue-700 hover:bg-blue-800 rounded-xl h-12 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
          </Button>
        </form>

        <Link to={createPageUrl('StaffSignIn')} className="inline-block mt-4 text-sm text-gray-400">← Back</Link>
      </motion.div>
    </div>
  );
}