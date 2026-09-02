import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Volume2, VolumeX, Sparkles } from 'lucide-react';

const TOPIC_STYLES = {
  'Finance': 'bg-emerald-500',
  'Economics': 'bg-blue-500',
  'Nigeria Economy': 'bg-amber-500',
  'Geopolitics': 'bg-purple-500',
  'Purpose': 'bg-rose-500',
  'Mindset': 'bg-teal-500',
  'Faith': 'bg-indigo-500',
};

export default function ReelItem({ reel, index, active, isLiked, isSaved, isNew, onLike, onSave }) {
  const [muted, setMuted] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const topicClass = TOPIC_STYLES[reel.topic] || 'bg-emerald-500';
  const thumbnail = `https://img.youtube.com/vi/${reel.youtube_video_id}/hqdefault.jpg`;

  useEffect(() => {
    if (active) setIframeLoaded(false);
  }, [active]);

  return (
    <div
      data-reel
      data-index={index}
      className="snap-start snap-always relative w-full h-full bg-black overflow-hidden"
    >
      {/* Thumbnail background */}
      <img
        src={thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* YouTube iframe — only when active */}
      {active && (
        <iframe
          src={`https://www.youtube.com/embed/${reel.youtube_video_id}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&controls=1`}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          onLoad={() => setIframeLoaded(true)}
          title={reel.title}
        />
      )}

      {/* Loading spinner */}
      {active && !iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Topic badge + New badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className={`${topicClass} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
          {reel.topic}
        </span>
        {isNew && (
          <span className="bg-white text-emerald-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> New
          </span>
        )}
      </div>

      {/* Mute toggle */}
      {active && (
        <button
          onClick={() => setMuted(m => !m)}
          className="absolute top-4 right-4 z-10 bg-black/60 text-white p-2.5 rounded-full backdrop-blur-sm active:scale-95 transition-transform"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-6 left-4 right-20 z-10 pointer-events-none">
        <p className="text-white font-bold text-lg leading-tight drop-shadow-lg">{reel.title}</p>
        <p className="text-white/80 text-sm mt-1 drop-shadow">@{reel.creator}</p>
        {reel.description && (
          <p className="text-white/70 text-sm mt-2 line-clamp-2 drop-shadow">{reel.description}</p>
        )}
      </div>

      {/* Right action buttons */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-4">
        <button
          onClick={() => onLike(reel.id)}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className={`p-2.5 rounded-full backdrop-blur-sm ${isLiked ? 'bg-rose-500' : 'bg-black/50'}`}>
            <Heart className={`w-6 h-6 text-white ${isLiked ? 'fill-white' : ''}`} />
          </div>
          <span className="text-white text-[10px] font-medium drop-shadow">Like</span>
        </button>
        <button
          onClick={() => onSave(reel.id)}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className={`p-2.5 rounded-full backdrop-blur-sm ${isSaved ? 'bg-amber-500' : 'bg-black/50'}`}>
            <Bookmark className={`w-6 h-6 text-white ${isSaved ? 'fill-white' : ''}`} />
          </div>
          <span className="text-white text-[10px] font-medium drop-shadow">Save</span>
        </button>
      </div>
    </div>
  );
}