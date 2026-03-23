import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Megaphone, Plus, Loader2, Trash2, Bell, X } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_LABELS = {
  announcement: { label: 'Announcement', color: 'bg-blue-100 text-blue-700' },
  editorial: { label: 'Editorial', color: 'bg-purple-100 text-purple-700' },
  magazine: { label: 'Magazine', color: 'bg-rose-100 text-rose-700' },
  weekly_update: { label: 'Weekly Update', color: 'bg-emerald-100 text-emerald-700' },
  form_poll: { label: 'Form/Poll', color: 'bg-amber-100 text-amber-700' },
};

export default function AnnouncementBoard() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'announcement',
    posted_by: '',
    posted_by_name: '',
    form_url: '',
    target_levels: [],
  });

  const load = async () => {
    const data = await base44.entities.NesaAnnouncement.list('-created_date', 50);
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleLevel = (level) => {
    setForm(f => ({
      ...f,
      target_levels: f.target_levels.includes(level)
        ? f.target_levels.filter(l => l !== level)
        : [...f.target_levels, level],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);

    const announcement = await base44.entities.NesaAnnouncement.create({
      title: form.title,
      content: form.content,
      type: form.type,
      posted_by: form.posted_by,
      posted_by_name: form.posted_by_name,
      form_url: form.form_url || undefined,
      target_levels: form.target_levels,
    });

    // Push notification to students
    await base44.entities.NesaNotification.create({
      title: `📢 ${form.title}`,
      message: form.content.length > 100 ? form.content.substring(0, 100) + '...' : form.content,
      type: 'announcement',
      is_read_by: [],
    });

    toast.success('Announcement posted & notification sent to students!');
    setForm({ title: '', content: '', type: 'announcement', posted_by: '', posted_by_name: '', form_url: '', target_levels: [] });
    setShowForm(false);
    setSubmitting(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.NesaAnnouncement.delete(id);
    toast.success('Announcement deleted');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">Announcement Board</h3>
          <Badge variant="outline" className="text-xs">{announcements.length} posts</Badge>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          {showForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? 'Cancel' : 'New Post'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-700">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title" className="mt-1 rounded-xl border-gray-200" required />
            </div>
            <div>
              <Label className="text-sm text-gray-700">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-700">Content *</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write your announcement here..." className="mt-1 rounded-xl min-h-[100px] border-gray-200" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-700">Posted By (Name)</Label>
              <Input value={form.posted_by_name} onChange={e => setForm(f => ({ ...f, posted_by_name: e.target.value }))}
                placeholder="e.g. John Doe" className="mt-1 rounded-xl border-gray-200" />
            </div>
            <div>
              <Label className="text-sm text-gray-700">Posted By (Post/Role)</Label>
              <Input value={form.posted_by} onChange={e => setForm(f => ({ ...f, posted_by: e.target.value }))}
                placeholder="e.g. General Secretary" className="mt-1 rounded-xl border-gray-200" />
            </div>
          </div>

          {form.type === 'form_poll' && (
            <div>
              <Label className="text-sm text-gray-700">Form/Poll URL</Label>
              <Input value={form.form_url} onChange={e => setForm(f => ({ ...f, form_url: e.target.value }))}
                placeholder="https://forms.google.com/..." className="mt-1 rounded-xl border-gray-200" />
            </div>
          )}

          <div>
            <Label className="text-sm text-gray-700 block mb-2">Target Levels (leave empty for all)</Label>
            <div className="flex gap-2 flex-wrap">
              {['100', '200', '300', '400'].map(level => (
                <button key={level} type="button"
                  onClick={() => toggleLevel(level)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${
                    form.target_levels.includes(level)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {level}L
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-11">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
            {submitting ? 'Posting...' : 'Post & Notify Students'}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No announcements yet</div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const typeInfo = TYPE_LABELS[a.type] || TYPE_LABELS.announcement;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`text-xs ${typeInfo.color} border-0`}>{typeInfo.label}</Badge>
                      {a.target_levels?.length > 0 && a.target_levels.map(l => (
                        <Badge key={l} variant="outline" className="text-xs">{l}L</Badge>
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{a.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                    {a.form_url && (
                      <a href={a.form_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                        🔗 Open Form/Poll
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {a.posted_by_name && <span className="text-xs text-gray-400">{a.posted_by_name}</span>}
                      {a.posted_by && <span className="text-xs text-gray-300">• {a.posted_by}</span>}
                      <span className="text-xs text-gray-300">• {format(new Date(a.created_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}