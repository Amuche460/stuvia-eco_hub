import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import DashboardSearchFields from '@/components/executive/DashboardSearchFields';
import FinancialRecordStatus from '@/components/payments/FinancialRecordStatus';

export default function LoveFoundationDonationsPanel({
  session,
  donationRecords,
  searchFields,
  onViewReceipt,
}) {
  const donationPayments = donationRecords.payments;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <DashboardSearchFields {...searchFields} />
      </div>
      <FinancialRecordStatus records={donationRecords} />
      <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
        <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
          <p className="text-xs font-semibold text-rose-700">
            Love Foundation Donations ({donationRecords.total}) · {session}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Reg No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Matric</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Level</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Amount</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Receipt No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {donationPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                    No Love Foundation donations yet
                  </td>
                </tr>
              ) : (
                donationPayments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.student_name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_reg_no || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_matric_no || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{p.student_level}L</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-700">₦{p.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.receipt_number || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.verified_at ? format(new Date(p.verified_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.proof_url ? (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(p.proof_url)}
                          className="text-xs text-rose-700 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}