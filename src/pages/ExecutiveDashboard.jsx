import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  LogOut, Users, Calendar, Megaphone, FileText, Bell, Loader2, Plus, X, CheckCircle, UserCheck, ExternalLink, CreditCard, Trash2, Heart
} from 'lucide-react';
import ApproveExecutivesPanel from '../components/executive/ApproveExecutivesPanel';
import CashReceiptPanel from '../components/executive/CashReceiptPanel';
import ProofDialog from '../components/executive/ProofDialog';
import LoveFoundationDonationsPanel from '../components/executive/LoveFoundationDonationsPanel';
import FinanceStudentMenu from '@/components/executive/FinanceStudentMenu';
import { execSeesSuggestion } from '@/lib/suggestionTeams';
import { checkAllExecutiveTenures } from '@/lib/tenureNotifier';
import { checkAllBirthdays } from '@/lib/birthdayNotifier';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { academicSession } from '@/lib/duesCycle';
import { sessionPaymentQuery, paymentFilters, allPaymentPages } from '@/lib/sessionRecords';
import useFinancialRecords from '@/hooks/useFinancialRecords';
import AcademicSessionFilter from '@/components/payments/AcademicSessionFilter';
import FinancialRecordStatus from '@/components/payments/FinancialRecordStatus';
import DashboardSearchFields from '@/components/executive/DashboardSearchFields';
import useDashboardStudents from '@/hooks/useDashboardStudents';
import { dashboardSearch, levelFromSearch } from '@/lib/dashboardSearch';

// Only the General Secretary can post announcements
const ANNOUNCEMENT_POSTS = ["General Secretary"];

// Executives who can view the names of students who paid dues
const DUES_VIEWER_POSTS = [
  'President',
  'Vice President Female',
  'Vice President Male',
  'Financial Secretary',
  'Assistant Financial Secretary',
];

// Executives who can download the dues-payer list as PDF
const DUES_DOWNLOADER_POSTS = ['Financial Secretary', 'Assistant Financial Secretary'];

// Welfare executives who can view Love Foundation donation records & receipts
const WELFARE_POSTS = ['Welfare Director', 'Assistant Welfare Director'];

export default function ExecutiveDashboard() {
  const [exec, setExec] = useState(null);
  const [students, setStudents] = useState([]);
  const [session, setSession] = useState(academicSession);
  const [announcements, setAnnouncements] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showFormPoll, setShowFormPoll] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '', type: 'announcement' });
  const [pollForm, setPollForm] = useState({ title: '', content: '', form_url: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingStudentId, setDeletingStudentId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const canReadFinance = DUES_VIEWER_POSTS.includes(exec?.post);
  const isWelfareExec = WELFARE_POSTS.includes(exec?.post);
  const canReadDonations = isWelfareExec || exec?.post === 'Financial Secretary' || exec?.post === 'Assistant Financial Secretary';
  const searchFilters = dashboardSearch(searchQuery, filterLevel);
  const studentRecords = useDashboardStudents(searchFilters.level, searchFilters.search, canReadFinance);
  const records = useFinancialRecords(session, { status: 'verified', type: filterType, ...searchFilters, sort: 'student_name' }, canReadFinance);
  const duesRecords = useFinancialRecords(session, { status: 'verified', type: 'dues', ...searchFilters, sort: 'student_name' }, canReadFinance && filterType !== 'donation');
  const donationRecords = useFinancialRecords(session, { status: 'verified', type: 'donation', ...searchFilters, sort: 'student_name' }, canReadDonations);
  const searchFields = {
    search: searchQuery, level: filterLevel,
    onSearch: value => { setSearchQuery(value); if (levelFromSearch(value)) setFilterLevel('all'); },
    onLevel: value => { setFilterLevel(value); if (levelFromSearch(searchQuery)) setSearchQuery(''); },
  };
  const payments = records.payments;
  const duesPayments = filterType === 'donation' ? [] : duesRecords.payments;

  useEffect(() => {
    const eid = localStorage.getItem('nesa_executive_id');
    if (!eid) { window.location.href = createPageUrl('ExecutiveSignIn'); return; }
    loadAll(eid);
  }, []);

  const loadAll = async (eid) => {
    const execs = await base44.entities.Executive.filter({ id: eid });
    if (!execs.length) { window.location.href = createPageUrl('ExecutiveSignIn'); return; }

    const execData = execs[0];
    // Check term expiry — delete expired executive
    if (new Date(execData.term_end_date) < new Date()) {
      await base44.entities.Executive.delete(execData.id);
      localStorage.removeItem('nesa_executive_id');
      window.location.href = createPageUrl('Home');
      return;
    }

    // Bridge student session for seamless portal access
    if (execData.student_id) {
      localStorage.setItem('nesa_student_id', execData.student_id);
    } else {
      let matchingStudents = [];
      if (execData.reg_no) {
        matchingStudents = await base44.entities.Student.filter({ reg_no: execData.reg_no });
      }
      if (matchingStudents.length === 0 && execData.matric_no) {
        matchingStudents = await base44.entities.Student.filter({ matric_no: execData.matric_no });
      }
      if (matchingStudents.length > 0) {
        await base44.entities.Executive.update(execData.id, { student_id: matchingStudents[0].id });
        execData.student_id = matchingStudents[0].id;
        localStorage.setItem('nesa_student_id', matchingStudents[0].id);
      }
    }

    const canViewDues = DUES_VIEWER_POSTS.includes(execData.post);

    const [anns, suggs, studs] = await Promise.all([
      base44.entities.NesaAnnouncement.list('-created_date'),
      base44.entities.Suggestion.list('-created_date'),
      canViewDues ? base44.entities.Student.filter({}, { sort: 'full_name', limit: 1000 }).then(p => p.items) : Promise.resolve([]),

    ]);

    setExec(execData);
    setStudents(studs);
    setAnnouncements(anns);
    setSuggestions(suggs);
    setLoading(false);

    // Fire tenure-end reminders for all executives (non-blocking)
    checkAllExecutiveTenures();
    if (studs.length > 0) checkAllBirthdays(studs);
  };

  const studentUpdated = (updated) => { setStudents(prev => prev.map(s => s.id === updated.id ? updated : s)); studentRecords.refresh(); };
  const studentDeleted = (id) => { setStudents(prev => prev.filter(s => s.id !== id)); setSelectedIds(prev => prev.filter(x => x !== id)); studentRecords.refresh(); };

  const handleLogout = () => {
    localStorage.removeItem('nesa_executive_id');
    localStorage.removeItem('nesa_student_id');
    localStorage.removeItem('nesa_is_admin');
    window.location.href = createPageUrl('Home');
  };

  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = [...selectedIds];
    const results = await Promise.allSettled(ids.map(id => base44.entities.Student.delete(id)));
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    setStudents(prev => prev.filter(s => !deletedIds.includes(s.id)));
    await studentRecords.refresh();
    setSelectedIds([]);
    setBulkConfirm(false);
    setBulkDeleting(false);
    setSaved(deletedIds.length === ids.length
      ? `${deletedIds.length} student record(s) deleted.`
      : `${deletedIds.length} deleted, ${ids.length - deletedIds.length} failed. Please try again.`);
    setTimeout(() => setSaved(''), 3000);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await base44.entities.Student.delete(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      await studentRecords.refresh();
      setDeletingStudentId('');
      setSaved('Student record deleted.');
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setSaved('Could not delete student record. Please try again.');
      setTimeout(() => setSaved(''), 3000);
      setDeletingStudentId('');
    }
  };

  const handlePostAnnouncement = async () => {
    if (!annForm.title || !annForm.content) return;
    setSaving(true);
    await base44.entities.NesaAnnouncement.create({
      ...annForm,
      posted_by: exec.post,
      posted_by_name: exec.full_name,
    });
    await base44.entities.NesaNotification.create({
      title: `New Announcement: ${annForm.title}`,
      message: `${exec.post} has posted: "${annForm.title}"`,
      type: 'announcement',
      is_read_by: [],
    });
    setAnnForm({ title: '', content: '', type: 'announcement' });
    setShowAnnouncementForm(false);
    setSaved('Announcement posted!');
    setTimeout(() => setSaved(''), 3000);
    setSaving(false);
    loadAll(exec.id);
  };

  const handlePostFormPoll = async () => {
    if (!pollForm.title || !pollForm.form_url) return;
    setSaving(true);
    await base44.entities.NesaAnnouncement.create({
      title: pollForm.title,
      content: pollForm.content || `Fill out this form/poll posted by ${exec.post}`,
      type: 'form_poll',
      form_url: pollForm.form_url,
      posted_by: exec.post,
      posted_by_name: exec.full_name,
    });
    await base44.entities.NesaNotification.create({
      title: `New Form/Poll: ${pollForm.title}`,
      message: `${exec.post} has posted a new form or poll. Click to participate.`,
      type: 'announcement',
      is_read_by: [],
    });
    setPollForm({ title: '', content: '', form_url: '' });
    setShowFormPoll(false);
    setSaved('Form/Poll posted!');
    setTimeout(() => setSaved(''), 3000);
    setSaving(false);
    loadAll(exec.id);
  };

  const filteredStudents = studentRecords.students;
  const filteredPayments = payments;

  // Stats per level
  const levelStats = ['100','200','300','400'].map(lvl => ({
    level: lvl,
    dues: records.summary.rows.find(r => r.status === 'verified' && r.type === 'dues' && r.student_level === lvl)?.count || 0,
    donations: records.summary.rows.find(r => r.status === 'verified' && r.type === 'donation' && r.student_level === lvl)?.count || 0,
    students: students.filter(s => s.level === lvl).length,
  }));

  const canPostAnnouncement = exec?.post === 'General Secretary';

  const isSuperExec = exec?.post === 'President' || exec?.post === 'Financial Secretary';

  const isFinExec = exec?.post === 'Financial Secretary' || exec?.post === 'Assistant Financial Secretary';

  const canViewDuesPayers = DUES_VIEWER_POSTS.includes(exec?.post);
  const canDownloadDuesPayers = DUES_DOWNLOADER_POSTS.includes(exec?.post);
  const canViewDonations = isWelfareExec || isFinExec;

  const handleDownloadDuesPDF = async () => {
    const duesPayers = filterType === 'donation' ? [] : await allPaymentPages(sessionPaymentQuery(session, paymentFilters({ status: 'verified', type: 'dues', ...searchFilters })), { sort: 'student_name' });
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`NESA — Dues Payers ${session}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${format(new Date(), 'MMM d, yyyy')} • ${duesPayers.length} payer(s)`, 14, 27);
    doc.setTextColor(0);
    let y = 38;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    ['Name', 'Reg No', 'Matric', 'Level', 'Amount', 'Receipt No', 'Date'].forEach((h, i) => doc.text(h, 14 + i * 27, y));
    doc.setFont(undefined, 'normal');
    y += 6;
    duesPayers.forEach(p => {
      if (y > 280) { doc.addPage(); y = 20; }
      const row = [
        (p.student_name || '').slice(0, 22),
        (p.student_reg_no || '').slice(0, 14),
        (p.student_matric_no || '').slice(0, 14),
        (p.student_level || '') + 'L',
        'N' + (p.amount?.toLocaleString() || 0),
        (p.receipt_number || '').slice(0, 12),
        p.verified_at ? format(new Date(p.verified_at), 'MMM d, yyyy') : '-',
      ];
      row.forEach((cell, i) => doc.text(String(cell), 14 + i * 27, y));
      y += 6;
    });
    doc.save(`NESA_Dues_Payers_${session.replace('/', '-')}.pdf`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="animate-pulse text-purple-600">Loading executive portal...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      <header className="sticky top-0 pt-safe bg-white/90 backdrop-blur-xl border-b border-purple-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NesaLogo size="sm" />
            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">{exec?.post}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {exec?.student_id && (
              <Link to={createPageUrl('StudentDashboard')}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs border-emerald-200 text-emerald-700">
                  Student Portal
                </Button>
              </Link>
            )}
            <Link to={createPageUrl('NesaCalendar')} onClick={() => localStorage.setItem('nesa_is_admin', 'true')}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs border-purple-200 text-purple-700">
                <Calendar className="w-3.5 h-3.5 mr-1" /> Calendar
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {(canViewDuesPayers || canViewDonations) && <AcademicSessionFilter value={session} onChange={setSession} />}
        {/* Exec Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-700 to-purple-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
              {exec?.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{exec?.full_name}</h2>
              <p className="text-purple-200 text-sm">{exec?.post} • {exec?.level}L</p>
              <p className="text-purple-300 text-xs mt-0.5">Term ends: {exec?.term_end_date ? format(new Date(exec.term_end_date), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
          </div>

          {/* Level stats */}
          {canViewDuesPayers && (
            <div className="mt-5 grid grid-cols-4 gap-2">
              {levelStats.map(l => (
                <div key={l.level} className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-purple-200 text-[10px]">{l.level}L</p>
                  <p className="font-bold text-sm">{l.dues} dues</p>
                  <p className="text-purple-300 text-[10px]">{l.donations} donated</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {saved}
          </div>
        )}

        <Tabs defaultValue={canViewDuesPayers ? 'database' : isWelfareExec ? 'donations' : 'announcements'}>
          <TabsList className="bg-gray-100 rounded-xl p-1 flex-wrap gap-1">
            {canViewDuesPayers && (
              <TabsTrigger value="database" className="rounded-lg text-xs"><Users className="w-3.5 h-3.5 mr-1" /> Student DB</TabsTrigger>
            )}
            <TabsTrigger value="announcements" className="rounded-lg text-xs"><Megaphone className="w-3.5 h-3.5 mr-1" /> Announcements</TabsTrigger>
            {canViewDuesPayers && (
              <TabsTrigger value="forms" className="rounded-lg text-xs"><FileText className="w-3.5 h-3.5 mr-1" /> Forms & Polls</TabsTrigger>
            )}
            <TabsTrigger value="suggestions" className="rounded-lg text-xs"><Bell className="w-3.5 h-3.5 mr-1" /> Suggestions</TabsTrigger>
            {isFinExec && (
              <TabsTrigger value="payments" className="rounded-lg text-xs bg-emerald-50 data-[state=active]:bg-emerald-100 text-emerald-700">
                <CreditCard className="w-3.5 h-3.5 mr-1" /> Dues & Payments
              </TabsTrigger>
            )}
            {canViewDonations && (
              <TabsTrigger value="donations" className="rounded-lg text-xs bg-rose-50 data-[state=active]:bg-rose-100 text-rose-700">
                <Heart className="w-3.5 h-3.5 mr-1" /> Love Foundation
              </TabsTrigger>
            )}
            {isSuperExec && (
              <TabsTrigger value="executives" className="rounded-lg text-xs bg-amber-50 data-[state=active]:bg-amber-100 text-amber-700">
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Executives
              </TabsTrigger>
            )}
          </TabsList>

          {/* Student Database */}
          {canViewDuesPayers && (
          <TabsContent value="database" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <DashboardSearchFields {...searchFields} />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="dues">Dues Paid</SelectItem>
                  <SelectItem value="donation">Donated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FinancialRecordStatus records={records} />
            {/* Student Profiles Matching Search */}
            {studentRecords.loading && <p className="text-sm text-muted-foreground">Loading students...</p>}
            {studentRecords.error && <p role="alert" className="text-sm text-destructive">Could not load students. <button className="underline" onClick={studentRecords.refresh}>Retry</button></p>}
            {!studentRecords.loading && !studentRecords.error && filteredStudents.length === 0 && <p className="text-sm text-muted-foreground">No students match this search or level.</p>}
            {studentRecords.hasMore && <Button variant="outline" disabled={studentRecords.loadingMore} onClick={studentRecords.loadMore}>{studentRecords.loadingMore ? 'Loading...' : 'Load more students'}</Button>}
            {filteredStudents.length > 0 && (
              <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-purple-700">Students ({studentRecords.total})</p>
                    {isFinExec && selectedIds.length > 0 && (
                      bulkConfirm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">Delete {selectedIds.length} record(s)?</span>
                          <Button size="sm" disabled={bulkDeleting} onClick={handleBulkDelete}
                            className="h-7 text-xs bg-red-600 hover:bg-red-700 rounded-lg">
                            {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                          </Button>
                          <Button size="sm" variant="outline" disabled={bulkDeleting} onClick={() => setBulkConfirm(false)}
                            className="h-7 text-xs rounded-lg">Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setBulkConfirm(true)}
                          className="h-7 text-xs bg-red-600 hover:bg-red-700 rounded-lg">
                          <Trash2 className="w-3 h-3 mr-1" /> Delete selected ({selectedIds.length})
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {isFinExec && (
                          <th className="px-4 py-2.5 w-8">
                            <input type="checkbox" className="w-4 h-4 accent-purple-700"
                              checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.includes(s.id))}
                              onChange={e => setSelectedIds(e.target.checked ? filteredStudents.map(s => s.id) : [])} />
                          </th>
                        )}
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Reg No</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Level</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Course</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Dues</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStudents.map(s => {
                        const hasDues = records.summary.paidIds.includes(s.id);
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            {isFinExec && (
                              <td className="px-4 py-3">
                                <input type="checkbox" className="w-4 h-4 accent-purple-700"
                                  checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                              </td>
                            )}
                            <td className="px-4 py-3 font-medium text-gray-900">{isFinExec ? <FinanceStudentMenu studentId={s.id} name={s.full_name} onUpdated={studentUpdated} onDeleted={studentDeleted} /> : s.full_name}</td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.reg_no}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{s.level}L</Badge></td>
                            <td className="px-4 py-3 text-xs text-gray-500">{s.course_of_study || '—'}</td>
                            <td className="px-4 py-3">
                              <Badge className={hasDues ? 'bg-emerald-100 text-emerald-700 border-0 text-xs' : 'bg-red-50 text-red-600 border-0 text-xs'}>
                                {hasDues ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Link to={createPageUrl('StudentProfileDetail') + '?id=' + s.id}
                                  className="text-xs text-purple-700 font-medium hover:underline inline-flex items-center gap-1">
                                  View <ExternalLink className="w-3 h-3" />
                                </Link>
                                {isFinExec && (
                                  deletingStudentId === s.id ? (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleDeleteStudent(s.id)}
                                        className="text-xs text-red-600 font-medium hover:underline">
                                        Confirm
                                      </button>
                                      <button onClick={() => setDeletingStudentId('')}
                                        className="text-xs text-gray-500 hover:underline">
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setDeletingStudentId(s.id)}
                                      className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1">
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600">Payments ({records.total})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Reg No</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Level</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Amount</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Type</th>
                      {isFinExec && <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Proof</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPayments.length === 0 ? (
                      <tr><td colSpan={isFinExec ? 6 : 5} className="text-center py-8 text-gray-400 text-sm">No records found</td></tr>
                    ) : filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{isFinExec ? <FinanceStudentMenu studentId={p.student_id} name={students.find(s => s.id === p.student_id)?.full_name || p.student_name} onUpdated={studentUpdated} onDeleted={studentDeleted} /> : p.student_name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_reg_no}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{p.student_level}L</Badge></td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">₦{p.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={p.type === 'dues' ? 'bg-emerald-100 text-emerald-700 border-0 text-xs' : 'bg-rose-100 text-rose-700 border-0 text-xs'}>
                            {p.type === 'dues' ? 'Dues' : 'Donation'}
                          </Badge>
                          </td>
                          {isFinExec && (
                            <td className="px-4 py-3">
                              {p.proof_url ? (
                                <button type="button" onClick={() => setProofUrl(p.proof_url)} className="text-xs text-emerald-700 font-medium hover:underline inline-flex items-center gap-1">
                                  View <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : '—'}
                            </td>
                          )}
                          </tr>
                          ))}
                          </tbody>
                          </table>
                          </div>
                          </div>
                          </TabsContent>
                          )}

                          {/* Announcements */}
          <TabsContent value="announcements" className="mt-4 space-y-4">
            {canPostAnnouncement && (
              <Button onClick={() => setShowAnnouncementForm(true)} className="bg-purple-700 hover:bg-purple-800 rounded-xl text-sm">
                <Plus className="w-4 h-4 mr-1" /> New Announcement
              </Button>
            )}

            {showAnnouncementForm && (
              <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Post Announcement</h3>
                  <button onClick={() => setShowAnnouncementForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Type</Label>
                  <Select value={annForm.type} onValueChange={v => setAnnForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1 rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="editorial">Editorial</SelectItem>
                      <SelectItem value="magazine">NESA Magazine</SelectItem>
                      <SelectItem value="weekly_update">Weekly Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Title</Label>
                  <Input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Announcement title" className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Content</Label>
                  <textarea value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Write your announcement..." rows={4}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <Button onClick={handlePostAnnouncement} disabled={saving || !annForm.title || !annForm.content}
                  className="bg-purple-700 hover:bg-purple-800 rounded-xl w-full h-10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Announcement'}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {announcements.filter(a => a.type !== 'form_poll').length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No announcements yet.</div>
              ) : announcements.filter(a => a.type !== 'form_poll').map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge className="bg-purple-50 text-purple-700 border-0 text-xs mb-1">{a.type?.replace('_', ' ')}</Badge>
                      <h4 className="font-semibold text-gray-900 text-sm">{a.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">By {a.posted_by_name} • {a.posted_by} • {format(new Date(a.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Forms & Polls */}
          {canViewDuesPayers && (
          <TabsContent value="forms" className="mt-4 space-y-4">
            <Button onClick={() => setShowFormPoll(true)} className="bg-purple-700 hover:bg-purple-800 rounded-xl text-sm">
              <Plus className="w-4 h-4 mr-1" /> Post Form / Poll
            </Button>

            {showFormPoll && (
              <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Post Form or Poll</h3>
                  <button onClick={() => setShowFormPoll(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Title *</Label>
                  <Input value={pollForm.title} onChange={e => setPollForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. NESA Week Survey 2026" className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Google Form / Poll Link *</Label>
                  <Input value={pollForm.form_url} onChange={e => setPollForm(f => ({ ...f, form_url: e.target.value }))}
                    placeholder="https://forms.google.com/..." className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Description (optional)</Label>
                  <Input value={pollForm.content} onChange={e => setPollForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Brief description" className="mt-1 rounded-xl h-10" />
                </div>
                <Button onClick={handlePostFormPoll} disabled={saving || !pollForm.title || !pollForm.form_url}
                  className="bg-purple-700 hover:bg-purple-800 rounded-xl w-full h-10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Form / Poll'}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {announcements.filter(a => a.type === 'form_poll').length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No forms or polls posted yet.</div>
              ) : announcements.filter(a => a.type === 'form_poll').map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <h4 className="font-semibold text-gray-900 text-sm">{a.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{a.content}</p>
                  <a href={a.form_url} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-purple-700 font-medium underline">{a.form_url}</a>
                  <p className="text-xs text-gray-400 mt-2">By {a.posted_by_name} • {format(new Date(a.created_date), 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          )}

          {/* Dues & Payments — Financial Secretary & Assistant Financial Secretary */}
          {isFinExec && (
            <TabsContent value="payments" className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2 items-center"><DashboardSearchFields {...searchFields} /></div>
              <FinancialRecordStatus records={duesRecords} />
              <div className="flex flex-wrap gap-2">
                {canDownloadDuesPayers && (
                  <Button onClick={handleDownloadDuesPDF} className="bg-emerald-700 hover:bg-emerald-800 rounded-xl text-sm">
                    <FileText className="w-4 h-4 mr-1" /> Download Dues Payers (PDF)
                  </Button>
                )}
                <CashReceiptPanel
                  students={students}
                  exec={exec}
                  onIssued={() => records.refresh()}
                />
              </div>
              <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700">Verified Dues Payments ({filterType === 'donation' ? 0 : duesRecords.total}) · {session}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Reg No</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Matric</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Level</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Amount</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Receipt No</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Date</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {duesPayments.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No dues payments yet</td></tr>
                      ) : duesPayments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{isFinExec ? <FinanceStudentMenu studentId={p.student_id} name={students.find(s => s.id === p.student_id)?.full_name || p.student_name} onUpdated={studentUpdated} onDeleted={studentDeleted} /> : p.student_name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_reg_no || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_matric_no || '—'}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{p.student_level}L</Badge></td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">₦{p.amount?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.receipt_number || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{p.verified_at ? format(new Date(p.verified_at), 'MMM d, yyyy') : '—'}</td>
                          <td className="px-4 py-3">
                            {p.proof_url ? (
                              <button type="button" onClick={() => setProofUrl(p.proof_url)} className="text-xs text-emerald-700 font-medium hover:underline inline-flex items-center gap-1">
                                View <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Love Foundation Donations — Welfare Director, Assistant Welfare Director, Financial Secretary & Assistant Financial Secretary */}
          {canViewDonations && (
            <TabsContent value="donations" className="mt-4">
              <LoveFoundationDonationsPanel
                session={session}
                donationRecords={donationRecords}
                searchFields={searchFields}
                onViewReceipt={setProofUrl}
              />
            </TabsContent>
          )}

          {/* Approve Executives — President & Financial Secretary only */}
          {isSuperExec && (
            <TabsContent value="executives" className="mt-4">
              <ApproveExecutivesPanel />
            </TabsContent>
          )}

          {/* Suggestions relevant to exec's team */}
          <TabsContent value="suggestions" className="mt-4 space-y-3">
            {(() => {
              const visible = suggestions.filter(s => execSeesSuggestion(exec?.post, s.team));
              if (visible.length === 0) {
                return <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No suggestions for your post yet.</div>;
              }
              return visible.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-amber-50 text-amber-700 border-0 text-xs mb-1">{s.team}</Badge>
                    <h4 className="font-semibold text-gray-900 text-sm">{s.subject}</h4>
                    <p className="text-xs text-gray-500 mt-1">{s.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{s.is_anonymous ? 'Anonymous' : s.student_name} • {format(new Date(s.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  <Badge className={s.status === 'new' ? 'bg-red-50 text-red-600 text-xs border-0' : s.status === 'reviewed' ? 'bg-amber-50 text-amber-700 text-xs border-0' : 'bg-emerald-50 text-emerald-700 text-xs border-0'}>
                    {s.status}
                  </Badge>
                </div>
              </div>
              ));
            })()}
          </TabsContent>
        </Tabs>
      </div>

      <ProofDialog url={proofUrl} onClose={() => setProofUrl('')} />
    </div>
  );
}