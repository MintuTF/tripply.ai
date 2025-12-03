'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Calendar, Users, ChevronDown, ChevronUp, Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationAutocomplete } from '@/components/map/LocationAutocomplete';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { AutocompletePrediction } from '@/app/api/places/autocomplete/route';
import type { Trip } from '@/types';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: CreateTripData) => Promise<void>;
  initialDestination?: string;
  mode?: 'create' | 'edit';
  existingTrip?: Trip;
}

export interface CreateTripData {
  title: string;
  destination?: {
    name: string;
    place_id?: string;
    coordinates?: { lat: number; lng: number };
  };
  dates: {
    start: string;
    end: string;
  };
  party_json?: {
    adults: number;
    children?: number;
    infants?: number;
  };
}

export function CreateTripModal({
  isOpen,
  onClose,
  onCreateTrip,
  initialDestination = '',
  mode = 'create',
  existingTrip,
}: CreateTripModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEditMode = mode === 'edit';

  // Form state
  const [destinationInput, setDestinationInput] = useState(initialDestination);
  const [selectedDestination, setSelectedDestination] = useState<AutocompletePrediction | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [tripTitle, setTripTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; dates?: string }>({});

  const datePickerRef = useRef<HTMLDivElement>(null);

  // Pre-populate form when editing an existing trip
  useEffect(() => {
    if (isOpen && isEditMode && existingTrip) {
      // Set trip title
      setTripTitle(existingTrip.title || '');

      // Set dates
      if (existingTrip.dates?.start && existingTrip.dates?.end) {
        setDateRange({
          from: new Date(existingTrip.dates.start),
          to: new Date(existingTrip.dates.end),
        });
      }

      // Set destination if exists
      if (existingTrip.destination?.name) {
        setDestinationInput(existingTrip.destination.name);
        // Create a prediction-like object for display
        setSelectedDestination({
          place_id: existingTrip.destination.place_id || '',
          description: existingTrip.destination.name,
          main_text: existingTrip.destination.name.split(',')[0],
          secondary_text: existingTrip.destination.name.split(',').slice(1).join(',').trim(),
        });
        setShowMoreOptions(true);
      }

      // Set party size
      if (existingTrip.party_json) {
        setAdults(existingTrip.party_json.adults || 2);
        setChildren(existingTrip.party_json.children || 0);
        setInfants(existingTrip.party_json.infants || 0);
        if (existingTrip.party_json.children || existingTrip.party_json.infants) {
          setShowMoreOptions(true);
        }
      }
    } else if (isOpen && !isEditMode) {
      // Reset form for create mode
      setTripTitle('');
      setDateRange(undefined);
      setDestinationInput(initialDestination);
      setSelectedDestination(null);
      setAdults(2);
      setChildren(0);
      setInfants(0);
      setShowMoreOptions(false);
      setErrors({});
    }
  }, [isOpen, isEditMode, existingTrip, initialDestination]);

  // Auto-fill trip title from destination if empty (only in create mode)
  useEffect(() => {
    if (!isEditMode && selectedDestination && !tripTitle) {
      const cityName = selectedDestination.main_text;
      setTripTitle(`${cityName} Trip`);
    }
  }, [selectedDestination, tripTitle, isEditMode]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleDestinationSelect = (prediction: AutocompletePrediction) => {
    setSelectedDestination(prediction);
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string; dates?: string } = {};

    if (!tripTitle.trim()) {
      newErrors.title = 'Please enter a trip name';
    }

    if (!dateRange?.from || !dateRange?.to) {
      newErrors.dates = 'Please select travel dates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const tripData: CreateTripData = {
        title: tripTitle.trim(),
        dates: {
          start: dateRange!.from!.toISOString(),
          end: dateRange!.to!.toISOString(),
        },
        // Only include destination if selected
        ...(selectedDestination && {
          destination: {
            name: selectedDestination.description,
            place_id: selectedDestination.place_id,
          },
        }),
        // Only include party if not default (2 adults)
        ...((adults !== 2 || children > 0 || infants > 0) && {
          party_json: {
            adults,
            children: children > 0 ? children : undefined,
            infants: infants > 0 ? infants : undefined,
          },
        }),
      };

      await onCreateTrip(tripData);
      onClose();
    } catch (error) {
      console.error('Failed to create trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Select dates';
    if (!dateRange.to) return format(dateRange.from, 'MMM d, yyyy');
    return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  };

  const getPartyText = () => {
    const parts = [];
    if (adults) parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
    if (children) parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
    if (infants) parts.push(`${infants} infant${infants > 1 ? 's' : ''}`);
    return parts.join(', ') || '2 adults';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-lg mx-4 bg-card rounded-2xl shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          'max-h-[90vh] overflow-y-auto'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-accent transition-colors z-10"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="p-6 md:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              {isEditMode ? (
                <Pencil className="h-7 w-7 text-white" />
              ) : (
                <Sparkles className="h-7 w-7 text-white" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">
            {isEditMode ? 'Edit Trip Details' : 'Create Your Trip'}
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            {isEditMode ? 'Update your trip information' : "Let's plan your next adventure"}
          </p>

          {/* Form */}
          <div className="space-y-6">
            {/* Trip Name - Required */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Trip Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={tripTitle}
                onChange={(e) => {
                  setTripTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="My Summer Adventure"
                className={cn(
                  'w-full rounded-xl border-2 bg-background px-4 py-3',
                  'text-sm font-medium text-foreground placeholder:text-muted-foreground',
                  'transition-all duration-300',
                  'focus:outline-none focus:border-primary focus:shadow-glow',
                  errors.title ? 'border-destructive/50' : 'border-border'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Date Range - Required */}
            <div className="relative" ref={datePickerRef}>
              <label className="block text-sm font-medium mb-2">
                When are you traveling? <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl border-2 border-border bg-background px-4 py-3',
                  'text-sm font-medium transition-all duration-300',
                  'hover:border-primary/50 focus:outline-none focus:border-primary focus:shadow-glow',
                  dateRange?.from && 'border-primary/50',
                  errors.dates && 'border-destructive/50'
                )}
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span className={cn(!dateRange?.from && 'text-muted-foreground')}>
                  {formatDateRange()}
                </span>
              </button>
              {errors.dates && (
                <p className="mt-1 text-sm text-destructive">{errors.dates}</p>
              )}

              {/* Date Picker Dropdown */}
              <AnimatePresence>
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-card rounded-xl border-2 border-border shadow-2xl p-4"
                  >
                    <DayPicker
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        setErrors((prev) => ({ ...prev, dates: undefined }));
                        if (range?.from && range?.to) {
                          setShowDatePicker(false);
                        }
                      }}
                      numberOfMonths={1}
                      disabled={{ before: new Date() }}
                      classNames={{
                        months: 'flex flex-col',
                        month: 'space-y-4',
                        month_caption: 'flex justify-center pt-1 relative items-center mb-4',
                        caption_label: 'text-sm font-medium',
                        nav: 'space-x-1 flex items-center',
                        button_previous: cn(
                          'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                          'inline-flex items-center justify-center rounded-md',
                          'hover:bg-accent'
                        ),
                        button_next: cn(
                          'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                          'inline-flex items-center justify-center rounded-md',
                          'hover:bg-accent'
                        ),
                        month_grid: 'w-full border-collapse',
                        weekdays: 'flex',
                        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
                        week: 'flex w-full mt-2',
                        day: 'text-center text-sm p-0 relative h-9 w-9',
                        day_button: cn(
                          'h-9 w-9 p-0 font-normal',
                          'inline-flex items-center justify-center rounded-md',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-primary',
                          'aria-selected:opacity-100'
                        ),
                        selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md',
                        today: 'bg-accent text-accent-foreground rounded-md',
                        outside: 'text-muted-foreground opacity-50',
                        disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
                        range_middle: 'bg-accent text-accent-foreground rounded-none aria-selected:bg-accent aria-selected:text-accent-foreground',
                        range_start: 'bg-primary text-primary-foreground rounded-l-md rounded-r-none',
                        range_end: 'bg-primary text-primary-foreground rounded-r-md rounded-l-none',
                        hidden: 'invisible',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* More Options Toggle */}
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showMoreOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              More options (optional)
            </button>

            {/* Expanded Options */}
            <AnimatePresence>
              {showMoreOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-4"
                >
                  {/* Destination - Optional */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Destination (optional)
                    </label>
                    <LocationAutocomplete
                      value={destinationInput}
                      onChange={setDestinationInput}
                      onSelect={handleDestinationSelect}
                      placeholder="Search for a city or destination..."
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Leave empty if visiting multiple cities
                    </p>
                  </div>

                  {/* Party Size */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Users className="inline h-4 w-4 mr-1" />
                      Number of Travelers
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Adults */}
                      <div className="flex flex-col items-center p-3 rounded-xl border-2 border-border bg-background">
                        <span className="text-xs text-muted-foreground mb-1">Adults</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="h-6 w-6 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-medium">{adults}</span>
                          <button
                            type="button"
                            onClick={() => setAdults(adults + 1)}
                            className="h-6 w-6 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex flex-col items-center p-3 rounded-xl border-2 border-border bg-background">
                        <span className="text-xs text-muted-foreground mb-1">Children</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="h-6 w-6 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-medium">{children}</span>
                          <button
                            type="button"
                            onClick={() => setChildren(children + 1)}
                            className="h-6 w-6 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex flex-col items-center p-3 rounded-xl border-2 border-border bg-background">
                        <span className="text-xs text-muted-foreground mb-1">Infants</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInfants(Math.max(0, infants - 1))}
                            className="h-6 w-6 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-medium">{infants}</span>
                          <button
                            type="button"
                            onClick={() => setInfants(infants + 1)}
                            className="h-6 w-6 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white',
                  'gradient-primary shadow-lg',
                  'hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Save Changes' : 'Create Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
