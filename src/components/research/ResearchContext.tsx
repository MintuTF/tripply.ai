'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { PlaceCard } from '@/types';

interface ResearchContextValue {
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  activeFilters: string[];
  shortlistCards: PlaceCard[];
  confirmedCards: PlaceCard[];
  suggestedHotels: PlaceCard[];
  suggestedRestaurants: PlaceCard[];
  suggestedActivities: PlaceCard[];
  suggestions: PlaceCard[];
  detailPanelCard: PlaceCard | null;
  detailPanelOpen: boolean;
  setSelectedPlace: (id: string | null) => void;
  setHoveredPlace: (id: string | null) => void;
  toggleFilter: (filter: string) => void;
  addToShortlist: (card: PlaceCard) => void;
  confirmCard: (card: PlaceCard) => void;
  removeFromBoard: (cardId: string) => void;
  addSuggestions: (cards: PlaceCard[]) => void;
  openDetailPanel: (card: PlaceCard) => void;
  closeDetailPanel: () => void;
  getAllPlaces: () => PlaceCard[];
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

interface ResearchProviderProps {
  children: ReactNode;
  initialShortlist?: PlaceCard[];
  initialConfirmed?: PlaceCard[];
}

export function ResearchProvider({
  children,
  initialShortlist = [],
  initialConfirmed = [],
}: ResearchProviderProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [shortlistCards, setShortlistCards] = useState<PlaceCard[]>(initialShortlist);
  const [confirmedCards, setConfirmedCards] = useState<PlaceCard[]>(initialConfirmed);
  const [suggestedHotels, setSuggestedHotels] = useState<PlaceCard[]>([]);
  const [suggestedRestaurants, setSuggestedRestaurants] = useState<PlaceCard[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<PlaceCard[]>([]);
  const [detailPanelCard, setDetailPanelCard] = useState<PlaceCard | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  const setSelectedPlace = useCallback((id: string | null) => setSelectedPlaceId(id), []);
  const setHoveredPlace = useCallback((id: string | null) => setHoveredPlaceId(id), []);

  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  }, []);

  const addToShortlist = useCallback((card: PlaceCard) => {
    setShortlistCards((prev) => prev.some((c) => c.id === card.id) ? prev : [...prev, card]);
    setSuggestedHotels((prev) => prev.filter((c) => c.id !== card.id));
    setSuggestedRestaurants((prev) => prev.filter((c) => c.id !== card.id));
    setSuggestedActivities((prev) => prev.filter((c) => c.id !== card.id));
  }, []);

  const confirmCard = useCallback((card: PlaceCard) => {
    setShortlistCards((prev) => prev.filter((c) => c.id !== card.id));
    setConfirmedCards((prev) => prev.some((c) => c.id === card.id) ? prev : [...prev, card]);
  }, []);

  const removeFromBoard = useCallback((cardId: string) => {
    setShortlistCards((prev) => prev.filter((c) => c.id !== cardId));
    setConfirmedCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const addSuggestions = useCallback((cards: PlaceCard[]) => {
    cards.forEach((card) => {
      if (card.type === 'hotel') {
        setSuggestedHotels((prev) => prev.some((c) => c.id === card.id) ? prev : [...prev, card]);
      } else if (card.type === 'restaurant') {
        setSuggestedRestaurants((prev) => prev.some((c) => c.id === card.id) ? prev : [...prev, card]);
      } else {
        setSuggestedActivities((prev) => prev.some((c) => c.id === card.id) ? prev : [...prev, card]);
      }
    });
  }, []);

  const openDetailPanel = useCallback((card: PlaceCard) => {
    setDetailPanelCard(card);
    setDetailPanelOpen(true);
  }, []);

  const closeDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
    setDetailPanelCard(null);
  }, []);

  const getAllPlaces = useCallback(() => {
    const all = [...suggestedHotels, ...suggestedRestaurants, ...suggestedActivities, ...shortlistCards, ...confirmedCards];
    const seen = new Set<string>();
    return all.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }, [suggestedHotels, suggestedRestaurants, suggestedActivities, shortlistCards, confirmedCards]);

  // Combined suggestions for the feed (excludes saved items)
  const suggestions = [...suggestedHotels, ...suggestedRestaurants, ...suggestedActivities];

  return (
    <ResearchContext.Provider value={{
      selectedPlaceId, hoveredPlaceId, activeFilters, shortlistCards, confirmedCards,
      suggestedHotels, suggestedRestaurants, suggestedActivities, suggestions, detailPanelCard, detailPanelOpen,
      setSelectedPlace, setHoveredPlace, toggleFilter, addToShortlist, confirmCard,
      removeFromBoard, addSuggestions, openDetailPanel, closeDetailPanel, getAllPlaces,
    }}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) throw new Error('useResearch must be used within a ResearchProvider');
  return context;
}
