'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import type { AutocompletePrediction } from '@/app/api/places/autocomplete/route';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (prediction: AutocompletePrediction) => void;
  placeholder?: string;
  hasError?: boolean;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter city (e.g., Paris, France or Seattle, WA)',
  hasError = false,
}: LocationAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { predictions, isLoading, clear } = useAutocomplete({
    input: value,
    enabled: isFocused && value.length >= 2,
  });

  const showDropdown = isFocused && (predictions.length > 0 || isLoading);

  // Reset highlighted index when predictions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [predictions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && predictions[highlightedIndex]) {
          handleSelect(predictions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;

      case 'Tab':
        // Allow tab to work normally, but select if highlighted
        if (highlightedIndex >= 0 && predictions[highlightedIndex]) {
          e.preventDefault();
          handleSelect(predictions[highlightedIndex]);
        }
        break;
    }
  };

  const handleSelect = (prediction: AutocompletePrediction) => {
    onChange(prediction.description);
    onSelect(prediction);
    setIsFocused(false);
    setHighlightedIndex(-1);
    clear();
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    clear();
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      setIsFocused(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="font-semibold">{text.substring(index, index + query.length)}</span>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            'w-full rounded-xl border-2 border-border bg-background pl-10 pr-10 py-3',
            'text-sm font-medium text-foreground placeholder:text-muted-foreground',
            'transition-all duration-300',
            'focus:outline-none focus:border-primary focus:shadow-glow',
            value && 'border-primary/50',
            hasError && 'border-destructive/50'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          {value && !isLoading && (
            <button
              onClick={handleClear}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              type="button"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'rounded-xl border-2 border-border bg-background shadow-2xl',
              'max-h-[300px] overflow-y-auto'
            )}
          >
            {isLoading && predictions.length === 0 ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 mx-auto mb-2 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Searching locations...</p>
              </div>
            ) : (
              <ul className="py-2">
                {predictions.map((prediction, index) => (
                  <li key={prediction.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(prediction)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        'w-full px-4 py-3 text-left flex items-start gap-3',
                        'transition-colors duration-150',
                        'hover:bg-accent/50',
                        highlightedIndex === index && 'bg-accent/50'
                      )}
                    >
                      <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {highlightMatch(prediction.main_text, value)}
                        </div>
                        {prediction.secondary_text && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {prediction.secondary_text}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
