import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Camera, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useState as useConfirmState } from 'react';

export default function UpdateProfile() {
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({ matric_no: '', phone: '', email: '', course_of_study: '', year_of_entry: '', profile_picture_url: '', date_of_birth: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) {
        const st = s[0];
        setStudent(st);
        setForm({
          matric_no: st.matric_no || '',
          phone: st.phone || '',
          email: st.email || '',
          course_of_study: st.course_of_study || '',
          year_of_entry: st.year_of_entry || '',
          profile_picture_url: st.profile_picture_url || '',
          date_of_birth: st.date_of_birth || '',
        });
      }
    });
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, profile_picture_url: file_url }));
    setUploading(false);
    toast.success('Photo uploaded!');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await base44.entities.Student.delete(student.id);
    localStorage.removeItem('nesa_student_id');
    window.location.href = createPageUrl('Home');
  };

  const handleSave = async () => {
    setLoading(true);
    await base44.entities.Student.update(student.id, {
      matric_no: form.matric_no,
      phone: form.phone,
      email: form.email,
      course_of_study: form.course_of_study,
      year_of_entry: form.year_of_entry,
      profile_picture_url: form.profile_picture_url,
      date_of_birth: form.date_of_birth,
    });
    toast.success('Profile updated successfully!');
    setLoading(false);
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Student Profile</h1>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400/60 shadow-lg bg-teal-100 flex items-center justify-center">
                {form.profile_picture_url ? (
                  <img src={form.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-teal-700">{student.full_name?.charAt(0)}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current.click()}
                className="absolute bottom-0 right-0 bg-amber-400 rounded-full p-1.5 shadow-md hover:bg-amber-500 transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <p className="text-xs text-gray-400 mt-2">Tap camera to change photo</p>
          </div>

          {/* Read-only info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Academic Info</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="font-semibold text-gray-900 text-sm">{student.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Reg Number</p>
                <p className="font-semibold text-gray-900 text-sm">{student.reg_no}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Level</p>
                <p className="font-semibold text-gray-900 text-sm">{student.level}L</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Matric Number</p>
                <p className="font-semibold text-gray-900 text-sm">{form.matric_no || '—'}</p>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Edit Details</h2>

            <div>
              <Label className="text-gray-700 text-sm">Matric Number</Label>
              <Input value={form.matric_no} onChange={e => setForm(f => ({ ...f, matric_no: e.target.value }))}
                placeholder="e.g. 22CF028234" className="mt-1 rounded-xl h-11 border-gray-200" />
              <p className="text-xs text-gray-400 mt-1">100L students can add this later</p>
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Course of Study</Label>
              <Input value={form.course_of_study} onChange={e => setForm(f => ({ ...f, course_of_study: e.target.value }))}
                placeholder="e.g. Economics" className="mt-1 rounded-xl h-11 border-gray-200" />
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Year of Entry</Label>
              <Input value={form.year_of_entry} onChange={e => setForm(f => ({ ...f, year_of_entry: e.target.value }))}
                placeholder="e.g. 2022" className="mt-1 rounded-xl h-11 border-gray-200" maxLength={4} />
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Email Address</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com" className="mt-1 rounded-xl h-11 border-gray-200" type="email" />
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="08012345678" className="mt-1 rounded-xl h-11 border-gray-200" type="tel" />
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Date of Birth *</Label>
              <Input value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="mt-1 rounded-xl h-11 border-gray-200" type="date" required />
              {!form.date_of_birth && (
                <p className="text-xs text-red-500 mt-1">Date of birth is required to receive birthday greetings.</p>
              )}
            </div>

            <Button onClick={handleSave} disabled={loading}
              className="w-full rounded-xl h-12 text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #1a6b62, #0f4a44)' }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </div>

          {/* Delete Account */}
          <div className="mt-6">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-medium py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                <p className="text-red-700 font-semibold text-sm text-center">Are you sure?</p>
                <p className="text-red-500 text-xs text-center">This will permanently delete your account and all data.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}