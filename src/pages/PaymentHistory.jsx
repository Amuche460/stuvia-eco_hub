import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NesaLogo from '../components/NesaLogo';
import ReceiptCard from '../components/receipt/ReceiptCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Heart, Clock, CheckCircle, XCircle, Receipt, ChevronRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const STATUS_STYLES = {
  pending:  { color: 'bg-amber-100 text-amber-700', Icon: Clock },
  verified: { color: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-700', Icon: XCircle },
};

const NESA_LOGO_URL = 'https://media.base44.com/images/public/6998637834968a098c6b2721/24f9cf519_IMG_20260217_123243_461.jpg';

const loadImageAsDataUrl = (url) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/jpeg'));
  };
  img.onerror = () => resolve(null);
  img.src = url;
});

const downloadReceiptPDF = async (p) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const logoData = await loadImageAsDataUrl(NESA_LOGO_URL);

  // Header background
  doc.setFillColor(26, 107, 98);
  doc.rect(0, 0, 210, 48, 'F');

  // Logo circle
  if (logoData) {
    doc.addImage(logoData, 'JPEG', 89, 4, 32, 32, undefined, 'FAST');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Nigerian Economic Students Association', 105, 41, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Covenant University · Since 2005 · "Ceteris Paribus"', 105, 46, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    const lines = [
      ['Receipt No.', p.receipt_number || p.id?.slice(0, 8).toUpperCase()],
      ['Date', format(new Date(p.created_date), 'MMM d, yyyy • h:mm a')],
      ['Student Name', p.student_name || '—'],
      ['Reg No.', p.student_reg_no || '—'],
      ['Matric No.', p.student_matric_no || '—'],
      ['Level', p.student_level ? `${p.student_level}L` : '—'],
      ['Payment Type', p.type === 'dues' ? 'NESA Dues' : 'Love Foundation Donation'],
      ['Amount', `NGN ${p.amount?.toLocaleString()}`],
      ['Status', 'VERIFIED'],
    ];

    let y = 58;
    lines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label + ':', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 80, y);
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y + 3, 190, y + 3);
      y += 12;
    });

    doc.setFillColor(26, 107, 98);
    doc.roundedRect(20, y + 5, 170, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('This receipt is digitally generated and valid.', 105, y + 14, { align: 'center' });

    doc.save(`NESA-Receipt-${p.receipt_number || p.id?.slice(0, 8)}.pdf`);
};

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) { window.location.href = createPageUrl('SignIn'); return; }
    base44.entities.Payment.filter({ student_id: sid }, '-created_date').then(p => {
      setPayments(p);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? payments : payments.filter(p =>
    filter === 'dues' ? p.type === 'dues' : filter === 'donation' ? p.type === 'donation' : p.status === filter
  );

  const totalPaid = payments.filter(p => p.status === 'verified').reduce((s, p) => s + (p.amount || 0), 0);
  const duesVerified = payments.find(p => p.type === 'dues' && p.status === 'verified');

  if (selectedReceipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Button variant="ghost" onClick={() => setSelectedReceipt(null)} className="mb-4 text-emerald-700">
            ← Back to History
          </Button>
          <ReceiptCard payment={selectedReceipt} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('StudentDashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <NesaLogo size="sm" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-700 text-white rounded-2xl p-4">
            <p className="text-emerald-200 text-xs">Total Paid</p>
            <p className="text-xl font-bold mt-1">₦{totalPaid.toLocaleString()}</p>
          </div>
          <div className={`rounded-2xl p-4 border ${duesVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-xs font-medium ${duesVerified ? 'text-emerald-600' : 'text-amber-600'}`}>Dues Status</p>
            <p className={`text-lg font-bold mt-1 ${duesVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
              {duesVerified ? '✓ Paid' : 'Unpaid'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'dues', label: 'Dues' },
            { key: 'donation', label: 'Donations' },
            { key: 'pending', label: 'Pending' },
            { key: 'verified', label: 'Verified' },
            { key: 'rejected', label: 'Rejected' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                ${filter === f.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={filter === f.key ? { background: '#1a6b62' } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No payments found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, i) => {
              const { color, Icon } = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => p.status === 'verified' ? setSelectedReceipt(p) : null}
                  className={`bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3 ${p.status === 'verified' ? 'cursor-pointer hover:shadow-sm' : ''} transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${p.type === 'dues' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      {p.type === 'dues'
                        ? <CreditCard className="w-4 h-4 text-emerald-600" />
                        : <Heart className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{p.type === 'dues' ? 'Dues Payment' : 'Donation'}</p>
                      <p className="text-xs text-gray-400">{format(new Date(p.created_date), 'MMM d, yyyy • h:mm a')}</p>
                      {p.rejection_reason && (
                        <p className="text-xs text-red-500 mt-0.5">Reason: {p.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">₦{p.amount?.toLocaleString()}</p>
                      <Badge variant="secondary" className={`text-xs mt-0.5 ${color}`}>
                        <Icon className="w-3 h-3 mr-0.5" />
                        {p.status}
                      </Badge>
                    </div>
                    {p.status === 'verified' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadReceiptPDF(p); }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}