import React, { useState } from 'react';
import { Building2, Globe, User, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { StuviaBrandMark } from './StuviaBrandHeader';

export default function RequestInstitutionStep({ initialName = '', user, onBack }) {
  const [institutionName, setInstitutionName] = useState(initialName);
  const [website, setWebsite] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institutionName.trim()) return;
    setSubmitting(true);

    const payload = {
      institution_name: institutionName.trim(),
      website: website.trim() || undefined,
      requester_role: role.trim() || undefined,
      requester_email: user?.email || undefined,
      requester_name: user?.full_name || undefined,
      additional_notes: notes.trim() || undefined,
      status: 'pending',
    };

    try {
      await base44.entities.InstitutionRequest.create(payload);
    } catch {
      const saved = JSON.parse(localStorage.getItem('stuvia_institution_requests') || '[]');
      saved.push({ ...payload, created_date: new Date().toISOString() });
      localStorage.setItem('stuvia_institution_requests', JSON.stringify(saved));
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Institution Request Submitted
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Thank you! We've received your request to add{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">{institutionName}</span>{' '}
          to Stuvia. We'll notify you as soon as your campus portal is live.
        </p>
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="w-full h-11 rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold"
        >
          Back to Find Institution
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <StuviaBrandMark />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Request New Institution
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Can't find your institution? Request to add it to Stuvia
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Institution Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="Enter institution name"
              className="pl-10 h-11 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Website (Optional)
          </Label>
          <div className="relative mt-1">
            <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.example.edu"
              className="pl-10 h-11 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Your Role (Optional)
          </Label>
          <div className="relative mt-1">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Student, Faculty, Staff"
              className="pl-10 h-11 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Additional Notes (Optional)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information that might help us..."
            rows={3}
            className="mt-1 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
          />
        </div>

        <div className="space-y-2.5 pt-1">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full h-11 rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold text-sm"
          >
            Back to Find Institution
          </Button>
        </div>
      </form>
    </div>
  );
}