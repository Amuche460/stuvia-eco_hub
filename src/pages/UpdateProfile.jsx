import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function UpdateProfile() {
  const [student, setStudent] = useState(null);
  const [matricNo, setMatricNo] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Student.filter({ id: sid }).then(s => {
      if (s.length) {
        setStudent(s[0]);
        setMatricNo(s[0].matric_no || '');
        setPhone(s[0].phone || '');
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await base44.entities.Student.update(student.id, {
      matric_no: matricNo,
      phone: phone,
    });
    toast.success('Profile updated successfully!');
    setLoading(false);
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="p-4">
        <Link to={createPageUrl('StudentDashboard')} className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <div className="bg-blue-100 rounded-2xl p-3 w-fit mx-auto mb-3">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Update Profile</h1>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 space-y-4">
            <div>
              <Label className="text-gray-500 text-xs">Full Name</Label>
              <p className="font-medium text-gray-900">{student.full_name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Registration Number</Label>
              <p className="font-medium text-gray-900">{student.reg_no}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Level</Label>
              <p className="font-medium text-gray-900">{student.level}L</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Email</Label>
              <p className="font-medium text-gray-900">{student.email}</p>
            </div>

            <hr className="my-2" />

            <div>
              <Label className="text-gray-700">Matric Number</Label>
              <Input
                value={matricNo}
                onChange={(e) => setMatricNo(e.target.value)}
                placeholder="Enter your matric number"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
              <p className="text-xs text-gray-400 mt-1">100L students can add this later</p>
            </div>

            <div>
              <Label className="text-gray-700">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="mt-1 rounded-xl h-11 border-gray-200"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}