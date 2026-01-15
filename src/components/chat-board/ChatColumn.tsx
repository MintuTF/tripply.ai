'use client';

import { useState, useRef } from 'react';
import { Message, PlaceCard } from '@/types';
import { ChatInput } from '../chat/ChatInput';
import { MarkdownRenderer } from '../chat/MarkdownRenderer';
import { DraggablePlaceCard } from './DraggablePlaceCard';
import { cn, generateUUID } from '@/lib/utils';
import { Sparkles, Wrench, ExternalLink } from 'lucide-react';

interface ChatColumnProps {
  tripId?: string;
  onAddToShortlist: (card: PlaceCard) => void;
  shortlistedCardIds: Set<string>;
  className?: string;
  destinationCity?: string;
}

export function ChatColumn({
  tripId,
  onAddToShortlist,
  shortlistedCardIds,
  className,
  destinationCity,
}: ChatColumnProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Find hotels in Paris under $200/night',
    'Best restaurants in Tokyo',
    'Top activities in Barcelona',
    'Hidden gems in Lisbon',
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: generateUUID(),
      trip_id: tripId || 'temp',
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };

    const assistantMessageId = generateUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      trip_id: tripId || 'temp',
      role: 'assistant',
      text: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          message: text,
          messages: messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'toolCalls') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, tool_calls_json: data.toolCalls }
                      : msg
                  )
                );
              } else if (data.type === 'cards') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, cards_json: data.cards }
                      : msg
                  )
                );
              } else if (data.type === 'content') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, text: msg.text + data.content }
                      : msg
                  )
                );
              } else if (data.type === 'done') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, citations_json: data.citations }
                      : msg
                  )
                );
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Travel Assistant</h3>
          <p className="text-xs text-muted-foreground">Ask about places, hotels, restaurants...</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Sparkles className="h-10 w-10 text-primary/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask me about places to visit, hotels, restaurants, or activities
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="text-left px-3 py-2 rounded-lg border border-border bg-card/50 hover:border-primary/50 hover:bg-card transition-all text-xs text-foreground/80 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              if (message.role === 'user') {
                return (
                  <div key={message.id} className="mb-4">
                    <div className="text-sm font-medium text-foreground bg-primary/10 rounded-lg px-3 py-2 inline-block">
                      {message.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className="space-y-4">
                  {/* Tool calls badges */}
                  {message.tool_calls_json && message.tool_calls_json.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(message.tool_calls_json as any[]).map((toolCall, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-border bg-muted/50 text-muted-foreground"
                        >
                          <Wrench className="h-2.5 w-2.5" />
                          {toolCall.tool.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cards Carousel - Horizontal scroll */}
                  {message.cards_json && message.cards_json.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      {message.cards_json.map((card) => (
                        <div key={card.id} className="flex-shrink-0 w-64 snap-start">
                          <DraggablePlaceCard
                            card={card}
                            onAddToShortlist={onAddToShortlist}
                            showAddButton={!shortlistedCardIds.has(card.id)}
                            isDraggable={!shortlistedCardIds.has(card.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text content */}
                  {message.text && (
                    <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                      <MarkdownRenderer content={message.text} onAddToShortlist={onAddToShortlist} destinationCity={destinationCity} />
                    </div>
                  )}

                  {/* Citations */}
                  {message.citations_json && message.citations_json.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Sources</div>
                      <div className="space-y-1">
                        {(message.citations_json as any[]).slice(0, 3).map((citation, i) => (
                          <a
                            key={i}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            <span className="truncate">{citation.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 py-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" />
                </div>
                <span className="text-xs text-muted-foreground">Searching...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="Ask about places, hotels, restaurants..."
          size="small"
        />
      </div>
    </div>
  );
}
