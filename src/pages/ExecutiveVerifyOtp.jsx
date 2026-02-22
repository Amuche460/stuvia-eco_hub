import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExecutiveVerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [execId, setExecId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('nesa_exec_pending_id');
    if (!id) window.location.href = createPageUrl('ExecutiveSignIn');
    setExecId(id);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const execs = await base44.entities.Executive.filter({ id: execId });
    if (!execs.length) { setError('Executive not found.'); setLoading(false); return; }

    const exec = execs[0];
    const now = new Date();

    if (exec.otp_code !== otp) { setError('Invalid code. Please try again.'); setLoading(false); return; }
    if (new Date(exec.otp_expiry) < now) { setError('Code expired. Please sign in again.'); setLoading(false); return; }

    localStorage.setItem('nesa_executive_id', exec.id);
    localStorage.removeItem('nesa_exec_pending_id');
    window.location.href = createPageUrl('ExecutiveDashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <NesaLogo size="md" />
        <div className="bg-purple-100 rounded-2xl p-3 w-fit mx-auto mt-4 mb-3">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter Verification Code</h1>
        <p className="text-gray-500 text-sm mb-6">Check your student email for the 6-digit code</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleVerify} className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6 space-y-4">
          <input
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000" maxLength={6}
            className="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-purple-200 rounded-xl py-4 focus:outline-none focus:border-purple-500"
          />
          <Button type="submit" disabled={loading || otp.length !== 6}
            className="w-full bg-purple-700 hover:bg-purple-800 rounded-xl h-12 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
          </Button>
        </form>

        <Link to={createPageUrl('ExecutiveSignIn')} className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-600">
          ← Back to Sign In
        </Link>
      </motion.div>
    </div>
  );
}