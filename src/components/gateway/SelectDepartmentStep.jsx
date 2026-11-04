import React from 'react';
import { ArrowLeft, ChevronRight, Building2, Calculator, Brain, TrendingUp } from 'lucide-react';
import { COVENANT_DEPARTMENTS } from '@/lib/stuviaInstitutions';
import { StuviaBrandMark } from './StuviaBrandHeader';

const DEPT_ICONS = {
  nesa: TrendingUp,
  nuasa: Calculator,
  cupsa: Brain,
};

const DEPT_STYLES = {
  emerald: {
    card: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800',
    icon: 'bg-emerald-700 text-white',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  blue: {
    card: 'border-blue-200 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800',
    icon: 'bg-blue-700 text-white',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  },
  purple: {
    card: 'border-purple-200 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-800',
    icon: 'bg-purple-700 text-white',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  },
};

export default function SelectDepartmentStep({ university, onSelectDepartment, onChangeUniversity }) {
  return (
    <div>
      <div className="text-center mb-5">
        <StuviaBrandMark />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-700 dark:text-gray-300 text-xs font-medium mb-2">
          <Building2 className="w-3.5 h-3.5 text-emerald-700" />
          {university?.name || 'Covenant University'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Select your Department
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose your departmental association hub to continue
        </p>
      </div>

      <div className="space-y-3">
        {COVENANT_DEPARTMENTS.map((dept) => {
          const Icon = DEPT_ICONS[dept.id] || TrendingUp;
          const style = DEPT_STYLES[dept.color] || DEPT_STYLES.emerald;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => onSelectDepartment(dept)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 group hover:shadow-md ${style.card}`}
            >
              {dept.logoUrl ? (
                <img
                  src={dept.logoUrl}
                  alt={dept.name}
                  className="w-12 h-12 rounded-xl object-contain flex-shrink-0 bg-white p-1 border border-emerald-100"
                />
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                  <Icon className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {dept.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {dept.hubName}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {dept.associationName}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onChangeUniversity}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Find Institution
        </button>
      </div>
    </div>
  );
}