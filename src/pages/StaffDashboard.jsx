import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, BookOpen, Users, Calendar, Bell, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { academicSession } from '@/lib/duesCycle';
import useFinancialRecords from '@/hooks/useFinancialRecords';
import AcademicSessionFilter from '@/components/payments/AcademicSessionFilter';
import FinancialRecordStatus from '@/components/payments/FinancialRecordStatus';

export default function StaffDashboard() {
  const [staff, setStaff] = useState(null);
  const [students, setStudents] = useState([]);
  const [session, setSession] = useState(academicSession);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const records = useFinancialRecords(session, { status: 'verified', level: filterLevel, type: filterType }, Boolean(staff));

  useEffect(() => {
    const sid = localStorage.getItem('nesa_staff_id');
    if (!sid) { window.location.href = createPageUrl('StaffSignIn'); return; }
    loadAll(sid);
  }, []);

  const loadAll = async (sid) => {
    const [staffList, studs, notifs, evts] = await Promise.all([
      base44.entities.Staff.filter({ id: sid }),
      base44.entities.Student.list('full_name'),

      base44.entities.NesaNotification.list('-created_date', 20),
      base44.entities.NesaEvent.list('event_date'),
    ]);
    if (!staffList.length) { window.location.href = createPageUrl('StaffSignIn'); return; }
    setStaff(staffList[0]);
    setStudents(studs);
    setNotifications(notifs);
    setEvents(evts.filter(e => new Date(e.event_date) >= new Date()));
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('nesa_staff_id');
    window.location.href = createPageUrl('Home');
  };

  const levelStats = ['100','200','300','400'].map(lvl => ({
    level: lvl,
    total: students.filter(s => s.level === lvl).length,
    dues: records.summary.rows.find(r => r.status === 'verified' && r.type === 'dues' && r.student_level === lvl)?.count || 0,
    donations: records.summary.rows.find(r => r.status === 'verified' && r.type === 'donation' && r.student_level === lvl)?.count || 0,
  }));

  const filteredPayments = records.payments;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="animate-pulse text-blue-600">Loading staff portal...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="sticky top-0 pt-safe bg-white/90 backdrop-blur-xl border-b border-blue-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NesaLogo size="sm" />
            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Staff</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
            <LogOut className="w-4 h-4 mr-1" /> Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <AcademicSessionFilter value={session} onChange={setSession} />
        {/* Staff Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
              {staff?.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{staff?.full_name}</h2>
              <p className="text-blue-200 text-sm">{staff?.department || 'Economics Department'} • Staff</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {levelStats.map(l => (
              <div key={l.level} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-blue-200 text-[10px]">{l.level}L</p>
                <p className="font-bold">{l.total}</p>
                <p className="text-blue-300 text-[10px]">{l.dues} dues · {l.donations} donated</p>
              </div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="database">
          <TabsList className="bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="database" className="rounded-lg text-xs"><Users className="w-3.5 h-3.5 mr-1" /> Student DB</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg text-xs"><Bell className="w-3.5 h-3.5 mr-1" /> Notifications</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg text-xs"><Calendar className="w-3.5 h-3.5 mr-1" /> Calendar</TabsTrigger>
          </TabsList>

          {/* Student Database */}
          <TabsContent value="database" className="mt-4 space-y-4">
            <FinancialRecordStatus records={records} />
            <div className="flex gap-2">
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-28 rounded-xl border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {['100','200','300','400'].map(l => <SelectItem key={l} value={l}>{l}L</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="dues">Dues</SelectItem>
                  <SelectItem value="donation">Donations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Reg No</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Matric</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Level</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Receipt No</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPayments.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No records found</td></tr>
                    ) : filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.student_name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_reg_no || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_matric_no || '—'}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{p.student_level}L</Badge></td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">₦{p.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={p.type === 'dues' ? 'bg-emerald-100 text-emerald-700 border-0 text-xs' : 'bg-rose-100 text-rose-700 border-0 text-xs'}>
                            {p.type === 'dues' ? 'Dues' : 'Donation'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.receipt_number || '—'}</td>
                        <td className="px-4 py-3">
                          {p.proof_url ? (
                            <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 font-medium hover:underline inline-flex items-center gap-1">
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No notifications.</div>
            ) : notifications.map(n => (
              <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_date), 'MMM d, yyyy • h:mm a')}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendar" className="mt-4 space-y-3">
            <p className="text-sm text-gray-500 mb-2">Upcoming NESA Events</p>
            {events.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No upcoming events.</div>
            ) : events.map(e => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{e.title}</p>
                  <p className="text-xs text-gray-500">{format(new Date(e.event_date), 'MMMM d, yyyy')}{e.event_time ? ` • ${e.event_time}` : ''}</p>
                  {e.location && <p className="text-xs text-gray-400">{e.location}</p>}
                  <Badge variant="outline" className="text-xs mt-1">{e.team}</Badge>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}