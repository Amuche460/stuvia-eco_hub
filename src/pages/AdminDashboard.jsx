import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import StatCard from '../components/dashboard/StatCard';
import PaymentTable from '../components/admin/PaymentTable';
import SuggestionsList from '../components/admin/SuggestionsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, Heart, Users, CreditCard, MessageSquare,
  BarChart3, Receipt, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/pages/utils';

const LEVEL_COLORS = {
  '100': '#10b981',
  '200': '#3b82f6',
  '300': '#f59e0b',
  '400': '#ef4444',
};

export default function AdminDashboard() {
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

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterLevel !== 'all' && p.student_level !== filterLevel) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-pulse text-emerald-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NesaLogo size="sm" />
            <div className="hidden sm:block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Admin
            </div>
          </div>
          <Link to={createPageUrl('Home')}>
            <span className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Portal
            </span>
          </Link>
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
            </div>

            <PaymentTable payments={filteredPayments} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-4">
            <SuggestionsList suggestions={suggestions} onRefresh={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}