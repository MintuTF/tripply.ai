'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Users, Heart, Home, UserCircle } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { AIInputBox } from './AIInputBox';
import { AIResponseCard } from './AIResponseCard';
import { ChatVideoCarousel } from '@/components/chat/ChatVideoCarousel';
import type {
  CityData,
  TravelPlace,
  AISession,
  AIMessage,
  AIStructuredResponse,
  TravelerProfile
} from '@/lib/travel/types';
import { cn, generateUUID } from '@/lib/utils';

interface AIAssistantSectionProps {
  city: CityData;
  places: TravelPlace[];
  session: AISession;
}

const profileOptions: { id: TravelerProfile; label: string; icon: any }[] = [
  { id: 'solo', label: 'Solo', icon: UserCircle },
  { id: 'couple', label: 'Couple', icon: Heart },
  { id: 'family', label: 'Family', icon: Home },
  { id: 'friends', label: 'Friends', icon: Users },
];

export function AIAssistantSection({
  city,
  places,
  session
}: AIAssistantSectionProps) {
  const { addMessage, setTravelerProfile, setDurationDays, selectPlace, dispatch } = useTravel();
  const [isLoading, setIsLoading] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSendMessage = async (message: string) => {
    // If profile not collected, show prompt first
    if (!session.profileCollected) {
      setPendingMessage(message);
      setShowProfilePrompt(true);
      return;
    }

    await sendMessageToAI(message);
  };

  const handleProfileSelect = async (profile: TravelerProfile) => {
    setTravelerProfile(profile);
    setShowProfilePrompt(false);

    // Extract duration from pending message if present
    const durationMatch = pendingMessage?.match(/(\d+)\s*day/i);
    if (durationMatch) {
      setDurationDays(parseInt(durationMatch[1]));
    }

    // Now send the pending message
    if (pendingMessage) {
      await sendMessageToAI(pendingMessage);
      setPendingMessage(null);
    }
  };

  const sendMessageToAI = async (message: string) => {
    // Add user message
    const userMessage: AIMessage = {
      id: generateUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setIsLoading(true);

    try {
      const response = await fetch('/api/travel/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          city: city.name,
          country: city.country,
          travelerProfile: session.travelerProfile,
          durationDays: session.durationDays,
          message,
          alreadyRecommendedPlaceIds: session.messages
            .filter(m => m.structuredResponse)
            .flatMap(m => m.structuredResponse?.items.map(i => i.placeId) || []),
          places: places.map(p => ({
            id: p.id,
            name: p.name,
            rating: p.rating,
            categories: p.categories,
            shortDescription: p.shortDescription || p.description?.slice(0, 100),
            popularityScore: p.popularityScore,
            area: p.area,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Parse structured response
        let structuredResponse: AIStructuredResponse | undefined;
        if (data.structured) {
          structuredResponse = data.structured;
        }

        const assistantMessage: AIMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: data.message || data.summary || '',
          timestamp: new Date(),
          structuredResponse,
          videos: data.videos || [],
        };
        addMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Add error message
      const errorMessage: AIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: "I'm sorry, I had trouble processing your request. Please try again.",
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = (question: string) => {
    handleSendMessage(question);
  };

  const handleShowOnMap = (placeId: string) => {
    const place = places.find(p => p.id === placeId);
    if (place) {
      dispatch({ type: 'SET_SHOW_MAP', payload: true });
      selectPlace(place);
    }
  };

  const handlePlaceClick = (placeId: string) => {
    const place = places.find(p => p.id === placeId);
    if (place) {
      selectPlace(place);
    }
  };

  // Generate dynamic header
  const headerText = session.travelerProfile && session.durationDays
    ? `Personalized ${session.durationDays}-Day ${session.travelerProfile.charAt(0).toUpperCase() + session.travelerProfile.slice(1)} Trip Ideas for ${city.name}`
    : `AI Travel Assistant for ${city.name}`;

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {headerText}
          </h2>
          <p className="text-sm text-gray-500">
            Ask me anything about your trip
          </p>
        </div>
      </div>

      {/* Profile Selection Prompt */}
      <AnimatePresence>
        {showProfilePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">
                Who are you traveling with?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This helps me give you personalized recommendations
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profileOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleProfileSelect(option.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="space-y-6 mb-8">
        {session.messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              message.role === 'user' ? 'ml-auto max-w-md' : 'max-w-full'
            )}
          >
            {message.role === 'user' ? (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-br-md px-4 py-3">
                <p>{message.content}</p>
              </div>
            ) : message.structuredResponse ? (
              <div className="space-y-4">
                {/* Videos above response */}
                {message.videos && message.videos.length > 0 && (
                  <ChatVideoCarousel
                    videos={message.videos}
                    cityName={city.name}
                    onPlaceClick={(place) => {
                      const matchedPlace = places.find(p =>
                        p.name.toLowerCase().includes(place.name.toLowerCase()) ||
                        place.name.toLowerCase().includes(p.name.toLowerCase())
                      );
                      if (matchedPlace) selectPlace(matchedPlace);
                    }}
                  />
                )}
                <AIResponseCard
                  response={message.structuredResponse}
                  places={places}
                  onPlaceClick={handlePlaceClick}
                  onShowOnMap={handleShowOnMap}
                  onFollowUp={handleFollowUp}
                  isCollapsed={index < session.messages.length - 1}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-purple-50">
                <p className="text-gray-700">{message.content}</p>
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-500">Thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter prompts (show when no messages) */}
      {session.messages.length === 0 && !showProfilePrompt && (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {[
              `What are the must-see places in ${city.name}?`,
              `Plan a romantic day in ${city.name}`,
              `Best food spots in ${city.name}`,
              `Hidden gems in ${city.name}`,
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(prompt)}
                className="px-4 py-2 rounded-full border border-purple-200 text-purple-700 text-sm hover:bg-purple-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <AIInputBox
        onSend={handleSendMessage}
        isLoading={isLoading}
        placeholder={`Ask about ${city.name}...`}
        disabled={showProfilePrompt}
      />
    </section>
  );
}
