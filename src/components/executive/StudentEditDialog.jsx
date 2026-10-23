import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MobileSelect from '@/components/MobileSelect';

const fields = [['full_name', 'Full name'], ['reg_no', 'Registration number'], ['matric_no', 'Matriculation number'], ['email', 'Email'], ['course_of_study', 'Course of study']];
export default function StudentEditDialog({ student, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...Object.fromEntries(fields.map(([key]) => [key, student[key] || ''])), level: student.level || '100' }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
      data.matric_no = data.matric_no.toUpperCase();
      const updated = await base44.entities.Student.update(student.id, data);
      onSaved(updated); onClose();
    } catch (e) { setError('Could not update the student. Please try again.'); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Update student</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-3">
        {fields.map(([key, label]) => <div key={key}><Label htmlFor={`student-${key}`}>{label}</Label>
          <Input id={`student-${key}`} type={key === 'email' ? 'email' : 'text'} required={['full_name', 'reg_no', 'email'].includes(key)} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
        </div>)}
        <div><Label>Level</Label><MobileSelect value={form.level} onValueChange={level => setForm({ ...form, level })} options={['100', '200', '300', '400'].map(value => ({ value, label: `${value}L` }))} /></div>
        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}