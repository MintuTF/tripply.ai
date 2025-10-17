'use client';

import { Intent } from '@/types';
import { getLayout } from '@/lib/layouts';
import { OverviewLayout } from './OverviewLayout';
import { StaysLayout } from './StaysLayout';
import { ItineraryLayout } from './ItineraryLayout';
import { NearbyLayout } from './NearbyLayout';
import { TransportLayout } from './TransportLayout';
import { BriefingLayout } from './BriefingLayout';
import { GeneralLayout } from './GeneralLayout';

interface LayoutRendererProps {
  intent: Intent;
  confidence?: number;
  data?: any;
  onLayoutChange?: (intent: Intent) => void;
}

/**
 * LayoutRenderer - Dynamically renders the appropriate layout based on detected intent
 * This is the core of Tripply's adaptive UI system
 */
export function LayoutRenderer({
  intent,
  confidence = 1.0,
  data = {},
  onLayoutChange
}: LayoutRendererProps) {
  const layout = getLayout(intent, confidence);

  // Map intent to layout component
  const layoutComponents: Record<Intent, React.ComponentType<any>> = {
    overview: OverviewLayout,
    stays: StaysLayout,
    itinerary: ItineraryLayout,
    nearby: NearbyLayout,
    transport: TransportLayout,
    briefing: BriefingLayout,
    general: GeneralLayout,
  };

  const LayoutComponent = layoutComponents[layout.id as Intent];

  if (!LayoutComponent) {
    console.warn(`No component found for layout: ${layout.id}`);
    return <GeneralLayout data={data} />;
  }

  return (
    <div className="flex-1 overflow-hidden">
      <LayoutComponent
        data={data}
        layout={layout}
        onLayoutChange={onLayoutChange}
      />
    </div>
  );
}
