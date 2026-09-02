import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import ReelItem from '../components/reels/ReelItem';
import { needsRefresh, generateReels } from '../lib/reelsContent';

const CONTAINER_STYLE = { height: 'calc(100dvh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom))' };
const DAY_MS = 24 * 60 * 60 * 1000;

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedReels, setLikedReels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nesa_liked_reels') || '[]'); } catch { return []; }
  });
  const [savedReels, setSavedReels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nesa_saved_reels') || '[]'); } catch { return []; }
  });
  const containerRef = useRef(null);

  const loadReels = useCallback(async () => {
    try {
      const data = await base44.entities.Reel.list('-created_date', 50);
      setReels(data);
      return data;
    } catch (e) {
      return [];
    }
  }, []);

  // Initial load + daily refresh
  useEffect(() => {
    const sid = localStorage.getItem('nesa_student_id');
    if (!sid) {
      window.location.href = createPageUrl('SignIn');
      return;
    }
    let mounted = true;
    (async () => {
      const data = await loadReels();
      if (!mounted) return;
      setLoading(false);
      if (needsRefresh(data)) {
        setRefreshing(true);
        await generateReels(7);
        if (!mounted) return;
        await loadReels();
        setRefreshing(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // IntersectionObserver for active reel tracking
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
  }, [reels, loading, refreshing, generating]);

  // On-demand generation when near end — unlimited scrolling
  useEffect(() => {
    if (generating || refreshing || reels.length === 0) return;
    if (activeIndex >= reels.length - 3) {
      setGenerating(true);
      (async () => {
        await generateReels(5);
        await loadReels();
        setGenerating(false);
      })();
    }
  }, [activeIndex, reels.length, generating, refreshing]);

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

  const isNew = (reel) => {
    if (!reel.created_date) return false;
    return Date.now() - new Date(reel.created_date).getTime() < DAY_MS;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-black" style={CONTAINER_STYLE}>
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    );
  }

  if (reels.length === 0 && !refreshing) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-emerald-700 to-teal-900 text-white/80 text-sm px-6 text-center" style={CONTAINER_STYLE}>
        <div>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Generating your first educational reels...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black relative" style={CONTAINER_STYLE}>
      {(refreshing || generating) && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          {refreshing ? 'Finding fresh educational content...' : 'Loading more reels...'}
        </div>
      )}
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
            isNew={isNew(reel)}
            onLike={toggleLike}
            onSave={toggleSave}
          />
        ))}
      </div>
    </div>
  );
}