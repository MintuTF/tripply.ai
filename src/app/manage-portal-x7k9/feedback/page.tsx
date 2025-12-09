'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Feedback, FeedbackStatus } from '@/types';
import {
  Search,
  Filter,
  MessageSquare,
  Bug,
  Lightbulb,
  Calendar,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: FeedbackStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
  { value: 'dismissed', label: 'Dismissed', color: 'bg-gray-100 text-gray-700' },
];

const CATEGORY_ICONS = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
};

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    const supabase = createClient();
    const { data, error, count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Feedback fetched:', data?.length, 'items, total count:', count);
      setFeedbacks(data || []);
    }
    setLoading(false);
  }

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      !searchQuery ||
      feedback.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || feedback.status === filterStatus;
    const matchesCategory = !filterCategory || feedback.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  async function handleStatusChange(id: string, status: FeedbackStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      setFeedbacks(
        feedbacks.map((f) => (f.id === id ? { ...f, status } : f))
      );
      if (selectedFeedback?.id === id) {
        setSelectedFeedback({ ...selectedFeedback, status });
      }
    }
  }

  async function handleNotesUpdate(id: string, notes: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('feedback')
      .update({ admin_notes: notes })
      .eq('id', id);

    if (error) {
      console.error('Error updating notes:', error);
    } else {
      setFeedbacks(
        feedbacks.map((f) => (f.id === id ? { ...f, admin_notes: notes } : f))
      );
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const newCount = feedbacks.filter((f) => f.status === 'new').length;

  return (
    <div className="flex h-full">
      {/* Main List */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
          <p className="text-muted-foreground">
            {feedbacks.length} total{newCount > 0 && ` • ${newCount} new`}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Categories</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => {
            const Icon = CATEGORY_ICONS[feedback.category];
            const statusOption = STATUS_OPTIONS.find(
              (s) => s.value === feedback.status
            );

            return (
              <div
                key={feedback.id}
                onClick={() => setSelectedFeedback(feedback)}
                className={cn(
                  'cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50',
                  selectedFeedback?.id === feedback.id && 'border-primary'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'rounded-lg p-2',
                      feedback.category === 'bug'
                        ? 'bg-red-100'
                        : feedback.category === 'feature'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        feedback.category === 'bug'
                          ? 'text-red-600'
                          : feedback.category === 'feature'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          statusOption?.color
                        )}
                      >
                        {statusOption?.label}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {feedback.category}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {feedback.message}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{feedback.user_email || 'Anonymous'}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                      {feedback.page_url && (
                        <a
                          href={feedback.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Page
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFeedbacks.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No feedback found
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedFeedback && (
        <FeedbackDetail
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onStatusChange={handleStatusChange}
          onNotesUpdate={handleNotesUpdate}
        />
      )}
    </div>
  );
}

function FeedbackDetail({
  feedback,
  onClose,
  onStatusChange,
  onNotesUpdate,
}: {
  feedback: Feedback;
  onClose: () => void;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
  onNotesUpdate: (id: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState(feedback.admin_notes || '');
  const Icon = CATEGORY_ICONS[feedback.category];

  return (
    <div className="w-96 border-l border-border bg-card p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-foreground">Feedback Details</h2>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Category */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              feedback.category === 'bug'
                ? 'bg-red-100'
                : feedback.category === 'feature'
                ? 'bg-blue-100'
                : 'bg-gray-100'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                feedback.category === 'bug'
                  ? 'text-red-600'
                  : feedback.category === 'feature'
                  ? 'text-blue-600'
                  : 'text-gray-600'
              )}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium text-foreground capitalize">
              {feedback.category}
            </p>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(feedback.id, opt.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  feedback.status === opt.value
                    ? opt.color
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Message</p>
          <p className="text-foreground whitespace-pre-wrap">{feedback.message}</p>
        </div>

        {/* User */}
        <div>
          <p className="mb-1 text-sm text-muted-foreground">From</p>
          <p className="text-foreground">
            {feedback.user_email || 'Anonymous user'}
          </p>
        </div>

        {/* Page URL */}
        {feedback.page_url && (
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Page</p>
            <a
              href={feedback.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              {feedback.page_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Date */}
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Submitted</p>
          <p className="text-foreground">
            {new Date(feedback.created_at).toLocaleString()}
          </p>
        </div>

        {/* Admin Notes */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Admin Notes</p>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== feedback.admin_notes) {
                onNotesUpdate(feedback.id, notes);
              }
            }}
            placeholder="Add notes about this feedback..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
