import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function ApproveExecutivesPanel() {
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.Executive.list('-created_date');
    setExecutives(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (exec) => {
    setActionLoading(exec.id);
    await base44.entities.Executive.update(exec.id, { is_approved: true, is_active: true });

    // Notify the executive via email
    if (exec.email) {
      await base44.integrations.Core.SendEmail({
        to: exec.email,
        subject: 'NESA Executive Access Approved',
        body: `Hello ${exec.full_name},\n\nYour executive registration as ${exec.post} has been approved. You can now sign in at the Executive Portal.\n\nWelcome aboard!\n\nNESA Leadership`,
      });
    }

    setMessage(`${exec.full_name} (${exec.post}) approved!`);
    setTimeout(() => setMessage(''), 4000);
    setActionLoading('');
    load();
  };

  const handleRevoke = async (exec) => {
    setActionLoading(exec.id + '_revoke');
    await base44.entities.Executive.update(exec.id, { is_approved: false, is_active: false });
    setMessage(`${exec.full_name}'s access revoked.`);
    setTimeout(() => setMessage(''), 4000);
    setActionLoading('');
    load();
  };

  const pending = executives.filter(e => !e.is_approved);
  const approved = executives.filter(e => e.is_approved);

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      {/* Pending Approvals */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-500" />
          Pending Approval ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
            No pending registrations.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(exec => (
              <div key={exec.id} className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{exec.full_name}</p>
                  <p className="text-xs text-gray-500">{exec.post} • {exec.level}L • {exec.reg_no}</p>
                  <p className="text-xs text-gray-400">{exec.email}</p>
                  {exec.term_end_date && (
                    <p className="text-xs text-gray-400">Term ends: {format(new Date(exec.term_end_date), 'MMM d, yyyy')}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleApprove(exec)}
                  disabled={actionLoading === exec.id}
                  className="bg-purple-700 hover:bg-purple-800 rounded-xl text-xs shrink-0"
                >
                  {actionLoading === exec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Executives */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Active Executives ({approved.length})</h3>
        {approved.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">No approved executives yet.</div>
        ) : (
          <div className="space-y-2">
            {approved.map(exec => (
              <div key={exec.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{exec.full_name}</p>
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">{exec.post}</Badge>
                    {new Date(exec.term_end_date) < new Date() && (
                      <Badge className="bg-red-100 text-red-600 border-0 text-xs">Term Ended</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{exec.reg_no} • {exec.level}L</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(exec)}
                  disabled={actionLoading === exec.id + '_revoke'}
                  className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                >
                  {actionLoading === exec.id + '_revoke' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><XCircle className="w-3.5 h-3.5 mr-1" /> Revoke</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}