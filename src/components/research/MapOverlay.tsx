'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Locate, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResearch } from './ResearchContext';
import { cn } from '@/lib/utils';

interface MapOverlayProps {
  tripId: string;
  onClose: () => void;
  fullScreen?: boolean;
}

export function MapOverlay({ tripId, onClose, fullScreen }: MapOverlayProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    suggestions,
    shortlistCards,
    confirmedCards,
    selectedPlaceId,
    hoveredPlaceId,
    setSelectedPlace,
    setHoveredPlace,
    openDetailPanel,
  } = useResearch();

  // Combine all places for the map
  const allPlaces = [...suggestions, ...shortlistCards, ...confirmedCards];

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (typeof window === 'undefined') return;

      // Check if Google Maps is already loaded
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      // Wait for Google Maps to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;

      // Default center (will be updated based on places)
      const defaultCenter = { lat: 40.7128, lng: -74.006 }; // NYC

      // Calculate center from places
      let center = defaultCenter;
      if (allPlaces.length > 0 && allPlaces[0].coordinates) {
        center = allPlaces[0].coordinates;
      }

      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
        styles: getMapStyles(),
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMapLoaded(true);
    };

    loadGoogleMaps();
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    allPlaces.forEach((place) => {
      if (!place.coordinates) return;

      const isSelected = place.id === selectedPlaceId;
      const isHovered = place.id === hoveredPlaceId;
      const isSaved = shortlistCards.some((c) => c.id === place.id) ||
        confirmedCards.some((c) => c.id === place.id);

      const marker = new google.maps.Marker({
        position: place.coordinates,
        map: mapRef.current!,
        title: place.name,
        icon: getMarkerIcon(place.type, isSelected || isHovered, isSaved),
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        setSelectedPlace(place.id);
        openDetailPanel(place);
      });

      marker.addListener('mouseover', () => {
        setHoveredPlace(place.id);
      });

      marker.addListener('mouseout', () => {
        setHoveredPlace(null);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (allPlaces.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      allPlaces.forEach((place) => {
        if (place.coordinates) {
          bounds.extend(place.coordinates);
        }
      });
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [allPlaces, selectedPlaceId, hoveredPlaceId, mapLoaded]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 13) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 13) - 1);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapRef.current!.setCenter(pos);
        mapRef.current!.setZoom(15);
      });
    }
  };

  return (
    <motion.div
      initial={{ x: fullScreen ? '100%' : '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: fullScreen ? '100%' : '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'fixed z-50 bg-card shadow-2xl flex flex-col overflow-hidden',
        fullScreen
          ? 'inset-0'
          : 'left-[60px] top-0 bottom-0 w-[500px] border-r border-border/50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/95 backdrop-blur-sm">
        <h2 className="font-semibold">Map View</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 relative">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-card shadow-md hover:bg-accent transition-colors"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-card shadow-md hover:bg-accent transition-colors"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={handleLocate}
            className="p-2 rounded-lg bg-card shadow-md hover:bg-accent transition-colors"
          >
            <Locate className="h-5 w-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-card/95 backdrop-blur-sm shadow-lg z-10">
          <div className="text-xs font-medium mb-2">Legend</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span>Suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getMarkerIcon(type?: string, isActive?: boolean, isSaved?: boolean) {
  const color = isSaved ? '#f59e0b' : isActive ? '#7c3aed' : '#6366f1';
  const scale = isActive ? 1.3 : 1;

  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    scale: 8 * scale,
  };
}

function getMapStyles() {
  return [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ];
}

// Add Google Maps types
declare global {
  interface Window {
    google: typeof google;
  }
}
