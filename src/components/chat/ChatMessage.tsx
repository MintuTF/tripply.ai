'use client';

import { Message, Citation } from '@/types';
import { cn } from '@/lib/utils';
import { ExternalLink, Wrench } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CardGrid } from '../cards/CardGrid';
import { useTripList } from '@/hooks/useTripList';

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
  destinationCity?: string;
}

export function ChatMessage({ message, isLatest, destinationCity }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const { addToTrip, savePlace } = useTripList();

  // User messages are just queries - rendered by parent component
  if (isUser) {
    return null;
  }

  return (
    <div className="py-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Assistant Response - Flat, document-style */}
      <div className="space-y-6">
        {/* Cards Grid - Rich place cards with images - DISPLAYED FIRST/ON TOP */}
        {message.cards_json && Array.isArray(message.cards_json) && message.cards_json.length > 0 && (
          <CardGrid
            cards={message.cards_json}
            onAddToTrip={addToTrip}
            onSave={savePlace}
          />
        )}

        {/* Markdown Content */}
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <MarkdownRenderer content={message.text} onAddToShortlist={savePlace} destinationCity={destinationCity} />
        </div>

        {/* Tool Calls - Simplified badges */}
        {message.tool_calls_json && Array.isArray(message.tool_calls_json) && message.tool_calls_json.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {(message.tool_calls_json as any[]).map((toolCall, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border border-border bg-muted/50 text-muted-foreground"
              >
                <Wrench className="h-3 w-3" />
                {toolCall.tool.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Citations - Flat list */}
        {message.citations_json && Array.isArray(message.citations_json) && message.citations_json.length > 0 && (
          <div className="pt-6 border-t border-border/50">
            <div className="text-sm font-semibold text-muted-foreground mb-3">
              Sources
            </div>
            <div className="space-y-2">
              {(message.citations_json as Citation[]).map((citation, i) => (
                <a
                  key={i}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline group"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                  <span className="truncate">{citation.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground pt-2">
          {new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Divider between responses */}
      {!isLatest && (
        <hr className="mt-12 border-border/50" />
      )}
    </div>
  );
}
