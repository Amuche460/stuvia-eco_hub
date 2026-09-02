import { base44 } from '@/api/base44Client';

const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks whether the reels feed needs a daily refresh.
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
 * Generates educational micro-lessons using AI with web search,
 * deduplicates against existing reels, and creates new Reel records.
 * @param {number} count - number of reels to generate
 * @returns {Promise<number>} count of new reels created
 */
export async function generateReels(count = 5) {
  try {
    const existing = await base44.entities.Reel.list('-created_date', 200);
    const existingTitles = new Set(
      existing.map(r => r.title?.toLowerCase()).filter(Boolean)
    );

    const prompt = `Generate ${count} impactful, educational micro-lessons for Nigerian university economics students. Each should feel like a TikTok/Instagram educational reel — concise, engaging, and memorable.

Mix topics from: Finance, Economics, Nigeria Economy, Geopolitics, Purpose, Mindset, and Faith.

For each reel provide:
- title: A compelling hook/headline (max 80 chars) that grabs attention immediately
- content: The main educational content (2-3 short paragraphs, max 500 chars total, easy to read on a phone screen)
- key_takeaways: 3-4 bullet points students should remember (each max 100 chars)
- did_you_know: One surprising, thought-provoking fact related to the topic (max 150 chars)
- topic: One of "Finance", "Economics", "Nigeria Economy", "Geopolitics", "Purpose", "Mindset", "Faith"

Make content practical, relevant to Nigerian students, and genuinely life-changing. Cover: building wealth in Nigeria, understanding economic trends, geopolitics affecting Africa, finding purpose, mental resilience, and growing as a believer in a challenging world. Each reel should feel like a mini-lesson that leaves the student smarter and inspired. Use current, real-world examples where possible.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          reels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                key_takeaways: { type: 'array', items: { type: 'string' } },
                did_you_know: { type: 'string' },
                topic: { type: 'string', enum: ['Finance', 'Economics', 'Nigeria Economy', 'Geopolitics', 'Purpose', 'Mindset', 'Faith'] }
              },
              required: ['title', 'content', 'topic']
            }
          }
        }
      }
    });

    const newReels = (response.reels || []).filter(
      r => r.title && r.content && !existingTitles.has(r.title.toLowerCase())
    );

    if (newReels.length > 0) {
      await base44.entities.Reel.bulkCreate(
        newReels.map((r, i) => ({
          title: r.title,
          content: r.content,
          key_takeaways: r.key_takeaways || [],
          did_you_know: r.did_you_know || '',
          topic: r.topic,
          creator: 'EduReels Daily',
          order: Date.now() + i
        }))
      );
    }

    return newReels.length;
  } catch (e) {
    return 0;
  }
}