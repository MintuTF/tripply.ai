import { DayPlan, TripSummary } from '@/types/story';

/**
 * System prompt for generating story captions
 */
export const CAPTION_SYSTEM_PROMPT = `You are a creative travel content writer specializing in short-form video captions for TikTok and Instagram Reels.

Your task is to generate engaging, authentic captions that:
- Are concise and punchy (max 100 characters for headlines)
- Capture the essence of each day's adventure
- Use natural, conversational language
- Avoid clichés and generic travel phrases
- Include relevant emojis sparingly (1-2 per caption)

Style guidelines:
- Be enthusiastic but not over-the-top
- Focus on experiences and feelings, not just places
- Use active voice
- Make it shareable and relatable`;

/**
 * Builds the prompt for generating captions for a single day
 */
export function buildDayCaptionPrompt(
  day: DayPlan,
  tripSummary: TripSummary,
  dayNumber: number,
  totalDays: number
): string {
  const placesList = day.places
    .map((p) => `- ${p.name} (${p.type}${p.timeSlot ? ` at ${p.timeSlot}` : ''})`)
    .join('\n');

  return `Generate a caption for Day ${dayNumber} of ${totalDays} in ${tripSummary.destination}.

Trip: "${tripSummary.title}"
Date: ${day.date}

Places visited this day:
${placesList}

Generate:
1. A short headline (max 80 chars) like "Day 1 - Exploring [theme]" or "Morning coffee, afternoon adventures"
2. A 1-2 sentence description (max 150 chars) summarizing the day's vibe
3. 2-3 key place highlights to display

Respond in JSON format:
{
  "headline": "...",
  "description": "...",
  "placeHighlights": ["Place 1", "Place 2"]
}`;
}

/**
 * Builds prompt for generating multiple day captions at once
 */
export function buildMultiDayCaptionPrompt(
  days: DayPlan[],
  tripSummary: TripSummary
): string {
  const daysInfo = days
    .map((day, i) => {
      const places = day.places.map((p) => `${p.name} (${p.type})`).join(', ');
      return `Day ${day.dayIndex}: ${day.date} - ${places}`;
    })
    .join('\n');

  return `Generate captions for a ${days.length}-day trip to ${tripSummary.destination}.

Trip: "${tripSummary.title}"
Party size: ${tripSummary.partySize} people
Dates: ${tripSummary.startDate} to ${tripSummary.endDate}

Itinerary:
${daysInfo}

For EACH day, generate:
1. headline: A catchy short title (max 80 chars)
2. description: 1-2 sentence summary (max 150 chars)
3. placeHighlights: Array of 2-3 key place names

Also generate:
4. tripSummary: A final caption for the outro (max 100 chars), like "3 perfect days in Seattle ✨"

Respond in JSON format:
{
  "days": [
    { "dayIndex": 1, "headline": "...", "description": "...", "placeHighlights": ["...", "..."] },
    ...
  ],
  "tripSummary": "..."
}`;
}

/**
 * Builds prompt for generating intro caption
 */
export function buildIntroCaptionPrompt(tripSummary: TripSummary, totalPlaces: number): string {
  return `Generate a short, engaging intro caption for a travel story video.

Destination: ${tripSummary.destination}
Trip title: "${tripSummary.title}"
Duration: ${tripSummary.startDate} to ${tripSummary.endDate}
Total places: ${totalPlaces}

Generate a hook caption (max 60 chars) that would make someone stop scrolling.
Examples: "48 hours in Tokyo 🗼" or "The perfect Seattle weekend"

Respond with just the caption text, no quotes or JSON.`;
}

/**
 * Builds prompt for generating social media caption
 */
export function buildSocialCaptionPrompt(
  tripSummary: TripSummary,
  days: DayPlan[],
  totalPlaces: number
): string {
  const highlights = days
    .flatMap((d) => d.places.slice(0, 2).map((p) => p.name))
    .slice(0, 5)
    .join(', ');

  return `Generate a TikTok/Instagram caption for sharing this trip video.

Destination: ${tripSummary.destination}
Duration: ${days.length} days
Highlights: ${highlights}
Total stops: ${totalPlaces}

Create a shareable caption (max 200 chars) with:
- A hook/question to engage viewers
- Mention key highlights
- 3-5 relevant hashtags
- A call to action (save, share, follow)

Example format:
"How I spent 3 days in Seattle ☕ From Pike Place to Kerry Park sunset views...

Save this for your next trip! 📍

#seattle #travelitinerary #pacificnorthwest"

Respond with just the caption text.`;
}

/**
 * Template-specific style adjustments
 */
export const TEMPLATE_STYLE_HINTS: Record<string, string> = {
  minimal: 'Use clean, simple language. Minimal emojis. Focus on the essentials.',
  aesthetic: 'Use warm, dreamy language. Soft vibes. Words like "golden hour", "cozy", "wandering".',
  trendy: 'Use Gen-Z language. More emojis. Phrases like "no cap", "hits different", "core".',
  luxury: 'Use sophisticated language. Words like "exquisite", "curated", "exclusive". No slang.',
};

/**
 * Gets style-adjusted system prompt
 */
export function getStyledSystemPrompt(template: string): string {
  const styleHint = TEMPLATE_STYLE_HINTS[template] || TEMPLATE_STYLE_HINTS.minimal;
  return `${CAPTION_SYSTEM_PROMPT}\n\nStyle for this video: ${styleHint}`;
}
