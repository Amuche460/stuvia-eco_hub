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
  LogOut, Shield, Users, Calendar, Megaphone, FileText, Bell, Loader2, Plus, X, CheckCircle, UserCheck
} from 'lucide-react';
import ApproveExecutivesPanel from '../components/executive/ApproveExecutivesPanel';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const ANNOUNCEMENT_POSTS = [
  "President","Vice President Male","Vice President Female","Senate President",
  "General Secretary","Assistant General Secretary","Academic Director","Assistant Academic Director"
];

export default function ExecutiveDashboard() {
  const [exec, setExec] = useState(null);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
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

  useEffect(() => {
    const eid = localStorage.getItem('nesa_executive_id');
    if (!eid) { window.location.href = createPageUrl('ExecutiveSignIn'); return; }
    loadAll(eid);
  }, []);

  const loadAll = async (eid) => {
    const [execs, studs, pays, anns, suggs] = await Promise.all([
      base44.entities.Executive.filter({ id: eid }),
      base44.entities.Student.list('full_name'),
      base44.entities.Payment.filter({ status: 'verified' }, '-created_date'),
      base44.entities.NesaAnnouncement.list('-created_date'),
      base44.entities.Suggestion.list('-created_date'),
    ]);
    if (!execs.length) { window.location.href = createPageUrl('ExecutiveSignIn'); return; }

    const execData = execs[0];
    // Check term expiry — delete expired executive
    if (new Date(execData.term_end_date) < new Date()) {
      await base44.entities.Executive.delete(execData.id);
      localStorage.removeItem('nesa_executive_id');
      window.location.href = createPageUrl('Home');
      return;
    }

    setExec(execData);
    setStudents(studs);
    setPayments(pays);
    setAnnouncements(anns);
    // Filter suggestions relevant to this exec's post/team
    setSuggestions(suggs);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('nesa_executive_id');
    window.location.href = createPageUrl('Home');
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

  const filteredStudents = students.filter(s => filterLevel === 'all' || s.level === filterLevel);
  const filteredPayments = payments.filter(p => {
    if (filterLevel !== 'all' && p.student_level !== filterLevel) return false;
    if (filterType !== 'all' && p.type !== filterType) return false;
    return true;
  });

  // Stats per level
  const levelStats = ['100','200','300','400'].map(lvl => ({
    level: lvl,
    dues: payments.filter(p => p.type === 'dues' && p.student_level === lvl).length,
    donations: payments.filter(p => p.type === 'donation' && p.student_level === lvl).length,
    students: students.filter(s => s.level === lvl).length,
  }));

  const canPostAnnouncement = ANNOUNCEMENT_POSTS.includes(exec?.post) ||
    exec?.post?.includes('Editor') || exec?.post?.includes('PRO');

  const isSuperExec = exec?.post === 'President' || exec?.post === 'Financial Secretary';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="animate-pulse text-purple-600">Loading executive portal...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-purple-100 z-50">
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
          <div className="mt-5 grid grid-cols-4 gap-2">
            {levelStats.map(l => (
              <div key={l.level} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-purple-200 text-[10px]">{l.level}L</p>
                <p className="font-bold text-sm">{l.dues} dues</p>
                <p className="text-purple-300 text-[10px]">{l.donations} donated</p>
              </div>
            ))}
          </div>
        </motion.div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {saved}
          </div>
        )}

        <Tabs defaultValue="database">
          <TabsList className="bg-gray-100 rounded-xl p-1 flex-wrap gap-1">
            <TabsTrigger value="database" className="rounded-lg text-xs"><Users className="w-3.5 h-3.5 mr-1" /> Student DB</TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg text-xs"><Megaphone className="w-3.5 h-3.5 mr-1" /> Announcements</TabsTrigger>
            <TabsTrigger value="forms" className="rounded-lg text-xs"><FileText className="w-3.5 h-3.5 mr-1" /> Forms & Polls</TabsTrigger>
            <TabsTrigger value="suggestions" className="rounded-lg text-xs"><Bell className="w-3.5 h-3.5 mr-1" /> Suggestions</TabsTrigger>
            {isSuperExec && (
              <TabsTrigger value="executives" className="rounded-lg text-xs bg-amber-50 data-[state=active]:bg-amber-100 text-amber-700">
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Executives
              </TabsTrigger>
            )}
          </TabsList>

          {/* Student Database */}
          <TabsContent value="database" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
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
                  <SelectItem value="dues">Dues Paid</SelectItem>
                  <SelectItem value="donation">Donated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Reg No</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Level</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPayments.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No records found</td></tr>
                    ) : filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.student_name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_reg_no}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{p.student_level}L</Badge></td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">₦{p.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={p.type === 'dues' ? 'bg-emerald-100 text-emerald-700 border-0 text-xs' : 'bg-rose-100 text-rose-700 border-0 text-xs'}>
                            {p.type === 'dues' ? 'Dues' : 'Donation'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

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

          {/* Approve Executives — President & Financial Secretary only */}
          {isSuperExec && (
            <TabsContent value="executives" className="mt-4">
              <ApproveExecutivesPanel />
            </TabsContent>
          )}

          {/* Suggestions relevant to exec's team */}
          <TabsContent value="suggestions" className="mt-4 space-y-3">
            {suggestions.filter(s => s.team === 'General NESA' || exec?.post?.toLowerCase().includes(s.team?.toLowerCase().split(' ')[0]?.toLowerCase())).length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No suggestions for your post yet.</div>
            ) : suggestions.map(s => (
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
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}