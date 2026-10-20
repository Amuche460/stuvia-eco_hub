import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import MobileSelect from '@/components/MobileSelect';
import { ArrowLeft, Shield, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const POSTS = [
  "President","Vice President Male","Vice President Female","Senate President",
  "General Secretary","Assistant General Secretary",
  "Academic Director","Assistant Academic Director",
  "Sports Coordinator Female","Sports Coordinator Male",
  "Welfare Director","Assistant Welfare Director",
  "Social Director","Assistant Social Director",
  "Financial Secretary","Assistant Financial Secretary",
  "PRO","Assistant PRO",
  "Editor in Chief","Assistant Editor in Chief",
  "Community Development Officer","Assistant Community Development Officer",
  "100 Level Rep","200 Level Rep","Chaplain"
];

const POST_OPTIONS = POSTS.map(p => ({ value: p, label: p }));

const LEVEL_OPTIONS = [
  { value: '100', label: '100L' },
  { value: '200', label: '200L' },
  { value: '300', label: '300L' },
  { value: '400', label: '400L' },
];

export default function RegisterExecutive() {
  const [form, setForm] = useState({
    full_name: '', reg_no: '', matric_no: '', level: '', email: '',
    post: '', term_end_date: '', graduation_year: '', secret_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);

  const EXCO_SECRET_CODE = 'STUVIA_ECOHUB';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.term_end_date) {
      setError('Please set your term end date.');
      return;
    }

    setLoading(true);

    // Check if post is already taken
    const existing = await base44.entities.Executive.filter({ post: form.post, is_active: true, is_approved: true });
    if (existing.length > 0) {
      setError(`The post of "${form.post}" is already occupied by an active executive.`);
      setLoading(false);
      return;
    }

    // Check if email already registered
    const emailCheck = await base44.entities.Executive.filter({ email: form.email });
    if (emailCheck.length > 0) {
      setError('This email is already registered as an executive.');
      setLoading(false);
      return;
    }

    // Find matching student record
    const students = await base44.entities.Student.filter({ reg_no: form.reg_no });
    let studentId = '';
    if (students.length > 0) {
      const match = students.find(s => s.email === form.email);
      if (match) studentId = match.id;
    }

    const codeMatches = form.secret_code.trim() === EXCO_SECRET_CODE;

    const { secret_code, ...execData } = form;
    await base44.entities.Executive.create({
      ...execData,
      full_name: form.full_name.trim(),
      reg_no: form.reg_no.trim(),
      matric_no: form.matric_no.trim().toUpperCase(),
      email: form.email.trim(),
      student_id: studentId,
      is_active: true,
      is_approved: codeMatches,
    });

    setAutoApproved(codeMatches);
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 mb-6">
            {autoApproved
              ? "Your secret code was verified — you're approved! You can sign in to the executive portal now."
              : "Your executive registration is pending admin approval. You'll be able to sign in once approved."}
          </p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-purple-700 hover:bg-purple-800 rounded-xl">Back to Home</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      <header className="p-4 flex items-center gap-3">
        <Link to={createPageUrl('Home')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <NesaLogo size="sm" />
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-purple-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Registration</h1>
            <p className="text-gray-500 text-sm mt-1">For NESA executives & officers only</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6 space-y-4">
            <div>
              <Label className="text-gray-700">Full Name *</Label>
              <Input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name" className="mt-1 rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700">Reg Number *</Label>
                <Input required value={form.reg_no} onChange={e => setForm(f => ({ ...f, reg_no: e.target.value }))}
                  placeholder="e.g. 2201860" className="mt-1 rounded-xl h-11" />
              </div>
              <div>
                <Label className="text-gray-700">Matric Number</Label>
                <Input required value={form.matric_no} onChange={e => setForm(f => ({ ...f, matric_no: e.target.value }))}
                  placeholder="e.g. 22AF001234" className="mt-1 rounded-xl h-11" />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Email *</Label>
              <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com" className="mt-1 rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700">Level *</Label>
                <MobileSelect
                  value={form.level}
                  onValueChange={v => setForm(f => ({ ...f, level: v }))}
                  placeholder="Level"
                  options={LEVEL_OPTIONS}
                  triggerClassName="mt-1 rounded-xl h-11"
                />
              </div>
              <div>
                <Label className="text-gray-700">Graduation Year *</Label>
                <Input required value={form.graduation_year} onChange={e => setForm(f => ({ ...f, graduation_year: e.target.value }))}
                  placeholder="e.g. 2028" className="mt-1 rounded-xl h-11" />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Executive Post *</Label>
              <MobileSelect
                value={form.post}
                onValueChange={v => setForm(f => ({ ...f, post: v }))}
                placeholder="Select your post"
                options={POST_OPTIONS}
                triggerClassName="mt-1 rounded-xl h-11"
              />
            </div>

            <div>
              <Label className="text-gray-700">Term End Date *</Label>
              <Input required type="date" value={form.term_end_date}
                onChange={e => setForm(f => ({ ...f, term_end_date: e.target.value }))}
                className="mt-1 rounded-xl h-11" />
              <p className="text-xs text-gray-400 mt-1">You will be automatically logged out after this date.</p>
            </div>

            <div>
              <Label className="text-gray-700">Exco Secret Code</Label>
              <Input value={form.secret_code} onChange={e => setForm(f => ({ ...f, secret_code: e.target.value }))}
                placeholder="Enter exco code (optional)" className="mt-1 rounded-xl h-11" />
              <p className="text-xs text-gray-400 mt-1">Have a secret code? Enter it for instant approval. Without it, your registration will need admin approval.</p>
            </div>

            <Button type="submit" disabled={loading || !form.post || !form.level}
              className="w-full bg-purple-700 hover:bg-purple-800 rounded-xl h-12 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Registration'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <Link to={createPageUrl('ExecutiveSignIn')} className="text-purple-700 font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}