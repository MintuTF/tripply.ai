/**
 * Intent Detection System
 *
 * Automatically detects whether the user is in exploration or planning mode
 * based on their message content and context. This is INVISIBLE to the user -
 * no modes are ever exposed or mentioned.
 */

import { Message } from '@/types';

export type ChatIntent = 'exploration' | 'planning';

export interface IntentSignals {
  mentionsDays: boolean;
  mentionsPlanning: boolean;
  mentionsTiming: boolean;
  mentionsOrder: boolean;
  mentionsOrganizing: boolean;
  savedPlacesCount: number;
  asksQuestion: boolean;
  isFollowUp: boolean;
}

// Patterns that suggest planning intent
const PLANNING_PATTERNS = {
  days: /\b(\d+)\s*(day|days|night|nights)\b/i,
  dayReference: /\bday\s*[1-9]\b/i,
  planning: /\b(plan|itinerary|schedule|organize|arrange|structure|map out|layout)\b/i,
  timing: /\b(morning|afternoon|evening|night|am|pm|breakfast|lunch|dinner|sunrise|sunset)\b/i,
  order: /\b(first|then|after|before|next|followed by|start with|end with|begin|finish)\b/i,
  organizing: /\b(put together|create|make|build|set up)\s*(a|an|my|the)?\s*(plan|itinerary|schedule|trip)\b/i,
  duration: /\b(how long|duration|time needed|spend|stay)\b/i,
};

// Patterns that suggest exploration intent
const EXPLORATION_PATTERNS = {
  question: /\?$/,
  asking: /\b(what|where|which|how|is|are|can|should|would|could|do you recommend|any|best|good|worth)\b/i,
  browsing: /\b(show me|tell me about|looking for|interested in|want to see|explore|discover)\b/i,
  opinions: /\b(worth it|recommend|suggest|think|opinion|favorite|popular|must see|hidden gem)\b/i,
};

/**
 * Analyze a message for intent signals
 */
function analyzeMessage(message: string): Omit<IntentSignals, 'savedPlacesCount' | 'isFollowUp'> {
  const text = message.toLowerCase().trim();

  return {
    mentionsDays: PLANNING_PATTERNS.days.test(text) || PLANNING_PATTERNS.dayReference.test(text),
    mentionsPlanning: PLANNING_PATTERNS.planning.test(text),
    mentionsTiming: PLANNING_PATTERNS.timing.test(text),
    mentionsOrder: PLANNING_PATTERNS.order.test(text),
    mentionsOrganizing: PLANNING_PATTERNS.organizing.test(text),
    asksQuestion: EXPLORATION_PATTERNS.question.test(text) || EXPLORATION_PATTERNS.asking.test(text),
  };
}

/**
 * Check if the conversation has been in planning mode recently
 */
function hasRecentPlanningContext(history: Message[]): boolean {
  // Look at the last 5 messages for planning context
  const recentMessages = history.slice(-5);

  for (const msg of recentMessages) {
    if (msg.role === 'assistant') {
      const text = msg.text.toLowerCase();
      // Check if AI has been providing structured plans
      if (
        text.includes('day 1') ||
        text.includes('day 2') ||
        text.includes('itinerary') ||
        text.includes('here\'s a plan') ||
        text.includes('i\'ll organize')
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Main intent detection function
 *
 * Rules:
 * - Default is exploration
 * - Switch to planning when:
 *   1. User mentions days/timing explicitly
 *   2. Uses planning words (plan, itinerary, schedule, organize)
 *   3. Has 3+ saved places AND mentions organizing
 *   4. Asks about order/sequence
 *   5. Continuing a planning conversation
 */
export function detectIntent(
  message: string,
  savedPlacesCount: number,
  conversationHistory: Message[]
): ChatIntent {
  const signals = analyzeMessage(message);

  // Strong planning signals - always trigger planning
  if (signals.mentionsDays) {
    return 'planning';
  }

  if (signals.mentionsPlanning || signals.mentionsOrganizing) {
    return 'planning';
  }

  // Order/sequence questions with context
  if (signals.mentionsOrder && signals.mentionsTiming) {
    return 'planning';
  }

  // Multiple saved places + organizing intent
  if (savedPlacesCount >= 3 && (signals.mentionsOrder || signals.mentionsOrganizing)) {
    return 'planning';
  }

  // Check for follow-up to existing plan
  if (hasRecentPlanningContext(conversationHistory)) {
    // If user is asking to modify the plan
    const modifyPatterns = /\b(change|swap|replace|add|remove|adjust|make it|more|less|slower|faster)\b/i;
    if (modifyPatterns.test(message)) {
      return 'planning';
    }
  }

  // Default to exploration
  return 'exploration';
}

/**
 * Get detailed signals for debugging/logging
 */
export function getIntentSignals(
  message: string,
  savedPlacesCount: number,
  conversationHistory: Message[]
): IntentSignals {
  const baseSignals = analyzeMessage(message);

  return {
    ...baseSignals,
    savedPlacesCount,
    isFollowUp: hasRecentPlanningContext(conversationHistory),
  };
}

/**
 * Generate a natural transition phrase for planning mode
 * The AI should use these instead of mentioning "modes"
 */
export function getPlanningTransitionPhrase(context: {
  days?: number;
  destination?: string;
  travelerType?: string;
}): string {
  const phrases = [
    `I'll organize this into a simple${context.days ? ` ${context.days}-day` : ''} plan.`,
    `Let me put together a${context.days ? ` ${context.days}-day` : ''} itinerary for you.`,
    `Here's how I'd structure your${context.days ? ` ${context.days}-day` : ''} trip.`,
    `I'll map this out for you${context.days ? ` over ${context.days} days` : ''}.`,
  ];

  return phrases[Math.floor(Math.random() * phrases.length)];
}
