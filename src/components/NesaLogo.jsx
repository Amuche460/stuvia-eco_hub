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
      <div className={`${s.img} flex-shrink-0`}>
        <img
          src="https://media.base44.com/images/public/6998637834968a098c6b2721/6e0495afe_file_000000000098720a9afba54a4d234d96.png"
          alt="NESA Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`${s.text} font-bold tracking-tight`} style={{ color: '#1a6b62' }}>My_NESA</span>
        <span className={`${s.sub} font-medium tracking-wider uppercase`} style={{ color: '#2a9082' }}>My NESA</span>
      </div>
    </div>
  );
}