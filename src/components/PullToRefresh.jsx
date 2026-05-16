import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const rotate = useTransform(y, [0, PULL_THRESHOLD], [0, 360]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!startY.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      setPulling(true);
      const dampened = Math.min(delta * 0.45, PULL_THRESHOLD + 20);
      y.set(dampened);
    }
  }, [y]);

  const handleTouchEnd = useCallback(async () => {
    if (y.get() >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      animate(y, PULL_THRESHOLD * 0.7, { duration: 0.2 });
      await onRefresh();
      animate(y, 0, { duration: 0.35 });
      setRefreshing(false);
    } else {
      animate(y, 0, { duration: 0.35 });
    }
    setPulling(false);
    startY.current = 0;
  }, [y, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ height: y, opacity }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div style={{ rotate, scale }}>
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? 'text-emerald-600 animate-spin' : 'text-emerald-400'}`}
          />
        </motion.div>
      </motion.div>

      <motion.div style={{ y: pulling || refreshing ? y : 0 }}>
        {children}
      </motion.div>
    </div>
  );
}