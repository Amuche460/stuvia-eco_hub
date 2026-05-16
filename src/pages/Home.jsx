import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { ArrowRight, Shield, Receipt, Heart, MessageSquare, Users, ChevronRight, BookOpen } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Home() {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (sid) {
      base44.entities.Student.filter({ id: sid }).then(students => {
        if (students.length) setStudent(students[0]);
      });
    }
  }, []);

  const features = [
    { icon: Shield, title: 'Secure Payments', desc: 'Bank transfer with proof verification', color: 'emerald' },
    { icon: Receipt, title: 'Instant Receipts', desc: 'Auto-generated downloadable receipts', color: 'blue' },
    { icon: Heart, title: 'Love Foundation', desc: 'Donate to welfare initiatives', color: 'rose' },
    { icon: MessageSquare, title: 'Feedback Portal', desc: 'Send suggestions to NESA teams', color: 'amber' },
  ];

  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-emerald-100 dark:border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <NesaLogo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {student ? (
              <Link to={createPageUrl('StudentDashboard')}>
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 rounded-xl">
                  My Dashboard
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to={createPageUrl('SignIn')}>
                  <Button variant="ghost" size="sm" className="text-emerald-700">Sign In</Button>
                </Link>
                <Link to={createPageUrl('Register')}>
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 rounded-xl">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            Nigerian Economic Students Association
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Dues & Donations,
            <br />
            <span className="text-emerald-700">Made Simple.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Pay your NESA dues, donate to the Love Foundation, and share feedback — all in one secure portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link to={createPageUrl('Register')}>
              <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 rounded-xl px-6 text-base shadow-lg shadow-emerald-200">
                <Users className="w-5 h-5 mr-2" /> Register as Student
              </Button>
            </Link>
            <Link to={createPageUrl('RegisterExecutive')}>
              <Button size="lg" className="bg-purple-700 hover:bg-purple-800 rounded-xl px-6 text-base shadow-lg shadow-purple-200">
                <Shield className="w-5 h-5 mr-2" /> Register as Executive
              </Button>
            </Link>
            <Link to={createPageUrl('RegisterStaff')}>
              <Button size="lg" variant="outline" className="rounded-xl px-6 text-base border-blue-200 text-blue-700 hover:bg-blue-50">
                <BookOpen className="w-5 h-5 mr-2" /> Register as Staff
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-3">
            <Link to={createPageUrl('SignIn')}>
              <Button variant="ghost" size="sm" className="text-emerald-700 text-sm">Student Sign In</Button>
            </Link>
            <Link to={createPageUrl('ExecutiveSignIn')}>
              <Button variant="ghost" size="sm" className="text-purple-700 text-sm">Executive Sign In</Button>
            </Link>
            <Link to={createPageUrl('StaffSignIn')}>
              <Button variant="ghost" size="sm" className="text-blue-700 text-sm">Staff Sign In</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Bank Details Banner */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-3xl p-8 md:p-10 text-white text-center shadow-xl shadow-emerald-200"
        >
          <p className="text-emerald-200 text-sm font-medium tracking-widest uppercase mb-2">Payment Account</p>
          <p className="text-2xl md:text-3xl font-bold mb-2">Nigerian Economic Students Association</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-emerald-200 text-xs mb-1">Bank</p>
              <p className="font-bold">Covenant MFB</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-emerald-200 text-xs mb-1">Account Number</p>
              <p className="font-bold font-mono text-lg tracking-wider">0520003964</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className={`rounded-2xl border p-6 ${colorMap[f.color]} hover:shadow-lg transition-all cursor-default`}
            >
              <f.icon className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm opacity-70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        <p>© {new Date().getFullYear()} STUVIA Eco Hub — Nigerian Economic Students Association</p>
        <p className="mt-1">Economics Department • Secure FinTech Portal</p>
      </footer>
    </div>
  );
}