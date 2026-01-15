'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { ExternalLink, MapPin, Clock, DollarSign, Star, Calendar, Utensils, Hotel, Plane } from 'lucide-react';
import { PlaceLinkPopover } from './PlaceLinkPopover';
import { PlaceCard } from '@/types';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onAddToShortlist?: (card: PlaceCard) => void;
  destinationCity?: string;
}

// Helper function to detect if bold text is likely a place name
function isLikelyPlaceName(text: string): boolean {
  // Skip if text is too short or too long
  if (text.length < 3 || text.length > 60) return false;

  // Skip common non-place patterns
  const nonPlacePatterns = [
    /^\d+%/, // Percentages
    /^\$|^€|^£/, // Prices
    /^\d+:\d+/, // Times
    /^\d+\s*(am|pm|AM|PM)/, // Times
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // Dates
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i, // Days
    /^Day\s+\d+/i, // Day numbers
    /^(Morning|Afternoon|Evening|Night)$/i, // Time of day
    /^(Tip|Note|Warning|Important|Price|Cost|Budget|Total)$/i, // Common labels
    /^(Free|Included|Optional|Recommended)$/i, // Status words
    /^\d+\s*(hour|minute|day|week|month|year)s?/i, // Durations
    /^[A-Z]{2,}$/, // All caps abbreviations
    // Action verb phrases - these are NOT place names
    /^(Explore|Visit|Check|Try|Enjoy|Experience|Discover|See|Find|Book|Stay|Eat|Dine|Tour|Walk|Take|Get|Go|Make|Have|Do|Watch|Attend|Join|Sample|Taste|Stroll|Wander|Browse|Shop|Relax|Unwind)\s/i,
    // Articles followed by lowercase words (descriptive phrases)
    /^(The|A|An)\s+[a-z]/,
    // Descriptive phrases
    /world-class|famous|best|great|amazing|top|must-see|must see|popular|unique|local|authentic|traditional|modern|historic|beautiful|stunning|gorgeous|incredible|fantastic|wonderful|lovely|perfect|ideal|excellent|outstanding/i,
    // List/continuation phrases
    /and many|and more|such as|like the|including|features|offers|provides|known for|famous for/i,
    // Common sentence starters
    /^(Here|There|These|Those|Some|Many|Most|All|Other|More|Less|Few|Several|Various|Numerous|Countless)/i,
  ];

  for (const pattern of nonPlacePatterns) {
    if (pattern.test(text)) return false;
  }

  // Check if it looks like a place name:
  // - Contains at least one capital letter
  // - Has 1-5 words (reduced from 8)
  // - Contains mostly letters, spaces, hyphens, apostrophes, accented chars
  const words = text.split(/\s+/);
  if (words.length > 5) return false;

  // Must have at least one capitalized word (proper noun indicator)
  const hasCapitalizedWord = words.some(word => /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(word));
  if (!hasCapitalizedWord) return false;

  // Should be mostly letters/spaces (allow hyphens, apostrophes, accents)
  const validChars = /^[A-Za-zÀ-ÿ\s\-'&().]+$/;
  if (!validChars.test(text)) return false;

  // Likely a place name
  return true;
}

// Pre-process place:// links to a format react-markdown will recognize
// Converts [text](place://query) to [text](https://place.voyagr.internal/encoded-query)
function preprocessPlaceLinks(content: string): string {
  return content.replace(
    /\[([^\]]+)\]\(place:\/\/([^)]+)\)/g,
    (_, text, query) => `[${text}](https://place.voyagr.internal/${encodeURIComponent(query)})`
  );
}

export function MarkdownRenderer({ content, className, onAddToShortlist, destinationCity }: MarkdownRendererProps) {
  // Pre-process content to convert place:// links to recognizable format
  const processedContent = preprocessPlaceLinks(content);
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
        // Headers with contextual icons based on content
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 mt-6 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => {
          // Detect section type and add appropriate icon
          const text = String(children).toLowerCase();
          let icon = '✨';
          if (text.includes('quick answer')) icon = '💬';
          else if (text.includes('recommendation')) icon = '⭐';
          else if (text.includes('tip') || text.includes('insider')) icon = '💡';
          else if (text.includes('avoid')) icon = '⚠️';
          else if (text.includes('best') || text.includes('top')) icon = '🏆';
          else if (text.includes('area') || text.includes('neighborhood') || text.includes('stay')) icon = '🏠';
          else if (text.includes('food') || text.includes('eat') || text.includes('restaurant')) icon = '🍽️';
          else if (text.includes('transport') || text.includes('getting')) icon = '🚇';

          return (
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 mt-5 first:mt-0 flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              {children}
            </h2>
          );
        },
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-4 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 mt-3 first:mt-0">
            {children}
          </h4>
        ),

        // Paragraphs with proper spacing and styling
        p: ({ children }) => {
          const text = String(children);
          // Special styling for Pro tip paragraph
          if (text.startsWith('💡') || text.toLowerCase().includes('pro tip')) {
            return (
              <p className="text-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-amber-800 dark:text-amber-200 leading-relaxed mb-4 last:mb-0">
                {children}
              </p>
            );
          }
          return (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 last:mb-0">
              {children}
            </p>
          );
        },

        // Enhanced tables with glassmorphism
        table: ({ children }) => (
          <div className="overflow-x-auto my-6 rounded-2xl border-2 border-border/50 shadow-depth">
            <table className="w-full border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="gradient-primary text-white">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="glassmorphism">
            {children}
          </tbody>
        ),
        tr: ({ children, ...props }) => (
          <tr
            className={cn(
              'border-b border-border/30 transition-all duration-200',
              !props.isHeader && 'hover:bg-primary/5'
            )}
          >
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-6 py-4 text-left text-sm font-bold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-4 text-sm">
            {children}
          </td>
        ),

        // Unordered lists with clean styling
        ul: ({ children }) => (
          <ul className="space-y-2.5 my-3 pl-1">
            {children}
          </ul>
        ),
        li: ({ children, ordered }) => {
          return ordered ? (
            <li className="flex gap-3 items-start text-gray-700 dark:text-gray-300">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold mt-0.5">
                {/* Number will be auto-generated by CSS */}
              </span>
              <span className="flex-1 leading-relaxed">{children}</span>
            </li>
          ) : (
            <li className="flex gap-2.5 items-start text-gray-700 dark:text-gray-300">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span className="flex-1 leading-relaxed">{children}</span>
            </li>
          );
        },

        // Ordered lists with numbered badges
        ol: ({ children }) => (
          <ol className="space-y-2 my-4 list-none">
            {children}
          </ol>
        ),

        // Enhanced links - handle place:// links specially
        a: ({ children, href }) => {
          // Check for our special place link format (preprocessed from place://)
          if (href?.startsWith('https://place.voyagr.internal/')) {
            const placeQuery = decodeURIComponent(href.replace('https://place.voyagr.internal/', ''));
            return (
              <PlaceLinkPopover query={placeQuery} onAddToShortlist={onAddToShortlist}>
                {children}
              </PlaceLinkPopover>
            );
          }

          // Also keep the old place:// check for backwards compatibility
          if (href?.startsWith('place://')) {
            const placeQuery = decodeURIComponent(href.replace('place://', ''));
            return (
              <PlaceLinkPopover query={placeQuery} onAddToShortlist={onAddToShortlist}>
                {children}
              </PlaceLinkPopover>
            );
          }

          // Regular external link
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-medium hover:text-accent-foreground transition-colors duration-200 underline decoration-primary/30 hover:decoration-primary decoration-2 underline-offset-2"
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        },

        // Strong (bold) text - auto-detect place names
        strong: ({ children }) => {
          const text = String(children);

          // Check if this looks like a place name
          if (isLikelyPlaceName(text)) {
            // Build the search query with city context if available
            const query = destinationCity ? `${text}, ${destinationCity}` : text;
            return (
              <PlaceLinkPopover query={query} onAddToShortlist={onAddToShortlist}>
                <strong className="font-bold text-primary cursor-pointer hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary decoration-2 underline-offset-2 transition-colors">
                  {children}
                </strong>
              </PlaceLinkPopover>
            );
          }

          return (
            <strong className="font-bold text-foreground">
              {children}
            </strong>
          );
        },

        // Emphasis (italic) text
        em: ({ children }) => (
          <em className="italic text-foreground/90">
            {children}
          </em>
        ),

        // Code blocks
        code: ({ inline, children, className }) => {
          if (inline) {
            return (
              <code className="px-2 py-0.5 rounded-lg bg-muted/80 text-primary font-mono text-sm border border-border/30">
                {children}
              </code>
            );
          }
          return (
            <pre className="my-4 p-4 rounded-2xl bg-muted/50 border-2 border-border/30 overflow-x-auto">
              <code className={cn('font-mono text-sm', className)}>
                {children}
              </code>
            </pre>
          );
        },

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="my-4 pl-6 border-l-4 border-primary/50 italic text-foreground/80 bg-primary/5 py-3 pr-4 rounded-r-xl">
            {children}
          </blockquote>
        ),

        // Horizontal rules - subtle divider
        hr: () => (
          <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
        ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
