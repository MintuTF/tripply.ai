'use client';

import { useState } from 'react';
import { Trip, Card } from '@/types';
import { TripBoard } from '@/components/board/TripBoard';
import { MapView } from '@/components/board/MapView';
import {
  Sparkles,
  LayoutDashboard,
  Map as MapIcon,
  Eye,
  MessageSquare,
  Edit3,
  Calendar,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';

interface SharedTripViewProps {
  trip: Trip;
  cards: Card[];
  role: 'viewer' | 'commenter' | 'editor';
}

const roleConfig = {
  viewer: {
    label: 'Viewing',
    description: 'You can view this trip',
    icon: <Eye className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-50',
  },
  commenter: {
    label: 'Commenting',
    description: 'You can view and comment',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-amber-600 bg-amber-50',
  },
  editor: {
    label: 'Editing',
    description: 'You can view and edit',
    icon: <Edit3 className="h-4 w-4" />,
    color: 'text-green-600 bg-green-50',
  },
};

export function SharedTripView({ trip, cards: initialCards, role }: SharedTripViewProps) {
  const [activeView, setActiveView] = useState<'map' | 'board'>('map');
  const [cards, setCards] = useState(initialCards);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
  const [hoveredCardId, setHoveredCardId] = useState<string | undefined>();

  const roleInfo = roleConfig[role];

  // Format dates
  const formatDateRange = () => {
    if (!trip.dates?.start || !trip.dates?.end) return null;
    try {
      const start = format(new Date(trip.dates.start), 'MMM d');
      const end = format(new Date(trip.dates.end), 'MMM d, yyyy');
      return `${start} - ${end}`;
    } catch {
      return null;
    }
  };

  // Handle card updates (only for editors)
  const handleCardUpdate = async (cardId: string, updates: Partial<Card>) => {
    if (role !== 'editor') return;

    // Optimistic update
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));

    // Save to database
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        // Revert on failure
        setCards(initialCards);
        console.error('Failed to update card');
      }
    } catch (error) {
      // Revert on error
      setCards(initialCards);
      console.error('Error updating card:', error);
    }
  };

  // Handle card deletion (only for editors)
  const handleCardDelete = async (cardId: string) => {
    if (role !== 'editor') return;

    // Optimistic delete
    const previousCards = cards;
    setCards(prev => prev.filter(c => c.id !== cardId));

    // Delete from database
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        setCards(previousCards);
        console.error('Failed to delete card');
      }
    } catch (error) {
      // Revert on error
      setCards(previousCards);
      console.error('Error deleting card:', error);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border/50 glassmorphism shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Tripply
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  {trip.title}
                </p>
              </div>
            </Link>
          </div>

          {/* Trip Info */}
          <div className="hidden md:flex items-center gap-4">
            {trip.destination?.name && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{trip.destination.name}</span>
              </div>
            )}
            {formatDateRange() && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRange()}</span>
              </div>
            )}
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setActiveView('map')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'map'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <MapIcon className="h-4 w-4" />
                Map
              </button>
              <button
                onClick={() => setActiveView('board')}
                className={cn(
                  'flex items-center gap-2 border-l-2 border-border/50 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'board'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Board
              </button>
            </div>

            {/* Role Badge */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                roleInfo.color
              )}
            >
              {roleInfo.icon}
              <span>{roleInfo.label}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'board' ? (
          <TripBoard
            tripId={trip.id}
            trip={trip}
            cards={cards}
            onCardUpdate={role === 'editor' ? (cardId, updates) => handleCardUpdate(cardId, updates) : undefined}
            onCardDelete={role === 'editor' ? (cardId) => handleCardDelete(cardId) : undefined}
          />
        ) : (
          <MapView
            cards={cards}
            selectedCardId={selectedCardId}
            hoveredCardId={hoveredCardId}
            onCardClick={(card) => setSelectedCardId(card.id)}
            onCardHover={setHoveredCardId}
            showSidebar={false}
          />
        )}
      </main>

      {/* Shared Banner */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 px-4 py-2 bg-card/90 backdrop-blur-lg rounded-full shadow-lg border border-border">
          <span className="text-sm text-muted-foreground">
            Shared trip by the owner
          </span>
          <Link
            href="/plan"
            className="text-sm font-medium text-primary hover:underline"
          >
            Create your own trip
          </Link>
        </div>
      </div>
    </div>
  );
}
