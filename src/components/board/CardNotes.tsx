'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Hash,
  StickyNote,
  Save,
} from 'lucide-react';

interface CardNotesProps {
  card: Card;
  onCardUpdate?: (card: Card) => void;
}

type BookingStatus = 'none' | 'pending' | 'booked' | 'cancelled';

interface CardNotes {
  booking_status: BookingStatus;
  confirmation_number: string;
  notes: string;
}

const BOOKING_STATUSES: { value: BookingStatus; label: string; icon: typeof CheckCircle2; color: string }[] = [
  { value: 'none', label: 'Not Booked', icon: Clock, color: 'text-muted-foreground' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-500' },
  { value: 'booked', label: 'Booked', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
];

export function CardNotes({ card, onCardUpdate }: CardNotesProps) {
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('none');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing notes from card payload
  useEffect(() => {
    const payload = typeof card.payload_json === 'string'
      ? JSON.parse(card.payload_json)
      : card.payload_json;

    const cardNotes = payload.notes_json as CardNotes | undefined;
    if (cardNotes) {
      setBookingStatus(cardNotes.booking_status || 'none');
      setConfirmationNumber(cardNotes.confirmation_number || '');
      setNotes(cardNotes.notes || '');
    }
  }, [card.id]);

  const handleSave = async () => {
    if (!onCardUpdate) return;

    setIsSaving(true);
    try {
      const payload = typeof card.payload_json === 'string'
        ? JSON.parse(card.payload_json)
        : card.payload_json;

      const updatedPayload = {
        ...payload,
        notes_json: {
          booking_status: bookingStatus,
          confirmation_number: confirmationNumber,
          notes,
        },
      };

      onCardUpdate({
        ...card,
        payload_json: updatedPayload,
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (
    field: 'bookingStatus' | 'confirmationNumber' | 'notes',
    value: string
  ) => {
    setHasChanges(true);
    switch (field) {
      case 'bookingStatus':
        setBookingStatus(value as BookingStatus);
        break;
      case 'confirmationNumber':
        setConfirmationNumber(value);
        break;
      case 'notes':
        setNotes(value);
        break;
    }
  };

  const currentStatus = BOOKING_STATUSES.find((s) => s.value === bookingStatus) || BOOKING_STATUSES[0];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Booking Status */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Booking Status
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {BOOKING_STATUSES.map((status) => {
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => handleFieldChange('bookingStatus', status.value)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all border-2',
                  bookingStatus === status.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
              >
                <Icon className={cn('h-4 w-4', status.color)} />
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Number - only show when booked */}
      {(bookingStatus === 'booked' || bookingStatus === 'pending') && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Confirmation Number
          </h3>
          <input
            type="text"
            value={confirmationNumber}
            onChange={(e) => handleFieldChange('confirmationNumber', e.target.value)}
            placeholder="Enter confirmation number..."
            className="w-full rounded-xl border-2 border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Day Assignment */}
      {card.day && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled For
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{card.day}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Day {card.day}</p>
              {card.time_slot && (
                <p className="text-xs text-muted-foreground">{card.time_slot}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Notes */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Personal Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Add your personal notes, reminders, or special requests..."
          rows={4}
          className="w-full rounded-xl border-2 border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          These notes are only visible to you and your trip collaborators.
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
            'bg-primary text-white hover:bg-primary/90',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      )}

      {/* Quick Tips */}
      <div className="rounded-xl bg-muted/30 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Quick Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>- Save your booking confirmation number for easy reference</li>
          <li>- Add notes about dietary preferences or special requests</li>
          <li>- Note any reservation times or tickets needed</li>
        </ul>
      </div>
    </div>
  );
}
