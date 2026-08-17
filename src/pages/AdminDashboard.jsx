import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import StatCard from '../components/dashboard/StatCard';
import AutoVerifyPanel from '../components/admin/AutoVerifyPanel';
import AnnouncementBoard from '../components/admin/AnnouncementBoard';
import PaymentTable from '../components/admin/PaymentTable';
import SuggestionsList from '../components/admin/SuggestionsList';
import NotifyUnpaidPanel from '../components/admin/NotifyUnpaidPanel';
import { sendDuesReminders } from '@/lib/duesReminderNotifier';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, Heart, Users, CreditCard, MessageSquare,
  BarChart3, Receipt, ArrowLeft, Calendar, UserCircle, Zap, Megaphone, Bell
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
// Level color map
const LEVEL_COLORS = {
  '100': '#10b981',
  '200': '#3b82f6',
  '300': '#f59e0b',
  '400': '#ef4444',
};

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  const loadData = async () => {
    const [p, s, sug] = await Promise.all([
      base44.entities.Payment.list('-created_date'),
      base44.entities.Student.list(),
      base44.entities.Suggestion.list('-created_date'),
    ]);
    setPayments(p);
    setStudents(s);
    setSuggestions(sug);
    setLoading(false);
    sendBirthdayEmails(s);
    sendDuesReminders(s, p);
  };

  const sendBirthdayEmails = async (allStudents) => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate();
    const birthdayStudents = allStudents.filter(s => {
      if (!s.date_of_birth || !s.email) return false;
      const dob = new Date(s.date_of_birth);
      return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
    });
    for (const student of birthdayStudents) {
      await base44.integrations.Core.SendEmail({
        to: student.email,
        subject: `🎂 Happy Birthday from NESA, ${student.full_name.split(' ')[0]}!`,
        body: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #f0fdf4; border-radius: 16px; padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎂🎉</div>
            <h1 style="color: #1a6b62; font-size: 26px; margin-bottom: 8px;">Happy Birthday, ${student.full_name.split(' ')[0]}!</h1>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              On behalf of the entire <strong>NESA Executive Team</strong>, we want to celebrate YOU today! 🌟
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              As a valued member of our NESA family, you bring energy, excellence, and passion to everything you do. 
              May this special day bring you joy, laughter, and everything your heart desires.
            </p>
            <div style="background: #d4a833; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #fff; font-size: 18px; font-weight: bold; margin: 0;">
                🎊 Wishing you a blessed and wonderful birthday! 🎊
              </p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">With love & warm wishes,</p>
            <p style="color: #1a6b62; font-weight: bold; font-size: 15px; margin-top: 4px;">The NESA Executive Team 💚</p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">Nigerian Economic Students Association — My NESA Portal</p>
          </div>
        `,
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  const verifiedPayments = payments.filter(p => p.status === 'verified');
  const totalDues = verifiedPayments.filter(p => p.type === 'dues').reduce((s, p) => s + (p.amount || 0), 0);
  const totalDonations = verifiedPayments.filter(p => p.type === 'donation').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  // Level breakdown
  const levelBreakdown = ['100', '200', '300', '400'].map(level => {
    const levelPayments = verifiedPayments.filter(p => p.student_level === level);
    return {
      level: `${level}L`,
      dues: levelPayments.filter(p => p.type === 'dues').reduce((s, p) => s + (p.amount || 0), 0),
      donations: levelPayments.filter(p => p.type === 'donation').reduce((s, p) => s + (p.amount || 0), 0),
      count: levelPayments.length,
    };
  });

  const pieData = levelBreakdown.map(l => ({
    name: l.level,
    value: l.dues + l.donations,
  })).filter(d => d.value > 0);

  // Dues vs Donations split
  const duesVsDonations = [
    { name: 'Dues', value: totalDues, fill: '#10b981' },
    { name: 'Donations', value: totalDonations, fill: '#f43f5e' },
  ].filter(d => d.value > 0);

  // Donation trends over time (monthly, last 6 months)
  const donationTrends = (() => {
    const verifiedDonations = payments.filter(p => p.type === 'donation' && p.status === 'verified');
    const byMonth = {};
    verifiedDonations.forEach(p => {
      if (!p.created_date) return;
      const d = new Date(p.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + (p.amount || 0);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, amount]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return { month: date.toLocaleString('default', { month: 'short' }), amount };
      });
  })();

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterLevel !== 'all' && p.student_level !== filterLevel) return false;
    return true;
  });

  // Redirect non-admins to home
  if (!isLoadingAuth && (!user || user.role !== 'admin')) {
    window.location.href = '/';
    return null;
  }

  if (loading || isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-pulse text-emerald-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NesaLogo size="sm" />
            <div className="hidden sm:block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Admin
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to={createPageUrl('StudentProfiles')}>
              <span className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-medium">
                <UserCircle className="w-4 h-4" /> Students
              </span>
            </Link>
            <Link to={createPageUrl('NesaCalendar')} onClick={() => localStorage.setItem('nesa_is_admin', 'true')}>
              <span className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1 font-medium">
                <Calendar className="w-4 h-4" /> Calendar
              </span>
            </Link>
            <Link to={createPageUrl('Home')}>
              <span className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Portal
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <StatCard title="Total Dues" value={`₦${totalDues.toLocaleString()}`} icon={Wallet} color="emerald" />
          <StatCard title="Total Donations" value={`₦${totalDonations.toLocaleString()}`} icon={Heart} color="rose" />
          <StatCard title="Total Revenue" value={`₦${(totalDues + totalDonations).toLocaleString()}`} icon={BarChart3} color="blue" />
          <StatCard title="Pending" value={pendingCount} subtitle="Awaiting verification" icon={Receipt} color="amber" />
          <StatCard title="Students" value={students.length} subtitle="Registered" icon={Users} color="purple" />
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Payment Breakdown by Level</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={levelBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Bar dataKey="dues" name="Dues" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="donations" name="Donations" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Revenue Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={Object.values(LEVEL_COLORS)[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₦${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                No verified payments yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Trends */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Dues vs Donations</h3>
            {duesVsDonations.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={duesVsDonations}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {duesVsDonations.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₦${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                No verified payments yet
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Donation Trends Over Time</h3>
            {donationTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={donationTrends}>
                  <defs>
                    <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Donations"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#donationGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                No donation data yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="payments">
          <TabsList className="bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="payments" className="rounded-lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="rounded-lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Suggestions ({suggestions.length})
            </TabsTrigger>
            <TabsTrigger value="autoverify" className="rounded-lg">
              <Zap className="w-4 h-4 mr-2" />
              Auto-Verify
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="notify" className="rounded-lg">
              <Bell className="w-4 h-4 mr-2" />
              Notify Unpaid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dues">Dues</SelectItem>
                  <SelectItem value="donation">Donations</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="100">100L</SelectItem>
                  <SelectItem value="200">200L</SelectItem>
                  <SelectItem value="300">300L</SelectItem>
                  <SelectItem value="400">400L</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => {
                  const headers = ['Student Name', 'Reg No', 'Matric No', 'Level', 'Type', 'Amount (₦)', 'Status', 'Receipt No', 'Date'];
                  const rows = payments.map(p => [
                    p.student_name || '',
                    p.student_reg_no || '',
                    p.student_matric_no || '',
                    p.student_level ? `${p.student_level}L` : '',
                    p.type || '',
                    p.amount || 0,
                    p.status || '',
                    p.receipt_number || '',
                    p.created_date ? new Date(p.created_date).toLocaleDateString() : '',
                  ]);
                  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `nesa-payments-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download CSV
              </button>
            </div>

            <PaymentTable payments={filteredPayments} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-4">
            <SuggestionsList suggestions={suggestions} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="autoverify" className="mt-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <AutoVerifyPanel payments={payments} onRefresh={loadData} />
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="mt-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <AnnouncementBoard />
            </div>
          </TabsContent>

          <TabsContent value="notify" className="mt-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <NotifyUnpaidPanel students={students} payments={payments} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}