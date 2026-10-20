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
      setError('No account found with this registration number. Please register first.');
      setLoading(false);
      return;
    }

    const student = students[0];

    // Check graduation expiry — block access from November of graduation year
    if (student.graduation_year) {
      const now = new Date();
      const gradYear = parseInt(student.graduation_year, 10);
      // November = month index 10 (0-based)
      const expiryDate = new Date(gradYear, 10, 1); // Nov 1 of graduation year
      if (now >= expiryDate) {
        setError(`Your access expired in November ${gradYear} upon graduation. Please contact NESA if you believe this is an error.`);
        setLoading(false);
        return;
      }
    }

    localStorage.setItem('nesa_student_id', student.id);
    window.location.href = createPageUrl('StudentDashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex flex-col">
      <header className="p-4 pt-safe">
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
            <p className="text-gray-500 mt-1">Sign in with your registration number</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100">
                {error}
              </div>
            )}

            <div>
              <Label className="text-gray-700">Registration Number</Label>
              <Input
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. 2201860"
                className="mt-1 rounded-xl h-12 border-gray-200 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-xl h-12 text-base shadow-lg shadow-emerald-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
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