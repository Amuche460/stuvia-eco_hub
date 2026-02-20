import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import ReceiptCard from '../components/receipt/ReceiptCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Heart, MessageSquare, LogOut, Receipt,
  User, CheckCircle, Clock, XCircle, ChevronRight, Calendar
} from 'lucide-react';
import NotificationBell from '../components/dashboard/NotificationBell';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) {
      window.location.href = createPageUrl('SignIn');
      return;
    }
    loadData(sid);
  }, []);

  const loadData = async (sid) => {
    const students = await base44.entities.Student.filter({ id: sid });
    if (students.length === 0) {
      localStorage.removeItem('nesa_student_id');
      window.location.href = createPageUrl('SignIn');
      return;
    }
    setStudent(students[0]);

    const allPayments = await base44.entities.Payment.filter({ student_id: sid }, '-created_date');
    setPayments(allPayments);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('nesa_student_id');
    window.location.href = createPageUrl('Home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-pulse text-emerald-600">Loading...</div>
      </div>
    );
  }

  const duesPayment = payments.find(p => p.type === 'dues' && p.status === 'verified');
  const pendingDues = payments.find(p => p.type === 'dues' && p.status === 'pending');
  const totalDonated = payments
    .filter(p => p.type === 'donation' && p.status === 'verified')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const statusIcons = {
    pending: Clock,
    verified: CheckCircle,
    rejected: XCircle,
  };

  if (selectedReceipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Button variant="ghost" onClick={() => setSelectedReceipt(null)} className="mb-4 text-emerald-700">
            ← Back to Dashboard
          </Button>
          <ReceiptCard payment={selectedReceipt} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-emerald-100 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <NesaLogo size="sm" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
            <LogOut className="w-4 h-4 mr-1" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 flex-shrink-0 bg-white/20 flex items-center justify-center text-2xl font-bold">
              {student.profile_picture_url
                ? <img src={student.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                : student.full_name?.charAt(0)
              }
            </div>
            <div>
              <h2 className="text-xl font-bold">{student.full_name}</h2>
              <p className="text-emerald-200 text-sm">{student.level}L • {student.reg_no}</p>
              {student.course_of_study && (
                <p className="text-emerald-300 text-xs mt-0.5">{student.course_of_study}{student.year_of_entry ? ` • Entry ${student.year_of_entry}` : ''}</p>
              )}
              {student.matric_no && (
                <p className="text-emerald-300 text-xs">Matric: {student.matric_no}</p>
              )}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-emerald-200 text-xs">Dues Status</p>
              <p className="font-bold text-sm mt-1">
                {duesPayment ? '✓ Paid' : pendingDues ? '⏳ Pending' : '✗ Unpaid'}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-emerald-200 text-xs">Total Donated</p>
              <p className="font-bold text-sm mt-1">₦{totalDonated.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('PayDues')}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-emerald-100 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="bg-emerald-50 rounded-xl p-2.5 w-fit mb-3 group-hover:bg-emerald-100 transition-colors">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Pay Dues</h3>
              <p className="text-xs text-gray-500 mt-0.5">Submit proof of payment</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl('Donate')}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-rose-100 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="bg-rose-50 rounded-xl p-2.5 w-fit mb-3 group-hover:bg-rose-100 transition-colors">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Donate</h3>
              <p className="text-xs text-gray-500 mt-0.5">Love Foundation</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl('Suggestions')}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-amber-100 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="bg-amber-50 rounded-xl p-2.5 w-fit mb-3 group-hover:bg-amber-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Feedback</h3>
              <p className="text-xs text-gray-500 mt-0.5">Send suggestions</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl('UpdateProfile')}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-blue-100 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="bg-blue-50 rounded-xl p-2.5 w-fit mb-3 group-hover:bg-blue-100 transition-colors">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Profile</h3>
              <p className="text-xs text-gray-500 mt-0.5">Update matric no.</p>
            </motion.div>
          </Link>
        </div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Payment History
          </h3>
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 text-sm">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => {
                const StatusIcon = statusIcons[p.status] || Clock;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => p.status === 'verified' ? setSelectedReceipt(p) : null}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${p.type === 'dues' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        {p.type === 'dues'
                          ? <CreditCard className="w-4 h-4 text-emerald-600" />
                          : <Heart className="w-4 h-4 text-rose-500" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {p.type === 'dues' ? 'Dues Payment' : 'Donation'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(p.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-sm">₦{p.amount?.toLocaleString()}</p>
                        <Badge variant="secondary" className={`text-xs ${statusColors[p.status]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {p.status}
                        </Badge>
                      </div>
                      {p.status === 'verified' && (
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}