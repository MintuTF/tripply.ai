'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  DollarSign,
  MapPin,
  Maximize2,
  X,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard, ToolCall } from '@/types';
import type { BudgetConstraints } from './BudgetConstraintsSidebar';
import { BudgetConstraintsSidebar } from './BudgetConstraintsSidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { downloadMarkdown, copyMarkdownToClipboard } from '@/lib/utils/trip-markdown-export';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CompactChatAreaProps {
  destination: string;
  destinationCoords?: { lat: number; lng: number } | null;
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  toolProgress?: ToolCall[];
  budgetConstraints?: BudgetConstraints;
  onBudgetUpdate?: (constraints: BudgetConstraints) => void;
  onMapToggle?: () => void;
  className?: string;
}

// Helper function to get user-friendly tool labels
function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    'search_places': '🔍 Searching places...',
    'search_hotel_offers': '🏨 Finding hotels...',
    'get_weather': '🌤️ Checking weather...',
    'search_events': '🎉 Looking for events...',
    'search_web': '🌐 Searching web...',
    'search_reddit': '💬 Checking Reddit...',
    'calculate_travel_time': '🚗 Calculating route...',
    'get_place_details': '📍 Getting details...',
  };
  return labels[toolName] || '🤔 Thinking...';
}

export function CompactChatArea({
  destination,
  messages = [],
  onSendMessage,
  isLoading = false,
  toolProgress = [],
  budgetConstraints,
  onBudgetUpdate,
  onMapToggle,
  className,
}: CompactChatAreaProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollHeightRef = useRef<number>(0);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage?.(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-expand when AI starts responding
  useEffect(() => {
    if (isLoading || toolProgress.length > 0) {
      setIsExpanded(true);
    }
  }, [isLoading, toolProgress.length]);

  // Check if user is near bottom of scroll container
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100; // Within 100px of bottom
  }, []);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const nearBottom = isNearBottom();

    // Show scroll button if user has scrolled up
    setShowScrollButton(!nearBottom && messages.length > 2);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Mark as user scrolling
    setIsUserScrolling(true);

    // Reset after 150ms of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [isNearBottom, messages.length]);

  // Smart auto-scroll: Only scroll if user is near bottom
  useEffect(() => {
    if (!isExpanded || !messagesContainerRef.current) return;

    // Don't auto-scroll if user is actively scrolling
    if (isUserScrolling) return;

    // Only auto-scroll if user is near bottom
    if (!isNearBottom()) return;

    // Clear any pending auto-scroll
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }

    // Check if content height changed (new message or token)
    const currentScrollHeight = messagesContainerRef.current.scrollHeight;
    const heightChanged = currentScrollHeight !== lastScrollHeightRef.current;
    lastScrollHeightRef.current = currentScrollHeight;

    if (!heightChanged) return;

    // During streaming: instant scroll (no animation to prevent glitches)
    // After streaming: smooth scroll
    const scrollBehavior = isLoading ? 'auto' : 'smooth';

    // Debounce during streaming (16ms = 60fps)
    const delay = isLoading ? 16 : 0;

    autoScrollTimeoutRef.current = setTimeout(() => {
      if (messagesContainerRef.current && isNearBottom()) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: scrollBehavior,
        });
        setShowScrollButton(false);
      }
    }, delay);

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [messages, isExpanded, isUserScrolling, isNearBottom, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // Count active budget constraints
  const activeBudgetCount = budgetConstraints
    ? Object.values(budgetConstraints).filter((v) => v !== undefined && v > 0).length
    : 0;

  // Get total budget for display
  const totalBudget = budgetConstraints?.totalBudget;

  // Generate markdown conversation export
  const handleDownloadConversation = () => {
    if (messages.length === 0) return;

    let markdown = `# ${destination} - AI Research Conversation\n\n`;
    markdown += `**Destination:** ${destination}\n`;
    markdown += `**Date:** ${new Date().toLocaleDateString()}\n`;

    if (budgetConstraints?.totalBudget) {
      markdown += `**Budget:** $${budgetConstraints.totalBudget}\n`;
    }

    markdown += `\n---\n\n`;
    markdown += `## Conversation\n\n`;

    messages.forEach((msg, index) => {
      if (msg.role === 'user') {
        markdown += `### You\n${msg.content}\n\n`;
      } else {
        markdown += `### AI Assistant\n${msg.content}\n\n`;
      }
    });

    markdown += `\n---\n\n`;
    markdown += `*Exported from Voyagr AI on ${new Date().toLocaleString()}*\n`;

    const filename = `${destination.toLowerCase().replace(/\s+/g, '-')}-research-${new Date().toISOString().split('T')[0]}.md`;
    downloadMarkdown(markdown, filename);
    setShowDownloadMenu(false);
  };

  const handleCopyConversation = async () => {
    if (messages.length === 0) return;

    let markdown = `# ${destination} - AI Research\n\n`;
    messages.forEach((msg) => {
      if (msg.role === 'user') {
        markdown += `**You:** ${msg.content}\n\n`;
      } else {
        markdown += `**AI:** ${msg.content}\n\n`;
      }
    });

    const success = await copyMarkdownToClipboard(markdown);
    if (success) {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
    setShowDownloadMenu(false);
  };

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    setShowScrollButton(false);
    setIsUserScrolling(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'w-full rounded-2xl border border-[#E7E5E4] bg-white overflow-hidden',
        className
      )}
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Chat Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Budget Summary Badge */}
          <button
            onClick={() => setShowBudgetModal(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
              activeBudgetCount > 0
                ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                : "bg-muted border-border hover:bg-muted/80"
            )}
            title="Click to edit budget constraints"
          >
            <DollarSign className={cn(
              "w-4 h-4",
              activeBudgetCount > 0
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              activeBudgetCount > 0
                ? "text-green-700 dark:text-green-300"
                : "text-muted-foreground"
            )}>
              {activeBudgetCount > 0
                ? (totalBudget ? `$${totalBudget}` : `${activeBudgetCount} constraints`)
                : "Set Budget"
              }
            </span>
          </button>

          {/* Map Toggle Button */}
          {onMapToggle && (
            <button
              onClick={onMapToggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              title="Toggle map view"
            >
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Map</span>
            </button>
          )}

          {/* Download Conversation Button */}
          {messages.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                title="Export conversation"
              >
                <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Export</span>
              </button>

              {/* Dropdown Menu */}
              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]"
                  onMouseLeave={() => setShowDownloadMenu(false)}
                >
                  <button
                    onClick={handleDownloadConversation}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <Download className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Download .md</span>
                  </button>
                  <button
                    onClick={handleCopyConversation}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent transition-colors text-left border-t border-border"
                  >
                    {copiedToClipboard ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Copy to clipboard</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Collapse/Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Message Preview Area (Collapsible) - Max 400px when expanded per design spec */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        {messages.length > 0 && (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto p-4 space-y-3 relative"
          >
            {/* Show only last 3-4 messages */}
            <AnimatePresence>
              {messages.slice(-4).map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'flex gap-2 text-sm',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-foreground'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-xl px-3 py-2',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-accent text-foreground rounded-tl-sm'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="text-xs whitespace-pre-wrap break-words">{message.content}</p>
                    ) : (
                      <div className="text-xs prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Tool Progress Indicators */}
            {toolProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                {toolProgress.map((tool) => (
                  <div
                    key={tool.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{getToolLabel(tool.tool)}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-accent rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-foreground/40"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-foreground/40"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-foreground/40"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all text-xs font-medium"
                >
                  <ChevronDown className="w-3 h-3" />
                  New messages
                </motion.button>
              )}
            </AnimatePresence>

            {/* View Full History Button */}
            {messages.length > 4 && (
              <button
                onClick={() => setShowFullHistory(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs font-medium text-muted-foreground w-full justify-center"
              >
                <Maximize2 className="w-3 h-3" />
                View full history ({messages.length} messages)
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && isExpanded && (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Start a conversation about {destination}
            </p>
          </div>
        )}
      </motion.div>

      {/* Chat Input Area (Always Visible) */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask me anything about ${destination}...`}
            className="flex-1 resize-none bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg px-3 py-2 text-sm min-h-[40px] max-h-[150px]"
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm',
              inputValue.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>

      {/* Full History Modal */}
      {showFullHistory && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowFullHistory(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-foreground'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-accent text-foreground rounded-tl-sm'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:my-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowFullHistory(false)}
              className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Budget Constraints Modal */}
      {showBudgetModal && budgetConstraints && onBudgetUpdate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBudgetModal(false)}
        >
          <div
            className="bg-background rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Budget Constraints</h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <BudgetConstraintsSidebar
                budgetConstraints={budgetConstraints}
                onUpdate={(newConstraints) => {
                  onBudgetUpdate(newConstraints);
                  // Auto-close modal after updating
                  // setShowBudgetModal(false);
                }}
                className="border-0 shadow-none"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
