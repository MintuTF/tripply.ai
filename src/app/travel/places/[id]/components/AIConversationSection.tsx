'use client';

import { useReducer, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ChatMessage, type ChatMessageData } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';
import { SuggestedQuestions } from './chat/SuggestedQuestions';

interface AIConversationSectionProps {
  placeId: string;
  placeName: string;
  placeCategories: string[];
  placeDescription?: string;
}

// State and action types
interface ChatState {
  messages: ChatMessageData[];
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessageData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
}

// Initial state
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

export function AIConversationSection({
  placeId,
  placeName,
  placeCategories,
  placeDescription,
}: AIConversationSectionProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/travel/ai/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'placeChat',
          place: {
            id: placeId,
            name: placeName,
            categories: placeCategories,
            description: placeDescription,
          },
          message: content,
          conversationHistory: state.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: ChatMessageData = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
    } catch (error) {
      console.error('Chat error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to get response. Please try again.',
      });

      // Add error message as AI response
      const errorMessage: ChatMessageData = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error. Please try asking your question again.",
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Ask AI about {placeName}
            </h2>
            <p className="text-sm text-gray-600">
              Get personalized recommendations and insights
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden">
          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            {state.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  What would you like to know?
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Ask me anything about {placeName} - from the best time to
                  visit, tips for your trip, or what to expect.
                </p>
              </div>
            ) : (
              state.messages.map((message, index) => (
                <ChatMessage key={message.id} message={message} index={index} />
              ))
            )}

            {/* Loading indicator */}
            {state.isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white/50">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <SuggestedQuestions
              placeName={placeName}
              categories={placeCategories}
              onSelect={handleSuggestedQuestion}
              disabled={state.isLoading}
            />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <ChatInput
              onSend={sendMessage}
              isLoading={state.isLoading}
              placeholder={`Ask about ${placeName}...`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
