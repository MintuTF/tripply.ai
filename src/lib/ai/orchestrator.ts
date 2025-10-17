import { openai, DEFAULT_MODEL, SYSTEM_PROMPT } from './openai';
import { TOOLS, isValidToolCall } from './tools';
import { detectIntent } from '../layouts';
import { extractCardsFromToolResults } from './cardExtractor';
import type { Message, ToolCall, Citation, Intent, PlaceCard } from '@/types';
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';

// Import tool implementations
import { getWeather } from '../tools/weather';
import { searchPlaces, getPlaceDetails, calculateTravelTime } from '../tools/places';
import { searchWeb } from '../tools/search';
import { searchEvents } from '../tools/events';

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
};

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
 * Main orchestration function
 * Handles the conversation with OpenAI including tool calls
 */
export async function orchestrateChat(params: {
  messages: Message[];
  userMessage: string;
  tripContext?: {
    title: string;
    dates?: { start: string; end: string };
    budget_range?: [number, number];
    preferences?: Record<string, any>;
  };
}): Promise<{
  response: string;
  toolCalls: ToolCall[];
  citations: Citation[];
  cards: PlaceCard[];
  intent: { intent: Intent; confidence: number };
}> {
  const { messages, userMessage, tripContext } = params;

  // Detect intent from user message
  const intentResult = detectIntent(userMessage);

  // Build conversation history
  const conversationHistory: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
  ];

  // Add trip context if available
  if (tripContext) {
    conversationHistory.push({
      role: 'system',
      content: `Trip Context:
- Title: ${tripContext.title}
${tripContext.dates ? `- Dates: ${tripContext.dates.start} to ${tripContext.dates.end}` : ''}
${tripContext.budget_range ? `- Budget: $${tripContext.budget_range[0]}-${tripContext.budget_range[1]}/night` : ''}
${tripContext.preferences ? `- Preferences: ${JSON.stringify(tripContext.preferences)}` : ''}`,
    });
  }

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

  return {
    response: assistantMessage.content || 'I apologize, but I could not generate a response.',
    toolCalls,
    citations,
    cards,
    intent: intentResult,
  };
}

/**
 * Streaming orchestration function
 * Similar to orchestrateChat but streams the response token by token
 */
export async function* orchestrateChatStream(params: {
  messages: Message[];
  userMessage: string;
  tripContext?: {
    title: string;
    dates?: { start: string; end: string };
    budget_range?: [number, number];
    preferences?: Record<string, any>;
  };
}): AsyncGenerator<{
  type: 'toolCalls' | 'content' | 'done';
  toolCalls?: ToolCall[];
  content?: string;
  citations?: Citation[];
  cards?: PlaceCard[];
  intent?: { intent: Intent; confidence: number };
}> {
  const { messages, userMessage, tripContext } = params;

  // Detect intent from user message
  const intentResult = detectIntent(userMessage);

  // Build conversation history
  const conversationHistory: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
  ];

  // Add trip context if available
  if (tripContext) {
    conversationHistory.push({
      role: 'system',
      content: `Trip Context:
- Title: ${tripContext.title}
${tripContext.dates ? `- Dates: ${tripContext.dates.start} to ${tripContext.dates.end}` : ''}
${tripContext.budget_range ? `- Budget: $${tripContext.budget_range[0]}-${tripContext.budget_range[1]}/night` : ''}
${tripContext.preferences ? `- Preferences: ${JSON.stringify(tripContext.preferences)}` : ''}`,
    });
  }

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

    // Yield tool calls first
    yield {
      type: 'toolCalls',
      toolCalls,
    };

    // Now stream the final response with tool results
    const stream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: conversationHistory,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield {
          type: 'content',
          content,
        };
      }
    }
  } else {
    // No tool calls - stream response directly
    const stream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: conversationHistory,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield {
          type: 'content',
          content,
        };
      }
    }
  }

  // Extract citations from tool results
  const citations = extractCitations(toolResults);

  // Extract structured cards from tool results
  const cards = extractCardsFromToolResults(toolCalls);

  // Yield final data
  yield {
    type: 'done',
    citations,
    cards,
    intent: intentResult,
  };
}
