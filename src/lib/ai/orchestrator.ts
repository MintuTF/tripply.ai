import { openai, DEFAULT_MODEL } from './openai';
import { TOOLS, isValidToolCall } from './tools';
import { getSystemPromptByMode, TripContext, CARD_WHY_INSTRUCTIONS } from './prompts';
import { extractCardsFromToolResults } from './cardExtractor';
import type { Message, ToolCall, Citation, Intent, PlaceCard, ChatMode, ItineraryResponse } from '@/types';
import type { ChatVideoResult, VideoAnalysis, SmartVideoResult, VideoDeepAnalysis } from '@/types/video';
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';

// Import tool implementations
import { getWeather } from '../tools/weather';
import { searchPlaces, getPlaceDetails, calculateTravelTime } from '../tools/places';
import { searchWeb } from '../tools/search';
import { searchEvents } from '../tools/events';
import { searchHotelOffers } from '../tools/hotelSearch';
import { searchReddit } from '../tools/reddit';
import { searchVideos, extractSearchTitles } from '../tools/videos';
import { searchMediumVideosWithCaptions, type MediumVideoWithCaption } from '../video/youtube-client';

/**
 * Tool executor interface
 */
interface ToolExecutor {
  search_web: (params: any) => Promise<any>;
  get_weather: (params: any) => Promise<any>;
  search_places: (params: any) => Promise<any>;
  get_place_details: (params: any) => Promise<any>;
  search_events: (params: any) => Promise<any>;
  calculate_travel_time: (params: any) => Promise<any>;
  search_hotel_offers: (params: any) => Promise<any>;
  search_reddit: (params: any) => Promise<any>;
  search_videos: (params: any) => Promise<any>;
}

/**
 * Real tool executors connected to external APIs
 */
const toolExecutors: ToolExecutor = {
  search_web: searchWeb,
  get_weather: getWeather,
  search_places: searchPlaces,
  get_place_details: getPlaceDetails,
  search_events: searchEvents,
  calculate_travel_time: calculateTravelTime,
  search_hotel_offers: searchHotelOffers,
  search_reddit: searchReddit,
  search_videos: searchVideos,
};

/**
 * Get system prompt with current date context and explicit mode
 */
function getSystemPromptWithMode(chatMode: ChatMode, tripContext?: TripContext): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentYear = new Date().getFullYear();

  // Build context for prompt generation
  const context: TripContext = {
    destination: tripContext?.destination || 'a travel destination',
    tripName: tripContext?.tripName,
    days: tripContext?.days,
    travelerType: tripContext?.travelerType,
    interests: tripContext?.interests,
    budget: tripContext?.budget,
    pace: tripContext?.pace,
    savedPlacesCount: tripContext?.savedPlacesCount,
  };

  // Get mode-specific prompt
  const basePrompt = getSystemPromptByMode(chatMode, context);

  return `${basePrompt}

${CARD_WHY_INSTRUCTIONS}

**IMPORTANT - Current Date Context:**
Today's date is ${currentDate}. When users mention dates like "Dec 20" or "next week", always interpret them relative to today's date and use the current year (${currentYear}) or next year as appropriate. For hotel searches and bookings, always use future dates in YYYY-MM-DD format.`;
}

/**
 * Parse itinerary JSON from AI response
 */
function parseItineraryFromResponse(response: string): ItineraryResponse | null {
  try {
    // Look for JSON block in the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      // Validate basic structure
      if (parsed.tripSummary && parsed.days && Array.isArray(parsed.days)) {
        return parsed as ItineraryResponse;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to parse itinerary JSON:', error);
    return null;
  }
}

/**
 * Execute a tool call
 */
async function executeTool(name: string, parameters: any): Promise<any> {
  if (!isValidToolCall(name, parameters)) {
    throw new Error(`Invalid parameters for tool: ${name}`);
  }

  const executor = toolExecutors[name as keyof ToolExecutor];
  if (!executor) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await executor(parameters);
    return result;
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return {
      error: `Failed to execute ${name}`,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract videos from tool results
 */
function extractVideosFromToolResults(toolCalls: ToolCall[]): ChatVideoResult[] {
  const videos: ChatVideoResult[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.tool === 'search_videos' && toolCall.result?.success && toolCall.result.data) {
      videos.push(...toolCall.result.data);
    }
  }

  return videos;
}

/**
 * Always search for relevant videos based on user query
 * AI generates the search title for better results
 */
async function autoSearchVideos(
  userMessage: string,
  destination: string,
  country?: string,
  travelerType?: string
): Promise<ChatVideoResult[]> {
  if (!destination) return [];

  try {
    console.log('[Orchestrator] Auto video search for:', userMessage, 'in', destination);
    const result = await searchVideos({
      query: userMessage,
      location: destination,
      country,
      travelerType,
    });
    return result.success ? result.data : [];
  } catch (error) {
    console.error('[Orchestrator] Auto video search failed:', error);
    return [];
  }
}

/**
 * Analyze featured video to extract summary, highlights, and places
 */
async function analyzeVideo(
  video: ChatVideoResult,
  destination: string
): Promise<VideoAnalysis | null> {
  try {
    console.log('[Orchestrator] Analyzing video:', video.title);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/chat/analyze-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: video.videoId,
        videoTitle: video.title,
        videoDescription: video.description || '',
        destination,
      }),
    });

    if (!response.ok) {
      console.error('[Orchestrator] Video analysis failed:', response.status);
      return null;
    }

    const analysis = await response.json() as VideoAnalysis;
    console.log('[Orchestrator] Video analysis complete:', analysis.summary?.slice(0, 50) + '...');
    return analysis;
  } catch (error) {
    console.error('[Orchestrator] Video analysis error:', error);
    return null;
  }
}

/**
 * Deep analyze a video transcript
 */
async function analyzeVideoDeep(
  video: MediumVideoWithCaption,
  destination: string,
  userQuery: string
): Promise<VideoDeepAnalysis | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/chat/analyze-video-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: video.videoId,
        title: video.title,
        description: video.description || '',
        destination,
        userQuery,
      }),
    });

    if (!response.ok) {
      console.error('[Orchestrator] Deep analysis failed:', response.status);
      return null;
    }

    return await response.json() as VideoDeepAnalysis;
  } catch (error) {
    console.error('[Orchestrator] Deep analysis error:', error);
    return null;
  }
}

/**
 * Fetch video transcript using youtube-caption-extractor
 */
async function fetchVideoTranscript(videoId: string): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Use the existing analyze-video-deep endpoint but just get transcript
    const response = await fetch(`${baseUrl}/api/chat/analyze-video-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        title: 'Transcript fetch',
        destination: '',
        userQuery: '',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Return the summary which contains transcript-derived content
      return data.summary || null;
    }
    return null;
  } catch (error) {
    console.error(`[FetchTranscript] Error for ${videoId}:`, error);
    return null;
  }
}

/**
 * Generate natural conversational AI response using video transcript context
 * Formatted for easy reading with clear sections
 */
async function generateNaturalResponse(
  userQuery: string,
  transcriptContext: string,
  destination: string
): Promise<string> {
  const prompt = `You are a helpful, friendly travel assistant. The user asked about ${destination}:

"${userQuery}"

Here is information extracted from travel videos about this topic:
${transcriptContext}

Write a well-organized, easy-to-read response using this EXACT format:

## Quick Answer
[1-2 sentence direct answer to their question]

## Top Recommendations
[Use bullet points with bold place names. Each bullet should be ONE recommendation with a brief reason why]
- **Place Name** — Short reason why it's great (location info)
- **Place Name** — Short reason why it's great (location info)
[Include 3-5 recommendations]

## Insider Tips
[2-3 practical tips as bullet points]
- Tip about timing, transport, or saving money
- Tip about local customs or hidden gems

---
💡 **Pro tip:** [One standout tip that will really help them]

IMPORTANT FORMATTING RULES:
- Use ## for section headers (exactly as shown)
- Use **bold** for all place names
- Use bullet points (-) for lists
- Keep each bullet point to ONE line
- Use — (em dash) to separate place name from description
- End with a horizontal rule (---) before the pro tip
- Keep the total response under 250 words
- Sound friendly and knowledgeable, not robotic`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  });

  return response.choices[0].message.content || 'I found some helpful videos about your question.';
}

/**
 * Smart Video Search with Natural AI Response
 * 1. Extract search titles from user query
 * 2. Search medium-length videos with captions
 * 3. Fetch transcripts and combine into context
 * 4. Generate natural conversational AI response
 */
export async function smartVideoSearch(
  userQuery: string,
  destination: string
): Promise<SmartVideoResult | null> {
  if (!destination) return null;

  try {
    console.log(`[SmartVideoSearch] Starting for: "${userQuery}" in ${destination}`);

    // Step 1: Extract search titles from user query
    const titles = await extractSearchTitles(userQuery, destination);
    console.log(`[SmartVideoSearch] Extracted ${titles.length} titles:`, titles);

    // Step 2: Search videos for each title
    const videosPerTitle = titles.length > 1 ? 2 : 4;
    const allVideos: MediumVideoWithCaption[] = [];

    for (const title of titles) {
      const videos = await searchMediumVideosWithCaptions(title, videosPerTitle);
      // Filter duplicates
      for (const video of videos) {
        if (!allVideos.some(v => v.videoId === video.videoId)) {
          allVideos.push(video);
        }
      }
    }

    console.log(`[SmartVideoSearch] Found ${allVideos.length} unique videos`);

    if (allVideos.length === 0) {
      return null;
    }

    // Step 3: Analyze videos and build transcript context
    const analysisPromises = allVideos.slice(0, 4).map(video =>
      analyzeVideoDeep(video, destination, userQuery)
    );
    const analyses = await Promise.all(analysisPromises);
    const validAnalyses = analyses.filter((a): a is VideoDeepAnalysis => a !== null);

    // Build context from video analyses
    const transcriptContext = validAnalyses
      .map((analysis, i) => {
        const video = allVideos[i];
        return `Video "${video.title}":
Summary: ${analysis.summary}
Key points: ${[...analysis.thingsToDo, ...analysis.tips].slice(0, 4).join('; ')}`;
      })
      .join('\n\n')
      .slice(0, 6000); // Limit context size

    console.log(`[SmartVideoSearch] Built context from ${validAnalyses.length} videos`);

    // Step 4: Generate natural AI response
    const aiResponse = await generateNaturalResponse(userQuery, transcriptContext, destination);

    // Build video results (simplified - no analysis needed in UI)
    const videoResults = allVideos.map((video) => ({
      video: {
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        viewCount: video.viewCount,
        duration: video.duration,
      } as ChatVideoResult,
    }));

    const result: SmartVideoResult = {
      aiResponse,
      videos: videoResults,
      searchTitles: titles,
    };

    console.log(`[SmartVideoSearch] Complete with natural response (${aiResponse.length} chars)`);

    return result;
  } catch (error) {
    console.error('[SmartVideoSearch] Error:', error);
    return null;
  }
}

/**
 * Extract citations from tool results
 */
function extractCitations(toolResults: any[]): Citation[] {
  const citations: Citation[] = [];

  for (const result of toolResults) {
    if (result.sources) {
      citations.push(
        ...result.sources.map((source: any) => ({
          url: source.url,
          title: source.title,
          snippet: source.snippet,
          timestamp: new Date().toISOString(),
          confidence: source.confidence || 1.0,
        }))
      );
    }
  }

  return citations;
}

/**
 * Helper: Calculate number of days between two dates
 */
function calculateDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end day
}

/**
 * Helper: Get budget label from range
 */
function getBudgetLabel(range: [number, number]): string {
  const avg = (range[0] + range[1]) / 2;
  if (avg < 100) return 'budget';
  if (avg < 300) return 'moderate';
  return 'luxury';
}

/**
 * Main orchestration function
 * Handles the conversation with OpenAI including tool calls
 */
export async function orchestrateChat(params: {
  messages: Message[];
  userMessage: string;
  chatMode?: ChatMode; // Explicit mode from user selection
  tripContext?: {
    title: string;
    destination?: string;
    dates?: { start: string; end: string };
    budget_range?: [number, number];
    preferences?: Record<string, any>;
    savedPlacesCount?: number;
  };
}): Promise<{
  response: string;
  toolCalls: ToolCall[];
  citations: Citation[];
  cards: PlaceCard[];
  itinerary: ItineraryResponse | null;
  intent: { intent: Intent; confidence: number };
  chatMode: ChatMode;
}> {
  const { messages, userMessage, chatMode = 'ask', tripContext } = params;

  // Build trip context for prompt generation
  const promptContext: TripContext = {
    destination: tripContext?.destination || tripContext?.title || '',
    tripName: tripContext?.title,
    days: tripContext?.dates ? calculateDays(tripContext.dates.start, tripContext.dates.end) : undefined,
    travelerType: tripContext?.preferences?.travelerType,
    interests: tripContext?.preferences?.interests,
    budget: tripContext?.budget_range ? getBudgetLabel(tripContext.budget_range) : undefined,
    savedPlacesCount: tripContext?.savedPlacesCount,
  };

  // Build conversation history with mode-specific system prompt
  const conversationHistory: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: getSystemPromptWithMode(chatMode, promptContext),
    },
  ];

  // Add previous messages
  for (const msg of messages.slice(-10)) {
    // Keep last 10 messages for context
    conversationHistory.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.text,
    });
  }

  // Add current user message
  conversationHistory.push({
    role: 'user',
    content: userMessage,
  });

  // First API call - get response with potential tool calls
  let response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: conversationHistory,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  let assistantMessage = response.choices[0].message;
  const toolCalls: ToolCall[] = [];
  const toolResults: any[] = [];

  // Handle tool calls if present
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    // Add assistant message with tool calls to history
    conversationHistory.push(assistantMessage);

    // Execute all tool calls
    for (const toolCall of assistantMessage.tool_calls) {
      const { id, function: func } = toolCall;
      const parameters = JSON.parse(func.arguments);

      console.log(`Executing tool: ${func.name}`, parameters);

      try {
        const result = await executeTool(func.name, parameters);
        toolResults.push(result);

        toolCalls.push({
          id,
          tool: func.name,
          parameters,
          result,
        });

        // Add tool result to conversation
        const toolMessage: ChatCompletionToolMessageParam = {
          role: 'tool',
          tool_call_id: id,
          content: JSON.stringify(result),
        };
        conversationHistory.push(toolMessage);
      } catch (error) {
        console.error(`Tool call failed: ${func.name}`, error);
        const errorMessage: ChatCompletionToolMessageParam = {
          role: 'tool',
          tool_call_id: id,
          content: JSON.stringify({
            error: 'Tool execution failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
        };
        conversationHistory.push(errorMessage);
      }
    }

    // Second API call - get final response with tool results
    response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: conversationHistory,
    });

    assistantMessage = response.choices[0].message;
  }

  // Extract citations from tool results
  const citations = extractCitations(toolResults);

  // Extract structured cards from tool results
  const cards = extractCardsFromToolResults(toolCalls);

  // Parse itinerary JSON if in itinerary mode
  const responseText = assistantMessage.content || 'I apologize, but I could not generate a response.';
  const itinerary = chatMode === 'itinerary' ? parseItineraryFromResponse(responseText) : null;

  return {
    response: responseText,
    toolCalls,
    citations,
    cards,
    itinerary,
    intent: { intent: 'general' as Intent, confidence: 0.5 }, // Legacy field
    chatMode,
  };
}

/**
 * Streaming orchestration function
 * Similar to orchestrateChat but streams the response token by token
 */
export async function* orchestrateChatStream(params: {
  messages: Message[];
  userMessage: string;
  chatMode?: ChatMode; // Explicit mode from user selection
  tripContext?: {
    title: string;
    destination?: string;
    dates?: { start: string; end: string };
    budget_range?: [number, number];
    preferences?: Record<string, any>;
    savedPlacesCount?: number;
  };
}): AsyncGenerator<{
  type: 'toolCalls' | 'cards' | 'videos' | 'videoAnalysis' | 'smartVideoResult' | 'content' | 'itinerary' | 'done';
  toolCalls?: ToolCall[];
  content?: string;
  citations?: Citation[];
  cards?: PlaceCard[];
  videos?: ChatVideoResult[];
  videoAnalysis?: VideoAnalysis;
  smartVideoResult?: SmartVideoResult;
  itinerary?: ItineraryResponse;
  intent?: { intent: Intent; confidence: number };
  chatMode?: ChatMode;
}> {
  const { messages, userMessage, chatMode = 'ask', tripContext } = params;

  // Build trip context for prompt generation
  const promptContext: TripContext = {
    destination: tripContext?.destination || tripContext?.title || '',
    tripName: tripContext?.title,
    days: tripContext?.dates ? calculateDays(tripContext.dates.start, tripContext.dates.end) : undefined,
    travelerType: tripContext?.preferences?.travelerType,
    interests: tripContext?.preferences?.interests,
    budget: tripContext?.budget_range ? getBudgetLabel(tripContext.budget_range) : undefined,
    savedPlacesCount: tripContext?.savedPlacesCount,
  };

  // Build conversation history with mode-specific system prompt
  const conversationHistory: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: getSystemPromptWithMode(chatMode, promptContext),
    },
  ];

  // Add previous messages
  for (const msg of messages.slice(-10)) {
    conversationHistory.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.text,
    });
  }

  // Add current user message
  conversationHistory.push({
    role: 'user',
    content: userMessage,
  });

  // First API call - check for tool calls (non-streaming)
  let response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: conversationHistory,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  let assistantMessage = response.choices[0].message;
  const toolCalls: ToolCall[] = [];
  const toolResults: any[] = [];

  // Handle tool calls if present (must complete before streaming)
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    // Add assistant message with tool calls to history
    conversationHistory.push(assistantMessage);

    // Execute all tool calls IN PARALLEL for faster response
    const toolExecutionPromises = assistantMessage.tool_calls.map(async (toolCall) => {
      const { id, function: func } = toolCall;
      const parameters = JSON.parse(func.arguments);

      console.log(`Executing tool: ${func.name}`, parameters);

      try {
        const result = await executeTool(func.name, parameters);
        toolResults.push(result);

        const toolCallData: ToolCall = {
          id,
          tool: func.name,
          parameters,
          result,
        };
        toolCalls.push(toolCallData);

        const toolMessage: ChatCompletionToolMessageParam = {
          role: 'tool',
          tool_call_id: id,
          content: JSON.stringify(result),
        };

        return { toolCallData, toolMessage, error: null };
      } catch (error) {
        console.error(`Tool call failed: ${func.name}`, error);
        const errorMessage: ChatCompletionToolMessageParam = {
          role: 'tool',
          tool_call_id: id,
          content: JSON.stringify({
            error: 'Tool execution failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
        };

        return { toolCallData: null, toolMessage: errorMessage, error };
      }
    });

    // Wait for all tools to complete
    const results = await Promise.all(toolExecutionPromises);

    // Add all tool messages to conversation history
    results.forEach(({ toolMessage }) => {
      conversationHistory.push(toolMessage);
    });

    // Yield tool calls first
    yield {
      type: 'toolCalls',
      toolCalls,
    };

    // Extract cards from tool results and yield them IMMEDIATELY
    const cards = extractCardsFromToolResults(toolCalls);

    // Stream cards early (before AI response) for instant UX
    if (cards.length > 0) {
      yield {
        type: 'cards',
        cards,
      };
    }

    // Extract videos from tool results and yield them
    let allVideos = extractVideosFromToolResults(toolCalls);
    if (allVideos.length > 0) {
      yield {
        type: 'videos',
        videos: allVideos,
      };
    }

    // Always search for videos if destination is known and AI didn't already search
    if (allVideos.length === 0 && promptContext.destination) {
      // Use smart video search for deeper analysis
      const smartResult = await smartVideoSearch(userMessage, promptContext.destination);
      if (smartResult && smartResult.videos.length > 0) {
        // Yield smart video result
        yield { type: 'smartVideoResult', smartVideoResult: smartResult };
        // Also yield videos for backwards compatibility
        allVideos = smartResult.videos.map(v => v.video);
        yield { type: 'videos', videos: allVideos };
      } else {
        // Fallback to regular video search
        const autoVideos = await autoSearchVideos(
          userMessage,
          promptContext.destination,
          tripContext?.preferences?.country,
          promptContext.travelerType
        );
        if (autoVideos.length > 0) {
          allVideos = autoVideos;
          yield { type: 'videos', videos: autoVideos };
        }
      }
    }

    // Analyze the featured video (first video) for summary and places (only if no smart result)
    if (allVideos.length > 0 && promptContext.destination) {
      // Skip if we already have smart video result with analysis
      const hasSmartAnalysis = allVideos.some(v =>
        (v as any).analysis?.thingsToDo?.length > 0
      );
      if (!hasSmartAnalysis) {
        const analysis = await analyzeVideo(allVideos[0], promptContext.destination);
        if (analysis) {
          yield { type: 'videoAnalysis', videoAnalysis: analysis };
        }
      }
    }

    // Now stream the final response with tool results
    const stream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: conversationHistory,
      stream: true,
    });

    // Buffer full response for itinerary parsing
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        yield {
          type: 'content',
          content,
        };
      }
    }

    // Parse and yield itinerary if in itinerary mode
    if (chatMode === 'itinerary') {
      const itinerary = parseItineraryFromResponse(fullResponse);
      if (itinerary) {
        yield {
          type: 'itinerary',
          itinerary,
        };
      }
    }
  } else {
    // No tool calls - check if video search will handle this
    let handledByVideoSearch = false;

    // Run smartVideoSearch FIRST if destination exists
    // This prevents the flash of intermediate AI text
    if (promptContext.destination) {
      const smartResult = await smartVideoSearch(userMessage, promptContext.destination);
      if (smartResult && smartResult.videos.length > 0) {
        yield { type: 'smartVideoResult', smartVideoResult: smartResult };
        yield { type: 'videos', videos: smartResult.videos.map(v => v.video) };
        handledByVideoSearch = true;
      }
    }

    // Only stream AI content if video search didn't handle it
    if (!handledByVideoSearch) {
      const stream = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: conversationHistory,
        stream: true,
      });

      // Buffer full response for itinerary parsing
      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          yield {
            type: 'content',
            content,
          };
        }
      }

      // Parse and yield itinerary if in itinerary mode
      if (chatMode === 'itinerary') {
        const itinerary = parseItineraryFromResponse(fullResponse);
        if (itinerary) {
          yield {
            type: 'itinerary',
            itinerary,
          };
        }
      }

      // Fallback video search if smartVideoSearch wasn't available or failed
      if (promptContext.destination) {
        const autoVideos = await autoSearchVideos(
          userMessage,
          promptContext.destination,
          tripContext?.preferences?.country,
          promptContext.travelerType
        );
        if (autoVideos.length > 0) {
          yield { type: 'videos', videos: autoVideos };
        }
      }
    }
  }

  // Extract citations from tool results
  const citations = extractCitations(toolResults);

  // Yield final metadata
  yield {
    type: 'done',
    citations,
    intent: { intent: 'general' as Intent, confidence: 0.5 }, // Legacy field
    chatMode,
  };
}
