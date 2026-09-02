import { base44 } from '@/api/base44Client';

const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks whether the reels feed needs refreshing.
 * @param {Array} reels - reels sorted by newest first
 * @returns {boolean}
 */
export function needsRefresh(reels) {
  if (!reels || reels.length === 0) return true;
  const newest = reels[0];
  if (!newest?.created_date) return true;
  return Date.now() - new Date(newest.created_date).getTime() > REFRESH_INTERVAL;
}

/**
 * Fetches new educational YouTube videos using AI with web search,
 * deduplicates against existing reels, and creates new Reel records.
 * @returns {Promise<number>} count of new reels added
 */
export async function refreshReels() {
  try {
    const existing = await base44.entities.Reel.list('-created_date', 200);
    const existingIds = new Set(existing.map(r => r.youtube_video_id));

    const prompt = `Find 5 trending, high-quality educational YouTube videos that would educate and inspire Nigerian university economics students. Mix topics from: Finance, Economics, Nigeria Economy, Geopolitics, Purpose, Mindset, and Faith.

For each video provide:
- title: The exact video title
- creator: The channel name
- youtube_video_id: The 11-character YouTube video ID (the part after "v=" in the watch URL)
- topic: One of "Finance", "Economics", "Nigeria Economy", "Geopolitics", "Purpose", "Mindset", "Faith"
- description: A 1-2 sentence description of what students will learn

Prioritize content about building a better economy in Nigeria and globally, understanding the mind, growing as a believer in a challenging world, and geopolitics. Focus on recent and relevant videos. Only include real videos that actually exist on YouTube — no made-up IDs.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          videos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                topic: { type: 'string', enum: ['Finance', 'Economics', 'Nigeria Economy', 'Geopolitics', 'Purpose', 'Mindset', 'Faith'] },
                youtube_video_id: { type: 'string' },
                creator: { type: 'string' }
              },
              required: ['title', 'topic', 'youtube_video_id', 'creator']
            }
          }
        }
      }
    });

    const videos = (response.videos || []).filter(v =>
      v.youtube_video_id &&
      v.youtube_video_id.length >= 8 &&
      !existingIds.has(v.youtube_video_id)
    );

    if (videos.length > 0) {
      await base44.entities.Reel.bulkCreate(
        videos.map(v => ({
          title: v.title,
          description: v.description || '',
          topic: v.topic,
          youtube_video_id: v.youtube_video_id,
          creator: v.creator,
          order: Date.now()
        }))
      );
    }

    return videos.length;
  } catch (e) {
    return 0;
  }
}