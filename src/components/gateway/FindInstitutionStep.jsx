import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import { UNIVERSITIES } from '@/lib/stuviaInstitutions';
import { StuviaBrandMark } from './StuviaBrandHeader';

export default function FindInstitutionStep({ onSelectUniversity, onRequestNewInstitution }) {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');

  const filtered = UNIVERSITIES.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="text-center mb-6">
        <StuviaBrandMark />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Find your Institution
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Search for your institution to access your departmental portal
        </p>
      </div>

      {/* Selector trigger */}
      <div className="space-y-2">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer bg-white dark:bg-gray-800/80 hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Select Institution"
              className="w-full bg-transparent text-sm italic text-gray-800 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none"
            />
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          )}
        </div>

        {/* Institution dropdown list */}
        {isOpen && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <p className="text-sm text-gray-500">No matching institution found.</p>
                <button
                  type="button"
                  onClick={() => onRequestNewInstitution(search)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Request to add "{search || 'your university'}"
                </button>
              </div>
            ) : (
              filtered.map((uni) => (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => onSelectUniversity(uni)}
                  className="w-full text-left px-4 py-3.5 hover:bg-emerald-50/60 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                      {uni.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{uni.domain}</p>
                  </div>
                  {uni.active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 group-hover:text-amber-600 font-medium">
                      Request →
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Request New Institution CTA */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Can't find your university on the list?
        </p>
        <button
          type="button"
          onClick={() => onRequestNewInstitution('')}
          className="w-full py-2.5 px-4 rounded-xl border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Request New Institution
        </button>
      </div>
    </div>
  );
}