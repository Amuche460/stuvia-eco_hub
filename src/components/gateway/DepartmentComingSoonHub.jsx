import React from 'react';
import { ArrowLeft, Calculator, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StuviaGatewayShell from './StuviaBrandHeader';

export default function DepartmentComingSoonHub({ department, onSwitchDepartment, onOpenNesa }) {
  const isAccounting = department.id === 'nuasa';
  const Icon = isAccounting ? Calculator : Brain;
  const accentBg = isAccounting ? 'bg-blue-700' : 'bg-purple-700';
  const accentLight = isAccounting
    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';

  return (
    <StuviaGatewayShell
      topRight={
        <Button
          variant="outline"
          size="sm"
          onClick={onSwitchDepartment}
          className="rounded-xl text-xs"
        >
          Switch Department
        </Button>
      }
    >
      <div className="text-center py-4 space-y-4">
        <div className={`w-16 h-16 rounded-2xl ${accentBg} text-white flex items-center justify-center mx-auto shadow-lg`}>
          <Icon className="w-8 h-8" />
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${accentLight}`}>
          <Sparkles className="w-3.5 h-3.5" />
          Covenant University · {department.shortCode}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {department.name}
        </h1>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {department.associationName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          This departmental hub is being configured with its custom {department.shortCode} theme, logo, and payment account details.
        </p>

        <div className="pt-2 space-y-2.5">
          <Button
            onClick={onSwitchDepartment}
            className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Choose Another Department
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenNesa}
            className="w-full text-xs text-emerald-700 dark:text-emerald-400"
          >
            Switch to Economics (NESA) Eco Hub →
          </Button>
        </div>
      </div>
    </StuviaGatewayShell>
  );
}