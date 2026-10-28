'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import Map, { Marker, Source, Layer, Popup, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RoadRoute } from '@/lib/travel/routeTools';
import { dayColor, type Layout, type PlanStop } from './model';

// Free vector map, no API key needed (same style the rest of the app uses)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

interface ItineraryMapProps {
  stops: Record<string, PlanStop>;
  layout: Layout;
  days: number[];
  focusDay: number | 'all';
  selectedId: string | null;
  hoverId: string | null;
  roads: Record<number, RoadRoute | null | undefined>;
  onSelect: (id: string | null) => void;
  renderPopup: (stop: PlanStop) => ReactNode;
}

export function ItineraryMap({ stops, layout, days, focusDay, selectedId, hoverId, roads, onSelect, renderPopup }: ItineraryMapProps) {
  const mapRef = useRef<MapRef>(null);
  const loadedRef = useRef(false);

  // Pins to show: every located stop, with its position inside its day
  const pins = useMemo(() => {
    const out: { stop: PlanStop; day: number; n: number }[] = [];
    Object.keys(layout)
      .map(Number)
      .forEach((day) => {
        (layout[day] || []).forEach((id, i) => {
          const stop = stops[id];
          if (stop?.coords) out.push({ stop, day, n: i + 1 });
        });
      });
    return out;
  }, [layout, stops]);

  const visiblePins = useMemo(
    () => pins.filter((p) => focusDay === 'all' || p.day === focusDay || p.stop.id === selectedId),
    [pins, focusDay, selectedId]
  );

  // Re-frame the map when the set of pins or the focused day changes (not on every reorder)
  const fitKey = `${focusDay}|${pins
    .filter((p) => focusDay === 'all' || p.day === focusDay)
    .map((p) => p.stop.id)
    .sort()
    .join(',')}`;
  useEffect(() => {
    const fit = () => {
      const map = mapRef.current;
      const targets = pins.filter((p) => focusDay === 'all' || p.day === focusDay);
      if (!map || targets.length === 0) return;
      const lngs = targets.map((p) => p.stop.coords!.lng);
      const lats = targets.map((p) => p.stop.coords!.lat);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      try {
        if (targets.length === 1) map.flyTo({ center: [lngs[0], lats[0]], zoom: 14, duration: 600 });
        else map.fitBounds(bounds, { padding: { top: 70, bottom: 70, left: 70, right: 70 }, maxZoom: 15, duration: 600 });
      } catch {
        // map not ready yet; onLoad runs this again
      }
    };
    if (loadedRef.current) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Fly to the selected pin
  useEffect(() => {
    const stop = selectedId ? stops[selectedId] : null;
    if (stop?.coords && mapRef.current) {
      const map = mapRef.current;
      const z = Math.max(map.getZoom(), 13);
      // offset pushes the pin below the middle so the popup above it is not cut off by the top edge
      map.easeTo({ center: [stop.coords.lng, stop.coords.lat], zoom: z, duration: 450, offset: [0, 120] });
    }
  }, [selectedId, stops]);

  const lineFor = (day: number): [number, number][] => {
    const road = roads[day];
    if (road?.line?.length) return road.line.map((c) => [c.lng, c.lat]);
    return (layout[day] || []).map((id) => stops[id]?.coords).filter(Boolean).map((c) => [c!.lng, c!.lat]);
  };

  const selected = selectedId ? stops[selectedId] : null;

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
      style={{ width: '100%', height: '100%' }}
      onLoad={() => {
        loadedRef.current = true;
        const targets = pins;
        if (targets.length) {
          const lngs = targets.map((p) => p.stop.coords!.lng);
          const lats = targets.map((p) => p.stop.coords!.lat);
          mapRef.current?.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 70, maxZoom: 15, duration: 0 }
          );
        }
      }}
      onClick={() => onSelect(null)}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {/* Route per day: white casing + bold coloured line, following streets once the route arrives */}
      {days
        .filter((d) => d > 0 && (layout[d] || []).length > 1)
        .map((d) => {
          const dim = focusDay !== 'all' && focusDay !== d;
          const data = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: lineFor(d) } };
          return (
            <Source key={`route-${d}`} id={`route-${d}`} type="geojson" data={data}>
              <Layer
                id={`route-${d}-casing`}
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{ 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': dim ? 0.25 : 0.95 }}
              />
              <Layer
                id={`route-${d}-line`}
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{ 'line-color': dayColor(d), 'line-width': 6, 'line-opacity': dim ? 0.25 : 1 }}
              />
            </Source>
          );
        })}

      {visiblePins.map(({ stop, day, n }) => {
        const isSelected = stop.id === selectedId;
        const isHover = stop.id === hoverId;
        const dim = focusDay !== 'all' && focusDay !== day && !isSelected;
        const color = dayColor(day);
        return (
          <Marker
            key={stop.id}
            longitude={stop.coords!.lng}
            latitude={stop.coords!.lat}
            anchor="center"
            style={{ zIndex: isSelected ? 30 : isHover ? 20 : 10 }}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(stop.id);
            }}
          >
            <button
              type="button"
              aria-label={`${day > 0 ? `Day ${day}, stop ${n}: ` : 'Not scheduled: '}${stop.name}`}
              className="flex items-center justify-center rounded-full border-[3px] border-white font-bold text-white shadow-lg transition-transform duration-150"
              style={{
                background: color,
                width: day > 0 ? 32 : 22,
                height: day > 0 ? 32 : 22,
                fontSize: 14,
                opacity: dim ? 0.4 : 1,
                transform: isSelected ? 'scale(1.3)' : isHover ? 'scale(1.18)' : 'scale(1)',
                boxShadow: isSelected ? `0 0 0 4px ${color}55, 0 6px 14px rgba(15,23,42,.35)` : undefined,
              }}
            >
              {day > 0 ? n : ''}
            </button>
          </Marker>
        );
      })}

      {selected?.coords && (
        <Popup
          longitude={selected.coords.lng}
          latitude={selected.coords.lat}
          anchor="bottom"
          offset={26}
          closeButton={false}
          closeOnClick={false}
          maxWidth="300px"
          className="itinerary-popup"
        >
          {renderPopup(selected)}
        </Popup>
      )}
    </Map>
  );
}
