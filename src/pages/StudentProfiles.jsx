import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, User, ChevronRight, CheckCircle, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentProfiles() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDues, setFilterDues] = useState('all');

  useEffect(() => {
    const isAdmin = localStorage.getItem('nesa_is_admin');
    if (isAdmin !== 'true') {
      window.location.href = createPageUrl('AdminDashboard');
      return;
    }
    base44.entities.Student.list().then(s => {
      setStudents(s);
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.reg_no?.toLowerCase().includes(q) ||
      s.matric_no?.toLowerCase().includes(q) ||
      s.course_of_study?.toLowerCase().includes(q);
    const matchLevel = filterLevel === 'all' || s.level === filterLevel;
    const matchDues = filterDues === 'all' ||
      (filterDues === 'paid' && s.dues_paid) ||
      (filterDues === 'unpaid' && !s.dues_paid);
    return matchSearch && matchLevel && matchDues;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <NesaLogo size="sm" />
            <div className="hidden sm:block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Admin</div>
          </div>
          <span className="text-sm text-gray-500 font-medium">{filtered.length} of {students.length} students</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" />
          Student Profiles
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, reg no, matric, course..."
              className="pl-9 rounded-xl h-11"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32 rounded-xl h-11 border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="100">100L</SelectItem>
              <SelectItem value="200">200L</SelectItem>
              <SelectItem value="300">300L</SelectItem>
              <SelectItem value="400">400L</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDues} onValueChange={setFilterDues}>
            <SelectTrigger className="w-36 rounded-xl h-11 border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Dues)</SelectItem>
              <SelectItem value="paid">Dues Paid</SelectItem>
              <SelectItem value="unpaid">Dues Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {(search || filterLevel !== 'all' || filterDues !== 'all') && (
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Student list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No students found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={`${createPageUrl('StudentProfileDetail')}?id=${student.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-emerald-200 transition-all flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 text-lg flex-shrink-0">
                      {student.profile_picture_url
                        ? <img src={student.profile_picture_url} alt="" className="w-full h-full object-cover" />
                        : student.full_name?.charAt(0)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{student.full_name}</p>
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{student.level}L</Badge>
                        {student.dues_paid
                          ? <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Dues Paid</Badge>
                          : <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Dues Pending</Badge>
                        }
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{student.reg_no}{student.matric_no ? ` • ${student.matric_no}` : ''}</p>
                      {student.course_of_study && <p className="text-xs text-gray-400 truncate">{student.course_of_study}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}