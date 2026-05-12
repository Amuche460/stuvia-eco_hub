import React from 'react';

export default function NesaLogo({ size = 'md' }) {
  const sizes = {
    sm: { img: 'w-9 h-9', text: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { img: 'w-12 h-12', text: 'text-xl', sub: 'text-[10px]', gap: 'gap-2' },
    lg: { img: 'w-16 h-16', text: 'text-3xl', sub: 'text-xs', gap: 'gap-3' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${s.gap}`}>
      <div className={`${s.img} rounded-full overflow-hidden border-2 border-amber-400/60 shadow-md flex-shrink-0`}>
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998637834968a098c6b2721/ce06469b5_IMG_20260217_123243_461.jpg"
          alt="NESA Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`${s.text} font-bold tracking-tight`} style={{ color: '#1a6b62' }}>My_NESA</span>
        <span className={`${s.sub} font-medium tracking-wider uppercase`} style={{ color: '#2a9082' }}>My NESA</span>
      </div>
    </div>
  );
}