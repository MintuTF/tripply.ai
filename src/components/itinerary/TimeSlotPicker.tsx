'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronLeft, ChevronRight, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (timeSlot: string) => void;
  currentTime?: string;
  title?: string;
  description?: string;
}

// Generate time slots in 30-minute intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      slots.push(`${hourStr}:${minuteStr}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const PERIODS = [
  { label: 'Early Morning', range: '05:00-08:00', start: 5, end: 8 },
  { label: 'Morning', range: '08:00-12:00', start: 8, end: 12 },
  { label: 'Afternoon', range: '12:00-17:00', start: 12, end: 17 },
  { label: 'Evening', range: '17:00-21:00', start: 17, end: 21 },
  { label: 'Night', range: '21:00-05:00', start: 21, end: 24 },
];

export function TimeSlotPicker({
  isOpen,
  onClose,
  onSelect,
  currentTime,
  title = 'Set Time',
  description = 'Choose a time for this activity',
}: TimeSlotPickerProps) {
  const [selectedTime, setSelectedTime] = useState<string>(currentTime || '09:00');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  useEffect(() => {
    if (currentTime) {
      setSelectedTime(currentTime);
    }
  }, [currentTime]);

  const handleSelect = () => {
    onSelect(selectedTime);
    onClose();
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeSlotsByPeriod = (periodIndex: number) => {
    const period = PERIODS[periodIndex];
    return TIME_SLOTS.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      if (period.label === 'Night') {
        return hour >= period.start || hour < 5;
      }
      return hour >= period.start && hour < period.end;
    });
  };

  const filteredSlots = selectedPeriod !== null
    ? getTimeSlotsByPeriod(selectedPeriod)
    : TIME_SLOTS;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Current Selection */}
          <div className="px-6 py-4 bg-primary/5 border-b border-border">
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground tabular-nums">
                  {formatTime12Hour(selectedTime)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Selected Time
                </div>
              </div>
            </div>
          </div>

          {/* Period Filter */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedPeriod(null)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  selectedPeriod === null
                    ? 'bg-primary text-white'
                    : 'bg-accent text-muted-foreground hover:bg-accent/80'
                )}
              >
                All Times
              </button>
              {PERIODS.map((period, index) => (
                <button
                  key={period.label}
                  onClick={() => setSelectedPeriod(index)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    selectedPeriod === index
                      ? 'bg-primary text-white'
                      : 'bg-accent text-muted-foreground hover:bg-accent/80'
                  )}
                >
                  <div className="flex flex-col">
                    <span>{period.label}</span>
                    <span className="text-xs opacity-75">{period.range}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Grid */}
          <div className="px-6 py-4 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {filteredSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    'hover:scale-105 hover:shadow-md',
                    selectedTime === slot
                      ? 'bg-primary text-white shadow-lg ring-2 ring-primary ring-offset-2'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  )}
                >
                  <div className="flex flex-col">
                    <span className="tabular-nums">{formatTime12Hour(slot)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Time Buttons */}
          <div className="px-6 py-3 border-t border-border bg-accent/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Clock className="h-3 w-3" />
              <span>Quick Select:</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['09:00', '12:00', '14:00', '18:00'].map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    selectedTime === time
                      ? 'bg-primary text-white'
                      : 'bg-card text-foreground hover:bg-accent'
                  )}
                >
                  {formatTime12Hour(time)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for inline use
export function TimeSlotPickerInline({
  currentTime,
  onSelect,
  className,
}: {
  currentTime?: string;
  onSelect: (time: string) => void;
  className?: string;
}) {
  const [time, setTime] = useState(currentTime || '09:00');

  const handleHourChange = (delta: number) => {
    const [hour, minute] = time.split(':').map(Number);
    let newHour = (hour + delta + 24) % 24;
    const newTime = `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setTime(newTime);
    onSelect(newTime);
  };

  const handleMinuteChange = (delta: number) => {
    const [hour, minute] = time.split(':').map(Number);
    let newMinute = minute + delta;
    let newHour = hour;

    if (newMinute >= 60) {
      newMinute = 0;
      newHour = (newHour + 1) % 24;
    } else if (newMinute < 0) {
      newMinute = 30;
      newHour = (newHour - 1 + 24) % 24;
    }

    const newTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    setTime(newTime);
    onSelect(newTime);
  };

  const [hour, minute] = time.split(':');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Hour */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => handleHourChange(1)}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <div className="w-12 text-center text-2xl font-bold tabular-nums">
          {hour}
        </div>
        <button
          onClick={() => handleHourChange(-1)}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="text-2xl font-bold">:</div>

      {/* Minute */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => handleMinuteChange(30)}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <div className="w-12 text-center text-2xl font-bold tabular-nums">
          {minute}
        </div>
        <button
          onClick={() => handleMinuteChange(-30)}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default TimeSlotPicker;
