import React from 'react';
import { Landmark } from 'lucide-react';

export default function NesaLogo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-lg', container: 'gap-2' },
    md: { icon: 'w-7 h-7', text: 'text-xl', container: 'gap-2' },
    lg: { icon: 'w-10 h-10', text: 'text-3xl', container: 'gap-3' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${s.container}`}>
      <div className="bg-emerald-700 rounded-xl p-2 shadow-lg">
        <Landmark className={`${s.icon} text-amber-400`} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`${s.text} font-bold text-emerald-800 tracking-tight`}>NESA</span>
        <span className="text-[10px] text-emerald-600 font-medium tracking-wider uppercase">FinTech Portal</span>
      </div>
    </div>
  );
}