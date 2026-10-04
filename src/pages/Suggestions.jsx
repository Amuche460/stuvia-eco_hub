import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MobileSelect from '../components/MobileSelect';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Send, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { SUGGESTION_TEAMS as TEAMS } from '../lib/suggestionTeams';

export default function Suggestions() {
  const [student, setStudent] = useState(null);
  const [team, setTeam] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) setStudent(s[0]);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Optimistic: show success immediately, sync in background
    setSubmitted(true);
    setLoading(false);

    base44.entities.Suggestion.create({
      student_id: anonymous ? '' : student?.id,
      student_name: anonymous ? 'Anonymous' : student?.full_name,
      team,
      subject,
      message,
      is_anonymous: anonymous,
      status: 'new',
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Sent!</h2>
          <p className="text-gray-500 mb-6">Thank you for your feedback. The {team} team will review it.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setSubmitted(false); setTeam(''); setSubject(''); setMessage(''); }} className="rounded-xl">
              Send Another
            </Button>
            <Link to={createPageUrl('StudentDashboard')}>
              <Button className="bg-emerald-700 hover:bg-emerald-800 rounded-xl">Dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-amber-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Suggestion Portal</h1>
            <p className="text-gray-500 text-sm mt-1">Share feedback with NESA teams</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6 space-y-4">
            <div>
              <Label className="text-gray-700">Team *</Label>
              <MobileSelect
                value={team}
                onValueChange={setTeam}
                placeholder="Select a team"
                options={TEAMS.map(t => ({ value: t, label: t }))}
                triggerClassName="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <div>
              <Label className="text-gray-700">Subject *</Label>
              <Input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief topic"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <div>
              <Label className="text-gray-700">Your Feedback *</Label>
              <Textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or concerns..."
                className="mt-1 rounded-xl border-gray-200 min-h-[120px]"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Submit Anonymously</p>
                <p className="text-xs text-gray-500">Your name won't be shared</p>
              </div>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>

            <Button
              type="submit"
              disabled={loading || !team}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-xl h-12 text-base shadow-lg shadow-amber-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}