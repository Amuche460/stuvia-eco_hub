import React from 'react';
import { Heart, Bookmark, Sparkles, CheckCircle, Lightbulb } from 'lucide-react';

const TOPIC_STYLES = {
  'Finance': { gradient: 'from-emerald-600 via-teal-700 to-emerald-900', accent: '#10b981' },
  'Economics': { gradient: 'from-blue-600 via-indigo-700 to-blue-900', accent: '#3b82f6' },
  'Nigeria Economy': { gradient: 'from-green-600 via-emerald-700 to-amber-800', accent: '#22c55e' },
  'Geopolitics': { gradient: 'from-purple-600 via-violet-700 to-purple-900', accent: '#a855f7' },
  'Purpose': { gradient: 'from-rose-600 via-pink-700 to-rose-900', accent: '#f43f5e' },
  'Mindset': { gradient: 'from-teal-600 via-cyan-700 to-teal-900', accent: '#14b8a6' },
  'Faith': { gradient: 'from-indigo-600 via-violet-700 to-indigo-900', accent: '#6366f1' },
};

export default function ReelItem({ reel, index, active, isLiked, isSaved, isNew, onLike, onSave }) {
  const style = TOPIC_STYLES[reel.topic] || TOPIC_STYLES['Finance'];

  return (
    <div
      data-reel
      data-index={index}
      className="snap-start snap-always relative w-full h-full overflow-hidden"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient}`} />

      {/* Decorative blurred orbs */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-25"
        style={{ background: style.accent }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: style.accent }}
      />

      {/* Content — scrollable if long */}
      <div className="relative h-full flex flex-col px-6 pt-6 pb-24 overflow-y-auto scrollbar-hide">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {reel.topic}
          </span>
          {isNew && (
            <span className="bg-white text-emerald-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3 h-3" /> New
            </span>
          )}
        </div>

        {/* Hook / Headline */}
        <h2 className="text-white font-bold text-2xl leading-tight mb-4 drop-shadow-lg">
          {reel.title}
        </h2>

        {/* Main content */}
        <p className="text-white/90 text-base leading-relaxed mb-5 whitespace-pre-line">
          {reel.content}
        </p>

        {/* Key takeaways */}
        {reel.key_takeaways?.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/10">
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">
              Key Takeaways
            </p>
            <div className="space-y-2.5">
              {reel.key_takeaways.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                  <p className="text-white/90 text-sm leading-snug">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Did you know */}
        {reel.did_you_know && (
          <div className="bg-amber-400/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-300/30">
            <p className="text-amber-200 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> Did You Know?
            </p>
            <p className="text-white/90 text-sm leading-snug">{reel.did_you_know}</p>
          </div>
        )}

        {/* Creator */}
        <p className="text-white/50 text-xs mt-5">@{reel.creator || 'EduReels Daily'}</p>
      </div>

      {/* Right action buttons */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-4">
        <button
          onClick={() => onLike(reel.id)}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className={`p-2.5 rounded-full backdrop-blur-sm ${isLiked ? 'bg-rose-500' : 'bg-black/30'}`}>
            <Heart className={`w-6 h-6 text-white ${isLiked ? 'fill-white' : ''}`} />
          </div>
          <span className="text-white text-[10px] font-medium drop-shadow">Like</span>
        </button>
        <button
          onClick={() => onSave(reel.id)}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className={`p-2.5 rounded-full backdrop-blur-sm ${isSaved ? 'bg-amber-500' : 'bg-black/30'}`}>
            <Bookmark className={`w-6 h-6 text-white ${isSaved ? 'fill-white' : ''}`} />
          </div>
          <span className="text-white text-[10px] font-medium drop-shadow">Save</span>
        </button>
      </div>
    </div>
  );
}