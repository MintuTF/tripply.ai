'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Trip } from '@/types';
import { cn } from '@/lib/utils';
import { X, Calendar, Clock, Check } from 'lucide-react';

interface DayAssignmentModalProps {
  card: Card | null;
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (cardId: string, day: number, timeSlot?: string) => void;
}

export function DayAssignmentModal({ card, trip, isOpen, onClose, onAssign }: DayAssignmentModalProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(card?.day || null);
  const [selectedTime, setSelectedTime] = useState<string>(card?.time_slot || '');

  if (!card) return null;

  // Calculate total trip days
  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    return {
      number: i + 1,
      date: dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  // Common time slots
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
  ];

  const handleAssign = () => {
    if (selectedDay) {
      onAssign(card.id, selectedDay, selectedTime || undefined);
      onClose();
    }
  };

  const payload = typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : card.payload_json;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-border bg-card p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Schedule to Itinerary</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Assign <span className="font-semibold text-foreground">{payload.name}</span> to a day
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Day Selection */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold text-foreground">Select Day</label>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {days.map((day) => (
                  <button
                    key={day.number}
                    onClick={() => setSelectedDay(day.number)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all duration-200',
                      selectedDay === day.number
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-muted-foreground">Day</div>
                        <div className="text-lg font-bold text-foreground">{day.number}</div>
                      </div>
                      {selectedDay === day.number && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{day.date}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection (Optional) */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold text-foreground">Time (Optional)</label>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(selectedTime === time ? '' : time)}
                    className={cn(
                      'rounded-lg border-2 px-3 py-2 text-center text-sm font-medium transition-all duration-200',
                      selectedTime === time
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {selectedTime && (
                <button
                  onClick={() => setSelectedTime('')}
                  className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear time
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-border bg-card px-4 py-3 font-semibold text-foreground transition-all duration-200 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDay}
                className={cn(
                  'flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-200',
                  selectedDay
                    ? 'gradient-primary shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {card.day ? 'Update Schedule' : 'Add to Itinerary'}
              </button>
            </div>

            {/* Current Assignment Info */}
            {card.day && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Currently scheduled: Day {card.day}
                {card.time_slot && ` at ${card.time_slot}`}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
