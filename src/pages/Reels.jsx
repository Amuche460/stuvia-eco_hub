import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import ReelItem from '../components/reels/ReelItem';

const CONTAINER_STYLE = { height: 'calc(100dvh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom))' };

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedReels, setLikedReels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nesa_liked_reels') || '[]'); } catch { return []; }
  });
  const [savedReels, setSavedReels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nesa_saved_reels') || '[]'); } catch { return []; }
  });
  const containerRef = useRef(null);

  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) {
      window.location.href = createPageUrl('SignIn');
      return;
    }
    (async () => {
      try {
        const data = await base44.entities.Reel.list('order', 50);
        setReels(data);
      } catch (e) {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!containerRef.current || reels.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(parseInt(entry.target.dataset.index));
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] }
    );
    const items = containerRef.current.querySelectorAll('[data-reel]');
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [reels, loading]);

  const toggleLike = (reelId) => {
    setLikedReels(prev => {
      const next = prev.includes(reelId) ? prev.filter(id => id !== reelId) : [...prev, reelId];
      localStorage.setItem('nesa_liked_reels', JSON.stringify(next));
      return next;
    });
  };

  const toggleSave = (reelId) => {
    setSavedReels(prev => {
      const next = prev.includes(reelId) ? prev.filter(id => id !== reelId) : [...prev, reelId];
      localStorage.setItem('nesa_saved_reels', JSON.stringify(next));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-black" style={CONTAINER_STYLE}>
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center bg-black text-white/50 text-sm px-6 text-center" style={CONTAINER_STYLE}>
        No reels available yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="bg-black relative" style={CONTAINER_STYLE}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      >
        {reels.map((reel, index) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            index={index}
            active={index === activeIndex}
            isLiked={likedReels.includes(reel.id)}
            isSaved={savedReels.includes(reel.id)}
            onLike={toggleLike}
            onSave={toggleSave}
          />
        ))}
      </div>
    </div>
  );
}