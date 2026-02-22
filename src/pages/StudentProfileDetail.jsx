import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Calendar, CheckCircle, Clock, Edit2, Save, X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export default function StudentProfileDetail() {
  const [student, setStudent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { window.location.href = createPageUrl('StudentProfiles'); return; }
    loadData(id);
  }, []);

  const loadData = async (id) => {
    const [students, regs, evts] = await Promise.all([
      base44.entities.Student.filter({ id }),
      base44.entities.EventRegistration.filter({ student_id: id }),
      base44.entities.NesaEvent.list('event_date'),
    ]);
    if (students.length === 0) { window.location.href = createPageUrl('StudentProfiles'); return; }
    setStudent(students[0]);
    setEditForm(students[0]);
    setRegistrations(regs);
    setEvents(evts);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Student.update(student.id, {
      full_name: editForm.full_name,
      reg_no: editForm.reg_no,
      matric_no: editForm.matric_no,
      level: editForm.level,
      course_of_study: editForm.course_of_study,
      year_of_entry: editForm.year_of_entry,
      email: editForm.email,
      phone: editForm.phone,
      dues_paid: editForm.dues_paid,
    });
    setStudent(prev => ({ ...prev, ...editForm }));
    setEditing(false);
    setSaving(false);
  };

  const registeredEvents = events.filter(e => registrations.some(r => r.event_id === e.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-emerald-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('StudentProfiles')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <NesaLogo size="sm" />
            <div className="hidden sm:block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Admin</div>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => { setEditing(false); setEditForm(student); }} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl gap-1.5" style={{ background: '#1a6b62' }}>
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {student.profile_picture_url
                ? <img src={student.profile_picture_url} alt="" className="w-full h-full object-cover" />
                : student.full_name?.charAt(0)
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student.full_name}</h1>
              <p className="text-emerald-200 text-sm mt-0.5">{student.level}L • {student.reg_no}</p>
              {student.course_of_study && <p className="text-emerald-300 text-xs mt-0.5">{student.course_of_study}</p>}
              <div className="flex items-center gap-2 mt-2">
                {student.dues_paid
                  ? <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Dues Paid</span>
                  : <span className="text-xs bg-amber-400/30 rounded-full px-2.5 py-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />Dues Unpaid</span>
                }
              </div>
            </div>
          </div>
        </motion.div>

        {/* Student Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            Student Details
          </h2>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Full Name</Label>
                  <Input value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Level</Label>
                  <Select value={editForm.level} onValueChange={v => setEditForm(f => ({ ...f, level: v }))}>
                    <SelectTrigger className="mt-1 rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['100','200','300','400'].map(l => <SelectItem key={l} value={l}>{l}L</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Reg Number</Label>
                  <Input value={editForm.reg_no || ''} onChange={e => setEditForm(f => ({ ...f, reg_no: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Matric Number</Label>
                  <Input value={editForm.matric_no || ''} onChange={e => setEditForm(f => ({ ...f, matric_no: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <Input value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Phone</Label>
                  <Input value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Course of Study</Label>
                  <Input value={editForm.course_of_study || ''} onChange={e => setEditForm(f => ({ ...f, course_of_study: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Year of Entry</Label>
                  <Input value={editForm.year_of_entry || ''} onChange={e => setEditForm(f => ({ ...f, year_of_entry: e.target.value }))} className="mt-1 rounded-xl h-10" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="dues_paid"
                  checked={editForm.dues_paid || false}
                  onChange={e => setEditForm(f => ({ ...f, dues_paid: e.target.checked }))}
                  className="w-4 h-4 accent-teal-700"
                />
                <Label htmlFor="dues_paid" className="text-sm text-gray-700 cursor-pointer">Mark dues as paid</Label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: 'Full Name', val: student.full_name },
                { label: 'Level', val: `${student.level}L` },
                { label: 'Reg Number', val: student.reg_no },
                { label: 'Matric Number', val: student.matric_no || '—' },
                { label: 'Email', val: student.email },
                { label: 'Phone', val: student.phone },
                { label: 'Course of Study', val: student.course_of_study || '—' },
                { label: 'Year of Entry', val: student.year_of_entry || '—' },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Registered Events */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            Registered Events
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">{registeredEvents.length}</Badge>
          </h2>
          {registeredEvents.length === 0 ? (
            <p className="text-gray-400 text-sm">Not registered for any events yet.</p>
          ) : (
            <div className="space-y-2">
              {registeredEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{event.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{format(parseISO(event.event_date), 'MMM d, yyyy')}{event.event_time ? ` • ${event.event_time}` : ''}</span>
                      {event.location && <span className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{event.location}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{event.team}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 flex-shrink-0">Registered</Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}