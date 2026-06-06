import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function Splash() {
  useEffect(() => {
    // If already seen this session, skip straight to Home
    if (sessionStorage.getItem('splash_shown')) {
      window.location.href = createPageUrl('Home');
      return;
    }
    sessionStorage.setItem('splash_shown', '1');
    const timer = setTimeout(() => {
      window.location.href = createPageUrl('Home');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f4a44 0%, #1a6b62 60%, #0d3d38 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        {/* NESA Logo Image */}
        <div className="w-44 h-44 rounded-full overflow-hidden shadow-2xl border-4 border-amber-400/40">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998637834968a098c6b2721/ce06469b5_IMG_20260217_123243_461.jpg"
            alt="NESA Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#f0c040' }}>
            My_NESA
          </h1>
          <p className="text-lg mt-2 font-medium italic" style={{ color: '#a8d5ce' }}>
            "Always here to serve"
          </p>
        </motion.div>
      </motion.div>

      {/* Animated dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-16 flex gap-2"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#f0c040' }}
          />
        ))}
      </motion.div>
    </div>
  );
}