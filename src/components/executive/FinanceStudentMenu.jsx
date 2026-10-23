import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StudentEditDialog from '@/components/executive/StudentEditDialog';

export default function FinanceStudentMenu({ studentId, name, onUpdated, onDeleted }) {
  const [student, setStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const edit = async () => {
    setBusy(true); setError('');
    try { setStudent(await base44.entities.Student.get(studentId)); }
    catch (e) { setError('Student profile could not be loaded.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { await base44.entities.Student.delete(studentId); onDeleted(studentId); setDeleting(false); }
    catch (e) { setError('Could not delete the student. Please try again.'); }
    finally { setBusy(false); }
  };
  if (!studentId) return name;
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><button disabled={busy} className="inline-flex items-center gap-1 text-left font-medium">{name}<ChevronDown className="w-3 h-3 shrink-0" /></button></DropdownMenuTrigger>
      <DropdownMenuContent><DropdownMenuItem onSelect={edit}>Update student</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onSelect={() => { setError(''); setDeleting(true); }}>Delete student</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
    {error && !deleting && <p role="alert" className="text-destructive text-xs">{error}</p>}
    {student && <StudentEditDialog student={student} onClose={() => setStudent(null)} onSaved={onUpdated} />}
    <Dialog open={deleting} onOpenChange={open => { if (!busy) setDeleting(open); }}><DialogContent>
      <DialogHeader><DialogTitle>Delete student?</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Delete {name}'s student profile? Existing financial receipts will be retained.</p>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(false)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Delete student'}</Button></div>
    </DialogContent></Dialog>
  </>;
}