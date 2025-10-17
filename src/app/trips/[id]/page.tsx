'use client';

import { use, useState } from 'react';
import { TripBoard } from '@/components/board/TripBoard';
import { CompareDrawer } from '@/components/board/CompareDrawer';
import { Card } from '@/types';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Sparkles, LayoutDashboard, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample cards for demo
const SAMPLE_CARDS: Card[] = [
  {
    id: '1',
    trip_id: 'demo',
    type: 'hotel',
    payload_json: {
      name: 'Hotel Luxe Paris',
      address: '123 Champs-Élysées, Paris',
      coordinates: { lat: 48.8698, lng: 2.3078 },
      price_range: [250, 310],
      rating: 4.8,
      amenities: ['Free WiFi', 'Pool', 'Gym', 'Breakfast', 'Spa'],
      photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'],
      url: '',
    },
    labels: ['considering'],
    favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    trip_id: 'demo',
    type: 'hotel',
    data: {
      name: 'Boutique Hotel Marais',
      address: '45 Rue du Marais, Paris',
      rating: 4.6,
      review_count: 156,
      price: 195,
      price_level: 2,
      image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      amenities: ['Free WiFi', 'Breakfast', 'Bar'],
      description: 'Charming boutique hotel in the trendy Marais district.',
    },
    label: 'shortlist',
    is_favorited: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    trip_id: 'demo',
    type: 'spot',
    data: {
      name: 'Eiffel Tower',
      address: 'Champ de Mars, Paris',
      rating: 4.9,
      review_count: 15420,
      price_level: 2,
      image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&h=300&fit=crop',
      description: "Paris's iconic iron lattice tower on the Champ de Mars.",
    },
    label: 'shortlist',
    is_favorited: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    trip_id: 'demo',
    type: 'hotel',
    data: {
      name: 'Budget Hostel Central',
      address: '78 Rue Montmartre, Paris',
      rating: 4.2,
      review_count: 89,
      price: 45,
      price_level: 1,
      image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
      amenities: ['Free WiFi', 'Shared Kitchen'],
      description: 'Clean and affordable hostel near the city center.',
    },
    label: 'dismissed',
    is_favorited: false,
    created_at: new Date().toISOString(),
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [cards, setCards] = useState<Card[]>(SAMPLE_CARDS);
  const [compareCards, setCompareCards] = useState<Card[]>([]);
  const [activeView, setActiveView] = useState<'board' | 'chat'>('board');

  const handleCardUpdate = (updatedCard: Card) => {
    setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleCardDelete = (cardId: string) => {
    setCards(cards.filter((c) => c.id !== cardId));
  };

  const handleCompare = (selectedCards: Card[]) => {
    setCompareCards(selectedCards);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border/50 glassmorphism shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">Voyagr</h1>
              <p className="text-sm text-muted-foreground font-medium">Paris Trip 2025</p>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setActiveView('board')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'board'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Board
              </button>
              <button
                onClick={() => setActiveView('chat')}
                className={cn(
                  'flex items-center gap-2 border-l-2 border-border/50 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'chat'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
            </div>

            {/* Compare Button */}
            {cards.filter((c) => c.is_favorited).length > 1 && (
              <button
                onClick={() =>
                  handleCompare(cards.filter((c) => c.is_favorited))
                }
                className="rounded-xl gradient-secondary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                Compare Favorites ({cards.filter((c) => c.is_favorited).length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'board' ? (
          <TripBoard
            tripId={resolvedParams.id}
            cards={cards}
            onCardUpdate={handleCardUpdate}
            onCardDelete={handleCardDelete}
          />
        ) : (
          <ChatInterface tripId={resolvedParams.id} />
        )}
      </main>

      {/* Compare Drawer */}
      {compareCards.length > 0 && (
        <CompareDrawer
          cards={compareCards}
          onClose={() => setCompareCards([])}
          onRemoveCard={(cardId) =>
            setCompareCards(compareCards.filter((c) => c.id !== cardId))
          }
        />
      )}
    </div>
  );
}
