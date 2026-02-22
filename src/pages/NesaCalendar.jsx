import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Calendar, MapPin, Clock, Trash2, X, ChevronLeft, ChevronRight, Users, CheckCircle2, Loader2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import EventAttendanceModal from '../components/calendar/EventAttendanceModal';

const COLOR_CLASSES = {
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  blue:    { bg: 'bg-blue-500',    light: 'bg-blue-50 border-blue-200 text-blue-700',          dot: 'bg-blue-500'    },
  amber:   { bg: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200 text-amber-700',        dot: 'bg-amber-500'   },
  rose:    { bg: 'bg-rose-500',    light: 'bg-rose-50 border-rose-200 text-rose-700',           dot: 'bg-rose-500'    },
  purple:  { bg: 'bg-purple-500',  light: 'bg-purple-50 border-purple-200 text-purple-700',     dot: 'bg-purple-500'  },
  teal:    { bg: 'bg-teal-500',    light: 'bg-teal-50 border-teal-200 text-teal-700',           dot: 'bg-teal-500'    },
};

export default function NesaCalendar() {
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', event_time: '', location: '', team: 'General NESA', color: 'emerald', requires_rsvp: false });
  const [studentId, setStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [registrations, setRegistrations] = useState([]); // current student's registrations
  const [rsvpLoading, setRsvpLoading] = useState(null); // event id being rsvp'd
  const [attendanceEvent, setAttendanceEvent] = useState(null); // admin attendance modal
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterColor, setFilterColor] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const adminFlag = localStorage.getItem('nesa_is_admin');
    setIsAdmin(adminFlag === 'true');
    const sid = localStorage.getItem('nesa_student_id');
    if (sid) {
      setStudentId(sid);
      loadStudentAndRegistrations(sid);
    }
    loadEvents();
  }, []);

  const loadStudentAndRegistrations = async (sid) => {
    const [students, regs] = await Promise.all([
      base44.entities.Student.filter({ id: sid }),
      base44.entities.EventRegistration.filter({ student_id: sid }),
    ]);
    if (students.length > 0) setStudentData(students[0]);
    setRegistrations(regs);
  };

  const handleRsvp = async (event) => {
    if (!studentId || !studentData) return;
    const alreadyRegistered = registrations.some(r => r.event_id === event.id);
    if (alreadyRegistered) return;
    setRsvpLoading(event.id);
    const reg = await base44.entities.EventRegistration.create({
      event_id: event.id,
      event_title: event.title,
      student_id: studentId,
      student_name: studentData.full_name,
      student_reg_no: studentData.reg_no,
      student_level: studentData.level,
    });
    setRegistrations(prev => [...prev, reg]);
    setRsvpLoading(null);
  };

  const loadEvents = async () => {
    const evts = await base44.entities.NesaEvent.list('event_date');
    setEvents(evts);
    setLoading(false);
  };

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startWeekday = startOfMonth(currentMonth).getDay();

  const eventsOnDay = (day) => events.filter(e => {
    try { return isSameDay(parseISO(e.event_date), day); } catch { return false; }
  });

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  const handleSave = async () => {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    const newEvent = await base44.entities.NesaEvent.create(form);
    // Also create a notification
    await base44.entities.NesaNotification.create({
      title: `New Event: ${form.title}`,
      message: `${form.team} has scheduled "${form.title}" on ${format(parseISO(form.event_date), 'MMMM d, yyyy')}${form.location ? ` at ${form.location}` : ''}.`,
      type: 'event',
      is_read_by: [],
    });
    setEvents(prev => [...prev, newEvent]);
    setForm({ title: '', description: '', event_date: '', event_time: '', location: '', team: 'General NESA', color: 'emerald' });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.NesaEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const upcomingEvents = events
    .filter(e => { try { return parseISO(e.event_date) >= new Date(); } catch { return false; } })
    .slice(0, 5);

  // Filtered events for search results view
  const hasActiveFilter = searchQuery || filterTeam !== 'all' || filterColor !== 'all' || filterDateFrom || filterDateTo;
  const filteredEvents = hasActiveFilter ? events.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
    const matchTeam = filterTeam === 'all' || e.team === filterTeam;
    const matchColor = filterColor === 'all' || e.color === filterColor;
    const matchFrom = !filterDateFrom || e.event_date >= filterDateFrom;
    const matchTo = !filterDateTo || e.event_date <= filterDateTo;
    return matchSearch && matchTeam && matchColor && matchFrom && matchTo;
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('StudentDashboard')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <NesaLogo size="sm" />
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="rounded-xl text-sm" style={{ background: '#1a6b62' }}>
              <Plus className="w-4 h-4 mr-1" /> Add Event
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">NESA Calendar</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="font-bold text-gray-900 text-lg">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
              {daysInMonth.map(day => {
                const dayEvents = eventsOnDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const todayDay = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative aspect-square flex flex-col items-center justify-start pt-1 rounded-xl transition-all text-sm
                      ${isSelected ? 'bg-teal-700 text-white' : todayDay ? 'bg-amber-50 border border-amber-300' : 'hover:bg-gray-50'}
                    `}
                  >
                    <span className={`font-medium text-xs ${isSelected ? 'text-white' : todayDay ? 'text-amber-700 font-bold' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                      {dayEvents.slice(0, 3).map(e => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[e.color]?.dot || 'bg-emerald-500'}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected day events */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">{format(selectedDay, 'EEEE, MMMM d')}</h3>
                  {selectedDayEvents.length === 0 ? (
                    <p className="text-gray-400 text-sm">No events on this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEvents.map(e => (
                        <EventCard
                          key={e.id}
                          event={e}
                          isAdmin={isAdmin}
                          onDelete={handleDelete}
                          isRegistered={registrations.some(r => r.event_id === e.id)}
                          onRsvp={handleRsvp}
                          rsvpLoading={rsvpLoading === e.id}
                          studentId={studentId}
                          onViewAttendance={() => setAttendanceEvent(e)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Upcoming Events
              </h3>
              {loading ? (
                <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-gray-400 text-sm">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(e => (
                    <div
                      key={e.id}
                      onClick={() => { setSelectedDay(parseISO(e.event_date)); setCurrentMonth(parseISO(e.event_date)); }}
                      className="cursor-pointer flex items-start gap-3 group"
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${COLOR_CLASSES[e.color]?.dot || 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 transition-colors">{e.title}</p>
                        <p className="text-xs text-gray-400">{format(parseISO(e.event_date), 'MMM d, yyyy')}{e.event_time ? ` • ${e.event_time}` : ''}</p>
                        <span className="text-xs text-gray-400">{e.team}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Teams</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'General NESA', color: 'emerald' },
                  { label: 'Welfare', color: 'rose' },
                  { label: 'Social', color: 'purple' },
                  { label: 'Sports', color: 'blue' },
                  { label: 'Academic', color: 'teal' },
                  { label: 'Financial', color: 'amber' },
                ].map(t => (
                  <div key={t.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${COLOR_CLASSES[t.color].dot}`} />
                    <span className="text-xs text-gray-600">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal (Admin) */}
      <AnimatePresence>
        {attendanceEvent && (
          <EventAttendanceModal event={attendanceEvent} onClose={() => setAttendanceEvent(null)} />
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Add New Event</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700">Event Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. NESA Week Kickoff" className="mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description..." className="mt-1 rounded-xl h-11" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-700">Date *</Label>
                    <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                      className="mt-1 rounded-xl h-11" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">Time</Label>
                    <Input value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))}
                      placeholder="e.g. 10:00 AM" className="mt-1 rounded-xl h-11" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Econ Auditorium" className="mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Team</Label>
                  <Select value={form.team} onValueChange={v => setForm(f => ({ ...f, team: v }))}>
                    <SelectTrigger className="mt-1 rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['General NESA','Welfare','Social','Sports','Financial','Community Development','Academic'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requires_rsvp"
                    checked={form.requires_rsvp}
                    onChange={e => setForm(f => ({ ...f, requires_rsvp: e.target.checked }))}
                    className="w-4 h-4 accent-teal-700"
                  />
                  <Label htmlFor="requires_rsvp" className="text-sm text-gray-700 cursor-pointer">
                    Requires RSVP / Registration
                  </Label>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Color Tag</Label>
                  <div className="flex gap-2 mt-2">
                    {Object.entries(COLOR_CLASSES).map(([key, val]) => (
                      <button key={key} onClick={() => setForm(f => ({ ...f, color: key }))}
                        className={`w-7 h-7 rounded-full ${val.dot} border-2 transition-all ${form.color === key ? 'border-gray-800 scale-110' : 'border-transparent'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving || !form.title || !form.event_date}
                className="w-full rounded-xl h-12 text-white font-semibold"
                style={{ background: '#1a6b62' }}>
                {saving ? 'Saving...' : 'Save Event'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventCard({ event, isAdmin, onDelete, isRegistered, onRsvp, rsvpLoading, studentId, onViewAttendance }) {
  const color = COLOR_CLASSES[event.color] || COLOR_CLASSES.emerald;
  return (
    <div className={`rounded-xl border p-3 ${color.light}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{event.title}</p>
          {event.description && <p className="text-xs opacity-70 mt-0.5">{event.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {event.event_time && (
              <span className="flex items-center gap-1 text-xs opacity-60"><Clock className="w-3 h-3" />{event.event_time}</span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 text-xs opacity-60"><MapPin className="w-3 h-3" />{event.location}</span>
            )}
          </div>
          <span className="text-xs opacity-50 mt-0.5 block">{event.team}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdmin && (
            <button onClick={onViewAttendance} className="text-teal-600 hover:text-teal-800 p-1 rounded-lg hover:bg-teal-100/60 transition-colors" title="View attendance">
              <Users className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => onDelete(event.id)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {event.requires_rsvp && studentId && !isAdmin && (
        <div className="mt-2.5 pt-2.5 border-t border-current/10">
          {isRegistered ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              You're registered for this event
            </div>
          ) : (
            <button
              onClick={() => onRsvp(event)}
              disabled={rsvpLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-current/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {rsvpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {rsvpLoading ? 'Registering...' : 'RSVP / Register'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}