import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Mail, Users, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotifyUnpaidPanel({ students, isPaid, session, loading }) {
  const [level, setLevel] = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const unpaidStudents = students.filter(s => {
    const unpaid = !isPaid(s);
    const matchLevel = level === 'all' || s.level === level;
    return unpaid && matchLevel;
  });

  const handleNotify = async (method) => {
    if (loading || unpaidStudents.length === 0) return;
    setSending(true);
    setResult(null);

    let successCount = 0;
    for (const student of unpaidStudents) {
      try {
        // In-app notification
        await base44.entities.NesaNotification.create({
          title: '⚠️ Dues Payment Reminder',
          message: `Hi ${student.full_name}, your NESA dues for ${session} are still outstanding. Please log in to the portal and complete your payment to retain full access to NESA benefits.`,
          type: 'payment',
          student_id: student.id,
          is_read_by: [],
        });

        // Email notification
        if (method === 'both' || method === 'email') {
          await base44.integrations.Core.SendEmail({
            to: student.email,
            subject: 'NESA Dues Payment Reminder',
            body: `Dear ${student.full_name},\n\nThis is a reminder that your NESA dues for ${session} are yet to be paid.\n\nPlease log in to the NESA portal and pay ₦3,000 at your earliest convenience to enjoy full NESA benefits.\n\nRegards,\nNESA Financial Secretary`,
          });
        }

        successCount++;
      } catch (e) {
        // continue with others
      }
    }

    setSending(false);
    setResult({ sent: successCount, total: unpaidStudents.length });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-gray-900">Notify Unpaid Students</h3>
      </div>
      <p className="text-sm text-gray-500">
        Send payment reminders to students who haven't paid their dues for {session}.
      </p>

      {/* Level filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filter by Level:</label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-36 rounded-xl border-gray-200">
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

      {/* Unpaid count badge */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${unpaidStudents.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
        <div className={`rounded-full p-2 ${unpaidStudents.length > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
          {unpaidStudents.length > 0
            ? <AlertTriangle className="w-5 h-5 text-amber-600" />
            : <CheckCircle className="w-5 h-5 text-emerald-600" />
          }
        </div>
        <div>
          <p className="font-bold text-gray-900">{unpaidStudents.length} student{unpaidStudents.length !== 1 ? 's' : ''} unpaid</p>
          <p className="text-xs text-gray-500">
            {level === 'all' ? 'Across all levels' : `In ${level}L`}
          </p>
        </div>
      </div>

      {/* Unpaid list preview */}
      {unpaidStudents.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50 bg-white">
          {unpaidStudents.map(s => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.full_name}</p>
                <p className="text-xs text-gray-400">{s.reg_no} • {s.level}L</p>
              </div>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unpaid</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleNotify('both')}
          disabled={loading || sending || unpaidStudents.length === 0}
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
          Notify via App + Email
        </Button>
        <Button
          variant="outline"
          onClick={() => handleNotify('app')}
          disabled={loading || sending || unpaidStudents.length === 0}
          className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          <Users className="w-4 h-4 mr-2" />
          In-App Only
        </Button>
        <Button
          variant="outline"
          onClick={() => handleNotify('email')}
          disabled={loading || sending || unpaidStudents.length === 0}
          className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email Only
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-700 font-medium">
            Sent reminders to {result.sent} of {result.total} unpaid students.
          </p>
        </div>
      )}
    </div>
  );
}